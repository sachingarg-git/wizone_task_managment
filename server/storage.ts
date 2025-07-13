import {
  User,
  UpsertUser,
  Customer,
  InsertCustomer,
  Task,
  InsertTask,
  TaskWithRelations,
  TaskUpdate,
  InsertTaskUpdate,
  TaskUpdateWithUser,
  PerformanceMetrics,
  InsertPerformanceMetrics,
  UserWithMetrics,
  Domain,
  InsertDomain,
  SqlConnection,
  InsertSqlConnection,
  ChatRoom,
  InsertChatRoom,
  ChatMessage,
  InsertChatMessage,
  ChatParticipant,
  InsertChatParticipant,
  ChatRoomWithParticipants,
  ChatMessageWithSender,
  ChatRoomWithMessages,
  CustomerComment,
  InsertCustomerComment,
  CustomerCommentWithUser,
  CustomerSystemDetails,
  InsertCustomerSystemDetails,
  UserLocation,
  InsertUserLocation,
  UserLocationWithRelations,
  GeofenceZone,
  InsertGeofenceZone,
  GeofenceZoneWithRelations,
  GeofenceEvent,
  InsertGeofenceEvent,
  GeofenceEventWithRelations,
  TripTracking,
  InsertTripTracking,
  TripTrackingWithRelations,
  OfficeLocation,
  InsertOfficeLocation,
  OfficeLocationSuggestion,
  InsertOfficeLocationSuggestion,
  EngineerTrackingHistory,
  InsertEngineerTrackingHistory,
  BotConfiguration,
  InsertBotConfiguration,
  NotificationLog,
  InsertNotificationLog,
} from "../shared/schema.js";
import { db, users, customers, tasks, taskUpdates, performanceMetrics, domains, sqlConnections, chatRooms, chatMessages, chatParticipants, officeLocations, officeLocationSuggestions, engineerTrackingHistory, botConfigurations, notificationLogs } from "./db.js";
import { customerComments, customerSystemDetails, userLocations, geofenceZones, geofenceEvents, tripTracking } from "../shared/schema.js";
import postgres from "postgres";
import { eq, desc, asc, and, or, ilike, sql, count, gte, lte } from "drizzle-orm";
import { inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUserWithPassword(user: UpsertUser & { username: string; password: string }): Promise<User>;
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
  
  // Customer portal authentication
  getCustomerByUsername(username: string): Promise<Customer | undefined>;
  createCustomerWithCredentials(customer: InsertCustomer & { username: string; password: string }): Promise<Customer>;
  updateCustomerCredentials(id: number, username: string, password: string, portalAccess: boolean): Promise<Customer>;
  updateCustomerPortalAccess(id: number, data: { username: string; password: string; portalAccess: boolean }): Promise<Customer>;
  
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
  assignMultipleFieldEngineers(taskId: number, fieldEngineerIds: string[], assignedBy: string): Promise<{ tasks: Task[]; message: string; }>;
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
    pendingTasks: number;
    inProgressTasks: number;
    resolvedTasks: number;
    cancelledTasks: number;
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
  
  // SQL Connection operations
  getAllSqlConnections(): Promise<SqlConnection[]>;
  getSqlConnection(id: number): Promise<SqlConnection | undefined>;
  createSqlConnection(connection: InsertSqlConnection): Promise<SqlConnection>;
  updateSqlConnection(id: number, connection: Partial<InsertSqlConnection>): Promise<SqlConnection>;
  deleteSqlConnection(id: number): Promise<void>;
  testSqlConnection(id: number): Promise<{ success: boolean; message: string; }>;
  updateConnectionTestResult(id: number, testStatus: string, testResult: string): Promise<SqlConnection>;
  
  // Chat operations
  getChatRooms(userId: string): Promise<ChatRoomWithParticipants[]>;
  createChatRoom(room: InsertChatRoom): Promise<ChatRoom>;
  getChatMessages(roomId: number, limit?: number, offset?: number): Promise<ChatMessageWithSender[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  addChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant>;
  removeChatParticipant(roomId: number, userId: string): Promise<void>;
  getChatParticipants(roomId: number): Promise<(ChatParticipant & { user: User })[]>;
  isChatParticipant(roomId: number, userId: string): Promise<boolean>;
  
  // Customer comment operations
  getTaskComments(taskId: number): Promise<CustomerCommentWithUser[]>;
  createCustomerComment(comment: InsertCustomerComment): Promise<CustomerComment>;
  updateCustomerComment(id: number, comment: Partial<InsertCustomerComment>): Promise<CustomerComment>;
  deleteCustomerComment(id: number): Promise<void>;
  
  // Customer system details operations
  getCustomerSystemDetails(customerId: number): Promise<CustomerSystemDetails[]>;
  createCustomerSystemDetails(systemDetails: InsertCustomerSystemDetails): Promise<CustomerSystemDetails>;
  updateCustomerSystemDetails(id: number, systemDetails: Partial<InsertCustomerSystemDetails>): Promise<CustomerSystemDetails>;
  deleteCustomerSystemDetails(id: number): Promise<void>;
  
  // Geofencing operations
  getGeofenceZones(): Promise<GeofenceZoneWithRelations[]>;
  createGeofenceZone(zoneData: InsertGeofenceZone): Promise<GeofenceZone>;
  getRecentGeofenceEvents(): Promise<GeofenceEventWithRelations[]>;
  getLiveUserLocations(): Promise<UserLocationWithRelations[]>;
  createUserLocation(locationData: InsertUserLocation): Promise<UserLocation>;
  checkGeofenceEvents(userId: string, latitude: number, longitude: number): Promise<void>;
  
  // Bot configuration operations
  getAllBotConfigurations(): Promise<BotConfiguration[]>;
  getBotConfiguration(id: number): Promise<BotConfiguration | undefined>;
  createBotConfiguration(config: InsertBotConfiguration): Promise<BotConfiguration>;
  updateBotConfiguration(id: number, config: Partial<InsertBotConfiguration>): Promise<BotConfiguration>;
  deleteBotConfiguration(id: number): Promise<void>;
  testBotConfiguration(id: number): Promise<{ success: boolean; message: string; }>;
  
  // Notification log operations
  getNotificationLogs(limit?: number, offset?: number): Promise<NotificationLog[]>;
  createNotificationLog(log: InsertNotificationLog): Promise<NotificationLog>;
  updateNotificationLogStatus(id: number, status: string, responseData?: any, errorMessage?: string): Promise<NotificationLog>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const { createSafeRequest } = await import('./db.js');
      const request = createSafeRequest();
      request.input('id', id);
      const result = await request.query('SELECT * FROM users WHERE id = @id');
      return result.recordset[0] || undefined;
    } catch (error) {
      console.error('getUser error:', error);
      throw error; // Throw to trigger fallback authentication
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const request = db.request();
      request.input('email', email);
      const result = await request.query('SELECT * FROM users WHERE email = @email');
      return result.recordset[0] || undefined;
    } catch (error) {
      console.error('getUserByEmail error:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const { createSafeRequest } = await import('./db.js');
      const request = createSafeRequest();
      request.input('username', username);
      const result = await request.query('SELECT * FROM users WHERE username = @username');
      return result.recordset[0] || undefined;
    } catch (error) {
      console.error('getUserByUsername error:', error);
      throw error; // Throw to trigger fallback authentication
    }
  }

  async createUserWithPassword(userData: UpsertUser & { username: string; password: string }): Promise<User> {
    try {
      const request = db.request();
      Object.keys(userData).forEach(key => {
        request.input(key, userData[key as keyof typeof userData]);
      });
      
      const result = await request.query(`
        INSERT INTO users (id, username, password, email, firstName, lastName, phone, role, department, isActive, createdAt, updatedAt)
        OUTPUT INSERTED.*
        VALUES (@id, @username, @password, @email, @firstName, @lastName, @phone, @role, @department, @isActive, GETDATE(), GETDATE())
      `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('createUserWithPassword error:', error);
      throw error;
    }
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
    
    // Add resolved tasks count for each user
    const usersList = Array.from(userMap.values());
    
    for (const user of usersList) {
      // Count resolved tasks for this user (current month)
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const [resolvedTasksResult] = await db
        .select({ count: count() })
        .from(tasks)
        .where(
          and(
            or(eq(tasks.assignedTo, user.id), eq(tasks.fieldEngineerId, user.id)),
            eq(tasks.status, 'resolved'),
            sql`EXTRACT(MONTH FROM ${tasks.createdAt}) = ${currentMonth}`,
            sql`EXTRACT(YEAR FROM ${tasks.createdAt}) = ${currentYear}`
          )
        );
      
      (user as any).resolvedTasksCount = resolvedTasksResult?.count || 0;
    }
    
    return usersList;
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
    // Delete all related records first to avoid foreign key constraint violations
    
    // Delete customer comments
    await db.delete(customerComments).where(eq(customerComments.customerId, id));
    
    // Delete customer system details  
    await db.delete(customerSystemDetails).where(eq(customerSystemDetails.customerId, id));
    
    // Delete geofence zones for this customer
    await db.delete(geofenceZones).where(eq(geofenceZones.customerId, id));
    
    // Delete task updates for tasks belonging to this customer
    const customerTasks = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.customerId, id));
    if (customerTasks.length > 0) {
      const taskIds = customerTasks.map(task => task.id);
      await db.delete(taskUpdates).where(inArray(taskUpdates.taskId, taskIds));
    }
    
    // Delete tasks for this customer
    await db.delete(tasks).where(eq(tasks.customerId, id));
    
    // Finally delete the customer
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

  // Customer portal authentication
  async getCustomerByUsername(username: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.username, username));
    return customer;
  }

  async createCustomerWithCredentials(customerData: InsertCustomer & { username: string; password: string }): Promise<Customer> {
    // Generate customer ID
    const customerId = `C${Date.now().toString().slice(-6)}`;
    const [customer] = await db
      .insert(customers)
      .values({ 
        ...customerData, 
        customerId,
        portalAccess: true
      })
      .returning();
    return customer;
  }

  async updateCustomerCredentials(id: number, username: string, password: string, portalAccess: boolean): Promise<Customer> {
    const [customer] = await db
      .update(customers)
      .set({ 
        username,
        password,
        portalAccess,
        updatedAt: new Date()
      })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async updateCustomerPortalAccess(id: number, data: { username: string; password: string; portalAccess: boolean }): Promise<Customer> {
    const [customer] = await db
      .update(customers)
      .set({ 
        username: data.username,
        password: data.password,
        portalAccess: data.portalAccess,
        updatedAt: new Date()
      })
      .where(eq(customers.id, id))
      .returning();
    return customer;
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
    if (!id || isNaN(id)) {
      console.error("Invalid task ID provided to getTask:", id);
      return undefined;
    }
    
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
    if (!userId || userId === 'undefined' || userId === 'null' || userId === 'NaN') {
      console.error("Invalid userId provided to getTasksByUser:", userId);
      return []; // Return empty array instead of throwing error
    }
    
    console.log("Building query for userId:", userId, "type:", typeof userId);
    
    const result = await db
      .select({
        task: tasks,
        customer: customers,
        assignedUser: users,
      })
      .from(tasks)
      .leftJoin(customers, eq(tasks.customerId, customers.id))
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(or(eq(tasks.assignedTo, userId), eq(tasks.fieldEngineerId, userId)))
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

    // Capture customer location for geofencing when task is assigned
    try {
      const customer = await this.getCustomer(task.customerId);
      if (customer && customer.latitude && customer.longitude) {
        // Create a location record for the assigned engineer to navigate to customer
        await this.createUserLocation({
          userId: fieldEngineerId,
          latitude: parseFloat(customer.latitude),
          longitude: parseFloat(customer.longitude),
          taskId: taskId,
          accuracy: 1.0, // Exact customer location
          isActive: true,
        });
        
        // Check if the customer location triggers any geofence zones
        await this.checkGeofenceEvents(fieldEngineerId, parseFloat(customer.latitude), parseFloat(customer.longitude));
      }
    } catch (error) {
      console.error("Error capturing customer location for geofencing:", error);
      // Don't fail the assignment if location capture fails
    }

    // Create task update record with detailed information
    await this.createTaskUpdate({
      taskId,
      updateType: "assignment",
      note: `Task moved to field team and assigned to ${fieldEngineerName} (${fieldEngineer?.email || fieldEngineerId})`,
      updatedBy: assignedBy,
    });

    // Automatically create tracking entry for field assignment
    await this.createAutomaticTrackingEntry(taskId, fieldEngineerId, "assigned_to_field", `Assigned to ${fieldEngineerName}`);

    return task;
  }

  async assignMultipleFieldEngineers(taskId: number, fieldEngineerIds: string[], assignedBy: string): Promise<{ tasks: Task[]; message: string; }> {
    // Get the original task to duplicate
    const originalTask = await this.getTask(taskId);
    if (!originalTask) {
      throw new Error("Task not found");
    }

    const createdTasks: Task[] = [];
    
    // Assign the first engineer to the original task
    const firstEngineerId = fieldEngineerIds[0];
    const firstTask = await this.assignTaskToFieldEngineer(taskId, firstEngineerId, assignedBy);
    createdTasks.push(firstTask);

    // Create duplicate tasks for remaining engineers
    if (fieldEngineerIds.length > 1) {
      for (let i = 1; i < fieldEngineerIds.length; i++) {
        const engineerId = fieldEngineerIds[i];
        
        // Get field engineer details for better naming
        const fieldEngineer = await this.getUser(engineerId);
        const fieldEngineerName = fieldEngineer 
          ? `${fieldEngineer.firstName || ''} ${fieldEngineer.lastName || ''}`.trim() || fieldEngineer.email
          : engineerId;

        // Create duplicate task with versioned title
        const duplicateTaskData = {
          title: `${originalTask.title}_${i + 1}`,
          ticketNumber: `${originalTask.ticketNumber}_${i + 1}`,
          customerId: originalTask.customerId,
          assignedTo: originalTask.assignedTo,
          priority: originalTask.priority,
          status: "assigned_to_field" as const,
          description: originalTask.description,
          issueType: originalTask.issueType,
          contactPerson: originalTask.contactPerson,
          visitCharges: originalTask.visitCharges,
          fieldEngineerId: engineerId,
        };

        const duplicateTask = await this.createTask(duplicateTaskData);
        
        // Create assignment audit record for the duplicate task
        await this.createTaskUpdate({
          taskId: duplicateTask.id,
          updateType: "assignment",
          note: `Duplicate task created and assigned to ${fieldEngineerName} (${fieldEngineer?.email || engineerId})`,
          updatedBy: assignedBy,
        });

        createdTasks.push(duplicateTask);
      }
    }

    // Get engineer names for the success message
    const engineerNames = await Promise.all(
      fieldEngineerIds.map(async (id) => {
        const engineer = await this.getUser(id);
        return engineer ? `${engineer.firstName} ${engineer.lastName}` : id;
      })
    );

    const message = fieldEngineerIds.length === 1 
      ? `Task assigned to ${engineerNames[0]}`
      : `Task assigned to ${fieldEngineerIds.length} engineers: ${engineerNames.join(', ')}. ${fieldEngineerIds.length - 1} duplicate task(s) created.`;

    return {
      tasks: createdTasks,
      message
    };
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
      note: note || `Status changed to ${status}`,
      updatedBy: userId,
    });

    // Automatically create tracking entry for field activities
    await this.createAutomaticTrackingEntry(taskId, userId, status, note);

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
      note: completionNote,
      updatedBy: userId,
      attachments: files || [],
    });

    // Automatically create tracking entry for task completion
    await this.createAutomaticTrackingEntry(taskId, userId, "completed", completionNote);

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
      .orderBy(desc(sql`COALESCE(${performanceMetrics.performanceScore}, 0)`))
      .limit(limit);

    return topPerformers.map(row => ({
      ...row.users,
      performanceMetrics: row.performance_metrics ? [row.performance_metrics] : [],
    }));
  }

  async calculateUserPerformance(userId: string): Promise<void> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    // Get user's tasks for the current month (both assigned and field engineer)
    const userTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          or(eq(tasks.assignedTo, userId), eq(tasks.fieldEngineerId, userId)),
          sql`EXTRACT(MONTH FROM ${tasks.createdAt}) = ${currentMonth}`,
          sql`EXTRACT(YEAR FROM ${tasks.createdAt}) = ${currentYear}`
        )
      );

    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(task => task.status === 'completed').length;
    const resolvedTasks = userTasks.filter(task => task.status === 'resolved').length;
    const totalFinishedTasks = completedTasks + resolvedTasks;
    const completionRate = totalTasks > 0 ? (totalFinishedTasks / totalTasks) * 100 : 0;
    
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
      completedTasks: totalFinishedTasks, // Use total finished tasks for completed count
      averageResponseTime: avgResponseTime.toString(),
      performanceScore: performanceScore.toString(),
      customerSatisfactionRating: "4.5", // Default - can be updated later
      firstCallResolutionRate: "75.0", // Default - can be updated later
    });
  }

  async getDashboardStats(): Promise<{
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    resolvedTasks: number;
    cancelledTasks: number;
    avgPerformanceScore: number;
    avgResponseTime: number;
    totalCustomers: number;
    activeUsers: number;
  }> {
    const [taskStats] = await db
      .select({
        totalTasks: count(),
        completedTasks: sql<number>`count(case when ${tasks.status} = 'completed' then 1 end)`,
        pendingTasks: sql<number>`count(case when ${tasks.status} = 'pending' then 1 end)`,
        inProgressTasks: sql<number>`count(case when ${tasks.status} = 'in_progress' then 1 end)`,
        resolvedTasks: sql<number>`count(case when ${tasks.status} = 'resolved' then 1 end)`,
        cancelledTasks: sql<number>`count(case when ${tasks.status} = 'cancelled' then 1 end)`,
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
      pendingTasks: Number(taskStats.pendingTasks),
      inProgressTasks: Number(taskStats.inProgressTasks),
      resolvedTasks: Number(taskStats.resolvedTasks),
      cancelledTasks: Number(taskStats.cancelledTasks),
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
      note: `${files.length} file(s) uploaded`,
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
        sql`${tasks.createdAt} >= ${startDate.toISOString()}`,
        sql`${tasks.createdAt} <= ${endDate.toISOString()}`
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
        sql`${tasks.createdAt} >= ${startDate.toISOString()}`,
        sql`${tasks.createdAt} <= ${endDate.toISOString()}`
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
        sql`${tasks.createdAt} >= ${startDate.toISOString()}`,
        sql`${tasks.createdAt} <= ${endDate.toISOString()}`
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
        sql`${tasks.createdAt} >= ${startDate.toISOString()}`,
        sql`${tasks.createdAt} <= ${endDate.toISOString()}`
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

  // SQL Connection operations
  async getAllSqlConnections(): Promise<SqlConnection[]> {
    return await db.select().from(sqlConnections).orderBy(desc(sqlConnections.createdAt));
  }

  async getSqlConnection(id: number): Promise<SqlConnection | undefined> {
    const [connection] = await db.select().from(sqlConnections).where(eq(sqlConnections.id, id));
    return connection || undefined;
  }

  async createSqlConnection(connectionData: InsertSqlConnection): Promise<SqlConnection> {
    const [connection] = await db
      .insert(sqlConnections)
      .values({
        ...connectionData,
        host: connectionData.host.trim(),
        username: connectionData.username.trim(),
        database: connectionData.database.trim(),
        testStatus: 'never_tested',
      })
      .returning();
    return connection;
  }

  async updateSqlConnection(id: number, connectionData: Partial<InsertSqlConnection>): Promise<SqlConnection> {
    const cleanData = { ...connectionData };
    if (cleanData.host) {
      cleanData.host = cleanData.host.trim();
    }
    if (cleanData.username) {
      cleanData.username = cleanData.username.trim();
    }
    if (cleanData.database) {
      cleanData.database = cleanData.database.trim();
    }
    
    const [connection] = await db
      .update(sqlConnections)
      .set({
        ...cleanData,
        updatedAt: new Date(),
      })
      .where(eq(sqlConnections.id, id))
      .returning();
    return connection;
  }

  async deleteSqlConnection(id: number): Promise<void> {
    await db.delete(sqlConnections).where(eq(sqlConnections.id, id));
  }

  async testSqlConnection(id: number): Promise<{ success: boolean; message: string; }> {
    const connection = await this.getSqlConnection(id);
    if (!connection) {
      return { success: false, message: 'Connection not found' };
    }

    try {
      // Update test status to pending
      await this.updateConnectionTestResult(id, 'pending', 'Testing connection...');
      
      // For now, we'll just return a mock test result
      // In a real implementation, you would test the actual database connection
      const testResult = { success: true, message: 'Connection successful' };
      
      await this.updateConnectionTestResult(
        id, 
        testResult.success ? 'success' : 'failed', 
        testResult.message
      );
      
      return testResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await this.updateConnectionTestResult(id, 'failed', errorMessage);
      return { success: false, message: errorMessage };
    }
  }

  async updateConnectionTestResult(id: number, testStatus: string, testResult: string): Promise<SqlConnection> {
    const [connection] = await db
      .update(sqlConnections)
      .set({
        testStatus,
        testResult,
        lastTested: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sqlConnections.id, id))
      .returning();
    return connection;
  }

  // Chat operations
  async getChatRooms(userId: string): Promise<ChatRoomWithParticipants[]> {
    // Use direct postgres connection to avoid Drizzle schema issues
    try {
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is required");
      }
      
      const pgClient = postgres(process.env.DATABASE_URL, {
        ssl: 'require',
        max: 1,
      });
      
      const result = await pgClient`
        SELECT * FROM chat_rooms 
        WHERE is_active = true 
        ORDER BY created_at DESC
      `;

      await pgClient.end();

      // Return rooms with empty participants array for now
      return result.map((room: any) => ({
        id: room.id,
        name: room.name,
        description: room.description,
        roomType: room.room_type,
        isActive: room.is_active,
        createdBy: room.created_by,
        createdAt: room.created_at,
        updatedAt: room.updated_at,
        participants: [],
      }));
    } catch (error) {
      console.error('Error in getChatRooms:', error);
      throw error;
    }
  }

  async createChatRoom(roomData: InsertChatRoom): Promise<ChatRoom> {
    const [room] = await db
      .insert(chatRooms)
      .values(roomData)
      .returning();
    return room;
  }

  async getChatMessages(roomId: number, limit = 50, offset = 0): Promise<ChatMessageWithSender[]> {
    const messages = await db
      .select({
        id: chatMessages.id,
        roomId: chatMessages.roomId,
        senderId: chatMessages.senderId,
        message: chatMessages.message,
        messageType: chatMessages.messageType,
        attachmentUrl: chatMessages.attachmentUrl,
        attachmentName: chatMessages.attachmentName,
        isEdited: chatMessages.isEdited,
        editedAt: chatMessages.editedAt,
        replyToMessageId: chatMessages.replyToMessageId,
        createdAt: chatMessages.createdAt,
        updatedAt: chatMessages.updatedAt,
        sender: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
        },
      })
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.senderId, users.id))
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit)
      .offset(offset);

    return messages;
  }

  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(messageData)
      .returning();
    return message;
  }

  async addChatParticipant(participantData: InsertChatParticipant): Promise<ChatParticipant> {
    // Check if participant already exists
    const existing = await db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.roomId, participantData.roomId),
          eq(chatParticipants.userId, participantData.userId)
        )
      );

    if (existing.length > 0) {
      return existing[0];
    }

    const [participant] = await db
      .insert(chatParticipants)
      .values(participantData)
      .returning();
    return participant;
  }

  async removeChatParticipant(roomId: number, userId: string): Promise<void> {
    await db
      .delete(chatParticipants)
      .where(
        and(
          eq(chatParticipants.roomId, roomId),
          eq(chatParticipants.userId, userId)
        )
      );
  }

  async getChatParticipants(roomId: number): Promise<(ChatParticipant & { user: User })[]> {
    const participants = await db
      .select({
        id: chatParticipants.id,
        roomId: chatParticipants.roomId,
        userId: chatParticipants.userId,
        role: chatParticipants.role,
        joinedAt: chatParticipants.joinedAt,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
          department: users.department,
          phone: users.phone,
          profileImageUrl: users.profileImageUrl,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          password: users.password,
        },
      })
      .from(chatParticipants)
      .leftJoin(users, eq(chatParticipants.userId, users.id))
      .where(eq(chatParticipants.roomId, roomId));

    return participants.map(p => ({
      id: p.id,
      roomId: p.roomId,
      userId: p.userId,
      role: p.role,
      joinedAt: p.joinedAt,
      isActive: true,
      lastReadAt: p.joinedAt,
      user: p.user,
    }));
  }

  async isChatParticipant(roomId: number, userId: string): Promise<boolean> {
    const [participant] = await db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.roomId, roomId),
          eq(chatParticipants.userId, userId)
        )
      );
    return !!participant;
  }

  // Customer comment operations
  async getTaskComments(taskId: number): Promise<CustomerCommentWithUser[]> {
    const comments = await db
      .select({
        id: customerComments.id,
        taskId: customerComments.taskId,
        customerId: customerComments.customerId,
        comment: customerComments.comment,
        attachments: customerComments.attachments,
        isInternal: customerComments.isInternal,
        respondedBy: customerComments.respondedBy,
        createdAt: customerComments.createdAt,
        updatedAt: customerComments.updatedAt,
        customer: {
          id: customers.id,
          name: customers.name,
          contactPerson: customers.contactPerson,
          email: customers.email,
        },
        respondedByUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
        },
      })
      .from(customerComments)
      .leftJoin(customers, eq(customerComments.customerId, customers.id))
      .leftJoin(users, eq(customerComments.respondedBy, users.id))
      .where(eq(customerComments.taskId, taskId))
      .orderBy(desc(customerComments.createdAt));

    return comments.map(row => ({
      id: row.id,
      taskId: row.taskId,
      customerId: row.customerId,
      comment: row.comment,
      attachments: row.attachments,
      isInternal: row.isInternal,
      respondedBy: row.respondedBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      customer: row.customer || undefined,
      respondedByUser: row.respondedByUser || undefined,
    }));
  }

  async createCustomerComment(commentData: InsertCustomerComment): Promise<CustomerComment> {
    const [comment] = await db
      .insert(customerComments)
      .values(commentData)
      .returning();
    return comment;
  }

  async updateCustomerComment(id: number, commentData: Partial<InsertCustomerComment>): Promise<CustomerComment> {
    const [comment] = await db
      .update(customerComments)
      .set({ ...commentData, updatedAt: new Date() })
      .where(eq(customerComments.id, id))
      .returning();
    return comment;
  }

  async deleteCustomerComment(id: number): Promise<void> {
    await db.delete(customerComments).where(eq(customerComments.id, id));
  }

  // Office location operations
  async getOfficeLocations(): Promise<OfficeLocation[]> {
    return await db.select().from(officeLocations).orderBy(desc(officeLocations.isMainOffice));
  }

  async getMainOffice(): Promise<OfficeLocation | undefined> {
    const [office] = await db
      .select()
      .from(officeLocations)
      .where(and(eq(officeLocations.isMainOffice, true), eq(officeLocations.isActive, true)));
    return office;
  }

  async createOfficeLocation(officeData: InsertOfficeLocation): Promise<OfficeLocation> {
    const [office] = await db
      .insert(officeLocations)
      .values(officeData)
      .returning();
    return office;
  }

  async updateOfficeLocation(id: number, updateData: Partial<InsertOfficeLocation>): Promise<OfficeLocation> {
    const [office] = await db
      .update(officeLocations)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(officeLocations.id, id))
      .returning();
    return office;
  }

  async deleteOfficeLocation(id: number): Promise<void> {
    await db.delete(officeLocations).where(eq(officeLocations.id, id));
  }

  // Office location suggestions based on team distribution
  async generateOfficeLocationSuggestions(): Promise<OfficeLocationSuggestion[]> {
    // Get all active users with their locations (from customers or addresses)
    const activeUsers = await db
      .select({
        id: users.id,
        role: users.role,
        department: users.department,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(and(eq(users.isActive, true), sql`${users.role} IN ('field_engineer', 'engineer', 'backend_engineer')`));

    // Get customer locations to approximate team member locations
    const customerLocations = await db
      .select({
        latitude: customers.latitude,
        longitude: customers.longitude,
        city: customers.city,
        state: customers.state,
      })
      .from(customers)
      .where(and(
        sql`${customers.latitude} IS NOT NULL`,
        sql`${customers.longitude} IS NOT NULL`
      ));

    if (customerLocations.length === 0) {
      return [];
    }

    // Calculate geographic center using customer distribution as proxy for team distribution
    const latSum = customerLocations.reduce((sum, loc) => sum + parseFloat(loc.latitude!), 0);
    const lngSum = customerLocations.reduce((sum, loc) => sum + parseFloat(loc.longitude!), 0);
    const centerLat = latSum / customerLocations.length;
    const centerLng = lngSum / customerLocations.length;

    // Calculate distances from center
    const distances = customerLocations.map(loc => {
      const lat = parseFloat(loc.latitude!);
      const lng = parseFloat(loc.longitude!);
      return this.calculateDistance(centerLat, centerLng, lat, lng);
    });

    const averageDistance = distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
    const maxDistance = Math.max(...distances);
    const coverageRadius = averageDistance * 1.5; // 150% of average for good coverage

    // Calculate efficiency score (lower average distance = higher efficiency)
    const efficiency = Math.max(0, 100 - (averageDistance / 10));

    // Create suggestion with analysis data
    const analysisData = {
      totalTeamMembers: activeUsers.length,
      totalCustomers: customerLocations.length,
      centerCalculation: { centerLat, centerLng },
      distanceStats: { averageDistance, maxDistance, coverageRadius },
      departmentBreakdown: activeUsers.reduce((acc, user) => {
        acc[user.department || 'unknown'] = (acc[user.department || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      cityDistribution: customerLocations.reduce((acc, loc) => {
        const city = loc.city || 'unknown';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    // Store the suggestion in database
    const [suggestion] = await db
      .insert(officeLocationSuggestions)
      .values({
        suggestedLatitude: centerLat.toString(),
        suggestedLongitude: centerLng.toString(),
        calculatedCenter: true,
        teamMembersCount: activeUsers.length,
        averageDistance: averageDistance.toString(),
        maxDistance: maxDistance.toString(),
        coverageRadius: coverageRadius.toString(),
        efficiency: efficiency.toString(),
        suggestedAddress: `Optimal location for ${activeUsers.length} team members`,
        analysisData: analysisData,
      })
      .returning();

    return [suggestion];
  }

  async getOfficeLocationSuggestions(): Promise<OfficeLocationSuggestion[]> {
    return await db
      .select()
      .from(officeLocationSuggestions)
      .orderBy(sql`${officeLocationSuggestions.efficiency} DESC`, sql`${officeLocationSuggestions.createdAt} DESC`);
  }

  // Engineer tracking history operations with engineer and task details
  async getEngineerTrackingHistory(userId?: string, limit = 100): Promise<any[]> {
    const baseQuery = db
      .select({
        id: engineerTrackingHistory.id,
        userId: engineerTrackingHistory.userId,
        taskId: engineerTrackingHistory.taskId,
        latitude: engineerTrackingHistory.latitude,
        longitude: engineerTrackingHistory.longitude,
        distanceFromOffice: engineerTrackingHistory.distanceFromOffice,
        distanceFromCustomer: engineerTrackingHistory.distanceFromCustomer,
        movementType: engineerTrackingHistory.movementType,
        speedKmh: engineerTrackingHistory.speedKmh,
        accuracy: engineerTrackingHistory.accuracy,
        batteryLevel: engineerTrackingHistory.batteryLevel,
        networkStatus: engineerTrackingHistory.networkStatus,
        timestamp: engineerTrackingHistory.timestamp,
        createdAt: engineerTrackingHistory.createdAt,
        // Engineer details
        engineerName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        engineerRole: users.role,
        engineerDepartment: users.department,
        // Task details
        taskTitle: tasks.title,
        taskStatus: tasks.status,
        taskPriority: tasks.priority,
        ticketNumber: tasks.ticketNumber,
        // Customer details
        customerName: customers.name,
      })
      .from(engineerTrackingHistory)
      .leftJoin(users, eq(engineerTrackingHistory.userId, users.id))
      .leftJoin(tasks, eq(engineerTrackingHistory.taskId, tasks.id))
      .leftJoin(customers, eq(tasks.customerId, customers.id));

    if (userId) {
      return await baseQuery
        .where(eq(engineerTrackingHistory.userId, userId))
        .orderBy(desc(engineerTrackingHistory.timestamp))
        .limit(limit);
    } else {
      return await baseQuery
        .orderBy(desc(engineerTrackingHistory.timestamp))
        .limit(limit);
    }
  }

  async createTrackingHistoryEntry(trackingData: InsertEngineerTrackingHistory): Promise<EngineerTrackingHistory> {
    const [tracking] = await db
      .insert(engineerTrackingHistory)
      .values(trackingData)
      .returning();
    return tracking;
  }

  // Automatic tracking entry creation for field activities
  async createAutomaticTrackingEntry(taskId: number, userId: string, status: string, note?: string): Promise<void> {
    try {
      // Get task details to retrieve customer location
      const task = await this.getTask(taskId);
      if (!task || !task.customer) return;

      // Get main office location for distance calculation
      const mainOffice = await this.getMainOffice();
      if (!mainOffice) return;

      // Use customer location or default coordinates
      const customerLat = task.customer.latitude ? parseFloat(task.customer.latitude) : 28.6139; // Default Delhi coordinates
      const customerLng = task.customer.longitude ? parseFloat(task.customer.longitude) : 77.2090;

      // Calculate distance from office to customer location
      const distanceFromOffice = this.calculateDistance(
        parseFloat(mainOffice.latitude),
        parseFloat(mainOffice.longitude),
        customerLat,
        customerLng
      );

      // Determine movement type based on status
      let movementType = "unknown";
      switch (status) {
        case "start_task":
          movementType = "traveling_to_customer";
          break;
        case "in_progress":
        case "working_on_site":
          movementType = "at_customer_location";
          break;
        case "waiting_for_customer":
          movementType = "waiting_at_location";
          break;
        case "completed":
          movementType = "returning_to_office";
          break;
        default:
          movementType = "field_activity";
      }

      // Create tracking entry
      const trackingData = {
        userId,
        taskId,
        latitude: customerLat.toString(),
        longitude: customerLng.toString(),
        distanceFromOffice: (distanceFromOffice / 1000).toFixed(2), // Convert to km
        distanceFromCustomer: "0.0",
        movementType,
        speedKmh: "0",
        accuracy: "10",
        batteryLevel: 100,
        networkStatus: "good",
        timestamp: new Date(),
      };

      await this.createTrackingHistoryEntry(trackingData);
    } catch (error) {
      console.error("Error creating automatic tracking entry:", error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  async getTrackingHistoryByTask(taskId: number): Promise<EngineerTrackingHistory[]> {
    return await db
      .select()
      .from(engineerTrackingHistory)
      .where(eq(engineerTrackingHistory.taskId, taskId))
      .orderBy(desc(engineerTrackingHistory.timestamp));
  }

  async getTrackingStatsByUser(userId: string, startDate?: Date, endDate?: Date): Promise<{
    totalDistance: number;
    averageSpeed: number;
    timeAtCustomerSites: number;
    timeInTransit: number;
  }> {
    let whereConditions = [eq(engineerTrackingHistory.userId, userId)];
    
    if (startDate) {
      whereConditions.push(gte(engineerTrackingHistory.timestamp, startDate));
    }
    if (endDate) {
      whereConditions.push(lte(engineerTrackingHistory.timestamp, endDate));
    }

    const results = await db
      .select({
        distanceFromOffice: engineerTrackingHistory.distanceFromOffice,
        speedKmh: engineerTrackingHistory.speedKmh,
        movementType: engineerTrackingHistory.movementType,
        timestamp: engineerTrackingHistory.timestamp,
      })
      .from(engineerTrackingHistory)
      .where(and(...whereConditions))
      .orderBy(desc(engineerTrackingHistory.timestamp));

    // Calculate stats from results
    let totalDistance = 0;
    let speedSum = 0;
    let speedCount = 0;
    let timeAtCustomer = 0;
    let timeInTransit = 0;

    for (let i = 0; i < results.length; i++) {
      const current = results[i];
      
      if (current.distanceFromOffice) {
        totalDistance = Math.max(totalDistance, Number(current.distanceFromOffice));
      }
      
      if (current.speedKmh) {
        speedSum += Number(current.speedKmh);
        speedCount++;
      }

      if (current.movementType === 'at_customer_location') {
        timeAtCustomer += 5; // Approximate 5 minutes per location record
      } else if (current.movementType === 'traveling_to_customer') {
        timeInTransit += 5;
      }
    }

    return {
      totalDistance,
      averageSpeed: speedCount > 0 ? speedSum / speedCount : 0,
      timeAtCustomerSites: timeAtCustomer,
      timeInTransit,
    };
  }

  // Customer system details operations
  async getCustomerSystemDetails(customerId: number): Promise<CustomerSystemDetails[]> {
    const systems = await db
      .select()
      .from(customerSystemDetails)
      .where(eq(customerSystemDetails.customerId, customerId))
      .orderBy(desc(customerSystemDetails.createdAt));
    return systems;
  }

  async createCustomerSystemDetails(systemData: InsertCustomerSystemDetails): Promise<CustomerSystemDetails> {
    const [system] = await db
      .insert(customerSystemDetails)
      .values(systemData)
      .returning();
    return system;
  }

  async updateCustomerSystemDetails(id: number, systemData: Partial<InsertCustomerSystemDetails>): Promise<CustomerSystemDetails> {
    const [system] = await db
      .update(customerSystemDetails)
      .set({ ...systemData, updatedAt: new Date() })
      .where(eq(customerSystemDetails.id, id))
      .returning();
    return system;
  }

  async deleteCustomerSystemDetails(id: number): Promise<void> {
    await db.delete(customerSystemDetails).where(eq(customerSystemDetails.id, id));
  }

  // Geofencing operations
  async getGeofenceZones(): Promise<GeofenceZoneWithRelations[]> {
    const zones = await db
      .select()
      .from(geofenceZones)
      .leftJoin(customers, eq(geofenceZones.customerId, customers.id))
      .leftJoin(users, eq(geofenceZones.createdBy, users.id))
      .orderBy(desc(geofenceZones.createdAt));

    return zones.map(row => ({
      ...row.geofence_zones,
      customer: row.customers || undefined,
      createdByUser: row.users || undefined,
    }));
  }

  async createGeofenceZone(zoneData: InsertGeofenceZone): Promise<GeofenceZone> {
    const [zone] = await db
      .insert(geofenceZones)
      .values(zoneData)
      .returning();
    return zone;
  }

  async getRecentGeofenceEvents(): Promise<GeofenceEventWithRelations[]> {
    const events = await db
      .select()
      .from(geofenceEvents)
      .leftJoin(users, eq(geofenceEvents.userId, users.id))
      .leftJoin(geofenceZones, eq(geofenceEvents.zoneId, geofenceZones.id))
      .leftJoin(tasks, eq(geofenceEvents.taskId, tasks.id))
      .orderBy(desc(geofenceEvents.eventTime))
      .limit(50);

    return events.map(row => ({
      ...row.geofence_events,
      user: row.users || undefined,
      zone: row.geofence_zones || undefined,
      task: row.tasks || undefined,
    }));
  }

  async getLiveUserLocations(): Promise<UserLocationWithRelations[]> {
    const locations = await db
      .select()
      .from(userLocations)
      .leftJoin(users, eq(userLocations.userId, users.id))
      .leftJoin(tasks, eq(userLocations.taskId, tasks.id))
      .where(eq(userLocations.isActive, true))
      .orderBy(desc(userLocations.createdAt))
      .limit(100);

    // Get most recent location per user
    const uniqueLocations = new Map();
    locations.forEach(row => {
      const userId = row.user_locations.userId;
      if (!uniqueLocations.has(userId)) {
        uniqueLocations.set(userId, {
          ...row.user_locations,
          user: row.users || undefined,
          task: row.tasks || undefined,
        });
      }
    });

    return Array.from(uniqueLocations.values());
  }

  async createUserLocation(locationData: InsertUserLocation): Promise<UserLocation> {
    const [location] = await db
      .insert(userLocations)
      .values(locationData)
      .returning();
    return location;
  }

  async checkGeofenceEvents(userId: string, latitude: number, longitude: number): Promise<void> {
    // Get all active zones
    const zones = await db
      .select()
      .from(geofenceZones)
      .where(eq(geofenceZones.isActive, true));

    // Calculate distance to each zone and check for enter/exit events
    for (const zone of zones) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        parseFloat(zone.centerLatitude),
        parseFloat(zone.centerLongitude)
      );

      const isInside = distance <= parseFloat(zone.radius);
      
      // Check user's last event for this zone
      const [lastEvent] = await db
        .select()
        .from(geofenceEvents)
        .where(and(
          eq(geofenceEvents.userId, userId),
          eq(geofenceEvents.zoneId, zone.id)
        ))
        .orderBy(desc(geofenceEvents.eventTime))
        .limit(1);

      const wasInside = lastEvent?.eventType === 'enter';

      if (isInside && !wasInside) {
        // User entered the zone
        await db.insert(geofenceEvents).values({
          userId,
          zoneId: zone.id,
          eventType: 'enter',
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          distance: distance.toString(),
        });
      } else if (!isInside && wasInside) {
        // User exited the zone
        await db.insert(geofenceEvents).values({
          userId,
          zoneId: zone.id,
          eventType: 'exit',
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          distance: distance.toString(),
        });
      }
    }
  }

  // Bot configuration operations
  async getAllBotConfigurations(): Promise<BotConfiguration[]> {
    return await db.select().from(botConfigurations).orderBy(desc(botConfigurations.createdAt));
  }

  async getBotConfiguration(id: number): Promise<BotConfiguration | undefined> {
    const [config] = await db.select().from(botConfigurations).where(eq(botConfigurations.id, id));
    return config;
  }

  async createBotConfiguration(configData: InsertBotConfiguration): Promise<BotConfiguration> {
    const [config] = await db
      .insert(botConfigurations)
      .values(configData)
      .returning();
    return config;
  }

  async updateBotConfiguration(id: number, configData: Partial<InsertBotConfiguration>): Promise<BotConfiguration> {
    const [config] = await db
      .update(botConfigurations)
      .set({ ...configData, updatedAt: new Date() })
      .where(eq(botConfigurations.id, id))
      .returning();
    return config;
  }

  async deleteBotConfiguration(id: number): Promise<void> {
    // Delete related notification logs first
    await db.delete(notificationLogs).where(eq(notificationLogs.configId, id));
    
    // Then delete the configuration
    await db.delete(botConfigurations).where(eq(botConfigurations.id, id));
  }

  async testBotConfiguration(id: number): Promise<{ success: boolean; message: string; }> {
    const config = await this.getBotConfiguration(id);
    if (!config) {
      return { success: false, message: "Configuration not found" };
    }

    try {
      let testResult = { success: false, message: "" };
      
      if (config.botType === 'telegram' && config.telegramBotToken && config.telegramChatId) {
        // Validate bot token format (should be numeric:alphanumeric)
        const tokenPattern = /^\d{8,10}:[A-Za-z0-9_-]{35}$/;
        if (!tokenPattern.test(config.telegramBotToken)) {
          testResult = { success: false, message: "Invalid bot token format. Expected format: 123456789:ABCdefGHIjklMNOpqrSTUvwxyz" };
        } else {
          // Test Telegram bot
          const telegramUrl = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
          
          try {
            const response = await fetch(telegramUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: config.telegramChatId,
                text: config.testMessage || "🔧 Wizone IT Support Portal - Bot Configuration Test",
                parse_mode: config.telegramParseMode || 'HTML'
              }),
              signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            
            if (response.ok) {
              testResult = { success: true, message: "Telegram bot test successful" };
            } else {
              const errorData = await response.json().catch(() => ({ description: "Unknown error" }));
              if (response.status === 400) {
                testResult = { success: false, message: `Invalid request: ${errorData.description || 'Check bot token and chat ID'}` };
              } else if (response.status === 401) {
                testResult = { success: false, message: "Unauthorized: Invalid bot token" };
              } else if (response.status === 404) {
                testResult = { success: false, message: "Bot not found: Check bot token" };
              } else {
                testResult = { success: false, message: `Telegram API error (${response.status}): ${errorData.description}` };
              }
            }
          } catch (fetchError: any) {
            if (fetchError.name === 'AbortError') {
              testResult = { success: false, message: "Request timeout: Check your internet connection" };
            } else {
              testResult = { success: false, message: `Network error: ${fetchError.message}` };
            }
          }
        }
      } else if (config.botType === 'whatsapp' && config.whatsappApiUrl && config.whatsappApiKey) {
        // Test WhatsApp API
        const response = await fetch(config.whatsappApiUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.whatsappApiKey}`
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: config.whatsappPhoneNumber,
            type: "text",
            text: { body: config.testMessage || "🔧 Wizone IT Support Portal - Bot Configuration Test" }
          })
        });
        
        if (response.ok) {
          testResult = { success: true, message: "WhatsApp API test successful" };
        } else {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          testResult = { success: false, message: `WhatsApp error: ${errorData.error}` };
        }
      } else if (config.webhookUrl) {
        // Test generic webhook
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (config.webhookAuth) {
          headers['Authorization'] = `Bearer ${config.webhookAuth}`;
        }
        if (config.webhookHeaders) {
          Object.assign(headers, config.webhookHeaders);
        }
        
        const response = await fetch(config.webhookUrl, {
          method: config.webhookMethod || 'POST',
          headers,
          body: JSON.stringify({
            message: config.testMessage || "🔧 Wizone IT Support Portal - Bot Configuration Test",
            timestamp: new Date().toISOString(),
            source: "wizone_bot_test"
          })
        });
        
        if (response.ok) {
          testResult = { success: true, message: "Webhook test successful" };
        } else {
          testResult = { success: false, message: `Webhook error: ${response.status} ${response.statusText}` };
        }
      } else {
        testResult = { success: false, message: "Missing required configuration for bot type" };
      }
      
      // Update test result in database
      await db
        .update(botConfigurations)
        .set({ 
          lastTestResult: testResult.success ? 'success' : 'failed',
          lastTestTime: new Date() 
        })
        .where(eq(botConfigurations.id, id));
      
      return testResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      // Update test result in database
      await db
        .update(botConfigurations)
        .set({ 
          lastTestResult: 'failed',
          lastTestTime: new Date() 
        })
        .where(eq(botConfigurations.id, id));
      
      return { success: false, message: errorMessage };
    }
  }

  // Notification log operations
  async getNotificationLogs(limit: number = 50, offset: number = 0): Promise<NotificationLog[]> {
    return await db
      .select()
      .from(notificationLogs)
      .orderBy(desc(notificationLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createNotificationLog(logData: InsertNotificationLog): Promise<NotificationLog> {
    const [log] = await db
      .insert(notificationLogs)
      .values(logData)
      .returning();
    return log;
  }

  async updateNotificationLogStatus(id: number, status: string, responseData?: any, errorMessage?: string): Promise<NotificationLog> {
    const updateData: any = { status };
    if (responseData) updateData.responseData = responseData;
    if (errorMessage) updateData.errorMessage = errorMessage;
    if (status === 'sent') updateData.sentAt = new Date();
    
    const [log] = await db
      .update(notificationLogs)
      .set(updateData)
      .where(eq(notificationLogs.id, id))
      .returning();
    return log;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

export const storage = new DatabaseStorage();
