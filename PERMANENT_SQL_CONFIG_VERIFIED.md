# 🗄️ Wizone IT Support Portal - Database Configuration 

## **Current Database Setup:**

### **Primary Database (Web Portal):**
```
Type: PostgreSQL (Neon Serverless)
Host: Replit-managed PostgreSQL instance
Access: Via DATABASE_URL environment variable
Status: ✅ ACTIVE (Tables verified)
```

### **External SQL Server (Real-time Sync):**
```
Database URL: mssql://sa:ss123456@14.102.70.90,1433/TASK_SCORE_WIZONE
Host: 14.102.70.90
Port: 1433 (SQL Server default)
Username: sa (System Administrator)
Password: ss123456
Database: TASK_SCORE_WIZONE
Status: ✅ ACTIVE (Auto-sync enabled)
```

## **Database Tables (PostgreSQL - Main):**

### **Core Tables:**
```sql
✅ users              - User accounts and authentication
✅ customers          - ISP customer management  
✅ tasks              - Work orders and assignments
✅ task_updates       - Task history and audit trail
✅ performance_metrics - User performance tracking
✅ sessions           - Authentication sessions
```

### **Additional Tables:**
```sql
✅ domains            - Custom domain management
✅ sql_connections    - External database connections
✅ chat_rooms         - Internal messaging system
✅ chat_messages      - Chat message storage
✅ chat_participants  - Chat room members
✅ customer_comments  - Customer feedback
✅ customer_system_details - Technical configurations
✅ trip_tracking      - Field engineer location tracking
✅ geofence_zones     - Geographic boundaries
✅ geofence_events    - Location-based events
✅ office_locations   - Office management
✅ user_locations     - User location history
✅ engineer_tracking_history - Field engineer tracking
✅ office_location_suggestions - Location recommendations
✅ bot_configurations - Telegram notification settings
✅ notification_logs  - Notification history
```

## **Real-time Database Synchronization:**

### **PostgreSQL ↔ SQL Server Sync:**
```javascript
// Automatic user sync on creation
async function syncUserToSqlServer(user, connection) {
    // Connection details hardcoded in code:
    // Host: 14.102.70.90,1433
    // Database: TASK_SCORE_WIZONE
    // User: sa / Password: ss123456
}
```

### **Sync Triggers:**
```
✅ User Creation: New users auto-sync to SQL Server
✅ Task Updates: Task status changes sync in real-time
✅ Field Engineer: Mobile app updates sync to both databases
✅ Web Portal: All changes reflected in SQL Server
```

## **Authentication Database:**

### **User Credentials (PostgreSQL):**
```sql
-- Current active users:
RAVI SAINI (WIZONE0015) - Field Engineer - Password: admin123
admin (admin001) - Administrator - Password: admin123
manpreet - Manager - Password: admin123
sachin - Field Engineer - Password: admin123
```

### **Password Security:**
```
Encryption: scrypt algorithm with salt
Format: hash.salt (stored in password field)
Session: PostgreSQL session storage with 7-day TTL
```

## **Mobile App Database Connection:**

### **Field Engineer Mobile:**
```
Primary: Tries live API connection to PostgreSQL
Fallback: Offline authentication with local credentials
Sync: Real-time task updates when online
Data: Same users and tasks as web portal
```

### **Credentials for Mobile:**
```
Username: RAVI
Password: admin123
Role: field_engineer
Access: Assigned tasks only
```

## **Database Environment Variables:**

### **Replit Environment:**
```bash
DATABASE_URL=postgresql://[auto-generated]
PGDATABASE=[auto-generated]
PGHOST=[auto-generated]  
PGPASSWORD=[auto-generated]
PGPORT=[auto-generated]
PGUSER=[auto-generated]
```

### **Session Configuration:**
```bash
SESSION_SECRET=[auto-generated]
NODE_ENV=development
PORT=5000
```

## **SQL Server Integration Details:**

### **Connection String:**
```
mssql://sa:ss123456@14.102.70.90,1433/TASK_SCORE_WIZONE
```

### **Table Structure (SQL Server):**
```sql
-- Synced tables from PostgreSQL:
users           - User accounts (id, username, password, email, role)
tasks           - Task management (id, ticket_number, title, status, assigned_to)
task_updates    - Task history (task_id, status, notes, updated_by)
customers       - Customer data (id, name, email, phone, address)
```

### **Sync Process:**
```
1. User creates account in web portal (PostgreSQL)
2. syncUserToSqlServer() function automatically triggers
3. User data inserted into SQL Server with same credentials
4. Mobile app can access same user data from both databases
5. Task updates from mobile sync back to both databases
```

## **Database Status:**

### **PostgreSQL (Primary):**
```
✅ Status: Online and operational
✅ Tables: 23 tables created and populated
✅ Users: 4+ active users with different roles
✅ Data: Live task management system
✅ Performance: Analytics and reporting functional
```

### **SQL Server (External):**
```
✅ Status: Connected and syncing
✅ Connection: 14.102.70.90,1433 accessible
✅ Authentication: sa/ss123456 credentials working
✅ Database: TASK_SCORE_WIZONE created and operational
✅ Sync: Real-time bidirectional synchronization
```

### **Mobile Database Access:**
```
✅ Online Mode: Direct connection to PostgreSQL API
✅ Offline Mode: Local authentication with fallback data
✅ Hybrid Mode: Graceful degradation between online/offline
✅ Sync: Changes persist and sync when connection restored
```

## **Application Database Flow:**

### **Web Portal:**
```
Frontend → Express API → PostgreSQL → Response
                      ↓
                   SQL Server (auto-sync)
```

### **Mobile App:**
```
Mobile → Try API → PostgreSQL → Success
              ↓
         Offline Mode → Local Auth → Sample Data
```

### **Field Engineer Workflow:**
```
1. Mobile login (RAVI/admin123) → PostgreSQL authentication
2. Load assigned tasks → Filter by field_engineer role  
3. Update task status → Save to PostgreSQL + SQL Server
4. Upload files → Store in uploads/ + database references
5. Real-time sync → Web portal shows mobile updates instantly
```

---

## **🔑 Complete Database Access Summary:**

**PostgreSQL (Main Database):**
- **Access**: Automatic via Replit environment
- **Tables**: 23 tables with complete application data
- **Users**: RAVI, admin, manpreet, sachin with encrypted passwords
- **Status**: Fully operational with real-time updates

**SQL Server (External Database):**
- **URL**: mssql://sa:ss123456@14.102.70.90,1433/TASK_SCORE_WIZONE
- **Purpose**: Real-time synchronization for mobile integration
- **Sync**: Automatic user and task synchronization
- **Status**: Connected and operational

**Mobile Database:**
- **Primary**: PostgreSQL via API calls
- **Fallback**: Local authentication with offline capability
- **Credentials**: RAVI/admin123 for field engineer access
- **Features**: Task management, status updates, file uploads

**दोनों databases real-time में sync हैं और mobile app भी same data access करता है!** ✅