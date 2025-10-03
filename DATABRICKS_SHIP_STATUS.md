# Databricks Ship Current Status Integration

## Overview

This document describes the integration of the `ship_current_status_gold` table from Databricks into the Navy PdM application. This table provides real-time status information for ships and their turbine systems, including sensor data, predictions, and operational status.

## Architecture

### Data Flow

```
Databricks Table (ship_current_status_gold)
    ↓
Backend API (/api/databricks/ship-status)
    ↓
Frontend API Client (databricksApi)
    ↓
Mapper Functions (databricksMapper.ts)
    ↓
UI Components
```

### Components

#### 1. Database Table Schema

**Table**: `public_sector.predictive_maintenance_navy_test.ship_current_status_gold`

**Columns**:
- `turbine_id` (string) - Unique identifier for the turbine
- `hourly_timestamp` (timestamp) - Timestamp of the status record
- `avg_energy` (number) - Average energy output
- `std_sensor_A` through `std_sensor_F` (number) - Standard deviations for each sensor
- `percentiles_sensor_A` through `percentiles_sensor_F` (JSON array) - Percentile values for each sensor
- `home_location` (string) - Ship's home port location
- `designator` (string) - Ship designation (e.g., "USS Halsey (DDG-97)")
- `lat`, `long` (number) - Geographic coordinates
- `designator_id` (string) - Unique ship identifier
- `home_location_id` (string) - Unique location identifier
- `prediction` (string) - Predicted sensor failure or issue
- `maintenance_type` (string) - Type of maintenance required
- `operable` (boolean) - Whether the ship is currently operable
- `ttr` (number) - Time to repair (in days)

#### 2. Backend API (`server.js`)

**Endpoints**:

##### GET `/api/databricks/ship-status`
Fetch ship status records with optional filtering and pagination.

**Query Parameters**:
- `limit` (number, default: 50) - Number of records to return
- `offset` (number, default: 0) - Offset for pagination
- `designator` (string) - Filter by ship designator (partial match)
- `homeLocation` (string) - Filter by home location (partial match)
- `turbineId` (string) - Filter by turbine ID (exact match)
- `operable` (boolean) - Filter by operational status

**Response**:
```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "limit": 50,
  "offset": 0,
  "hasNext": true,
  "hasPrevious": false,
  "diagnostics": {
    "query": "SELECT * FROM ...",
    "responseTime": 234,
    "recordCount": 50,
    "totalRecords": 100,
    "timestamp": "2025-10-02T12:00:00.000Z"
  }
}
```

##### GET `/api/databricks/ship-status/:turbineId`
Fetch the latest status for a specific turbine.

**Response**:
```json
{
  "success": true,
  "data": {
    "turbine_id": "38931787-b645-8fa1-2aee-eb73a82e2a14",
    "hourly_timestamp": "2025-10-02T00:00:00.000Z",
    "avg_energy": 0.0267,
    "std_sensor_A": 0.12,
    ...
  },
  "diagnostics": {
    "query": "SELECT * FROM ...",
    "responseTime": 123,
    "timestamp": "2025-10-02T12:00:00.000Z"
  }
}
```

#### 3. Frontend API Client (`app/services/api.ts`)

**Functions**:

```typescript
// Get ship status with optional filters
databricksApi.getShipStatus({
  limit?: number,
  offset?: number,
  designator?: string,
  homeLocation?: string,
  turbineId?: string,
  operable?: boolean
})

// Get latest status for a specific turbine
databricksApi.getShipStatusByTurbineId(turbineId: string)
```

#### 4. TypeScript Interfaces (`app/types/index.ts`)

```typescript
// Application interface (camelCase)
interface ShipCurrentStatus {
  turbineId: string;
  hourlyTimestamp: Date | string;
  avgEnergy: number;
  stdSensorA?: number;
  stdSensorB?: number;
  stdSensorC?: number;
  stdSensorD?: number;
  stdSensorE?: number;
  stdSensorF?: number;
  percentilesSensorA?: number[];
  percentilesSensorB?: number[];
  percentilesSensorC?: number[];
  percentilesSensorD?: number[];
  percentilesSensorE?: number[];
  percentilesSensorF?: number[];
  homeLocation: string;
  designator: string;
  lat: number;
  long: number;
  designatorId: string;
  homeLocationId: string;
  prediction?: string;
  maintenanceType?: string;
  operable: boolean;
  ttr?: number;
}

// Databricks interface (snake_case from database)
interface DatabricksShipStatus {
  turbine_id: string;
  hourly_timestamp: string;
  avg_energy: number;
  std_sensor_A?: number;
  // ... (similar to above but with snake_case)
}
```

#### 5. Data Mapper (`app/utils/databricksMapper.ts`)

**Functions**:

```typescript
// Transform single record
mapDatabricksShipStatusToShipStatus(
  databricksStatus: DatabricksShipStatus
): ShipCurrentStatus

// Transform array of records
mapDatabricksShipStatusesToShipStatuses(
  databricksStatuses: DatabricksShipStatus[]
): ShipCurrentStatus[]

// Generate statistics
getDatabricksShipStatusStats(
  databricksStatuses: DatabricksShipStatus[]
): {
  total: number;
  operable: number;
  nonOperable: number;
  operablePercentage: number;
  avgEnergy: number;
  avgTTR: number;
  byLocation: Record<string, number>;
  byDesignator: Record<string, number>;
  byPrediction: Record<string, number>;
  byMaintenanceType: Record<string, number>;
}
```

## Data Mapping

### Field Transformations

| Databricks Column | Application Field | Transformation |
|------------------|------------------|----------------|
| `turbine_id` | `turbineId` | Direct mapping |
| `hourly_timestamp` | `hourlyTimestamp` | Convert to Date |
| `avg_energy` | `avgEnergy` | Direct mapping |
| `std_sensor_A` | `stdSensorA` | Direct mapping |
| `percentiles_sensor_A` | `percentilesSensorA` | JSON parse if string |
| `home_location` | `homeLocation` | Direct mapping |
| `designator` | `designator` | Direct mapping |
| `lat` | `lat` | Direct mapping |
| `long` | `long` | Direct mapping |
| `designator_id` | `designatorId` | Direct mapping |
| `home_location_id` | `homeLocationId` | Direct mapping |
| `prediction` | `prediction` | Direct mapping |
| `maintenance_type` | `maintenanceType` | Direct mapping |
| `operable` | `operable` | Direct mapping |
| `ttr` | `ttr` | Direct mapping |

### Sensor Data Processing

The `percentiles_sensor_*` fields may be stored as JSON strings in Databricks. The mapper automatically handles both formats:

**String format** (Databricks):
```json
"[0.1, 0.25, 0.5, 0.75, 0.9]"
```

**Array format** (Application):
```json
[0.1, 0.25, 0.5, 0.75, 0.9]
```

## Usage

### Backend Examples

#### Query all ship statuses:
```bash
curl http://localhost:8000/api/databricks/ship-status
```

#### Filter by designator:
```bash
curl "http://localhost:8000/api/databricks/ship-status?designator=USS%20Halsey"
```

#### Filter by location:
```bash
curl "http://localhost:8000/api/databricks/ship-status?homeLocation=Norfolk"
```

#### Filter by operational status:
```bash
curl "http://localhost:8000/api/databricks/ship-status?operable=false"
```

#### Pagination:
```bash
curl "http://localhost:8000/api/databricks/ship-status?limit=20&offset=40"
```

#### Get latest status for specific turbine:
```bash
curl http://localhost:8000/api/databricks/ship-status/38931787-b645-8fa1-2aee-eb73a82e2a14
```

### Frontend Examples

```typescript
import { databricksApi } from '../services/api';
import { 
  mapDatabricksShipStatusToShipStatus,
  getDatabricksShipStatusStats 
} from '../utils/databricksMapper';

// Fetch all ship statuses
const response = await databricksApi.getShipStatus({ limit: 50 });
const shipStatuses = response.data.map(mapDatabricksShipStatusToShipStatus);

// Fetch non-operable ships only
const nonOperable = await databricksApi.getShipStatus({ operable: false });

// Get status for specific turbine
const turbineStatus = await databricksApi.getShipStatusByTurbineId(
  '38931787-b645-8fa1-2aee-eb73a82e2a14'
);

// Generate statistics
const stats = getDatabricksShipStatusStats(response.data);
console.log(`${stats.operable} ships operable, ${stats.nonOperable} non-operable`);
console.log(`Average energy: ${stats.avgEnergy}`);
console.log(`Average TTR: ${stats.avgTTR} days`);
```

## Features

### 1. Real-Time Status Monitoring
Track the operational status of ships and turbine systems in real-time.

### 2. Sensor Analytics
Access detailed sensor data including:
- Standard deviations for 6 sensor types (A-F)
- Percentile distributions for each sensor
- Average energy output

### 3. Predictive Information
View predicted failures and maintenance requirements:
- Sensor-based predictions
- Maintenance type classification
- Time-to-repair estimates

### 4. Geographic Tracking
Monitor ship locations with:
- Latitude/longitude coordinates
- Home port location
- Location-based filtering

### 5. Operational Filtering
Quickly identify:
- Non-operable ships requiring immediate attention
- Ships by location or designator
- Maintenance requirements by type

## Statistics and Analytics

The `getDatabricksShipStatusStats()` function provides comprehensive statistics:

```typescript
{
  total: 150,                    // Total number of records
  operable: 145,                 // Number of operable ships
  nonOperable: 5,                // Number of non-operable ships
  operablePercentage: 96.67,     // Percentage operable
  avgEnergy: 0.0245,             // Average energy output
  avgTTR: 3.2,                   // Average time to repair (days)
  byLocation: {                  // Ships by location
    "NB Norfolk": 45,
    "NB San Diego": 38,
    ...
  },
  byDesignator: {                // Records by ship
    "USS Halsey (DDG-97)": 12,
    ...
  },
  byPrediction: {                // Predictions by sensor
    "sensor_A": 8,
    "sensor_D": 12,
    ...
  },
  byMaintenanceType: {           // Maintenance by type
    "Organizational Level": 15,
    "Intermediate Level": 8,
    ...
  }
}
```

## Integration with Existing Features

### Fleet Map
The ship status data can be integrated with the Fleet Map component to:
- Display real-time ship locations
- Color-code ships by operational status
- Show sensor alerts and predictions

### Maintenance Dashboard
Use ship status data to:
- Identify ships requiring maintenance
- Prioritize work orders based on operational status
- Track time-to-repair metrics

### Sensor Analyzer
The detailed sensor data can be used to:
- Analyze sensor performance trends
- Identify anomalies
- Compare sensor readings across ships

## Error Handling

### Databricks Connection Failure
- Returns 500 status code with detailed error message
- Includes diagnostics and recommendations
- Logs full error details to console

### Missing Data
- Optional fields are handled gracefully
- Null/undefined values are preserved
- JSON parsing errors are caught and return null

### API Errors
- Detailed error messages with context
- HTTP status codes for different error types
- Recommendations for common issues

## Performance Considerations

1. **Pagination**: Use limit/offset to handle large datasets efficiently
2. **Filtering**: Apply filters at the database level for better performance
3. **Indexing**: Ensure Databricks table has appropriate indexes on:
   - `turbine_id` (for specific lookups)
   - `hourly_timestamp` (for ordering)
   - `operable` (for status filtering)
4. **Caching**: Consider implementing caching for frequently accessed data

## Security

1. **Authentication**: Uses service principal credentials for Databricks access
2. **SQL Injection**: Parameters should be properly escaped (consider using parameterized queries)
3. **Access Control**: Ensure proper permissions on Databricks table

## Future Enhancements

1. **Real-Time Updates**: WebSocket integration for live status updates
2. **Historical Trends**: Track status changes over time
3. **Alert System**: Automated alerts for non-operable ships or sensor anomalies
4. **Dashboard Integration**: Dedicated ship status dashboard component
5. **Export Functionality**: Export status data to CSV/Excel
6. **Predictive Analytics**: ML-based predictions for maintenance requirements
7. **Correlation Analysis**: Correlate sensor data with work orders and maintenance history

## Troubleshooting

### Ship Status Not Loading
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
2. Add filters to narrow result set
3. Check Databricks warehouse status
4. Monitor network latency

### Sensor Data Not Parsing
1. Verify percentile data format in Databricks
2. Check for JSON parsing errors in logs
3. Ensure data is valid JSON array format

## Sample Data

### Databricks Record:
```json
{
  "turbine_id": "38931787-b645-8fa1-2aee-eb73a82e2a14",
  "hourly_timestamp": "2025-10-02T00:00:00.000Z",
  "avg_energy": 0.0267,
  "std_sensor_A": 0.12,
  "std_sensor_B": 0.15,
  "std_sensor_C": 0.11,
  "std_sensor_D": 0.13,
  "std_sensor_E": 0.14,
  "std_sensor_F": 0.16,
  "percentiles_sensor_A": "[0.1, 0.25, 0.5, 0.75, 0.9]",
  "percentiles_sensor_B": "[0.12, 0.28, 0.52, 0.77, 0.92]",
  "home_location": "NB San Diego",
  "designator": "USS Halsey (DDG-97)",
  "lat": 32.684722,
  "long": -117.13,
  "designator_id": "1865989989",
  "home_location_id": "loc_san_diego",
  "prediction": "sensor_D",
  "maintenance_type": "Organizational Level",
  "operable": true,
  "ttr": 5
}
```

### Mapped ShipCurrentStatus:
```typescript
{
  turbineId: "38931787-b645-8fa1-2aee-eb73a82e2a14",
  hourlyTimestamp: new Date("2025-10-02T00:00:00.000Z"),
  avgEnergy: 0.0267,
  stdSensorA: 0.12,
  stdSensorB: 0.15,
  stdSensorC: 0.11,
  stdSensorD: 0.13,
  stdSensorE: 0.14,
  stdSensorF: 0.16,
  percentilesSensorA: [0.1, 0.25, 0.5, 0.75, 0.9],
  percentilesSensorB: [0.12, 0.28, 0.52, 0.77, 0.92],
  homeLocation: "NB San Diego",
  designator: "USS Halsey (DDG-97)",
  lat: 32.684722,
  long: -117.13,
  designatorId: "1865989989",
  homeLocationId: "loc_san_diego",
  prediction: "sensor_D",
  maintenanceType: "Organizational Level",
  operable: true,
  ttr: 5
}
```

## Contact

For issues or questions, please refer to:
- [README.md](./README.md) - Main documentation
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Troubleshooting guide
- [DATABRICKS_SETUP.md](./DATABRICKS_SETUP.md) - Databricks configuration
- [DATABRICKS_AI_WORKORDERS.md](./DATABRICKS_AI_WORKORDERS.md) - AI work orders integration




