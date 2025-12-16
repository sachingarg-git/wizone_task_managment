import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wizone.taskmanager',
  appName: 'Wizone IT Support',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // Use offline mode instead of server URL to avoid connectivity issues
    androidScheme: "https"
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    loggingBehavior: 'none',
    minSdkVersion: 21,
    targetSdkVersion: 33
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#667eea',
      showSpinner: true,
      spinnerColor: '#ffffff'
    }
  }
};

export default config;