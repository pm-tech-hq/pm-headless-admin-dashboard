import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse, ERROR_CODES } from '@/types/api';
import { Schema } from '@/types/schema';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/schemas/[id]
 * Get a single schema by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const schema = await prisma.schema.findUnique({
      where: { id },
      include: {
        dataSource: {
          select: {
            id: true,
            name: true,
            type: true,
            baseUrl: true,
          },
        },
        endpoint: {
          select: {
            id: true,
            name: true,
            path: true,
            method: true,
          },
        },
        sourceRelations: {
          include: {
            targetSchema: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        targetRelations: {
          include: {
            sourceSchema: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        widgets: {
          select: {
            id: true,
            title: true,
            definitionId: true,
          },
        },
        crudConfigs: {
          select: {
            id: true,
            enableCreate: true,
            enableRead: true,
            enableUpdate: true,
            enableDelete: true,
          },
        },
      },
    });

    if (!schema) {
      return NextResponse.json(
        errorResponse(ERROR_CODES.NOT_FOUND, 'Schema not found'),
        { status: 404 }
      );
    }

    // Transform relationships
    const relationships = [
      ...schema.sourceRelations.map((r) => ({
        id: r.id,
        name: r.name,
        sourceSchemaId: r.sourceSchemaId,
        sourceField: r.sourceField,
        targetSchemaId: r.targetSchemaId,
        targetField: r.targetField,
        type: r.type as 'one-to-one' | 'one-to-many' | 'many-to-many',
        targetSchema: r.targetSchema,
      })),
      ...schema.targetRelations.map((r) => ({
        id: r.id,
        name: r.name,
        sourceSchemaId: r.sourceSchemaId,
        sourceField: r.sourceField,
        targetSchemaId: r.targetSchemaId,
        targetField: r.targetField,
        type: r.type as 'one-to-one' | 'one-to-many' | 'many-to-many',
        sourceSchema: r.sourceSchema,
      })),
    ];

    // Transform response
    const response = {
      id: schema.id,
      name: schema.name,
      description: schema.description,
      dataSourceId: schema.dataSourceId,
      dataSource: schema.dataSource,
      endpointId: schema.endpointId,
      endpoint: schema.endpoint,
      fields: JSON.parse(schema.fields),
      detectedAt: schema.detectedAt,
      sampleSize: schema.sampleSize,
      autoDetected: schema.autoDetected,
      relationships,
      crudEnabled: schema.crudEnabled,
      crudEndpoints: schema.crudEndpoints
        ? JSON.parse(schema.crudEndpoints)
        : null,
      crudConfigs: schema.crudConfigs,
      widgets: schema.widgets,
      createdAt: schema.createdAt,
      updatedAt: schema.updatedAt,
    };

    return NextResponse.json(successResponse(response));
  } catch (error) {
    console.error('Error getting schema:', error);
    return NextResponse.json(
      errorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to get schema'
      ),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/schemas/[id]
 * Update a schema
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      fields,
      crudEnabled,
      crudEndpoints,
    } = body;

    // Check if schema exists
    const existing = await prisma.schema.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        errorResponse(ERROR_CODES.NOT_FOUND, 'Schema not found'),
        { status: 404 }
      );
    }

    // Check for duplicate name if changing name
    if (name && name !== existing.name) {
      const duplicate = await prisma.schema.findFirst({
        where: {
          dataSourceId: existing.dataSourceId,
          name,
          NOT: { id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          errorResponse(
            ERROR_CODES.ALREADY_EXISTS,
            `Schema with name '${name}' already exists for this data source`
          ),
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (fields !== undefined) updateData.fields = JSON.stringify(fields);
    if (crudEnabled !== undefined) updateData.crudEnabled = crudEnabled;
    if (crudEndpoints !== undefined) {
      updateData.crudEndpoints = crudEndpoints
        ? JSON.stringify(crudEndpoints)
        : null;
    }

    // Update schema
    const schema = await prisma.schema.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(successResponse(response));
  } catch (error) {
    console.error('Error updating schema:', error);
    return NextResponse.json(
      errorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to update schema'
      ),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/schemas/[id]
 * Delete a schema
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if schema exists
    const existing = await prisma.schema.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            widgets: true,
            crudConfigs: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        errorResponse(ERROR_CODES.NOT_FOUND, 'Schema not found'),
        { status: 404 }
      );
    }

    // Warn if schema has dependencies
    const dependencies = [];
    if (existing._count.widgets > 0) {
      dependencies.push(`${existing._count.widgets} widget(s)`);
    }
    if (existing._count.crudConfigs > 0) {
      dependencies.push(`${existing._count.crudConfigs} CRUD config(s)`);
    }

    // Delete related relationships first
    await prisma.schemaRelationship.deleteMany({
      where: {
        OR: [{ sourceSchemaId: id }, { targetSchemaId: id }],
      },
    });

    // Delete schema (cascade will handle dependent records if configured)
    await prisma.schema.delete({
      where: { id },
    });

    return NextResponse.json(
      successResponse({
        id,
        deleted: true,
        dependencies: dependencies.length > 0 ? dependencies : undefined,
      })
    );
  } catch (error) {
    console.error('Error deleting schema:', error);
    return NextResponse.json(
      errorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to delete schema'
      ),
      { status: 500 }
    );
  }
}
