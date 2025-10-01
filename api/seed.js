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
    // Clear existing data
    db.exec('DELETE FROM notifications');
    db.exec('DELETE FROM parts');
    db.exec('DELETE FROM work_orders');

    // Seed Work Orders
    const workOrdersData = [
      {
        wo: 'ED569313',
        ship: 'USS Bainbridge (DDG-96)',
        homeport: 'NB Norfolk',
        fm: 'Vibration – Hot Section',
        gte: 'LM2500',
        priority: 'Routine',
        status: 'Submitted',
        eta: 8,
        symptoms: 'Excessive vibration detected during operation',
        recommended_action: 'Inspect hot section components for wear',
        parts_required: 'Turbine Blade Set',
        sla_category: 'Priority',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z'
      },
      {
        wo: '39A8CA7E',
        ship: 'USS Arleigh Burke (DDG-51)',
        homeport: 'NB Norfolk',
        fm: 'Oil Pressure – Low',
        gte: 'LM2500',
        priority: 'Urgent',
        status: 'In Progress',
        eta: 5,
        symptoms: 'Oil pressure dropping below normal operating range',
        recommended_action: 'Replace main oil pump and check filter',
        parts_required: 'Main Oil Pump, Oil Filter Cartridge',
        sla_category: 'Urgent',
        created_at: '2024-01-14T10:00:00.000Z',
        updated_at: '2024-01-14T10:00:00.000Z'
      },
      {
        wo: 'CASREP001',
        ship: 'USS Cole (DDG-67)',
        homeport: 'NB Norfolk',
        fm: 'Temperature – High EGT',
        gte: 'LM2500',
        priority: 'CASREP',
        status: 'Submitted',
        eta: 2,
        symptoms: 'Exhaust gas temperature exceeding limits',
        recommended_action: 'Emergency shutdown and immediate inspection',
        parts_required: 'Temperature Sensor',
        sla_category: 'Critical',
        created_at: '2024-01-15T13:00:00.000Z',
        updated_at: '2024-01-15T13:00:00.000Z'
      },
      {
        wo: 'WO2024001',
        ship: 'USS Winston S. Churchill (DDG-81)',
        homeport: 'NB Norfolk',
        fm: 'Fuel System – Leak',
        gte: 'LM2500',
        priority: 'Routine',
        status: 'Completed',
        eta: 3,
        symptoms: 'Minor fuel leak detected at connection point',
        recommended_action: 'Replace fuel line connection and test',
        parts_required: 'Fuel Injector Assembly',
        sla_category: 'Standard',
        created_at: '2024-01-10T08:00:00.000Z',
        updated_at: '2024-01-10T08:00:00.000Z'
      },
      {
        wo: 'WO2024002',
        ship: 'USS Mitscher (DDG-57)',
        homeport: 'NB Norfolk',
        fm: 'Electrical – Generator',
        gte: 'LM2500',
        priority: 'Urgent',
        status: 'In Progress',
        eta: 4,
        symptoms: 'Generator output voltage fluctuating',
        recommended_action: 'Check voltage regulator and connections',
        parts_required: 'Voltage Regulator',
        sla_category: 'Urgent',
        created_at: '2024-01-12T14:30:00.000Z',
        updated_at: '2024-01-12T14:30:00.000Z'
      },
      {
        wo: 'WO2024003',
        ship: 'USS Laboon (DDG-58)',
        homeport: 'NB Norfolk',
        fm: 'Cooling System – Pump',
        gte: 'LM2500',
        priority: 'Routine',
        status: 'Submitted',
        eta: 6,
        symptoms: 'Cooling pump making unusual noise',
        recommended_action: 'Inspect pump bearings and replace if needed',
        parts_required: 'Main Bearing Assembly',
        sla_category: 'Standard',
        created_at: '2024-01-13T09:15:00.000Z',
        updated_at: '2024-01-13T09:15:00.000Z'
      },
      {
        wo: 'WO2024004',
        ship: 'USS Russell (DDG-59)',
        homeport: 'NB Norfolk',
        fm: 'Control System – Actuator',
        gte: 'LM2500',
        priority: 'Routine',
        status: 'Submitted',
        eta: 7,
        symptoms: 'Actuator response time degraded',
        recommended_action: 'Calibrate actuator and check hydraulic pressure',
        parts_required: 'Hydraulic Fluid',
        sla_category: 'Standard',
        created_at: '2024-01-14T16:45:00.000Z',
        updated_at: '2024-01-14T16:45:00.000Z'
      },
      {
        wo: 'WO2024005',
        ship: 'USS Paul Hamilton (DDG-60)',
        homeport: 'NB Norfolk',
        fm: 'Exhaust System – Duct',
        gte: 'LM2500',
        priority: 'Urgent',
        status: 'In Progress',
        eta: 3,
        symptoms: 'Exhaust duct showing signs of corrosion',
        recommended_action: 'Replace corroded sections and inspect remaining',
        parts_required: 'Exhaust Duct Section',
        sla_category: 'Urgent',
        created_at: '2024-01-15T11:20:00.000Z',
        updated_at: '2024-01-15T11:20:00.000Z'
      },
      {
        wo: 'WO2024006',
        ship: 'USS Ramage (DDG-61)',
        homeport: 'NB Norfolk',
        fm: 'Lubrication – Filter',
        gte: 'LM2500',
        priority: 'Routine',
        status: 'Completed',
        eta: 2,
        symptoms: 'Oil filter bypass indicator activated',
        recommended_action: 'Replace oil filter and check oil quality',
        parts_required: 'Oil Filter Cartridge',
        sla_category: 'Standard',
        created_at: '2024-01-11T13:10:00.000Z',
        updated_at: '2024-01-11T13:10:00.000Z'
      },
      {
        wo: 'WO2024007',
        ship: 'USS Fitzgerald (DDG-62)',
        homeport: 'NB Norfolk',
        fm: 'Starting System – Motor',
        gte: 'LM2500',
        priority: 'Routine',
        status: 'Submitted',
        eta: 5,
        symptoms: 'Starting motor slow to engage',
        recommended_action: 'Test motor windings and replace if necessary',
        parts_required: 'Starting Motor',
        sla_category: 'Standard',
        created_at: '2024-01-16T07:30:00.000Z',
        updated_at: '2024-01-16T07:30:00.000Z'
      }
    ];

    const insertWorkOrder = db.prepare(`
      INSERT INTO work_orders (wo, ship, homeport, fm, gte, priority, status, eta, symptoms, recommended_action, parts_required, sla_category, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const wo of workOrdersData) {
      insertWorkOrder.run(
        wo.wo, wo.ship, wo.homeport, wo.fm, wo.gte, wo.priority, wo.status, wo.eta,
        wo.symptoms, wo.recommended_action, wo.parts_required, wo.sla_category,
        wo.created_at, wo.updated_at
      );
    }

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

    // Seed Notifications
    const notificationsData = [
      {
        id: 'notif_001',
        type: 'info',
        title: 'System Initialized',
        message: 'Navy PdM system has been successfully initialized with seed data',
        timestamp: new Date().toISOString(),
        priority: 'medium',
        category: 'system',
        read: 0,
        work_order_id: null
      },
      {
        id: 'notif_002',
        type: 'warning',
        title: 'Low Stock Alert',
        message: 'Temperature Sensor (LM2500-SEN-004) is at critical stock: 1 units',
        timestamp: new Date().toISOString(),
        priority: 'high',
        category: 'alert',
        read: 0,
        work_order_id: null
      },
      {
        id: 'notif_003',
        type: 'error',
        title: 'CASREP Alert',
        message: 'CASREP work order CASREP001 requires immediate attention',
        timestamp: new Date().toISOString(),
        priority: 'critical',
        category: 'alert',
        read: 0,
        work_order_id: 'CASREP001'
      }
    ];

    const insertNotification = db.prepare(`
      INSERT INTO notifications (id, type, title, message, timestamp, priority, category, read, work_order_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const notif of notificationsData) {
      insertNotification.run(
        notif.id, notif.type, notif.title, notif.message, notif.timestamp,
        notif.priority, notif.category, notif.read, notif.work_order_id
      );
    }

    console.log('Database seeded successfully!');
    console.log(`Created ${workOrdersData.length} work orders`);
    console.log(`Created ${partsData.length} parts`);
    console.log(`Created ${notificationsData.length} notifications`);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run seeding
seedDatabase();
