// Widget suggestion based on detected schema

import { Schema, SchemaField, FieldType } from '@/types/schema';
import { WidgetSuggestion, WidgetConfig } from '@/types/widget';

/**
 * Suggested widget configuration - extends WidgetConfig with additional suggestion fields
 */
type SuggestedWidgetConfig = Partial<WidgetConfig> & Record<string, unknown>;

/**
 * Widget rule definition for matching schemas
 */
interface WidgetRule {
  id: string;
  name: string;
  /** Required field types - at least one must be present */
  requiredTypes: FieldType[];
  /** Optional field types that boost score */
  optionalTypes: FieldType[];
  /** Minimum number of fields needed */
  minFields: number;
  /** Maximum fields (optional) */
  maxFields?: number;
  /** Score multiplier for this widget type */
  scoreMultiplier: number;
  /** Custom matching function (optional) */
  customMatch?: (fields: SchemaField[]) => boolean;
  /** Generate widget config */
  configGenerator: (fields: SchemaField[], schema: Schema) => SuggestedWidgetConfig;
  /** Generate reason string */
  reasonGenerator: (fields: SchemaField[], schema: Schema) => string;
}

/**
 * Widget suggester that recommends appropriate widgets based on schema structure
 */
export class WidgetSuggester {
  private rules: WidgetRule[];

  constructor() {
    this.rules = this.createRules();
  }

  /**
   * Generate widget suggestions for a schema
   */
  suggest(schema: Schema): WidgetSuggestion[] {
    const suggestions: WidgetSuggestion[] = [];
    const fields = schema.fields;

    for (const rule of this.rules) {
      const score = this.scoreRule(rule, fields);

      if (score > 0) {
        const matchingFields = this.getMatchingFields(rule, fields);
        suggestions.push({
          widgetId: rule.id,
          widgetName: rule.name,
          confidence: Math.min(score, 0.95),
          reason: rule.reasonGenerator(matchingFields, schema),
          suggestedConfig: rule.configGenerator(matchingFields, schema),
        });
      }
    }

    // Sort by confidence descending
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Score how well a rule matches the schema fields
   */
  private scoreRule(rule: WidgetRule, fields: SchemaField[]): number {
    // Check minimum fields
    if (fields.length < rule.minFields) {
      return 0;
    }

    // Check maximum fields
    if (rule.maxFields && fields.length > rule.maxFields) {
      return 0;
    }

    // Check custom match function
    if (rule.customMatch && !rule.customMatch(fields)) {
      return 0;
    }

    const fieldTypes = new Set(fields.map((f) => f.type));

    // Check required types - at least one must be present
    if (rule.requiredTypes.length > 0) {
      const hasRequired = rule.requiredTypes.some((t) => fieldTypes.has(t));
      if (!hasRequired) {
        return 0;
      }
    }

    // Calculate base score
    let score = 0.5;

    // Bonus for matching required types
    const matchedRequired = rule.requiredTypes.filter((t) => fieldTypes.has(t));
    score += (matchedRequired.length / Math.max(rule.requiredTypes.length, 1)) * 0.2;

    // Bonus for matching optional types
    const matchedOptional = rule.optionalTypes.filter((t) => fieldTypes.has(t));
    score += (matchedOptional.length / Math.max(rule.optionalTypes.length, 1)) * 0.2;

    // Apply field count factor
    const fieldCountFactor = Math.min(1, fields.length / 5);
    score += fieldCountFactor * 0.1;

    return score * rule.scoreMultiplier;
  }

  /**
   * Get fields that match the rule's type requirements
   */
  private getMatchingFields(rule: WidgetRule, fields: SchemaField[]): SchemaField[] {
    const allTypes = [...rule.requiredTypes, ...rule.optionalTypes];
    if (allTypes.length === 0) {
      return fields;
    }
    return fields.filter((f) => allTypes.includes(f.type));
  }

  /**
   * Create the widget matching rules
   */
  private createRules(): WidgetRule[] {
    return [
      // Data Table - works for almost any schema
      {
        id: 'data-table',
        name: 'Data Table',
        requiredTypes: [],
        optionalTypes: [
          'string',
          'number',
          'integer',
          'boolean',
          'date',
          'datetime',
          'email',
          'url',
          'enum',
        ],
        minFields: 2,
        scoreMultiplier: 1.0,
        configGenerator: (fields, schema) => ({
          columns: fields.slice(0, 10).map((f) => ({
            field: f.name,
            header: f.displayName || this.toTitleCase(f.name),
            sortable: true,
            filterable: ['string', 'enum', 'date', 'datetime'].includes(f.type),
          })),
          pageSize: 10,
          enableSearch: true,
          enableExport: true,
        }),
        reasonGenerator: (fields, schema) =>
          `${schema.name} has ${fields.length} fields suitable for tabular display`,
      },

      // Line Chart - needs date/time and numeric data
      {
        id: 'line-chart',
        name: 'Line Chart',
        requiredTypes: ['date', 'datetime'],
        optionalTypes: ['number', 'integer'],
        minFields: 2,
        scoreMultiplier: 1.2,
        customMatch: (fields) =>
          fields.some((f) => ['date', 'datetime'].includes(f.type)) &&
          fields.some((f) => ['number', 'integer'].includes(f.type)),
        configGenerator: (fields) => {
          const dateField = fields.find((f) =>
            ['date', 'datetime'].includes(f.type)
          );
          const numericFields = fields.filter((f) =>
            ['number', 'integer'].includes(f.type)
          );
          return {
            chartType: 'line',
            xAxis: {
              field: dateField?.name || '',
              label: dateField?.displayName || 'Date',
            },
            series: numericFields.slice(0, 3).map((f) => ({
              field: f.name,
              name: f.displayName || this.toTitleCase(f.name),
            })),
          };
        },
        reasonGenerator: () =>
          'Schema contains date and numeric fields suitable for time series visualization',
      },

      // Bar Chart - categorical + numeric
      {
        id: 'bar-chart',
        name: 'Bar Chart',
        requiredTypes: ['enum', 'string'],
        optionalTypes: ['number', 'integer'],
        minFields: 2,
        scoreMultiplier: 1.1,
        customMatch: (fields) =>
          fields.some((f) => ['enum', 'string'].includes(f.type)) &&
          fields.some((f) => ['number', 'integer'].includes(f.type)),
        configGenerator: (fields) => {
          const categoryField =
            fields.find((f) => f.type === 'enum') ||
            fields.find((f) => f.type === 'string');
          const numericField = fields.find((f) =>
            ['number', 'integer'].includes(f.type)
          );
          return {
            chartType: 'bar',
            xAxis: { field: categoryField?.name || '' },
            series: [{ field: numericField?.name || '' }],
          };
        },
        reasonGenerator: () =>
          'Schema has categorical and numeric fields suitable for bar chart comparison',
      },

      // Pie Chart - enum fields with limited values
      {
        id: 'pie-chart',
        name: 'Pie Chart',
        requiredTypes: ['enum'],
        optionalTypes: ['number', 'integer'],
        minFields: 1,
        maxFields: 15,
        scoreMultiplier: 1.1,
        customMatch: (fields) => {
          const enumField = fields.find((f) => f.type === 'enum');
          return !!enumField && (enumField.enumValues?.length || 0) <= 10;
        },
        configGenerator: (fields) => {
          const enumField = fields.find((f) => f.type === 'enum');
          const numericField = fields.find((f) =>
            ['number', 'integer'].includes(f.type)
          );
          return {
            chartType: 'pie',
            labelField: enumField?.name || '',
            valueField: numericField?.name,
          };
        },
        reasonGenerator: (fields) => {
          const enumField = fields.find((f) => f.type === 'enum');
          const count = enumField?.enumValues?.length || 0;
          return `Enum field '${enumField?.name}' with ${count} values is ideal for pie chart`;
        },
      },

      // Stats Card - numeric summary
      {
        id: 'stats-card',
        name: 'Stats Card',
        requiredTypes: ['number', 'integer'],
        optionalTypes: ['date', 'datetime'],
        minFields: 1,
        maxFields: 6,
        scoreMultiplier: 0.9,
        configGenerator: (fields) => {
          const numericField = fields.find((f) =>
            ['number', 'integer'].includes(f.type)
          );
          return {
            valueField: numericField?.name,
            aggregation: 'sum',
          };
        },
        reasonGenerator: (fields) => {
          const numericCount = fields.filter((f) =>
            ['number', 'integer'].includes(f.type)
          ).length;
          return `${numericCount} numeric field(s) suitable for summary statistics`;
        },
      },

      // Kanban Board - needs status/enum field
      {
        id: 'kanban-board',
        name: 'Kanban Board',
        requiredTypes: ['enum'],
        optionalTypes: ['string', 'date', 'datetime'],
        minFields: 2,
        scoreMultiplier: 1.0,
        customMatch: (fields) => {
          // Look for status-like enum field
          const statusField = fields.find(
            (f) =>
              f.type === 'enum' &&
              (f.name.toLowerCase().includes('status') ||
                f.name.toLowerCase().includes('state') ||
                f.name.toLowerCase().includes('stage'))
          );
          return !!statusField;
        },
        configGenerator: (fields) => {
          const statusField =
            fields.find(
              (f) =>
                f.type === 'enum' &&
                (f.name.toLowerCase().includes('status') ||
                  f.name.toLowerCase().includes('state'))
            ) || fields.find((f) => f.type === 'enum');

          const titleField =
            fields.find(
              (f) =>
                f.type === 'string' &&
                (f.name.toLowerCase().includes('title') ||
                  f.name.toLowerCase().includes('name') ||
                  f.name.toLowerCase().includes('subject'))
            ) || fields.find((f) => f.type === 'string');

          return {
            groupByField: statusField?.name,
            titleField: titleField?.name,
            kanbanColumns: statusField?.enumValues?.map((v) => ({
              id: v,
              title: this.toTitleCase(v),
            })),
          };
        },
        reasonGenerator: (fields) => {
          const statusField = fields.find(
            (f) =>
              f.type === 'enum' &&
              (f.name.toLowerCase().includes('status') ||
                f.name.toLowerCase().includes('state'))
          );
          return `Status field '${statusField?.name || 'enum'}' enables Kanban board grouping`;
        },
      },

      // Map - needs location data
      {
        id: 'map-view',
        name: 'Map View',
        requiredTypes: ['number'],
        optionalTypes: ['string'],
        minFields: 2,
        scoreMultiplier: 1.3,
        customMatch: (fields) => {
          // Look for lat/lng fields
          const hasLat = fields.some((f) =>
            ['lat', 'latitude', 'geo_lat'].includes(f.name.toLowerCase())
          );
          const hasLng = fields.some((f) =>
            ['lng', 'lon', 'longitude', 'geo_lng', 'geo_lon'].includes(
              f.name.toLowerCase()
            )
          );
          return hasLat && hasLng;
        },
        configGenerator: (fields) => {
          const latField = fields.find((f) =>
            ['lat', 'latitude', 'geo_lat'].includes(f.name.toLowerCase())
          );
          const lngField = fields.find((f) =>
            ['lng', 'lon', 'longitude', 'geo_lng', 'geo_lon'].includes(
              f.name.toLowerCase()
            )
          );
          const labelField = fields.find(
            (f) =>
              f.type === 'string' &&
              (f.name.toLowerCase().includes('name') ||
                f.name.toLowerCase().includes('title'))
          );
          return {
            latitudeField: latField?.name,
            longitudeField: lngField?.name,
            labelField: labelField?.name,
          };
        },
        reasonGenerator: () =>
          'Schema contains latitude and longitude fields for map visualization',
      },

      // Timeline - needs date and description
      {
        id: 'timeline',
        name: 'Timeline',
        requiredTypes: ['date', 'datetime'],
        optionalTypes: ['string'],
        minFields: 2,
        scoreMultiplier: 1.0,
        customMatch: (fields) =>
          fields.some((f) => ['date', 'datetime'].includes(f.type)) &&
          fields.some((f) => f.type === 'string'),
        configGenerator: (fields) => {
          const dateField = fields.find((f) =>
            ['date', 'datetime'].includes(f.type)
          );
          const titleField = fields.find(
            (f) =>
              f.type === 'string' &&
              (f.name.toLowerCase().includes('title') ||
                f.name.toLowerCase().includes('name') ||
                f.name.toLowerCase().includes('event'))
          );
          const descField = fields.find(
            (f) =>
              f.type === 'string' &&
              (f.name.toLowerCase().includes('description') ||
                f.name.toLowerCase().includes('content') ||
                f.name.toLowerCase().includes('body'))
          );
          return {
            dateField: dateField?.name,
            titleField: titleField?.name || descField?.name,
            descriptionField: descField?.name,
          };
        },
        reasonGenerator: () =>
          'Schema has date and text fields suitable for timeline display',
      },

      // Detail View - single record display
      {
        id: 'detail-view',
        name: 'Detail View',
        requiredTypes: [],
        optionalTypes: [
          'string',
          'number',
          'integer',
          'boolean',
          'date',
          'datetime',
          'email',
          'url',
          'json',
          'object',
        ],
        minFields: 3,
        scoreMultiplier: 0.8,
        configGenerator: (fields, schema) => ({
          title: schema.name,
          sections: [
            {
              title: 'Details',
              fields: fields.map((f) => ({
                field: f.name,
                label: f.displayName || this.toTitleCase(f.name),
              })),
            },
          ],
        }),
        reasonGenerator: (fields, schema) =>
          `${schema.name} can be displayed as a detailed record view`,
      },
    ];
  }

  /**
   * Convert field name to title case
   */
  private toTitleCase(str: string): string {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }

  /**
   * Get suggestion for a specific widget type
   */
  suggestForWidgetType(
    widgetId: string,
    schema: Schema
  ): WidgetSuggestion | null {
    const rule = this.rules.find((r) => r.id === widgetId);
    if (!rule) {
      return null;
    }

    const score = this.scoreRule(rule, schema.fields);
    if (score <= 0) {
      return null;
    }

    const matchingFields = this.getMatchingFields(rule, schema.fields);
    return {
      widgetId: rule.id,
      widgetName: rule.name,
      confidence: Math.min(score, 0.95),
      reason: rule.reasonGenerator(matchingFields, schema),
      suggestedConfig: rule.configGenerator(matchingFields, schema),
    };
  }

  /**
   * Get available widget types
   */
  getAvailableWidgetTypes(): Array<{ id: string; name: string }> {
    return this.rules.map((r) => ({ id: r.id, name: r.name }));
  }
}
