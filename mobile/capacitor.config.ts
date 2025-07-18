import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wizoneit.taskmanager',
  appName: 'Wizone IT Support Portal',
  webDir: '../client/dist', // ✅ Correct path to client build output
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