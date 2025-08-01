// DIRECT MS SQL SERVER CONNECTION
import { getSqlServerConnection, SQL_SERVER_CONFIG } from "./sql-server-db.js";
import * as schema from "../shared/schema.js";

console.log("🚀 Connecting to MS SQL Server:", {
  server: SQL_SERVER_CONFIG.server,
  port: SQL_SERVER_CONFIG.port,
  database: SQL_SERVER_CONFIG.database
});

// Get MS SQL Server connection (already configured)
export const sqlConnection = getSqlServerConnection();

// Simple database interface for compatibility
export const db = {
  // This will be used by storage layer
  connection: sqlConnection,
  query: async (query: string, params?: any[]) => {
    const pool = await sqlConnection;
    const request = pool.request();
    if (params) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
    }
    return request.query(query);
  }
};

// Export schema elements for convenience
export const {
  users,
  customers,
  tasks,
  taskUpdates,
  performanceMetrics,
  domains,
  sqlConnections,
  sessions,
  chatRooms,
  chatMessages,
  chatParticipants,
  customerComments,
  customerSystemDetails,
  userLocations,
  geofenceZones,
  geofenceEvents,
  tripTracking,
  officeLocations,
  officeLocationSuggestions,
  engineerTrackingHistory,
  botConfigurations,
  notificationLogs,
} = schema;