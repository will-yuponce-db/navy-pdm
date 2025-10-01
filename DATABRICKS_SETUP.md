# Databricks Integration Setup

## Environment Variables

**Note**: Databricks automatically provides the required environment variables when running in the Databricks environment. No manual configuration is needed.

The following environment variables are automatically set by Databricks:
- `DATABRICKS_CLIENT_ID` - Service principal client ID
- `DATABRICKS_CLIENT_SECRET` - Service principal client secret  
- `DATABRICKS_SERVER_HOSTNAME` - Workspace hostname
- `DATABRICKS_HTTP_PATH` - SQL warehouse HTTP path

## Local Development

For local development, the application will automatically fall back to the local SQLite database when Databricks environment variables are not available.

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

## Enhanced Error Handling

The API now includes comprehensive error handling with detailed diagnostics:

### Features
- **Retry Logic**: Automatic retry with exponential backoff (3 attempts)
- **Detailed Logging**: Structured error logs with context and timestamps
- **Health Monitoring**: Connection status tracking and health checks
- **Diagnostics**: Response times, connection status, and error details
- **Recommendations**: Actionable suggestions based on error types
- **Fallback Support**: Automatic fallback to local database when available

### Error Response Format
```json
{
  "success": false,
  "error": "Connection timeout after 30000ms",
  "diagnostics": {
    "connectionStatus": "unhealthy",
    "lastHealthCheck": "2024-01-15T10:30:00.000Z",
    "responseTime": 30000,
    "error": "Connection timeout after 30000ms"
  },
  "recommendations": [
    "Connection timeout detected. Check network connectivity and Databricks service status."
  ]
}
```

## Troubleshooting

### Missing Environment Variables
If you see: `Missing required Databricks environment variables: DATABRICKS_CLIENT_ID, DATABRICKS_CLIENT_SECRET, DATABRICKS_SERVER_HOSTNAME, DATABRICKS_HTTP_PATH`
- This is expected behavior when running locally
- The application will automatically use the local SQLite database
- In Databricks environment, these variables are provided automatically

### Connection Failed
If you see: `Databricks connection failed`
- Check that you're running in the Databricks environment
- Verify the service principal has access to the workspace
- Ensure the SQL warehouse is running
- Check network connectivity and firewall settings

### Query Execution Failed
If you see: `Query execution failed`
- Verify the table `public_sector.predictive_maintenance_navy.parts` exists
- Check that the service principal or user has SELECT permissions
- The application will fall back to local database if Databricks fails
- Check query syntax and table names

### High Response Times
If you see: `High response time detected`
- Check Databricks warehouse status (may be cold or overloaded)
- Verify network connectivity
- Consider optimizing queries or increasing warehouse size

### Authentication Errors
If you see: `Authentication failed`
- Verify service principal credentials
- Check that the service principal has workspace access
- Ensure the OIDC token endpoint is accessible

## Security Notes

- Environment variables are automatically managed by Databricks
- User tokens are preferred for fine-grained access control
- All queries are executed with proper error handling and fallbacks
- Local development uses SQLite database for testing
