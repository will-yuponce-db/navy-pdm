import type { SensorData, SensorSystem, SensorAnalytics, SensorType, SensorStatus, SystemStatus } from "../types";

// Mock sensor data generator
export class SensorDataService {
  private static instance: SensorDataService;
  private sensorData: SensorData[] = [];
  private systems: SensorSystem[] = [];
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeMockData();
  }

  public static getInstance(): SensorDataService {
    if (!SensorDataService.instance) {
      SensorDataService.instance = new SensorDataService();
    }
    return SensorDataService.instance;
  }

  private initializeMockData() {
    // Initialize mock systems
    this.systems = [
      {
        id: "system-1",
        name: "Main Engine #1",
        type: "Gas Turbine Engine",
        location: "Engine Room A",
        sensors: [],
        status: "operational",
        lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        nextMaintenance: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      },
      {
        id: "system-2",
        name: "Main Engine #2",
        type: "Gas Turbine Engine",
        location: "Engine Room B",
        sensors: [],
        status: "degraded",
        lastMaintenance: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        nextMaintenance: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      },
      {
        id: "system-3",
        name: "Auxiliary Power Unit",
        type: "APU",
        location: "Auxiliary Room",
        sensors: [],
        status: "operational",
        lastMaintenance: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        nextMaintenance: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
      },
    ];

    // Initialize mock sensors for each system
    this.systems.forEach((system) => {
      const systemSensors = this.generateSystemSensors(system.id);
      system.sensors = systemSensors;
      this.sensorData.push(...systemSensors);
    });
  }

  private generateSystemSensors(systemId: string): SensorData[] {
    const sensorTypes: { type: SensorType; name: string; unit: string; baseValue: number; variance: number }[] = [
      { type: "temperature", name: "Exhaust Temperature", unit: "°C", baseValue: 450, variance: 50 },
      { type: "pressure", name: "Compressor Pressure", unit: "PSI", baseValue: 150, variance: 20 },
      { type: "vibration", name: "Rotor Vibration", unit: "mm/s", baseValue: 2.5, variance: 1.5 },
      { type: "rpm", name: "Rotor Speed", unit: "RPM", baseValue: 12000, variance: 1000 },
      { type: "oil_level", name: "Oil Level", unit: "%", baseValue: 85, variance: 10 },
      { type: "fuel_flow", name: "Fuel Flow Rate", unit: "GPH", baseValue: 45, variance: 10 },
      { type: "voltage", name: "Generator Voltage", unit: "V", baseValue: 480, variance: 20 },
      { type: "current", name: "Generator Current", unit: "A", baseValue: 125, variance: 25 },
    ];

    return sensorTypes.map((sensor, index) => ({
      id: `sensor-${systemId}-${index}`,
      sensorId: `SENSOR-${systemId.toUpperCase()}-${index + 1}`,
      sensorName: sensor.name,
      sensorType: sensor.type,
      value: this.generateSensorValue(sensor.baseValue, sensor.variance),
      unit: sensor.unit,
      timestamp: new Date(),
      status: this.determineSensorStatus(sensor.baseValue, sensor.variance),
      location: this.systems.find(s => s.id === systemId)?.location || "Unknown",
      system: systemId,
    }));
  }

  private generateSensorValue(baseValue: number, variance: number): number {
    const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
    return Math.round((baseValue + (randomFactor * variance)) * 100) / 100;
  }

  private determineSensorStatus(baseValue: number, variance: number): SensorStatus {
    const random = Math.random();
    if (random < 0.05) return "critical";
    if (random < 0.15) return "warning";
    if (random < 0.95) return "normal";
    return "maintenance";
  }

  public getSensorData(systemId?: string, sensorId?: string): SensorData[] {
    let filteredData = [...this.sensorData];
    
    if (systemId) {
      filteredData = filteredData.filter(sensor => sensor.system === systemId);
    }
    
    if (sensorId) {
      filteredData = filteredData.filter(sensor => sensor.sensorId === sensorId);
    }
    
    return filteredData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getSystems(): SensorSystem[] {
    return [...this.systems];
  }

  public getSystemById(systemId: string): SensorSystem | undefined {
    return this.systems.find(system => system.id === systemId);
  }

  public getSensorAnalytics(sensorId: string, timeRange: string = "24h"): SensorAnalytics {
    const sensor = this.sensorData.find(s => s.sensorId === sensorId);
    if (!sensor) {
      throw new Error(`Sensor ${sensorId} not found`);
    }

    // Generate mock analytics data
    const values = Array.from({ length: 100 }, () => this.generateSensorValue(sensor.value, sensor.value * 0.1));
    const averageValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    // Determine trend
    const firstHalf = values.slice(0, 50).reduce((sum, val) => sum + val, 0) / 50;
    const secondHalf = values.slice(50).reduce((sum, val) => sum + val, 0) / 50;
    const trend = secondHalf > firstHalf * 1.05 ? "increasing" : 
                  secondHalf < firstHalf * 0.95 ? "decreasing" : "stable";

    return {
      sensorId,
      timeRange,
      averageValue: Math.round(averageValue * 100) / 100,
      minValue: Math.round(minValue * 100) / 100,
      maxValue: Math.round(maxValue * 100) / 100,
      trend,
      anomalies: Math.floor(Math.random() * 5),
      efficiency: Math.round((Math.random() * 20 + 80) * 100) / 100, // 80-100%
    };
  }

  public startRealTimeUpdates(callback: (data: SensorData[]) => void, interval: number = 5000) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      // Update sensor values
      this.sensorData = this.sensorData.map(sensor => ({
        ...sensor,
        value: this.generateSensorValue(sensor.value, sensor.value * 0.05),
        timestamp: new Date(),
        status: this.determineSensorStatus(sensor.value, sensor.value * 0.1),
      }));

      // Update system status based on sensor statuses
      this.systems = this.systems.map(system => {
        const systemSensors = this.sensorData.filter(s => s.system === system.id);
        const criticalSensors = systemSensors.filter(s => s.status === "critical").length;
        const warningSensors = systemSensors.filter(s => s.status === "warning").length;
        
        let status: SystemStatus = "operational";
        if (criticalSensors > 0) status = "critical";
        else if (warningSensors > 2) status = "degraded";
        else if (systemSensors.some(s => s.status === "offline")) status = "offline";

        return { ...system, status };
      });

      callback([...this.sensorData]);
    }, interval);
  }

  public stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public getHistoricalData(sensorId: string, hours: number = 24): SensorData[] {
    const sensor = this.sensorData.find(s => s.sensorId === sensorId);
    if (!sensor) return [];

    const historicalData: SensorData[] = [];
    const now = new Date();
    const interval = (hours * 60 * 60 * 1000) / 100; // 100 data points

    for (let i = 0; i < 100; i++) {
      const timestamp = new Date(now.getTime() - (i * interval));
      const value = this.generateSensorValue(sensor.value, sensor.value * 0.1);
      
      historicalData.push({
        ...sensor,
        id: `${sensor.id}-historical-${i}`,
        value,
        timestamp,
        status: this.determineSensorStatus(value, sensor.value * 0.1),
      });
    }

    return historicalData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

// Export singleton instance
export const sensorDataService = SensorDataService.getInstance();

