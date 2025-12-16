// Production server configuration - DIRECT CONNECTION ONLY
export const PRODUCTION_SERVER = 'http://103.122.85.61:4000';

// No detection, no multiple servers - direct connection only
export const SERVER_CONFIG = {
  PRODUCTION_URL: PRODUCTION_SERVER,
  CONNECTION_TIMEOUT: 10000, // 10 seconds for production server
  HEALTH_CHECK_PATH: '/api/health'
};