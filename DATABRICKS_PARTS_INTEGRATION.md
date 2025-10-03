# Databricks Parts Integration Guide

## Overview

This document describes the integration of Databricks parts data from the `public_sector.predictive_maintenance_navy_test.parts_silver` table with the Navy PdM application's parts management system.

## Database Schema Updates

The `parts` table has been extended with the following Databricks-specific fields:

| Field | Type | Description |
|-------|------|-------------|
| `nsn` | TEXT | National Stock Number |
| `width` | INTEGER | Part width in mm |
| `height` | INTEGER | Part height in mm |
| `weight` | INTEGER | Part weight in grams |
| `production_time` | INTEGER | Production time in days |
| `sensors` | TEXT (JSON) | Associated sensor IDs as JSON array |
| `stock_location_id` | TEXT | Stock location identifier |
| `latitude` | REAL | GPS latitude coordinate |
| `longitude` | REAL | GPS longitude coordinate |

## TypeScript Interface

The `Part` interface in `app/types/index.ts` now includes optional Databricks fields:

```typescript
export interface Part {
  readonly id: string;
  name: string;
  system: string;
  category: PartCategory;
  stockLevel: number;
  minStock: number;
  maxStock: number;
  location: string;
  condition: PartCondition;
  leadTime: string;
  supplier: string;
  cost: number;
  lastUpdated?: string;
  // Databricks integration fields
  nsn?: string;
  width?: number;
  height?: number;
  weight?: number;
  productionTime?: number;
  sensors?: string[];
  stockLocationId?: string;
  latitude?: number;
  longitude?: number;
}
```

## Data Mapping

### Field Mapping from Databricks to Application

| Databricks Field | Application Field | Transformation |
|------------------|-------------------|----------------|
| `NSN` | `id` + `nsn` | Used in composite ID: `{NSN}-{stock_location_id}` |
| `type` | `name` | Direct mapping |
| `stock_available` | `stockLevel` | Direct mapping |
| `stock_location` | `location` | Direct mapping |
| `production_time` | `leadTime` + `productionTime` | Converted to "{days} days" format |
| `sensors` | `sensors` | Parsed from JSON string to array |
| `width`, `height`, `weight` | Direct mapping | Physical dimensions |
| `lat`, `long` | `latitude`, `longitude` | GPS coordinates |
| `stock_location_id` | `stockLocationId` | Direct mapping |

### Category Mapping

Part types from Databricks are mapped to standard categories:

```javascript
'Valve' → 'Fuel System'
'Filter' → 'Consumables'
'Vane' → 'Hot Section'
'Pump' → 'Hydraulics'
'Fuel Nozzle' → 'Fuel System'
'Seal' → 'Hot Section'
'Blade' → 'Rotating Parts'
'controller card' → 'Electronics'
```

### Condition Mapping

Part condition is determined based on stock and production time:

- `production_time === 0` → 'Condemned'
- `stock_available === 0` → 'Used'
- `stock_available > 7` → 'New'
- Otherwise → 'Refurbished'

## API Endpoints

### 1. Import/Sync Databricks Parts

**Endpoint:** `POST /api/parts/import/databricks`

**Request Body:**
```json
{
  "parts": [
    {
      "NSN": "87115871",
      "type": "Valve - Fuel / Oil",
      "width": 425,
      "height": 278,
      "weight": 4145,
      "stock_available": 9,
      "stock_location": "FLC San Diego",
      "production_time": 4,
      "sensors": ["sensor_D", "sensor_C"],
      "stock_location_id": "supply_5",
      "lat": 32.684722,
      "long": -117.13
    }
  ],
  "mode": "upsert"
}
```

**Modes:**
- `upsert` (default): Insert new parts or update existing ones
- `insert`: Only insert new parts (skip existing)
- `update`: Only update existing parts (skip new)

**Response:**
```json
{
  "message": "Import completed: 45 successful, 0 failed",
  "results": {
    "success": 45,
    "failed": 0,
    "updated": 20,
    "inserted": 25,
    "errors": []
  }
}
```

### 2. Get Parts with Databricks Fields

**Endpoint:** `GET /api/parts`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `category` - Filter by category
- `condition` - Filter by condition
- `search` - Search by name, ID, supplier, or location

**Response:**
```json
{
  "items": [
    {
      "id": "87115871-supply_5",
      "name": "Valve - Fuel / Oil",
      "system": "LM2500",
      "category": "Fuel System",
      "stockLevel": 9,
      "minStock": 2,
      "maxStock": 18,
      "location": "FLC San Diego",
      "condition": "New",
      "leadTime": "4 days",
      "supplier": "FLC San Diego",
      "cost": 8290,
      "lastUpdated": "2025-10-02T...",
      "nsn": "87115871",
      "width": 425,
      "height": 278,
      "weight": 4145,
      "productionTime": 4,
      "sensors": ["sensor_D", "sensor_C"],
      "stockLocationId": "supply_5",
      "latitude": 32.684722,
      "longitude": -117.13
    }
  ],
  "total": 45,
  "page": 1,
  "pageSize": 50,
  "hasNext": false,
  "hasPrevious": false
}
```

## Usage Examples

### 1. Import CSV Data Using Test Script

```bash
# Navigate to the project directory
cd navy-pdm

# Run the import test script
node test-databricks-parts-import.js
```

### 2. Import Using curl

```bash
curl -X POST http://localhost:3000/api/parts/import/databricks \
  -H "Content-Type: application/json" \
  -d '{
    "parts": [
      {
        "NSN": "87115871",
        "type": "Valve - Fuel / Oil",
        "width": 425,
        "height": 278,
        "weight": 4145,
        "stock_available": 9,
        "stock_location": "FLC San Diego",
        "production_time": 4,
        "sensors": "[\"sensor_D\",\"sensor_C\"]",
        "stock_location_id": "supply_5",
        "lat": 32.684722,
        "long": -117.13
      }
    ],
    "mode": "upsert"
  }'
```

### 3. Fetch Parts with Sensors

```bash
curl http://localhost:3000/api/parts?search=sensor_D
```

### 4. Using TypeScript Mapper Utilities

```typescript
import { 
  mapDatabricksPartToPart, 
  mapDatabricksPartsToParts,
  getDatabricksPartsStats 
} from './app/utils/databricksMapper';

// Map single part
const databricksPart = {
  NSN: "87115871",
  type: "Valve - Fuel / Oil",
  width: 425,
  height: 278,
  weight: 4145,
  stock_available: 9,
  stock_location: "FLC San Diego",
  production_time: 4,
  sensors: '["sensor_D","sensor_C"]',
  stock_location_id: "supply_5",
  lat: 32.684722,
  long: -117.13
};

const part = mapDatabricksPartToPart(databricksPart);

// Map multiple parts
const parts = mapDatabricksPartsToParts(databricksPartsArray);

// Get statistics
const stats = getDatabricksPartsStats(databricksPartsArray);
console.log(stats);
// Output:
// {
//   total: 45,
//   totalStock: 234,
//   outOfStock: 2,
//   lowStock: 5,
//   averageStock: 5.2,
//   byLocation: { "FLC San Diego": 10, ... },
//   byType: { "Valve - Fuel / Oil": 5, ... },
//   bySensors: { "sensor_A": 15, ... },
//   averageWeight: 9876.5,
//   averageProductionTime: 2.8
// }
```

## CSV Import Format

The import script accepts CSV data in the following format:

```csv
NSN,type,width,height,weight,stock_available,stock_location,production_time,sensors,stock_location_id,lat,long
87115871,Valve - Fuel / Oil,425,278,4145,9,FLC San Diego,4,"[""sensor_D"",""sensor_C""]",supply_5,32.684722,-117.13
```

**Notes:**
- Sensors field should be a JSON array string with escaped quotes
- Numeric fields (width, height, weight, stock_available, production_time) are integers
- Coordinates (lat, long) are floating-point numbers
- Empty or missing optional fields are handled gracefully

## Features

### 1. Smart ID Generation
Parts are assigned unique IDs using: `{NSN}-{stock_location_id}`

This ensures:
- Same NSN at different locations are tracked separately
- Unique identification across the system
- Easy correlation with Databricks source data

### 2. Automatic Stock Level Calculation
Min and max stock levels are automatically calculated:
- `minStock = floor(stockLevel * 0.3)`
- `maxStock = ceil(stockLevel * 2)`

### 3. Cost Estimation
Part costs are estimated based on weight:
- `cost = max(100, weight * 2)`

This provides reasonable default values that can be updated later.

### 4. Sensor Association
Parts are linked to sensors that monitor them, enabling:
- Predictive maintenance based on sensor readings
- Correlation between sensor alerts and part requirements
- Targeted work order parts recommendations

### 5. Geographic Tracking
Latitude and longitude coordinates enable:
- Mapping of part locations
- Distance calculations for logistics
- Supply chain optimization

## Database Migration

If you have an existing database, you need to add the new columns:

```sql
ALTER TABLE parts ADD COLUMN nsn TEXT;
ALTER TABLE parts ADD COLUMN width INTEGER;
ALTER TABLE parts ADD COLUMN height INTEGER;
ALTER TABLE parts ADD COLUMN weight INTEGER;
ALTER TABLE parts ADD COLUMN production_time INTEGER;
ALTER TABLE parts ADD COLUMN sensors TEXT;
ALTER TABLE parts ADD COLUMN stock_location_id TEXT;
ALTER TABLE parts ADD COLUMN latitude REAL;
ALTER TABLE parts ADD COLUMN longitude REAL;
```

Alternatively, delete the database and let it reinitialize with the new schema:

```bash
rm backend/instance/navy_pdm.db
npm run start
```

## Testing

### Run the Import Test

```bash
# Start the server
npm run start

# In another terminal, run the test script
node test-databricks-parts-import.js
```

Expected output:
```
=== Databricks Parts Import Test ===

Parsing CSV data...
Parsed 45 parts from CSV

Sample part:
{
  "NSN": "87115871",
  "type": "Valve - Fuel / Oil",
  ...
}

Sending import request...

Import results:
{
  "message": "Import completed: 45 successful, 0 failed",
  "results": {
    "success": 45,
    "failed": 0,
    "updated": 0,
    "inserted": 45,
    "errors": []
  }
}

Verifying imported parts...

Sample imported parts:
- 87115871-supply_5: Valve - Fuel / Oil (NSN: 87115871, Stock: 9, Location: FLC San Diego)
  Sensors: sensor_D, sensor_C
  Coordinates: 32.684722, -117.13
```

## Troubleshooting

### Issue: Import fails with "Parts must be an array"
**Solution:** Ensure the request body has a `parts` array field.

### Issue: Sensors not parsing correctly
**Solution:** Ensure sensors are in JSON array format: `["sensor_A", "sensor_B"]`

### Issue: Database schema error
**Solution:** Delete and reinitialize the database or run ALTER TABLE commands.

### Issue: Cost values seem incorrect
**Solution:** Update the cost estimation logic in the import endpoint or manually update costs after import.

## Next Steps

1. **Enhance UI**: Add columns to the PartsTable component to display Databricks fields
2. **Add Filters**: Filter parts by sensor, location, or dimensions
3. **Mapping View**: Create a map view showing part locations using lat/long
4. **Sensor Integration**: Link sensor alerts to parts recommendations
5. **Analytics**: Create dashboards for parts statistics and supply chain insights

## Related Files

- `server.js` - Database schema and import endpoint (lines 355-380, 1548-1696)
- `app/types/index.ts` - Part interface definition (lines 100-124)
- `app/utils/databricksMapper.ts` - Mapping utilities (lines 242-406)
- `test-databricks-parts-import.js` - Import test script
- `DATABRICKS_SETUP.md` - General Databricks configuration

## Support

For questions or issues with the parts integration, refer to:
- `IMPLEMENTATION_SUMMARY.md` - Overall system architecture
- `DATABRICKS_AI_WORKORDERS.md` - Work orders integration
- `TROUBLESHOOTING.md` - Common issues and solutions




