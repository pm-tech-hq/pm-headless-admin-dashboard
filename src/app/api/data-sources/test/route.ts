// Test New Connection API Route
// Tests connectivity to a data source before saving

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DataSourceManager } from '@/core/data-sources/DataSourceManager';
import { DataSourceFormData } from '@/types/data-source';

/**
 * POST /api/data-sources/test
 * Test connection with provided configuration (without saving)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: DataSourceFormData = await request.json();

    // Validate required fields
    if (!body.baseUrl && !body.host) {
      return NextResponse.json(
        { error: 'Base URL or host is required' },
        { status: 400 }
      );
    }

    // Test connection without encryption (credentials are in plain text)
    const result = await DataSourceManager.testConnection({
      baseUrl: body.baseUrl || `http://${body.host}:${body.port || 80}`,
      auth: body.auth,
      healthCheckEndpoint: body.healthCheckEndpoint,
      type: body.type,
    } as Parameters<typeof DataSourceManager.testConnection>[0]);

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
      { status: 200 } // Return 200 with error in body
    );
  }
}
