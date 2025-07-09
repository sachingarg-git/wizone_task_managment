import {
  pgTable,
  varchar,
  text,
  integer,
  serial,
  boolean,
  timestamp,
  decimal,
  primaryKey,
  unique,
  index,
  json,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for authentication)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid", { length: 255 }).primaryKey(),
    sess: text("sess").notNull(), // JSON data stored as TEXT
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  username: varchar("username").unique(),
  password: varchar("password"),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("engineer"),
  department: varchar("department"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  customerId: varchar("customer_id").unique().notNull(),
  name: varchar("name").notNull(),
  contactPerson: varchar("contact_person"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  mobilePhone: varchar("mobile_phone"),
  email: varchar("email"),
  servicePlan: varchar("service_plan"),
  connectedTower: varchar("connected_tower"),
  wirelessIp: varchar("wireless_ip"),
  wirelessApIp: varchar("wireless_ap_ip"),
  port: varchar("port"),
  plan: varchar("plan"),
  installationDate: timestamp("installation_date"),
  status: varchar("status").notNull().default("active"),
  username: varchar("username"),
  password: varchar("password"),
  portalAccess: boolean("portal_access").default(false),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  locationNotes: text("location_notes"),
  locationVerified: boolean("location_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  ticketNumber: varchar("ticket_number").unique().notNull(),
  title: varchar("title").notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  fieldEngineerId: varchar("field_engineer_id").references(() => users.id),
  createdBy: varchar("created_by").references(() => users.id),
  priority: varchar("priority").notNull(), // High, Medium, Low
  issueType: varchar("issue_type").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, assigned_to_field, start_task, waiting_for_customer, in_progress, resolved, completed, cancelled
  description: text("description"),
  resolution: text("resolution"),
  completionNote: text("completion_note"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  fieldStartTime: timestamp("field_start_time"),
  fieldWaitingTime: timestamp("field_waiting_time"),
  fieldWaitingReason: text("field_waiting_reason"),
  startTime: timestamp("start_time"),
  completionTime: timestamp("completion_time"),
  estimatedTime: integer("estimated_time"), // in minutes
  actualTime: integer("actual_time"), // in minutes
  visitCharges: decimal("visit_charges", { precision: 10, scale: 2 }),
  contactPerson: varchar("contact_person"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const taskUpdates = pgTable("task_updates", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  updatedBy: varchar("updated_by").references(() => users.id).notNull(),
  updateType: varchar("update_type").notNull(), // status_change, note_added, file_uploaded, description_updated
  oldValue: text("old_value"),
  newValue: text("new_value"),
  note: text("note"),
  attachments: text("attachments").array(), // Array of file URLs/paths
  createdAt: timestamp("created_at").defaultNow(),
});

export const customerComments = pgTable("customer_comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  comment: text("comment").notNull(),
  attachments: text("attachments").array(), // Array of file URLs/paths
  isInternal: boolean("is_internal").default(false), // For internal notes not visible to customer
  respondedBy: varchar("responded_by").references(() => users.id), // Engineer who responded
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer system details table - Employee system information
export const customerSystemDetails = pgTable("customer_system_details", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  empId: varchar("emp_id").notNull(), // Employee ID
  systemName: varchar("system_name").notNull(),
  systemConfiguration: text("system_configuration"), // System configuration details
  processorName: varchar("processor_name"), // Processor name
  ram: varchar("ram"), // RAM specification (e.g., "16GB DDR4")
  hardDisk: varchar("hard_disk"), // Hard disk specification (e.g., "1TB SATA")
  ssd: varchar("ssd"), // SSD specification (e.g., "256GB")
  sharingStatus: boolean("sharing_status").default(false), // Sharing on/off
  administratorAccount: boolean("administrator_account").default(false), // Administrator account on/off
  antivirusAvailable: boolean("antivirus_available").default(false), // Antivirus available/not
  upsAvailable: boolean("ups_available").default(false), // UPS available/not
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const performanceMetrics = pgTable("performance_metrics", {
  userId: varchar("user_id").references(() => users.id).notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  totalTasks: integer("total_tasks").notNull().default(0),
  completedTasks: integer("completed_tasks").notNull().default(0),
  averageResponseTime: decimal("average_response_time", { precision: 10, scale: 2 }), // in hours
  performanceScore: decimal("performance_score", { precision: 5, scale: 2 }),
  customerSatisfactionRating: decimal("customer_satisfaction_rating", { precision: 3, scale: 2 }),
  firstCallResolutionRate: decimal("first_call_resolution_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userMonthYear: primaryKey({ columns: [table.userId, table.month, table.year] }),
}));

// Domain management table for custom domain hosting
export const domains = pgTable("domains", {
  id: serial("id").primaryKey(),
  domain: varchar("domain").notNull().unique(),
  customDomain: varchar("custom_domain"),
  ssl: boolean("ssl").default(false),
  status: varchar("status").notNull().default("pending"), // 'active', 'pending', 'inactive'
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SQL connections table for external database management
export const sqlConnections = pgTable("sql_connections", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  host: varchar("host").notNull(),
  port: integer("port").notNull().default(5432),
  database: varchar("database").notNull(),
  username: varchar("username").notNull(),
  password: text("password").notNull(), // This will be encrypted in storage
  connectionType: varchar("connection_type").notNull().default("postgresql"), // postgresql, mysql, mssql, sqlite
  sslEnabled: boolean("ssl_enabled").default(false),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "cascade" }),
  lastTested: timestamp("last_tested"),
  testStatus: varchar("test_status"), // success, failed, pending, never_tested
  testResult: text("test_result"), // error message or success confirmation
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat system tables for internal engineer communication
export const chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  roomType: varchar("room_type", { length: 20 }).notNull().default("group"), // group, direct, general
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by", { length: 100 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id", { length: 100 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  messageType: varchar("message_type", { length: 20 }).notNull().default("text"), // text, file, image, system
  attachmentUrl: text("attachment_url"),
  attachmentName: varchar("attachment_name", { length: 255 }),
  isEdited: boolean("is_edited").notNull().default(false),
  editedAt: timestamp("edited_at"),
  replyToMessageId: integer("reply_to_message_id").references(() => chatMessages.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatParticipants = pgTable("chat_participants", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 100 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull().default("member"), // admin, moderator, member
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lastReadAt: timestamp("last_read_at").defaultNow().notNull(),
  isActive: boolean("is_active").notNull().default(true),
}, (table) => ({
  uniqueRoomUser: unique().on(table.roomId, table.userId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assignedTasks: many(tasks, { relationName: "assignedTasks" }),
  fieldTasks: many(tasks, { relationName: "fieldTasks" }),
  createdTasks: many(tasks, { relationName: "createdTasks" }),
  performanceMetrics: many(performanceMetrics),
  ownedDomains: many(domains),
  sqlConnections: many(sqlConnections),
  createdChatRooms: many(chatRooms),
  sentMessages: many(chatMessages),
  chatParticipations: many(chatParticipants),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  tasks: many(tasks),
  comments: many(customerComments),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  customer: one(customers, {
    fields: [tasks.customerId],
    references: [customers.id],
  }),
  assignedUser: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
    relationName: "assignedTasks",
  }),
  fieldEngineer: one(users, {
    fields: [tasks.fieldEngineerId],
    references: [users.id],
    relationName: "fieldTasks",
  }),
  createdByUser: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
    relationName: "createdTasks",
  }),
  updates: many(taskUpdates),
  customerComments: many(customerComments),
}));

export const taskUpdatesRelations = relations(taskUpdates, ({ one }) => ({
  task: one(tasks, {
    fields: [taskUpdates.taskId],
    references: [tasks.id],
  }),
  updatedByUser: one(users, {
    fields: [taskUpdates.updatedBy],
    references: [users.id],
  }),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  user: one(users, {
    fields: [performanceMetrics.userId],
    references: [users.id],
  }),
}));

export const domainsRelations = relations(domains, ({ one }) => ({
  owner: one(users, {
    fields: [domains.ownerId],
    references: [users.id],
  }),
}));

export const sqlConnectionsRelations = relations(sqlConnections, ({ one }) => ({
  createdByUser: one(users, {
    fields: [sqlConnections.createdBy],
    references: [users.id],
  }),
}));

export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [chatRooms.createdBy],
    references: [users.id],
  }),
  messages: many(chatMessages),
  participants: many(chatParticipants),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  room: one(chatRooms, {
    fields: [chatMessages.roomId],
    references: [chatRooms.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
  replyToMessage: one(chatMessages, {
    fields: [chatMessages.replyToMessageId],
    references: [chatMessages.id],
  }),
}));

export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
  room: one(chatRooms, {
    fields: [chatParticipants.roomId],
    references: [chatRooms.id],
  }),
  user: one(users, {
    fields: [chatParticipants.userId],
    references: [users.id],
  }),
}));

export const customerCommentsRelations = relations(customerComments, ({ one }) => ({
  task: one(tasks, {
    fields: [customerComments.taskId],
    references: [tasks.id],
  }),
  customer: one(customers, {
    fields: [customerComments.customerId],
    references: [customers.id],
  }),
  respondedByUser: one(users, {
    fields: [customerComments.respondedBy],
    references: [users.id],
  }),
}));

// Relations for geofencing tables (moved to after table definitions)

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  ticketNumber: true, // Auto-generated by backend
  createdAt: true,
  updatedAt: true,
});

export const insertPerformanceMetricsSchema = createInsertSchema(performanceMetrics).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertTaskUpdateSchema = createInsertSchema(taskUpdates).omit({
  id: true,
  createdAt: true,
});

export const insertDomainSchema = createInsertSchema(domains).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSqlConnectionSchema = createInsertSchema(sqlConnections).omit({
  id: true,
  lastTested: true,
  testStatus: true,
  testResult: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSystemDetailsSchema = createInsertSchema(customerSystemDetails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatRoomSchema = createInsertSchema(chatRooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatParticipantSchema = createInsertSchema(chatParticipants).omit({
  id: true,
  joinedAt: true,
  lastReadAt: true,
});

export const insertCustomerCommentSchema = createInsertSchema(customerComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertPerformanceMetrics = z.infer<typeof insertPerformanceMetricsSchema>;
export type PerformanceMetrics = typeof performanceMetrics.$inferSelect;
export type InsertTaskUpdate = z.infer<typeof insertTaskUpdateSchema>;
export type TaskUpdate = typeof taskUpdates.$inferSelect;
export type InsertDomain = z.infer<typeof insertDomainSchema>;
export type Domain = typeof domains.$inferSelect;
export type InsertSqlConnection = z.infer<typeof insertSqlConnectionSchema>;
export type SqlConnection = typeof sqlConnections.$inferSelect;
export type InsertCustomerSystemDetails = z.infer<typeof insertCustomerSystemDetailsSchema>;
export type CustomerSystemDetails = typeof customerSystemDetails.$inferSelect;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatParticipant = z.infer<typeof insertChatParticipantSchema>;
export type ChatParticipant = typeof chatParticipants.$inferSelect;

// Extended types for API responses
export type TaskWithRelations = Task & {
  customer?: Customer;
  assignedUser?: User;
  createdByUser?: User;
  fieldEngineer?: User;
  updates?: TaskUpdateWithUser[];
};

export type TaskUpdateWithUser = TaskUpdate & {
  updatedByUser?: User;
};

export type UserWithMetrics = User & {
  performanceMetrics?: PerformanceMetrics[];
};

// Chat-related extended types
export type ChatRoomWithParticipants = ChatRoom & {
  participants?: (ChatParticipant & { user: User })[];
  messagesCount?: number;
  lastMessage?: ChatMessage & { sender: User };
};

export type ChatMessageWithSender = ChatMessage & {
  sender: User;
  replyToMessage?: ChatMessage & { sender: User };
};

export type ChatRoomWithMessages = ChatRoom & {
  messages?: ChatMessageWithSender[];
  participants?: (ChatParticipant & { user: User })[];
};

export type CustomerComment = typeof customerComments.$inferSelect;
export type InsertCustomerComment = z.infer<typeof insertCustomerCommentSchema>;

export type CustomerCommentWithUser = CustomerComment & {
  task?: Task;
  customer?: Customer;
  respondedByUser?: User;
};

// Location tracking for field engineers
export const userLocations = pgTable("user_locations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: "set null" }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  accuracy: decimal("accuracy", { precision: 8, scale: 2 }), // GPS accuracy in meters
  altitude: decimal("altitude", { precision: 8, scale: 2 }),
  speed: decimal("speed", { precision: 8, scale: 2 }), // Speed in km/h
  heading: decimal("heading", { precision: 5, scale: 2 }), // Direction in degrees
  locationSource: varchar("location_source").default("gps"), // gps, network, passive
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Office locations for distance calculations
export const officeLocations = pgTable("office_locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  address: text("address"),
  isMainOffice: boolean("is_main_office").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Office location suggestions based on team distribution analysis
export const officeLocationSuggestions = pgTable("office_location_suggestions", {
  id: serial("id").primaryKey(),
  suggestedLatitude: decimal("suggested_latitude", { precision: 10, scale: 8 }).notNull(),
  suggestedLongitude: decimal("suggested_longitude", { precision: 11, scale: 8 }).notNull(),
  calculatedCenter: boolean("calculated_center").default(true),
  teamMembersCount: integer("team_members_count").notNull(),
  averageDistance: decimal("average_distance", { precision: 8, scale: 2 }),
  maxDistance: decimal("max_distance", { precision: 8, scale: 2 }),
  coverageRadius: decimal("coverage_radius", { precision: 8, scale: 2 }),
  efficiency: decimal("efficiency", { precision: 5, scale: 2 }), // Percentage score
  suggestedAddress: text("suggested_address"),
  analysisData: json("analysis_data"), // Store team distribution details
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Geofencing zones (office, customer locations, service areas)
export const geofenceZones = pgTable("geofence_zones", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  zoneType: varchar("zone_type").notNull(), // office, customer, service_area, restricted
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  centerLatitude: decimal("center_latitude", { precision: 10, scale: 8 }).notNull(),
  centerLongitude: decimal("center_longitude", { precision: 11, scale: 8 }).notNull(),
  radius: decimal("radius", { precision: 8, scale: 2 }).notNull(), // Radius in meters
  polygonCoordinates: text("polygon_coordinates"), // JSON array of lat/lng for complex shapes
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Geofence events (enter/exit tracking)
export const geofenceEvents = pgTable("geofence_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  zoneId: integer("zone_id").notNull().references(() => geofenceZones.id, { onDelete: "cascade" }),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: "set null" }),
  eventType: varchar("event_type").notNull(), // enter, exit, dwell
  eventTime: timestamp("event_time").notNull().defaultNow(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  dwellTime: integer("dwell_time"), // Time spent in zone (minutes)
  distance: decimal("distance", { precision: 8, scale: 2 }), // Distance traveled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Engineer tracking history for detailed analysis
export const engineerTrackingHistory = pgTable("engineer_tracking_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: "set null" }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  distanceFromOffice: decimal("distance_from_office", { precision: 8, scale: 2 }),
  distanceFromCustomer: decimal("distance_from_customer", { precision: 8, scale: 2 }),
  movementType: varchar("movement_type"), // traveling_to_customer, at_customer_location, returning_to_office, break, other
  speedKmh: decimal("speed_kmh", { precision: 6, scale: 2 }),
  accuracy: decimal("accuracy", { precision: 8, scale: 2 }),
  batteryLevel: integer("battery_level"),
  networkStatus: varchar("network_status"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trip tracking for field engineers
export const tripTracking = pgTable("trip_tracking", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: "set null" }),
  tripType: varchar("trip_type").notNull(), // to_customer, to_office, service_call
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  startLatitude: decimal("start_latitude", { precision: 10, scale: 8 }).notNull(),
  startLongitude: decimal("start_longitude", { precision: 11, scale: 8 }).notNull(),
  endLatitude: decimal("end_latitude", { precision: 10, scale: 8 }),
  endLongitude: decimal("end_longitude", { precision: 11, scale: 8 }),
  totalDistance: decimal("total_distance", { precision: 8, scale: 2 }), // Distance in km
  totalDuration: integer("total_duration"), // Duration in minutes
  avgSpeed: decimal("avg_speed", { precision: 8, scale: 2 }), // Average speed in km/h
  maxSpeed: decimal("max_speed", { precision: 8, scale: 2 }), // Maximum speed in km/h
  routeData: text("route_data"), // JSON array of location points
  status: varchar("status").notNull().default("active"), // active, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bot configuration for notifications (Telegram, WhatsApp, etc.)
export const botConfigurations = pgTable("bot_configurations", {
  id: serial("id").primaryKey(),
  configName: varchar("config_name").notNull(),
  botType: varchar("bot_type").notNull(), // telegram, whatsapp, slack, discord
  isActive: boolean("is_active").notNull().default(true),
  
  // Telegram Configuration
  telegramBotToken: varchar("telegram_bot_token"),
  telegramChatId: varchar("telegram_chat_id"),
  telegramParseMode: varchar("telegram_parse_mode").default("HTML"), // HTML, Markdown, MarkdownV2
  
  // WhatsApp Configuration (via WhatsApp Business API)
  whatsappApiUrl: varchar("whatsapp_api_url"),
  whatsappApiKey: varchar("whatsapp_api_key"),
  whatsappPhoneNumber: varchar("whatsapp_phone_number"),
  whatsappBusinessId: varchar("whatsapp_business_id"),
  
  // Generic Webhook Configuration
  webhookUrl: varchar("webhook_url"),
  webhookMethod: varchar("webhook_method").default("POST"), // GET, POST, PUT
  webhookHeaders: json("webhook_headers"), // Additional headers as JSON
  webhookAuth: varchar("webhook_auth"), // Bearer token or API key
  
  // Notification Settings
  notifyOnTaskCreate: boolean("notify_on_task_create").default(true),
  notifyOnTaskUpdate: boolean("notify_on_task_update").default(true),
  notifyOnTaskComplete: boolean("notify_on_task_complete").default(true),
  notifyOnTaskAssign: boolean("notify_on_task_assign").default(true),
  notifyOnTaskStatusChange: boolean("notify_on_task_status_change").default(true),
  notifyOnHighPriority: boolean("notify_on_high_priority").default(true),
  
  // Message Templates
  taskCreateTemplate: text("task_create_template"),
  taskUpdateTemplate: text("task_update_template"),
  taskCompleteTemplate: text("task_complete_template"),
  taskAssignTemplate: text("task_assign_template"),
  statusChangeTemplate: text("status_change_template"),
  
  // Filtering Options
  filterByPriority: text("filter_by_priority").array(), // ["high", "medium", "low"]
  filterByStatus: text("filter_by_status").array(), // ["pending", "in_progress", "completed"]
  filterByDepartment: text("filter_by_department").array(), // ["IT", "Technical", "Support"]
  filterByUser: text("filter_by_user").array(), // User IDs to filter notifications
  
  // Rate Limiting
  maxNotificationsPerHour: integer("max_notifications_per_hour").default(100),
  
  // Retry Settings
  retryCount: integer("retry_count").default(3),
  retryDelay: integer("retry_delay").default(5), // seconds
  
  // Status and Testing
  lastTestResult: varchar("last_test_result"), // success, failed, pending
  lastTestTime: timestamp("last_test_time"),
  testMessage: text("test_message"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notification logs to track sent messages
export const notificationLogs = pgTable("notification_logs", {
  id: serial("id").primaryKey(),
  configId: integer("config_id").references(() => botConfigurations.id, { onDelete: "cascade" }),
  eventType: varchar("event_type").notNull(), // task_create, task_update, status_change, etc.
  taskId: integer("task_id").references(() => tasks.id, { onDelete: "set null" }),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  messageText: text("message_text"),
  messageTemplateUsed: varchar("message_template_used"),
  status: varchar("status").notNull().default("pending"), // pending, sent, failed, retrying
  responseData: json("response_data"), // API response
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  sentAt: timestamp("sent_at"),
  retryCount: integer("retry_count").default(0),
  nextRetryAt: timestamp("next_retry_at"),
});

// Insert schemas for geofencing and tracking
export const insertOfficeLocationSchema = createInsertSchema(officeLocations);
export const insertOfficeLocationSuggestionSchema = createInsertSchema(officeLocationSuggestions);
export const insertUserLocationSchema = createInsertSchema(userLocations);
export const insertGeofenceZoneSchema = createInsertSchema(geofenceZones);
export const insertGeofenceEventSchema = createInsertSchema(geofenceEvents);
export const insertEngineerTrackingHistorySchema = createInsertSchema(engineerTrackingHistory);
export const insertTripTrackingSchema = createInsertSchema(tripTracking);

// Insert schemas for bot configuration
export const insertBotConfigurationSchema = createInsertSchema(botConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationLogSchema = createInsertSchema(notificationLogs).omit({
  id: true,
  createdAt: true,
});

// Types for geofencing and tracking
export type UserLocation = typeof userLocations.$inferSelect;
export type InsertUserLocation = z.infer<typeof insertUserLocationSchema>;

export type GeofenceZone = typeof geofenceZones.$inferSelect;
export type InsertGeofenceZone = z.infer<typeof insertGeofenceZoneSchema>;

export type GeofenceEvent = typeof geofenceEvents.$inferSelect;
export type InsertGeofenceEvent = z.infer<typeof insertGeofenceEventSchema>;

export type TripTracking = typeof tripTracking.$inferSelect;
export type InsertTripTracking = z.infer<typeof insertTripTrackingSchema>;

export type OfficeLocation = typeof officeLocations.$inferSelect;
export type InsertOfficeLocation = z.infer<typeof insertOfficeLocationSchema>;

export type OfficeLocationSuggestion = typeof officeLocationSuggestions.$inferSelect;
export type InsertOfficeLocationSuggestion = z.infer<typeof insertOfficeLocationSuggestionSchema>;

export type EngineerTrackingHistory = typeof engineerTrackingHistory.$inferSelect;
export type InsertEngineerTrackingHistory = z.infer<typeof insertEngineerTrackingHistorySchema>;

// Bot configuration types
export type BotConfiguration = typeof botConfigurations.$inferSelect;
export type InsertBotConfiguration = z.infer<typeof insertBotConfigurationSchema>;

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = z.infer<typeof insertNotificationLogSchema>;

// Extended types with relations
export type UserLocationWithRelations = UserLocation & {
  user?: User;
  task?: Task;
};

export type GeofenceZoneWithRelations = GeofenceZone & {
  customer?: Customer;
  createdByUser?: User;
  events?: GeofenceEvent[];
};

export type GeofenceEventWithRelations = GeofenceEvent & {
  user?: User;
  zone?: GeofenceZone;
  task?: Task;
};

export type TripTrackingWithRelations = TripTracking & {
  user?: User;
  task?: Task;
};

// Relations for geofencing tables (added after table definitions)
export const userLocationsRelations = relations(userLocations, ({ one }) => ({
  user: one(users, {
    fields: [userLocations.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [userLocations.taskId],
    references: [tasks.id],
  }),
}));

export const geofenceZonesRelations = relations(geofenceZones, ({ one, many }) => ({
  customer: one(customers, {
    fields: [geofenceZones.customerId],
    references: [customers.id],
  }),
  createdByUser: one(users, {
    fields: [geofenceZones.createdBy],
    references: [users.id],
  }),
  events: many(geofenceEvents),
}));

export const geofenceEventsRelations = relations(geofenceEvents, ({ one }) => ({
  user: one(users, {
    fields: [geofenceEvents.userId],
    references: [users.id],
  }),
  zone: one(geofenceZones, {
    fields: [geofenceEvents.zoneId],
    references: [geofenceZones.id],
  }),
  task: one(tasks, {
    fields: [geofenceEvents.taskId],
    references: [tasks.id],
  }),
}));

export const tripTrackingRelations = relations(tripTracking, ({ one }) => ({
  user: one(users, {
    fields: [tripTracking.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [tripTracking.taskId],
    references: [tasks.id],
  }),
}));