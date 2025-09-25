// Core Work Order Types
export interface WorkOrder {
  wo: string;
  ship: string;
  homeport: string;
  fm: string; // Failure Mode
  gte: string; // Gas Turbine Engine
  priority: Priority;
  status: WorkOrderStatus;
  eta: number; // Estimated Time of Arrival in days
  symptoms?: string;
  recommendedAction?: string;
  partsRequired?: string;
  slaCategory?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type Priority = "Routine" | "Urgent" | "CASREP";
export type WorkOrderStatus =
  | "Submitted"
  | "In Progress"
  | "Completed"
  | "Cancelled"
  | "On Hold";

// Notification Types
export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  priority: "low" | "medium" | "high" | "critical";
  category: "maintenance" | "system" | "alert" | "update";
  read: boolean;
  workOrderId?: string;
}

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

// Parts Management Types
export interface Part {
  id: string;
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
export type WorkOrderState = WorkOrder[];

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
  ship: string;
  homeport: string;
  gte: string;
  fm: string;
  priority: Priority;
  eta: string;
  symptoms?: string;
  recommendedAction?: string;
  partsRequired?: string;
  slaCategory?: string;
}

// API Response Types (for future backend integration)
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Fleet and Ship Types
export interface Ship {
  id: string;
  name: string;
  designation: string;
  class: string;
  homeport: string;
  status: ShipStatus;
  gteSystems: GTESystem[];
}

export type ShipStatus = "Active" | "In Port" | "Maintenance" | "Deployed";

export interface GTESystem {
  id: string;
  model: string;
  serialNumber: string;
  installDate: Date;
  status: GTEStatus;
  hoursOperation: number;
  lastMaintenance: Date;
  nextMaintenance: Date;
}

export type GTEStatus =
  | "Operational"
  | "Maintenance Required"
  | "Down"
  | "CASREP";

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
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  homeport?: string;
  department?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
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

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'work_order_update' | 'notification' | 'system_alert' | 'maintenance_alert';
  data: any;
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
  id: string;
  type: 'login' | 'logout' | 'permission_denied' | 'suspicious_activity';
  userId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details?: Record<string, any>;
}

// Audit Types
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, { old: any; new: any }>;
  timestamp: Date;
  ipAddress: string;
}

// Cache Types
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum number of items
  strategy: 'lru' | 'fifo' | 'ttl';
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
  display: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
  orientation: 'portrait' | 'landscape' | 'any';
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
    type: 'create' | 'update' | 'delete';
    data: any;
    timestamp: Date;
  }>;
}
