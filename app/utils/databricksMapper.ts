import type { WorkOrder, Priority } from "../types";

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

