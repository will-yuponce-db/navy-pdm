# Reorder & Supply Requisition Feature

## Overview

The Inventory page now has full functionality to submit supply requisitions when reordering parts. When a part's stock is Critical or Low, clicking the "Reorder" button creates an actual supply order entry that can be viewed in the Supply Orders tab.

## Changes Made

### 1. **Frontend API Client** (`app/services/api.ts`)
Added a new API method to create supply requisitions:

```typescript
createPartsRequisition: async (requisitionData: {
  partType: string;
  quantityShipped: number;
  stockLocationId?: string;
  stockLocation: string;
  designatorId?: string;
  designator: string;
  orderNumber?: string;
}): Promise<{ 
  success: boolean; 
  data: unknown;
  message?: string;
}>
```

**Endpoint**: `POST /api/parts-requisitions`

### 2. **Redux Parts Slice** (`app/redux/services/partsSlice.tsx`)
Updated `reorderPartWithNotification` thunk to:
- Generate a unique order number (`PR-XXXXXX`)
- Create a supply requisition with part details
- Submit to the backend API
- Show success notification with order number
- Handle errors gracefully with fallback notification

**Key Logic**:
```typescript
const orderNumber = `PR-${Date.now().toString().slice(-6)}`;

const requisitionData = {
  partType: part.name,
  quantityShipped: quantity,
  stockLocationId: part.stockLocationId || 'supply_1',
  stockLocation: part.location,
  designatorId: part.id,
  designator: `${part.system} System`,
  orderNumber: orderNumber,
};

await databricksApi.createPartsRequisition(requisitionData);
```

### 3. **Backend API** (`server.js`)
Added POST endpoint to create supply requisitions:

**Route**: `POST /api/parts-requisitions`

**Features**:
- Validates required fields (partType, quantityShipped, stockLocation, designator)
- Parses ship name and designation from designator string
- Generates unique ID and order number if not provided
- Inserts into `parts_requisitions` SQLite table
- Returns created requisition with confirmation message

**Request Body**:
```json
{
  "partType": "Turbine Blade Set",
  "quantityShipped": 10,
  "stockLocationId": "supply_1",
  "stockLocation": "Norfolk Supply Depot",
  "designatorId": "LM2500-TRB-001",
  "designator": "LM2500 System",
  "orderNumber": "PR-123456"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "PR-123456-LM2500-TRB-001-Turbine Blade Set",
    "order_number": "PR-123456",
    "part_type": "Turbine Blade Set",
    "quantity_shipped": 10,
    "stock_location": "Norfolk Supply Depot",
    "ship_name": "LM2500",
    "ship_designation": "System",
    "created_at": "2025-10-03T12:00:00.000Z"
  },
  "message": "Supply order PR-123456 created successfully",
  "source": "sqlite"
}
```

## User Flow

### From Inventory Page

1. **User navigates to Inventory** (`/parts`)
2. **Identifies low/critical stock items** (shown with warning/error chips)
3. **Clicks "Reorder" button** on a low-stock part
4. **System automatically**:
   - Calculates reorder quantity (min: 2x minStock or 10 units)
   - Generates unique order number
   - Creates supply requisition in database
   - Shows success notification with order number
5. **User can view the order** by navigating to "Supply Orders" tab

### Notification Examples

**Success**:
```
Supply Order Created
Supply order PR-123456 created for 10 units of Turbine Blade Set 
from Norfolk Supply Depot. View in Supply Orders tab.
```

**Fallback (if backend unavailable)**:
```
Reorder Request Pending
Reorder request for 10 units of Turbine Blade Set is pending. 
Backend connection required to create supply order.
```

## Database Schema

The supply orders are stored in the `parts_requisitions` table:

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

## Integration Points

### Parts Table Component
- **Location**: `app/components/PartsTable.tsx`
- **Function**: `handleReorderClick(part: Part)` (line 106)
- **Trigger**: "Reorder" button visible when `stockStatus === "Critical" || stockStatus === "Low"`

### Supply Orders Page
- **Location**: `app/routes/parts-requisition.tsx`
- **Purpose**: Displays all supply orders including newly created ones
- **Features**: Filtering, search, export to CSV

## Testing

### 1. Start the backend server
```bash
# In one terminal
npm run dev
```

### 2. Navigate to Inventory
- Go to http://localhost:5173/parts
- Find a part with Critical or Low stock status

### 3. Test Reorder
- Click the "Reorder" button
- Observe the notification
- Check the browser console for logs

### 4. Verify in Supply Orders
- Navigate to "Supply Orders" tab (`/parts-requisition`)
- Search for the order number (e.g., "PR-123456")
- Verify the order appears in the table

### 5. Check Database
```bash
sqlite3 backend/instance/navy_pdm.db
SELECT * FROM parts_requisitions ORDER BY created_at DESC LIMIT 5;
```

## Example Usage

### Reorder Critical Stock Part

1. **Part**: Temperature Sensor
2. **Current Stock**: 1 unit (Critical - below min of 5)
3. **Action**: Click "Reorder"
4. **Result**: 
   - Order created: PR-736491
   - Quantity: 10 units (2x minStock)
   - Location: Pearl Harbor Supply
   - Notification: "Supply order PR-736491 created for 10 units of Temperature Sensor from Pearl Harbor Supply. View in Supply Orders tab."

## Error Handling

### Backend Unavailable
If the backend API is not running or returns an error:
- Graceful fallback with warning notification
- User informed that backend connection is required
- No data loss - request can be retried

### Validation Errors
If required fields are missing:
- 400 Bad Request response
- Clear error message identifying missing fields
- Request can be corrected and resubmitted

### Database Errors
If SQLite encounters an error:
- 500 Internal Server Error response
- Error logged to console
- User informed of technical issue

## Future Enhancements

1. **Approval Workflow**: Add approval status for requisitions
2. **Email Notifications**: Send email to suppliers
3. **Order Tracking**: Add status updates (Pending, Approved, Shipped, Delivered)
4. **Batch Ordering**: Reorder multiple parts at once
5. **Supplier Integration**: Direct integration with supplier systems
6. **Cost Tracking**: Track estimated vs actual costs
7. **Delivery Scheduling**: Schedule delivery dates
8. **Automatic Reordering**: Auto-reorder when stock hits minimum

## Benefits

✅ **Automated**: No manual order entry required  
✅ **Traceable**: All orders recorded with unique numbers  
✅ **Integrated**: Seamless between Inventory and Supply Orders  
✅ **Notified**: Users get immediate confirmation  
✅ **Auditable**: Full history in database  
✅ **Efficient**: Reduces time from identification to order  

## Summary

The reorder functionality is now fully operational and creates actual supply requisitions that can be tracked and managed through the Supply Orders page. Users can quickly reorder low-stock items with a single click, and all orders are properly recorded in the database with automatic notifications.

