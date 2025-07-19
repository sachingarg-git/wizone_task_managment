import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wizoneit.taskmanager',
  appName: 'Wizone IT Support Portal',
  webDir: 'android/app/src/main/assets/public',
  bundledWebRuntime: false,
  server: {
    url: 'file:///android_asset/public/app.html',
    allowNavigation: ['*']
  },

  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    loggingBehavior: 'debug',
    minWebViewVersion: 60,
    appendUserAgent: 'WizoneApp/1.0',
    overrideUserAgent: null,
    backgroundColor: '#667eea',
    hideLogs: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: "#667eea",
      showSpinner: true,
      spinnerColor: "#22d3ee",
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      splashFullScreen: true,
      splashImmersive: false
    }
  }
};

export default config;