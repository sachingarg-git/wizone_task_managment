// Type definitions for SQL Server database schema
export interface User {
  id: string;
  username?: string;
  password?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImageUrl?: string;
  role: string;
  department?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertUser {
  id: string;
  username?: string;
  password?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImageUrl?: string;
  role?: string;
  department?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Customer {
  id: number;
  customerId: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  serviceType?: string;
  accountManager?: string;
  createdAt: Date;
  modifiedAt?: Date;
  lastServiceDate?: Date;
}

export interface InsertCustomer {
  customerId: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  serviceType?: string;
  accountManager?: string;
}

export interface Task {
  id: number;
  customerId: number;
  title: string;
  description?: string;
  priority: string;
  status: string;
  assignedUserId?: string;
  createdBy: string;
  estimatedHours?: number;
  actualHours?: number;
  issueType?: string;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  dueDate?: Date;
  responseTime?: number;
  attachments?: string;
}

export interface InsertTask {
  customerId: number;
  title: string;
  description?: string;
  priority: string;
  status: string;
  assignedUserId?: string;
  createdBy: string;
  estimatedHours?: number;
  issueType?: string;
  dueDate?: Date;
}

export interface TaskUpdate {
  id: number;
  taskId: number;
  updatedBy: string;
  updateType: string;
  note?: string;
  attachments?: string;
  createdAt: Date;
}

export interface InsertTaskUpdate {
  taskId: number;
  updatedBy: string;
  updateType: string;
  note?: string;
  attachments?: string;
}

export interface PerformanceMetrics {
  id: number;
  userId: string;
  month: number;
  year: number;
  tasksCompleted: number;
  avgResponseTime: number;
  customerSatisfaction: number;
  performanceScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertPerformanceMetrics {
  userId: string;
  month: number;
  year: number;
  tasksCompleted: number;
  avgResponseTime: number;
  customerSatisfaction: number;
  performanceScore: number;
}

export interface Domain {
  id: number;
  domain: string;
  customDomain?: string;
  ssl: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertDomain {
  domain: string;
  customDomain?: string;
  ssl: boolean;
  status: string;
}

// Helper types for relations
export interface TaskWithRelations extends Task {
  customer?: Customer;
  assignedUser?: User;
  createdByUser?: User;
  updates?: TaskUpdateWithUser[];
}

export interface TaskUpdateWithUser extends TaskUpdate {
  updatedByUser?: User;
}

export interface UserWithMetrics extends User {
  performanceMetrics?: PerformanceMetrics[];
}