import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wizoneit.taskmanager',
  appName: 'Wizone IT Support Portal',
  webDir: 'public',
  bundledWebRuntime: false,

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