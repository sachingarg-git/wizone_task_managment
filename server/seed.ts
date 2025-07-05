import { query, initializeDb } from "./db";

// Auto-run seeding when this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().catch(console.error);
}

export async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data in correct order (respecting foreign key constraints)
  await db.delete(taskUpdates);
  await db.delete(performanceMetrics);
  await db.delete(tasks);
  await db.delete(customers);
  
  // Keep existing users but update their roles
  const existingUsers = await db.select().from(users);
  
  // Sample users with different roles
  const sampleUsers = [
    {
      id: "admin001",
      email: "admin@taskflow.com",
      firstName: "Sarah",
      lastName: "Wilson",
      role: "admin",
      department: "Management",
      isActive: true,
    },
    {
      id: "manager001", 
      email: "manager@taskflow.com",
      firstName: "Michael",
      lastName: "Johnson",
      role: "manager",
      department: "Operations",
      isActive: true,
    },
    {
      id: "engineer001",
      email: "engineer1@taskflow.com", 
      firstName: "David",
      lastName: "Chen",
      role: "engineer",
      department: "Technical",
      isActive: true,
    },
    {
      id: "engineer002",
      email: "engineer2@taskflow.com",
      firstName: "Emma",
      lastName: "Rodriguez",
      role: "engineer", 
      department: "Technical",
      isActive: true,
    },
    {
      id: "backend001",
      email: "backend@taskflow.com",
      firstName: "Alex",
      lastName: "Kumar",
      role: "backend_engineer",
      department: "Backend Systems",
      isActive: true,
    },
    {
      id: "field001",
      email: "field@taskflow.com",
      firstName: "Maria",
      lastName: "Garcia",
      role: "field_engineer",
      department: "North Region",
      isActive: true,
    },
    {
      id: "field002",
      email: "field2@taskflow.com",
      firstName: "Robert",
      lastName: "Smith",
      role: "field_engineer",
      department: "South Region",
      isActive: true,
    },
    {
      id: "field003",
      email: "field3@taskflow.com",
      firstName: "Jennifer",
      lastName: "Brown",
      role: "field_engineer",
      department: "East Region",
      isActive: true,
    },
    {
      id: "field004",
      email: "field4@taskflow.com",
      firstName: "Carlos",
      lastName: "Martinez",
      role: "field_engineer",
      department: "West Region",
      isActive: true,
    },
    {
      id: "support001",
      email: "support@taskflow.com",
      firstName: "James",
      lastName: "Thompson",
      role: "support",
      department: "Customer Service",
      isActive: true,
    }
  ];

  // Insert or update users
  for (const user of sampleUsers) {
    await db.insert(users).values(user).onConflictDoUpdate({
      target: users.id,
      set: {
        ...user,
        updatedAt: new Date(),
      },
    });
  }

  // Sample customers
  const sampleCustomers = [
    {
      customerId: "C001",
      name: "TechCorp Solutions",
      contactPerson: "John Smith",
      address: "123 Business Park Drive",
      city: "Austin",
      state: "TX",
      mobilePhone: "+1-512-555-0101",
      email: "john.smith@techcorp.com",
      servicePlan: "Enterprise",
      connectedTower: "Tower-A1",
      wirelessIp: "192.168.1.100",
      status: "active",
    },
    {
      customerId: "C002", 
      name: "Global Manufacturing Inc",
      contactPerson: "Mary Johnson",
      address: "456 Industrial Blvd",
      city: "Houston",
      state: "TX",
      mobilePhone: "+1-713-555-0202",
      email: "mary.johnson@globalmfg.com",
      servicePlan: "Premium",
      connectedTower: "Tower-B2",
      wirelessIp: "192.168.2.100",
      status: "active",
    },
    {
      customerId: "C003",
      name: "Downtown Retail Group",
      contactPerson: "Robert Davis",
      address: "789 Main Street",
      city: "Dallas",
      state: "TX", 
      mobilePhone: "+1-214-555-0303",
      email: "robert.davis@retailgroup.com",
      servicePlan: "Standard",
      connectedTower: "Tower-C3",
      wirelessIp: "192.168.3.100",
      status: "active",
    },
    {
      customerId: "C004",
      name: "Healthcare Partners LLC",
      contactPerson: "Lisa Wilson",
      address: "321 Medical Center Dr",
      city: "San Antonio",
      state: "TX",
      mobilePhone: "+1-210-555-0404",
      email: "lisa.wilson@healthpartners.com",
      servicePlan: "Enterprise",
      connectedTower: "Tower-D4",
      wirelessIp: "192.168.4.100", 
      status: "active",
    },
    {
      customerId: "C005",
      name: "Education District Office",
      contactPerson: "Mark Anderson",
      address: "555 School District Way",
      city: "Fort Worth",
      state: "TX",
      mobilePhone: "+1-817-555-0505",
      email: "mark.anderson@edudistrict.com",
      servicePlan: "Standard",
      connectedTower: "Tower-E5",
      wirelessIp: "192.168.5.100",
      status: "active",
    }
  ];

  const insertedCustomers = await db.insert(customers).values(sampleCustomers).returning();
  console.log(`✅ Inserted ${insertedCustomers.length} customers`);

  // Issue types for tasks
  const issueTypes = [
    "Network Connectivity",
    "Speed Issues", 
    "Router Problems",
    "Configuration",
    "Hardware Failure",
    "Software Issue",
    "Maintenance",
    "Installation",
    "Upgrade"
  ];

  const priorities = ["high", "medium", "low"];
  const statuses = ["pending", "in_progress", "completed", "cancelled"];
  const engineers = ["engineer001", "engineer002", "manager001", "backend001", "field001"];

  // Generate 100 tasks
  const tasks100 = [];
  for (let i = 1; i <= 100; i++) {
    const customerId = insertedCustomers[Math.floor(Math.random() * insertedCustomers.length)].id;
    const assignedTo = engineers[Math.floor(Math.random() * engineers.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const issueType = issueTypes[Math.floor(Math.random() * issueTypes.length)];
    
    // Create realistic dates
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30)); // Last 30 days
    
    let startTime = null;
    let completionTime = null;
    let actualTime = null;
    
    if (status !== "pending") {
      startTime = new Date(createdDate);
      startTime.setHours(startTime.getHours() + Math.floor(Math.random() * 24));
      
      if (status === "completed") {
        completionTime = new Date(startTime);
        completionTime.setHours(completionTime.getHours() + Math.floor(Math.random() * 48));
        actualTime = Math.floor(Math.random() * 300) + 30; // 30-330 minutes
      }
    }

    tasks100.push({
      ticketNumber: `T${String(i).padStart(6, '0')}`,
      customerId,
      assignedTo,
      createdBy: "admin001",
      priority,
      issueType,
      status,
      description: `${issueType} issue for customer. ${getRandomDescription(issueType)}`,
      resolution: status === "completed" ? getRandomResolution(issueType) : null,
      startTime,
      completionTime,
      estimatedTime: Math.floor(Math.random() * 240) + 60, // 60-300 minutes
      actualTime,
      visitCharges: status === "completed" ? (Math.random() * 200 + 50).toFixed(2) : null,
      contactPerson: insertedCustomers.find(c => c.id === customerId)?.contactPerson || "N/A",
      createdAt: createdDate,
      updatedAt: new Date(),
    });
  }

  const insertedTasks = await db.insert(tasks).values(tasks100).returning();
  console.log(`✅ Inserted ${insertedTasks.length} tasks`);

  // Generate performance metrics for users
  const currentDate = new Date();
  const performanceData = [];
  
  for (const userId of ["engineer001", "engineer002", "manager001"]) {
    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
      const targetDate = new Date(currentDate);
      targetDate.setMonth(targetDate.getMonth() - monthOffset);
      
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();
      
      // Calculate metrics based on tasks
      const userTasks = insertedTasks.filter(task => 
        task.assignedTo === userId && 
        task.createdAt && 
        new Date(task.createdAt).getMonth() === targetDate.getMonth() &&
        new Date(task.createdAt).getFullYear() === year
      );
      
      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter(task => task.status === "completed").length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      performanceData.push({
        userId,
        month,
        year,
        totalTasks,
        completedTasks,
        averageResponseTime: (Math.random() * 4 + 1).toFixed(2), // 1-5 hours
        performanceScore: (completionRate * 0.7 + Math.random() * 30).toFixed(2), // Based on completion rate + random
        customerSatisfactionRating: (Math.random() * 2 + 3).toFixed(2), // 3-5 rating
        firstCallResolutionRate: (Math.random() * 40 + 60).toFixed(2), // 60-100%
      });
    }
  }

  await db.insert(performanceMetrics).values(performanceData);
  console.log(`✅ Inserted ${performanceData.length} performance metrics`);

  console.log("🎉 Database seeding completed successfully!");
}

function getRandomDescription(issueType: string): string {
  const descriptions = {
    "Network Connectivity": "Customer experiencing intermittent connection drops and slow response times.",
    "Speed Issues": "Download/upload speeds significantly below contracted rates during peak hours.",
    "Router Problems": "Router frequently rebooting and showing error lights on status panel.",
    "Configuration": "Need to update network settings and configure new security protocols.",
    "Hardware Failure": "Physical equipment malfunction requiring replacement or repair.",
    "Software Issue": "Firmware update required or software configuration problems.",
    "Maintenance": "Scheduled maintenance and system optimization required.",
    "Installation": "New service installation or equipment setup needed.",
    "Upgrade": "Service plan upgrade and equipment enhancement required."
  };
  return descriptions[issueType as keyof typeof descriptions] || "General technical issue requiring attention.";
}

function getRandomResolution(issueType: string): string {
  const resolutions = {
    "Network Connectivity": "Replaced faulty cable connections and updated router firmware.",
    "Speed Issues": "Optimized network configuration and cleared bandwidth throttling.",
    "Router Problems": "Replaced defective router with updated model and tested connectivity.",
    "Configuration": "Updated security settings and configured network protocols successfully.",
    "Hardware Failure": "Replaced failed hardware component and verified system functionality.",
    "Software Issue": "Updated firmware and reconfigured software settings.",
    "Maintenance": "Completed scheduled maintenance and system optimization.",
    "Installation": "Successfully installed new equipment and verified service functionality.",
    "Upgrade": "Upgraded service plan and installed enhanced equipment."
  };
  return resolutions[issueType as keyof typeof resolutions] || "Issue resolved successfully.";
}