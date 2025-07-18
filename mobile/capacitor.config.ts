import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wizoneit.taskmanager',
  appName: 'Wizone IT Support Portal',
  webDir: '../dist/public', // ✅ Correct path to build output
  bundledWebRuntime: false,
  server: {
    hostname: 'localhost',
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;