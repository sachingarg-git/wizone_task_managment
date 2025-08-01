import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wizone.fieldEngineer',
  appName: 'Wizone Field Engineer',
  webDir: 'public',
  startUrl: 'direct-login.html',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      '*'
    ],
    url: 'http://localhost:5000'
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