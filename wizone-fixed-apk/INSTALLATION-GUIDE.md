# APK Installation Guide

This guide will walk you through installing the fixed Wizone IT Support APK on your Android device.

## Step 1: Build or Locate the APK

- Open the Android Studio project in the `wizone-fixed-apk` folder
- Build the APK using Android Studio (Build > Build APK)
- The APK will be in `wizone-fixed-apk/app/build/outputs/apk/debug/app-debug.apk`

## Step 2: Transfer the APK to Your Device

There are several ways to transfer the APK:

- Email the APK to yourself
- Use a USB cable to transfer directly
- Upload to Google Drive and download on your device
- Use ADB if you're familiar with it: `adb install app-debug.apk`

## Step 3: Uninstall Previous Versions

Before installing the new APK:

1. Go to Settings > Apps > Wizone IT Support (or similar name)
2. Tap "Uninstall"
3. Confirm the uninstallation

This step is crucial to avoid package name conflicts that can cause parsing errors.

## Step 4: Enable Installation from Unknown Sources

On Android 8.0 and above:
1. Go to Settings > Apps & notifications
2. Tap "Advanced" > "Special app access" > "Install unknown apps"
3. Select the app you'll use to install the APK (e.g., Files, Chrome)
4. Toggle "Allow from this source" to ON

On Android 7.0 and below:
1. Go to Settings > Security
2. Toggle "Unknown sources" to ON

## Step 5: Install the APK

1. Navigate to the APK file on your device
2. Tap the APK file to start installation
3. Review permissions and tap "Install"
4. Wait for installation to complete
5. Tap "Open" to launch the app

## Step 6: Verify Functionality

After installation:

1. Make sure the app opens without crashing
2. Try tapping on a task to see the status dropdown and notes field
3. Test updating a task status

## Troubleshooting

If you still encounter a parsing error:

1. **Double check package consistency**: Make sure all previous versions with conflicting package names are uninstalled
2. **Check Android version**: This APK requires Android 5.0 (Lollipop) or higher
3. **Rebuild with lower target SDK**: If needed, open the project in Android Studio and lower the target SDK version in build.gradle
4. **Enable installation logging**: On some devices, you can enable additional logging in developer options to get more details about installation failures

## Support

If you continue to experience issues, please provide:
- Your Android device model
- Android version
- Any error messages displayed
- Screenshots of the installation process