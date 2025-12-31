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

// ============================================
// ISP / NETWORK MANAGEMENT SECTION TABLES
// ============================================

// Network towers table for network monitoring (Tower Master)
export const networkTowers = pgTable("network_towers", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  target_ip: varchar("target_ip"),
  location: varchar("location"),
  ssid: varchar("ssid"),
  total_devices: integer("total_devices").default(0),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  bandwidth: varchar("bandwidth").default('1 Gbps'),
  expected_latency: varchar("expected_latency").default('5ms'),
  actual_latency: varchar("actual_latency"),
  description: text("description"),
  status: varchar("status").default('offline'), // online, offline, maintenance
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  last_test_at: timestamp("last_test_at"),
});

// ISP Clients table (Client Master) - Different from customers, these are ISP subscribers
export const ispClients = pgTable("isp_clients", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id").unique().notNull(), // e.g., ISP-001
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  plan: varchar("plan"), // Basic 25Mbps, Standard 50Mbps, Premium 100Mbps, Business 200Mbps
  planSpeed: varchar("plan_speed"), // 25, 50, 100, 200 Mbps
  monthlyFee: decimal("monthly_fee", { precision: 10, scale: 2 }),
  connectionType: varchar("connection_type"), // Fiber, Wireless, Cable
  installationDate: timestamp("installation_date"),
  billingCycle: varchar("billing_cycle").default('monthly'), // monthly, quarterly, yearly
  dueDate: integer("due_date").default(1), // Day of month for billing
  status: varchar("status").default('active'), // active, suspended, terminated, pending
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Network Devices table (Device Master)
export const networkDevices = pgTable("network_devices", {
  id: serial("id").primaryKey(),
  deviceId: varchar("device_id").unique(), // e.g., DEV-001
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // Router, Switch, OLT, ONT, Access Point, Server, Firewall
  model: varchar("model"),
  manufacturer: varchar("manufacturer"),
  ipAddress: varchar("ip_address"),
  macAddress: varchar("mac_address"),
  serialNumber: varchar("serial_number"),
  towerId: integer("tower_id").references(() => networkTowers.id),
  installationDate: timestamp("installation_date"),
  warrantyExpiry: timestamp("warranty_expiry"),
  firmwareVersion: varchar("firmware_version"),
  connectedClients: integer("connected_clients").default(0),
  maxCapacity: integer("max_capacity"),
  status: varchar("status").default('active'), // active, maintenance, inactive
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client Assignments table (Assign Clients) - Links clients to towers/devices
export const clientAssignments = pgTable("client_assignments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => ispClients.id).notNull(),
  towerId: integer("tower_id").references(() => networkTowers.id).notNull(),
  deviceId: integer("device_id").references(() => networkDevices.id),
  port: varchar("port"), // Port number or "Wireless"
  ipAssigned: varchar("ip_assigned"),
  macAddress: varchar("mac_address"),
  bandwidth: varchar("bandwidth"), // Assigned bandwidth
  vlanId: varchar("vlan_id"),
  assignedDate: timestamp("assigned_date").defaultNow(),
  status: varchar("status").default('active'), // active, pending, disconnected
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Maintenance Schedule table (Maintenance Schedule)
export const maintenanceSchedule = pgTable("maintenance_schedule", {
  id: serial("id").primaryKey(),
  taskId: varchar("task_id").unique(), // e.g., MAINT-001
  title: varchar("title").notNull(),
  description: text("description"),
  towerId: integer("tower_id").references(() => networkTowers.id),
  deviceId: integer("device_id").references(() => networkDevices.id),
  scheduledDate: timestamp("scheduled_date").notNull(),
  scheduledTime: varchar("scheduled_time"),
  estimatedDuration: varchar("estimated_duration"), // e.g., "2 hours"
  assignedTo: integer("assigned_to").references(() => users.id),
  assignedToName: varchar("assigned_to_name"),
  type: varchar("type").default('preventive'), // preventive, corrective, emergency, inspection
  priority: varchar("priority").default('medium'), // low, medium, high, critical
  status: varchar("status").default('scheduled'), // scheduled, in_progress, completed, cancelled
  checklist: json("checklist").$type<Array<{ item: string; completed: boolean }>>().default([]),
  notes: text("notes"),
  completedDate: timestamp("completed_date"),
  completedBy: integer("completed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Network Segments table (Network Management)
export const networkSegments = pgTable("network_segments", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // WAN, LAN, VLAN, VPN
  ipRange: varchar("ip_range").notNull(), // CIDR notation e.g., 192.168.1.0/24
  gateway: varchar("gateway").notNull(),
  subnetMask: varchar("subnet_mask").default('255.255.255.0'),
  dns1: varchar("dns1"),
  dns2: varchar("dns2"),
  vlanId: integer("vlan_id"),
  description: text("description"),
  totalDevices: integer("total_devices").default(0),
  activeDevices: integer("active_devices").default(0),
  utilization: integer("utilization").default(0), // Percentage 0-100
  lastPing: integer("last_ping"), // Latency in ms
  status: varchar("status").default('online'), // online, offline, degraded
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// ISP RELATIONS
// ============================================

// Network Towers relations
export const networkTowersRelations = relations(networkTowers, ({ many }) => ({
  devices: many(networkDevices),
  assignments: many(clientAssignments),
  maintenanceTasks: many(maintenanceSchedule),
}));

// ISP Clients relations
export const ispClientsRelations = relations(ispClients, ({ many }) => ({
  assignments: many(clientAssignments),
}));

// Network Devices relations
export const networkDevicesRelations = relations(networkDevices, ({ one, many }) => ({
  tower: one(networkTowers, {
    fields: [networkDevices.towerId],
    references: [networkTowers.id],
  }),
  assignments: many(clientAssignments),
  maintenanceTasks: many(maintenanceSchedule),
}));

// Client Assignments relations
export const clientAssignmentsRelations = relations(clientAssignments, ({ one }) => ({
  client: one(ispClients, {
    fields: [clientAssignments.clientId],
    references: [ispClients.id],
  }),
  tower: one(networkTowers, {
    fields: [clientAssignments.towerId],
    references: [networkTowers.id],
  }),
  device: one(networkDevices, {
    fields: [clientAssignments.deviceId],
    references: [networkDevices.id],
  }),
}));

// Maintenance Schedule relations
export const maintenanceScheduleRelations = relations(maintenanceSchedule, ({ one }) => ({
  tower: one(networkTowers, {
    fields: [maintenanceSchedule.towerId],
    references: [networkTowers.id],
  }),
  device: one(networkDevices, {
    fields: [maintenanceSchedule.deviceId],
    references: [networkDevices.id],
  }),
  assignedUser: one(users, {
    fields: [maintenanceSchedule.assignedTo],
    references: [users.id],
  }),
}));

// ============================================
// ISP INSERT SCHEMAS
// ============================================

export const insertIspClientSchema = createInsertSchema(ispClients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNetworkDeviceSchema = createInsertSchema(networkDevices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientAssignmentSchema = createInsertSchema(clientAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceScheduleSchema = createInsertSchema(maintenanceSchedule).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNetworkSegmentSchema = createInsertSchema(networkSegments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============================================
// ISP TYPES
// ============================================

export type NetworkTower = typeof networkTowers.$inferSelect;
export type InsertNetworkTower = typeof networkTowers.$inferInsert;

export type IspClient = typeof ispClients.$inferSelect;
export type InsertIspClient = z.infer<typeof insertIspClientSchema>;

export type NetworkDevice = typeof networkDevices.$inferSelect;
export type InsertNetworkDevice = z.infer<typeof insertNetworkDeviceSchema>;

export type ClientAssignment = typeof clientAssignments.$inferSelect;
export type InsertClientAssignment = z.infer<typeof insertClientAssignmentSchema>;

export type MaintenanceTask = typeof maintenanceSchedule.$inferSelect;
export type InsertMaintenanceTask = z.infer<typeof insertMaintenanceScheduleSchema>;

export type NetworkSegment = typeof networkSegments.$inferSelect;
export type InsertNetworkSegment = z.infer<typeof insertNetworkSegmentSchema>;

// User storage table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username").unique(),
  passwordHash: varchar("password_hash"),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  department: varchar("department"),
  profileImageUrl: text("profile_image_url"),
  fcmToken: text("fcm_token"),
  role: varchar("role").notNull().default("engineer"),
  active: boolean("active").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  customerId: varchar("customer_id").unique().notNull(),
  name: varchar("name").notNull(),
  contactPerson: varchar("contact_person"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  country: varchar("country"),
  mobilePhone: varchar("mobile_phone"),
  email: varchar("email"),
  servicePlan: varchar("service_plan"),
  connectedTower: varchar("connected_tower"),
  wirelessIp: varchar("wireless_ip"),
  wirelessApIp: varchar("wireless_ap_ip"),
  port: varchar("port"),
  connectionType: varchar("connection_type"),
  planType: varchar("plan_type"),
  monthlyFee: decimal("monthly_fee", { precision: 10, scale: 2 }),
  status: varchar("status").notNull().default("active"),
  portalUsername: varchar("portal_username"),
  portalPassword: varchar("portal_password"),
  portalAccess: boolean("portal_access").default(false),
  isIspCustomer: boolean("is_isp_customer").default(false),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  ticketNumber: varchar("ticket_number").unique(),
  title: varchar("title").notNull(),
  description: text("description"),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: varchar("customer_name"),
  priority: varchar("priority").notNull(),
  status: varchar("status").notNull().default("pending"),
  assignedTo: integer("assigned_to"),
  assignedToName: varchar("assigned_to_name"),
  fieldEngineerId: integer("field_engineer_id").references(() => users.id),
  fieldEngineerName: varchar("field_engineer_name"),
  createdBy: integer("created_by"),
  createdByName: varchar("created_by_name"),
  category: varchar("category"),
  estimatedHours: decimal("estimated_hours", { precision: 8, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 8, scale: 2 }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  completionTime: timestamp("completion_time", { withTimezone: true }),
});

export const taskUpdates = pgTable("task_updates", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  message: text("message").notNull(),
  type: varchar("type").default("comment"), // comment, status_update, assignment, completion, customer_feedback, progress_update, file_upload
  createdBy: integer("created_by").references(() => users.id),
  createdByName: varchar("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customerComments = pgTable("customer_comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  comment: text("comment").notNull(),
  attachments: text("attachments").array(), // Array of file URLs/paths
  isInternal: boolean("is_internal").default(false), // For internal notes not visible to customer
  respondedBy: integer("responded_by").references(() => users.id), // Engineer who responded
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer system details table - Employee system information (Desktop/Laptop details)
export const customerSystemDetails = pgTable("customer_system_details", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: varchar("customer_name"), // Customer name for reference
  empId: varchar("emp_id"), // Employee ID who submitted
  empName: varchar("emp_name"), // Engineer name who collected data
  systemName: varchar("system_name").notNull(), // Computer name
  systemType: varchar("system_type"), // Desktop or Laptop
  processor: varchar("processor"), // Processor/CPU name
  processorCores: varchar("processor_cores"), // Number of cores
  processorSpeed: varchar("processor_speed"), // Clock speed
  ram: varchar("ram"), // Total RAM
  ramType: varchar("ram_type"), // DDR3, DDR4, DDR5
  ramFrequency: varchar("ram_frequency"), // RAM frequency in MHz
  ramSlots: varchar("ram_slots"), // Used/Total slots
  motherboard: varchar("motherboard"), // Motherboard name
  motherboardManufacturer: varchar("motherboard_manufacturer"),
  hardDisk: varchar("hard_disk"), // HDD details
  hddCapacity: varchar("hdd_capacity"), // HDD capacity
  ssd: varchar("ssd"), // SSD details
  ssdCapacity: varchar("ssd_capacity"), // SSD capacity
  graphicsCard: varchar("graphics_card"), // GPU name
  graphicsMemory: varchar("graphics_memory"), // GPU memory
  operatingSystem: varchar("operating_system"),
  osVersion: varchar("os_version"), // OS version/build
  osArchitecture: varchar("os_architecture"), // 32-bit or 64-bit
  antivirus: varchar("antivirus"),
  msOffice: varchar("ms_office"),
  otherSoftware: text("other_software"),
  macAddress: varchar("mac_address"), // Network MAC address
  ipAddress: varchar("ip_address"), // IP address
  ethernetSpeed: varchar("ethernet_speed"), // Ethernet port speed
  serialNumber: varchar("serial_number"), // System serial number
  biosVersion: varchar("bios_version"), // BIOS version
  department: varchar("department"), // Department name
  configuration: text("configuration"), // Full raw configuration
  collectedAt: timestamp("collected_at").defaultNow(), // When data was collected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const performanceMetrics = pgTable("performance_metrics", {
  userId: integer("user_id").references(() => users.id).notNull(),
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
  ownerId: integer("owner_id").references(() => users.id, { onDelete: "cascade" }),
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
  createdBy: integer("created_by").references(() => users.id, { onDelete: "cascade" }),
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
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  fieldEngineerTasks: many(tasks, { relationName: "fieldEngineerTasks" }),
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
    relationName: "fieldEngineerTasks",
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
  createdByUser: one(users, {
    fields: [taskUpdates.createdBy],
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

// Customer Documents - Documents uploaded for customers by engineers
export const customerDocuments = pgTable("customer_documents", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  documentType: varchar("document_type").notNull(), // challan, bill_copy, rack_photo, company_photo, other
  documentName: varchar("document_name"), // custom name if type is 'other'
  fileName: varchar("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Engineer Documents - Personal documents uploaded by engineers
export const engineerDocuments = pgTable("engineer_documents", {
  id: serial("id").primaryKey(),
  engineerId: integer("engineer_id").notNull().references(() => users.id),
  documentName: varchar("document_name").notNull(),
  fileName: varchar("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for document tables
export const customerDocumentsRelations = relations(customerDocuments, ({ one }) => ({
  customer: one(customers, {
    fields: [customerDocuments.customerId],
    references: [customers.id],
  }),
  uploadedByUser: one(users, {
    fields: [customerDocuments.uploadedBy],
    references: [users.id],
  }),
}));

export const engineerDocumentsRelations = relations(engineerDocuments, ({ one }) => ({
  engineer: one(users, {
    fields: [engineerDocuments.engineerId],
    references: [users.id],
  }),
}));

// Relations for geofencing tables (moved to after table definitions)

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertNetworkTowerSchema = createInsertSchema(networkTowers).omit({
  id: true,
  created_at: true,
  updated_at: true,
  last_test_at: true,
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
}).extend({
  // Allow dueDate to accept both Date objects and ISO date strings, then convert to Date
  dueDate: z.union([
    z.date(),
    z.string().transform((val) => new Date(val))
  ]).optional(),
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

export const insertCustomerDocumentSchema = createInsertSchema(customerDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEngineerDocumentSchema = createInsertSchema(engineerDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertNetworkTower = z.infer<typeof insertNetworkTowerSchema>;
export type NetworkTower = typeof networkTowers.$inferSelect;
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
export type InsertCustomerDocument = z.infer<typeof insertCustomerDocumentSchema>;
export type CustomerDocument = typeof customerDocuments.$inferSelect;
export type InsertEngineerDocument = z.infer<typeof insertEngineerDocumentSchema>;
export type EngineerDocument = typeof engineerDocuments.$inferSelect;

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
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Geofence events (enter/exit tracking)
export const geofenceEvents = pgTable("geofence_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  
  createdBy: integer("created_by").references(() => users.id),
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
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  messageText: text("message_text"), // Database column name
  messageTemplateUsed: varchar("message_template_used"),
  status: varchar("status").notNull().default("pending"), // pending, sent, failed, retrying
  read: boolean("read").notNull().default(false), // Added read field for notification tracking
  responseData: json("response_data"), // API response
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  sentAt: timestamp("sent_at"),
  retryCount: integer("retry_count").default(0),
  nextRetryAt: timestamp("next_retry_at"),
});

// Push notification queue for mobile app polling
export const pushNotificationQueue = pgTable("push_notification_queue", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  body: text("body").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // task_assignment, task_update, task_complete
  taskId: integer("task_id"),
  ticketNumber: varchar("ticket_number", { length: 50 }),
  data: json("data"), // Additional metadata
  isRead: boolean("is_read").notNull().default(false),
  isShown: boolean("is_shown").notNull().default(false), // Shown as system notification
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPushNotificationQueueSchema = createInsertSchema(pushNotificationQueue).omit({
  id: true,
  createdAt: true,
});

export type PushNotificationQueueItem = typeof pushNotificationQueue.$inferSelect;
export type InsertPushNotificationQueueItem = z.infer<typeof insertPushNotificationQueueSchema>;

// Insert schemas for geofencing and tracking
export const insertOfficeLocationSchema = createInsertSchema(officeLocations);
export const insertOfficeLocationSuggestionSchema = createInsertSchema(officeLocationSuggestions);
export const insertUserLocationSchema = createInsertSchema(userLocations);
export const insertGeofenceZoneSchema = createInsertSchema(geofenceZones);
export const insertGeofenceEventSchema = createInsertSchema(geofenceEvents);
export const insertEngineerTrackingHistorySchema = createInsertSchema(engineerTrackingHistory);
export const insertTripTrackingSchema = createInsertSchema(tripTracking);

// Daily reports table for field engineers
export const dailyReports = pgTable("daily_reports", {
  id: serial("id").primaryKey(),
  engineerId: integer("engineer_id").references(() => users.id).notNull(),
  engineerName: varchar("engineer_name").notNull(),
  reportDate: timestamp("report_date").defaultNow().notNull(),
  sitesVisited: integer("sites_visited").notNull().default(0),
  workDone: text("work_done").notNull(),
  sitesCompleted: integer("sites_completed").notNull().default(0),
  completedSitesNames: text("completed_sites_names"),
  incompleteSitesNames: text("incomplete_sites_names"),
  reasonNotDone: text("reason_not_done"),
  hasIssue: boolean("has_issue").default(false),
  issueDetails: text("issue_details"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily reports relations
export const dailyReportsRelations = relations(dailyReports, ({ one }) => ({
  engineer: one(users, {
    fields: [dailyReports.engineerId],
    references: [users.id],
  }),
}));

// Insert schema for daily reports
export const insertDailyReportSchema = createInsertSchema(dailyReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for daily reports
export type DailyReport = typeof dailyReports.$inferSelect;
export type InsertDailyReport = z.infer<typeof insertDailyReportSchema>;

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

// Complaints table for शिकायत पत्रिका (Complaint Management)
export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  complaintId: varchar("complaint_id").notNull().unique(), // Format: WIZ/DDMMYY/001
  engineerId: integer("engineer_id").references(() => users.id).notNull(),
  engineerName: varchar("engineer_name").notNull(),
  engineerEmail: varchar("engineer_email"),
  subject: varchar("subject").notNull(), // Complaint subject
  description: text("description").notNull(), // Complaint description
  category: varchar("category"), // Technical Issue, Equipment Problem, Site Access Issue, etc.
  status: varchar("status").notNull().default('pending'), // pending, in_progress, under_investigation, review, resolved
  statusNote: text("status_note"), // Notes when status is changed
  statusHistory: json("status_history").$type<Array<{
    status: string;
    note: string;
    changedBy: number;
    changedByName: string;
    changedAt: string;
  }>>().default([]),
  isLocked: boolean("is_locked").default(false), // Lock after resolved
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Complaints relations
export const complaintsRelations = relations(complaints, ({ one }) => ({
  engineer: one(users, {
    fields: [complaints.engineerId],
    references: [users.id],
  }),
}));

// Insert schema for complaints
export const insertComplaintSchema = createInsertSchema(complaints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

// Types for complaints
export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;

// CCTV Information table for customer CCTV details
export const cctvInformation = pgTable("cctv_information", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  customerName: varchar("customer_name").notNull(),
  serialNumber: varchar("serial_number"), // S.NO.
  cameraIp: varchar("camera_ip"),
  addedIn: varchar("added_in"), // Added in (e.g., NVR1, DVR1)
  port: varchar("port"),
  httpPort: varchar("http_port"),
  modelNo: varchar("model_no"),
  locationName: varchar("location_name"),
  uplink: varchar("uplink"),
  rackPhoto: text("rack_photo"), // URL/path to rack photo
  nvrCameraPhoto: text("nvr_camera_photo"), // URL/path to NVR/Camera location photo
  deviceSerialNo: varchar("device_serial_no"),
  macAddress: varchar("mac_address"),
  updatedBy: integer("updated_by"), // Customer ID who updated (no FK as customer updates from customer portal)
  updatedByName: varchar("updated_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CCTV Information relations
export const cctvInformationRelations = relations(cctvInformation, ({ one }) => ({
  customer: one(customers, {
    fields: [cctvInformation.customerId],
    references: [customers.id],
  }),
  updatedByUser: one(users, {
    fields: [cctvInformation.updatedBy],
    references: [users.id],
  }),
}));

// Insert schema for CCTV Information
export const insertCctvInformationSchema = createInsertSchema(cctvInformation).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for CCTV Information
export type CctvInformation = typeof cctvInformation.$inferSelect;
export type InsertCctvInformation = z.infer<typeof insertCctvInformationSchema>;