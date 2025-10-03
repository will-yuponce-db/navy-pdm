# Databricks Error Handling Improvements

## Problem Summary
The Databricks integration was failing silently when queries failed, making it impossible to diagnose issues. The API would fall back to SQLite without providing any error information to the frontend or giving users visibility into what went wrong.

### Specific Issue from Logs
```
[DATABRICKS] Query failed, falling back to SQLite: [TABLE_OR_VIEW_NOT_FOUND] 
The table or view `public_sector`.`predictive_maintenance_navy`.`ai_work_orders` cannot be found.
```

This error was logged server-side but never exposed to the client, making troubleshooting difficult.

## Solution Implemented

### 1. Enhanced `executeQuery` Function
**File**: `server.js` (lines 117-166)

The fallback query function now:
- **Captures detailed error information** including error codes, messages, and timestamps
- **Returns fallback reason** along with data and source
- **Logs comprehensive error details** to the server console
- **Tracks error counts** for monitoring

```javascript
{
  data: [...],
  source: 'sqlite',
  fallbackReason: {
    code: 'TABLE_OR_VIEW_NOT_FOUND',
    message: 'The table or view `public_sector`.`predictive_maintenance_navy`.`ai_work_orders` cannot be found.',
    query: 'SELECT * FROM public_sector.predictive_maintenance_navy.ai_work_orders...',
    timestamp: '2025-10-03T17:44:23.293Z'
  }
}
```

### 2. Updated All Databricks API Endpoints
All Databricks endpoints now include fallback information in their responses:

**Endpoints Updated**:
- `GET /api/databricks/health` - Enhanced with error count and last error
- `GET /api/databricks/test` - Includes fallback warnings
- `GET /api/databricks/ai-work-orders` - Shows why fallback occurred
- `GET /api/databricks/ai-work-orders/:workOrderId`
- `GET /api/databricks/ship-status`
- `GET /api/databricks/ship-status/:turbineId`
- `GET /api/databricks/parts-requisitions`
- `GET /api/databricks/parts-requisitions/:orderNumber`
- `GET /api/databricks/parts-requisitions/ship/:designatorId`
- `GET /api/databricks/parts`

**Example Response with Warning**:
```json
{
  "success": true,
  "source": "sqlite",
  "data": [...],
  "count": 10,
  "warning": "Using SQLite fallback due to Databricks error",
  "fallbackReason": {
    "code": "TABLE_OR_VIEW_NOT_FOUND",
    "message": "The table or view `public_sector`.`predictive_maintenance_navy`.`ai_work_orders` cannot be found.",
    "query": "SELECT * FROM public_sector.predictive_maintenance_navy.ai_work_orders LIMIT 100",
    "timestamp": "2025-10-03T17:44:23.293Z"
  }
}
```

### 3. Enhanced Health Check Endpoint
**Endpoint**: `GET /api/databricks/health`

Now provides comprehensive status information:
```json
{
  "status": "disconnected",
  "timestamp": "2025-10-03T17:44:23.293Z",
  "mode": "production",
  "databricks": {
    "available": false,
    "credentials": true,
    "errorCount": 5,
    "lastError": {
      "code": "TABLE_OR_VIEW_NOT_FOUND",
      "message": "The table or view `public_sector`.`predictive_maintenance_navy`.`ai_work_orders` cannot be found.",
      "query": "SELECT * FROM public_sector.predictive_maintenance_navy.ai_work_orders...",
      "timestamp": "2025-10-03T17:44:23.293Z"
    }
  },
  "fallback": "sqlite"
}
```

### 4. Error Tracking
Added global tracking variables:
- `lastDatabricksError` - Stores the most recent error details
- `databricksErrorCount` - Counts total errors for monitoring

## Benefits

### For Users
✅ **Immediate visibility** into when Databricks is unavailable  
✅ **Clear error messages** explaining what went wrong  
✅ **Confidence** that data is coming from SQLite fallback when needed  

### For Developers
✅ **Detailed error logs** with error codes and query context  
✅ **Health monitoring** endpoint for diagnostics  
✅ **Error tracking** to identify persistent issues  

### For Operations
✅ **Production debugging** without accessing server logs  
✅ **Proactive monitoring** of Databricks connection health  
✅ **Error trending** via error count tracking  

## Diagnosing Your Current Issue

Based on your logs, the `ai_work_orders` table doesn't exist in Databricks. To fix this:

### Option 1: Check Table Name
Verify the table exists in Databricks:
```sql
SHOW TABLES IN public_sector.predictive_maintenance_navy;
```

### Option 2: Create the Missing Table
If the table needs to be created in Databricks, run:
```sql
CREATE TABLE public_sector.predictive_maintenance_navy.ai_work_orders (
  wo STRING,
  ship STRING,
  homeport STRING,
  gteSystem STRING,
  fm STRING,
  priority STRING,
  status STRING,
  creation_source STRING,
  eta TIMESTAMP,
  parts_required STRING,
  description STRING,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Option 3: Update Query to Use Correct Table Name
If the table has a different name, update the query in `server.js` around line 269.

## Testing the Fix

1. **Check health endpoint**:
   ```bash
   curl https://your-app.databricks.com/api/databricks/health
   ```

2. **Test a query and look for warnings**:
   ```bash
   curl https://your-app.databricks.com/api/databricks/ai-work-orders
   ```

3. **Check browser console** - Frontend should now show warnings when fallback occurs

## Next Steps

1. **Fix the missing table** in Databricks (see options above)
2. **Monitor the health endpoint** to verify connection is restored
3. **Consider adding frontend UI** to display fallback warnings to users
4. **Set up alerts** based on `errorCount` for proactive monitoring

## Files Modified
- `server.js` - Enhanced error handling and all Databricks endpoints

## Deployment
The fixes are backward compatible and can be deployed immediately. No database migrations or frontend changes required.

