import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  ERROR_CODES,
} from '@/types/api';
import { Schema } from '@/types/schema';

/**
 * GET /api/schemas
 * List schemas with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataSourceId = searchParams.get('dataSourceId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const search = searchParams.get('search');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (dataSourceId) {
      where.dataSourceId = dataSourceId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Get total count
    const total = await prisma.schema.count({ where });

    // Get schemas with pagination
    const schemas = await prisma.schema.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        dataSource: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: {
            widgets: true,
            crudConfigs: true,
          },
        },
      },
    });

    // Transform to API response
    const data = schemas.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      dataSourceId: s.dataSourceId,
      dataSource: s.dataSource,
      endpointId: s.endpointId,
      fieldCount: JSON.parse(s.fields).length,
      detectedAt: s.detectedAt,
      sampleSize: s.sampleSize,
      autoDetected: s.autoDetected,
      crudEnabled: s.crudEnabled,
      widgetCount: s._count.widgets,
      crudConfigCount: s._count.crudConfigs,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return NextResponse.json(paginatedResponse(data, page, pageSize, total));
  } catch (error) {
    console.error('Error listing schemas:', error);
    return NextResponse.json(
      errorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to list schemas'
      ),
      { status: 500 }
    );
  }
}

/**
 * POST /api/schemas
 * Create/save a detected schema
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      dataSourceId,
      endpointId,
      fields,
      sampleSize = 0,
      autoDetected = true,
      crudEnabled = false,
      crudEndpoints,
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        errorResponse(ERROR_CODES.MISSING_REQUIRED_FIELD, 'name is required'),
        { status: 400 }
      );
    }

    if (!dataSourceId) {
      return NextResponse.json(
        errorResponse(
          ERROR_CODES.MISSING_REQUIRED_FIELD,
          'dataSourceId is required'
        ),
        { status: 400 }
      );
    }

    if (!fields || !Array.isArray(fields)) {
      return NextResponse.json(
        errorResponse(
          ERROR_CODES.MISSING_REQUIRED_FIELD,
          'fields array is required'
        ),
        { status: 400 }
      );
    }

    // Verify data source exists
    const dataSource = await prisma.dataSource.findUnique({
      where: { id: dataSourceId },
    });

    if (!dataSource) {
      return NextResponse.json(
        errorResponse(ERROR_CODES.NOT_FOUND, 'Data source not found'),
        { status: 404 }
      );
    }

    // Check for duplicate name within data source
    const existing = await prisma.schema.findFirst({
      where: {
        dataSourceId,
        name,
      },
    });

    if (existing) {
      return NextResponse.json(
        errorResponse(
          ERROR_CODES.ALREADY_EXISTS,
          `Schema with name '${name}' already exists for this data source`
        ),
        { status: 409 }
      );
    }

    // Create schema
    const schema = await prisma.schema.create({
      data: {
        name,
        description,
        dataSourceId,
        endpointId,
        fields: JSON.stringify(fields),
        sampleSize,
        autoDetected,
        crudEnabled,
        crudEndpoints: crudEndpoints ? JSON.stringify(crudEndpoints) : null,
      },
    });

    // Transform response
    const response: Schema = {
      id: schema.id,
      name: schema.name,
      description: schema.description || undefined,
      dataSourceId: schema.dataSourceId,
      endpointId: schema.endpointId || undefined,
      fields: JSON.parse(schema.fields),
      detectedAt: schema.detectedAt,
      sampleSize: schema.sampleSize,
      autoDetected: schema.autoDetected,
      relationships: [],
      crudEnabled: schema.crudEnabled,
      crudEndpoints: schema.crudEndpoints
        ? JSON.parse(schema.crudEndpoints)
        : undefined,
      createdAt: schema.createdAt,
      updatedAt: schema.updatedAt,
    };

    return NextResponse.json(successResponse(response), { status: 201 });
  } catch (error) {
    console.error('Error creating schema:', error);
    return NextResponse.json(
      errorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to create schema'
      ),
      { status: 500 }
    );
  }
}
