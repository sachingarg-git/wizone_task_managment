import {
  users,
  customers,
  tasks,
  performanceMetrics,
  type User,
  type UpsertUser,
  type Customer,
  type InsertCustomer,
  type Task,
  type InsertTask,
  type TaskWithRelations,
  type PerformanceMetrics,
  type InsertPerformanceMetrics,
  type UserWithMetrics,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, ilike, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<UserWithMetrics[]>;
  updateUserRole(id: string, role: string): Promise<User>;
  
  // Customer operations
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;
  searchCustomers(query: string): Promise<Customer[]>;
  
  // Task operations
  getAllTasks(): Promise<TaskWithRelations[]>;
  getTask(id: number): Promise<TaskWithRelations | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;
  getTasksByUser(userId: string): Promise<TaskWithRelations[]>;
  getTasksByCustomer(customerId: number): Promise<TaskWithRelations[]>;
  searchTasks(query: string): Promise<TaskWithRelations[]>;
  getTaskStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  }>;
  
  // Performance operations
  getPerformanceMetrics(userId: string, month?: number, year?: number): Promise<PerformanceMetrics[]>;
  upsertPerformanceMetrics(metrics: InsertPerformanceMetrics): Promise<PerformanceMetrics>;
  getTopPerformers(limit?: number): Promise<UserWithMetrics[]>;
  calculateUserPerformance(userId: string): Promise<void>;
  
  // Dashboard operations
  getDashboardStats(): Promise<{
    totalTasks: number;
    completedTasks: number;
    avgPerformanceScore: number;
    avgResponseTime: number;
    totalCustomers: number;
    activeUsers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<UserWithMetrics[]> {
    const usersData = await db
      .select()
      .from(users)
      .leftJoin(performanceMetrics, eq(users.id, performanceMetrics.userId))
      .orderBy(asc(users.firstName));
    
    // Group performance metrics by user
    const userMap = new Map<string, UserWithMetrics>();
    
    for (const row of usersData) {
      const user = row.users;
      const metrics = row.performance_metrics;
      
      if (!userMap.has(user.id)) {
        userMap.set(user.id, { ...user, performanceMetrics: [] });
      }
      
      if (metrics) {
        userMap.get(user.id)!.performanceMetrics!.push(metrics);
      }
    }
    
    return Array.from(userMap.values());
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Customer operations
  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    // Generate customer ID
    const customerId = `C${Date.now().toString().slice(-6)}`;
    const [newCustomer] = await db
      .insert(customers)
      .values({ ...customer, customerId })
      .returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(
        or(
          ilike(customers.name, `%${query}%`),
          ilike(customers.contactPerson, `%${query}%`),
          ilike(customers.city, `%${query}%`),
          ilike(customers.customerId, `%${query}%`)
        )
      );
  }

  // Task operations
  async getAllTasks(): Promise<TaskWithRelations[]> {
    return await db
      .select()
      .from(tasks)
      .leftJoin(customers, eq(tasks.customerId, customers.id))
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .orderBy(desc(tasks.createdAt));
  }

  async getTask(id: number): Promise<TaskWithRelations | undefined> {
    const [result] = await db
      .select()
      .from(tasks)
      .leftJoin(customers, eq(tasks.customerId, customers.id))
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(eq(tasks.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.tasks,
      customer: result.customers || undefined,
      assignedUser: result.users || undefined,
    };
  }

  async createTask(task: InsertTask): Promise<Task> {
    // Generate ticket number
    const ticketNumber = `T${Date.now().toString()}`;
    const [newTask] = await db
      .insert(tasks)
      .values({ ...task, ticketNumber })
      .returning();
    return newTask;
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getTasksByUser(userId: string): Promise<TaskWithRelations[]> {
    return await db
      .select()
      .from(tasks)
      .leftJoin(customers, eq(tasks.customerId, customers.id))
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(eq(tasks.assignedTo, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTasksByCustomer(customerId: number): Promise<TaskWithRelations[]> {
    return await db
      .select()
      .from(tasks)
      .leftJoin(customers, eq(tasks.customerId, customers.id))
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(eq(tasks.customerId, customerId))
      .orderBy(desc(tasks.createdAt));
  }

  async searchTasks(query: string): Promise<TaskWithRelations[]> {
    return await db
      .select()
      .from(tasks)
      .leftJoin(customers, eq(tasks.customerId, customers.id))
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(
        or(
          ilike(tasks.ticketNumber, `%${query}%`),
          ilike(tasks.issueType, `%${query}%`),
          ilike(tasks.description, `%${query}%`)
        )
      );
  }

  async getTaskStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  }> {
    const [stats] = await db
      .select({
        total: count(),
        pending: sql<number>`count(case when ${tasks.status} = 'pending' then 1 end)`,
        inProgress: sql<number>`count(case when ${tasks.status} = 'in_progress' then 1 end)`,
        completed: sql<number>`count(case when ${tasks.status} = 'completed' then 1 end)`,
      })
      .from(tasks);

    return {
      total: Number(stats.total),
      pending: Number(stats.pending),
      inProgress: Number(stats.inProgress),
      completed: Number(stats.completed),
    };
  }

  // Performance operations
  async getPerformanceMetrics(userId: string, month?: number, year?: number): Promise<PerformanceMetrics[]> {
    let query = db.select().from(performanceMetrics).where(eq(performanceMetrics.userId, userId));
    
    if (month !== undefined && year !== undefined) {
      query = query.where(
        and(
          eq(performanceMetrics.month, month),
          eq(performanceMetrics.year, year)
        )
      );
    }
    
    return await query.orderBy(desc(performanceMetrics.year), desc(performanceMetrics.month));
  }

  async upsertPerformanceMetrics(metrics: InsertPerformanceMetrics): Promise<PerformanceMetrics> {
    const [result] = await db
      .insert(performanceMetrics)
      .values(metrics)
      .onConflictDoUpdate({
        target: [performanceMetrics.userId, performanceMetrics.month, performanceMetrics.year],
        set: {
          ...metrics,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getTopPerformers(limit = 10): Promise<UserWithMetrics[]> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const topPerformers = await db
      .select()
      .from(users)
      .leftJoin(
        performanceMetrics,
        and(
          eq(users.id, performanceMetrics.userId),
          eq(performanceMetrics.month, currentMonth),
          eq(performanceMetrics.year, currentYear)
        )
      )
      .where(eq(users.isActive, true))
      .orderBy(desc(performanceMetrics.performanceScore))
      .limit(limit);

    return topPerformers.map(row => ({
      ...row.users,
      performanceMetrics: row.performance_metrics ? [row.performance_metrics] : [],
    }));
  }

  async calculateUserPerformance(userId: string): Promise<void> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    // Get user's tasks for the current month
    const userTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.assignedTo, userId),
          sql`EXTRACT(MONTH FROM ${tasks.createdAt}) = ${currentMonth}`,
          sql`EXTRACT(YEAR FROM ${tasks.createdAt}) = ${currentYear}`
        )
      );

    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(task => task.status === 'completed').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Calculate average response time
    const responseTimes = userTasks
      .filter(task => task.startTime && task.createdAt)
      .map(task => {
        const created = new Date(task.createdAt!);
        const started = new Date(task.startTime!);
        return (started.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
      });
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Calculate performance score based on completion rate and response time
    let performanceScore = completionRate;
    if (avgResponseTime > 0 && avgResponseTime <= 2) {
      performanceScore += 10; // Bonus for fast response
    } else if (avgResponseTime > 4) {
      performanceScore -= 5; // Penalty for slow response
    }
    
    performanceScore = Math.min(100, Math.max(0, performanceScore));

    await this.upsertPerformanceMetrics({
      userId,
      month: currentMonth,
      year: currentYear,
      totalTasks,
      completedTasks,
      averageResponseTime: avgResponseTime.toString(),
      performanceScore: performanceScore.toString(),
      customerSatisfactionRating: "4.5", // Default - can be updated later
      firstCallResolutionRate: "75.0", // Default - can be updated later
    });
  }

  async getDashboardStats(): Promise<{
    totalTasks: number;
    completedTasks: number;
    avgPerformanceScore: number;
    avgResponseTime: number;
    totalCustomers: number;
    activeUsers: number;
  }> {
    const [taskStats] = await db
      .select({
        totalTasks: count(),
        completedTasks: sql<number>`count(case when ${tasks.status} = 'completed' then 1 end)`,
      })
      .from(tasks);

    const [customerCount] = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.status, 'active'));

    const [userCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));

    const [performanceStats] = await db
      .select({
        avgScore: sql<number>`AVG(${performanceMetrics.performanceScore})`,
        avgResponseTime: sql<number>`AVG(${performanceMetrics.averageResponseTime})`,
      })
      .from(performanceMetrics);

    return {
      totalTasks: Number(taskStats.totalTasks),
      completedTasks: Number(taskStats.completedTasks),
      avgPerformanceScore: Number(performanceStats.avgScore) || 0,
      avgResponseTime: Number(performanceStats.avgResponseTime) || 0,
      totalCustomers: Number(customerCount.count),
      activeUsers: Number(userCount.count),
    };
  }
}

export const storage = new DatabaseStorage();
