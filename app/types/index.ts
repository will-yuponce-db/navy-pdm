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
  timestamp: Date;
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
  lastUpdated?: Date;
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
