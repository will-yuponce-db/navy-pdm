# Parts Requisition Integration

## Overview

Successfully integrated the Databricks `public_sector.predictive_maintenance_navy_test.ai_part_orders` table into the Navy PdM application, enabling tracking of AI-generated parts orders and shipments across the fleet.

## Files Created/Modified

### 1. Data Transformation Layer

#### `app/utils/databricksMapper.ts`
- **Added Interfaces:**
  - `DatabricksPartsRequisition` - Databricks table schema
  - `PartsRequisition` - Application data type
  
- **Added Functions:**
  - `mapDatabricksPartsRequisitionToPartsRequisition()` - Transform single record
  - `mapDatabricksPartsRequisitionsToPartsRequisitions()` - Transform array
  - `getDatabricksPartsRequisitionStats()` - Calculate statistics
  - `parseDesignator()` - Parse ship name and designation

### 2. Backend Service Layer

#### `app/services/databricks.ts`
- **Added Functions:**
  - `getPartsRequisitions()` - Query parts requisitions with optional filtering (partType, stockLocation, designator, orderNumber, pagination)
  - `getPartsRequisitionByOrderNumber()` - Retrieve parts by order number
  - `getPartsRequisitionsByDesignatorId()` - Retrieve parts for a specific ship

### 3. Frontend API Layer

#### `app/services/api.ts`
- **Added to `databricksApi` object:**
  - `getPartsRequisitions()` - Fetch parts requisitions from backend API
  - `getPartsRequisitionByOrderNumber()` - Fetch by order number
  - `getPartsRequisitionsByDesignatorId()` - Fetch by ship designator ID

### 4. UI Route

#### `app/routes/parts-requisition.tsx` (NEW FILE)
- Complete parts requisition page with:
  - Statistics dashboard (total requisitions, unique orders, part types, total parts shipped)
  - Advanced filtering (search, part type, stock location)
  - Data table with pagination
  - Export to CSV functionality
  - Responsive Material-UI design

### 5. Navigation

#### `app/constants/navItems.ts`
- Added "Parts Requisition" to all navigation menus:
  - Base navigation (icon: `receipt_long`)
  - SPO-specific navigation
  - Maintainer-specific navigation

### 6. Route Configuration

#### `app/routes.ts`
- Added route: `/parts-requisition` → `routes/parts-requisition.tsx`

### 7. Database Seeding

#### `api/seed.js`
- **Created Table:** `parts_requisitions`
  - Fields: id, order_number, part_type, quantity_shipped, stock_location_id, stock_location, designator_id, designator, ship_name, ship_designation, created_at
- **Seed Data:** 27 sample parts requisitions from various ships and locations

## Data Mapping

### Databricks Schema → Application Type

| Databricks Column | Application Field | Mapping |
|------------------|------------------|---------|
| `stock_location_id` | `stockLocationId` | Direct mapping |
| `designator_id` | `designatorId` | Direct mapping |
| `type` | `partType` | Direct mapping |
| `qty_shipped` | `quantityShipped` | Direct mapping |
| `stock_location` | `stockLocation` | Direct mapping |
| `designator` | `designator` | Direct mapping |
| `order_number` | `orderNumber` | Direct mapping |
| N/A | `id` | Generated: `{orderNumber}-{designatorId}-{partType}` |
| N/A | `shipName` | Parsed from designator |
| N/A | `shipDesignation` | Parsed from designator (DDG-XX) |

### Ship Designator Parsing

The designator field (e.g., "USS Frank E. Petersen, Jr. (DDG-121)") is parsed into:
- **Ship Name**: "USS Frank E. Petersen, Jr."
- **Ship Designation**: "DDG-121"

## Features

### 1. Statistics Dashboard
- **Total Requisitions**: Count of all parts requisitions
- **Unique Orders**: Number of distinct order numbers
- **Part Types**: Count of different part types
- **Total Parts Shipped**: Sum of all quantities

### 2. Filtering & Search
- **Search**: Search by order number, ship name, part type, or stock location
- **Part Type Filter**: Dropdown to filter by specific part types
- **Stock Location Filter**: Dropdown to filter by FLC locations
- Real-time client-side filtering

### 3. Data Display
- Sortable, paginated table
- Color-coded chips for orders, quantities, and locations
- Highlight quantities > 1 with warning color
- Responsive design for mobile/tablet/desktop

### 4. Data Export
- Export filtered data to CSV
- Includes all visible columns
- Automatic filename with timestamp

## API Endpoints

### Databricks API Endpoints (to be implemented on backend)

#### GET `/api/databricks/parts-requisitions`
Query parts requisitions with optional filters.

**Query Parameters:**
- `limit` (number) - Maximum records to return
- `offset` (number) - Pagination offset
- `partType` (string) - Filter by part type
- `stockLocation` (string) - Filter by stock location
- `designator` (string) - Filter by ship designator
- `orderNumber` (string) - Filter by order number

**Example:**
```bash
curl "http://localhost:8000/api/databricks/parts-requisitions?limit=50&partType=Filter%20-%20Fuel%20/%20Oil"
```

#### GET `/api/databricks/parts-requisitions/:orderNumber`
Fetch all parts for a specific order number.

**Example:**
```bash
curl "http://localhost:8000/api/databricks/parts-requisitions/PR-000003"
```

#### GET `/api/databricks/parts-requisitions/ship/:designatorId`
Fetch all parts requisitions for a specific ship.

**Example:**
```bash
curl "http://localhost:8000/api/databricks/parts-requisitions/ship/1445245338"
```

## Database Query

### Databricks SQL Query
```sql
SELECT * FROM public_sector.predictive_maintenance_navy_test.ai_part_orders
ORDER BY order_number DESC
```

### With Filters
```sql
SELECT * FROM public_sector.predictive_maintenance_navy_test.ai_part_orders
WHERE type = 'Filter - Fuel / Oil'
  AND stock_location = 'FLC Jacksonville'
ORDER BY order_number DESC
LIMIT 50 OFFSET 0
```

## SQLite Database

### Table Schema
```sql
CREATE TABLE IF NOT EXISTS parts_requisitions (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL,
  part_type TEXT NOT NULL,
  quantity_shipped INTEGER NOT NULL,
  stock_location_id TEXT NOT NULL,
  stock_location TEXT NOT NULL,
  designator_id TEXT NOT NULL,
  designator TEXT NOT NULL,
  ship_name TEXT NOT NULL,
  ship_designation TEXT NOT NULL,
  created_at TEXT NOT NULL
)
```

### Sample Data
The seed script includes 27 sample requisitions covering:
- **Part Types**: Filter - Fuel / Oil, Seal, Vane - Turbine, controller card #2 - ECU, Blade - Turbine, Fuel Nozzle, Valve - Fuel / Oil, Pump - Fuel, controller card #1 - ECU
- **Locations**: FLC Jacksonville, FLC Norfolk, FLC Pearl Harbor, FLC Puget Sound, FLC San Diego
- **Ships**: Various DDG-class destroyers
- **Orders**: PR-000001 through PR-000041

## Usage

### Frontend Component Usage

```typescript
import { databricksApi } from '../services/api';
import {
  mapDatabricksPartsRequisitionsToPartsRequisitions,
  getDatabricksPartsRequisitionStats
} from '../utils/databricksMapper';

// Fetch all parts requisitions
const response = await databricksApi.getPartsRequisitions({ limit: 100 });
const requisitions = mapDatabricksPartsRequisitionsToPartsRequisitions(response.data);

// Get statistics
const stats = getDatabricksPartsRequisitionStats(response.data);
console.log(`Total orders: ${stats.uniqueOrders}`);
console.log(`Total parts: ${stats.totalQuantity}`);

// Fetch by order number
const orderResponse = await databricksApi.getPartsRequisitionByOrderNumber('PR-000003');

// Fetch by ship
const shipResponse = await databricksApi.getPartsRequisitionsByDesignatorId('1445245338');
```

## Navigation

The Parts Requisition tab appears in the navigation menu with:
- **Icon**: `receipt_long` (Material-UI icon)
- **Title**: "Parts Requisition"
- **Route**: `/parts-requisition`

## Testing

### 1. Re-seed Database
```bash
node api/seed.js
```

### 2. Start Application
```bash
npm run dev
```

### 3. Navigate to Parts Requisition
- Open browser to http://localhost:5173
- Click "Parts Requisition" in the navigation menu
- Verify data loads and displays correctly
- Test filters and search functionality
- Test export to CSV

### 4. Test API Endpoints (when backend implemented)
```bash
# List all requisitions
curl http://localhost:8000/api/databricks/parts-requisitions

# Filter by part type
curl "http://localhost:8000/api/databricks/parts-requisitions?partType=Fuel%20Nozzle"

# Get specific order
curl http://localhost:8000/api/databricks/parts-requisitions/PR-000003
```

## Next Steps

### Backend API Implementation
The backend API endpoints need to be implemented in the server to handle the `/api/databricks/parts-requisitions` routes. These should follow the same pattern as the existing databricks endpoints for AI work orders and ship status.

Example implementation pattern (to be added to server):
```javascript
// GET /api/databricks/parts-requisitions
app.get('/api/databricks/parts-requisitions', async (req, res) => {
  try {
    const { limit, offset, partType, stockLocation, designator, orderNumber } = req.query;
    const result = await databricks.getPartsRequisitions({
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      partType,
      stockLocation,
      designator,
      orderNumber
    });
    res.json({
      success: true,
      data: result,
      total: result.length,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

## Summary

The Parts Requisition feature is now fully integrated into the Navy PdM application with:
- ✅ Complete data mapping and transformation
- ✅ Frontend API client methods
- ✅ Backend Databricks query functions
- ✅ Full-featured UI with filtering, search, and export
- ✅ Navigation menu integration
- ✅ SQLite mock database with seed data
- ✅ Route configuration
- ✅ Material-UI design consistent with the rest of the app
- ⏳ Backend API endpoint implementation (follows existing patterns)

