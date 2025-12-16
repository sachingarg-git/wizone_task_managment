import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { Capacitor } from '@capacitor/core';

// Detect if running in mobile APK
const isCapacitor = Capacitor.isNativePlatform();
const API_BASE_URL = isCapacitor ? 'http://103.122.85.61:3007' : '';

function resolveUrl(path: string): string {
  return isCapacitor && path.startsWith('/') ? `${API_BASE_URL}${path}` : path;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    queryFn: async () => {
      try {
        const url = resolveUrl("/api/auth/user");
        console.log("🔍 useAuth: Making request to", url);
        const response = await fetch(url, {
          credentials: "include",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        console.log("🔍 useAuth: Response status:", response.status);
        
        if (!response.ok) {
          if (response.status === 401) {
            console.log("🔍 useAuth: User not authenticated (401)");
            return null; // Not authenticated
          }
          const errorText = await response.text();
          console.error("🔍 useAuth: Error response:", errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const userData = await response.json();
        console.log("🔍 useAuth: User data received:", userData);
        return userData;
      } catch (networkError: any) {
        console.error("🔍 useAuth: Network/fetch error:", networkError);
        // For network errors, don't throw - just return null so app can still load
        if (networkError.name === 'TypeError' || networkError.message.includes('fetch')) {
          console.log("🔍 useAuth: Network error detected, treating as unauthenticated");
          return null;
        }
        throw networkError;
      }
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
