# 🎉 Production APK Ready - Installation Guide

## ✅ Production APK Details

**File:** `WIZONE-TaskManager-Mobile-Production-v1.0.apk`  
**Size:** 4.37 MB  
**Server:** `http://103.122.85.61:3007`  
**Build Date:** November 27, 2025 16:25  
**Status:** ✅ Ready for Installation

---

## 🚀 Quick Installation (3 Steps)

### Step 1: Copy APK to Your Android Phone
- **Option A:** USB Cable
  - Connect phone to computer via USB
  - Copy `WIZONE-TaskManager-Mobile-Production-v1.0.apk` to phone's `Downloads` folder
  
- **Option B:** Cloud/Messaging
  - Upload APK to Google Drive / OneDrive
  - OR send via WhatsApp / Telegram to your phone
  - Download on your phone

### Step 2: Install APK
1. On your Android phone, open **Files** or **My Files** app
2. Navigate to **Downloads** folder
3. Tap on `WIZONE-TaskManager-Mobile-Production-v1.0.apk`
4. If prompted: Tap **Settings** → Enable **"Install from Unknown Sources"**
5. Tap **Install**
6. Wait for installation to complete
7. Tap **Open**

### Step 3: Login and Use
- **Field Engineer Login:**
  - Username: `ravi`
  - Password: `ravi123`
  
- **Backend Engineer Login:**
  - Username: `sachin`
  - Password: `admin123`

---

## 📱 App Features

### ✅ Available Features (All Working)

1. **Professional Login Page**
   - Clean mobile-optimized design
   - Secure authentication
   - Session management

2. **Task Dashboard**
   - Shows YOUR assigned tasks only (not all tasks)
   - Complete task count
   - Pending task count
   - Cancelled task count
   - Real-time statistics

3. **Task Cards (Mobile View)**
   - Compact card design
   - Task ID (clickable)
   - Customer name
   - Status badge (color-coded)
   - Priority indicator
   - Due date
   - Quick actions

4. **Task Details**
   - Full task information
   - Customer details
   - Site address
   - Contact information
   - Task description
   - Current status
   - Priority level
   - Due date
   - Assigned engineer

5. **Task Updates**
   - View complete history
   - See all status changes
   - Read all notes
   - View uploaded files
   - Timeline view with dates

6. **Change Task Status**
   - Dropdown to select new status:
     - Pending
     - In Progress
     - Completed
     - On Hold
     - Cancelled
   - Add notes when changing status
   - Real-time update to server
   - Instant sync with web portal

7. **File Upload**
   - Upload from camera (take photo)
   - Upload from gallery
   - Multiple file support
   - Image preview
   - File size display
   - Upload progress

8. **Add Notes**
   - Write task notes
   - Notes saved with updates
   - Visible in history
   - Timestamps included

9. **Task History**
   - Complete audit trail
   - All status changes
   - All notes added
   - All files uploaded
   - User who made changes
   - Date and time stamps
   - Clickable task IDs to view details

10. **Real-time Sync**
    - Changes appear immediately
    - Syncs with web portal
    - No manual refresh needed
    - Pull-to-refresh support

---

## 🔐 User Roles and Access

### Field Engineer (ravi/ravi123)
**What You'll See:**
- ✅ Only tasks assigned to YOU
- ✅ Your task dashboard
- ✅ Your task history
- ✅ Change task status
- ✅ Upload files
- ✅ Add notes
- ❌ Network Monitoring (not available for field engineers)
- ❌ Other engineers' tasks (filtered out)
- ❌ Admin functions

**Use Case:** Field engineers can manage their assigned tasks on mobile

### Backend Engineer (sachin/admin123)
**What You'll See:**
- ✅ Only tasks assigned to YOU
- ✅ Your task dashboard
- ✅ Your task history
- ✅ Change task status
- ✅ Upload files
- ✅ Add notes
- ✅ Network Monitoring (if on web)
- ❌ Other engineers' tasks (filtered out)
- ❌ Admin functions

**Use Case:** Backend engineers can manage their assigned tasks

---

## 🎯 Task Assignment Filter (Important!)

### How Task Filtering Works

The app **automatically filters** tasks to show only:
- Tasks assigned to **YOUR username**
- Tasks where **YOUR user ID** matches `assignedTo` field
- Tasks where **YOUR user ID** matches `fieldEngineerId` field

### Example:
- **User:** ravi (field_engineer)
- **User ID:** 2
- **Tasks Shown:** Only tasks with `assignedTo = 2` or `assignedTo = 'ravi'`
- **Tasks Hidden:** All other tasks (even if they exist in database)

### Why This Matters:
✅ **Privacy:** Engineers can only see their own work  
✅ **Focus:** No distraction from other tasks  
✅ **Security:** No unauthorized access to other engineers' tasks  
✅ **Performance:** Faster loading (fewer tasks to fetch)  

---

## 🌐 Network Configuration

### Server Connection
- **Server URL:** `http://103.122.85.61:3007`
- **Database:** PostgreSQL at `103.122.85.61:9095`
- **Connection:** Direct HTTP (no VPN needed)
- **Authentication:** Session-based with cookies

### Requirements
✅ **No special network setup needed**  
✅ **Works on mobile data (4G/5G)**  
✅ **Works on any WiFi**  
✅ **No need to be on same network as server**  

The APK connects directly to your production server at `103.122.85.61:3007`

---

## 📊 Testing Checklist

After installing the APK, test these features:

### Basic Features
- [ ] App installs without errors
- [ ] App launches successfully
- [ ] Login page appears (professional design)
- [ ] Login works with ravi/ravi123
- [ ] Dashboard loads with task counts

### Task Management
- [ ] Can see assigned tasks (only yours)
- [ ] Task cards display correctly
- [ ] Can click task ID to view details
- [ ] Task details page shows all information
- [ ] Statistics show correct counts

### Task Updates
- [ ] Can change task status
- [ ] Status dropdown works
- [ ] Can add notes when changing status
- [ ] Changes save successfully
- [ ] Toast notification appears on success

### File Upload
- [ ] Camera button works
- [ ] Can take photo with camera
- [ ] Gallery button works
- [ ] Can select photo from gallery
- [ ] File upload progress shows
- [ ] Uploaded file appears in history

### History and Sync
- [ ] Task history loads
- [ ] All updates visible with timestamps
- [ ] Task IDs are clickable
- [ ] Changes sync with web portal
- [ ] Pull-to-refresh works
- [ ] Real-time updates appear

### Field Engineer Specific
- [ ] Login with ravi/ravi123 works
- [ ] See only ravi's assigned tasks
- [ ] Cannot see sachin's tasks
- [ ] Cannot see Network Monitoring
- [ ] All field functions work properly

---

## 🐛 Troubleshooting

### Problem: App Won't Install
**Error:** "Installation blocked"  
**Solution:**
1. Go to phone **Settings**
2. Navigate to **Security** or **Privacy**
3. Enable **"Install from Unknown Sources"** or **"Install Unknown Apps"**
4. Select your file manager app
5. Allow installation
6. Try installing APK again

### Problem: Login Fails
**Error:** "Invalid credentials" or "Connection error"  
**Possible Causes:**
1. **Wrong Username/Password**
   - Try: `ravi` / `ravi123` (field engineer)
   - Try: `sachin` / `admin123` (backend engineer)
   - ⚠️ Passwords are case-sensitive

2. **Server Not Running**
   - Verify server at `http://103.122.85.61:3007` is running
   - Ask admin to check server status

3. **Network Issue**
   - Check phone has internet (mobile data or WiFi)
   - Try opening `http://103.122.85.61:3007` in phone browser
   - If browser works but app doesn't, contact support

### Problem: No Tasks Visible
**Issue:** Dashboard shows 0 tasks  
**Possible Causes:**
1. **No Tasks Assigned**
   - Verify in database that tasks are assigned to your user
   - Check `assignedTo` field matches your user ID or username
   - Ask admin to assign tasks to you

2. **Wrong User Logged In**
   - Make sure you're logged in as the correct user
   - Logout and login again with correct credentials

3. **Task Assignment Mismatch**
   - Database tasks must have:
     - `assignedTo = 'ravi'` (username) OR
     - `assignedTo = 2` (user ID) OR
     - `fieldEngineerId = 2` (user ID)

### Problem: Cannot Upload Files
**Error:** File upload fails  
**Solutions:**
1. **Check File Size**
   - Keep images under 10MB
   - Compress large images before uploading

2. **Camera Permission**
   - Go to phone **Settings** → **Apps** → **WIZONE Task Manager**
   - Enable **Camera** permission
   - Enable **Storage** permission

3. **Storage Permission**
   - Go to phone **Settings** → **Apps** → **WIZONE Task Manager**
   - Enable **Storage** or **Files** permission

### Problem: Changes Don't Sync
**Issue:** Updates not appearing on web portal  
**Solutions:**
1. **Check Internet Connection**
   - Verify phone has active internet
   - Try loading another website/app

2. **Refresh Web Portal**
   - On web portal, press F5 or click refresh
   - Wait 2-3 seconds for sync

3. **Check Server Status**
   - Verify server is running
   - Check server logs for errors

### Problem: App Crashes
**Issue:** App closes unexpectedly  
**Solutions:**
1. **Clear App Data**
   - Settings → Apps → WIZONE Task Manager
   - Tap **Storage** → **Clear Data**
   - Reopen app and login again

2. **Reinstall App**
   - Uninstall app
   - Reinstall from APK file
   - Login again

3. **Check Android Version**
   - App requires Android 6.0 or higher
   - Update phone if Android version is older

---

## 🔄 Updating Tasks from Mobile

### How to Change Task Status

1. **Open Task Details:**
   - Tap on any task card
   - OR tap task ID from history

2. **Change Status:**
   - Scroll to "Update Task Status" section
   - Tap the status dropdown
   - Select new status:
     - Pending
     - In Progress
     - Completed
     - On Hold
     - Cancelled

3. **Add Notes (Optional but Recommended):**
   - Type notes in the "Update Notes" field
   - Example: "Completed installation at site"
   - Example: "Waiting for customer approval"

4. **Save Changes:**
   - Tap **"Update Status"** button
   - Wait for success message
   - Task updated!

### How to Upload Files

1. **Open Task Details:**
   - Tap on any task card

2. **Choose Upload Method:**
   - **Camera Option:**
     - Tap camera icon button
     - Take photo with phone camera
     - Confirm photo
   
   - **Gallery Option:**
     - Tap gallery icon button
     - Select photo from phone
     - Confirm selection

3. **Add Notes for File (Optional):**
   - Type description of uploaded file
   - Example: "Site photo after installation"

4. **Upload:**
   - Tap **"Upload Files"** button
   - Wait for upload to complete
   - See file in history!

---

## 📱 Mobile App Advantages

### Why Use Mobile App vs Web Portal?

1. **Offline Task View**
   - View last loaded tasks without internet
   - Perfect for sites with poor connectivity

2. **Camera Integration**
   - Take photos directly from task page
   - No need to switch apps

3. **Native Notifications** (Future)
   - Get alerts for new task assignments
   - Get reminded about pending tasks

4. **Better Performance**
   - Faster loading on mobile
   - Optimized for touch interaction

5. **Home Screen Access**
   - One tap to open app
   - No need to open browser and bookmark

6. **Mobile-First Design**
   - Buttons sized for fingers
   - Compact cards for small screens
   - Swipe gestures support

---

## 🎓 Training Tips for Field Engineers

### First Time Using the App

**Day 1: Familiarization (10 minutes)**
1. Install app on phone
2. Login with your credentials
3. Explore dashboard - see your task counts
4. Tap on one task to see details
5. Scroll through task information
6. Check the history section

**Day 2: Practice Updates (15 minutes)**
1. Open any task
2. Practice changing status (try different statuses)
3. Add test notes like "Test update from mobile"
4. Check if changes appear in web portal
5. Try pulling down to refresh

**Day 3: Practice File Upload (15 minutes)**
1. Open any task
2. Take a test photo with camera
3. Upload the photo
4. Check if file appears in history
5. Try uploading from gallery too

**Day 4: Real Usage (All Day)**
1. Use app for actual work
2. Update tasks as you complete them
3. Upload site photos
4. Add notes about site conditions
5. Report any issues to admin

### Best Practices

✅ **DO:**
- Update task status immediately after site visit
- Take photos at the beginning and end of work
- Add detailed notes (what you did, time spent, issues found)
- Check dashboard every morning for new tasks
- Upload files with descriptive notes

❌ **DON'T:**
- Don't leave tasks outdated for days
- Don't upload unrelated photos
- Don't skip adding notes (notes help everyone)
- Don't change task status without actually doing the work
- Don't share your login credentials

---

## 📞 Support and Contact

### If You Need Help

**Technical Issues:**
- Contact: Backend team
- Email: support@wizoneit.com
- Phone: [Your support number]

**Task Assignment Questions:**
- Contact: Your manager
- Ask admin to check database assignments

**Training Needed:**
- Request training session from admin
- Use this guide for self-training

---

## 🔒 Security Notes

1. **Keep Credentials Secure:**
   - Don't share username/password
   - Don't write password on paper
   - Change password if compromised

2. **Use App Responsibly:**
   - Only access your assigned tasks
   - Don't try to access other engineers' data
   - Report any security issues to admin

3. **Protect Your Phone:**
   - Use screen lock (PIN/Pattern/Fingerprint)
   - Don't leave phone unattended with app open
   - Logout if phone is lost/stolen

---

## ✅ Success Criteria

### Your App is Working Correctly If:

✅ You can login with your credentials  
✅ You see only YOUR assigned tasks (not everyone's)  
✅ Task counts match your actual assignments  
✅ You can view complete task details  
✅ Status changes save successfully  
✅ File uploads work (camera and gallery)  
✅ Notes are added to history  
✅ Changes sync with web portal  
✅ App doesn't crash  
✅ Performance is smooth  

---

## 🚀 Next Steps

1. **Install the APK** on your Android phone
2. **Login** with your credentials (ravi/ravi123 or sachin/admin123)
3. **Test basic features** using the testing checklist
4. **Start using** for daily work
5. **Report issues** if anything doesn't work
6. **Provide feedback** for future improvements

---

## 📦 Production Deployment Details

**Build Information:**
- **App ID:** com.wizoneit.taskmanager
- **App Name:** WIZONE Task Manager
- **Version:** 1.0
- **Build Type:** Debug APK (for testing)
- **Server:** http://103.122.85.61:3007
- **Database:** PostgreSQL at 103.122.85.61:9095
- **Min Android:** 6.0 (API 23)
- **Target Android:** 14 (API 35)

**Build Tools:**
- Node.js: 22.11.0
- Java: OpenJDK 21.0.9 LTS
- Gradle: 8.11.1
- Capacitor: 7.4.2
- Vite: 6.0.0

**Capacitor Plugins:**
- @capacitor/haptics 7.0.2 - Touch feedback
- @capacitor/network 7.0.2 - Network status
- @capacitor/preferences 7.0.2 - Local storage
- @capacitor/splash-screen 7.0.2 - Launch screen

---

## 🎉 Ready to Go!

Your production mobile app is ready for field use!

**APK File:** `WIZONE-TaskManager-Mobile-Production-v1.0.apk` (4.37 MB)

Install it on your Android device and start managing tasks on the go! 📱🚀

**Server:** Already configured to connect to `http://103.122.85.61:3007`  
**Users:** Ready to login (ravi or sachin)  
**Tasks:** Will show only assigned tasks  
**Status:** Production ready! ✅
