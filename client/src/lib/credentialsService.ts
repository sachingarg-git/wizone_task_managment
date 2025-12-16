import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

// Secure Credentials Storage Service
// Uses Capacitor Preferences with base64 encoding for basic obfuscation
// For production, consider using @nicescript/capacitor-secure-storage-plugin

const CREDENTIALS_KEY = 'wizone_saved_credentials';
const REMEMBER_ME_KEY = 'wizone_remember_me';

interface SavedCredentials {
  username: string;
  password: string;
  savedAt: number;
}

// Simple obfuscation (not encryption, but prevents casual reading)
function encode(text: string): string {
  return btoa(encodeURIComponent(text));
}

function decode(encoded: string): string {
  try {
    return decodeURIComponent(atob(encoded));
  } catch {
    return '';
  }
}

export class CredentialsService {
  private static instance: CredentialsService;

  private constructor() {}

  static getInstance(): CredentialsService {
    if (!CredentialsService.instance) {
      CredentialsService.instance = new CredentialsService();
    }
    return CredentialsService.instance;
  }

  // Check if running on native platform
  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  // Save credentials securely
  async saveCredentials(username: string, password: string): Promise<void> {
    try {
      const credentials: SavedCredentials = {
        username: encode(username),
        password: encode(password),
        savedAt: Date.now(),
      };

      if (this.isNativePlatform()) {
        // Use Capacitor Preferences on native
        await Preferences.set({
          key: CREDENTIALS_KEY,
          value: JSON.stringify(credentials),
        });
      } else {
        // Use localStorage on web (fallback)
        localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
      }

      console.log('✅ Credentials saved securely');
    } catch (error) {
      console.error('❌ Error saving credentials:', error);
    }
  }

  // Get saved credentials
  async getCredentials(): Promise<{ username: string; password: string } | null> {
    try {
      let credentialsJson: string | null = null;

      if (this.isNativePlatform()) {
        const result = await Preferences.get({ key: CREDENTIALS_KEY });
        credentialsJson = result.value;
      } else {
        credentialsJson = localStorage.getItem(CREDENTIALS_KEY);
      }

      if (!credentialsJson) {
        return null;
      }

      const credentials: SavedCredentials = JSON.parse(credentialsJson);

      // Check if credentials are older than 30 days
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - credentials.savedAt > thirtyDaysMs) {
        await this.clearCredentials();
        return null;
      }

      return {
        username: decode(credentials.username),
        password: decode(credentials.password),
      };
    } catch (error) {
      console.error('❌ Error getting credentials:', error);
      return null;
    }
  }

  // Clear saved credentials
  async clearCredentials(): Promise<void> {
    try {
      if (this.isNativePlatform()) {
        await Preferences.remove({ key: CREDENTIALS_KEY });
      } else {
        localStorage.removeItem(CREDENTIALS_KEY);
      }
      console.log('✅ Credentials cleared');
    } catch (error) {
      console.error('❌ Error clearing credentials:', error);
    }
  }

  // Set remember me preference
  async setRememberMe(remember: boolean): Promise<void> {
    try {
      if (this.isNativePlatform()) {
        await Preferences.set({
          key: REMEMBER_ME_KEY,
          value: remember.toString(),
        });
      } else {
        localStorage.setItem(REMEMBER_ME_KEY, remember.toString());
      }
    } catch (error) {
      console.error('❌ Error setting remember me:', error);
    }
  }

  // Get remember me preference
  async getRememberMe(): Promise<boolean> {
    try {
      let value: string | null = null;

      if (this.isNativePlatform()) {
        const result = await Preferences.get({ key: REMEMBER_ME_KEY });
        value = result.value;
      } else {
        value = localStorage.getItem(REMEMBER_ME_KEY);
      }

      return value === 'true';
    } catch (error) {
      console.error('❌ Error getting remember me:', error);
      return false;
    }
  }
}

// Export singleton instance
export const credentialsService = CredentialsService.getInstance();
