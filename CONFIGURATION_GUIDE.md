# Configuration Guide

This guide provides detailed instructions for configuring the Navy PdM application, including API endpoints, Databricks integration, and table names.

## Table of Contents

1. [Configuration File Structure](#configuration-file-structure)
2. [API Configuration](#api-configuration)
3. [Databricks Configuration](#databricks-configuration)
4. [Environment Variables](#environment-variables)
5. [Common Configuration Scenarios](#common-configuration-scenarios)
6. [Troubleshooting](#troubleshooting)

---

## Configuration File Structure

All configuration is centralized in one file:

**Location:** `/app/config/api.config.ts`

This file contains:
- API base URL and connection settings
- All API endpoint paths
- Databricks catalog, schema, and table names
- Helper functions for generating fully qualified table names

---

## API Configuration

### Base URL Configuration

The API base URL is automatically configured based on your environment:

```typescript
export const API_CONFIG = {
  baseUrl: 
    typeof window !== "undefined"
      ? window.location.origin + "/api"  // Browser environment
      : process.env.VITE_API_URL ||      // Custom URL from env
        (process.env.NODE_ENV === "production" 
          ? "/api"                        // Production default
          : "http://localhost:8000/api"), // Development default
  
  timeout: 10000,    // Request timeout (10 seconds)
  maxRetries: 3,     // Number of retry attempts
  retryDelay: 1000,  // Delay between retries (1 second)
}
```

**To override the base URL:**

Set the `VITE_API_URL` environment variable:
```bash
VITE_API_URL=https://your-custom-api.com/api
```

### Endpoint Paths

All endpoint paths are defined in the `API_ENDPOINTS` object:

```typescript
export const API_ENDPOINTS = {
  auth: {
    base: "/auth",
    login: "/auth/login",
    logout: "/auth/logout",
    // ...
  },
  workOrders: {
    base: "/work-orders",
    byId: (id: string) => `/work-orders/${id}`,
    ai: "/work-orders/ai",
    // ...
  },
  // ...
}
```

**To modify an endpoint:**

Edit the path directly in `api.config.ts`:

```typescript
// Change work orders endpoint
workOrders: {
  base: "/api/v2/maintenance-orders",  // Changed from /work-orders
  byId: (id: string) => `/api/v2/maintenance-orders/${id}`,
}
```

### Dynamic Endpoint Functions

Some endpoints use functions to generate paths with parameters:

```typescript
// Function-based endpoint
aiWorkOrderById: (workOrderId: string) =>
  `/databricks/ai-work-orders/${encodeURIComponent(workOrderId)}`

// Usage in code:
const endpoint = API_ENDPOINTS.databricks.aiWorkOrderById("WO-12345");
// Result: "/databricks/ai-work-orders/WO-12345"
```

---

## Databricks Configuration

### Catalog and Schema

Configure the Databricks catalog and schema:

**Option 1: Environment Variables (Recommended)**
```bash
DATABRICKS_CATALOG=public_sector
DATABRICKS_SCHEMA=predictive_maintenance_navy_test
```

**Option 2: Direct Configuration**
```typescript
// In api.config.ts
export const DATABRICKS_CONFIG = {
  catalog: "my_custom_catalog",
  schema: "my_custom_schema",
  // ...
}
```

### Table Names

Configure individual table names:

**Option 1: Environment Variables (Recommended)**
```bash
DATABRICKS_TABLE_AI_WORK_ORDERS=ai_work_orders
DATABRICKS_TABLE_PARTS_SILVER=parts_silver
DATABRICKS_TABLE_SHIP_STATUS=ship_current_status_gold
# ... etc
```

**Option 2: Direct Configuration**
```typescript
// In api.config.ts
export const DATABRICKS_CONFIG = {
  // ...
  tables: {
    aiWorkOrders: "my_ai_work_orders_table",
    partsSilver: "my_parts_inventory_table",
    shipCurrentStatusGold: "my_ship_status_table",
    // ...
  }
}
```

### Available Table Configurations

| Config Key | Env Variable | Default Value | Description |
|-----------|-------------|---------------|-------------|
| `aiWorkOrders` | `DATABRICKS_TABLE_AI_WORK_ORDERS` | `ai_work_orders` | AI-generated maintenance work orders |
| `currentStatusPredictions` | `DATABRICKS_TABLE_CURRENT_STATUS` | `current_status_predictions` | Real-time ship status predictions |
| `sensorBronze` | `DATABRICKS_TABLE_SENSOR_BRONZE` | `sensor_bronze` | Raw sensor telemetry data |
| `aiPartOrders` | `DATABRICKS_TABLE_AI_PART_ORDERS` | `ai_part_orders` | Parts requisition orders |
| `partsSilver` | `DATABRICKS_TABLE_PARTS_SILVER` | `parts_silver` | Cleansed parts inventory data |
| `shipCurrentStatusGold` | `DATABRICKS_TABLE_SHIP_STATUS` | `ship_current_status_gold` | Aggregated ship operational status |

### Fully Qualified Table Names

The configuration automatically generates fully qualified table names:

```typescript
// Generated automatically
DATABRICKS_TABLES.aiWorkOrders
// Result: "public_sector.predictive_maintenance_navy_test.ai_work_orders"

DATABRICKS_TABLES.partsSilver
// Result: "public_sector.predictive_maintenance_navy_test.parts_silver"
```

### Connection Configuration

Adjust Databricks connection behavior:

```typescript
export const DATABRICKS_CONFIG = {
  connection: {
    maxRetries: 3,              // Retry failed queries 3 times
    retryDelay: 1000,           // Wait 1 second between retries
    timeout: 30000,             // Query timeout: 30 seconds
    healthCheckInterval: 60000, // Check health every 60 seconds
    tokenRefreshBuffer: 300000, // Refresh token 5 minutes before expiry
  }
}
```

---

## Environment Variables

### Required Variables

These variables are required for Databricks connectivity:

```bash
DATABRICKS_CLIENT_ID=<your_service_principal_client_id>
DATABRICKS_CLIENT_SECRET=<your_service_principal_secret>
DATABRICKS_SERVER_HOSTNAME=<your_workspace_hostname>
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/<warehouse_id>
```

### Optional Variables

These variables have sensible defaults but can be customized:

```bash
# Databricks Catalog & Schema
DATABRICKS_CATALOG=public_sector
DATABRICKS_SCHEMA=predictive_maintenance_navy_test

# Table Names
DATABRICKS_TABLE_AI_WORK_ORDERS=ai_work_orders
DATABRICKS_TABLE_CURRENT_STATUS=current_status_predictions
DATABRICKS_TABLE_SENSOR_BRONZE=sensor_bronze
DATABRICKS_TABLE_AI_PART_ORDERS=ai_part_orders
DATABRICKS_TABLE_PARTS_SILVER=parts_silver
DATABRICKS_TABLE_SHIP_STATUS=ship_current_status_gold

# API Configuration
VITE_API_URL=http://localhost:8000/api
NODE_ENV=development

# Backend Configuration
SECRET_KEY=your_flask_secret_key
DATABASE_URL=sqlite:///navy_pdm.db
```

### Creating an .env File

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values:
   ```bash
   nano .env
   # or
   vim .env
   ```

3. Never commit `.env` to version control!

---

## Common Configuration Scenarios

### Scenario 1: Using a Different Databricks Workspace

**Goal:** Connect to a different Databricks workspace

**Steps:**
1. Update your `.env` file:
   ```bash
   DATABRICKS_SERVER_HOSTNAME=new-workspace.cloud.databricks.com
   DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/new_warehouse_id
   DATABRICKS_CLIENT_ID=new_client_id
   DATABRICKS_CLIENT_SECRET=new_client_secret
   ```

2. Restart the application

### Scenario 2: Custom Table Names

**Goal:** Use different table names in your Databricks workspace

**Steps:**
1. Update your `.env` file:
   ```bash
   DATABRICKS_TABLE_AI_WORK_ORDERS=custom_work_orders
   DATABRICKS_TABLE_PARTS_SILVER=custom_parts_inventory
   ```

2. Or edit `api.config.ts` directly:
   ```typescript
   tables: {
     aiWorkOrders: "custom_work_orders",
     partsSilver: "custom_parts_inventory",
   }
   ```

3. Restart the application

### Scenario 3: Different Catalog/Schema

**Goal:** Use tables from a different catalog or schema

**Steps:**
1. Update your `.env` file:
   ```bash
   DATABRICKS_CATALOG=my_catalog
   DATABRICKS_SCHEMA=my_schema
   ```

2. Tables will now be referenced as:
   ```
   my_catalog.my_schema.ai_work_orders
   my_catalog.my_schema.parts_silver
   ```

3. Restart the application

### Scenario 4: Custom API Endpoint Paths

**Goal:** Change the API endpoint structure

**Steps:**
1. Edit `app/config/api.config.ts`:
   ```typescript
   export const API_ENDPOINTS = {
     workOrders: {
       base: "/api/v2/maintenance",  // Changed
       byId: (id) => `/api/v2/maintenance/${id}`,
     }
   }
   ```

2. Update your backend to match the new paths

3. Restart the application

### Scenario 5: Multiple Environments

**Goal:** Maintain different configurations for dev, staging, and production

**Steps:**
1. Create environment-specific files:
   ```
   .env.development
   .env.staging
   .env.production
   ```

2. Load the appropriate file based on `NODE_ENV`:
   ```bash
   NODE_ENV=staging npm run dev
   ```

3. Use a tool like `dotenv-cli`:
   ```bash
   npm install -D dotenv-cli
   dotenv -e .env.staging -- npm run dev
   ```

---

## Troubleshooting

### Issue: Tables Not Found

**Error:**
```
TABLE_OR_VIEW_NOT_FOUND: The table `catalog.schema.table` cannot be found
```

**Solutions:**
1. Verify table exists in Databricks:
   ```sql
   SHOW TABLES IN your_catalog.your_schema;
   ```

2. Check environment variables:
   ```bash
   echo $DATABRICKS_CATALOG
   echo $DATABRICKS_SCHEMA
   echo $DATABRICKS_TABLE_AI_WORK_ORDERS
   ```

3. Verify table name in `api.config.ts`

### Issue: API Connection Refused

**Error:**
```
Network error: Connection refused
```

**Solutions:**
1. Check API base URL configuration
2. Verify backend server is running
3. Check `VITE_API_URL` environment variable
4. Try accessing API directly: `curl http://localhost:8000/api/health`

### Issue: Databricks Authentication Failed

**Error:**
```
Authentication failed: Invalid client credentials
```

**Solutions:**
1. Verify service principal credentials:
   ```bash
   echo $DATABRICKS_CLIENT_ID
   echo $DATABRICKS_CLIENT_SECRET
   ```

2. Check token expiration in logs
3. Verify service principal has correct permissions
4. Test connection: `curl http://localhost:8000/api/databricks/health`

### Issue: Changes Not Taking Effect

**Problem:** Configuration changes are not reflected in the application

**Solutions:**
1. Restart the development server:
   ```bash
   npm run dev
   ```

2. Clear build cache:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

3. If using environment variables, ensure they're loaded:
   ```bash
   source .env
   npm run dev
   ```

### Viewing Current Configuration

**From Browser Console:**
```javascript
import { DATABRICKS_TABLES, API_ENDPOINTS, DATABRICKS_CONFIG } from './app/config/api.config';

console.log('Table Names:', DATABRICKS_TABLES);
console.log('API Endpoints:', API_ENDPOINTS);
console.log('Databricks Config:', DATABRICKS_CONFIG);
```

**From Backend:**
Check server logs for configuration on startup:
```
[DATABRICKS] Using catalog: public_sector
[DATABRICKS] Using schema: predictive_maintenance_navy_test
[DATABRICKS] Table: ai_work_orders
```

---

## Best Practices

1. **Use Environment Variables for Secrets**
   - Never hardcode credentials in `api.config.ts`
   - Use `.env` files for sensitive data
   - Add `.env` to `.gitignore`

2. **Document Custom Configurations**
   - Comment your changes in `api.config.ts`
   - Keep a changelog of configuration updates
   - Document environment-specific settings

3. **Test Configuration Changes**
   - Always test after changing configuration
   - Use health check endpoints to verify connectivity
   - Check browser console for errors

4. **Version Control**
   - Commit `api.config.ts` to version control
   - Do NOT commit `.env` files
   - Provide `.env.example` with placeholder values

5. **Environment Consistency**
   - Keep staging and production configs similar
   - Use infrastructure-as-code for environment variables
   - Document any environment-specific differences

---

## Support

For additional help:
1. Check application logs
2. Review Databricks connection diagnostics
3. Contact the development team
4. See [README.md](README.md) for general setup instructions

