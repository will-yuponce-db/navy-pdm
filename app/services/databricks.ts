import { DBSQLClient } from '@databricks/sql';

// Databricks SQL Configuration
const DATABRICKS_CONFIG = {
  token: process.env.DATABRICKS_API_TOKEN,
  serverHostname: process.env.DATABRICKS_SERVER_HOSTNAME,
  httpPath: process.env.DATABRICKS_HTTP_PATH
};

// Databricks SQL Client instance
let databricksClient: DBSQLClient | null = null;

// Initialize Databricks connection
export async function initializeDatabricks(): Promise<DBSQLClient> {
  if (databricksClient) {
    return databricksClient;
  }

  // Validate required environment variables
  if (!DATABRICKS_CONFIG.token || !DATABRICKS_CONFIG.serverHostname || !DATABRICKS_CONFIG.httpPath) {
    throw new Error('Missing required Databricks environment variables: DATABRICKS_API_TOKEN, DATABRICKS_SERVER_HOSTNAME, DATABRICKS_HTTP_PATH');
  }

  try {
    const client = new DBSQLClient();
    
    await client.connect({
      token: DATABRICKS_CONFIG.token,
      host: DATABRICKS_CONFIG.serverHostname,
      path: DATABRICKS_CONFIG.httpPath
    });

    databricksClient = client;
    console.log('Databricks SQL connection established successfully');
    return client;
  } catch (error) {
    console.error('Failed to connect to Databricks SQL:', error);
    throw new Error(`Databricks connection failed: ${error.message}`);
  }
}

// Execute a SQL query
export async function executeDatabricksQuery(query: string, options: any = {}): Promise<any[]> {
  try {
    const client = await initializeDatabricks();
    const session = await client.openSession();

    const queryOperation = await session.executeStatement(query, {
      runAsync: true,
      ...options
    });

    const result = await queryOperation.fetchAll();
    await queryOperation.close();
    await session.close();

    return result;
  } catch (error) {
    console.error('Databricks query execution failed:', error);
    throw new Error(`Query execution failed: ${error.message}`);
  }
}

// Test connection
export async function testDatabricksConnection(): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const result = await executeDatabricksQuery("SELECT 1 as test_value");
    return {
      success: true,
      message: 'Databricks connection successful',
      data: result
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection test failed: ${error.message}`
    };
  }
}

// Get warehouse information
export async function getWarehouseInfo(): Promise<any> {
  try {
    const result = await executeDatabricksQuery("SHOW WAREHOUSES");
    return result;
  } catch (error) {
    console.error('Failed to get warehouse info:', error);
    throw error;
  }
}

// Get database information
export async function getDatabaseInfo(): Promise<any> {
  try {
    const result = await executeDatabricksQuery("SHOW DATABASES");
    return result;
  } catch (error) {
    console.error('Failed to get database info:', error);
    throw error;
  }
}

// Get table information for a specific database
export async function getTableInfo(databaseName: string): Promise<any> {
  try {
    const result = await executeDatabricksQuery(`SHOW TABLES IN ${databaseName}`);
    return result;
  } catch (error) {
    console.error('Failed to get table info:', error);
    throw error;
  }
}

// Close Databricks connection
export async function closeDatabricksConnection(): Promise<void> {
  if (databricksClient) {
    try {
      await databricksClient.close();
      databricksClient = null;
      console.log('Databricks SQL connection closed');
    } catch (error) {
      console.error('Error closing Databricks connection:', error);
    }
  }
}

// Health check for Databricks service
export async function databricksHealthCheck(): Promise<{ status: string; timestamp: string; details?: any }> {
  try {
    const testResult = await testDatabricksConnection();
    return {
      status: testResult.success ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      details: testResult
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      details: { error: error.message }
    };
  }
}
