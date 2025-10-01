#!/usr/bin/env python3
"""
Seed script to populate the SQLite database with data from Redux state
"""

import os
import sys

# Check for virtual environment and prevent usage
def check_virtual_environment():
    """Check if running in a virtual environment and exit if so"""
    venv_indicators = [
        'VIRTUAL_ENV' in os.environ,
        'CONDA_DEFAULT_ENV' in os.environ,
        'CONDA_PREFIX' in os.environ,
        'PIPENV_ACTIVE' in os.environ,
        'POETRY_ACTIVE' in os.environ,
        hasattr(sys, 'real_prefix'),
        (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
    ]
    
    if any(venv_indicators):
        print("⚠️  ERROR: Virtual environment detected!")
        print("   This script requires system Python, not virtual environment.")
        print("   Please deactivate your virtual environment and try again.")
        print("   Run: deactivate")
        sys.exit(1)

# Check for virtual environment before proceeding
check_virtual_environment()

from app import app, db, WorkOrder, Part, Notification
from datetime import datetime


def seed_database():
    """Seed the database with initial data"""

    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()

        # Note: User authentication has been removed from the system

        # Seed Work Orders (from workOrderSlice.tsx)
        work_orders_data = [
            {
                "wo": "ED569313",
                "ship": "USS Bainbridge (DDG-96)",
                "homeport": "NB Norfolk",
                "fm": "Vibration – Hot Section",
                "gte": "LM2500",
                "priority": "Routine",
                "status": "Submitted",
                "eta": 8,
                "symptoms": "Excessive vibration detected during operation",
                "recommended_action": "Inspect hot section components for wear",
                "parts_required": "Turbine Blade Set",
                "sla_category": "Priority",
                "created_at": datetime(2024, 1, 15, 10, 0, 0),
                "updated_at": datetime(2024, 1, 15, 10, 0, 0),
            },
            {
                "wo": "39A8CA7E",
                "ship": "USS Arleigh Burke (DDG-51)",
                "homeport": "NB Norfolk",
                "fm": "Oil Pressure – Low",
                "gte": "LM2500",
                "priority": "Urgent",
                "status": "In Progress",
                "eta": 5,
                "symptoms": "Oil pressure dropping below normal operating range",
                "recommended_action": "Replace main oil pump and check filter",
                "parts_required": "Main Oil Pump, Oil Filter Cartridge",
                "sla_category": "Urgent",
                "created_at": datetime(2024, 1, 14, 10, 0, 0),
                "updated_at": datetime(2024, 1, 14, 10, 0, 0),
            },
            {
                "wo": "CASREP001",
                "ship": "USS Cole (DDG-67)",
                "homeport": "NB Norfolk",
                "fm": "Temperature – High EGT",
                "gte": "LM2500",
                "priority": "CASREP",
                "status": "Submitted",
                "eta": 2,
                "symptoms": "Exhaust gas temperature exceeding limits",
                "recommended_action": "Emergency shutdown and immediate inspection",
                "parts_required": "Temperature Sensor",
                "sla_category": "Critical",
                "created_at": datetime(2024, 1, 15, 13, 0, 0),
                "updated_at": datetime(2024, 1, 15, 13, 0, 0),
            },
            {
                "wo": "WO2024001",
                "ship": "USS Winston S. Churchill (DDG-81)",
                "homeport": "NB Norfolk",
                "fm": "Fuel System – Leak",
                "gte": "LM2500",
                "priority": "Routine",
                "status": "Completed",
                "eta": 3,
                "symptoms": "Minor fuel leak detected at connection point",
                "recommended_action": "Replace fuel line connection and test",
                "parts_required": "Fuel Injector Assembly",
                "sla_category": "Standard",
                "created_at": datetime(2024, 1, 10, 8, 0, 0),
                "updated_at": datetime(2024, 1, 10, 8, 0, 0),
            },
            {
                "wo": "WO2024002",
                "ship": "USS Mitscher (DDG-57)",
                "homeport": "NB Norfolk",
                "fm": "Electrical – Generator",
                "gte": "LM2500",
                "priority": "Urgent",
                "status": "In Progress",
                "eta": 4,
                "symptoms": "Generator output voltage fluctuating",
                "recommended_action": "Check voltage regulator and connections",
                "parts_required": "Voltage Regulator",
                "sla_category": "Urgent",
                "created_at": datetime(2024, 1, 12, 14, 30, 0),
                "updated_at": datetime(2024, 1, 12, 14, 30, 0),
            },
            {
                "wo": "WO2024003",
                "ship": "USS Laboon (DDG-58)",
                "homeport": "NB Norfolk",
                "fm": "Cooling System – Pump",
                "gte": "LM2500",
                "priority": "Routine",
                "status": "Submitted",
                "eta": 6,
                "symptoms": "Cooling pump making unusual noise",
                "recommended_action": "Inspect pump bearings and replace if needed",
                "parts_required": "Main Bearing Assembly",
                "sla_category": "Standard",
                "created_at": datetime(2024, 1, 13, 9, 15, 0),
                "updated_at": datetime(2024, 1, 13, 9, 15, 0),
            },
            {
                "wo": "WO2024004",
                "ship": "USS Russell (DDG-59)",
                "homeport": "NB Norfolk",
                "fm": "Control System – Actuator",
                "gte": "LM2500",
                "priority": "Routine",
                "status": "Submitted",
                "eta": 7,
                "symptoms": "Actuator response time degraded",
                "recommended_action": "Calibrate actuator and check hydraulic pressure",
                "parts_required": "Hydraulic Fluid",
                "sla_category": "Standard",
                "created_at": datetime(2024, 1, 14, 16, 45, 0),
                "updated_at": datetime(2024, 1, 14, 16, 45, 0),
            },
            {
                "wo": "WO2024005",
                "ship": "USS Paul Hamilton (DDG-60)",
                "homeport": "NB Norfolk",
                "fm": "Exhaust System – Duct",
                "gte": "LM2500",
                "priority": "Urgent",
                "status": "In Progress",
                "eta": 3,
                "symptoms": "Exhaust duct showing signs of corrosion",
                "recommended_action": "Replace corroded sections and inspect remaining",
                "parts_required": "Exhaust Duct Section",
                "sla_category": "Urgent",
                "created_at": datetime(2024, 1, 15, 11, 20, 0),
                "updated_at": datetime(2024, 1, 15, 11, 20, 0),
            },
            {
                "wo": "WO2024006",
                "ship": "USS Ramage (DDG-61)",
                "homeport": "NB Norfolk",
                "fm": "Lubrication – Filter",
                "gte": "LM2500",
                "priority": "Routine",
                "status": "Completed",
                "eta": 2,
                "symptoms": "Oil filter bypass indicator activated",
                "recommended_action": "Replace oil filter and check oil quality",
                "parts_required": "Oil Filter Cartridge",
                "sla_category": "Standard",
                "created_at": datetime(2024, 1, 11, 13, 10, 0),
                "updated_at": datetime(2024, 1, 11, 13, 10, 0),
            },
            {
                "wo": "WO2024007",
                "ship": "USS Fitzgerald (DDG-62)",
                "homeport": "NB Norfolk",
                "fm": "Starting System – Motor",
                "gte": "LM2500",
                "priority": "Routine",
                "status": "Submitted",
                "eta": 5,
                "symptoms": "Starting motor slow to engage",
                "recommended_action": "Test motor windings and replace if necessary",
                "parts_required": "Starting Motor",
                "sla_category": "Standard",
                "created_at": datetime(2024, 1, 16, 7, 30, 0),
                "updated_at": datetime(2024, 1, 16, 7, 30, 0),
            },
        ]

        for wo_data in work_orders_data:
            work_order = WorkOrder(**wo_data)
            db.session.add(work_order)

        # Seed Parts (from partsSlice.tsx)
        parts_data = [
            {
                "id": "LM2500-TRB-001",
                "name": "Turbine Blade Set",
                "system": "LM2500",
                "category": "Hot Section",
                "stock_level": 12,
                "min_stock": 5,
                "max_stock": 25,
                "location": "Norfolk Supply Depot",
                "condition": "New",
                "lead_time": "45 days",
                "supplier": "General Electric",
                "cost": 75000,
                "last_updated": datetime.utcnow(),
            },
            {
                "id": "LM2500-BRG-002",
                "name": "Main Bearing Assembly",
                "system": "LM2500",
                "category": "Rotating Parts",
                "stock_level": 3,
                "min_stock": 2,
                "max_stock": 8,
                "location": "San Diego Supply",
                "condition": "New",
                "lead_time": "60 days",
                "supplier": "General Electric",
                "cost": 45000,
                "last_updated": datetime.utcnow(),
            },
            {
                "id": "LM2500-FIL-003",
                "name": "Oil Filter Cartridge",
                "system": "LM2500",
                "category": "Consumables",
                "stock_level": 85,
                "min_stock": 50,
                "max_stock": 200,
                "location": "Norfolk Supply Depot",
                "condition": "New",
                "lead_time": "14 days",
                "supplier": "Parker Hannifin",
                "cost": 250,
                "last_updated": datetime.utcnow(),
            },
            {
                "id": "LM2500-SEN-004",
                "name": "Temperature Sensor",
                "system": "LM2500",
                "category": "Electronics",
                "stock_level": 1,
                "min_stock": 5,
                "max_stock": 15,
                "location": "Pearl Harbor Supply",
                "condition": "New",
                "lead_time": "30 days",
                "supplier": "Honeywell",
                "cost": 1500,
                "last_updated": datetime.utcnow(),
            },
            {
                "id": "LM2500-PMP-005",
                "name": "Main Oil Pump",
                "system": "LM2500",
                "category": "Hydraulics",
                "stock_level": 2,
                "min_stock": 3,
                "max_stock": 10,
                "location": "Norfolk Supply Depot",
                "condition": "Refurbished",
                "lead_time": "30 days",
                "supplier": "General Electric",
                "cost": 25000,
                "last_updated": datetime.utcnow(),
            },
            {
                "id": "LM2500-FUEL-006",
                "name": "Fuel Injector Assembly",
                "system": "LM2500",
                "category": "Fuel System",
                "stock_level": 8,
                "min_stock": 4,
                "max_stock": 20,
                "location": "San Diego Supply",
                "condition": "New",
                "lead_time": "21 days",
                "supplier": "General Electric",
                "cost": 12000,
                "last_updated": datetime.utcnow(),
            },
            {
                "id": "LM2500-ELEC-007",
                "name": "Voltage Regulator",
                "system": "LM2500",
                "category": "Electronics",
                "stock_level": 5,
                "min_stock": 3,
                "max_stock": 12,
                "location": "Norfolk Supply Depot",
                "condition": "New",
                "lead_time": "25 days",
                "supplier": "Honeywell",
                "cost": 3500,
                "last_updated": datetime.utcnow(),
            },
            {
                "id": "LM2500-HYD-008",
                "name": "Hydraulic Fluid",
                "system": "LM2500",
                "category": "Consumables",
                "stock_level": 50,
                "min_stock": 20,
                "max_stock": 100,
                "location": "Norfolk Supply Depot",
                "condition": "New",
                "lead_time": "7 days",
                "supplier": "Shell Oil",
                "cost": 150,
                "last_updated": datetime.utcnow(),
            },
            {
                "id": "LM2500-EXH-009",
                "name": "Exhaust Duct Section",
                "system": "LM2500",
                "category": "Hot Section",
                "stock_level": 4,
                "min_stock": 2,
                "max_stock": 8,
                "location": "San Diego Supply",
                "condition": "New",
                "lead_time": "35 days",
                "supplier": "General Electric",
                "cost": 18000,
                "last_updated": datetime.utcnow(),
            },
            {
                "id": "LM2500-START-010",
                "name": "Starting Motor",
                "system": "LM2500",
                "category": "Electronics",
                "stock_level": 3,
                "min_stock": 2,
                "max_stock": 6,
                "location": "Pearl Harbor Supply",
                "condition": "Refurbished",
                "lead_time": "40 days",
                "supplier": "General Electric",
                "cost": 22000,
                "last_updated": datetime.utcnow(),
            },
        ]

        for part_data in parts_data:
            part = Part(**part_data)
            db.session.add(part)

        # Seed some initial notifications
        notifications_data = [
            {
                "id": "notif_001",
                "type": "info",
                "title": "System Initialized",
                "message": (
                    "Navy PdM system has been successfully initialized with seed data"
                ),
                "timestamp": datetime.utcnow(),
                "priority": "medium",
                "category": "system",
                "read": False,
            },
            {
                "id": "notif_002",
                "type": "warning",
                "title": "Low Stock Alert",
                "message": (
                    "Temperature Sensor (LM2500-SEN-004) is at critical stock: 1 units"
                ),
                "timestamp": datetime.utcnow(),
                "priority": "high",
                "category": "alert",
                "read": False,
                "work_order_id": None,
            },
            {
                "id": "notif_003",
                "type": "error",
                "title": "CASREP Alert",
                "message": "CASREP work order CASREP001 requires immediate attention",
                "timestamp": datetime.utcnow(),
                "priority": "critical",
                "category": "alert",
                "read": False,
                "work_order_id": "CASREP001",
            },
        ]

        for notif_data in notifications_data:
            notification = Notification(**notif_data)
            db.session.add(notification)

        # Commit all changes
        db.session.commit()

        print("Database seeded successfully!")
        print(f"Created {len(work_orders_data)} work orders")
        print(f"Created {len(parts_data)} parts")
        print(f"Created {len(notifications_data)} notifications")
        print("Note: User authentication has been removed from the system")


if __name__ == "__main__":
    seed_database()
