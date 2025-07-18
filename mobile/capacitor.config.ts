import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wizoneit.taskmanager',
  appName: 'Wizone IT Support Portal',
  webDir: '../dist/public', // ✅ Correct path to build output
  bundledWebRuntime: false,
  server: {
    hostname: 'localhost',
    androidScheme: 'https',
    allowNavigation: ['*']
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    loggingBehavior: 'debug',
    minWebViewVersion: 60
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: "#22d3ee",
      showSpinner: false
    }
  }
};

export default config;