// Individual Data Source API Route
// Handles GET, PUT, DELETE for a specific data source

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/encryption';
import { audit } from '@/core/security/AuditLogger';
import { DataSourceFormData, AuthConfig } from '@/types/data-source';
import { DataSourceManager } from '@/core/data-sources/DataSourceManager';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/data-sources/[id]
 * Get a specific data source
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataSource = await prisma.dataSource.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        endpoints: true,
        schemas: {
          select: { id: true, name: true, crudEnabled: true },
        },
        _count: {
          select: { widgets: true },
        },
      },
    });

    if (!dataSource) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    // Parse and mask auth config (don't expose secrets)
    const authConfig = JSON.parse(dataSource.authConfig) as AuthConfig;
    const maskedAuth = maskAuthConfig(authConfig);

    return NextResponse.json({
      success: true,
      data: {
        ...dataSource,
        authConfig: undefined,
        auth: maskedAuth,
      },
    });
  } catch (error) {
    console.error('Error fetching data source:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data source' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/data-sources/[id]
 * Update a data source
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: DataSourceFormData = await request.json();

    // Check if data source exists
    const existing = await prisma.dataSource.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    // Encrypt sensitive auth fields
    const encryptedAuth = encryptAuthConfig(body.auth);

    // Update data source
    const dataSource = await prisma.dataSource.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        type: body.type,
        baseUrl: body.baseUrl,
        host: body.host,
        port: body.port,
        database: body.database,
        authConfig: JSON.stringify(encryptedAuth),
        healthCheckEndpoint: body.healthCheckEndpoint,
        healthCheckInterval: body.healthCheckInterval,
      },
    });

    // Clear cached connector
    DataSourceManager.removeConnector(id);

    // Audit log
    await audit.update(session.user.id, 'data_source', dataSource.id, {
      name: body.name,
      type: body.type,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: dataSource.id,
        name: dataSource.name,
        type: dataSource.type,
        baseUrl: dataSource.baseUrl,
        updatedAt: dataSource.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating data source:', error);
    return NextResponse.json(
      { error: 'Failed to update data source' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/data-sources/[id]
 * Delete a data source
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if data source exists
    const existing = await prisma.dataSource.findUnique({
      where: { id },
      include: {
        _count: {
          select: { widgets: true, schemas: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    // Warn if data source has associated resources
    if (existing._count.widgets > 0 || existing._count.schemas > 0) {
      const force = request.nextUrl.searchParams.get('force') === 'true';
      if (!force) {
        return NextResponse.json(
          {
            error: 'Data source has associated widgets or schemas',
            details: {
              widgets: existing._count.widgets,
              schemas: existing._count.schemas,
            },
            message: 'Add ?force=true to delete anyway',
          },
          { status: 400 }
        );
      }
    }

    // Delete data source (cascades to endpoints, schemas, widgets)
    await prisma.dataSource.delete({
      where: { id },
    });

    // Clear cached connector
    DataSourceManager.removeConnector(id);

    // Audit log
    await audit.delete(session.user.id, 'data_source', id, {
      name: existing.name,
    });

    return NextResponse.json({
      success: true,
      message: 'Data source deleted',
    });
  } catch (error) {
    console.error('Error deleting data source:', error);
    return NextResponse.json(
      { error: 'Failed to delete data source' },
      { status: 500 }
    );
  }
}

/**
 * Encrypt sensitive fields in auth config
 */
function encryptAuthConfig(auth: AuthConfig): AuthConfig {
  const encrypted = { ...auth };

  if (auth.apiKey) {
    encrypted.apiKey = encrypt(auth.apiKey);
  }
  if (auth.password) {
    encrypted.password = encrypt(auth.password);
  }
  if (auth.token) {
    encrypted.token = encrypt(auth.token);
  }
  if (auth.clientSecret) {
    encrypted.clientSecret = encrypt(auth.clientSecret);
  }

  return encrypted;
}

/**
 * Mask sensitive fields in auth config for display
 */
function maskAuthConfig(auth: AuthConfig): AuthConfig {
  const masked = { ...auth };

  // Mask sensitive values
  if (auth.apiKey) {
    masked.apiKey = maskValue(auth.apiKey);
  }
  if (auth.password) {
    masked.password = '********';
  }
  if (auth.token) {
    masked.token = maskValue(auth.token);
  }
  if (auth.clientSecret) {
    masked.clientSecret = maskValue(auth.clientSecret);
  }

  return masked;
}

/**
 * Mask a value, showing only first and last 4 characters
 */
function maskValue(value: string): string {
  try {
    // Try to decrypt first
    const decrypted = decrypt(value);
    if (decrypted.length <= 8) {
      return '****';
    }
    return `${decrypted.slice(0, 4)}****${decrypted.slice(-4)}`;
  } catch {
    // If not encrypted, mask directly
    if (value.length <= 8) {
      return '****';
    }
    return `${value.slice(0, 4)}****${value.slice(-4)}`;
  }
}
