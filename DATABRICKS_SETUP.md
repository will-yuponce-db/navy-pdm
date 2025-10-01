# Databricks Integration Setup

## Environment Variables Required

Create a `.env.local` file in the project root with the following variables:

```bash
# Service Principal Configuration
DATABRICKS_CLIENT_ID=app-40zbx9
DATABRICKS_CLIENT_SECRET=your_actual_client_secret_here

# Databricks Workspace Configuration
DATABRICKS_SERVER_HOSTNAME=your-workspace-hostname.azuredatabricks.net
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your-warehouse-id
```

## How to Get These Values

### 1. Service Principal Credentials
- **Client ID**: `app-40zbx9` (already provided)
- **Client Secret**: Get this from your Databricks app configuration in the Databricks workspace

### 2. Workspace Configuration
- **Server Hostname**: Your Databricks workspace URL (e.g., `adb-1234567890123456.7.azuredatabricks.net`)
- **HTTP Path**: The SQL warehouse endpoint path (e.g., `/sql/1.0/warehouses/abc123def456`)

## Authorization Flow

The application supports two authorization methods:

### 1. User Token Authorization (Preferred)
- Uses the `X-Forwarded-Access-Token` header from Databricks app requests
- Respects user permissions and Unity Catalog access controls
- Automatically falls back to service principal if user token is unavailable

### 2. Service Principal Authorization (Fallback)
- Uses client credentials flow with the service principal
- Requires all environment variables to be set
- Used when user token is not available or fails

## API Endpoints

### Parts Query
```bash
GET /api/databricks/parts?page=1&limit=50&category=Hot%20Section&search=turbine
```

### Health Check
```bash
GET /api/databricks/health
```

### Test Connection
```bash
GET /api/databricks/test
```

### Custom Query
```bash
POST /api/databricks/query
Content-Type: application/json

{
  "query": "SELECT * FROM public_sector.predictive_maintenance_navy.parts LIMIT 10"
}
```

## SQL Query Example

The parts integration uses this query:
```sql
SELECT * FROM public_sector.predictive_maintenance_navy.parts
```

With optional filters:
```sql
SELECT * FROM public_sector.predictive_maintenance_navy.parts 
WHERE category = 'Hot Section' 
AND condition = 'New' 
AND (name LIKE '%turbine%' OR id LIKE '%turbine%')
ORDER BY last_updated DESC 
LIMIT 50 OFFSET 0
```

## Troubleshooting

### Missing Environment Variables
If you see: `Missing required Databricks environment variables`
- Ensure `.env.local` file exists with all required variables
- Restart the server after updating environment variables

### Connection Failed
If you see: `Databricks connection failed`
- Verify the server hostname is correct
- Check that the HTTP path points to a valid SQL warehouse
- Ensure the service principal has access to the workspace

### Query Execution Failed
If you see: `Query execution failed`
- Verify the table `public_sector.predictive_maintenance_navy.parts` exists
- Check that the service principal or user has SELECT permissions
- Ensure the SQL warehouse is running

## Security Notes

- Never commit `.env.local` to version control
- The service principal should have minimal required permissions
- User tokens are preferred for fine-grained access control
- All queries are executed with proper error handling and fallbacks
