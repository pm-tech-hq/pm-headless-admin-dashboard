// Data Sources API Route
// Handles CRUD operations for data sources

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/encryption';
import { audit } from '@/core/security/AuditLogger';
import { DataSourceFormData, AuthConfig } from '@/types/data-source';

/**
 * GET /api/data-sources
 * List all data sources for the current user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataSources = await prisma.dataSource.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        baseUrl: true,
        healthStatus: true,
        lastHealthCheck: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            schemas: true,
            widgets: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: dataSources,
    });
  } catch (error) {
    console.error('Error fetching data sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data sources' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/data-sources
 * Create a new data source
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: DataSourceFormData = await request.json();

    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    // Encrypt sensitive auth fields
    const encryptedAuth = encryptAuthConfig(body.auth);

    // Create data source
    const dataSource = await prisma.dataSource.create({
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
        createdById: session.user.id,
      },
    });

    // Audit log
    await audit.create(session.user.id, 'data_source', dataSource.id, {
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
        healthStatus: dataSource.healthStatus,
        createdAt: dataSource.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating data source:', error);
    return NextResponse.json(
      { error: 'Failed to create data source' },
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
