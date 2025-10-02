# Databricks AI Work Orders Integration

## Overview

This document describes the integration of AI-generated work orders from the Databricks table `public_sector.predictive_maintenance_navy_test.ai_work_orders` into the Navy PdM application.

## Architecture

### Data Flow

```
Databricks Table (ai_work_orders)
    ↓
Backend API (/api/databricks/ai-work-orders)
    ↓
Frontend API Client (databricksApi)
    ↓
Redux Store (workOrderSlice)
    ↓
UI Components (WorkOrderTable)
```

### Components

#### 1. Databricks Service (`app/services/databricks.ts`)

Added functions to query AI work orders:
- `getAIWorkOrders()` - Fetch AI work orders with optional filtering
- `getAIWorkOrderById()` - Fetch a single AI work order by ID
- `getAIWorkOrdersByTurbineId()` - Fetch AI work orders for a specific turbine

#### 2. Backend API (`server.js`)

New endpoints:
- `GET /api/databricks/ai-work-orders` - List AI work orders
  - Query params: `limit`, `offset`, `priority`, `homeLocation`
- `GET /api/databricks/ai-work-orders/:workOrderId` - Get specific AI work order

#### 3. Frontend API Client (`app/services/api.ts`)

Added to `databricksApi`:
- `getAIWorkOrders()` - Fetch AI work orders from backend
- `getAIWorkOrderById()` - Fetch single AI work order

#### 4. Data Mapper (`app/utils/databricksMapper.ts`)

Utility functions to transform Databricks data to WorkOrder format:
- `mapDatabricksWorkOrderToWorkOrder()` - Single record mapper
- `mapDatabricksWorkOrdersToWorkOrders()` - Array mapper
- `extractShipsFromDatabricksWOs()` - Extract ship information
- `getDatabricksWorkOrderStats()` - Generate statistics

#### 5. Redux Store (`app/redux/services/workOrderSlice.tsx`)

New thunk actions:
- `fetchAIWorkOrdersFromDatabricks()` - Fetch only AI work orders
- `fetchAllWorkOrders()` - Fetch both manual and AI work orders

#### 6. UI Component (`app/components/WorkOrderTable.tsx`)

Updated to use `fetchAllWorkOrders()` to display both manual and AI-generated work orders.

## Data Mapping

### Databricks Schema → WorkOrder Type

| Databricks Column | WorkOrder Field | Transformation |
|------------------|----------------|----------------|
| `work_order` | `wo` | Direct mapping |
| `designator` | `ship.name` | Direct mapping |
| `designator_id` | `shipId`, `ship.id` | Convert to string |
| `home_location` | `ship.homeport` | Direct mapping |
| `turbine_id` | `gteSystemId` | Direct mapping |
| `prediction` | `fm` (Failure Mode) | Combined with maintenance_type |
| `maintenance_type` | `slaCategory`, part of `fm` | Mapped to description |
| `priority` | `priority` | Normalized to "Routine", "Urgent", or "CASREP" |
| `operable` | Part of `status` and `symptoms` | Used to determine status |
| `ttr` | `eta` | Direct mapping (Time To Repair) |
| `parts_required` | `partsRequired` | JSON array parsed to comma-separated string |
| `hourly_timestamp` | `createdAt`, `updatedAt` | Convert to Date |

### Maintenance Type Mapping

| Databricks Value | Description |
|------------------|-------------|
| `Organizational Level` | Ship's force maintenance |
| `Intermediate Level` | Regional maintenance center |
| `Depot Level` | Major overhaul/repair facility |

### Parts Required Processing

The `parts_required` field in Databricks contains a JSON array:
```json
["Pump - Fuel","Pump - Fuel","Seal","Seal","Fuel Nozzle"]
```

This is transformed to:
```
Pump - Fuel (x2), Seal (x2), Fuel Nozzle
```

Duplicate parts are counted and formatted with quantity indicators.

## Usage

### Fetching Work Orders

The application automatically fetches both manual and AI work orders when the WorkOrderTable component mounts:

```typescript
// In WorkOrderTable.tsx
useEffect(() => {
  dispatch(fetchAllWorkOrders());
}, [dispatch]);
```

### Filtering AI Work Orders

You can filter AI work orders in the UI using the built-in filters:
- **Priority**: CASREP, Urgent, Routine
- **Source**: Manual, AI
- **Search**: Full-text search across all fields

### Backend Query Examples

#### Get all AI work orders:
```bash
curl http://localhost:8000/api/databricks/ai-work-orders
```

#### Filter by priority:
```bash
curl "http://localhost:8000/api/databricks/ai-work-orders?priority=CASREP"
```

#### Filter by home location:
```bash
curl "http://localhost:8000/api/databricks/ai-work-orders?homeLocation=NB%20Norfolk"
```

#### Pagination:
```bash
curl "http://localhost:8000/api/databricks/ai-work-orders?limit=10&offset=0"
```

#### Get specific work order:
```bash
curl http://localhost:8000/api/databricks/ai-work-orders/AI-WO%20001
```

## Features

### 1. Automatic Merging
Manual and AI work orders are automatically merged when displayed in the WorkOrderTable.

### 2. Source Identification
AI work orders are clearly marked with:
- `creationSource: 'ai'` field
- "AI" chip in the UI
- Orange warning color for AI-generated work orders

### 3. Sensor Data Integration
AI work orders include sensor data in the `sensorData` field, which can be used for:
- Sensor Analyzer view
- Detailed diagnostics
- Historical trend analysis

### 4. Fallback Handling
If Databricks connection fails:
- A notification is displayed to the user
- Manual work orders are still shown
- Error is logged but doesn't break the application

## Statistics and Analytics

The mapper includes a `getDatabricksWorkOrderStats()` function that provides:

```typescript
{
  total: number,
  byPriority: {
    CASREP: number,
    Urgent: number,
    Routine: number
  },
  nonOperable: number,
  byMaintenanceType: {
    [type: string]: number
  },
  bySensorPrediction: {
    [sensor: string]: number
  },
  averageTTR: number
}
```

## Example Data

### Databricks Record:
```csv
turbine_id,hourly_timestamp,designator,home_location,prediction,maintenance_type,operable,ttr,parts_required,work_order,priority
38931787-b645-8fa1-2aee-eb73a82e2a14,2025-10-02T00:00:00.000Z,USS Halsey (DDG-97),NB San Diego,sensor_D,Organizational Level,true,5,"[""Pump - Fuel"",""Seal"",""Fuel Nozzle""]",AI-WO 001,Routine
```

### Mapped WorkOrder:
```typescript
{
  wo: "AI-WO 001",
  shipId: "1865989989",
  gteSystemId: "38931787-b645-8fa1-2aee-eb73a82e2a14",
  fm: "sensor_D - Organizational Level",
  priority: "Routine",
  status: "Pending approval",
  eta: 5,
  symptoms: "AI detected sensor_D anomaly requiring Organizational Level. Currently Operable. Average energy output: 0.0267.",
  recommendedAction: "Org Level - Ship's force maintenance",
  partsRequired: "Pump - Fuel, Seal, Fuel Nozzle",
  slaCategory: "Organizational Level",
  creationSource: "ai",
  ship: {
    id: "1865989989",
    name: "USS Halsey (DDG-97)",
    designation: "DDG-97",
    homeport: "NB San Diego",
    status: "Active"
  }
}
```

## Error Handling

### Databricks Connection Failure
- Application continues to work with manual work orders only
- User is notified via notification system
- Error is logged to console

### Invalid Data
- Mapper handles missing fields gracefully
- JSON parsing errors are caught and logged
- Default values are provided for missing data

### API Errors
- Backend returns appropriate HTTP status codes
- Detailed diagnostics are included in error responses
- Recommendations are provided for common issues

## Performance Considerations

1. **Pagination**: Both endpoints support pagination to handle large datasets
2. **Caching**: Health check results are cached for 1 minute
3. **Connection Pooling**: Databricks client connection is reused
4. **Error Recovery**: Automatic retry with exponential backoff

## Security

1. **Authentication**: Supports both user tokens and service principal credentials
2. **SQL Injection Prevention**: Query parameters are validated (though more robust parameterization is recommended)
3. **CORS**: Configured to allow cross-origin requests in development

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live work order updates
2. **Advanced Filtering**: More granular filtering options (date ranges, sensor types, etc.)
3. **Batch Operations**: Bulk approve/reject AI work orders
4. **Machine Learning Insights**: Display confidence scores and model explanations
5. **Historical Comparison**: Compare current predictions with historical accuracy
6. **Export Functionality**: Export AI work orders with sensor data to CSV/Excel

## Troubleshooting

### AI Work Orders Not Showing
1. Check Databricks connection: `GET /api/databricks/health`
2. Verify table name and permissions
3. Check browser console for errors
4. Verify environment variables are set

### Incorrect Data Mapping
1. Check mapper utility in `app/utils/databricksMapper.ts`
2. Verify Databricks schema matches expected structure
3. Test with sample data using mapper functions

### Performance Issues
1. Reduce `limit` parameter in queries
2. Add indexes to Databricks table
3. Check network latency to Databricks
4. Monitor warehouse status and scale if needed

## Contact

For issues or questions, please refer to the main [README.md](./README.md) or [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

