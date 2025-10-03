import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// Database setup
const dbPath = join(__dirname, 'backend', 'instance', 'navy_pdm.db');
const db = new Database(dbPath);

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Helper function for Databricks unavailability
function databricksUnavailable(res, endpoint) {
  return res.status(503).json({
    success: false,
    message: `Databricks ${endpoint} not available in development mode`,
    diagnostics: {
      note: 'This endpoint requires Databricks connection which is configured for production deployment',
      development: 'Using local SQLite database for development',
      documentation: 'See DATABRICKS_SETUP.md for configuration details'
    }
  });
}

// ============================================================================
// DATABRICKS API ROUTES (Development placeholders)
// ============================================================================
// These endpoints return informative errors in development.
// In production with proper TypeScript compilation, these would connect to Databricks.

app.get('/api/databricks/health', async (req, res) => {
  res.status(503).json({
    status: 'unavailable',
    timestamp: new Date().toISOString(),
    message: 'Databricks integration requires production deployment',
    diagnostics: {
      mode: 'development',
      note: 'TypeScript compilation required for Databricks integration'
    }
  });
});

app.get('/api/databricks/test', async (req, res) => {
  databricksUnavailable(res, 'test');
});

app.post('/api/databricks/query', async (req, res) => {
  databricksUnavailable(res, 'custom query');
});

app.get('/api/databricks/ai-work-orders', async (req, res) => {
  databricksUnavailable(res, 'AI work orders');
});

app.get('/api/databricks/ai-work-orders/:workOrderId', async (req, res) => {
  databricksUnavailable(res, 'AI work order details');
});

app.get('/api/databricks/ship-status', async (req, res) => {
  databricksUnavailable(res, 'ship status');
});

app.get('/api/databricks/ship-status/:turbineId', async (req, res) => {
  databricksUnavailable(res, 'ship status by turbine');
});

// Get parts requisitions (fallback to SQLite)
app.get('/api/databricks/parts-requisitions', async (req, res) => {
  try {
    const { limit = 1000, orderNumber, partType, stockLocation } = req.query;
    
    let query = 'SELECT * FROM parts_requisitions WHERE 1=1';
    const params = [];
    
    if (orderNumber) {
      query += ' AND order_number = ?';
      params.push(orderNumber);
    }
    
    if (partType) {
      query += ' AND part_type LIKE ?';
      params.push(`%${partType}%`);
    }
    
    if (stockLocation) {
      query += ' AND stock_location LIKE ?';
      params.push(`%${stockLocation}%`);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const stmt = db.prepare(query);
    const requisitions = stmt.all(...params);
    
    res.json({
      success: true,
      data: requisitions,
      count: requisitions.length,
      source: 'sqlite'
    });
  } catch (error) {
    console.error('Error fetching parts requisitions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/databricks/parts-requisitions/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const stmt = db.prepare('SELECT * FROM parts_requisitions WHERE order_number = ?');
    const requisitions = stmt.all(orderNumber);
    
    if (requisitions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No requisitions found for this order number'
      });
    }
    
    res.json({
      success: true,
      data: requisitions,
      source: 'sqlite'
    });
  } catch (error) {
    console.error('Error fetching parts requisition:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/databricks/parts-requisitions/ship/:designatorId', async (req, res) => {
  try {
    const { designatorId } = req.params;
    const stmt = db.prepare('SELECT * FROM parts_requisitions WHERE designator_id = ?');
    const requisitions = stmt.all(designatorId);
    
    res.json({
      success: true,
      data: requisitions,
      count: requisitions.length,
      source: 'sqlite'
    });
  } catch (error) {
    console.error('Error fetching parts requisitions by ship:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new parts requisition/supply order
app.post('/api/parts-requisitions', async (req, res) => {
  try {
    const {
      partType,
      quantityShipped,
      stockLocationId,
      stockLocation,
      designatorId,
      designator,
      orderNumber
    } = req.body;

    // Validate required fields
    if (!partType || !quantityShipped || !stockLocation || !designator) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: partType, quantityShipped, stockLocation, designator'
      });
    }

    // Parse ship name and designation from designator string
    const match = designator.match(/^(.+?)\s*\(([^)]+)\)$/);
    const shipName = match ? match[1].trim() : designator;
    const shipDesignation = match ? match[2].trim() : '';

    // Generate ID and order number if not provided
    const finalOrderNumber = orderNumber || `PR-${Date.now().toString().slice(-6)}`;
    const id = `${finalOrderNumber}-${designatorId || Date.now()}-${partType}`;
    const createdAt = new Date().toISOString();

    // Insert into database
    const stmt = db.prepare(`
      INSERT INTO parts_requisitions (
        id, order_number, part_type, quantity_shipped,
        stock_location_id, stock_location, designator_id, designator,
        ship_name, ship_designation, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      id,
      finalOrderNumber,
      partType,
      quantityShipped,
      stockLocationId || 'supply_1',
      stockLocation,
      designatorId || 'unknown',
      designator,
      shipName,
      shipDesignation,
      createdAt
    );

    // Fetch the created requisition
    const getStmt = db.prepare('SELECT * FROM parts_requisitions WHERE id = ?');
    const createdRequisition = getStmt.get(id);

    console.log(`Created supply order ${finalOrderNumber} for ${quantityShipped}x ${partType}`);

    res.status(201).json({
      success: true,
      data: createdRequisition,
      message: `Supply order ${finalOrderNumber} created successfully`,
      source: 'sqlite'
    });
  } catch (error) {
    console.error('Error creating parts requisition:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/databricks/parts', async (req, res) => {
  databricksUnavailable(res, 'parts from Databricks');
});

// ============================================================================
// LOCAL SQLITE API ROUTES (Working in development)
// ============================================================================

// Get all work orders from SQLite
app.get('/api/work-orders', async (req, res) => {
  try {
    const { status, priority, search, limit, page } = req.query;
    
    // Build query with JOINs to get ship and gte_system details
    let query = `
      SELECT 
        wo.wo,
        wo.fm,
        wo.priority,
        wo.status,
        wo.eta,
        wo.symptoms as description,
        wo.parts_required,
        wo.creation_source,
        wo.sensor_data,
        wo.created_at,
        wo.updated_at,
        s.name as ship_name,
        s.homeport,
        s.designation as ship_designation,
        g.model as gte_model
      FROM work_orders wo
      LEFT JOIN ships s ON wo.ship_id = s.id
      LEFT JOIN gte_systems g ON wo.gte_system_id = g.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ' AND wo.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND wo.priority = ?';
      params.push(priority);
    }
    if (search) {
      query += ' AND (wo.wo LIKE ? OR s.name LIKE ? OR wo.symptoms LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY wo.created_at DESC';
    
    // Add pagination if requested
    if (limit) {
      const limitNum = parseInt(limit, 10);
      const pageNum = page ? parseInt(page, 10) : 1;
      const offset = (pageNum - 1) * limitNum;
      query += ` LIMIT ${limitNum} OFFSET ${offset}`;
    }
    
    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    
    // Map to camelCase format expected by frontend
    const workOrders = rows.map(row => ({
      wo: row.wo,
      ship: { name: row.ship_name, homeport: row.homeport },
      homeport: row.homeport,
      gteSystem: { model: row.gte_model },
      fm: row.fm,
      priority: row.priority,
      status: row.status,
      creationSource: row.creation_source,
      eta: row.eta,
      partsRequired: row.parts_required,
      description: row.description,
      sensorData: row.sensor_data,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM work_orders wo
      LEFT JOIN ships s ON wo.ship_id = s.id
      WHERE 1=1
    `;
    const countParams = [];
    
    if (status) {
      countQuery += ' AND wo.status = ?';
      countParams.push(status);
    }
    if (priority) {
      countQuery += ' AND wo.priority = ?';
      countParams.push(priority);
    }
    if (search) {
      countQuery += ' AND (wo.wo LIKE ? OR s.name LIKE ? OR wo.symptoms LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const countStmt = db.prepare(countQuery);
    const { total } = countStmt.get(...countParams);
    
    res.json({
      success: true,
      items: workOrders,
      total,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : workOrders.length,
    });
  } catch (error) {
    console.error('Failed to fetch work orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch work orders',
      error: error.message,
    });
  }
});

// Get work order by ID
app.get('/api/work-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM work_orders WHERE wo = ?');
    const workOrder = stmt.get(id);
    
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found',
      });
    }
    
    res.json(workOrder);
  } catch (error) {
    console.error('Failed to fetch work order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch work order',
      error: error.message,
    });
  }
});

// Create work order
app.post('/api/work-orders', async (req, res) => {
  try {
    const workOrder = req.body;
    
    // Parse ship if it's an object
    const shipValue = typeof workOrder.ship === 'object' ? workOrder.ship.name : workOrder.ship;
    const homeportValue = typeof workOrder.ship === 'object' ? workOrder.ship.homeport : workOrder.homeport;
    const gteSystemValue = typeof workOrder.gteSystem === 'object' ? workOrder.gteSystem.model : workOrder.gteSystem;
    
    const stmt = db.prepare(`
      INSERT INTO work_orders (wo, ship, homeport, gteSystem, fm, priority, status, creationSource, eta, partsRequired, description, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date().toISOString();
    stmt.run(
      workOrder.wo,
      shipValue,
      homeportValue,
      gteSystemValue,
      workOrder.fm,
      workOrder.priority,
      workOrder.status || 'Submitted',
      workOrder.creationSource || 'manual',
      workOrder.eta,
      workOrder.partsRequired,
      workOrder.description,
      now,
      now
    );
    
    res.status(201).json({ ...workOrder, createdAt: now, updatedAt: now });
  } catch (error) {
    console.error('Failed to create work order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create work order',
      error: error.message,
    });
  }
});

// Create AI work order
app.post('/api/work-orders/ai', async (req, res) => {
  try {
    const workOrder = req.body;
    
    // Parse ship if it's an object
    const shipValue = typeof workOrder.ship === 'object' ? workOrder.ship.name : workOrder.ship;
    const homeportValue = typeof workOrder.ship === 'object' ? workOrder.ship.homeport : workOrder.homeport;
    const gteSystemValue = typeof workOrder.gteSystem === 'object' ? workOrder.gteSystem.model : workOrder.gteSystem;
    
    const stmt = db.prepare(`
      INSERT INTO work_orders (wo, ship, homeport, gteSystem, fm, priority, status, creationSource, eta, partsRequired, description, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date().toISOString();
    stmt.run(
      workOrder.wo,
      shipValue,
      homeportValue,
      gteSystemValue,
      workOrder.fm,
      workOrder.priority,
      workOrder.status || 'Pending approval',
      'ai',
      workOrder.eta,
      workOrder.partsRequired,
      workOrder.description,
      now,
      now
    );
    
    res.status(201).json({ ...workOrder, creationSource: 'ai', createdAt: now, updatedAt: now });
  } catch (error) {
    console.error('Failed to create AI work order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create AI work order',
      error: error.message,
    });
  }
});

// Update work order
app.patch('/api/work-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic UPDATE query
    const fields = Object.keys(updates)
      .filter(key => key !== 'wo') // Don't allow updating the ID
      .map(key => `${key} = ?`)
      .join(', ');
    
    if (!fields) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }
    
    const values = Object.keys(updates)
      .filter(key => key !== 'wo')
      .map(key => updates[key]);
    
    const stmt = db.prepare(`
      UPDATE work_orders 
      SET ${fields}, updatedAt = ?
      WHERE wo = ?
    `);
    
    const now = new Date().toISOString();
    const result = stmt.run(...values, now, id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found',
      });
    }
    
    // Fetch updated work order
    const selectStmt = db.prepare('SELECT * FROM work_orders WHERE wo = ?');
    const workOrder = selectStmt.get(id);
    
    res.json(workOrder);
  } catch (error) {
    console.error('Failed to update work order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update work order',
      error: error.message,
    });
  }
});

// Delete work order
app.delete('/api/work-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM work_orders WHERE wo = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found',
      });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete work order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete work order',
      error: error.message,
    });
  }
});

// Get all parts from SQLite
app.get('/api/parts', async (req, res) => {
  try {
    const { category, condition, stockStatus, search, page, limit } = req.query;
    let query = 'SELECT * FROM parts WHERE 1=1';
    const params = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (condition) {
      query += ' AND condition = ?';
      params.push(condition);
    }
    if (search) {
      query += ' AND (name LIKE ? OR id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY name ASC';
    
    // Add pagination if requested
    if (limit) {
      const limitNum = parseInt(limit, 10);
      const pageNum = page ? parseInt(page, 10) : 1;
      const offset = (pageNum - 1) * limitNum;
      query += ` LIMIT ${limitNum} OFFSET ${offset}`;
    }
    
    const stmt = db.prepare(query);
    const parts = stmt.all(...params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM parts WHERE 1=1';
    if (category) countQuery += ' AND category = ?';
    if (condition) countQuery += ' AND condition = ?';
    if (search) countQuery += ' AND (name LIKE ? OR id LIKE ?)';
    
    const countStmt = db.prepare(countQuery);
    const { total } = countStmt.get(...params);
    
    res.json({
      success: true,
      items: parts,
      total,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : parts.length,
    });
  } catch (error) {
    console.error('Failed to fetch parts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch parts',
      error: error.message,
    });
  }
});

// Get part by ID
app.get('/api/parts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM parts WHERE id = ?');
    const part = stmt.get(id);
    
    if (!part) {
      return res.status(404).json({
        success: false,
        message: 'Part not found',
      });
    }
    
    res.json(part);
  } catch (error) {
    console.error('Failed to fetch part:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch part',
      error: error.message,
    });
  }
});

// Create part
app.post('/api/parts', async (req, res) => {
  try {
    const part = req.body;
    const stmt = db.prepare(`
      INSERT INTO parts (id, name, category, stockLevel, minStock, maxStock, location, condition, cost, supplier, lastUpdated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date().toISOString();
    stmt.run(
      part.id,
      part.name,
      part.category,
      part.stockLevel,
      part.minStock,
      part.maxStock,
      part.location,
      part.condition,
      part.cost,
      part.supplier,
      now
    );
    
    res.status(201).json({ ...part, lastUpdated: now });
  } catch (error) {
    console.error('Failed to create part:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create part',
      error: error.message,
    });
  }
});

// Update part
app.patch('/api/parts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic UPDATE query
    const fields = Object.keys(updates)
      .filter(key => key !== 'id') // Don't allow updating the ID
      .map(key => `${key} = ?`)
      .join(', ');
    
    if (!fields) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }
    
    const values = Object.keys(updates)
      .filter(key => key !== 'id')
      .map(key => updates[key]);
    
    const stmt = db.prepare(`
      UPDATE parts 
      SET ${fields}, lastUpdated = ?
      WHERE id = ?
    `);
    
    const now = new Date().toISOString();
    const result = stmt.run(...values, now, id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Part not found',
      });
    }
    
    // Fetch updated part
    const selectStmt = db.prepare('SELECT * FROM parts WHERE id = ?');
    const part = selectStmt.get(id);
    
    res.json(part);
  } catch (error) {
    console.error('Failed to update part:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update part',
      error: error.message,
    });
  }
});

// Update part stock
app.patch('/api/parts/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body;
    
    if (!quantity || !operation) {
      return res.status(400).json({
        success: false,
        message: 'Quantity and operation are required',
      });
    }
    
    // Get current stock level
    const selectStmt = db.prepare('SELECT stockLevel FROM parts WHERE id = ?');
    const part = selectStmt.get(id);
    
    if (!part) {
      return res.status(404).json({
        success: false,
        message: 'Part not found',
      });
    }
    
    // Calculate new stock level
    const currentStock = part.stockLevel;
    const newStock = operation === 'add' 
      ? currentStock + quantity 
      : currentStock - quantity;
    
    // Update stock level
    const updateStmt = db.prepare(`
      UPDATE parts 
      SET stockLevel = ?, lastUpdated = ?
      WHERE id = ?
    `);
    
    const now = new Date().toISOString();
    updateStmt.run(newStock, now, id);
    
    // Fetch updated part
    const updatedPart = db.prepare('SELECT * FROM parts WHERE id = ?').get(id);
    
    res.json(updatedPart);
  } catch (error) {
    console.error('Failed to update part stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update part stock',
      error: error.message,
    });
  }
});

// Delete part
app.delete('/api/parts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM parts WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Part not found',
      });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete part:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete part',
      error: error.message,
    });
  }
});

// ============================================================================
// KEPLER MAP DATA ROUTES
// ============================================================================

// Get platforms (ships) with location data
app.get('/api/map/platforms', async (req, res) => {
  try {
    const platforms = db.prepare(`
      SELECT 
        s.designation,
        s.name,
        s.id,
        s.status,
        s.homeport,
        s.lat,
        s.long,
        COUNT(DISTINCT wo.wo) as open_work_orders
      FROM ships s
      LEFT JOIN work_orders wo ON s.id = wo.ship_id AND wo.status != 'Completed'
      WHERE s.lat IS NOT NULL AND s.long IS NOT NULL
      GROUP BY s.id
    `).all();

    res.json({
      success: true,
      data: platforms,
      count: platforms.length
    });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platforms data',
      error: error.message
    });
  }
});

// Get stock locations with coordinates
app.get('/api/map/stock-locations', async (req, res) => {
  try {
    const stockLocations = db.prepare(`
      SELECT 
        stock_location_id,
        stock_location,
        latitude as lat,
        longitude as long,
        COUNT(DISTINCT id) as parts_count,
        SUM(stock_level) as total_stock
      FROM parts
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      AND stock_location_id IS NOT NULL
      GROUP BY stock_location_id, stock_location, latitude, longitude
    `).all();

    res.json({
      success: true,
      data: stockLocations,
      count: stockLocations.length
    });
  } catch (error) {
    console.error('Error fetching stock locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock locations data',
      error: error.message
    });
  }
});

// Get shipping routes (arcs from stock locations to platforms)
app.get('/api/map/shipping-routes', async (req, res) => {
  try {
    const routes = db.prepare(`
      SELECT 
        pr.id,
        pr.order_number,
        pr.part_type as type,
        pr.quantity_shipped as qty_shipped,
        pr.stock_location_id,
        pr.stock_location as stock_name,
        pr.designator,
        pr.ship_name,
        p.latitude as source_lat,
        p.longitude as source_lng,
        s.lat as target_lat,
        s.long as target_lng,
        pr.created_at
      FROM parts_requisitions pr
      LEFT JOIN parts p ON pr.stock_location_id = p.stock_location_id
      LEFT JOIN ships s ON pr.ship_designation = s.designation
      WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
      AND s.lat IS NOT NULL AND s.long IS NOT NULL
      AND pr.quantity_shipped > 0
      GROUP BY pr.stock_location_id, pr.designator, pr.part_type
    `).all();

    res.json({
      success: true,
      data: routes,
      count: routes.length
    });
  } catch (error) {
    console.error('Error fetching shipping routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping routes data',
      error: error.message
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
    availableEndpoints: {
      workOrders: [
        'GET /api/work-orders',
        'GET /api/work-orders/:id',
        'POST /api/work-orders',
        'PATCH /api/work-orders/:id',
        'DELETE /api/work-orders/:id'
      ],
      parts: [
        'GET /api/parts',
        'GET /api/parts/:id',
        'POST /api/parts',
        'PATCH /api/parts/:id',
        'PATCH /api/parts/:id/stock',
        'DELETE /api/parts/:id'
      ],
      databricks: [
        'Note: Databricks endpoints available in production only'
      ]
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM received, closing database connection...');
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, closing database connection...');
  db.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(70));
  console.log('Navy PdM API Server');
  console.log('='.repeat(70));
  console.log('');
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ API available at http://localhost:${PORT}/api`);
  console.log(`✓ SQLite database: ${dbPath}`);
  console.log('');
  console.log('Available Endpoints:');
  console.log('');
  console.log('  Work Orders (SQLite):');
  console.log('    GET    /api/work-orders              - List all work orders');
  console.log('    GET    /api/work-orders/:id          - Get work order by ID');
  console.log('    POST   /api/work-orders              - Create work order');
  console.log('    POST   /api/work-orders/ai           - Create AI work order');
  console.log('    PATCH  /api/work-orders/:id          - Update work order');
  console.log('    DELETE /api/work-orders/:id          - Delete work order');
  console.log('');
  console.log('  Parts (SQLite):');
  console.log('    GET    /api/parts                    - List all parts');
  console.log('    GET    /api/parts/:id                - Get part by ID');
  console.log('    POST   /api/parts                    - Create part');
  console.log('    PATCH  /api/parts/:id                - Update part');
  console.log('    PATCH  /api/parts/:id/stock          - Update part stock');
  console.log('    DELETE /api/parts/:id                - Delete part');
  console.log('');
  console.log('  Map Data (SQLite):');
  console.log('    GET    /api/map/platforms            - Get ship locations');
  console.log('    GET    /api/map/stock-locations      - Get parts warehouse locations');
  console.log('    GET    /api/map/shipping-routes      - Get parts shipment routes');
  console.log('');
  console.log('  Databricks (Placeholder in Development):');
  console.log('    GET    /api/databricks/health        - Health check');
  console.log('    GET    /api/databricks/ai-work-orders');
  console.log('    GET    /api/databricks/ship-status');
  console.log('    GET    /api/databricks/parts-requisitions');
  console.log('    GET    /api/databricks/parts');
  console.log('');
  console.log('  Note: Databricks endpoints return informative errors in development.');
  console.log('        They require TypeScript compilation and Databricks credentials');
  console.log('        for production deployment. See DATABRICKS_SETUP.md for details.');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('='.repeat(70));
  console.log('');
});
