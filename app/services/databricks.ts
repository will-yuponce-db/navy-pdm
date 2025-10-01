import { DBSQLClient } from '@databricks/sql';
import { databricksConfig } from '../config/databricks';

// Connection retry configuration
const CONNECTION_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  timeout: 30000, // 30 seconds
  healthCheckInterval: 60000 // 1 minute
};

// Databricks SQL Client instance
let databricksClient: DBSQLClient | null = null;
let lastHealthCheck: Date | null = null;
let connectionStatus: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';

// Enhanced logging utility
function logDatabricksError(operation: string, error: unknown, context?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const errorDetails = {
    timestamp,
    operation,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : String(error),
    context: context || {},
    config: databricksConfig.getSafeConfig()
  };
  
  console.error(`[DATABRICKS ERROR] ${operation}:`, JSON.stringify(errorDetails, null, 2));
}

// Retry utility with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = CONNECTION_CONFIG.maxRetries
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      if (attempt > 1) {
        console.log(`[DATABRICKS] ${operationName} succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      logDatabricksError(`${operationName} (attempt ${attempt}/${maxRetries})`, error);
      
      if (attempt === maxRetries) {
        break;
      }
      
      const delay = CONNECTION_CONFIG.retryDelay * Math.pow(2, attempt - 1);
      console.log(`[DATABRICKS] Retrying ${operationName} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Initialize Databricks connection with enhanced error handling and retry logic
export async function initializeDatabricks(): Promise<DBSQLClient> {
  if (databricksClient && connectionStatus === 'healthy') {
    return databricksClient;
  }

  // Validate required configuration
  const validation = databricksConfig.validate();
  if (!validation.isValid) {
    const error = new Error(`Missing required Databricks configuration: ${validation.missingFields.join(', ')}`);
    logDatabricksError('Configuration validation', error, { missingFields: validation.missingFields });
    throw error;
  }

  return retryWithBackoff(async () => {
    const client = new DBSQLClient();
    
    // Get access token using service principal credentials with timeout
    const tokenController = new AbortController();
    const tokenTimeout = setTimeout(() => tokenController.abort(), CONNECTION_CONFIG.timeout);
    
    try {
      const config = databricksConfig.get();
      const tokenResponse = await fetch(`https://${config.serverHostname}/oidc/v1/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: config.clientId!,
          client_secret: config.clientSecret!,
          scope: 'all-apis'
        }),
        signal: tokenController.signal
      });
      
      clearTimeout(tokenTimeout);
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token request failed with status ${tokenResponse.status}: ${errorText}`);
      }
      
      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        throw new Error(`No access token in response: ${JSON.stringify(tokenData)}`);
      }
      
      // Connect to Databricks with timeout
      const connectController = new AbortController();
      const connectTimeout = setTimeout(() => connectController.abort(), CONNECTION_CONFIG.timeout);
      
      try {
        await client.connect({
          token: tokenData.access_token,
          host: config.serverHostname!,
          path: config.httpPath!
        });
        
        clearTimeout(connectTimeout);
        
        databricksClient = client;
        connectionStatus = 'healthy';
        lastHealthCheck = new Date();
        
        console.log(`[DATABRICKS] Connection established successfully to ${config.serverHostname}`);
        return client;
      } catch (connectError) {
        clearTimeout(connectTimeout);
        throw new Error(`Connection failed: ${connectError instanceof Error ? connectError.message : String(connectError)}`);
      }
    } catch (error) {
      clearTimeout(tokenTimeout);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Connection timeout after ${CONNECTION_CONFIG.timeout}ms`);
      }
      throw error;
    }
  }, 'initializeDatabricks');
}

// Execute a SQL query with enhanced error handling
export async function executeDatabricksQuery(query: string, options: Record<string, unknown> = {}): Promise<unknown[]> {
  return retryWithBackoff(async () => {
    const client = await initializeDatabricks();
    const session = await client.openSession();

    try {
      const queryOperation = await session.executeStatement(query, {
        runAsync: true,
        ...options
      });

      const result = await queryOperation.fetchAll();
      await queryOperation.close();
      await session.close();

      return result;
    } catch (error) {
      // Clean up session on error
      try {
        await session.close();
      } catch (closeError) {
        logDatabricksError('Session cleanup', closeError);
      }
      throw error;
    }
  }, 'executeDatabricksQuery');
}

// Test connection with detailed diagnostics
export async function testDatabricksConnection(): Promise<{ success: boolean; message: string; data?: unknown; diagnostics?: Record<string, unknown> }> {
  try {
    const startTime = Date.now();
    const result = await executeDatabricksQuery("SELECT 1 as test_value, current_timestamp() as server_time");
    const duration = Date.now() - startTime;
    
    connectionStatus = 'healthy';
    lastHealthCheck = new Date();
    
    return {
      success: true,
      message: `Databricks connection successful (${duration}ms)`,
      data: result,
      diagnostics: {
        responseTime: duration,
        serverTime: result[0]?.server_time,
        connectionStatus,
        lastHealthCheck: lastHealthCheck.toISOString()
      }
    };
  } catch (error) {
    connectionStatus = 'unhealthy';
    lastHealthCheck = new Date();
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    logDatabricksError('Connection test', error, { 
      connectionStatus, 
      lastHealthCheck: lastHealthCheck.toISOString() 
    });
    
    return {
      success: false,
      message: `Connection test failed: ${errorMessage}`,
      diagnostics: {
        connectionStatus,
        lastHealthCheck: lastHealthCheck.toISOString(),
        error: errorMessage
      }
    };
  }
}

// Get warehouse information
export async function getWarehouseInfo(): Promise<unknown> {
  try {
    const result = await executeDatabricksQuery("SHOW WAREHOUSES");
    return result;
  } catch (error) {
    console.error('Failed to get warehouse info:', error);
    throw error;
  }
}

// Get database information
export async function getDatabaseInfo(): Promise<unknown> {
  try {
    const result = await executeDatabricksQuery("SHOW DATABASES");
    return result;
  } catch (error) {
    console.error('Failed to get database info:', error);
    throw error;
  }
}

// Get table information for a specific database
export async function getTableInfo(databaseName: string): Promise<unknown> {
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

// Enhanced health check for Databricks service
export async function databricksHealthCheck(): Promise<{ 
  status: string; 
  timestamp: string; 
  details?: Record<string, unknown>;
  diagnostics?: Record<string, unknown>;
  recommendations?: string[];
}> {
  const timestamp = new Date().toISOString();
  const recommendations: string[] = [];
  
  try {
    // Check if we need to run a health check (avoid too frequent checks)
    const shouldCheck = !lastHealthCheck || 
      (Date.now() - lastHealthCheck.getTime()) > CONNECTION_CONFIG.healthCheckInterval;
    
    if (!shouldCheck && connectionStatus === 'healthy') {
      return {
        status: 'healthy',
        timestamp,
        details: { cached: true, lastCheck: lastHealthCheck?.toISOString() },
        diagnostics: {
          connectionStatus,
          lastHealthCheck: lastHealthCheck?.toISOString(),
          cacheUsed: true
        }
      };
    }
    
    const testResult = await testDatabricksConnection();
    
    // Generate recommendations based on diagnostics
    if (testResult.diagnostics?.responseTime > 5000) {
      recommendations.push('High response time detected. Consider checking network connectivity or Databricks warehouse status.');
    }
    
    if (testResult.success && testResult.diagnostics?.responseTime > 10000) {
      recommendations.push('Very high response time. This may indicate Databricks warehouse is cold or overloaded.');
    }
    
    return {
      status: testResult.success ? 'healthy' : 'unhealthy',
      timestamp,
      details: testResult,
      diagnostics: {
        ...testResult.diagnostics,
        config: {
          maxRetries: CONNECTION_CONFIG.maxRetries,
          timeout: CONNECTION_CONFIG.timeout,
          healthCheckInterval: CONNECTION_CONFIG.healthCheckInterval
        }
      },
      recommendations: recommendations.length > 0 ? recommendations : undefined
    };
  } catch (error) {
    connectionStatus = 'unhealthy';
    lastHealthCheck = new Date();
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    logDatabricksError('Health check', error);
    
    // Generate recommendations based on error type
    if (errorMessage.includes('timeout')) {
      recommendations.push('Connection timeout detected. Check network connectivity and Databricks service status.');
    } else if (errorMessage.includes('token')) {
      recommendations.push('Authentication failed. Verify service principal credentials and permissions.');
    } else if (errorMessage.includes('environment')) {
      recommendations.push('Configuration issue. Check that all required environment variables are set.');
    }
    
    return {
      status: 'unhealthy',
      timestamp,
      details: { error: errorMessage },
      diagnostics: {
        connectionStatus,
        lastHealthCheck: lastHealthCheck.toISOString(),
        error: errorMessage
      },
      recommendations: recommendations.length > 0 ? recommendations : ['Check Databricks service status and network connectivity.']
    };
  }
}
