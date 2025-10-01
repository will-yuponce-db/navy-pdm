// Databricks Configuration
export interface DatabricksConfig {
  clientId: string | undefined;
  clientSecret: string | undefined;
  serverHostname: string | undefined;
  httpPath: string | undefined;
}

// Default configuration from environment variables
const defaultConfig: DatabricksConfig = {
  clientId: process.env.DATABRICKS_CLIENT_ID,
  clientSecret: process.env.DATABRICKS_CLIENT_SECRET,
  serverHostname: process.env.DATABRICKS_SERVER_HOSTNAME || process.env.DATABRICKS_HOST,
  httpPath: process.env.DATABRICKS_HTTP_PATH || `/sql/1.0/warehouses/8baced1ff014912d`
};

// Current configuration (can be updated programmatically)
let currentConfig: DatabricksConfig = { ...defaultConfig };

// Configuration management functions
export const databricksConfig = {
  // Get current configuration
  get: (): DatabricksConfig => ({ ...currentConfig }),

  // Update configuration
  set: (newConfig: Partial<DatabricksConfig>): void => {
    currentConfig = { ...currentConfig, ...newConfig };
  },

  // Reset to default configuration
  reset: (): void => {
    currentConfig = { ...defaultConfig };
  },

  // Update specific fields
  updateClientId: (clientId: string): void => {
    currentConfig.clientId = clientId;
  },

  updateClientSecret: (clientSecret: string): void => {
    currentConfig.clientSecret = clientSecret;
  },

  updateServerHostname: (serverHostname: string): void => {
    currentConfig.serverHostname = serverHostname;
  },

  updateHttpPath: (httpPath: string): void => {
    currentConfig.httpPath = httpPath;
  },

  // Validate configuration
  validate: (): { isValid: boolean; missingFields: string[] } => {
    const missingFields: string[] = [];
    
    if (!currentConfig.clientId) missingFields.push('clientId');
    if (!currentConfig.clientSecret) missingFields.push('clientSecret');
    if (!currentConfig.serverHostname) missingFields.push('serverHostname');
    if (!currentConfig.httpPath) missingFields.push('httpPath');
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  },

  // Get configuration for logging (without sensitive data)
  getSafeConfig: (): Omit<DatabricksConfig, 'clientSecret'> & { clientSecret: boolean } => {
    return {
      clientId: currentConfig.clientId,
      clientSecret: !!currentConfig.clientSecret,
      serverHostname: currentConfig.serverHostname,
      httpPath: currentConfig.httpPath
    };
  }
};

// Export the current configuration for backward compatibility
export const DATABRICKS_CONFIG = currentConfig;
