/* eslint-env node */
// Databricks Configuration (JavaScript version for server.js)
export const databricksConfig = {
  // Get current configuration
  get: () => {
    return {
      clientId: process.env.DATABRICKS_CLIENT_ID,
      clientSecret: process.env.DATABRICKS_CLIENT_SECRET,
      serverHostname: process.env.DATABRICKS_SERVER_HOSTNAME || process.env.DATABRICKS_HOST,
      httpPath: process.env.DATABRICKS_HTTP_PATH || `/sql/1.0/warehouses/8baced1ff014912d`
    };
  },

  // Update configuration
  set: (newConfig) => {
    if (newConfig.clientId) process.env.DATABRICKS_CLIENT_ID = newConfig.clientId;
    if (newConfig.clientSecret) process.env.DATABRICKS_CLIENT_SECRET = newConfig.clientSecret;
    if (newConfig.serverHostname) process.env.DATABRICKS_SERVER_HOSTNAME = newConfig.serverHostname;
    if (newConfig.httpPath) process.env.DATABRICKS_HTTP_PATH = newConfig.httpPath;
  },

  // Validate configuration
  validate: () => {
    const config = databricksConfig.get();
    const missingFields = [];
    
    if (!config.clientId) missingFields.push('clientId');
    if (!config.clientSecret) missingFields.push('clientSecret');
    if (!config.serverHostname) missingFields.push('serverHostname');
    if (!config.httpPath) missingFields.push('httpPath');
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  },

  // Get configuration for logging (without sensitive data)
  getSafeConfig: () => {
    const config = databricksConfig.get();
    return {
      clientId: config.clientId,
      clientSecret: !!config.clientSecret,
      serverHostname: config.serverHostname,
      httpPath: config.httpPath
    };
  }
};
