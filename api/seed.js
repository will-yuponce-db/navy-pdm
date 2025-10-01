#!/usr/bin/env node
/**
 * Seed script to populate the SQLite database with data
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database setup
const dbPath = process.env.DATABASE_URL || join(__dirname, '..', 'backend', 'instance', 'navy_pdm.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function seedDatabase() {
  console.log('Starting database seeding...');
  console.log(`Database: ${dbPath}`);

  try {
    // Clear existing data in reverse order of dependencies
    db.exec('DELETE FROM work_orders');
    db.exec('DELETE FROM gte_systems');
    db.exec('DELETE FROM users');
    db.exec('DELETE FROM ships');
    db.exec('DELETE FROM parts');

    // Seed Ships
    const shipsData = [
      {
        id: 'SHIP_001',
        name: 'USS Gerald R. Ford',
        designation: 'CVN-78',
        class: 'Gerald R. Ford',
        homeport: 'Norfolk, VA',
        status: 'Active'
      },
      {
        id: 'SHIP_002',
        name: 'USS Abraham Lincoln',
        designation: 'CVN-72',
        class: 'Nimitz',
        homeport: 'San Diego, CA',
        status: 'Active'
      },
      {
        id: 'SHIP_003',
        name: 'USS Ronald Reagan',
        designation: 'CVN-76',
        class: 'Nimitz',
        homeport: 'Yokosuka, Japan',
        status: 'Deployed'
      },
      {
        id: 'SHIP_004',
        name: 'USS Harry S. Truman',
        designation: 'CVN-75',
        class: 'Nimitz',
        homeport: 'Norfolk, VA',
        status: 'Maintenance'
      }
    ];

    const insertShip = db.prepare(`
      INSERT INTO ships (id, name, designation, class, homeport, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const ship of shipsData) {
      insertShip.run(ship.id, ship.name, ship.designation, ship.class, ship.homeport, ship.status);
    }

    console.log(`Created ${shipsData.length} ships`);

    // Seed Users
    const usersData = [
      {
        id: 'USER_001',
        email: 'john.smith@navy.mil',
        first_name: 'John',
        last_name: 'Smith',
        role: 'maintenance_manager',
        homeport: 'Norfolk, VA',
        department: 'Engineering',
        is_active: 1
      },
      {
        id: 'USER_002',
        email: 'sarah.johnson@navy.mil',
        first_name: 'Sarah',
        last_name: 'Johnson',
        role: 'maintainer',
        homeport: 'San Diego, CA',
        department: 'Maintenance',
        is_active: 1
      },
      {
        id: 'USER_003',
        email: 'mike.davis@navy.mil',
        first_name: 'Mike',
        last_name: 'Davis',
        role: 'commander',
        homeport: 'Norfolk, VA',
        department: 'Operations',
        is_active: 1
      },
      {
        id: 'USER_004',
        email: 'lisa.wilson@navy.mil',
        first_name: 'Lisa',
        last_name: 'Wilson',
        role: 'maintainer',
        homeport: 'Yokosuka, Japan',
        department: 'Maintenance',
        is_active: 1
      }
    ];

    const insertUser = db.prepare(`
      INSERT INTO users (id, email, first_name, last_name, role, homeport, department, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const user of usersData) {
      insertUser.run(user.id, user.email, user.first_name, user.last_name, user.role, user.homeport, user.department, user.is_active);
    }

    console.log(`Created ${usersData.length} users`);

    // Seed GTE Systems
    const gteSystemsData = [
      {
        id: 'GTE_001',
        model: 'LM2500',
        serial_number: 'LM2500-001',
        install_date: '2020-01-15',
        status: 'Operational',
        hours_operation: 8500,
        last_maintenance: '2023-06-15',
        next_maintenance: '2024-01-15',
        ship_id: 'SHIP_001'
      },
      {
        id: 'GTE_002',
        model: 'LM2500',
        serial_number: 'LM2500-002',
        install_date: '2019-08-20',
        status: 'Maintenance Required',
        hours_operation: 12000,
        last_maintenance: '2023-03-10',
        next_maintenance: '2023-12-10',
        ship_id: 'SHIP_001'
      },
      {
        id: 'GTE_003',
        model: 'LM2500',
        serial_number: 'LM2500-003',
        install_date: '2021-03-10',
        status: 'Operational',
        hours_operation: 6500,
        last_maintenance: '2023-08-20',
        next_maintenance: '2024-03-20',
        ship_id: 'SHIP_002'
      },
      {
        id: 'GTE_004',
        model: 'LM2500',
        serial_number: 'LM2500-004',
        install_date: '2018-11-05',
        status: 'Down',
        hours_operation: 15000,
        last_maintenance: '2023-01-15',
        next_maintenance: '2023-11-15',
        ship_id: 'SHIP_003'
      }
    ];

    const insertGteSystem = db.prepare(`
      INSERT INTO gte_systems (id, model, serial_number, install_date, status, hours_operation, last_maintenance, next_maintenance, ship_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const gte of gteSystemsData) {
      insertGteSystem.run(gte.id, gte.model, gte.serial_number, gte.install_date, gte.status, gte.hours_operation, gte.last_maintenance, gte.next_maintenance, gte.ship_id);
    }

    console.log(`Created ${gteSystemsData.length} GTE systems`);

    // Seed Parts
    const partsData = [
      {
        id: 'LM2500-TRB-001',
        name: 'Turbine Blade Set',
        system: 'LM2500',
        category: 'Hot Section',
        stock_level: 12,
        min_stock: 5,
        max_stock: 25,
        location: 'Norfolk Supply Depot',
        condition: 'New',
        lead_time: '45 days',
        supplier: 'General Electric',
        cost: 75000,
        last_updated: new Date().toISOString()
      },
      {
        id: 'LM2500-BRG-002',
        name: 'Main Bearing Assembly',
        system: 'LM2500',
        category: 'Rotating Parts',
        stock_level: 3,
        min_stock: 2,
        max_stock: 8,
        location: 'San Diego Supply',
        condition: 'New',
        lead_time: '60 days',
        supplier: 'General Electric',
        cost: 45000,
        last_updated: new Date().toISOString()
      },
      {
        id: 'LM2500-FIL-003',
        name: 'Oil Filter Cartridge',
        system: 'LM2500',
        category: 'Consumables',
        stock_level: 85,
        min_stock: 50,
        max_stock: 200,
        location: 'Norfolk Supply Depot',
        condition: 'New',
        lead_time: '14 days',
        supplier: 'Parker Hannifin',
        cost: 250,
        last_updated: new Date().toISOString()
      },
      {
        id: 'LM2500-SEN-004',
        name: 'Temperature Sensor',
        system: 'LM2500',
        category: 'Electronics',
        stock_level: 1,
        min_stock: 5,
        max_stock: 15,
        location: 'Pearl Harbor Supply',
        condition: 'New',
        lead_time: '30 days',
        supplier: 'Honeywell',
        cost: 1500,
        last_updated: new Date().toISOString()
      },
      {
        id: 'LM2500-PMP-005',
        name: 'Main Oil Pump',
        system: 'LM2500',
        category: 'Hydraulics',
        stock_level: 2,
        min_stock: 3,
        max_stock: 10,
        location: 'Norfolk Supply Depot',
        condition: 'Refurbished',
        lead_time: '30 days',
        supplier: 'General Electric',
        cost: 25000,
        last_updated: new Date().toISOString()
      },
      {
        id: 'LM2500-FUEL-006',
        name: 'Fuel Injector Assembly',
        system: 'LM2500',
        category: 'Fuel System',
        stock_level: 8,
        min_stock: 4,
        max_stock: 20,
        location: 'San Diego Supply',
        condition: 'New',
        lead_time: '21 days',
        supplier: 'General Electric',
        cost: 12000,
        last_updated: new Date().toISOString()
      },
      {
        id: 'LM2500-ELEC-007',
        name: 'Voltage Regulator',
        system: 'LM2500',
        category: 'Electronics',
        stock_level: 5,
        min_stock: 3,
        max_stock: 12,
        location: 'Norfolk Supply Depot',
        condition: 'New',
        lead_time: '25 days',
        supplier: 'Honeywell',
        cost: 3500,
        last_updated: new Date().toISOString()
      },
      {
        id: 'LM2500-HYD-008',
        name: 'Hydraulic Fluid',
        system: 'LM2500',
        category: 'Consumables',
        stock_level: 50,
        min_stock: 20,
        max_stock: 100,
        location: 'Norfolk Supply Depot',
        condition: 'New',
        lead_time: '7 days',
        supplier: 'Shell Oil',
        cost: 150,
        last_updated: new Date().toISOString()
      },
      {
        id: 'LM2500-EXH-009',
        name: 'Exhaust Duct Section',
        system: 'LM2500',
        category: 'Hot Section',
        stock_level: 4,
        min_stock: 2,
        max_stock: 8,
        location: 'San Diego Supply',
        condition: 'New',
        lead_time: '35 days',
        supplier: 'General Electric',
        cost: 18000,
        last_updated: new Date().toISOString()
      },
      {
        id: 'LM2500-START-010',
        name: 'Starting Motor',
        system: 'LM2500',
        category: 'Electronics',
        stock_level: 3,
        min_stock: 2,
        max_stock: 6,
        location: 'Pearl Harbor Supply',
        condition: 'Refurbished',
        lead_time: '40 days',
        supplier: 'General Electric',
        cost: 22000,
        last_updated: new Date().toISOString()
      }
    ];

    const insertPart = db.prepare(`
      INSERT INTO parts (id, name, system, category, stock_level, min_stock, max_stock, location, condition, lead_time, supplier, cost, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const part of partsData) {
      insertPart.run(
        part.id, part.name, part.system, part.category, part.stock_level, part.min_stock,
        part.max_stock, part.location, part.condition, part.lead_time, part.supplier,
        part.cost, part.last_updated
      );
    }

    console.log(`Created ${partsData.length} parts`);

    // Seed Work Orders (Manual and AI)
    const workOrdersData = [
      // Manual Work Orders
      {
        wo: 'WO001',
        ship_id: 'SHIP_001',
        gte_system_id: 'GTE_001',
        assigned_to: 'USER_002',
        created_by: 'USER_001',
        fm: 'Routine Maintenance',
        priority: 'Routine',
        status: 'Submitted',
        eta: 7,
        symptoms: 'Scheduled maintenance for turbine blade inspection',
        recommended_action: 'Perform visual inspection and NDT testing of turbine blades',
        parts_required: 'LM2500-TRB-001, LM2500-FIL-003',
        sla_category: 'Standard',
        creation_source: 'manual',
        sensor_data: null
      },
      {
        wo: 'WO002',
        ship_id: 'SHIP_002',
        gte_system_id: 'GTE_003',
        assigned_to: 'USER_004',
        created_by: 'USER_001',
        fm: 'Oil Leak Detection',
        priority: 'Urgent',
        status: 'In Progress',
        eta: 3,
        symptoms: 'Oil leak detected in main bearing area during routine inspection',
        recommended_action: 'Replace main bearing assembly and check oil lines',
        parts_required: 'LM2500-BRG-002, LM2500-HYD-008',
        sla_category: 'Critical',
        creation_source: 'manual',
        sensor_data: null
      },
      {
        wo: 'WO003',
        ship_id: 'SHIP_003',
        gte_system_id: 'GTE_004',
        assigned_to: 'USER_002',
        created_by: 'USER_003',
        fm: 'Engine Failure',
        priority: 'CASREP',
        status: 'Completed',
        eta: 1,
        symptoms: 'Complete engine failure during operation',
        recommended_action: 'Full engine overhaul required',
        parts_required: 'LM2500-TRB-001, LM2500-BRG-002, LM2500-PMP-005',
        sla_category: 'Emergency',
        creation_source: 'manual',
        sensor_data: null
      },
      // AI Generated Work Orders
      {
        wo: 'WO004',
        ship_id: 'SHIP_001',
        gte_system_id: 'GTE_002',
        assigned_to: null,
        created_by: null,
        fm: 'Engine Temperature Critical Alert',
        priority: 'Urgent',
        status: 'Pending approval',
        eta: 3,
        symptoms: 'Engine Temperature reading of 185.5 °F exceeds normal operating parameters.',
        recommended_action: 'Immediate inspection required for Main Engine. Check for potential failure conditions.',
        parts_required: 'Temperature sensors, Vibration dampeners',
        sla_category: 'Critical',
        creation_source: 'ai',
        sensor_data: JSON.stringify([
          {
            id: 'SENSOR_001',
            sensorId: 'TEMP_001',
            sensorName: 'Engine Temperature',
            sensorType: 'temperature',
            value: 185.5,
            unit: '°F',
            timestamp: new Date().toISOString(),
            status: 'critical',
            location: 'Main Engine',
            systemId: 'GTE_002'
          },
          {
            id: 'SENSOR_002',
            sensorId: 'VIB_001',
            sensorName: 'Vibration Sensor',
            sensorType: 'vibration',
            value: 8.2,
            unit: 'mm/s',
            timestamp: new Date().toISOString(),
            status: 'warning',
            location: 'Main Engine',
            systemId: 'GTE_002'
          }
        ])
      },
      {
        wo: 'WO005',
        ship_id: 'SHIP_002',
        gte_system_id: 'GTE_003',
        assigned_to: null,
        created_by: null,
        fm: 'Vibration Sensor Warning',
        priority: 'Routine',
        status: 'Pending approval',
        eta: 7,
        symptoms: 'Vibration Sensor showing elevated readings of 6.8 mm/s.',
        recommended_action: 'Schedule maintenance inspection for Main Engine. Monitor trends for potential issues.',
        parts_required: 'Monitoring equipment',
        sla_category: 'Standard',
        creation_source: 'ai',
        sensor_data: JSON.stringify([
          {
            id: 'SENSOR_003',
            sensorId: 'VIB_002',
            sensorName: 'Vibration Sensor',
            sensorType: 'vibration',
            value: 6.8,
            unit: 'mm/s',
            timestamp: new Date().toISOString(),
            status: 'warning',
            location: 'Main Engine',
            systemId: 'GTE_003'
          },
          {
            id: 'SENSOR_004',
            sensorId: 'PRESS_001',
            sensorName: 'Oil Pressure',
            sensorType: 'pressure',
            value: 12.5,
            unit: 'PSI',
            timestamp: new Date().toISOString(),
            status: 'normal',
            location: 'Main Engine',
            systemId: 'GTE_003'
          }
        ])
      },
      {
        wo: 'WO006',
        ship_id: 'SHIP_004',
        gte_system_id: null,
        assigned_to: null,
        created_by: null,
        fm: 'System Anomaly Detected',
        priority: 'Routine',
        status: 'Pending approval',
        eta: 7,
        symptoms: 'Multiple sensor readings indicate potential system issues.',
        recommended_action: 'Perform comprehensive system inspection.',
        parts_required: 'General inspection tools',
        sla_category: 'Standard',
        creation_source: 'ai',
        sensor_data: JSON.stringify([
          {
            id: 'SENSOR_005',
            sensorId: 'TEMP_002',
            sensorName: 'Engine Temperature',
            sensorType: 'temperature',
            value: 175.2,
            unit: '°F',
            timestamp: new Date().toISOString(),
            status: 'normal',
            location: 'Main Engine',
            systemId: 'GTE_005'
          },
          {
            id: 'SENSOR_006',
            sensorId: 'VIB_003',
            sensorName: 'Vibration Sensor',
            sensorType: 'vibration',
            value: 4.1,
            unit: 'mm/s',
            timestamp: new Date().toISOString(),
            status: 'normal',
            location: 'Main Engine',
            systemId: 'GTE_005'
          }
        ])
      }
    ];

    const insertWorkOrder = db.prepare(`
      INSERT INTO work_orders (wo, ship_id, gte_system_id, assigned_to, created_by, fm, priority, status, eta, symptoms, recommended_action, parts_required, sla_category, creation_source, sensor_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const workOrder of workOrdersData) {
      insertWorkOrder.run(
        workOrder.wo,
        workOrder.ship_id,
        workOrder.gte_system_id,
        workOrder.assigned_to,
        workOrder.created_by,
        workOrder.fm,
        workOrder.priority,
        workOrder.status,
        workOrder.eta,
        workOrder.symptoms,
        workOrder.recommended_action,
        workOrder.parts_required,
        workOrder.sla_category,
        workOrder.creation_source,
        workOrder.sensor_data
      );
    }

    console.log(`Created ${workOrdersData.length} work orders`);

    console.log('Database seeded successfully!');
    console.log(`Created ${shipsData.length} ships, ${usersData.length} users, ${gteSystemsData.length} GTE systems, ${partsData.length} parts, and ${workOrdersData.length} work orders`);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run seeding
seedDatabase();
