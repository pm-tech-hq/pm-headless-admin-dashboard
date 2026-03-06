// Test Connection API Route
// Tests connectivity to a data source

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { DataSourceManager } from '@/core/data-sources/DataSourceManager';
import { AuthConfig, DataSource } from '@/types/data-source';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/data-sources/[id]/test
 * Test connection to an existing data source
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get data source from database
    const dbDataSource = await prisma.dataSource.findUnique({
      where: { id },
    });

    if (!dbDataSource) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    // Parse and decrypt auth config
    const authConfig = JSON.parse(dbDataSource.authConfig) as AuthConfig;
    const decryptedAuth = decryptAuthConfig(authConfig);

    // Build data source object
    const dataSource: DataSource = {
      id: dbDataSource.id,
      name: dbDataSource.name,
      description: dbDataSource.description || undefined,
      type: dbDataSource.type as DataSource['type'],
      baseUrl: dbDataSource.baseUrl || undefined,
      host: dbDataSource.host || undefined,
      port: dbDataSource.port || undefined,
      database: dbDataSource.database || undefined,
      auth: decryptedAuth,
      healthCheckEndpoint: dbDataSource.healthCheckEndpoint || undefined,
      healthCheckInterval: dbDataSource.healthCheckInterval || undefined,
      healthStatus: dbDataSource.healthStatus as DataSource['healthStatus'],
      createdAt: dbDataSource.createdAt,
      updatedAt: dbDataSource.updatedAt,
      createdById: dbDataSource.createdById,
      credentialsEncrypted: false, // Already decrypted
    };

    // Test connection
    const result = await DataSourceManager.testConnection(dataSource);

    // Update health status in database
    await prisma.dataSource.update({
      where: { id },
      data: {
        healthStatus: result.success ? 'healthy' : 'unhealthy',
        lastHealthCheck: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error testing connection:', error);
    return NextResponse.json(
      {
        success: false,
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 200 } // Return 200 with error in body for connection failures
    );
  }
}

/**
 * Decrypt sensitive fields in auth config
 */
function decryptAuthConfig(auth: AuthConfig): AuthConfig {
  const decrypted = { ...auth };

  try {
    if (auth.apiKey) {
      decrypted.apiKey = decrypt(auth.apiKey);
    }
    if (auth.password) {
      decrypted.password = decrypt(auth.password);
    }
    if (auth.token) {
      decrypted.token = decrypt(auth.token);
    }
    if (auth.clientSecret) {
      decrypted.clientSecret = decrypt(auth.clientSecret);
    }
  } catch {
    // If decryption fails, return original
    return auth;
  }

  return decrypted;
}
