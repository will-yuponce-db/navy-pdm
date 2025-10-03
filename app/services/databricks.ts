import { DBSQLClient } from "@databricks/sql";

// Databricks Configuration Interface
export interface DatabricksConfig {
  clientId: string | undefined;
  clientSecret: string | undefined;
  serverHostname: string | undefined;
  httpPath: string | undefined;
}

// Get configuration from environment variables
function getConfigFromEnv(): DatabricksConfig {
  return {
    clientId: process.env.DATABRICKS_CLIENT_ID,
    clientSecret: process.env.DATABRICKS_CLIENT_SECRET,
    serverHostname:
      process.env.DATABRICKS_SERVER_HOSTNAME || process.env.DATABRICKS_HOST,
    httpPath:
      process.env.DATABRICKS_HTTP_PATH ||
      `/sql/1.0/warehouses/8baced1ff014912d`,
  };
}

// Configuration management
export const databricksConfig = {
  // Get current configuration
  get: (): DatabricksConfig => getConfigFromEnv(),

  // Validate configuration
  validate: (): { isValid: boolean; missingFields: string[] } => {
    const config = getConfigFromEnv();
    const missingFields: string[] = [];

    if (!config.clientId) missingFields.push("clientId");
    if (!config.clientSecret) missingFields.push("clientSecret");
    if (!config.serverHostname) missingFields.push("serverHostname");
    if (!config.httpPath) missingFields.push("httpPath");

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  },

  // Get configuration for logging (without sensitive data)
  getSafeConfig: (): Omit<DatabricksConfig, "clientSecret"> & {
    clientSecret: boolean;
  } => {
    const config = getConfigFromEnv();
    return {
      clientId: config.clientId,
      clientSecret: !!config.clientSecret,
      serverHostname: config.serverHostname,
      httpPath: config.httpPath,
    };
  },
};

// Connection retry configuration
const CONNECTION_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  timeout: 30000, // 30 seconds
  healthCheckInterval: 60000, // 1 minute
};

// Databricks SQL Client instance
let databricksClient: DBSQLClient | null = null;
let lastHealthCheck: Date | null = null;
let connectionStatus: "healthy" | "unhealthy" | "unknown" = "unknown";

// OAuth token management
let cachedAccessToken: string | null = null;
let tokenExpiresAt: Date | null = null;
const TOKEN_REFRESH_BUFFER = 300000; // Refresh 5 minutes before expiry

// Enhanced logging utility
function logDatabricksError(
  operation: string,
  error: unknown,
  context?: Record<string, unknown>,
) {
  const timestamp = new Date().toISOString();
  const errorDetails = {
    timestamp,
    operation,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : String(error),
    context: context || {},
    config: databricksConfig.getSafeConfig(),
  };

  console.error(
    `[DATABRICKS ERROR] ${operation}:`,
    JSON.stringify(errorDetails, null, 2),
  );
}

// Retry utility with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = CONNECTION_CONFIG.maxRetries,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      if (attempt > 1) {
        console.log(
          `[DATABRICKS] ${operationName} succeeded on attempt ${attempt}`,
        );
      }
      return result;
    } catch (error) {
      lastError = error;
      logDatabricksError(
        `${operationName} (attempt ${attempt}/${maxRetries})`,
        error,
      );

      if (attempt === maxRetries) {
        break;
      }

      const delay = CONNECTION_CONFIG.retryDelay * Math.pow(2, attempt - 1);
      console.log(`[DATABRICKS] Retrying ${operationName} in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Check if the current token is valid or needs refresh
function isTokenValid(): boolean {
  if (!cachedAccessToken || !tokenExpiresAt) {
    return false;
  }

  const now = Date.now();
  const expiresAtTime = tokenExpiresAt.getTime();

  // Token is valid if it expires more than TOKEN_REFRESH_BUFFER in the future
  return expiresAtTime - now > TOKEN_REFRESH_BUFFER;
}

// Get or refresh the access token
async function getAccessToken(forceRefresh = false): Promise<string> {
  // Return cached token if it's still valid and not forcing refresh
  if (!forceRefresh && isTokenValid() && cachedAccessToken) {
    console.log("[DATABRICKS] Using cached OAuth token");
    return cachedAccessToken;
  }

  console.log("[DATABRICKS] Fetching new OAuth token...");
  const config = databricksConfig.get();

  if (!config.clientId || !config.clientSecret || !config.serverHostname) {
    throw new Error(
      "Missing required Databricks configuration for token request",
    );
  }

  const tokenController = new AbortController();
  const tokenTimeout = setTimeout(
    () => tokenController.abort(),
    CONNECTION_CONFIG.timeout,
  );

  try {
    const tokenResponse = await fetch(
      `https://${config.serverHostname}/oidc/v1/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: config.clientId,
          client_secret: config.clientSecret,
          scope: "all-apis",
        }),
        signal: tokenController.signal,
      },
    );

    clearTimeout(tokenTimeout);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(
        `Token request failed with status ${tokenResponse.status}: ${errorText}`,
      );
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error(
        `No access token in response: ${JSON.stringify(tokenData)}`,
      );
    }

    // Store the token and calculate expiration time
    cachedAccessToken = tokenData.access_token;

    // Default to 1 hour if expires_in is not provided
    const expiresInSeconds = tokenData.expires_in || 3600;
    tokenExpiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    console.log(
      `[DATABRICKS] OAuth token obtained, expires at ${tokenExpiresAt.toISOString()}`,
    );

    // TypeScript type guard - cachedAccessToken is guaranteed to be a string here
    if (!cachedAccessToken) {
      throw new Error("Failed to cache access token");
    }

    return cachedAccessToken;
  } catch (error) {
    clearTimeout(tokenTimeout);

    // Clear cached token on error
    cachedAccessToken = null;
    tokenExpiresAt = null;

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `Token request timeout after ${CONNECTION_CONFIG.timeout}ms`,
      );
    }
    throw error;
  }
}

// Initialize Databricks connection with enhanced error handling and retry logic
export async function initializeDatabricks(): Promise<DBSQLClient> {
  // Check if existing connection is healthy AND token is still valid
  if (databricksClient && connectionStatus === "healthy" && isTokenValid()) {
    return databricksClient;
  }

  // If token is invalid, close existing connection and reconnect
  if (databricksClient && !isTokenValid()) {
    console.log(
      "[DATABRICKS] OAuth token expired, closing connection and reconnecting...",
    );
    try {
      await databricksClient.close();
    } catch (error) {
      logDatabricksError("Close stale connection", error);
    }
    databricksClient = null;
    connectionStatus = "unknown";
  }

  // Validate required configuration
  const validation = databricksConfig.validate();
  if (!validation.isValid) {
    const error = new Error(
      `Missing required Databricks configuration: ${validation.missingFields.join(", ")}`,
    );
    logDatabricksError("Configuration validation", error, {
      missingFields: validation.missingFields,
    });
    throw error;
  }

  return retryWithBackoff(async () => {
    const client = new DBSQLClient();

    try {
      const config = databricksConfig.get();

      // Get or refresh access token
      const accessToken = await getAccessToken();

      // Connect to Databricks with timeout
      const connectController = new AbortController();
      const connectTimeout = setTimeout(
        () => connectController.abort(),
        CONNECTION_CONFIG.timeout,
      );

      try {
        await client.connect({
          token: accessToken,
          host: config.serverHostname!,
          path: config.httpPath!,
        });

        clearTimeout(connectTimeout);

        databricksClient = client;
        connectionStatus = "healthy";
        lastHealthCheck = new Date();

        console.log(
          `[DATABRICKS] Connection established successfully to ${config.serverHostname}`,
        );
        return client;
      } catch (connectError) {
        clearTimeout(connectTimeout);
        throw new Error(
          `Connection failed: ${connectError instanceof Error ? connectError.message : String(connectError)}`,
        );
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          `Connection timeout after ${CONNECTION_CONFIG.timeout}ms`,
        );
      }
      throw error;
    }
  }, "initializeDatabricks");
}

// Execute a SQL query with enhanced error handling
export async function executeDatabricksQuery(
  query: string,
  options: Record<string, unknown> = {},
): Promise<unknown[]> {
  return retryWithBackoff(async () => {
    const client = await initializeDatabricks();
    const session = await client.openSession();

    try {
      const queryOperation = await session.executeStatement(query, {
        runAsync: true,
        ...options,
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
        logDatabricksError("Session cleanup", closeError);
      }
      throw error;
    }
  }, "executeDatabricksQuery");
}

// Test connection with detailed diagnostics
export async function testDatabricksConnection(): Promise<{
  success: boolean;
  message: string;
  data?: unknown;
  diagnostics?: Record<string, unknown>;
}> {
  try {
    const startTime = Date.now();
    const result = await executeDatabricksQuery(
      "SELECT 1 as test_value, current_timestamp() as server_time",
    );
    const duration = Date.now() - startTime;

    connectionStatus = "healthy";
    lastHealthCheck = new Date();

    return {
      success: true,
      message: `Databricks connection successful (${duration}ms)`,
      data: result,
      diagnostics: {
        responseTime: duration,
        serverTime: (result[0] as Record<string, unknown>)?.server_time,
        connectionStatus,
        lastHealthCheck: lastHealthCheck.toISOString(),
      },
    };
  } catch (error) {
    connectionStatus = "unhealthy";
    lastHealthCheck = new Date();

    const errorMessage = error instanceof Error ? error.message : String(error);
    logDatabricksError("Connection test", error, {
      connectionStatus,
      lastHealthCheck: lastHealthCheck.toISOString(),
    });

    return {
      success: false,
      message: `Connection test failed: ${errorMessage}`,
      diagnostics: {
        connectionStatus,
        lastHealthCheck: lastHealthCheck.toISOString(),
        error: errorMessage,
      },
    };
  }
}

// Get warehouse information
export async function getWarehouseInfo(): Promise<unknown> {
  try {
    const result = await executeDatabricksQuery("SHOW WAREHOUSES");
    return result;
  } catch (error) {
    console.error("Failed to get warehouse info:", error);
    throw error;
  }
}

// Get database information
export async function getDatabaseInfo(): Promise<unknown> {
  try {
    const result = await executeDatabricksQuery("SHOW DATABASES");
    return result;
  } catch (error) {
    console.error("Failed to get database info:", error);
    throw error;
  }
}

// Get table information for a specific database
export async function getTableInfo(databaseName: string): Promise<unknown> {
  try {
    const result = await executeDatabricksQuery(
      `SHOW TABLES IN ${databaseName}`,
    );
    return result;
  } catch (error) {
    console.error("Failed to get table info:", error);
    throw error;
  }
}

// Close Databricks connection
export async function closeDatabricksConnection(): Promise<void> {
  if (databricksClient) {
    try {
      await databricksClient.close();
      databricksClient = null;
      connectionStatus = "unknown";

      // Clear cached token
      cachedAccessToken = null;
      tokenExpiresAt = null;

      console.log("[DATABRICKS] Connection closed and token cache cleared");
    } catch (error) {
      console.error("[DATABRICKS] Error closing Databricks connection:", error);
    }
  }
}

// Force refresh the OAuth token and reconnect
export async function refreshDatabricksToken(): Promise<void> {
  console.log("[DATABRICKS] Force refreshing OAuth token...");

  // Get new token (force refresh)
  await getAccessToken(true);

  // Close existing connection if any
  if (databricksClient) {
    try {
      await databricksClient.close();
    } catch (error) {
      logDatabricksError("Close connection during token refresh", error);
    }
    databricksClient = null;
  }

  // Reconnect with new token
  await initializeDatabricks();
  console.log("[DATABRICKS] Token refreshed and reconnected successfully");
}

// Get token expiration info
export function getTokenExpirationInfo(): {
  hasToken: boolean;
  expiresAt: string | null;
  isValid: boolean;
  expiresInMinutes: number | null;
} {
  if (!tokenExpiresAt) {
    return {
      hasToken: !!cachedAccessToken,
      expiresAt: null,
      isValid: false,
      expiresInMinutes: null,
    };
  }

  const now = Date.now();
  const expiresAtTime = tokenExpiresAt.getTime();
  const expiresInMs = expiresAtTime - now;
  const expiresInMinutes = Math.floor(expiresInMs / 60000);

  return {
    hasToken: !!cachedAccessToken,
    expiresAt: tokenExpiresAt.toISOString(),
    isValid: isTokenValid(),
    expiresInMinutes: expiresInMinutes,
  };
}

// Query AI Work Orders from Databricks
export async function getAIWorkOrders(params?: {
  limit?: number;
  offset?: number;
  priority?: string;
  homeLocation?: string;
}): Promise<unknown[]> {
  try {
    let query =
      "SELECT * FROM public_sector.predictive_maintenance_navy_test.ai_work_orders";
    const conditions: string[] = [];

    if (params?.priority) {
      conditions.push(`priority = '${params.priority}'`);
    }

    if (params?.homeLocation) {
      conditions.push(`home_location = '${params.homeLocation}'`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY hourly_timestamp DESC";

    if (params?.limit) {
      query += ` LIMIT ${params.limit}`;
    }

    if (params?.offset) {
      query += ` OFFSET ${params.offset}`;
    }

    const result = await executeDatabricksQuery(query);
    return result;
  } catch (error) {
    logDatabricksError("Get AI Work Orders", error, { params });
    throw error;
  }
}

// Get single AI Work Order by work order ID
export async function getAIWorkOrderById(
  workOrderId: string,
): Promise<unknown> {
  try {
    const query = `SELECT * FROM public_sector.predictive_maintenance_navy_test.ai_work_orders WHERE work_order = '${workOrderId}'`;
    const result = await executeDatabricksQuery(query);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    logDatabricksError("Get AI Work Order By ID", error, { workOrderId });
    throw error;
  }
}

// Get AI Work Orders by turbine ID
export async function getAIWorkOrdersByTurbineId(
  turbineId: string,
): Promise<unknown[]> {
  try {
    const query = `SELECT * FROM public_sector.predictive_maintenance_navy_test.ai_work_orders WHERE turbine_id = '${turbineId}' ORDER BY hourly_timestamp DESC`;
    const result = await executeDatabricksQuery(query);
    return result;
  } catch (error) {
    logDatabricksError("Get AI Work Orders By Turbine ID", error, {
      turbineId,
    });
    throw error;
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
  const tokenInfo = getTokenExpirationInfo();

  try {
    // Check token validity
    if (tokenInfo.hasToken && !tokenInfo.isValid) {
      recommendations.push(
        "OAuth token is expired or about to expire. Token will be automatically refreshed on next connection.",
      );
    }

    if (
      tokenInfo.hasToken &&
      tokenInfo.expiresInMinutes !== null &&
      tokenInfo.expiresInMinutes < 15
    ) {
      recommendations.push(
        `OAuth token expires in ${tokenInfo.expiresInMinutes} minutes. Consider manual refresh if needed.`,
      );
    }

    // Check if we need to run a health check (avoid too frequent checks)
    const shouldCheck =
      !lastHealthCheck ||
      Date.now() - lastHealthCheck.getTime() >
        CONNECTION_CONFIG.healthCheckInterval;

    if (!shouldCheck && connectionStatus === "healthy" && tokenInfo.isValid) {
      return {
        status: "healthy",
        timestamp,
        details: { cached: true, lastCheck: lastHealthCheck?.toISOString() },
        diagnostics: {
          connectionStatus,
          lastHealthCheck: lastHealthCheck?.toISOString(),
          cacheUsed: true,
          token: tokenInfo,
        },
        recommendations:
          recommendations.length > 0 ? recommendations : undefined,
      };
    }

    const testResult = await testDatabricksConnection();

    // Generate recommendations based on diagnostics
    const responseTime = testResult.diagnostics?.responseTime as
      | number
      | undefined;
    if (responseTime && responseTime > 5000) {
      recommendations.push(
        "High response time detected. Consider checking network connectivity or Databricks warehouse status.",
      );
    }

    if (testResult.success && responseTime && responseTime > 10000) {
      recommendations.push(
        "Very high response time. This may indicate Databricks warehouse is cold or overloaded.",
      );
    }

    return {
      status: testResult.success ? "healthy" : "unhealthy",
      timestamp,
      details: testResult,
      diagnostics: {
        ...testResult.diagnostics,
        token: tokenInfo,
        config: {
          maxRetries: CONNECTION_CONFIG.maxRetries,
          timeout: CONNECTION_CONFIG.timeout,
          healthCheckInterval: CONNECTION_CONFIG.healthCheckInterval,
          tokenRefreshBuffer: TOKEN_REFRESH_BUFFER / 1000 + " seconds",
        },
      },
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  } catch (error) {
    connectionStatus = "unhealthy";
    lastHealthCheck = new Date();

    const errorMessage = error instanceof Error ? error.message : String(error);
    logDatabricksError("Health check", error);

    // Generate recommendations based on error type
    if (errorMessage.includes("timeout")) {
      recommendations.push(
        "Connection timeout detected. Check network connectivity and Databricks service status.",
      );
    } else if (errorMessage.includes("token")) {
      recommendations.push(
        "Authentication failed. Verify service principal credentials and permissions.",
      );
    } else if (errorMessage.includes("environment")) {
      recommendations.push(
        "Configuration issue. Check that all required environment variables are set.",
      );
    }

    return {
      status: "unhealthy",
      timestamp,
      details: { error: errorMessage },
      diagnostics: {
        connectionStatus,
        lastHealthCheck: lastHealthCheck.toISOString(),
        token: tokenInfo,
        error: errorMessage,
      },
      recommendations:
        recommendations.length > 0
          ? recommendations
          : ["Check Databricks service status and network connectivity."],
    };
  }
}

// Query Parts Requisitions from Databricks
export async function getPartsRequisitions(params?: {
  limit?: number;
  offset?: number;
  partType?: string;
  stockLocation?: string;
  designator?: string;
  orderNumber?: string;
}): Promise<unknown[]> {
  try {
    let query =
      "SELECT * FROM public_sector.predictive_maintenance_navy_test.ai_part_orders";
    const conditions: string[] = [];

    if (params?.partType) {
      conditions.push(`type = '${params.partType}'`);
    }

    if (params?.stockLocation) {
      conditions.push(`stock_location = '${params.stockLocation}'`);
    }

    if (params?.designator) {
      conditions.push(`designator = '${params.designator}'`);
    }

    if (params?.orderNumber) {
      conditions.push(`order_number = '${params.orderNumber}'`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY order_number DESC";

    if (params?.limit) {
      query += ` LIMIT ${params.limit}`;
    }

    if (params?.offset) {
      query += ` OFFSET ${params.offset}`;
    }

    const result = await executeDatabricksQuery(query);
    return result;
  } catch (error) {
    logDatabricksError("Get Parts Requisitions", error, { params });
    throw error;
  }
}

// Get single Parts Requisition by order number
export async function getPartsRequisitionByOrderNumber(
  orderNumber: string,
): Promise<unknown[]> {
  try {
    const query = `SELECT * FROM public_sector.predictive_maintenance_navy_test.ai_part_orders WHERE order_number = '${orderNumber}'`;
    const result = await executeDatabricksQuery(query);
    return result;
  } catch (error) {
    logDatabricksError("Get Parts Requisition By Order Number", error, {
      orderNumber,
    });
    throw error;
  }
}

// Get Parts Requisitions by designator ID
export async function getPartsRequisitionsByDesignatorId(
  designatorId: string,
): Promise<unknown[]> {
  try {
    const query = `SELECT * FROM public_sector.predictive_maintenance_navy_test.ai_part_orders WHERE designator_id = '${designatorId}' ORDER BY order_number DESC`;
    const result = await executeDatabricksQuery(query);
    return result;
  } catch (error) {
    logDatabricksError("Get Parts Requisitions By Designator ID", error, {
      designatorId,
    });
    throw error;
  }
}

// Query Ship Status from Databricks
export async function getShipStatus(params?: {
  limit?: number;
  offset?: number;
  designator?: string;
  homeLocation?: string;
  turbineId?: string;
  operable?: boolean;
}): Promise<unknown[]> {
  try {
    let query =
      "SELECT * FROM public_sector.predictive_maintenance_navy_test.ship_current_status_gold";
    const conditions: string[] = [];

    if (params?.designator) {
      conditions.push(`designator LIKE '%${params.designator}%'`);
    }

    if (params?.homeLocation) {
      conditions.push(`home_location LIKE '%${params.homeLocation}%'`);
    }

    if (params?.turbineId) {
      conditions.push(`turbine_id = '${params.turbineId}'`);
    }

    if (params?.operable !== undefined) {
      conditions.push(`operable = ${params.operable}`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY hourly_timestamp DESC";

    if (params?.limit) {
      query += ` LIMIT ${params.limit}`;
    }

    if (params?.offset) {
      query += ` OFFSET ${params.offset}`;
    }

    const result = await executeDatabricksQuery(query);
    return result;
  } catch (error) {
    logDatabricksError("Get Ship Status", error, { params });
    throw error;
  }
}

// Get Ship Status by Turbine ID
export async function getShipStatusByTurbineId(
  turbineId: string,
): Promise<unknown> {
  try {
    const query = `SELECT * FROM public_sector.predictive_maintenance_navy_test.ship_current_status_gold WHERE turbine_id = '${turbineId}' ORDER BY hourly_timestamp DESC LIMIT 1`;
    const result = await executeDatabricksQuery(query);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    logDatabricksError("Get Ship Status By Turbine ID", error, { turbineId });
    throw error;
  }
}

// Query Parts from Databricks
export async function getParts(params?: {
  page?: number;
  limit?: number;
  category?: string;
  condition?: string;
  search?: string;
}): Promise<unknown[]> {
  try {
    let query = "SELECT * FROM public_sector.predictive_maintenance_navy_test.ai_part_orders";
    const conditions: string[] = [];

    if (params?.category) {
      conditions.push(`category = '${params.category}'`);
    }

    if (params?.condition) {
      conditions.push(`condition = '${params.condition}'`);
    }

    if (params?.search) {
      conditions.push(
        `(name LIKE '%${params.search}%' OR id LIKE '%${params.search}%')`,
      );
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY last_updated DESC";

    const limit = params?.limit || 50;
    const offset = params?.page ? (params.page - 1) * limit : 0;

    query += ` LIMIT ${limit} OFFSET ${offset}`;

    const result = await executeDatabricksQuery(query);
    return result;
  } catch (error) {
    logDatabricksError("Get Parts", error, { params });
    throw error;
  }
}
