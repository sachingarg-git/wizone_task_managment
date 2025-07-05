import {
  users,
  customers,
  tasks,
  taskUpdates,
  performanceMetrics,
  domains,
  type User,
  type UpsertUser,
  type Customer,
  type InsertCustomer,
  type Task,
  type InsertTask,
  type TaskWithRelations,
  type TaskUpdate,
  type InsertTaskUpdate,
  type TaskUpdateWithUser,
  type PerformanceMetrics,
  type InsertPerformanceMetrics,
  type UserWithMetrics,
  type Domain,
  type InsertDomain,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, ilike, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<UserWithMetrics[]>;
  updateUserRole(id: string, role: string): Promise<User>;
  updateUser(id: string, userData: Partial<UpsertUser>): Promise<User>;
  getFieldEngineers(): Promise<User[]>;
  getAvailableFieldEngineers(region?: string, skillSet?: string): Promise<User[]>;
  
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
  
  // Field engineer task operations
  assignTaskToFieldEngineer(taskId: number, fieldEngineerId: string, assignedBy: string): Promise<Task>;
  updateFieldTaskStatus(taskId: number, status: string, userId: string, note?: string): Promise<Task>;
  completeFieldTask(taskId: number, userId: string, completionNote: string, files?: string[]): Promise<Task>;
  getFieldTasksByEngineer(fieldEngineerId: string): Promise<TaskWithRelations[]>;
  
  // Task update operations
  createTaskUpdate(update: InsertTaskUpdate): Promise<TaskUpdate>;
  getTaskUpdates(taskId: number): Promise<TaskUpdateWithUser[]>;
  uploadTaskFiles(taskId: number, files: string[]): Promise<void>;
  
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
  
  // Analytics operations
  getAnalyticsOverview(startDate: Date, endDate: Date): Promise<any>;
  getPerformanceAnalytics(startDate: Date, endDate: Date, metric: string): Promise<any>;
  getTrendsAnalytics(startDate: Date, endDate: Date): Promise<any>;
  getEngineerAnalytics(startDate: Date, endDate: Date): Promise<any>;
  getCustomerAnalytics(startDate: Date, endDate: Date): Promise<any>;
  
  // Domain operations
  getAllDomains(): Promise<Domain[]>;
  getDomain(id: number): Promise<Domain | undefined>;
  createDomain(domain: InsertDomain): Promise<Domain>;
  updateDomain(id: number, domain: Partial<InsertDomain>): Promise<Domain>;
  deleteDomain(id: number): Promise<void>;
  getDomainByName(domain: string): Promise<Domain | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getFieldEngineers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(
        eq(users.role, "field_engineer"),
        eq(users.isActive, true)
      ))
      .orderBy(asc(users.firstName));
  }

  async getAvailableFieldEngineers(region?: string, skillSet?: string): Promise<User[]> {
    let whereConditions = and(
      eq(users.role, "field_engineer"),
      eq(users.isActive, true)
    );

    if (region) {
      whereConditions = and(whereConditions, eq(users.department, region));
    }

    return await db
      .select()
      .from(users)
      .where(whereConditions)
      .orderBy(asc(users.firstName));
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
    const result = await db
      .select({
        task: tasks,
        customer: customers,
        assignedUser: users,
      })
      .from(tasks)
      .leftJoin(customers, eq(tasks.customerId, customers.id))
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .orderBy(desc(tasks.createdAt));
    
    return result.map(row => ({
      ...row.task,
      customer: row.customer || undefined,
      assignedUser: row.assignedUser || undefined,
    }));
  }

  async getTask(id: number): Promise<TaskWithRelations | undefined> {
    const [result] = await db
      .select()
      .from(tasks)
      .leftJoin(customers, eq(tasks.customerId, customers.id))
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(eq(tasks.id, id));
    
    if (!result) return undefined;
    
    // Get task updates with user details
    const updates = await this.getTaskUpdates(id);
    
    return {
      ...result.tasks,
      customer: result.customers || undefined,
      assignedUser: result.users || undefined,
      updates,
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
    const result = await db
      .select({
        task: tasks,
        customer: customers,
        assignedUser: users,
      })
      .from(tasks)
      .leftJoin(customers, eq(tasks.customerId, customers.id))
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(eq(tasks.assignedTo, userId))
      .orderBy(desc(tasks.createdAt));
    
    return result.map(row => ({
      ...row.task,
      customer: row.customer || undefined,
      assignedUser: row.assignedUser || undefined,
    }));
  }

  async getTasksByCustomer(customerId: number): Promise<TaskWithRelations[]> {
    const result = await db
      .select({
        task: tasks,
        customer: customers,
        assignedUser: users,
      })
      .from(tasks)
      .leftJoin(customers, eq(tasks.customerId, customers.id))
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(eq(tasks.customerId, customerId))
      .orderBy(desc(tasks.createdAt));
    
    return result.map(row => ({
      ...row.task,
      customer: row.customer || undefined,
      assignedUser: row.assignedUser || undefined,
    }));
  }

  async searchTasks(query: string): Promise<TaskWithRelations[]> {
    const result = await db
      .select({
        task: tasks,
        customer: customers,
        assignedUser: users,
      })
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
    
    return result.map(row => ({
      ...row.task,
      customer: row.customer || undefined,
      assignedUser: row.assignedUser || undefined,
    }));
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

  // Field engineer task operations
  async assignTaskToFieldEngineer(taskId: number, fieldEngineerId: string, assignedBy: string): Promise<Task> {
    // Get field engineer details for better update message
    const fieldEngineer = await this.getUser(fieldEngineerId);
    const fieldEngineerName = fieldEngineer 
      ? `${fieldEngineer.firstName || ''} ${fieldEngineer.lastName || ''}`.trim() || fieldEngineer.email
      : fieldEngineerId;

    const [task] = await db
      .update(tasks)
      .set({
        fieldEngineerId,
        status: "assigned_to_field",
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning();

    // Create task update record with detailed information
    await this.createTaskUpdate({
      taskId,
      updateType: "assignment",
      notes: `Task moved to field team and assigned to ${fieldEngineerName} (${fieldEngineer?.email || fieldEngineerId})`,
      updatedBy: assignedBy,
    });

    return task;
  }

  async updateFieldTaskStatus(taskId: number, status: string, userId: string, note?: string): Promise<Task> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Set specific timestamps based on status
    if (status === "start_task") {
      updateData.fieldStartTime = new Date();
    } else if (status === "waiting_for_customer") {
      updateData.fieldWaitingTime = new Date();
      if (note) updateData.fieldWaitingReason = note;
    }

    const [task] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, taskId))
      .returning();

    // Create task update record
    await this.createTaskUpdate({
      taskId,
      updateType: "status_change",
      notes: note || `Status changed to ${status}`,
      updatedBy: userId,
    });

    return task;
  }

  async completeFieldTask(taskId: number, userId: string, completionNote: string, files?: string[]): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({
        status: "completed",
        completionNote,
        completionTime: new Date(),
        resolvedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning();

    // Create task update record
    await this.createTaskUpdate({
      taskId,
      updateType: "completion",
      notes: completionNote,
      updatedBy: userId,
      attachments: files || [],
    });

    return task;
  }

  async getFieldTasksByEngineer(fieldEngineerId: string): Promise<TaskWithRelations[]> {
    const result = await db
      .select({
        task: tasks,
        customer: customers,
        assignedUser: users,
      })
      .from(tasks)
      .leftJoin(customers, eq(tasks.customerId, customers.id))
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(eq(tasks.fieldEngineerId, fieldEngineerId))
      .orderBy(desc(tasks.createdAt));
    
    return result.map(row => ({
      ...row.task,
      customer: row.customer || undefined,
      assignedUser: row.assignedUser || undefined,
    }));
  }

  // Performance operations
  async getPerformanceMetrics(userId: string, month?: number, year?: number): Promise<PerformanceMetrics[]> {
    let conditions = [eq(performanceMetrics.userId, userId)];
    
    if (month !== undefined && year !== undefined) {
      conditions.push(eq(performanceMetrics.month, month));
      conditions.push(eq(performanceMetrics.year, year));
    }
    
    return await db.select().from(performanceMetrics)
      .where(and(...conditions))
      .orderBy(desc(performanceMetrics.year), desc(performanceMetrics.month));
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

  // Task update operations
  async createTaskUpdate(update: InsertTaskUpdate): Promise<TaskUpdate> {
    const [taskUpdate] = await db
      .insert(taskUpdates)
      .values(update)
      .returning();
    return taskUpdate;
  }

  async getTaskUpdates(taskId: number): Promise<TaskUpdateWithUser[]> {
    const result = await db
      .select({
        update: taskUpdates,
        updatedByUser: users,
      })
      .from(taskUpdates)
      .leftJoin(users, eq(taskUpdates.updatedBy, users.id))
      .where(eq(taskUpdates.taskId, taskId))
      .orderBy(desc(taskUpdates.createdAt));
    
    return result.map(row => ({
      ...row.update,
      updatedByUser: row.updatedByUser || undefined,
    }));
  }

  async uploadTaskFiles(taskId: number, files: string[]): Promise<void> {
    // Create a file upload update record
    await this.createTaskUpdate({
      taskId,
      updatedBy: "system", // Will be replaced with actual user ID in routes
      updateType: "file_uploaded",
      notes: `${files.length} file(s) uploaded`,
      attachments: files,
    });
  }

  // Analytics operations
  async getAnalyticsOverview(startDate: Date, endDate: Date): Promise<any> {
    // Get task statistics
    const [taskStats] = await db
      .select({
        totalTasks: count(),
        completedTasks: sql<number>`count(case when ${tasks.status} = 'completed' then 1 end)`,
        pendingTasks: sql<number>`count(case when ${tasks.status} = 'pending' then 1 end)`,
        inProgressTasks: sql<number>`count(case when ${tasks.status} = 'in_progress' then 1 end)`,
        cancelledTasks: sql<number>`count(case when ${tasks.status} = 'cancelled' then 1 end)`,
      })
      .from(tasks)
      .where(and(
        sql`${tasks.createdAt} >= ${startDate}`,
        sql`${tasks.createdAt} <= ${endDate}`
      ));

    // Get completion rate
    const completionRate = taskStats.totalTasks > 0 
      ? Math.round((taskStats.completedTasks / taskStats.totalTasks) * 100)
      : 0;

    // Get priority distribution
    const priorityStats = await db
      .select({
        priority: tasks.priority,
        count: count(),
      })
      .from(tasks)
      .where(and(
        sql`${tasks.createdAt} >= ${startDate}`,
        sql`${tasks.createdAt} <= ${endDate}`
      ))
      .groupBy(tasks.priority);

    // Get average response time
    const responseTimes = await db
      .select({
        responseTime: sql<number>`extract(epoch from (${tasks.startTime} - ${tasks.createdAt})) / 60`,
      })
      .from(tasks)
      .where(and(
        sql`${tasks.startTime} is not null`,
        sql`${tasks.createdAt} >= ${startDate}`,
        sql`${tasks.createdAt} <= ${endDate}`
      ));

    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum, rt) => sum + rt.responseTime, 0) / responseTimes.length)
      : 0;

    // Get active engineers
    const engineerStats = await db
      .select({
        total: count(sql`distinct ${users.id}`),
        active: sql<number>`count(distinct case when ${tasks.assignedTo} is not null then ${users.id} end)`,
      })
      .from(users)
      .leftJoin(tasks, and(
        eq(tasks.assignedTo, users.id),
        sql`${tasks.createdAt} >= ${startDate}`,
        sql`${tasks.createdAt} <= ${endDate}`
      ));

    return {
      totalTasks: taskStats.totalTasks,
      completedTasks: taskStats.completedTasks,
      completionRate,
      avgResponseTime,
      activeEngineers: engineerStats[0]?.active || 0,
      totalEngineers: engineerStats[0]?.total || 0,
      taskGrowth: 15, // Mock growth data - would calculate vs previous period
      completionGrowth: 8,
      responseImprovement: 12,
      statusDistribution: [
        { name: 'Pending', value: taskStats.pendingTasks },
        { name: 'In Progress', value: taskStats.inProgressTasks },
        { name: 'Completed', value: taskStats.completedTasks },
        { name: 'Cancelled', value: taskStats.cancelledTasks },
      ],
      priorityDistribution: priorityStats.map(p => ({
        name: p.priority,
        value: p.count,
      })),
    };
  }

  async getPerformanceAnalytics(startDate: Date, endDate: Date, metric: string): Promise<any> {
    // Generate daily performance data
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const data = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      let value = 0;
      switch (metric) {
        case 'completion_rate':
          value = 70 + Math.random() * 20; // Mock data
          break;
        case 'response_time':
          value = 120 + Math.random() * 60; // Minutes
          break;
        case 'resolution_time':
          value = 240 + Math.random() * 120; // Minutes
          break;
        case 'customer_satisfaction':
          value = 4.0 + Math.random() * 1.0; // Rating out of 5
          break;
      }

      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value * 100) / 100,
      });
    }

    return data;
  }

  async getTrendsAnalytics(startDate: Date, endDate: Date): Promise<any> {
    // Generate daily trend data for task creation/completion
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const data = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        created: Math.floor(Math.random() * 10) + 5,
        completed: Math.floor(Math.random() * 8) + 3,
        cancelled: Math.floor(Math.random() * 2),
      });
    }

    return data;
  }

  async getEngineerAnalytics(startDate: Date, endDate: Date): Promise<any> {
    const engineerStats = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        completedTasks: sql<number>`count(case when ${tasks.status} = 'completed' then 1 end)`,
        totalTasks: count(tasks.id),
      })
      .from(users)
      .leftJoin(tasks, and(
        eq(tasks.assignedTo, users.id),
        sql`${tasks.createdAt} >= ${startDate}`,
        sql`${tasks.createdAt} <= ${endDate}`
      ))
      .groupBy(users.id, users.firstName, users.lastName, users.email);

    return engineerStats.map(engineer => ({
      ...engineer,
      avgResponseTime: 90 + Math.random() * 60, // Mock data
      performanceScore: 70 + Math.random() * 25,
      isActive: engineer.totalTasks > 0,
    }));
  }

  async getCustomerAnalytics(startDate: Date, endDate: Date): Promise<any> {
    const customerStats = await db
      .select({
        id: customers.id,
        name: customers.name,
        city: customers.city,
        totalTasks: count(tasks.id),
        completedTasks: sql<number>`count(case when ${tasks.status} = 'completed' then 1 end)`,
      })
      .from(customers)
      .leftJoin(tasks, and(
        eq(tasks.customerId, customers.id),
        sql`${tasks.createdAt} >= ${startDate}`,
        sql`${tasks.createdAt} <= ${endDate}`
      ))
      .groupBy(customers.id, customers.name, customers.city)
      .having(sql`count(${tasks.id}) > 0`);

    return customerStats.map(customer => ({
      ...customer,
      avgResolutionTime: 180 + Math.random() * 120, // Mock data
      satisfaction: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
    }));
  }

  // Domain operations
  async getAllDomains(): Promise<Domain[]> {
    return await db.select().from(domains).orderBy(domains.createdAt);
  }

  async getDomain(id: number): Promise<Domain | undefined> {
    const [domain] = await db.select().from(domains).where(eq(domains.id, id));
    return domain || undefined;
  }

  async createDomain(domainData: InsertDomain): Promise<Domain> {
    const [domain] = await db
      .insert(domains)
      .values(domainData)
      .returning();
    return domain;
  }

  async updateDomain(id: number, domainData: Partial<InsertDomain>): Promise<Domain> {
    const [domain] = await db
      .update(domains)
      .set({ ...domainData, updatedAt: new Date() })
      .where(eq(domains.id, id))
      .returning();
    return domain;
  }

  async deleteDomain(id: number): Promise<void> {
    await db.delete(domains).where(eq(domains.id, id));
  }

  async getDomainByName(domain: string): Promise<Domain | undefined> {
    const [domainRecord] = await db.select().from(domains).where(eq(domains.domain, domain));
    return domainRecord || undefined;
  }
}

export const storage = new DatabaseStorage();
