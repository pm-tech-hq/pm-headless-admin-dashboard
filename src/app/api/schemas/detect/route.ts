import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  SchemaDetectionService,
  isSchemaDetectionError,
} from '@/core/schema-detection';
import { successResponse, errorResponse, ERROR_CODES } from '@/types/api';
import { Schema } from '@/types/schema';

const schemaService = new SchemaDetectionService();

/**
 * POST /api/schemas/detect
 * Detect schema from sample data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dataSourceId,
      endpointId,
      sampleData,
      detectRelationships = false,
      detectPagination = true,
    } = body;

    // Validate required fields
    if (!dataSourceId) {
      return NextResponse.json(
        errorResponse(
          ERROR_CODES.MISSING_REQUIRED_FIELD,
          'dataSourceId is required'
        ),
        { status: 400 }
      );
    }

    if (!sampleData) {
      return NextResponse.json(
        errorResponse(
          ERROR_CODES.MISSING_REQUIRED_FIELD,
          'sampleData is required'
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

    // Get existing schemas for relationship detection
    let existingSchemas: Schema[] = [];
    if (detectRelationships) {
      const dbSchemas = await prisma.schema.findMany({
        where: { dataSourceId },
      });

      existingSchemas = dbSchemas.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description || undefined,
        dataSourceId: s.dataSourceId,
        endpointId: s.endpointId || undefined,
        fields: JSON.parse(s.fields),
        detectedAt: s.detectedAt,
        sampleSize: s.sampleSize,
        autoDetected: s.autoDetected,
        relationships: [],
        crudEnabled: s.crudEnabled,
        crudEndpoints: s.crudEndpoints ? JSON.parse(s.crudEndpoints) : undefined,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
    }

    // Detect schema
    const result = await schemaService.detectSchema({
      dataSourceId,
      endpointId,
      sampleData,
      existingSchemas,
      detectRelationships,
      detectPagination,
    });

    return NextResponse.json(successResponse(result));
  } catch (error) {
    console.error('Schema detection error:', error);

    if (isSchemaDetectionError(error)) {
      return NextResponse.json(
        errorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          error.message,
          { code: error.code, details: error.details }
        ),
        { status: 400 }
      );
    }

    return NextResponse.json(
      errorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Schema detection failed'
      ),
      { status: 500 }
    );
  }
}
