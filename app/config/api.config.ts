/**
 * Centralized API Configuration
 * 
 * This file contains all API endpoint paths and configuration settings.
 * Modify these values to change endpoint paths throughout the application.
 */

// Base API Configuration
export const API_CONFIG = {
  // API Base URL - configured via environment variable or defaults
  baseUrl:
    typeof window !== "undefined"
      ? window.location.origin + "/api"
      : process.env.VITE_API_URL ||
        (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:8000/api"),
  
  // Request Configuration
  timeout: 10000, // 10 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
} as const;

// API Endpoint Paths
export const API_ENDPOINTS = {
  // Authentication Endpoints
  auth: {
    base: "/auth",
    login: "/auth/login",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    me: "/auth/me",
    changePassword: "/auth/change-password",
  },

  // Work Orders Endpoints
  workOrders: {
    base: "/work-orders",
    byId: (id: string) => `/work-orders/${id}`,
    ai: "/work-orders/ai",
    bulk: "/work-orders/bulk",
    export: "/work-orders/export",
  },

  // Parts Endpoints
  parts: {
    base: "/parts",
    byId: (id: string) => `/parts/${id}`,
    stock: (id: string) => `/parts/${id}/stock`,
  },

  // Databricks Endpoints
  databricks: {
    base: "/databricks",
    health: "/databricks/health",
    test: "/databricks/test",
    query: "/databricks/query",
    warehouses: "/databricks/warehouses",
    databases: "/databricks/databases",
    tables: (databaseName: string) =>
      `/databricks/databases/${encodeURIComponent(databaseName)}/tables`,
    
    // Databricks Data Endpoints
    parts: "/databricks/parts",
    aiWorkOrders: "/databricks/ai-work-orders",
    aiWorkOrderById: (workOrderId: string) =>
      `/databricks/ai-work-orders/${encodeURIComponent(workOrderId)}`,
    sensorData: (turbineId: string) =>
      `/databricks/sensor-data/${encodeURIComponent(turbineId)}`,
    shipStatus: "/databricks/ship-status",
    shipStatusByTurbineId: (turbineId: string) =>
      `/databricks/ship-status/${encodeURIComponent(turbineId)}`,
    
    // Parts Requisitions Endpoints
    partsRequisitions: "/databricks/parts-requisitions",
    partsRequisitionByOrderNumber: (orderNumber: string) =>
      `/databricks/parts-requisitions/${encodeURIComponent(orderNumber)}`,
    partsRequisitionsByDesignatorId: (designatorId: string) =>
      `/databricks/parts-requisitions/ship/${encodeURIComponent(designatorId)}`,
  },

  // Parts Requisitions (local)
  partsRequisitions: "/parts-requisitions",
} as const;

/**
 * Databricks Configuration
 * 
 * Configuration for Databricks SQL connection and table references.
 */
export const DATABRICKS_CONFIG = {
  // Connection Configuration
  connection: {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    timeout: 30000, // 30 seconds
    healthCheckInterval: 60000, // 1 minute
    tokenRefreshBuffer: 300000, // 5 minutes
  },

  // Databricks Catalog and Schema
  catalog: process.env.DATABRICKS_CATALOG || "public_sector",
  schema: process.env.DATABRICKS_SCHEMA || "predictive_maintenance_navy",

  // Table Names
  tables: {
    aiWorkOrders: process.env.DATABRICKS_TABLE_AI_WORK_ORDERS || "ai_work_orders",
    currentStatusPredictions: process.env.DATABRICKS_TABLE_CURRENT_STATUS || "current_status_predictions",
    sensorBronze: process.env.DATABRICKS_TABLE_SENSOR_BRONZE || "sensor_bronze",
    aiPartOrders: process.env.DATABRICKS_TABLE_AI_PART_ORDERS || "ai_part_orders",
    partsSilver: process.env.DATABRICKS_TABLE_PARTS_SILVER || "parts_silver",
    shipCurrentStatusGold: process.env.DATABRICKS_TABLE_SHIP_STATUS || "ship_current_status_gold",
  },
} as const;

/**
 * Get fully qualified table name
 * @param tableName - Name of the table from DATABRICKS_CONFIG.tables
 * @returns Fully qualified table name (catalog.schema.table)
 */
export function getFullTableName(tableName: string): string {
  return `${DATABRICKS_CONFIG.catalog}.${DATABRICKS_CONFIG.schema}.${tableName}`;
}

/**
 * Helper to get table references
 */
export const DATABRICKS_TABLES = {
  aiWorkOrders: getFullTableName(DATABRICKS_CONFIG.tables.aiWorkOrders),
  currentStatusPredictions: getFullTableName(DATABRICKS_CONFIG.tables.currentStatusPredictions),
  sensorBronze: getFullTableName(DATABRICKS_CONFIG.tables.sensorBronze),
  aiPartOrders: getFullTableName(DATABRICKS_CONFIG.tables.aiPartOrders),
  partsSilver: getFullTableName(DATABRICKS_CONFIG.tables.partsSilver),
  shipCurrentStatusGold: getFullTableName(DATABRICKS_CONFIG.tables.shipCurrentStatusGold),
} as const;

// Export type definitions for TypeScript
export type ApiEndpoints = typeof API_ENDPOINTS;
export type DatabricksConfig = typeof DATABRICKS_CONFIG;
export type DatabricksTables = typeof DATABRICKS_TABLES;

