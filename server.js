import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { DBSQLClient } from '@databricks/sql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Database setup - SQLite
const dbPath = join(__dirname, 'backend', 'instance', 'navy_pdm.db');
const db = new Database(dbPath);

// Databricks setup
let databricksClient = null;
let databricksConnected = false;

// Check if Databricks credentials are available
const hasDatabricksCredentials = () => {
  // Accept either DATABRICKS_SERVER_HOSTNAME or DATABRICKS_HOST (Databricks Apps uses DATABRICKS_HOST)
  const hostname = process.env.DATABRICKS_SERVER_HOSTNAME || process.env.DATABRICKS_HOST;
  // HTTP path can be provided or use default warehouse path
  const httpPath = process.env.DATABRICKS_HTTP_PATH || '/sql/1.0/warehouses/8baced1ff014912d';
  
  return !!(
    hostname &&
    httpPath &&
    (process.env.DATABRICKS_TOKEN || 
     (process.env.DATABRICKS_CLIENT_ID && process.env.DATABRICKS_CLIENT_SECRET))
  );
};

// OAuth token management for Databricks
let cachedAccessToken = null;
let tokenExpiresAt = null;
const TOKEN_REFRESH_BUFFER = 300000; // 5 minutes

// Get or refresh OAuth token
async function getDatabricksToken() {
  if (process.env.DATABRICKS_TOKEN) {
    return process.env.DATABRICKS_TOKEN;
  }

  // Check if cached token is still valid
  if (cachedAccessToken && tokenExpiresAt && Date.now() < tokenExpiresAt - TOKEN_REFRESH_BUFFER) {
    return cachedAccessToken;
  }

  // Get new token using client credentials
  // Accept either DATABRICKS_SERVER_HOSTNAME or DATABRICKS_HOST (Databricks Apps uses DATABRICKS_HOST)
  const hostname = process.env.DATABRICKS_SERVER_HOSTNAME || process.env.DATABRICKS_HOST;
  const tokenUrl = `https://${hostname}/oidc/v1/token`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.DATABRICKS_CLIENT_ID,
      client_secret: process.env.DATABRICKS_CLIENT_SECRET,
      scope: 'all-apis',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get Databricks token: ${response.statusText}`);
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in * 1000);
  
  return cachedAccessToken;
}

// Initialize Databricks connection
async function initDatabricks() {
  if (NODE_ENV !== 'production' || !hasDatabricksCredentials()) {
    console.log('[DATABRICKS] Skipping initialization - not in production or missing credentials');
    return false;
  }

  try {
    console.log('[DATABRICKS] Attempting to connect...');
    databricksClient = new DBSQLClient();
    
    const token = await getDatabricksToken();
    
    // Accept either DATABRICKS_SERVER_HOSTNAME or DATABRICKS_HOST (Databricks Apps uses DATABRICKS_HOST)
    const hostname = process.env.DATABRICKS_SERVER_HOSTNAME || process.env.DATABRICKS_HOST;
    const httpPath = process.env.DATABRICKS_HTTP_PATH || '/sql/1.0/warehouses/8baced1ff014912d';
    
    await databricksClient.connect({
      token: token,
      host: hostname,
      path: httpPath,
    });

    databricksConnected = true;
    console.log('[DATABRICKS] ✓ Connected successfully');
    return true;
  } catch (error) {
    console.error('[DATABRICKS] ✗ Connection failed:', error.message);
    console.log('[DATABRICKS] Falling back to SQLite');
    databricksConnected = false;
    return false;
  }
}

// Execute Databricks query with SQLite fallback
async function executeQuery(databricksQuery, sqliteQuery, params = []) {
  // Try Databricks first if connected
  if (databricksConnected && databricksClient) {
    try {
      const session = await databricksClient.openSession();
      const queryOperation = await session.executeStatement(databricksQuery, { runAsync: true });
      const result = await queryOperation.fetchAll();
      await queryOperation.close();
      await session.close();
      return { data: result, source: 'databricks' };
    } catch (error) {
      console.error('[DATABRICKS] Query failed, falling back to SQLite:', error.message);
      databricksConnected = false;
    }
  }

  // Fallback to SQLite
  const stmt = db.prepare(sqliteQuery);
  const data = params.length > 0 ? stmt.all(...params) : stmt.all();
  return { data, source: 'sqlite' };
}

// Initialize Databricks on startup
initDatabricks().catch(err => {
  console.error('[DATABRICKS] Initialization error:', err);
});

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

// ============================================================================
// DATABRICKS API ROUTES (With SQLite fallback)
// ============================================================================

app.get('/api/databricks/health', async (req, res) => {
  res.json({
    status: databricksConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    mode: NODE_ENV,
    databricks: {
      available: databricksConnected,
      credentials: hasDatabricksCredentials(),
    },
    fallback: 'sqlite',
  });
});

app.get('/api/databricks/test', async (req, res) => {
  try {
    const { data, source } = await executeQuery(
      'SELECT "Databricks connection successful" as message, current_timestamp() as timestamp',
      'SELECT \'SQLite fallback active\' as message, datetime(\'now\') as timestamp',
      []
    );
    
    res.json({
      success: true,
      source,
      data,
      message: `Query executed successfully using ${source}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/api/databricks/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required',
      });
    }

    // For custom queries, we can only support Databricks
    if (!databricksConnected) {
      return res.status(503).json({
        success: false,
        message: 'Custom queries require Databricks connection',
        fallback: 'Not available for custom queries',
      });
    }

    const session = await databricksClient.openSession();
    const queryOperation = await session.executeStatement(query, { runAsync: true });
    const result = await queryOperation.fetchAll();
    await queryOperation.close();
    await session.close();

    res.json({
      success: true,
      source: 'databricks',
      data: result,
      count: result.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/databricks/ai-work-orders', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const { data, source } = await executeQuery(
      `SELECT * FROM public_sector.predictive_maintenance_navy.ai_work_orders LIMIT ${limit}`,
      `SELECT * FROM work_orders WHERE creation_source = 'ai' LIMIT ${limit}`,
      []
    );
    
    res.json({
      success: true,
      source,
      data,
      count: data.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/databricks/ai-work-orders/:workOrderId', async (req, res) => {
  try {
    const { workOrderId } = req.params;
    
    const { data, source } = await executeQuery(
      `SELECT * FROM public_sector.predictive_maintenance_navy.ai_work_orders WHERE wo = '${workOrderId}'`,
      'SELECT * FROM work_orders WHERE wo = ? AND creation_source = "ai"',
      [workOrderId]
    );
    
    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Work order not found',
      });
    }
    
    res.json({
      success: true,
      source,
      data: data[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/databricks/ship-status', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const { data, source } = await executeQuery(
      `SELECT * FROM public_sector.predictive_maintenance_navy.ship_status LIMIT ${limit}`,
      `SELECT s.*, COUNT(wo.wo) as open_work_orders 
       FROM ships s 
       LEFT JOIN work_orders wo ON s.id = wo.ship_id AND wo.status != 'Completed' 
       GROUP BY s.id LIMIT ${limit}`,
      []
    );
    
    res.json({
      success: true,
      source,
      data,
      count: data.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/databricks/ship-status/:turbineId', async (req, res) => {
  try {
    const { turbineId } = req.params;
    
    const { data, source } = await executeQuery(
      `SELECT * FROM public_sector.predictive_maintenance_navy.ship_status WHERE turbine_id = '${turbineId}'`,
      'SELECT s.* FROM ships s LEFT JOIN gte_systems g ON s.id = g.ship_id WHERE g.id = ?',
      [turbineId]
    );
    
    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ship status not found for turbine',
      });
    }
    
    res.json({
      success: true,
      source,
      data: data[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get parts requisitions (with Databricks and SQLite fallback)
app.get('/api/databricks/parts-requisitions', async (req, res) => {
  try {
    const { limit = 1000, orderNumber, partType, stockLocation } = req.query;
    
    // Build Databricks query
    let databricksQuery = 'SELECT * FROM public_sector.predictive_maintenance_navy.parts_requisitions WHERE 1=1';
    let sqliteQuery = 'SELECT * FROM parts_requisitions WHERE 1=1';
    const params = [];
    
    if (orderNumber) {
      databricksQuery += ` AND order_number = '${orderNumber}'`;
      sqliteQuery += ' AND order_number = ?';
      params.push(orderNumber);
    }
    
    if (partType) {
      databricksQuery += ` AND part_type LIKE '%${partType}%'`;
      sqliteQuery += ' AND part_type LIKE ?';
      params.push(`%${partType}%`);
    }
    
    if (stockLocation) {
      databricksQuery += ` AND stock_location LIKE '%${stockLocation}%'`;
      sqliteQuery += ' AND stock_location LIKE ?';
      params.push(`%${stockLocation}%`);
    }
    
    databricksQuery += ` ORDER BY created_at DESC LIMIT ${limit}`;
    sqliteQuery += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const { data, source } = await executeQuery(databricksQuery, sqliteQuery, params);
    
    res.json({
      success: true,
      data,
      count: data.length,
      source
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
    
    const { data, source } = await executeQuery(
      `SELECT * FROM public_sector.predictive_maintenance_navy.parts_requisitions WHERE order_number = '${orderNumber}'`,
      'SELECT * FROM parts_requisitions WHERE order_number = ?',
      [orderNumber]
    );
    
    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No requisitions found for this order number'
      });
    }
    
    res.json({
      success: true,
      data,
      source
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
    
    const { data, source } = await executeQuery(
      `SELECT * FROM public_sector.predictive_maintenance_navy.parts_requisitions WHERE designator_id = '${designatorId}'`,
      'SELECT * FROM parts_requisitions WHERE designator_id = ?',
      [designatorId]
    );
    
    res.json({
      success: true,
      data,
      count: data.length,
      source
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
  try {
    const { limit = 1000, category, condition, search } = req.query;
    
    // Build Databricks query
    let databricksQuery = 'SELECT * FROM public_sector.predictive_maintenance_navy.parts WHERE 1=1';
    let sqliteQuery = 'SELECT * FROM parts WHERE 1=1';
    const params = [];
    
    if (category) {
      databricksQuery += ` AND category = '${category}'`;
      sqliteQuery += ' AND category = ?';
      params.push(category);
    }
    
    if (condition) {
      databricksQuery += ` AND condition = '${condition}'`;
      sqliteQuery += ' AND condition = ?';
      params.push(condition);
    }
    
    if (search) {
      databricksQuery += ` AND (name LIKE '%${search}%' OR id LIKE '%${search}%')`;
      sqliteQuery += ' AND (name LIKE ? OR id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    databricksQuery += ` ORDER BY name ASC LIMIT ${limit}`;
    sqliteQuery += ' ORDER BY name ASC LIMIT ?';
    params.push(parseInt(limit));
    
    const { data, source } = await executeQuery(databricksQuery, sqliteQuery, params);
    
    // Transform snake_case to camelCase for frontend compatibility
    const transformedData = data.map(part => ({
      id: part.id,
      name: part.name,
      system: part.system,
      category: part.category,
      stockLevel: part.stock_level ?? part.stockLevel,
      minStock: part.min_stock ?? part.minStock,
      maxStock: part.max_stock ?? part.maxStock,
      location: part.location,
      condition: part.condition,
      leadTime: part.lead_time ?? part.leadTime,
      supplier: part.supplier,
      cost: part.cost,
      lastUpdated: part.last_updated ?? part.lastUpdated,
      // Optional Databricks fields
      nsn: part.nsn,
      width: part.width,
      height: part.height,
      weight: part.weight,
      productionTime: part.production_time ?? part.productionTime,
      sensors: part.sensors ? (typeof part.sensors === 'string' ? JSON.parse(part.sensors) : part.sensors) : undefined,
      stockLocationId: part.stock_location_id ?? part.stockLocationId,
      latitude: part.latitude,
      longitude: part.longitude
    }));
    
    res.json({
      success: true,
      data: transformedData,
      count: transformedData.length,
      source
    });
  } catch (error) {
    console.error('Error fetching parts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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
    const rawParts = stmt.all(...params);
    
    // Transform snake_case to camelCase for frontend compatibility
    const parts = rawParts.map(part => ({
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
      lastUpdated: part.last_updated,
      // Optional Databricks fields
      nsn: part.nsn,
      width: part.width,
      height: part.height,
      weight: part.weight,
      productionTime: part.production_time,
      sensors: part.sensors ? (typeof part.sensors === 'string' ? JSON.parse(part.sensors) : part.sensors) : undefined,
      stockLocationId: part.stock_location_id,
      latitude: part.latitude,
      longitude: part.longitude
    }));
    
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
    const rawPart = stmt.get(id);
    
    if (!rawPart) {
      return res.status(404).json({
        success: false,
        message: 'Part not found',
      });
    }
    
    // Transform snake_case to camelCase
    const part = {
      id: rawPart.id,
      name: rawPart.name,
      system: rawPart.system,
      category: rawPart.category,
      stockLevel: rawPart.stock_level,
      minStock: rawPart.min_stock,
      maxStock: rawPart.max_stock,
      location: rawPart.location,
      condition: rawPart.condition,
      leadTime: rawPart.lead_time,
      supplier: rawPart.supplier,
      cost: rawPart.cost,
      lastUpdated: rawPart.last_updated,
      nsn: rawPart.nsn,
      width: rawPart.width,
      height: rawPart.height,
      weight: rawPart.weight,
      productionTime: rawPart.production_time,
      sensors: rawPart.sensors ? (typeof rawPart.sensors === 'string' ? JSON.parse(rawPart.sensors) : rawPart.sensors) : undefined,
      stockLocationId: rawPart.stock_location_id,
      latitude: rawPart.latitude,
      longitude: rawPart.longitude
    };
    
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
      INSERT INTO parts (id, name, system, category, stock_level, min_stock, max_stock, location, condition, lead_time, cost, supplier, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date().toISOString();
    stmt.run(
      part.id,
      part.name,
      part.system || 'LM2500',
      part.category,
      part.stockLevel,
      part.minStock,
      part.maxStock,
      part.location,
      part.condition,
      part.leadTime,
      part.cost,
      part.supplier,
      now
    );
    
    res.status(201).json({ 
      ...part, 
      system: part.system || 'LM2500',
      lastUpdated: now 
    });
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
    
    // Map camelCase to snake_case for database
    const fieldMapping = {
      stockLevel: 'stock_level',
      minStock: 'min_stock',
      maxStock: 'max_stock',
      leadTime: 'lead_time',
      lastUpdated: 'last_updated',
      productionTime: 'production_time',
      stockLocationId: 'stock_location_id'
    };
    
    // Build dynamic UPDATE query with proper field names
    const fields = Object.keys(updates)
      .filter(key => key !== 'id') // Don't allow updating the ID
      .map(key => `${fieldMapping[key] || key} = ?`)
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
      SET ${fields}, last_updated = ?
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
    const rawPart = selectStmt.get(id);
    
    // Transform to camelCase
    const part = {
      id: rawPart.id,
      name: rawPart.name,
      system: rawPart.system,
      category: rawPart.category,
      stockLevel: rawPart.stock_level,
      minStock: rawPart.min_stock,
      maxStock: rawPart.max_stock,
      location: rawPart.location,
      condition: rawPart.condition,
      leadTime: rawPart.lead_time,
      supplier: rawPart.supplier,
      cost: rawPart.cost,
      lastUpdated: rawPart.last_updated,
      nsn: rawPart.nsn,
      width: rawPart.width,
      height: rawPart.height,
      weight: rawPart.weight,
      productionTime: rawPart.production_time,
      sensors: rawPart.sensors ? (typeof rawPart.sensors === 'string' ? JSON.parse(rawPart.sensors) : rawPart.sensors) : undefined,
      stockLocationId: rawPart.stock_location_id,
      latitude: rawPart.latitude,
      longitude: rawPart.longitude
    };
    
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
    const selectStmt = db.prepare('SELECT stock_level FROM parts WHERE id = ?');
    const part = selectStmt.get(id);
    
    if (!part) {
      return res.status(404).json({
        success: false,
        message: 'Part not found',
      });
    }
    
    // Calculate new stock level
    const currentStock = part.stock_level;
    const newStock = operation === 'add' 
      ? currentStock + quantity 
      : currentStock - quantity;
    
    // Update stock level
    const updateStmt = db.prepare(`
      UPDATE parts 
      SET stock_level = ?, last_updated = ?
      WHERE id = ?
    `);
    
    const now = new Date().toISOString();
    updateStmt.run(newStock, now, id);
    
    // Fetch updated part and transform
    const rawPart = db.prepare('SELECT * FROM parts WHERE id = ?').get(id);
    
    const updatedPart = {
      id: rawPart.id,
      name: rawPart.name,
      system: rawPart.system,
      category: rawPart.category,
      stockLevel: rawPart.stock_level,
      minStock: rawPart.min_stock,
      maxStock: rawPart.max_stock,
      location: rawPart.location,
      condition: rawPart.condition,
      leadTime: rawPart.lead_time,
      supplier: rawPart.supplier,
      cost: rawPart.cost,
      lastUpdated: rawPart.last_updated,
      nsn: rawPart.nsn,
      width: rawPart.width,
      height: rawPart.height,
      weight: rawPart.weight,
      productionTime: rawPart.production_time,
      sensors: rawPart.sensors ? (typeof rawPart.sensors === 'string' ? JSON.parse(rawPart.sensors) : rawPart.sensors) : undefined,
      stockLocationId: rawPart.stock_location_id,
      latitude: rawPart.latitude,
      longitude: rawPart.longitude
    };
    
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
        location as stock_location,
        latitude as lat,
        longitude as long,
        COUNT(DISTINCT id) as parts_count,
        SUM(stock_level) as total_stock
      FROM parts
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      AND stock_location_id IS NOT NULL
      GROUP BY stock_location_id, location, latitude, longitude
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
// FRONTEND STATIC FILES (for standalone deployment)
// ============================================================================

// Serve static assets from build/client (if it exists)
const buildClientPath = join(__dirname, 'build', 'client');
const buildServerPath = join(__dirname, 'build', 'server', 'index.js');

if (existsSync(buildClientPath)) {
  // Serve static assets with caching
  app.use('/assets', express.static(join(buildClientPath, 'assets'), {
    immutable: true,
    maxAge: '1y'
  }));
  
  // Serve other static files
  app.use(express.static(buildClientPath, {
    maxAge: '1h'
  }));
}

// Handle React Router SSR - setup function to be called before server starts
async function setupSSR() {
  if (existsSync(buildClientPath) && existsSync(buildServerPath)) {
    try {
      const [build, reactRouterExpress] = await Promise.all([
        import(buildServerPath),
        import('@react-router/express')
      ]);
      const { createRequestHandler } = reactRouterExpress;
      
      // Serve React app for all non-API routes
      app.get('*', createRequestHandler({ build }));
      console.log('✓ React Router SSR enabled');
    } catch (err) {
      console.warn('⚠ React Router SSR not available:', err.message);
      console.warn('  Check build files and try rebuilding the application');
    }
  } else {
    // 404 handler (only for API routes if frontend is not built)
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
  }
}

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
async function gracefulShutdown(signal) {
  console.log(`\n${signal} received, closing connections...`);
  
  try {
    // Close SQLite connection
    db.close();
    console.log('✓ SQLite connection closed');
    
    // Close Databricks connection if active
    if (databricksClient && databricksConnected) {
      await databricksClient.close();
      console.log('✓ Databricks connection closed');
    }
  } catch (error) {
    console.error('Error during shutdown:', error.message);
  }
  
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server - async to wait for SSR setup
async function startServer() {
  // Setup SSR before starting to listen
  await setupSSR();
  
  // Now start listening for requests
  app.listen(PORT, () => {
    console.log('');
    console.log('='.repeat(70));
    console.log('Navy PdM API Server');
    console.log('='.repeat(70));
    console.log('');
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Mode: ${NODE_ENV}`);
    console.log(`✓ API available at http://localhost:${PORT}/api`);
    console.log(`✓ SQLite database: ${dbPath}`);
    console.log(`✓ Databricks: ${databricksConnected ? 'CONNECTED' : 'Disconnected (using SQLite fallback)'}`);
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
    console.log('  Databricks (With SQLite Fallback):');
    console.log('    GET    /api/databricks/health        - Health check');
    console.log('    GET    /api/databricks/test          - Test connection');
    console.log('    POST   /api/databricks/query         - Custom query (Databricks only)');
    console.log('    GET    /api/databricks/ai-work-orders');
    console.log('    GET    /api/databricks/ship-status');
    console.log('    GET    /api/databricks/parts-requisitions');
    console.log('    GET    /api/databricks/parts');
    console.log('');
    if (databricksConnected) {
      console.log('  ✓ Databricks endpoints are using live data');
    } else {
      console.log('  ℹ Databricks endpoints will fall back to SQLite');
      console.log('    Set NODE_ENV=production and configure Databricks credentials to enable.');
    }
    console.log('');
    console.log('Press Ctrl+C to stop');
    console.log('='.repeat(70));
    console.log('');
  });
}

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
