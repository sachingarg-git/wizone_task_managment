import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wizoneit.fieldapp',
  appName: 'Wizone Field Engineer',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    hostname: 'localhost'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;