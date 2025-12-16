import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Capacitor } from '@capacitor/core';

// Detect if running in Capacitor mobile app
const isCapacitor = Capacitor.isNativePlatform();

// API base URL - use production server for mobile APK
const API_BASE_URL = isCapacitor 
  ? 'http://103.122.85.61:3007'
  : ''; // Use relative paths for web

// Helper to resolve API URL
function resolveApiUrl(url: string): string {
  if (isCapacitor && url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const resolvedUrl = resolveApiUrl(url);
  console.log(`🌐 API Request: ${method} ${resolvedUrl}`);
  
  const res = await fetch(resolvedUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = resolveApiUrl(queryKey[0] as string);
    
    const res = await fetch(url, {
      credentials: "include"
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false, // Don't refetch on window focus
      staleTime: 30000, // Data is fresh for 30 seconds
      gcTime: 60000, // Keep in cache for 1 minute
      retry: 1,
      retryDelay: 500,
    },
    mutations: {
      retry: false,
    },
  },
});
