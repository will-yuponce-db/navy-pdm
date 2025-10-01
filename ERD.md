# Navy PdM System - Entity Relationship Diagram

```mermaid
erDiagram
    WORK_ORDERS {
        string wo PK "Work Order ID"
        string ship_id FK "Ship ID"
        string gte_system_id FK "GTE System ID"
        string assigned_to FK "Assigned User ID"
        string created_by FK "Created By User ID"
        string fm "Failure Mode"
        string priority "Priority Level"
        string status "Status"
        integer eta "Estimated Time of Arrival (days)"
        string symptoms "Symptoms Description"
        string recommended_action "Recommended Action"
        string parts_required "Required Parts"
        string sla_category "SLA Category"
        datetime created_at "Created At"
        datetime updated_at "Updated At"
    }

    PARTS {
        string id PK "Part ID"
        string name "Part Name"
        string system "System Type"
        string category "Part Category"
        integer stock_level "Current Stock Level"
        integer min_stock "Minimum Stock Level"
        integer max_stock "Maximum Stock Level"
        string location "Storage Location"
        string condition "Part Condition"
        string lead_time "Lead Time"
        string supplier "Supplier"
        real cost "Part Cost"
        datetime last_updated "Last Updated"
    }

    NOTIFICATIONS {
        string id PK "Notification ID"
        string type "Notification Type"
        string title "Title"
        string message "Message"
        datetime timestamp "Timestamp"
        string priority "Priority Level"
        string category "Category"
        boolean read "Read Status"
        string work_order_id FK "Related Work Order"
    }

    USERS {
        string id PK "User ID"
        string email "Email Address"
        string first_name "First Name"
        string last_name "Last Name"
        string role "User Role"
        string homeport "Homeport"
        string department "Department"
        boolean is_active "Active Status"
        datetime last_login "Last Login"
        datetime created_at "Created At"
        datetime updated_at "Updated At"
    }

    SHIPS {
        string id PK "Ship ID"
        string name "Ship Name"
        string designation "Designation"
        string class "Ship Class"
        string homeport "Homeport"
        string status "Ship Status"
    }

    GTE_SYSTEMS {
        string id PK "GTE System ID"
        string model "Engine Model"
        string serial_number "Serial Number"
        date install_date "Installation Date"
        string status "System Status"
        integer hours_operation "Operating Hours"
        date last_maintenance "Last Maintenance"
        date next_maintenance "Next Maintenance"
        string ship_id FK "Associated Ship"
    }

    SENSOR_SYSTEMS {
        string id PK "Sensor System ID"
        string name "System Name"
        string type "System Type"
        string location "Location"
        string status "System Status"
        date last_maintenance "Last Maintenance"
        date next_maintenance "Next Maintenance"
        string gte_system_id FK "Associated GTE System"
    }

    SENSOR_DATA {
        string id PK "Sensor Data ID"
        string sensor_id "Sensor Identifier"
        string sensor_name "Sensor Name"
        string sensor_type "Sensor Type"
        real value "Sensor Value"
        string unit "Measurement Unit"
        datetime timestamp "Timestamp"
        string status "Sensor Status"
        string location "Sensor Location"
        string system_id FK "Associated System"
    }

    SENSOR_ANALYTICS {
        string sensor_id PK "Sensor ID"
        string time_range "Time Range"
        real average_value "Average Value"
        real min_value "Minimum Value"
        real max_value "Maximum Value"
        string trend "Trend Direction"
        integer anomalies "Anomaly Count"
        real efficiency "Efficiency Percentage"
    }

    AUDIT_LOGS {
        string id PK "Audit Log ID"
        string user_id FK "User ID"
        string action "Action Performed"
        string resource "Resource Type"
        string resource_id "Resource ID"
        string changes "Changes Made"
        datetime timestamp "Timestamp"
        string ip_address "IP Address"
    }

    SECURITY_EVENTS {
        string id PK "Security Event ID"
        string type "Event Type"
        string user_id FK "User ID"
        string ip_address "IP Address"
        string user_agent "User Agent"
        datetime timestamp "Timestamp"
        string details "Event Details"
    }

    USER_PERMISSIONS {
        string user_id PK,FK "User ID"
        string permission PK "Permission"
    }

    ASSETS {
        string id PK "Asset ID"
        string name "Asset Name"
        string type "Asset Type"
        string status "Asset Status"
        string location "Asset Location"
        string serial_number "Serial Number"
        date install_date "Installation Date"
        date last_inspection "Last Inspection"
        date next_inspection "Next Inspection"
        string ship_id FK "Associated Ship"
    }

    MAINTENANCE_SCHEDULES {
        string id PK "Schedule ID"
        string asset_id FK "Asset ID"
        string assigned_to FK "Assigned User ID"
        string created_by FK "Created By User ID"
        string maintenance_type "Maintenance Type"
        date scheduled_date "Scheduled Date"
        string status "Schedule Status"
        string description "Description"
        integer estimated_hours "Estimated Hours"
        datetime created_at "Created At"
        datetime updated_at "Updated At"
    }

    PERFORMANCE_METRICS {
        string id PK "Metric ID"
        string asset_id FK "Asset ID"
        string metric_type "Metric Type"
        real value "Metric Value"
        string unit "Unit"
        datetime timestamp "Timestamp"
        string status "Status"
    }

    %% Relationships
    %% Core Work Order Relationships
    WORK_ORDERS ||--o{ NOTIFICATIONS : "generates"
    SHIPS ||--o{ WORK_ORDERS : "has_work_orders"
    GTE_SYSTEMS ||--o{ WORK_ORDERS : "requires_maintenance"
    USERS ||--o{ WORK_ORDERS : "assigned_to_work"
    USERS ||--o{ WORK_ORDERS : "creates_work_orders"
    
    %% Fleet Management Relationships
    SHIPS ||--o{ GTE_SYSTEMS : "contains"
    SHIPS ||--o{ ASSETS : "contains"
    
    %% Sensor Monitoring Relationships
    GTE_SYSTEMS ||--o{ SENSOR_SYSTEMS : "monitored_by"
    SENSOR_SYSTEMS ||--o{ SENSOR_DATA : "produces"
    SENSOR_DATA ||--|| SENSOR_ANALYTICS : "analyzed_by"
    
    %% Maintenance Management Relationships
    ASSETS ||--o{ MAINTENANCE_SCHEDULES : "scheduled_for"
    ASSETS ||--o{ PERFORMANCE_METRICS : "tracks"
    USERS ||--o{ MAINTENANCE_SCHEDULES : "assigned_to_maintenance"
    USERS ||--o{ MAINTENANCE_SCHEDULES : "creates_schedules"
    
    %% Parts Management Relationships
    PARTS }o--o{ WORK_ORDERS : "used_in"
    
    %% User Management Relationships
    USERS ||--o{ AUDIT_LOGS : "performs"
    USERS ||--o{ SECURITY_EVENTS : "triggers"
    USERS ||--o{ USER_PERMISSIONS : "has"
```

## Entity Descriptions

### Core Entities

**WORK_ORDERS**: Central entity tracking maintenance work orders for gas turbine engines
- Primary key: `wo` (Work Order ID)
- Foreign keys: `ship_id`, `gte_system_id`, `assigned_to`, `created_by`
- Tracks failure mode, priority, status, and maintenance details
- Links to ships, GTE systems, users, parts, and notifications

**PARTS**: Inventory management for maintenance parts
- Primary key: `id` (Part ID)
- Tracks stock levels, suppliers, costs, and locations
- Categorized by system type and part category

**NOTIFICATIONS**: Alert system for critical events
- Primary key: `id` (Notification ID)
- Links to work orders for context
- Categorized by type, priority, and category

### Fleet Management

**SHIPS**: Naval vessel information
- Primary key: `id` (Ship ID)
- Contains multiple GTE systems and assets
- Tracks homeport and operational status

**GTE_SYSTEMS**: Gas Turbine Engine systems
- Primary key: `id` (GTE System ID)
- Belongs to ships
- Tracks maintenance schedules and operating hours

**ASSETS**: General asset management for ships
- Primary key: `id` (Asset ID)
- Belongs to ships
- Tracks asset status, inspections, and maintenance

### Sensor Monitoring

**SENSOR_SYSTEMS**: Groups of sensors monitoring GTE systems
- Primary key: `id` (Sensor System ID)
- Associated with GTE systems
- Tracks system status and maintenance

**SENSOR_DATA**: Real-time sensor readings
- Primary key: `id` (Sensor Data ID)
- Produced by sensor systems
- Contains timestamped measurements

**SENSOR_ANALYTICS**: Processed sensor data analysis
- Primary key: `sensor_id` (Sensor ID)
- One-to-one with sensor data
- Contains trend analysis and anomaly detection

### Maintenance Management

**MAINTENANCE_SCHEDULES**: Planned maintenance activities
- Primary key: `id` (Schedule ID)
- Foreign keys: `asset_id`, `assigned_to`, `created_by`
- Links to assets and assigned users
- Tracks scheduled maintenance tasks and assignments

**PERFORMANCE_METRICS**: Asset performance tracking
- Primary key: `id` (Metric ID)
- Links to assets
- Tracks various performance indicators

### Security & Audit

**USERS**: System users with role-based access
- Primary key: `id` (User ID)
- Has permissions and generates audit logs
- Tracks login history and activity

**AUDIT_LOGS**: System activity tracking
- Primary key: `id` (Audit Log ID)
- Links to users and resources
- Records all system changes

**SECURITY_EVENTS**: Security monitoring
- Primary key: `id` (Security Event ID)
- Links to users
- Tracks security-related events

**USER_PERMISSIONS**: Role-based access control
- Composite primary key: `user_id`, `permission`
- Many-to-many relationship between users and permissions

## Key Relationships

### Core Work Order Relationships
1. **Work Orders** generate **Notifications** for critical events
2. **Ships** have multiple **Work Orders** for maintenance needs
3. **GTE Systems** require **Work Orders** when maintenance is needed
4. **Users** are assigned to **Work Orders** and create them
5. **Parts** are used in **Work Orders** (many-to-many relationship)

### Fleet Management Relationships
6. **Ships** contain multiple **GTE Systems** and **Assets**
7. **GTE Systems** are monitored by **Sensor Systems**
8. **Sensor Systems** produce **Sensor Data**
9. **Sensor Data** is analyzed to create **Sensor Analytics**

### Maintenance Management Relationships
10. **Assets** have **Maintenance Schedules** and **Performance Metrics**
11. **Users** are assigned to **Maintenance Schedules** and create them
12. **Users** perform actions that generate **Audit Logs**

### User Management Relationships
13. **Users** have **Permissions** for system access
14. **Users** trigger **Security Events** through system interactions
15. **Users** are tracked through **Audit Logs** for all system activities

## Database Schema Notes

### Current Implementation
- **SQLite Database**: `navy_pdm.db` located in `backend/instance/`
- **Tables**: `work_orders`, `parts`, `notifications`
- **Server**: Node.js/Express with SQLite3
- **Frontend**: React with TypeScript

### TypeScript Types
The application defines comprehensive TypeScript interfaces in `app/types/index.ts`:
- `WorkOrder`, `Part`, `Notification`, `User`
- `Ship`, `GTESystem`, `Asset`
- `SensorData`, `SensorSystem`, `SensorAnalytics`
- `MaintenanceSchedule`, `PerformanceMetrics`
- `AuditLog`, `SecurityEvent`

### Sensor Data Types
Sensor-related types are imported from the types file:
- `SensorType`: "temperature" | "pressure" | "vibration" | "rpm" | "oil_level" | "fuel_flow" | "voltage" | "current"
- `SensorStatus`: "normal" | "warning" | "critical" | "maintenance" | "offline"
- `SystemStatus`: "operational" | "degraded" | "critical" | "offline"

### User Roles
- `admin`: Full system access
- `commander`: Command-level access
- `maintenance_manager`: Maintenance oversight
- `maintainer`: Field maintenance operations
- `pmo_officer`: Program management
- `viewer`: Read-only access

### Part Categories
- Hot Section
- Rotating Parts
- Consumables
- Electronics
- Hydraulics
- Fuel System

### Work Order Priorities
- Routine: Standard maintenance
- Urgent: Time-sensitive repairs
- CASREP: Casualty Report (critical)

### Work Order Status
- Submitted
- In Progress
- Completed
- Cancelled
- On Hold