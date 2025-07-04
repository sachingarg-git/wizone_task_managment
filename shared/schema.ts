import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
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
  notes: text("notes"),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assignedTasks: many(tasks, { relationName: "assignedTasks" }),
  fieldTasks: many(tasks, { relationName: "fieldTasks" }),
  createdTasks: many(tasks, { relationName: "createdTasks" }),
  performanceMetrics: many(performanceMetrics),
  ownedDomains: many(domains),
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

// Extended types for API responses
export type TaskWithRelations = Task & {
  customer?: Customer;
  assignedUser?: User;
  createdByUser?: User;
  updates?: TaskUpdateWithUser[];
};

export type TaskUpdateWithUser = TaskUpdate & {
  updatedByUser?: User;
};

export type UserWithMetrics = User & {
  performanceMetrics?: PerformanceMetrics[];
};
