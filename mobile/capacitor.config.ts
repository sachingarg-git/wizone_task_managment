import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wizoneit.taskmanager',
  appName: 'Wizone IT Support Portal',
  webDir: 'public',
  server: {
    cleartext: true,
    allowNavigation: ['*']
  },

  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    loggingBehavior: 'debug',
    minWebViewVersion: 60,
    appendUserAgent: 'WizoneApp/1.0 (WebView)',
    overrideUserAgent: undefined,
    backgroundColor: '#1e293b'
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