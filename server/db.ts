import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === 'development') {
    // In development, set a dummy DATABASE_URL for demo mode
    process.env.DATABASE_URL = "postgresql://demo:demo@localhost:5432/demo";
    console.log("⚠️ Using dummy DATABASE_URL for demo mode");
  } else {
    throw new Error("DATABASE_URL is required");
  }
}

// Create the PostgreSQL connection without SSL (as per config)
const sql = postgres(process.env.DATABASE_URL, {
  ssl: false,
  max: 10, // Increase pool size
  idle_timeout: 0, // Don't close idle connections
  max_lifetime: null, // Don't expire connections
  connect_timeout: 30, // 30 second connection timeout
});

// Create the database instance with schema
export const db = drizzle(sql, { schema });

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