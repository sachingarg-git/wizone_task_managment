import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wizoneit.app',
  appName: 'WIZONE_TASK',
  webDir: '../dist/public', // ✅ Must match the Vite outDir
  bundledWebRuntime: false
};

export default config;
