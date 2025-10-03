# Parts Silver Table Integration

## Overview
The parts inventory table now fetches data from the Databricks `parts_silver` table when Databricks is available, with automatic fallback to the local SQLite database.

## Changes Made

### 1. Updated Databricks Service (`app/services/databricks.ts`)
- Changed `getParts()` function to query from `public_sector.predictive_maintenance_navy_test.parts_silver`
- Updated search logic to use `type` and `NSN` fields instead of `name` and `id`
- Modified ordering to use `NSN ASC` instead of `last_updated DESC`
- Removed category/condition filtering (not available in parts_silver schema)

### 2. Updated Server Endpoint (`server.js`)
- Changed `/api/databricks/parts` endpoint to query from `parts_silver` table
- Implemented intelligent data transformation based on data source:
  - **Databricks parts_silver**: Maps NSN, type, inventory_level, lat/long, etc.
  - **SQLite fallback**: Uses existing field mappings
- Added comprehensive field mapping for parts_silver schema

## Parts Silver Schema Mapping

| parts_silver Field | Part Interface Field | Notes |
|-------------------|---------------------|-------|
| `NSN` | `id`, `nsn` | National Stock Number (primary identifier) |
| `type` | `name` | Part type/name |
| `width` | `width` | Part width |
| `height` | `height` | Part height |
| `weight` | `weight` | Part weight |
| `cost` | `cost` | Part cost |
| `production_time` | `productionTime` | Production time in days |
| `sensors` | `sensors` | Array of sensor types |
| `stock_location` | `location` | Storage location name |
| `stock_location_id` | `stockLocationId` | Location identifier |
| `lat` | `latitude` | Warehouse latitude |
| `long` | `longitude` | Warehouse longitude |
| `inventory_level` | `stockLevel` | Current inventory |
| `provisioning_time` | `leadTime` | Lead time in days |

## Default Values

Since `parts_silver` doesn't include all fields required by the Part interface, the following defaults are used:

- `system`: "GTE System"
- `category`: "Rotating Parts"
- `minStock`: 5
- `maxStock`: 50
- `condition`: "New"
- `supplier`: "Navy Supply"
- `lastUpdated`: Current timestamp

## SQL Query

```sql
SELECT * FROM public_sector.predictive_maintenance_navy_test.parts_silver
```

### With Search Filter
```sql
SELECT * FROM public_sector.predictive_maintenance_navy_test.parts_silver
WHERE (type LIKE '%search%' OR NSN LIKE '%search%')
ORDER BY NSN ASC
LIMIT 1000
```

## Data Source Priority

1. **Primary**: Databricks `parts_silver` table
2. **Fallback**: Local SQLite `parts` table

The system automatically falls back to SQLite if:
- Databricks is unavailable
- Connection fails
- Query errors occur
- Environment is not production

## Sample Data

The `parts_silver` table includes parts like:
- Controller cards (ECU)
- Fuel pumps
- Turbine vanes and blades
- Fuel/oil valves and filters
- Seals and fuel nozzles

Each part record includes:
- Physical dimensions (width, height, weight)
- Cost and production time
- Associated sensors
- Stock location and inventory levels
- Geographic coordinates (lat/long)
- Provisioning time

## Testing

To test the integration:

1. **With Databricks** (production):
   ```bash
   NODE_ENV=production npm start
   ```
   Navigate to the Parts page - data should come from Databricks `parts_silver`

2. **Without Databricks** (development):
   ```bash
   npm run dev
   ```
   Navigate to the Parts page - data should fall back to SQLite

3. **Check Data Source**:
   - Look for notification in the UI indicating data source
   - Check browser console for "Successfully fetched parts from Databricks" or fallback messages
   - Network tab shows `/api/databricks/parts` response includes `source: "databricks"` or `source: "sqlite"`

## API Endpoint

**Endpoint**: `GET /api/databricks/parts`

**Query Parameters**:
- `limit`: Number of parts to return (default: 1000)
- `search`: Search by part type or NSN
- `category`: Filter by category (SQLite fallback only)
- `condition`: Filter by condition (SQLite fallback only)

**Response**:
```json
{
  "success": true,
  "items": [
    {
      "id": "15659385",
      "name": "controller card #1 - ECU",
      "nsn": "15659385",
      "stockLevel": 4,
      "location": "FLC San Diego",
      "cost": 3605.85,
      "latitude": 32.684722,
      "longitude": -117.13,
      "sensors": ["sensor_D"],
      "width": 656,
      "height": 1258,
      "weight": 51,
      "productionTime": 254,
      // ... other fields
    }
  ],
  "total": 45,
  "source": "databricks"
}
```

## Notes

- The `parts_silver` table contains inventory across multiple Fleet Logistics Centers (FLCs)
- Each NSN may have multiple entries for different stock locations
- Inventory levels and provisioning times are tracked per location
- The table includes geographic data for map-based visualizations

