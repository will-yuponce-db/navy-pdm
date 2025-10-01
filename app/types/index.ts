// Core Work Order Types
export interface WorkOrder {
  readonly wo: string;
  shipId: string; // Foreign key to ships table
  gteSystemId?: string; // Foreign key to gte_systems table
  assignedTo?: string; // Foreign key to users table
  createdBy?: string; // Foreign key to users table
  fm: string; // Failure Mode
  priority: Priority;
  status: WorkOrderStatus;
  eta: number; // Estimated Time of Arrival in days
  symptoms?: string;
  recommendedAction?: string;
  partsRequired?: string;
  slaCategory?: string;
  creationSource: WorkOrderCreationSource; // Manual or AI created
  sensorData?: SensorData[]; // Sensor readings for AI-created work orders
  readonly createdAt?: Date | string;
  readonly updatedAt?: Date | string;
  // Populated fields for display
  ship?: Ship;
  gteSystem?: GTESystem;
  assignedUser?: User;
  createdByUser?: User;
}

export type Priority = "Routine" | "Urgent" | "CASREP";
export type WorkOrderCreationSource = "manual" | "ai";
export type WorkOrderStatus =
  | "Submitted"
  | "Pending approval"
  | "In Progress"
  | "Completed"
  | "Cancelled"
  | "On Hold";

// Notification Types
export interface Notification {
  readonly id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string | Date;
  priority: NotificationPriority;
  category: NotificationCategory;
  read: boolean;
  workOrderId?: string;
}

export type NotificationType = "success" | "error" | "warning" | "info";
export type NotificationPriority = "low" | "medium" | "high" | "critical";
export type NotificationCategory =
  | "maintenance"
  | "system"
  | "alert"
  | "update";

// Navigation Types
export interface NavItem {
  title: string;
  icon: string;
  route: string;
}

// KPI Types for Maintenance Overview
export interface MaintenanceKPI {
  title: string;
  metric: string | number;
  details: string;
  trend?: "up" | "down" | "stable";
  severity?: "normal" | "warning" | "critical";
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Generic API Types
export interface BaseEntity {
  readonly id: string;
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
}

export interface SearchParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, unknown>;
}

// Parts Management Types
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
}

export type PartCategory =
  | "Hot Section"
  | "Rotating Parts"
  | "Consumables"
  | "Electronics"
  | "Hydraulics"
  | "Fuel System";
export type PartCondition =
  | "New"
  | "Refurbished"
  | "Used"
  | "Damaged"
  | "Condemned";
export type StockStatus = "Critical" | "Low" | "Adequate" | "Overstocked";

// Redux State Types
export interface WorkOrderState {
  workOrders: WorkOrder[];
  loading: boolean;
  error: string | null;
}

export interface NotificationState {
  notifications: Notification[];
}

export interface PartsState {
  parts: Part[];
  loading: boolean;
  error: string | null;
  filters: {
    category?: PartCategory;
    condition?: PartCondition;
    stockStatus?: StockStatus;
    system?: string;
    searchTerm?: string;
  };
}

export interface RootState {
  workOrders: WorkOrderState;
  notifications: NotificationState;
  parts: PartsState;
  auth: AuthState;
}

// Component Props Types
export interface WorkOrderTableProps {
  openWorkOrderModal: () => void;
  initialFilter?: string;
}

export interface WorkOrderModalProps {
  modalOpen: boolean;
  handleModalClose: () => void;
}

export interface EnhancedTableToolbarProps {
  selected?: string[];
  handleDeselect?: () => void;
  openWorkOrderModal?: () => void;
  numSelected?: number;
}

export interface EnhancedTableHeadProps {
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: "asc" | "desc";
  orderBy: string;
  numSelected: number;
  rowCount: number;
  onRequestSort: (event: React.MouseEvent<unknown>, property: string) => void;
}

// Form Types
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
  creationSource: WorkOrderCreationSource;
  sensorData?: SensorData[];
}

// API Response Types (for future backend integration)
export interface ApiResponse<T> {
  readonly data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Fleet and Ship Types
export interface Ship {
  readonly id: string;
  name: string;
  designation: string;
  class: string;
  homeport: string;
  status: ShipStatus;
  readonly createdAt?: Date | string;
  readonly updatedAt?: Date | string;
  // Populated fields
  gteSystems?: readonly GTESystem[];
  assets?: readonly Asset[];
  workOrders?: readonly WorkOrder[];
}

export type ShipStatus = "Active" | "In Port" | "Maintenance" | "Deployed";

export interface GTESystem {
  readonly id: string;
  model: string;
  serialNumber: string;
  installDate: Date;
  status: GTEStatus;
  hoursOperation: number;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  shipId: string; // Foreign key to ships table
  readonly createdAt?: Date | string;
  readonly updatedAt?: Date | string;
  // Populated fields
  ship?: Ship;
  sensorSystems?: readonly SensorSystem[];
  workOrders?: readonly WorkOrder[];
}

export type GTEStatus =
  | "Operational"
  | "Maintenance Required"
  | "Down"
  | "CASREP";

// Asset Types
export interface Asset {
  readonly id: string;
  name: string;
  type: string;
  status: AssetStatus;
  location: string;
  serialNumber?: string;
  installDate?: Date;
  lastInspection?: Date;
  nextInspection?: Date;
  shipId: string; // Foreign key to ships table
  readonly createdAt?: Date | string;
  readonly updatedAt?: Date | string;
  // Populated fields
  ship?: Ship;
  maintenanceSchedules?: readonly MaintenanceSchedule[];
  performanceMetrics?: readonly PerformanceMetric[];
}

export type AssetStatus = "Operational" | "Maintenance Required" | "Down" | "Retired";

// Maintenance Schedule Types
export interface MaintenanceSchedule {
  readonly id: string;
  assetId: string; // Foreign key to assets table
  assignedTo?: string; // Foreign key to users table
  createdBy?: string; // Foreign key to users table
  maintenanceType: string;
  scheduledDate: Date;
  status: ScheduleStatus;
  description?: string;
  estimatedHours?: number;
  readonly createdAt?: Date | string;
  readonly updatedAt?: Date | string;
  // Populated fields
  asset?: Asset;
  assignedUser?: User;
  createdByUser?: User;
}

export type ScheduleStatus = "Scheduled" | "In Progress" | "Completed" | "Cancelled" | "Overdue";

// Performance Metric Types
export interface PerformanceMetric {
  readonly id: string;
  assetId: string; // Foreign key to assets table
  metricType: string;
  value: number;
  unit: string;
  timestamp: Date;
  status: string;
  // Populated fields
  asset?: Asset;
}

// Sensor Types
export interface SensorSystem {
  readonly id: string;
  name: string;
  type: string;
  location: string;
  status: SystemStatus;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  gteSystemId: string; // Foreign key to gte_systems table
  readonly createdAt?: Date | string;
  readonly updatedAt?: Date | string;
  // Populated fields
  gteSystem?: GTESystem;
  sensorData?: readonly SensorData[];
}

export interface SensorData {
  readonly id: string;
  sensorId: string;
  sensorName: string;
  sensorType: SensorType;
  value: number;
  unit: string;
  timestamp: Date;
  status: SensorStatus;
  location: string;
  systemId: string; // Foreign key to sensor_systems table
  // Populated fields
  system?: SensorSystem;
  analytics?: SensorAnalytics;
}

export interface SensorAnalytics {
  sensorId: string; // Primary key, foreign key to sensor_data
  timeRange: string;
  averageValue: number;
  minValue: number;
  maxValue: number;
  trend: string;
  anomalies: number;
  efficiency: number;
  // Populated fields
  sensorData?: SensorData;
}

export type SensorType = "temperature" | "pressure" | "vibration" | "rpm" | "oil_level" | "fuel_flow" | "voltage" | "current";
export type SensorStatus = "normal" | "warning" | "critical" | "maintenance" | "offline";
export type SystemStatus = "operational" | "degraded" | "critical" | "offline";

// Chart and Analytics Types
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

// Theme Types
export interface ThemeMode {
  mode: "light" | "dark";
}

// User Management Types
export interface User {
  readonly id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: readonly Permission[];
  homeport?: string;
  department?: string;
  isActive: boolean;
  lastLogin?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  // Populated fields
  workOrders?: readonly WorkOrder[];
  maintenanceSchedules?: readonly MaintenanceSchedule[];
  auditLogs?: readonly AuditLog[];
  securityEvents?: readonly SecurityEvent[];
}

export type UserRole =
  | "admin"
  | "commander"
  | "maintenance_manager"
  | "maintainer"
  | "pmo_officer"
  | "viewer";

export type Permission =
  | "work_orders:read"
  | "work_orders:write"
  | "work_orders:delete"
  | "parts:read"
  | "parts:write"
  | "parts:delete"
  | "analytics:read"
  | "users:read"
  | "users:write"
  | "users:delete"
  | "system:admin";

// Authentication Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  homeport?: string;
  department?: string;
}

// API Types
export interface ApiError {
  message: string;
  code?: string;
  status: number;
  timestamp: string;
}

// Performance Monitoring Types
export interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  errorRate: number;
  userActions: number;
}

// Security Types
export interface SecurityEvent {
  readonly id: string;
  type: string;
  userId?: string; // Foreign key to users table
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details?: Record<string, unknown>;
  // Populated fields
  user?: User;
}

// Audit Types
export interface AuditLog {
  readonly id: string;
  userId: string; // Foreign key to users table
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  timestamp: Date;
  ipAddress: string;
  // Populated fields
  user?: User;
}

// Cache Types
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum number of items
  strategy: "lru" | "fifo" | "ttl";
}

export interface CacheItem<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
}

// PWA Types
export interface PWAConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: "fullscreen" | "standalone" | "minimal-ui" | "browser";
  orientation: "portrait" | "landscape" | "any";
  startUrl: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
  }>;
}

// Offline Types
export interface OfflineData {
  workOrders: WorkOrder[];
  parts: Part[];
  notifications: Notification[];
  lastSync: Date;
  pendingChanges: Array<{
    id: string;
    type: "create" | "update" | "delete";
    data: unknown;
    timestamp: Date;
  }>;
}
