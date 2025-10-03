import { v4 as uuidv4 } from "uuid";
import type { WorkOrder, SensorData } from "../types";

// Mock sensor data for AI work order generation
const generateMockSensorData = (): SensorData[] => {
  const now = new Date();
  return [
    {
      id: uuidv4(),
      sensorId: "TEMP_001",
      sensorName: "Engine Temperature",
      sensorType: "temperature",
      value: 185.5,
      unit: "°F",
      timestamp: now,
      status: "critical",
      location: "Main Engine",
      systemId: "GTE_001",
    },
    {
      id: uuidv4(),
      sensorId: "VIB_001",
      sensorName: "Vibration Sensor",
      sensorType: "vibration",
      value: 8.2,
      unit: "mm/s",
      timestamp: now,
      status: "warning",
      location: "Main Engine",
      systemId: "GTE_001",
    },
    {
      id: uuidv4(),
      sensorId: "PRESS_001",
      sensorName: "Oil Pressure",
      sensorType: "pressure",
      value: 12.5,
      unit: "PSI",
      timestamp: now,
      status: "normal",
      location: "Main Engine",
      systemId: "GTE_001",
    },
  ];
};

// AI work order generation based on sensor data
export const generateAIWorkOrder = (
  shipId: string,
  gteSystemId?: string,
  assignedTo?: string,
  createdBy?: string,
): Omit<WorkOrder, "wo" | "createdAt" | "updatedAt"> => {
  const sensorData = generateMockSensorData();

  // Analyze sensor data to determine failure mode and recommendations
  const criticalSensors = sensorData.filter((s) => s.status === "critical");
  const warningSensors = sensorData.filter((s) => s.status === "warning");

  let fm = "System Anomaly Detected";
  let symptoms = "Multiple sensor readings indicate potential system issues.";
  let recommendedAction = "Perform comprehensive system inspection.";
  let priority: "Routine" | "Urgent" | "CASREP" = "Routine";
  let partsRequired = "";

  if (criticalSensors.length > 0) {
    const criticalSensor = criticalSensors[0];
    fm = `${criticalSensor.sensorName} Critical Alert`;
    symptoms = `${criticalSensor.sensorName} reading of ${criticalSensor.value} ${criticalSensor.unit} exceeds normal operating parameters.`;
    recommendedAction = `Immediate inspection required for ${criticalSensor.location}. Check for potential failure conditions.`;
    priority = "Urgent";
    partsRequired = "Temperature sensors, Vibration dampeners";
  } else if (warningSensors.length > 0) {
    const warningSensor = warningSensors[0];
    fm = `${warningSensor.sensorName} Warning`;
    symptoms = `${warningSensor.sensorName} showing elevated readings of ${warningSensor.value} ${warningSensor.unit}.`;
    recommendedAction = `Schedule maintenance inspection for ${warningSensor.location}. Monitor trends for potential issues.`;
    priority = "Routine";
    partsRequired = "Monitoring equipment";
  }

  return {
    shipId,
    gteSystemId,
    assignedTo,
    createdBy,
    fm,
    priority,
    status: "Pending approval", // AI work orders always start with pending approval
    eta: priority === "Urgent" ? 3 : 7, // Shorter ETA for urgent issues
    symptoms,
    recommendedAction,
    partsRequired,
    slaCategory: priority === "Urgent" ? "Critical" : "Standard",
    creationSource: "ai",
    sensorData,
  };
};

// Function to create AI work order with notification
export const createAIWorkOrder = async (
  dispatch: (action: unknown) => unknown,
  shipId: string,
  gteSystemId?: string,
  assignedTo?: string,
  createdBy?: string,
) => {
  const workOrderData = generateAIWorkOrder(
    shipId,
    gteSystemId,
    assignedTo,
    createdBy,
  );

  // Import the action dynamically to avoid circular dependencies
  const { addAIWorkOrderWithNotification } = await import(
    "../redux/services/workOrderSlice"
  );

  return dispatch(addAIWorkOrderWithNotification(workOrderData));
};
