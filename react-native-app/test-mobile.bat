@echo off
echo Task Score Tracker Mobile App - Development Test
echo ===============================================
echo.
echo IMPORTANT: Before building APK, test the app first!
echo.
echo Instructions:
echo 1. Install "Expo Go" app from Google Play Store on your Android device
echo 2. Make sure both devices are on the same Wi-Fi network
echo 3. When server starts, scan the QR code with Expo Go app
echo 4. Test all portal functionality
echo 5. If everything works, then build APK using build-apk.bat
echo.
echo Your server IP: 192.168.11.9:3001
echo Make sure your main server is running on this IP and port!
echo.
pause

npx expo start