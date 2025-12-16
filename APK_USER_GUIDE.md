# 📱 WIZONE Task Manager - APK Installation Guide

## Quick Start Guide for Field Engineers & Backend Engineers

This mobile app gives you complete access to your task portal on your Android phone!

---

## ✨ What You Can Do

### 📊 View Tasks
- ✅ See all your assigned tasks in card view
- ✅ View task counts: **Pending**, **In Progress**, **Completed**, **Cancelled**
- ✅ Tap any task card to see full details
- ✅ View customer information and location
- ✅ Check task priority and status

### 📝 Update Tasks
- ✅ Change task status (Pending → In Progress → Completed)
- ✅ Add update notes and comments
- ✅ Write resolution notes when completing tasks
- ✅ Mark tasks as cancelled if needed

### 📷 Upload Files
- ✅ **Take photos** with your phone camera
- ✅ **Choose files** from your gallery
- ✅ Upload multiple files at once
- ✅ Add notes to your uploads
- ✅ Preview files before uploading

### 📜 View History
- ✅ See complete task history timeline
- ✅ View all status changes
- ✅ See who made updates and when
- ✅ View uploaded files
- ✅ Clickable task IDs to see details

### 🔄 Real-Time Sync
- ✅ All updates sync instantly with web portal
- ✅ Pull to refresh for latest data
- ✅ Changes you make in APK appear on web
- ✅ Changes made on web appear in APK

---

## 📥 Installation Steps

### Method 1: Manual Installation (Easiest)

1. **Download APK**
   - Get the file: `WIZONE-TaskManager-Mobile-v1.0.apk`
   - Transfer to your phone via:
     - USB cable
     - WhatsApp / Email
     - Google Drive / Cloud storage

2. **Enable Unknown Sources**
   - Go to **Settings** > **Security**
   - Enable **Install from Unknown Sources**
   - Or allow installation when prompted

3. **Install the App**
   - Open the APK file on your phone
   - Tap **Install**
   - Wait for installation to complete
   - Tap **Open** or find app in app drawer

4. **Grant Permissions**
   - Allow **Camera** access (for taking photos)
   - Allow **Storage** access (for file uploads)
   - Allow **Network** access (for connectivity)

### Method 2: ADB Installation (For Tech Users)

If you have USB debugging enabled:

```bash
adb install -r WIZONE-TaskManager-Mobile-v1.0.apk
```

---

## 🚀 First Time Setup

1. **Open the App**
   - Find "WIZONE Task Manager" in your apps
   - Tap to open

2. **Login**
   - Enter your **username** (same as web portal)
   - Enter your **password**
   - Tap **Login**

3. **You're Ready!**
   - You'll see your task portal
   - All your assigned tasks will appear
   - Start managing tasks on mobile!

---

## 📱 How to Use the App

### Main Screen
```
┌─────────────────────────────┐
│  👤 Welcome, [Your Name]   │
│  📧 [Your Email]            │
└─────────────────────────────┘

📊 Statistics Cards:
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│  5  │ │  2  │ │  2  │ │  1  │
│Tasks│ │Pend.│ │Prog.│ │Done │
└─────┘ └─────┘ └─────┘ └─────┘

📋 Task List:
┌─────────────────────────────┐
│ 🔵 TKT-12345               │
│ Customer Name               │
│ 📍 City, State             │
│ ⚠️  Network Issue          │
│ [View Details] →            │
└─────────────────────────────┘
```

### Task Details View
```
Tap any task card → Opens detail screen

Tabs Available:
• Details - Full task information
• History - All updates and changes
• Update - Change status and add notes
• Files - Upload photos/documents
```

### Uploading Files
```
1. Go to task → Files tab
2. Tap "Take Photo" or "Choose Files"
3. Select/capture your files
4. Add notes (optional)
5. Tap "Upload"
6. Wait for success message
```

### Changing Task Status
```
1. Go to task → Update tab
2. Select new status:
   - Pending
   - In Progress
   - Completed
   - Cancelled
3. Add update notes
4. Tap "Update Task"
5. Confirmation appears
```

---

## 💡 Tips & Tricks

### ✅ Best Practices

1. **Take Photos of Work**
   - Use camera to document completed work
   - Upload photos as proof of completion
   - Add notes explaining what you did

2. **Update Status Regularly**
   - Mark "In Progress" when starting
   - Mark "Completed" when done with resolution notes
   - Add notes about any issues encountered

3. **Check Tasks Daily**
   - Open app in the morning
   - Pull down to refresh task list
   - Check for new assignments

4. **Use Resolution Notes**
   - When completing tasks, explain what you did
   - Mention any parts replaced
   - Note any follow-up needed

### ⚡ Quick Actions

- **Swipe down** on task list to refresh
- **Tap task ID** to view details
- **Tap camera icon** for quick photo upload
- **Tap sync icon** to force data refresh

---

## 🔧 Troubleshooting

### App Won't Install
- ✅ Enable "Install from Unknown Sources"
- ✅ Delete old version if updating
- ✅ Check you have enough storage space
- ✅ Try redownloading APK file

### Can't Login
- ✅ Check username and password (case-sensitive)
- ✅ Ensure you have internet connection
- ✅ Verify your account is active
- ✅ Contact admin if locked out

### Tasks Not Loading
- ✅ Check internet connection (WiFi or mobile data)
- ✅ Pull down to refresh task list
- ✅ Tap sync icon in top right
- ✅ Try closing and reopening app

### Camera Not Working
- ✅ Go to Settings > Apps > WIZONE Task Manager
- ✅ Go to Permissions
- ✅ Enable Camera permission
- ✅ Restart app

### Upload Failing
- ✅ Check internet connection
- ✅ Verify file size is reasonable (<10MB)
- ✅ Enable Storage permission
- ✅ Try uploading fewer files at once

### App Crashes
- ✅ Clear app cache: Settings > Apps > Clear Cache
- ✅ Restart your phone
- ✅ Reinstall the app
- ✅ Report issue to IT support

---

## 🌐 Network Requirements

### Internet Connection
- **Required**: Yes, always
- **Type**: WiFi or Mobile Data (4G/5G)
- **Speed**: Any reasonable speed works
- **Data Usage**: Minimal (unless uploading many photos)

### Server Connection
- App connects to: **Your Company Server**
- Must be reachable from internet
- VPN may be required for remote work
- Contact IT if connection fails

---

## 🔒 Security & Privacy

### Data Security
- ✅ All data encrypted in transit
- ✅ Login required for access
- ✅ Session expires after inactivity
- ✅ Password never stored on device

### Permissions
- **Camera**: Take photos of work
- **Storage**: Upload files and photos
- **Network**: Connect to server
- **Notifications**: Task alerts (optional)

### Best Practices
- 🔐 Never share your login credentials
- 🔐 Lock your phone with PIN/password
- 🔐 Don't leave app open on shared devices
- 🔐 Log out when done if using shared phone

---

## 📞 Support

### Need Help?

**Technical Issues:**
- Contact: IT Support Team
- Email: support@wizoneit.com
- Phone: [Your Support Number]

**Account Issues:**
- Contact: System Administrator
- Reset password through web portal
- Request access if needed

**App Bugs:**
- Report to backend engineering team
- Include: What you were doing, error message, screenshots
- Your role and username (don't include password!)

---

## 📊 Features Comparison

| Feature | Mobile App | Web Portal |
|---------|-----------|------------|
| View Tasks | ✅ | ✅ |
| Update Status | ✅ | ✅ |
| Upload Files | ✅ | ✅ |
| Take Photos | ✅ | ❌ |
| View History | ✅ | ✅ |
| Task Statistics | ✅ | ✅ |
| Network Monitoring | ✅* | ✅ |
| Create New Tasks | ❌ | ✅ |
| User Management | ❌ | ✅ (Admin) |

*Network Monitoring only for authorized roles

---

## 🎯 Quick Reference Card

```
═════════════════════════════════════════
        WIZONE TASK MANAGER APP
═════════════════════════════════════════

LOGIN
────────────────────────────────────────
Username: [Your username]
Password: [Your password]

MAIN ACTIONS
────────────────────────────────────────
📋 View Tasks       → Main screen
🔄 Refresh          → Pull down or sync button
👁️  View Details    → Tap task card
✏️  Update Status   → Details → Update tab
📷 Upload Photo     → Details → Files tab
📜 See History      → Details → History tab

STATUS OPTIONS
────────────────────────────────────────
⏳ Pending
🔵 In Progress
✅ Completed (needs resolution notes!)
❌ Cancelled

SUPPORT
────────────────────────────────────────
📧 support@wizoneit.com
📞 [Your Support Number]

═════════════════════════════════════════
       Keep this card for reference!
═════════════════════════════════════════
```

---

## 📝 Version Information

**App Version:** 1.0.0  
**Release Date:** November 2025  
**Platform:** Android 8.0+  
**Package:** com.wizoneit.taskmanager  

**What's Included:**
- ✅ Complete task management
- ✅ File upload with camera support
- ✅ Real-time synchronization
- ✅ Task history tracking
- ✅ Mobile-optimized interface
- ✅ Offline data caching (coming soon)

---

## 🎓 Training Resources

### Video Tutorials (Coming Soon)
- How to login and navigate
- Updating task status
- Uploading photos from field
- Reading task history

### Written Guides
- This installation guide
- Full user manual (web portal)
- Field engineer best practices

---

**Happy Task Managing! 🎉**

*Built with ❤️ for WIZONE IT Support System*
