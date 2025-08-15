import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    queryFn: async () => {
      try {
        console.log("🔍 useAuth: Making request to /api/auth/user");
        const response = await fetch("/api/auth/user", {
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
