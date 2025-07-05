import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

// Create the PostgreSQL connection with SSL
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 1,
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
} = schema;