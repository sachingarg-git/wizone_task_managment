import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wizone.fieldEngineer',
  appName: 'Wizone Field Engineer',
  webDir: 'public',
  startUrl: 'production-login.html',
  server: {
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: [
      '*'
    ]
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#667eea',
      showSpinner: false
    }
  }
};

export default config;