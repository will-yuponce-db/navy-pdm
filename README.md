# Navy Predictive Maintenance (PdM) System

A comprehensive predictive maintenance system for Navy gas turbine engines, built with React/TypeScript frontend and Flask/SQLite backend.

## Features

- **Work Order Management**: Create, update, and track maintenance work orders
- **Parts Inventory**: Manage parts inventory with stock level monitoring
- **Real-time Notifications**: Get alerts for critical issues and low stock
- **Analytics Dashboard**: View maintenance KPIs and fleet readiness
- **User Authentication**: Role-based access control
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

### Frontend (React/TypeScript)
- **Framework**: React with TypeScript
- **State Management**: Redux Toolkit
- **UI Components**: Custom components with Material-UI styling
- **Routing**: React Router
- **Build Tool**: Vite

### Backend (Flask/SQLite)
- **Framework**: Flask with Python
- **Database**: SQLite
- **Authentication**: JWT tokens
- **API**: RESTful endpoints
- **CORS**: Enabled for frontend integration

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- pip3
- Databricks workspace access

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Databricks SQL Configuration (Service Principal Authentication)
DATABRICKS_CLIENT_ID=your_service_principal_client_id
DATABRICKS_CLIENT_SECRET=your_service_principal_client_secret
DATABRICKS_SERVER_HOSTNAME=your_databricks_workspace_hostname
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your_warehouse_id

# Example:
# DATABRICKS_CLIENT_ID=abc123def456
# DATABRICKS_CLIENT_SECRET=xyz789uvw012
# DATABRICKS_SERVER_HOSTNAME=e2-demo-field-eng.cloud.databricks.com
# DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/8baced1ff014912d
```

**Note**: The service principal credentials are automatically provided by Databricks when you create an app. The `DATABRICKS_CLIENT_ID` and `DATABRICKS_CLIENT_SECRET` environment variables are automatically set in your Databricks app environment.

## Configuration

### API Endpoints Configuration

All API endpoints and table names are centrally configured in `/app/config/api.config.ts`. This allows you to easily customize endpoints without modifying code throughout the application.

#### Configuring API Base URL

The API base URL is automatically determined based on your environment:

```typescript
// In api.config.ts
export const API_CONFIG = {
  baseUrl: window.location.origin + "/api",  // Production
  // OR
  baseUrl: "http://localhost:8000/api",      // Development
}
```

To override, set the `VITE_API_URL` environment variable:
```bash
VITE_API_URL=https://your-api.com/api
```

#### Customizing API Endpoints

Edit `app/config/api.config.ts` to modify endpoint paths:

```typescript
export const API_ENDPOINTS = {
  workOrders: {
    base: "/work-orders",           // Change to "/api/v2/work-orders"
    byId: (id) => `/work-orders/${id}`,
  },
  parts: {
    base: "/parts",                 // Change to "/inventory/parts"
  },
  // ... etc
}
```

### Databricks Configuration

#### Table Names and Schema

Configure Databricks catalog, schema, and table names via environment variables or by editing `app/config/api.config.ts`:

**Environment Variables:**
```bash
# Catalog and Schema
DATABRICKS_CATALOG=public_sector
DATABRICKS_SCHEMA=predictive_maintenance_navy_test

# Table Names
DATABRICKS_TABLE_AI_WORK_ORDERS=ai_work_orders
DATABRICKS_TABLE_CURRENT_STATUS=current_status_predictions
DATABRICKS_TABLE_SENSOR_BRONZE=sensor_bronze
DATABRICKS_TABLE_AI_PART_ORDERS=ai_part_orders
DATABRICKS_TABLE_PARTS_SILVER=parts_silver
DATABRICKS_TABLE_SHIP_STATUS=ship_current_status_gold
```

**Or edit directly in `api.config.ts`:**
```typescript
export const DATABRICKS_CONFIG = {
  catalog: "your_catalog_name",
  schema: "your_schema_name",
  tables: {
    aiWorkOrders: "your_ai_work_orders_table",
    partsSilver: "your_parts_table",
    // ... etc
  }
}
```

#### Available Table Configurations

| Configuration Key | Default Value | Description |
|------------------|---------------|-------------|
| `aiWorkOrders` | `ai_work_orders` | AI-generated work orders |
| `currentStatusPredictions` | `current_status_predictions` | Ship status predictions |
| `sensorBronze` | `sensor_bronze` | Raw sensor data |
| `aiPartOrders` | `ai_part_orders` | Parts requisition orders |
| `partsSilver` | `parts_silver` | Parts inventory |
| `shipCurrentStatusGold` | `ship_current_status_gold` | Ship operational status |

#### Connection Configuration

Adjust Databricks connection settings in `api.config.ts`:

```typescript
export const DATABRICKS_CONFIG = {
  connection: {
    maxRetries: 3,              // Number of retry attempts
    retryDelay: 1000,           // Delay between retries (ms)
    timeout: 30000,             // Request timeout (ms)
    healthCheckInterval: 60000, // Health check frequency (ms)
    tokenRefreshBuffer: 300000, // Token refresh buffer (ms)
  }
}
```

### Complete Environment Variables Reference

```bash
# ===================================
# Databricks Connection (Required)
# ===================================
DATABRICKS_CLIENT_ID=your_service_principal_client_id
DATABRICKS_CLIENT_SECRET=your_service_principal_client_secret
DATABRICKS_SERVER_HOSTNAME=your_databricks_workspace_hostname
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your_warehouse_id

# ===================================
# Databricks Catalog & Schema (Optional)
# ===================================
DATABRICKS_CATALOG=public_sector
DATABRICKS_SCHEMA=predictive_maintenance_navy_test

# ===================================
# Databricks Table Names (Optional)
# ===================================
DATABRICKS_TABLE_AI_WORK_ORDERS=ai_work_orders
DATABRICKS_TABLE_CURRENT_STATUS=current_status_predictions
DATABRICKS_TABLE_SENSOR_BRONZE=sensor_bronze
DATABRICKS_TABLE_AI_PART_ORDERS=ai_part_orders
DATABRICKS_TABLE_PARTS_SILVER=parts_silver
DATABRICKS_TABLE_SHIP_STATUS=ship_current_status_gold

# ===================================
# API Configuration (Optional)
# ===================================
VITE_API_URL=http://localhost:8000/api
NODE_ENV=development  # or 'production'

# ===================================
# Backend Configuration (Optional)
# ===================================
SECRET_KEY=your_flask_secret_key
DATABASE_URL=sqlite:///navy_pdm.db
```

### Testing Your Configuration

After configuring, test your setup:

```bash
# Test Databricks connection
curl http://localhost:8000/api/databricks/health

# Test API endpoints
curl http://localhost:8000/api/work-orders
curl http://localhost:8000/api/parts

# View current configuration (from browser console)
import { DATABRICKS_TABLES, API_ENDPOINTS } from './app/config/api.config';
console.log(DATABRICKS_TABLES);
console.log(API_ENDPOINTS);
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip3 install -r requirements.txt
```

3. Seed the database with initial data:
```bash
python3 seed_data.py
```

4. Start the Flask server:
```bash
python3 run.py
```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the project root:
```bash
cd navy-pdm
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Default Users

The system comes with two default users:

1. **Admin User**
   - Email: `admin@navy.mil`
   - Password: `admin123`
   - Role: `admin`
   - Full system access

2. **Maintenance Manager**
   - Email: `maint.manager@navy.mil`
   - Password: `maint123`
   - Role: `maintenance_manager`
   - Limited access to work orders, parts, and analytics

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/change-password` - Change password

### Work Orders
- `GET /api/work-orders` - Get all work orders (with pagination and filters)
- `GET /api/work-orders/<id>` - Get specific work order
- `POST /api/work-orders` - Create new work order
- `PATCH /api/work-orders/<id>` - Update work order
- `DELETE /api/work-orders/<id>` - Delete work order
- `PATCH /api/work-orders/bulk` - Bulk update work orders

### Parts
- `GET /api/parts` - Get all parts (with pagination and filters)
- `GET /api/parts/<id>` - Get specific part
- `POST /api/parts` - Create new part
- `PATCH /api/parts/<id>` - Update part
- `DELETE /api/parts/<id>` - Delete part
- `PATCH /api/parts/<id>/stock` - Update stock level

### Analytics
- `GET /api/analytics/maintenance-kpis` - Get maintenance KPIs
- `GET /api/analytics/performance` - Get performance metrics
- `GET /api/analytics/fleet-readiness` - Get fleet readiness data
- `GET /api/analytics/predictive-insights` - Get predictive insights

### Health Check
- `GET /api/health` - Server health check

## Database Schema

The SQLite database contains the following tables:

- **user**: User accounts and authentication
- **work_order**: Work order records
- **part**: Parts inventory
- **notification**: System notifications

## Development

### Backend Development
- The Flask server runs in debug mode by default
- Database changes require running the seed script again
- API endpoints are documented in the Flask app

### Frontend Development
- Uses Vite for fast development and hot reloading
- Redux DevTools available in development
- TypeScript for type safety
- ESLint for code quality

## Production Deployment

### Backend
1. Set environment variables:
   - `SECRET_KEY`: Flask secret key
   - `DATABASE_URL`: Database connection string
2. Use a production WSGI server like Gunicorn
3. Set up reverse proxy with Nginx

### Frontend
1. Build the production bundle:
```bash
npm run build
```
2. Serve the built files with a web server
3. Configure environment variables for API endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.