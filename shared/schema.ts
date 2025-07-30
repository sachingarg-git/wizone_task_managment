// Clean MS SQL Schema - All types moved to server/mssql-storage.ts
// This file is kept for compatibility during migration

// Export basic types for existing imports
export type User = {
  id: string;
  username?: string;
  email?: string;
  role: string;
  isActive: boolean;
};

export type Customer = {
  id: number;
  customerId: string;
  name: string;
  status: string;
};

export type Task = {
  id: number;
  taskId: string;
  title: string;
  status: string;
  priority: string;
};

// Placeholder exports to prevent import errors
export const sessions = null;
export const users = null;
export const customers = null;
export const tasks = null;
export const taskUpdates = null;
export const performanceMetrics = null;
export const domains = null;
export const sqlConnections = null;
export const chatRooms = null;
export const chatMessages = null;
export const chatParticipants = null;
export const customerComments = null;
export const customerSystemDetails = null;
export const botConfigurations = null;
export const notificationLogs = null;

// Basic schemas for validation (placeholders during migration)
export const insertUserSchema = null;
export const insertCustomerSchema = null;
export const insertTaskSchema = null;
export const insertTaskUpdateSchema = null;
export const insertPerformanceMetricsSchema = null;
export const insertSqlConnectionSchema = null;
export const insertChatRoomSchema = null;
export const insertChatMessageSchema = null;
export const insertChatParticipantSchema = null;
export const insertBotConfigurationSchema = null;
export const insertNotificationLogSchema = null;