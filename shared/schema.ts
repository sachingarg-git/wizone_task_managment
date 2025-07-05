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