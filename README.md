# PM Headless Admin Dashboard

A headless admin dashboard platform that connects to any API or data source and automatically detects the structure and type of data it receives. It generates intelligent visualizations and operational interfaces using a large library of widgets, enabling users to monitor, analyze, and interact with diverse systems from a single control surface.

## Features

### API & Data Source Connectivity
- Connect to any REST API endpoint
- Support for multiple authentication methods:
  - None (public APIs)
  - API Key (header or query parameter)
  - Basic Authentication
  - Bearer Token
  - OAuth 2.0
  - Custom Headers
- Health check monitoring with configurable intervals
- Rate limiting configuration
- Encrypted credential storage (AES-256-GCM)

### Automatic Schema Detection
- **Type Inference**: Automatically detects 16+ field types with confidence scores
  - Basic: `string`, `number`, `integer`, `boolean`
  - Semantic: `email`, `url`, `uuid`, `date`, `datetime`, `time`
  - Complex: `array`, `object`, `enum`, `json`, `reference`
- **Pattern Recognition**: Regex-based detection for emails, URLs, UUIDs, dates
- **Enum Detection**: Identifies categorical fields with limited unique values
- **Pagination Detection**: Supports offset, page, and cursor-based pagination
- **Relationship Detection**: Infers foreign keys from field naming conventions
- **Validation Inference**: Detects required fields, uniqueness, min/max constraints

### Intelligent Visualizations
The platform automatically suggests appropriate widgets based on detected schema:

| Widget Type | Best For | Auto-Detection Trigger |
|-------------|----------|------------------------|
| **Data Table** | Structured records | 3+ columns, uniform data |
| **Stats Cards** | Numeric summaries | Multiple numeric fields |
| **KPI Cards** | Key metrics with trends | Mixed data with numerics |
| **Line Chart** | Time series | Date + numeric fields |
| **Bar Chart** | Comparisons | Categorical + numeric fields |
| **Pie Chart** | Distribution | Enum fields (< 10 values) |
| **Cards** | Visual items | Data with image fields |
| **Timeline** | Events/History | Date + event/title fields |
| **Progress Bars** | Comparative values | Multiple small numeric values |
| **Gauge** | Single percentage | Score/completion fields |
| **Kanban Board** | Status tracking | Status/state enum field |
| **Map View** | Location data | Latitude + longitude fields |

### Smart Value Formatting
- **Currency**: Auto-detects price/cost/amount → `$1,234.56`
- **Percentages**: Color-coded with +/- indicators
- **Large Numbers**: Compact format → `1.2M`, `450K`
- **Dates**: Relative time (`2h ago`) or formatted
- **URLs**: Clickable links with external icon
- **Emails**: Mailto links
- **Booleans**: Checkmark/X badges
- **Status Values**: Colored badges (`active`, `pending`, `error`, etc.)

### Full CRUD Operations
- Auto-generate forms from detected schemas
- Field type to input type mapping
- Validation rules from schema constraints
- Reference field support (foreign key dropdowns)
- Bulk operations support

### Enterprise Security
- **Authentication**: NextAuth.js with credentials provider
- **Authorization**: Role-Based Access Control (RBAC)
  - Granular permissions (create, read, update, delete, execute, manage)
  - Resource-based access control
  - Conditional permissions with operators
- **Audit Logging**: Comprehensive activity tracking
- **Encryption**: AES-256-GCM for sensitive data
- **Session Management**: JWT tokens with configurable expiration

### Extensible Architecture
- Plugin system with manifest support
- Custom widget support
- Hook system for customization
- Modular service architecture

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Encryption**: Node.js crypto (AES-256-GCM)

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Authentication pages (login, register)
│   ├── (dashboard)/         # Protected dashboard pages
│   ├── (default)/           # Public pages
│   └── api/
│       ├── auth/            # Auth endpoints
│       ├── data-sources/    # Data source CRUD & testing
│       ├── schemas/         # Schema detection & management
│       ├── dashboard/       # Dashboard configuration
│       └── brand/           # Branding settings
├── components/
│   ├── auth/                # Auth components (LoginForm, AuthGuard)
│   ├── data-sources/        # DataSourceForm, DataSourceList
│   └── ui/                  # UI components (Navbar, WidgetCard)
├── core/
│   ├── data-sources/        # Connectors (REST, etc.)
│   ├── schema-detection/    # Schema detection service
│   │   ├── analyzers/       # Type, Pattern, Enum, Validation analyzers
│   │   ├── detectors/       # PK, Pagination, Relationship detectors
│   │   ├── suggesters/      # Widget suggestion engine
│   │   └── utils/           # Patterns, sampling, confidence
│   └── services/            # RBAC, Audit logging
├── lib/
│   ├── auth.ts              # NextAuth configuration
│   ├── db.ts                # Prisma client
│   └── encryption.ts        # AES-256-GCM encryption
└── types/
    ├── auth.ts              # Authentication types
    ├── data-source.ts       # Data source types
    ├── schema.ts            # Schema detection types
    ├── widget.ts            # Widget configuration types
    ├── crud.ts              # CRUD operation types
    └── plugin.ts            # Plugin system types
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/pm-tech-hq/pm-headless-admin-dashboard.git
cd pm-headless-admin-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Create a `.env` file:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="your-32-byte-encryption-key"
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

### Default Credentials

After setting up, you can register a new account or use demo credentials if seeded.

## API Reference

### Schema Detection

```http
POST /api/schemas/detect
```

**Request Body:**
```json
{
  "dataSourceId": "ds_123",
  "sampleData": [...],
  "detectRelationships": true,
  "detectPagination": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "schema": {
      "id": "schema_...",
      "name": "DetectedSchema",
      "fields": [
        {
          "name": "id",
          "type": "integer",
          "confidence": 0.95,
          "isPrimaryKey": true,
          "isRequired": true
        }
      ]
    },
    "paginationAnalysis": {
      "detected": true,
      "type": "offset",
      "config": { "dataPath": "data", "totalPath": "total" }
    },
    "widgetSuggestions": [
      {
        "widgetId": "data-table",
        "confidence": 0.85,
        "reason": "Schema has 5 fields suitable for tabular display"
      }
    ]
  }
}
```

### Data Sources

```http
GET    /api/data-sources          # List all data sources
POST   /api/data-sources          # Create data source
GET    /api/data-sources/:id      # Get single data source
PUT    /api/data-sources/:id      # Update data source
DELETE /api/data-sources/:id      # Delete data source
POST   /api/data-sources/test     # Test connection
POST   /api/data-sources/:id/test # Test existing connection
```

### Schemas

```http
GET    /api/schemas               # List schemas
POST   /api/schemas               # Save detected schema
GET    /api/schemas/:id           # Get schema with relationships
PUT    /api/schemas/:id           # Update schema
DELETE /api/schemas/:id           # Delete schema
POST   /api/schemas/detect        # Detect schema from data
```

## Widget Types

### Data Display
- `auto` - Automatic detection
- `stats` - Numeric statistics cards
- `kpi` - Key performance indicators with trends
- `list` - List view with avatars
- `table` - Tabular data with sorting
- `cards` - Visual card grid
- `timeline` - Chronological events
- `progress` - Progress bar comparisons
- `gauge` - Semi-circular meter
- `text` - Text content
- `raw` - Raw JSON display

### Domain-Specific
- `weather` - Weather data display
- `stocks` - Stock prices with changes
- `exchangeRates` - Currency rates
- `movies` - Movie listings
- `books` - Book catalog
- `aiModels` - AI model listings
- `news` - News articles
- `sports` - Sports data
- `gaming` - Gaming content

### Interactive
- `editable` - Editable text area

## Database Schema

Key models in Prisma:

- **User** - User accounts with password hashing
- **Session** - User sessions
- **Role** / **Permission** - RBAC system
- **DataSource** - API connections with encrypted auth
- **DataSourceEndpoint** - Individual endpoints with pagination config
- **Schema** - Detected schemas with fields (JSON)
- **SchemaRelationship** - Foreign key relationships
- **Widget** - Dashboard widgets with data mapping
- **Dashboard** / **MenuItem** - Dashboard structure
- **CrudConfig** - CRUD operation settings
- **AuditLog** - Activity tracking
- **Plugin** - Plugin manifests

## Security Considerations

- All API credentials are encrypted at rest using AES-256-GCM
- Passwords are hashed using bcrypt
- Session tokens use JWT with configurable expiration
- RBAC enforces granular access control
- Audit logging tracks all significant actions
- Supports on-premises deployment for sensitive environments

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support, please contact the PM Tech HQ team or open an issue in the repository.
