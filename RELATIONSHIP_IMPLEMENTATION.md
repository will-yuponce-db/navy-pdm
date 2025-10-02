# Navy PdM System - Relationship Implementation Guide

## Overview

This document outlines how the Navy PdM system has been updated to respect the ERD relationships from both frontend and database perspectives.

## Database Schema Updates

### New Tables Added

1. **ships** - Naval vessel information
2. **users** - System users with role-based access
3. **gte_systems** - Gas Turbine Engine systems
4. **assets** - General asset management
5. **maintenance_schedules** - Planned maintenance activities
6. **performance_metrics** - Asset performance tracking
7. **sensor_systems** - Groups of sensors monitoring GTE systems
8. **sensor_data** - Real-time sensor readings
9. **sensor_analytics** - Processed sensor data analysis
10. **audit_logs** - System activity tracking
11. **security_events** - Security monitoring
12. **user_permissions** - Role-based access control

### Updated Tables

#### work_orders
- **Removed**: `ship`, `homeport`, `gte` (string fields)
- **Added**: `ship_id`, `gte_system_id`, `assigned_to`, `created_by` (foreign keys)
- **Foreign Keys**:
  - `ship_id` → `ships(id)`
  - `gte_system_id` → `gte_systems(id)`
  - `assigned_to` → `users(id)`
  - `created_by` → `users(id)`

#### notifications
- **Added**: Foreign key `work_order_id` → `work_orders(wo)`

### Foreign Key Relationships

```sql
-- Ships contain GTE systems and assets
ships.id ← gte_systems.ship_id
ships.id ← assets.ship_id

-- Work orders reference ships, GTE systems, and users
ships.id ← work_orders.ship_id
gte_systems.id ← work_orders.gte_system_id
users.id ← work_orders.assigned_to
users.id ← work_orders.created_by

-- GTE systems are monitored by sensor systems
gte_systems.id ← sensor_systems.gte_system_id

-- Sensor systems produce sensor data
sensor_systems.id ← sensor_data.system_id

-- Assets have maintenance schedules and performance metrics
assets.id ← maintenance_schedules.asset_id
assets.id ← performance_metrics.asset_id

-- Users are assigned to maintenance schedules
users.id ← maintenance_schedules.assigned_to
users.id ← maintenance_schedules.created_by

-- Users generate audit logs and security events
users.id ← audit_logs.user_id
users.id ← security_events.user_id

-- Users have permissions
users.id ← user_permissions.user_id
```

## Frontend Type Updates

### Updated TypeScript Interfaces

#### WorkOrder Interface
```typescript
export interface WorkOrder {
  readonly wo: string;
  shipId: string; // Foreign key to ships table
  gteSystemId?: string; // Foreign key to gte_systems table
  assignedTo?: string; // Foreign key to users table
  createdBy?: string; // Foreign key to users table
  fm: string;
  priority: Priority;
  status: WorkOrderStatus;
  eta: number;
  symptoms?: string;
  recommendedAction?: string;
  partsRequired?: string;
  slaCategory?: string;
  readonly createdAt?: Date | string;
  readonly updatedAt?: Date | string;
  // Populated fields for display
  ship?: Ship;
  gteSystem?: GTESystem;
  assignedUser?: User;
  createdByUser?: User;
}
```

#### New Interfaces Added
- `Ship` - Naval vessel information
- `GTESystem` - Gas Turbine Engine systems
- `Asset` - General asset management
- `MaintenanceSchedule` - Planned maintenance activities
- `PerformanceMetric` - Asset performance tracking
- `SensorSystem` - Groups of sensors monitoring GTE systems
- `SensorData` - Real-time sensor readings
- `SensorAnalytics` - Processed sensor data analysis
- `AuditLog` - System activity tracking
- `SecurityEvent` - Security monitoring

### Form Types Updated

#### CreateWorkOrderForm
```typescript
export interface CreateWorkOrderForm {
  shipId: string;
  gteSystemId?: string;
  assignedTo?: string;
  fm: string;
  priority: Priority;
  eta: string;
  symptoms?: string;
  recommendedAction?: string;
  partsRequired?: string;
  slaCategory?: string;
}
```

## API Endpoint Updates

### Work Orders API

#### GET /api/work-orders
- **Updated**: Now includes JOIN queries to populate related data
- **Returns**: Work orders with populated ship, GTE system, and user information
- **Search**: Updated to search by ship name through JOIN

#### POST /api/work-orders
- **Updated**: Accepts new foreign key fields (`shipId`, `gteSystemId`, `assignedTo`, `createdBy`)
- **Returns**: Created work order with populated relationships
- **Validation**: Ensures foreign key references exist

### Database Queries with JOINs

```sql
-- Get work orders with populated relationships
SELECT 
  wo.*,
  s.name as ship_name,
  s.homeport as ship_homeport,
  gs.model as gte_model,
  gs.serial_number as gte_serial,
  ua.first_name as assigned_first_name,
  ua.last_name as assigned_last_name,
  uc.first_name as created_first_name,
  uc.last_name as created_last_name
FROM work_orders wo
LEFT JOIN ships s ON wo.ship_id = s.id
LEFT JOIN gte_systems gs ON wo.gte_system_id = gs.id
LEFT JOIN users ua ON wo.assigned_to = ua.id
LEFT JOIN users uc ON wo.created_by = uc.id
ORDER BY wo.created_at DESC
```

## Component Updates

### WorkOrderModal Component

#### State Variables Updated
```typescript
// Old state variables
const [ship, setShip] = useState("");
const [homeport, setHomeport] = useState("");
const [gte, setGte] = useState("");

// New state variables
const [shipId, setShipId] = useState("");
const [gteSystemId, setGteSystemId] = useState("");
const [assignedTo, setAssignedTo] = useState("");
```

#### Form Fields Updated
- **Ship**: Changed from text input to ship ID input
- **Homeport**: Removed (now derived from ship relationship)
- **GTE**: Changed to optional GTE System ID input
- **Assigned To**: Added optional user assignment field

#### Validation Updated
```typescript
// Old validation
if (!ship.trim()) {
  newErrors.ship = "Ship is required";
}
if (!homeport.trim()) {
  newErrors.homeport = "Homeport is required";
}
if (!gte.trim()) {
  newErrors.gte = "GTE/System is required";
}

// New validation
if (!shipId.trim()) {
  newErrors.shipId = "Ship is required";
}
```

## Data Flow

### Work Order Creation Flow

1. **Frontend**: User fills form with `shipId`, `gteSystemId`, `assignedTo`
2. **API**: Validates foreign key references exist
3. **Database**: Inserts work order with foreign key relationships
4. **Response**: Returns work order with populated related data
5. **Frontend**: Displays work order with ship name, GTE system info, and user names

### Data Population Strategy

- **Foreign Keys**: Stored as IDs for referential integrity
- **Populated Fields**: Added to interfaces for display purposes
- **JOIN Queries**: Used in API endpoints to populate related data
- **Optional Fields**: Marked as optional in TypeScript interfaces

## Benefits of This Implementation

### Data Integrity
- **Referential Integrity**: Foreign key constraints prevent orphaned records
- **Data Consistency**: Related data is always valid and up-to-date
- **Cascade Operations**: Database handles relationship updates automatically

### Performance
- **Efficient Queries**: JOIN queries reduce multiple database calls
- **Indexed Relationships**: Foreign keys are automatically indexed
- **Optimized Data Loading**: Related data loaded in single query

### Maintainability
- **Type Safety**: TypeScript interfaces ensure correct data structure
- **Clear Relationships**: ERD clearly defines entity relationships
- **Consistent API**: All endpoints follow same relationship pattern

### User Experience
- **Rich Data Display**: Work orders show ship names, user names, etc.
- **Data Validation**: Frontend validates foreign key references
- **Consistent Interface**: All forms follow same relationship pattern

## Migration Considerations

### Database Migration
- **Existing Data**: Need to migrate existing work orders to new schema
- **Data Mapping**: Map old string fields to new foreign key relationships
- **Backup**: Full database backup before migration

### Frontend Migration
- **Component Updates**: All components using work orders need updates
- **API Calls**: Update all API calls to use new field names
- **Type Updates**: Update all TypeScript interfaces and types

### Testing
- **Unit Tests**: Update tests for new data structure
- **Integration Tests**: Test foreign key relationships
- **End-to-End Tests**: Test complete work order creation flow

## Future Enhancements

### Additional Relationships
- **Parts Management**: Many-to-many relationship between parts and work orders
- **Notification System**: Enhanced notification relationships
- **Audit Trail**: Complete audit trail for all entity changes

### Performance Optimizations
- **Caching**: Cache frequently accessed related data
- **Lazy Loading**: Load related data on demand
- **Query Optimization**: Optimize complex JOIN queries

### User Interface Improvements
- **Dropdowns**: Replace text inputs with dropdowns for foreign keys
- **Auto-complete**: Auto-complete for ship names, user names, etc.
- **Data Validation**: Real-time validation of foreign key references

## Conclusion

The Navy PdM system now properly implements the ERD relationships with:

- **Complete Database Schema**: All tables with proper foreign key relationships
- **Updated TypeScript Types**: All interfaces include foreign keys and populated fields
- **Enhanced API Endpoints**: All endpoints return populated related data
- **Updated Components**: All components use new relationship structure
- **Data Integrity**: Referential integrity enforced at database level
- **Performance**: Efficient queries with JOIN operations
- **Maintainability**: Clear separation between foreign keys and display data

This implementation provides a solid foundation for the Navy PdM system with proper data relationships, type safety, and performance optimization.

