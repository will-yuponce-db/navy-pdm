import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.DATABRICKS_APP_URL ? [
      process.env.DATABRICKS_APP_URL,
      'http://localhost:3000',
      'http://localhost:5173'
    ] : ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Database setup
const dbPath = process.env.DATABASE_URL || join(__dirname, 'backend', 'instance', 'navy_pdm.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Middleware
app.use(cors({
  origin: process.env.DATABRICKS_APP_URL ? [
    process.env.DATABRICKS_APP_URL,
    'http://localhost:3000',
    'http://localhost:5173'
  ] : ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(express.json());

// Database initialization
function initializeDatabase() {
  // Create WorkOrder table
  db.exec(`
    CREATE TABLE IF NOT EXISTS work_orders (
      wo TEXT PRIMARY KEY,
      ship TEXT NOT NULL,
      homeport TEXT NOT NULL,
      fm TEXT NOT NULL,
      gte TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      eta INTEGER NOT NULL,
      symptoms TEXT,
      recommended_action TEXT,
      parts_required TEXT,
      sla_category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Part table
  db.exec(`
    CREATE TABLE IF NOT EXISTS parts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      system TEXT NOT NULL,
      category TEXT NOT NULL,
      stock_level INTEGER NOT NULL,
      min_stock INTEGER NOT NULL,
      max_stock INTEGER NOT NULL,
      location TEXT NOT NULL,
      condition TEXT NOT NULL,
      lead_time TEXT NOT NULL,
      supplier TEXT NOT NULL,
      cost REAL NOT NULL,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Notification table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      priority TEXT NOT NULL,
      category TEXT NOT NULL,
      read BOOLEAN DEFAULT 0,
      work_order_id TEXT
    )
  `);

  // Create trigger to update updated_at timestamp
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_work_orders_updated_at 
    AFTER UPDATE ON work_orders
    BEGIN
      UPDATE work_orders SET updated_at = CURRENT_TIMESTAMP WHERE wo = NEW.wo;
    END
  `);

  console.log('Database initialized successfully');
}

// Initialize database on startup
initializeDatabase();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join notification room for real-time updates
  socket.join('notifications');

  // Handle notification read events
  socket.on('notification:read', (data) => {
    try {
      const { notificationId } = data;
      const result = db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(notificationId);
      
      if (result.changes > 0) {
        // Broadcast to all clients that this notification was read
        io.to('notifications').emit('notification:read', { notificationId });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      socket.emit('error', { message: 'Failed to mark notification as read' });
    }
  });

  // Handle notification dismiss events
  socket.on('notification:dismiss', (data) => {
    try {
      const { notificationId } = data;
      const result = db.prepare('DELETE FROM notifications WHERE id = ?').run(notificationId);
      
      if (result.changes > 0) {
        // Broadcast to all clients that this notification was dismissed
        io.to('notifications').emit('notification:dismissed', { notificationId });
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
      socket.emit('error', { message: 'Failed to dismiss notification' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Helper function to broadcast notifications to all connected clients
function broadcastNotification(notification) {
  io.to('notifications').emit('notification:new', notification);
}

// API Routes
// Work Orders routes
app.get('/api/work-orders', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status;
    const priority = req.query.priority;
    const search = req.query.search;

    let whereClause = '';
    const params = [];

    if (status) {
      whereClause += ' WHERE status = ?';
      params.push(status);
    }

    if (priority) {
      whereClause += whereClause ? ' AND priority = ?' : ' WHERE priority = ?';
      params.push(priority);
    }

    if (search) {
      const searchCondition = ' (ship LIKE ? OR fm LIKE ? OR wo LIKE ?)';
      whereClause += whereClause ? ' AND' + searchCondition : ' WHERE' + searchCondition;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM work_orders${whereClause}`;
    const total = db.prepare(countQuery).get(...params).total;

    // Get paginated results
    const offset = (page - 1) * limit;
    const query = `SELECT * FROM work_orders${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const workOrders = db.prepare(query).all(...params, limit, offset);

    res.json({
      items: workOrders.map(wo => ({
        wo: wo.wo,
        ship: wo.ship,
        homeport: wo.homeport,
        fm: wo.fm,
        gte: wo.gte,
        priority: wo.priority,
        status: wo.status,
        eta: wo.eta,
        symptoms: wo.symptoms,
        recommendedAction: wo.recommended_action,
        partsRequired: wo.parts_required,
        slaCategory: wo.sla_category,
        createdAt: wo.created_at,
        updatedAt: wo.updated_at
      })),
      total,
      page,
      pageSize: limit,
      hasNext: (page * limit) < total,
      hasPrevious: page > 1
    });
  } catch (error) {
    console.error('Error fetching work orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/work-orders/:wo_id', (req, res) => {
  try {
    const workOrder = db.prepare('SELECT * FROM work_orders WHERE wo = ?').get(req.params.wo_id);
    
    if (!workOrder) {
      return res.status(404).json({ message: 'Work order not found' });
    }

    res.json({
      wo: workOrder.wo,
      ship: workOrder.ship,
      homeport: workOrder.homeport,
      fm: workOrder.fm,
      gte: workOrder.gte,
      priority: workOrder.priority,
      status: workOrder.status,
      eta: workOrder.eta,
      symptoms: workOrder.symptoms,
      recommendedAction: workOrder.recommended_action,
      partsRequired: workOrder.parts_required,
      slaCategory: workOrder.sla_category,
      createdAt: workOrder.created_at,
      updatedAt: workOrder.updated_at
    });
  } catch (error) {
    console.error('Error fetching work order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/work-orders', (req, res) => {
  try {
    const data = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO work_orders (wo, ship, homeport, fm, gte, priority, status, eta, symptoms, recommended_action, parts_required, sla_category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      data.wo,
      data.ship,
      data.homeport,
      data.fm,
      data.gte,
      data.priority,
      data.status,
      data.eta,
      data.symptoms || null,
      data.recommendedAction || null,
      data.partsRequired || null,
      data.slaCategory || null
    );

    const workOrder = db.prepare('SELECT * FROM work_orders WHERE wo = ?').get(data.wo);
    
    res.status(201).json({
      wo: workOrder.wo,
      ship: workOrder.ship,
      homeport: workOrder.homeport,
      fm: workOrder.fm,
      gte: workOrder.gte,
      priority: workOrder.priority,
      status: workOrder.status,
      eta: workOrder.eta,
      symptoms: workOrder.symptoms,
      recommendedAction: workOrder.recommended_action,
      partsRequired: workOrder.parts_required,
      slaCategory: workOrder.sla_category,
      createdAt: workOrder.created_at,
      updatedAt: workOrder.updated_at
    });
  } catch (error) {
    console.error('Error creating work order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/work-orders/:wo_id', (req, res) => {
  try {
    const data = req.body;
    const woId = req.params.wo_id;
    
    // Build dynamic update query
    const updates = [];
    const params = [];
    
    Object.keys(data).forEach(key => {
      if (key === 'recommendedAction') {
        updates.push('recommended_action = ?');
        params.push(data[key]);
      } else if (key === 'partsRequired') {
        updates.push('parts_required = ?');
        params.push(data[key]);
      } else if (key === 'slaCategory') {
        updates.push('sla_category = ?');
        params.push(data[key]);
      } else if (key !== 'wo' && key !== 'createdAt' && key !== 'updatedAt') {
        updates.push(`${key} = ?`);
        params.push(data[key]);
      }
    });
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    params.push(woId);
    const query = `UPDATE work_orders SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE wo = ?`;
    
    const result = db.prepare(query).run(...params);
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Work order not found' });
    }
    
    const workOrder = db.prepare('SELECT * FROM work_orders WHERE wo = ?').get(woId);
    
    res.json({
      wo: workOrder.wo,
      ship: workOrder.ship,
      homeport: workOrder.homeport,
      fm: workOrder.fm,
      gte: workOrder.gte,
      priority: workOrder.priority,
      status: workOrder.status,
      eta: workOrder.eta,
      symptoms: workOrder.symptoms,
      recommendedAction: workOrder.recommended_action,
      partsRequired: workOrder.parts_required,
      slaCategory: workOrder.sla_category,
      createdAt: workOrder.created_at,
      updatedAt: workOrder.updated_at
    });
  } catch (error) {
    console.error('Error updating work order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/work-orders/:wo_id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM work_orders WHERE wo = ?').run(req.params.wo_id);
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Work order not found' });
    }
    
    res.json({ message: 'Work order deleted successfully' });
  } catch (error) {
    console.error('Error deleting work order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/work-orders/bulk', (req, res) => {
  try {
    const { updates } = req.body;
    const updatedOrders = [];
    
    const transaction = db.transaction(() => {
      for (const update of updates) {
        const woId = update.id;
        const updateData = update.updates;
        
        // Build dynamic update query
        const updateFields = [];
        const params = [];
        
        Object.keys(updateData).forEach(key => {
          if (key === 'recommendedAction') {
            updateFields.push('recommended_action = ?');
            params.push(updateData[key]);
          } else if (key === 'partsRequired') {
            updateFields.push('parts_required = ?');
            params.push(updateData[key]);
          } else if (key === 'slaCategory') {
            updateFields.push('sla_category = ?');
            params.push(updateData[key]);
          } else if (key !== 'wo' && key !== 'createdAt' && key !== 'updatedAt') {
            updateFields.push(`${key} = ?`);
            params.push(updateData[key]);
          }
        });
        
        if (updateFields.length > 0) {
          params.push(woId);
          const query = `UPDATE work_orders SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE wo = ?`;
          
          const result = db.prepare(query).run(...params);
          
          if (result.changes > 0) {
            const workOrder = db.prepare('SELECT * FROM work_orders WHERE wo = ?').get(woId);
            updatedOrders.push({
              wo: workOrder.wo,
              ship: workOrder.ship,
              homeport: workOrder.homeport,
              fm: workOrder.fm,
              gte: workOrder.gte,
              priority: workOrder.priority,
              status: workOrder.status,
              eta: workOrder.eta,
              symptoms: workOrder.symptoms,
              recommendedAction: workOrder.recommended_action,
              partsRequired: workOrder.parts_required,
              slaCategory: workOrder.sla_category,
              createdAt: workOrder.created_at,
              updatedAt: workOrder.updated_at
            });
          }
        }
      }
    });
    
    transaction();
    
    res.json(updatedOrders);
  } catch (error) {
    console.error('Error bulk updating work orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Parts routes
app.get('/api/parts', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const category = req.query.category;
    const condition = req.query.condition;
    const search = req.query.search;

    let whereClause = '';
    const params = [];

    if (category) {
      whereClause += ' WHERE category = ?';
      params.push(category);
    }

    if (condition) {
      whereClause += whereClause ? ' AND condition = ?' : ' WHERE condition = ?';
      params.push(condition);
    }

    if (search) {
      const searchCondition = ' (name LIKE ? OR id LIKE ? OR supplier LIKE ? OR location LIKE ?)';
      whereClause += whereClause ? ' AND' + searchCondition : ' WHERE' + searchCondition;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM parts${whereClause}`;
    const total = db.prepare(countQuery).get(...params).total;

    // Get paginated results
    const offset = (page - 1) * limit;
    const query = `SELECT * FROM parts${whereClause} ORDER BY last_updated DESC LIMIT ? OFFSET ?`;
    const parts = db.prepare(query).all(...params, limit, offset);

    res.json({
      items: parts.map(part => ({
        id: part.id,
        name: part.name,
        system: part.system,
        category: part.category,
        stockLevel: part.stock_level,
        minStock: part.min_stock,
        maxStock: part.max_stock,
        location: part.location,
        condition: part.condition,
        leadTime: part.lead_time,
        supplier: part.supplier,
        cost: part.cost,
        lastUpdated: part.last_updated
      })),
      total,
      page,
      pageSize: limit,
      hasNext: (page * limit) < total,
      hasPrevious: page > 1
    });
  } catch (error) {
    console.error('Error fetching parts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/parts/:part_id', (req, res) => {
  try {
    const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(req.params.part_id);
    
    if (!part) {
      return res.status(404).json({ message: 'Part not found' });
    }

    res.json({
      id: part.id,
      name: part.name,
      system: part.system,
      category: part.category,
      stockLevel: part.stock_level,
      minStock: part.min_stock,
      maxStock: part.max_stock,
      location: part.location,
      condition: part.condition,
      leadTime: part.lead_time,
      supplier: part.supplier,
      cost: part.cost,
      lastUpdated: part.last_updated
    });
  } catch (error) {
    console.error('Error fetching part:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/parts', (req, res) => {
  try {
    const data = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO parts (id, name, system, category, stock_level, min_stock, max_stock, location, condition, lead_time, supplier, cost)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      data.id,
      data.name,
      data.system,
      data.category,
      data.stockLevel,
      data.minStock,
      data.maxStock,
      data.location,
      data.condition,
      data.leadTime,
      data.supplier,
      data.cost
    );

    const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(data.id);
    
    res.status(201).json({
      id: part.id,
      name: part.name,
      system: part.system,
      category: part.category,
      stockLevel: part.stock_level,
      minStock: part.min_stock,
      maxStock: part.max_stock,
      location: part.location,
      condition: part.condition,
      leadTime: part.lead_time,
      supplier: part.supplier,
      cost: part.cost,
      lastUpdated: part.last_updated
    });
  } catch (error) {
    console.error('Error creating part:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/parts/:part_id', (req, res) => {
  try {
    const data = req.body;
    const partId = req.params.part_id;
    
    // Build dynamic update query
    const updates = [];
    const params = [];
    
    Object.keys(data).forEach(key => {
      if (key === 'stockLevel') {
        updates.push('stock_level = ?');
        params.push(data[key]);
      } else if (key === 'minStock') {
        updates.push('min_stock = ?');
        params.push(data[key]);
      } else if (key === 'maxStock') {
        updates.push('max_stock = ?');
        params.push(data[key]);
      } else if (key === 'leadTime') {
        updates.push('lead_time = ?');
        params.push(data[key]);
      } else if (key === 'lastUpdated') {
        updates.push('last_updated = CURRENT_TIMESTAMP');
      } else if (key !== 'id' && key !== 'lastUpdated') {
        updates.push(`${key} = ?`);
        params.push(data[key]);
      }
    });
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    params.push(partId);
    const query = `UPDATE parts SET ${updates.join(', ')} WHERE id = ?`;
    
    const result = db.prepare(query).run(...params);
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Part not found' });
    }
    
    const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(partId);
    
    res.json({
      id: part.id,
      name: part.name,
      system: part.system,
      category: part.category,
      stockLevel: part.stock_level,
      minStock: part.min_stock,
      maxStock: part.max_stock,
      location: part.location,
      condition: part.condition,
      leadTime: part.lead_time,
      supplier: part.supplier,
      cost: part.cost,
      lastUpdated: part.last_updated
    });
  } catch (error) {
    console.error('Error updating part:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/parts/:part_id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM parts WHERE id = ?').run(req.params.part_id);
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Part not found' });
    }
    
    res.json({ message: 'Part deleted successfully' });
  } catch (error) {
    console.error('Error deleting part:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/parts/:part_id/stock', (req, res) => {
  try {
    const { quantity, operation } = req.body;
    const partId = req.params.part_id;
    
    const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(partId);
    
    if (!part) {
      return res.status(404).json({ message: 'Part not found' });
    }
    
    let newStockLevel = part.stock_level;
    
    if (operation === 'add') {
      newStockLevel += quantity;
    } else if (operation === 'subtract') {
      newStockLevel = Math.max(0, newStockLevel - quantity);
    }
    
    const result = db.prepare('UPDATE parts SET stock_level = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?').run(newStockLevel, partId);
    
    const updatedPart = db.prepare('SELECT * FROM parts WHERE id = ?').get(partId);
    
    res.json({
      id: updatedPart.id,
      name: updatedPart.name,
      system: updatedPart.system,
      category: updatedPart.category,
      stockLevel: updatedPart.stock_level,
      minStock: updatedPart.min_stock,
      maxStock: updatedPart.max_stock,
      location: updatedPart.location,
      condition: updatedPart.condition,
      leadTime: updatedPart.lead_time,
      supplier: updatedPart.supplier,
      cost: updatedPart.cost,
      lastUpdated: updatedPart.last_updated
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Notifications routes
app.post('/api/notifications', (req, res) => {
  try {
    const data = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO notifications (id, type, title, message, priority, category, work_order_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    stmt.run(
      notificationId,
      data.type,
      data.title,
      data.message,
      data.priority,
      data.category,
      data.workOrderId || null
    );

    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notificationId);
    
    const notificationData = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: notification.timestamp,
      priority: notification.priority,
      category: notification.category,
      read: Boolean(notification.read),
      workOrderId: notification.work_order_id
    };
    
    // Broadcast to all connected clients
    broadcastNotification(notificationData);
    
    res.status(201).json(notificationData);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/notifications', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const category = req.query.category;
    const priority = req.query.priority;
    const read = req.query.read;

    let whereClause = '';
    const params = [];

    if (category) {
      whereClause += ' WHERE category = ?';
      params.push(category);
    }

    if (priority) {
      whereClause += whereClause ? ' AND priority = ?' : ' WHERE priority = ?';
      params.push(priority);
    }

    if (read !== undefined) {
      whereClause += whereClause ? ' AND read = ?' : ' WHERE read = ?';
      params.push(read.toLowerCase() === 'true' ? 1 : 0);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM notifications${whereClause}`;
    const total = db.prepare(countQuery).get(...params).total;

    // Get paginated results
    const offset = (page - 1) * limit;
    const query = `SELECT * FROM notifications${whereClause} ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
    const notifications = db.prepare(query).all(...params, limit, offset);

    res.json({
      items: notifications.map(notif => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        timestamp: notif.timestamp,
        priority: notif.priority,
        category: notif.category,
        read: Boolean(notif.read),
        workOrderId: notif.work_order_id
      })),
      total,
      page,
      pageSize: limit,
      hasNext: (page * limit) < total,
      hasPrevious: page > 1
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/notifications/:notif_id/read', (req, res) => {
  try {
    const result = db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.notif_id);
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.notif_id);
    
    // Broadcast to all connected clients
    io.to('notifications').emit('notification:read', { notificationId: req.params.notif_id });
    
    res.json({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: notification.timestamp,
      priority: notification.priority,
      category: notification.category,
      read: Boolean(notification.read),
      workOrderId: notification.work_order_id
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/notifications/read-all', (req, res) => {
  try {
    db.prepare('UPDATE notifications SET read = 1').run();
    
    // Broadcast to all connected clients
    io.to('notifications').emit('notifications:all-read');
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/notifications/:notif_id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.notif_id);
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Broadcast to all connected clients
    io.to('notifications').emit('notification:dismissed', { notificationId: req.params.notif_id });
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analytics routes
app.get('/api/analytics/maintenance-kpis', (req, res) => {
  try {
    // Mock data for now - can be replaced with actual calculations
    res.json({
      gtesNeedingMaintenance: 12,
      gtesOperational: 45,
      casrepGtes: 3,
      trends: {
        maintenance: 'up',
        readiness: 'stable',
        efficiency: 'down'
      }
    });
  } catch (error) {
    console.error('Error fetching maintenance KPIs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/analytics/performance', (req, res) => {
  try {
    // Mock data for now
    res.json({
      efficiency: 87.5,
      downtime: 2.3,
      readiness: 94.2,
      maintenance: 78.9
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/analytics/fleet-readiness', (req, res) => {
  try {
    // Mock data for now
    res.json({
      overallReadiness: 92.5,
      byHomeport: {
        'NB Norfolk': 94.2,
        'San Diego': 91.8,
        'Pearl Harbor': 89.5
      },
      byShipClass: {
        'DDG': 93.1,
        'CG': 91.7,
        'FFG': 88.9
      }
    });
  } catch (error) {
    console.error('Error fetching fleet readiness:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/analytics/predictive-insights', (req, res) => {
  try {
    // Mock data for now
    res.json({
      predictedFailures: [
        {
          ship: 'USS Bainbridge (DDG-96)',
          gte: 'LM2500',
          probability: 0.75,
          estimatedDays: 14
        }
      ],
      maintenanceRecommendations: [
        {
          ship: 'USS Arleigh Burke (DDG-51)',
          gte: 'LM2500',
          recommendation: 'Schedule preventive maintenance for hot section',
          priority: 'high'
        }
      ]
    });
  } catch (error) {
    console.error('Error fetching predictive insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static files from build/client directory
app.use(express.static(join(__dirname, 'build/client')));

// Import and use React Router server
let reactRouterServer;
try {
  const { createRequestListener } = await import('@react-router/node');
  const serverBuild = await import('./build/server/index.js');
  
  // Create request handler using React Router v7 API
  // createRequestListener expects an options object with build property
  reactRouterServer = createRequestListener({
    build: serverBuild,
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development'
  });
  
  console.log('React Router server initialized with routes:', Object.keys(serverBuild.routes || {}));
} catch (error) {
  console.error('Failed to import React Router server:', error);
  console.error('Error stack:', error.stack);
  // Fallback for development or if server build fails
  reactRouterServer = (req, res) => {
    res.status(500).send(`React Router server not available: ${error.message}`);
  };
}

// Handle all other requests with React Router
app.all('*', reactRouterServer);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using integrated Node.js API server with WebSocket support`);
  console.log(`React Router SSR server loaded`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down API server...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down API server...');
  db.close();
  process.exit(0);
});
