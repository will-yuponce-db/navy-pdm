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
    db.exec('DELETE FROM parts');

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

    console.log('Database seeded successfully!');
    console.log(`Created ${partsData.length} parts`);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run seeding
seedDatabase();
