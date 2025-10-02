import type { 
  WorkOrder, 
  Priority, 
  Part, 
  PartCategory, 
  PartCondition,
  ShipCurrentStatus,
  DatabricksShipStatus
} from "../types";

/**
 * Databricks AI Work Order structure from the CSV
 */
export interface DatabricksAIWorkOrder {
  turbine_id: string;
  hourly_timestamp: string;
  avg_energy: number;
  std_sensor_A: number;
  std_sensor_B: number;
  std_sensor_C: number;
  std_sensor_D: number;
  std_sensor_E: number;
  std_sensor_F: number;
  percentiles_sensor_A: string;
  percentiles_sensor_B: string;
  percentiles_sensor_C: string;
  percentiles_sensor_D: string;
  percentiles_sensor_E: string;
  percentiles_sensor_F: string;
  home_location: string;
  designator: string;
  lat: number;
  long: number;
  designator_id: number;
  home_location_id: string;
  prediction: string;
  maintenance_type: string;
  operable: boolean;
  ttr: number;
  parts_required: string;
  work_order: string;
  priority: string;
}

/**
 * Parse the parts_required JSON array string to a comma-separated string
 */
function parsePartsRequired(partsRequiredJson: string): string {
  try {
    if (!partsRequiredJson || partsRequiredJson.trim() === '') {
      return '';
    }
    
    const partsArray = JSON.parse(partsRequiredJson) as string[];
    
    // Count occurrences of each part
    const partCounts = new Map<string, number>();
    partsArray.forEach(part => {
      partCounts.set(part, (partCounts.get(part) || 0) + 1);
    });
    
    // Format as "Part Name (x2)" if count > 1, otherwise just "Part Name"
    const formattedParts = Array.from(partCounts.entries()).map(([part, count]) => 
      count > 1 ? `${part} (x${count})` : part
    );
    
    return formattedParts.join(', ');
  } catch (error) {
    console.error('Failed to parse parts_required:', error);
    return partsRequiredJson;
  }
}

/**
 * Map Databricks maintenance_type to a description or status
 */
function mapMaintenanceType(maintenanceType: string): string {
  const typeMap: Record<string, string> = {
    'Organizational Level': 'Org Level - Ship\'s force maintenance',
    'Intermediate Level': 'Intermediate - Regional maintenance center',
    'Depot Level': 'Depot - Major overhaul/repair facility'
  };
  
  return typeMap[maintenanceType] || maintenanceType;
}

/**
 * Determine status based on operable flag and priority
 */
function determineStatus(operable: boolean, priority: string): WorkOrder['status'] {
  if (priority === 'CASREP') {
    return 'Pending approval'; // Critical items need approval
  }
  if (!operable) {
    return 'Pending approval'; // Non-operable items need attention
  }
  return 'Pending approval'; // AI work orders default to pending approval
}

/**
 * Map Databricks priority to WorkOrder priority
 */
function mapPriority(priority: string): Priority {
  const upperPriority = priority.toUpperCase();
  if (upperPriority === 'CASREP') return 'CASREP';
  if (upperPriority === 'URGENT') return 'Urgent';
  return 'Routine';
}

/**
 * Create a description based on sensor data and prediction
 */
function createDescription(
  prediction: string, 
  maintenanceType: string, 
  operable: boolean,
  avgEnergy: number
): string {
  const operableStatus = operable ? 'Currently Operable' : 'Currently Non-Operable';
  return `AI detected ${prediction} anomaly requiring ${maintenanceType}. ${operableStatus}. Average energy output: ${avgEnergy.toFixed(4)}.`;
}

/**
 * Map Databricks AI Work Order to WorkOrder type
 */
export function mapDatabricksWorkOrderToWorkOrder(
  databricksWO: DatabricksAIWorkOrder
): WorkOrder {
  const partsRequired = parsePartsRequired(databricksWO.parts_required);
  const maintenanceTypeDesc = mapMaintenanceType(databricksWO.maintenance_type);
  const status = determineStatus(databricksWO.operable, databricksWO.priority);
  const priority = mapPriority(databricksWO.priority);
  const description = createDescription(
    databricksWO.prediction,
    databricksWO.maintenance_type,
    databricksWO.operable,
    databricksWO.avg_energy
  );
  
  const workOrder: WorkOrder = {
    wo: databricksWO.work_order,
    shipId: String(databricksWO.designator_id), // Use designator_id as shipId
    gteSystemId: databricksWO.turbine_id, // Turbine ID as GTE System ID
    fm: `${databricksWO.prediction} - ${databricksWO.maintenance_type}`, // Failure mode
    priority: priority,
    status: status,
    eta: databricksWO.ttr, // Time to repair as ETA
    symptoms: description,
    recommendedAction: maintenanceTypeDesc,
    partsRequired: partsRequired,
    slaCategory: databricksWO.maintenance_type,
    creationSource: 'ai',
    createdAt: new Date(databricksWO.hourly_timestamp),
    updatedAt: new Date(databricksWO.hourly_timestamp),
    // Populate ship information
    ship: {
      id: String(databricksWO.designator_id),
      name: databricksWO.designator,
      designation: databricksWO.designator.match(/\(([^)]+)\)/)?.[1] || databricksWO.designator,
      class: 'DDG',
      homeport: databricksWO.home_location,
      status: databricksWO.operable ? 'Active' : 'Maintenance'
    },
    // Store sensor data for analysis
    sensorData: [
      {
        id: `${databricksWO.turbine_id}-${databricksWO.hourly_timestamp}`,
        sensorId: databricksWO.turbine_id,
        sensorName: databricksWO.prediction,
        sensorType: 'temperature', // Default type, can be enhanced
        value: databricksWO.avg_energy,
        unit: 'energy',
        timestamp: new Date(databricksWO.hourly_timestamp),
        status: databricksWO.operable ? 'warning' : 'critical',
        location: databricksWO.home_location,
        systemId: databricksWO.turbine_id
      }
    ]
  };
  
  return workOrder;
}

/**
 * Map an array of Databricks AI Work Orders to WorkOrder array
 */
export function mapDatabricksWorkOrdersToWorkOrders(
  databricksWOs: DatabricksAIWorkOrder[]
): WorkOrder[] {
  return databricksWOs.map(mapDatabricksWorkOrderToWorkOrder);
}

/**
 * Extract unique ships from Databricks AI Work Orders
 */
export function extractShipsFromDatabricksWOs(
  databricksWOs: DatabricksAIWorkOrder[]
): Array<{ id: string; name: string; homeport: string; lat: number; long: number }> {
  const shipsMap = new Map();
  
  databricksWOs.forEach(wo => {
    if (!shipsMap.has(wo.designator_id)) {
      shipsMap.set(wo.designator_id, {
        id: String(wo.designator_id),
        name: wo.designator,
        homeport: wo.home_location,
        lat: wo.lat,
        long: wo.long
      });
    }
  });
  
  return Array.from(shipsMap.values());
}

/**
 * Get summary statistics from Databricks AI Work Orders
 */
export function getDatabricksWorkOrderStats(databricksWOs: DatabricksAIWorkOrder[]) {
  const totalOrders = databricksWOs.length;
  const casrepCount = databricksWOs.filter(wo => wo.priority === 'CASREP').length;
  const urgentCount = databricksWOs.filter(wo => wo.priority === 'Urgent').length;
  const routineCount = databricksWOs.filter(wo => wo.priority === 'Routine').length;
  const nonOperableCount = databricksWOs.filter(wo => !wo.operable).length;
  
  const maintenanceTypes = new Map<string, number>();
  databricksWOs.forEach(wo => {
    maintenanceTypes.set(wo.maintenance_type, (maintenanceTypes.get(wo.maintenance_type) || 0) + 1);
  });
  
  const sensorPredictions = new Map<string, number>();
  databricksWOs.forEach(wo => {
    sensorPredictions.set(wo.prediction, (sensorPredictions.get(wo.prediction) || 0) + 1);
  });
  
  return {
    total: totalOrders,
    byPriority: {
      CASREP: casrepCount,
      Urgent: urgentCount,
      Routine: routineCount
    },
    nonOperable: nonOperableCount,
    byMaintenanceType: Object.fromEntries(maintenanceTypes),
    bySensorPrediction: Object.fromEntries(sensorPredictions),
    averageTTR: databricksWOs.reduce((sum, wo) => sum + wo.ttr, 0) / totalOrders || 0
  };
}

/**
 * Databricks Parts structure from the parts_silver table
 */
export interface DatabricksPart {
  NSN: string;
  type: string;
  width: number;
  height: number;
  weight: number;
  stock_available: number;
  stock_location: string;
  production_time: number;
  sensors: string | string[];
  stock_location_id: string;
  lat: number;
  long: number;
}

/**
 * Map Databricks part type to Part category
 */
function mapPartCategory(type: string): PartCategory {
  const typeMap: Record<string, PartCategory> = {
    'Valve': 'Fuel System',
    'Filter': 'Consumables',
    'Vane': 'Hot Section',
    'Pump': 'Hydraulics',
    'Fuel Nozzle': 'Fuel System',
    'Nozzle': 'Fuel System',
    'Seal': 'Hot Section',
    'Blade': 'Rotating Parts',
    'Turbine': 'Rotating Parts',
    'controller card': 'Electronics',
    'ECU': 'Electronics'
  };

  for (const [key, value] of Object.entries(typeMap)) {
    if (type.includes(key)) {
      return value;
    }
  }
  return 'Consumables'; // Default
}

/**
 * Determine part condition based on stock and production time
 */
function mapPartCondition(stockAvailable: number, productionTime: number): PartCondition {
  if (productionTime === 0) return 'Condemned';
  if (stockAvailable === 0) return 'Used';
  if (stockAvailable > 7) return 'New';
  return 'Refurbished';
}

/**
 * Parse sensors from various formats
 */
function parseSensors(sensors: string | string[]): string[] {
  if (Array.isArray(sensors)) {
    return sensors;
  }
  try {
    const parsed = JSON.parse(sensors);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Map Databricks Part to Part type
 */
export function mapDatabricksPartToPart(databricksPart: DatabricksPart): Part {
  const category = mapPartCategory(databricksPart.type);
  const condition = mapPartCondition(
    databricksPart.stock_available,
    databricksPart.production_time
  );
  const stockLevel = databricksPart.stock_available;
  const minStock = Math.max(1, Math.floor(stockLevel * 0.3));
  const maxStock = Math.ceil(stockLevel * 2);
  const sensors = parseSensors(databricksPart.sensors);

  // Generate unique ID from NSN and location
  const partId = `${databricksPart.NSN}-${databricksPart.stock_location_id}`;

  // Estimate cost based on weight (rough estimation)
  const cost = Math.max(100, databricksPart.weight * 2);

  const part: Part = {
    id: partId,
    name: databricksPart.type,
    system: 'LM2500', // Default system
    category: category,
    stockLevel: stockLevel,
    minStock: minStock,
    maxStock: maxStock,
    location: databricksPart.stock_location,
    condition: condition,
    leadTime: `${databricksPart.production_time} days`,
    supplier: databricksPart.stock_location, // Use location as supplier
    cost: cost,
    lastUpdated: new Date().toISOString(),
    // Databricks-specific fields
    nsn: databricksPart.NSN,
    width: databricksPart.width,
    height: databricksPart.height,
    weight: databricksPart.weight,
    productionTime: databricksPart.production_time,
    sensors: sensors,
    stockLocationId: databricksPart.stock_location_id,
    latitude: databricksPart.lat,
    longitude: databricksPart.long
  };

  return part;
}

/**
 * Map an array of Databricks Parts to Part array
 */
export function mapDatabricksPartsToParts(databricksParts: DatabricksPart[]): Part[] {
  return databricksParts.map(mapDatabricksPartToPart);
}

/**
 * Get summary statistics from Databricks Parts
 */
export function getDatabricksPartsStats(databricksParts: DatabricksPart[]) {
  const totalParts = databricksParts.length;
  const totalStock = databricksParts.reduce((sum, part) => sum + part.stock_available, 0);
  const outOfStock = databricksParts.filter(part => part.stock_available === 0).length;
  const lowStock = databricksParts.filter(part => part.stock_available > 0 && part.stock_available <= 3).length;

  const byLocation = new Map<string, number>();
  const byType = new Map<string, number>();
  const bySensors = new Map<string, number>();

  databricksParts.forEach(part => {
    // Count by location
    byLocation.set(part.stock_location, (byLocation.get(part.stock_location) || 0) + 1);
    
    // Count by type
    byType.set(part.type, (byType.get(part.type) || 0) + 1);
    
    // Count by sensors
    const sensors = parseSensors(part.sensors);
    sensors.forEach(sensor => {
      bySensors.set(sensor, (bySensors.get(sensor) || 0) + 1);
    });
  });

  return {
    total: totalParts,
    totalStock: totalStock,
    outOfStock: outOfStock,
    lowStock: lowStock,
    averageStock: totalStock / totalParts || 0,
    byLocation: Object.fromEntries(byLocation),
    byType: Object.fromEntries(byType),
    bySensors: Object.fromEntries(bySensors),
    averageWeight: databricksParts.reduce((sum, part) => sum + part.weight, 0) / totalParts || 0,
    averageProductionTime: databricksParts.reduce((sum, part) => sum + part.production_time, 0) / totalParts || 0
  };
}

/**
 * ========================================
 * SHIP CURRENT STATUS MAPPING FUNCTIONS
 * ========================================
 */

/**
 * Parse sensor percentiles from string or array
 */
function parsePercentiles(value: string | number[] | undefined | null): number[] | null {
  if (!value) return null;
  
  if (Array.isArray(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      // If parsing fails, return null
      return null;
    }
  }
  
  return null;
}

/**
 * Map a Databricks Ship Status record to ShipCurrentStatus
 */
export function mapDatabricksShipStatusToShipStatus(databricksStatus: DatabricksShipStatus): ShipCurrentStatus {
  const status: ShipCurrentStatus = {
    turbineId: databricksStatus.turbine_id,
    hourlyTimestamp: new Date(databricksStatus.hourly_timestamp),
    avgEnergy: databricksStatus.avg_energy,
    stdSensorA: databricksStatus.std_sensor_A,
    stdSensorB: databricksStatus.std_sensor_B,
    stdSensorC: databricksStatus.std_sensor_C,
    stdSensorD: databricksStatus.std_sensor_D,
    stdSensorE: databricksStatus.std_sensor_E,
    stdSensorF: databricksStatus.std_sensor_F,
    percentilesSensorA: parsePercentiles(databricksStatus.percentiles_sensor_A) ?? undefined,
    percentilesSensorB: parsePercentiles(databricksStatus.percentiles_sensor_B) ?? undefined,
    percentilesSensorC: parsePercentiles(databricksStatus.percentiles_sensor_C) ?? undefined,
    percentilesSensorD: parsePercentiles(databricksStatus.percentiles_sensor_D) ?? undefined,
    percentilesSensorE: parsePercentiles(databricksStatus.percentiles_sensor_E) ?? undefined,
    percentilesSensorF: parsePercentiles(databricksStatus.percentiles_sensor_F) ?? undefined,
    homeLocation: databricksStatus.home_location,
    designator: databricksStatus.designator,
    lat: databricksStatus.lat,
    long: databricksStatus.long,
    designatorId: databricksStatus.designator_id,
    homeLocationId: databricksStatus.home_location_id,
    prediction: databricksStatus.prediction,
    maintenanceType: databricksStatus.maintenance_type,
    operable: databricksStatus.operable,
    ttr: databricksStatus.ttr
  };

  return status;
}

/**
 * Map an array of Databricks Ship Status records to ShipCurrentStatus array
 */
export function mapDatabricksShipStatusesToShipStatuses(databricksStatuses: DatabricksShipStatus[]): ShipCurrentStatus[] {
  return databricksStatuses.map(mapDatabricksShipStatusToShipStatus);
}

/**
 * Get summary statistics from Databricks Ship Statuses
 */
export function getDatabricksShipStatusStats(databricksStatuses: DatabricksShipStatus[]) {
  const total = databricksStatuses.length;
  const operable = databricksStatuses.filter(s => s.operable).length;
  const nonOperable = total - operable;
  
  const byLocation = new Map<string, number>();
  const byDesignator = new Map<string, number>();
  const byPrediction = new Map<string, number>();
  const byMaintenanceType = new Map<string, number>();
  
  databricksStatuses.forEach(status => {
    // Count by location
    byLocation.set(status.home_location, (byLocation.get(status.home_location) || 0) + 1);
    
    // Count by designator
    byDesignator.set(status.designator, (byDesignator.get(status.designator) || 0) + 1);
    
    // Count by prediction
    if (status.prediction) {
      byPrediction.set(status.prediction, (byPrediction.get(status.prediction) || 0) + 1);
    }
    
    // Count by maintenance type
    if (status.maintenance_type) {
      byMaintenanceType.set(status.maintenance_type, (byMaintenanceType.get(status.maintenance_type) || 0) + 1);
    }
  });

  // Calculate average energy
  const avgEnergy = databricksStatuses.reduce((sum, s) => sum + s.avg_energy, 0) / total || 0;
  
  // Calculate average TTR (for non-operable only)
  const nonOperableWithTTR = databricksStatuses.filter(s => !s.operable && s.ttr !== undefined && s.ttr !== null);
  const avgTTR = nonOperableWithTTR.length > 0
    ? nonOperableWithTTR.reduce((sum, s) => sum + (s.ttr || 0), 0) / nonOperableWithTTR.length
    : 0;

  return {
    total,
    operable,
    nonOperable,
    operablePercentage: (operable / total) * 100 || 0,
    avgEnergy,
    avgTTR,
    byLocation: Object.fromEntries(byLocation),
    byDesignator: Object.fromEntries(byDesignator),
    byPrediction: Object.fromEntries(byPrediction),
    byMaintenanceType: Object.fromEntries(byMaintenanceType)
  };
}

