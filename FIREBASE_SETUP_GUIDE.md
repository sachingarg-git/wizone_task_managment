# Firebase Setup for WIZONE Task Manager - Push Notifications

## Step 1: Create Firebase Project

1. Go to **https://console.firebase.google.com/**
2. Click **"Add project"**
3. Enter project name: `WIZONE Task Manager`
4. Click **Continue** (you can disable Google Analytics if you want)
5. Click **Create project**

## Step 2: Add Android App to Firebase

1. In Firebase Console, click **"Add app"** → Select **Android** icon
2. Enter these details:
   - **Android package name**: `com.wizoneit.taskmanager`
   - **App nickname**: `WIZONE Task Manager`
   - **Debug signing certificate SHA-1**: (optional, skip for now)
3. Click **"Register app"**

## Step 3: Download google-services.json

1. Click **"Download google-services.json"**
2. Save the file to: `android/app/google-services.json`
3. The file should be placed at:
   ```
   TaskScoreTracker/
   └── android/
       └── app/
           └── google-services.json  ← PUT FILE HERE
   ```

## Step 4: Get Firebase Admin SDK Key (for Server)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Click **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Save the JSON file
5. Copy the entire JSON content

## Step 5: Configure Server

Add the Firebase service account JSON as an environment variable:

**Option A: In .env file**
```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"..."}
```

**Option B: As a file**
Save the service account JSON as `firebase-service-account.json` in the project root.

## Step 6: Rebuild APK

After placing `google-services.json`, run:
```
npx cap sync android
cd android
./gradlew.bat assembleDebug
```

## File Locations Summary

```
TaskScoreTracker/
├── android/
│   └── app/
│       └── google-services.json       ← Download from Firebase Console (Step 3)
├── firebase-service-account.json      ← Download from Firebase Console (Step 4)
└── .env
    └── FIREBASE_SERVICE_ACCOUNT=...   ← Or put service account JSON here
```

## Testing

1. Install the new APK on your device
2. Login as an engineer
3. From web dashboard, assign a task to that engineer
4. Notification should appear even when phone is locked!

---

## Quick Checklist

- [ ] Created Firebase project
- [ ] Added Android app with package name `com.wizoneit.taskmanager`
- [ ] Downloaded `google-services.json` to `android/app/`
- [ ] Downloaded Service Account JSON
- [ ] Added `FIREBASE_SERVICE_ACCOUNT` to `.env`
- [ ] Rebuilt APK with `npx cap sync android && cd android && ./gradlew.bat assembleDebug`
