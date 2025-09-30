from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from datetime import datetime, date
import os
import json
import logging
from typing import Dict, List, Optional, Any

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///navy_pdm.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
}

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db = SQLAlchemy(app)
migrate = Migrate(app, db)
# CORS configuration - allow all origins in production, specific origins in development
allowed_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')
CORS(app, origins=allowed_origins)

# Database Models

class WorkOrder(db.Model):
    wo = db.Column(db.String(50), primary_key=True)
    ship = db.Column(db.String(100), nullable=False)
    homeport = db.Column(db.String(100), nullable=False)
    fm = db.Column(db.String(200), nullable=False)  # Failure Mode
    gte = db.Column(db.String(50), nullable=False)  # Gas Turbine Engine
    priority = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), nullable=False)
    eta = db.Column(db.Integer, nullable=False)
    symptoms = db.Column(db.Text)
    recommended_action = db.Column(db.Text)
    parts_required = db.Column(db.Text)
    sla_category = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'wo': self.wo,
            'ship': self.ship,
            'homeport': self.homeport,
            'fm': self.fm,
            'gte': self.gte,
            'priority': self.priority,
            'status': self.status,
            'eta': self.eta,
            'symptoms': self.symptoms,
            'recommendedAction': self.recommended_action,
            'partsRequired': self.parts_required,
            'slaCategory': self.sla_category,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }

class Part(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    system = db.Column(db.String(50), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    stock_level = db.Column(db.Integer, nullable=False)
    min_stock = db.Column(db.Integer, nullable=False)
    max_stock = db.Column(db.Integer, nullable=False)
    location = db.Column(db.String(100), nullable=False)
    condition = db.Column(db.String(50), nullable=False)
    lead_time = db.Column(db.String(50), nullable=False)
    supplier = db.Column(db.String(100), nullable=False)
    cost = db.Column(db.Float, nullable=False)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'system': self.system,
            'category': self.category,
            'stockLevel': self.stock_level,
            'minStock': self.min_stock,
            'maxStock': self.max_stock,
            'location': self.location,
            'condition': self.condition,
            'leadTime': self.lead_time,
            'supplier': self.supplier,
            'cost': self.cost,
            'lastUpdated': self.last_updated.isoformat()
        }

class Notification(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    type = db.Column(db.String(20), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    priority = db.Column(db.String(20), nullable=False)
    category = db.Column(db.String(20), nullable=False)
    read = db.Column(db.Boolean, default=False)
    work_order_id = db.Column(db.String(50))

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'timestamp': self.timestamp.isoformat(),
            'priority': self.priority,
            'category': self.category,
            'read': self.read,
            'workOrderId': self.work_order_id
        }



# Work Orders routes
@app.route('/api/work-orders', methods=['GET'])
def get_work_orders():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    status = request.args.get('status')
    priority = request.args.get('priority')
    search = request.args.get('search')
    
    query = WorkOrder.query
    
    if status:
        query = query.filter(WorkOrder.status == status)
    if priority:
        query = query.filter(WorkOrder.priority == priority)
    if search:
        query = query.filter(
            WorkOrder.ship.contains(search) |
            WorkOrder.fm.contains(search) |
            WorkOrder.wo.contains(search)
        )
    
    total = query.count()
    work_orders = query.offset((page - 1) * limit).limit(limit).all()
    
    return jsonify({
        'items': [wo.to_dict() for wo in work_orders],
        'total': total,
        'page': page,
        'pageSize': limit,
        'hasNext': (page * limit) < total,
        'hasPrevious': page > 1
    })

@app.route('/api/work-orders/<wo_id>', methods=['GET'])
def get_work_order(wo_id):
    work_order = WorkOrder.query.get(wo_id)
    if not work_order:
        return jsonify({'message': 'Work order not found'}), 404
    return jsonify(work_order.to_dict())

@app.route('/api/work-orders', methods=['POST'])
def create_work_order():
    data = request.get_json()
    
    work_order = WorkOrder(
        wo=data['wo'],
        ship=data['ship'],
        homeport=data['homeport'],
        fm=data['fm'],
        gte=data['gte'],
        priority=data['priority'],
        status=data['status'],
        eta=data['eta'],
        symptoms=data.get('symptoms'),
        recommended_action=data.get('recommendedAction'),
        parts_required=data.get('partsRequired'),
        sla_category=data.get('slaCategory')
    )
    
    db.session.add(work_order)
    db.session.commit()
    
    return jsonify(work_order.to_dict()), 201

@app.route('/api/work-orders/<wo_id>', methods=['PATCH'])
def update_work_order(wo_id):
    work_order = WorkOrder.query.get(wo_id)
    if not work_order:
        return jsonify({'message': 'Work order not found'}), 404
    
    data = request.get_json()
    for key, value in data.items():
        if hasattr(work_order, key):
            setattr(work_order, key, value)
        elif key == 'recommendedAction':
            work_order.recommended_action = value
        elif key == 'partsRequired':
            work_order.parts_required = value
        elif key == 'slaCategory':
            work_order.sla_category = value
    
    work_order.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(work_order.to_dict())

@app.route('/api/work-orders/<wo_id>', methods=['DELETE'])
def delete_work_order(wo_id):
    work_order = WorkOrder.query.get(wo_id)
    if not work_order:
        return jsonify({'message': 'Work order not found'}), 404
    
    db.session.delete(work_order)
    db.session.commit()
    
    return jsonify({'message': 'Work order deleted successfully'})

@app.route('/api/work-orders/bulk', methods=['PATCH'])
def bulk_update_work_orders():
    data = request.get_json()
    updated_orders = []
    
    for update in data['updates']:
        work_order = WorkOrder.query.get(update['id'])
        if work_order:
            for key, value in update['updates'].items():
                if hasattr(work_order, key):
                    setattr(work_order, key, value)
                elif key == 'recommendedAction':
                    work_order.recommended_action = value
                elif key == 'partsRequired':
                    work_order.parts_required = value
                elif key == 'slaCategory':
                    work_order.sla_category = value
            
            work_order.updated_at = datetime.utcnow()
            updated_orders.append(work_order)
    
    db.session.commit()
    return jsonify([wo.to_dict() for wo in updated_orders])

# Parts routes
@app.route('/api/parts', methods=['GET'])
def get_parts():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    category = request.args.get('category')
    condition = request.args.get('condition')
    search = request.args.get('search')
    
    query = Part.query
    
    if category:
        query = query.filter(Part.category == category)
    if condition:
        query = query.filter(Part.condition == condition)
    if search:
        query = query.filter(
            Part.name.contains(search) |
            Part.id.contains(search) |
            Part.supplier.contains(search) |
            Part.location.contains(search)
        )
    
    total = query.count()
    parts = query.offset((page - 1) * limit).limit(limit).all()
    
    return jsonify({
        'items': [part.to_dict() for part in parts],
        'total': total,
        'page': page,
        'pageSize': limit,
        'hasNext': (page * limit) < total,
        'hasPrevious': page > 1
    })

@app.route('/api/parts/<part_id>', methods=['GET'])
def get_part(part_id):
    part = Part.query.get(part_id)
    if not part:
        return jsonify({'message': 'Part not found'}), 404
    return jsonify(part.to_dict())

@app.route('/api/parts', methods=['POST'])
def create_part():
    data = request.get_json()
    
    part = Part(
        id=data['id'],
        name=data['name'],
        system=data['system'],
        category=data['category'],
        stock_level=data['stockLevel'],
        min_stock=data['minStock'],
        max_stock=data['maxStock'],
        location=data['location'],
        condition=data['condition'],
        lead_time=data['leadTime'],
        supplier=data['supplier'],
        cost=data['cost']
    )
    
    db.session.add(part)
    db.session.commit()
    
    return jsonify(part.to_dict()), 201

@app.route('/api/parts/<part_id>', methods=['PATCH'])
def update_part(part_id):
    part = Part.query.get(part_id)
    if not part:
        return jsonify({'message': 'Part not found'}), 404
    
    data = request.get_json()
    for key, value in data.items():
        if hasattr(part, key):
            setattr(part, key, value)
        elif key == 'stockLevel':
            part.stock_level = value
        elif key == 'minStock':
            part.min_stock = value
        elif key == 'maxStock':
            part.max_stock = value
        elif key == 'leadTime':
            part.lead_time = value
        elif key == 'lastUpdated':
            part.last_updated = datetime.utcnow()
    
    db.session.commit()
    return jsonify(part.to_dict())

@app.route('/api/parts/<part_id>', methods=['DELETE'])
def delete_part(part_id):
    part = Part.query.get(part_id)
    if not part:
        return jsonify({'message': 'Part not found'}), 404
    
    db.session.delete(part)
    db.session.commit()
    
    return jsonify({'message': 'Part deleted successfully'})

@app.route('/api/parts/<part_id>/stock', methods=['PATCH'])
def update_stock(part_id):
    part = Part.query.get(part_id)
    if not part:
        return jsonify({'message': 'Part not found'}), 404
    
    data = request.get_json()
    quantity = data['quantity']
    operation = data['operation']
    
    if operation == 'add':
        part.stock_level += quantity
    elif operation == 'subtract':
        part.stock_level = max(0, part.stock_level - quantity)
    
    part.last_updated = datetime.utcnow()
    db.session.commit()
    
    return jsonify(part.to_dict())

# Notifications routes
@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    category = request.args.get('category')
    priority = request.args.get('priority')
    read = request.args.get('read')
    
    query = Notification.query
    
    if category:
        query = query.filter(Notification.category == category)
    if priority:
        query = query.filter(Notification.priority == priority)
    if read is not None:
        query = query.filter(Notification.read == (read.lower() == 'true'))
    
    total = query.count()
    notifications = query.order_by(Notification.timestamp.desc()).offset((page - 1) * limit).limit(limit).all()
    
    return jsonify({
        'items': [notif.to_dict() for notif in notifications],
        'total': total,
        'page': page,
        'pageSize': limit,
        'hasNext': (page * limit) < total,
        'hasPrevious': page > 1
    })

@app.route('/api/notifications/<notif_id>/read', methods=['PATCH'])
def mark_notification_read(notif_id):
    notification = Notification.query.get(notif_id)
    if not notification:
        return jsonify({'message': 'Notification not found'}), 404
    
    notification.read = True
    db.session.commit()
    
    return jsonify(notification.to_dict())

@app.route('/api/notifications/read-all', methods=['PATCH'])
def mark_all_notifications_read():
    Notification.query.update({'read': True})
    db.session.commit()
    
    return jsonify({'message': 'All notifications marked as read'})

@app.route('/api/notifications/<notif_id>', methods=['DELETE'])
def delete_notification(notif_id):
    notification = Notification.query.get(notif_id)
    if not notification:
        return jsonify({'message': 'Notification not found'}), 404
    
    db.session.delete(notification)
    db.session.commit()
    
    return jsonify({'message': 'Notification deleted successfully'})

# Analytics routes
@app.route('/api/analytics/maintenance-kpis', methods=['GET'])
def get_maintenance_kpis():
    # Mock data for now - can be replaced with actual calculations
    return jsonify({
        'gtesNeedingMaintenance': 12,
        'gtesOperational': 45,
        'casrepGtes': 3,
        'trends': {
            'maintenance': 'up',
            'readiness': 'stable',
            'efficiency': 'down'
        }
    })

@app.route('/api/analytics/performance', methods=['GET'])
def get_performance_metrics():
    time_range = request.args.get('timeRange', '30d')
    
    # Mock data for now
    return jsonify({
        'efficiency': 87.5,
        'downtime': 2.3,
        'readiness': 94.2,
        'maintenance': 78.9
    })

@app.route('/api/analytics/fleet-readiness', methods=['GET'])
def get_fleet_readiness():
    # Mock data for now
    return jsonify({
        'overallReadiness': 92.5,
        'byHomeport': {
            'NB Norfolk': 94.2,
            'San Diego': 91.8,
            'Pearl Harbor': 89.5
        },
        'byShipClass': {
            'DDG': 93.1,
            'CG': 91.7,
            'FFG': 88.9
        }
    })

@app.route('/api/analytics/predictive-insights', methods=['GET'])
def get_predictive_insights():
    # Mock data for now
    return jsonify({
        'predictedFailures': [
            {
                'ship': 'USS Bainbridge (DDG-96)',
                'gte': 'LM2500',
                'probability': 0.75,
                'estimatedDays': 14
            }
        ],
        'maintenanceRecommendations': [
            {
                'ship': 'USS Arleigh Burke (DDG-51)',
                'gte': 'LM2500',
                'recommendation': 'Schedule preventive maintenance for hot section',
                'priority': 'high'
            }
        ]
    })

# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        logger.info('Database tables created successfully')
    
    # Only run in debug mode for development
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug_mode, host='0.0.0.0', port=5000)
