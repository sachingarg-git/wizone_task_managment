import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

// Import components
import Landing from "@/pages/landing";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import Customers from "@/pages/customers";
import Performance from "@/pages/performance";
import Users from "@/pages/users";
import Analytics from "@/pages/analytics";
import Domains from "@/pages/domains";
import SqlConnections from "@/pages/sql-connections";
import BotConfiguration from "@/pages/bot-configuration";
import APKDownload from "@/pages/apk-download";
import TrackingHistory from "@/pages/tracking-history";
import OfficeManagement from "@/pages/office-management";
import Chat from "@/pages/chat";
import Portal from "@/pages/portal";
import CustomerPortal from "@/pages/customer-portal";
import UnifiedLogin from "@/pages/unified-login";
import Sidebar from "@/components/layout/sidebar";
import NotFound from "@/pages/not-found";

function Router() {
  console.log("Router component rendering...");
  
  try {
    const { isAuthenticated, isLoading, error } = useAuth();
    const [location] = useLocation();
    const [customerUser, setCustomerUser] = useState(null);
    
    console.log("Auth status:", { isAuthenticated, isLoading, error: error?.message });

    // Check for stored customer session
    useEffect(() => {
      const storedCustomer = localStorage.getItem("customerPortalUser");
      if (storedCustomer) {
        setCustomerUser(JSON.parse(storedCustomer));
      }
    }, []);

    // Handle admin login
    const handleAdminLogin = (user: any) => {
      window.location.reload();
    };

    // Handle customer login  
    const handleCustomerLogin = (customer: any) => {
      setCustomerUser(customer);
      localStorage.setItem("customerPortalUser", JSON.stringify(customer));
    };

    // If customer is logged in, show customer portal
    if (customerUser) {
      return <CustomerPortal />;
    }

    // Show loading state
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading application...</p>
          </div>
        </div>
      );
    }

    // Show error state
    if (error) {
      console.error("Auth error:", error);
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900">
          <div className="text-center">
            <h2 className="text-white text-xl mb-4">Authentication Error</h2>
            <p className="text-white mb-4">Unable to verify authentication status</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    // Special routes that don't require authentication
    if (location === "/login" || location === "/portal" || location === "/unified-login") {
      if (location === "/login") {
        return <LoginPage />;
      }
      if (location === "/portal") {
        return <Portal />;
      }
      if (location === "/unified-login") {
        return <UnifiedLogin onAdminLogin={handleAdminLogin} onCustomerLogin={handleCustomerLogin} />;
      }
    }

    // If not authenticated, show unified login
    if (!isAuthenticated) {
      return <UnifiedLogin onAdminLogin={handleAdminLogin} onCustomerLogin={handleCustomerLogin} />;
    }

    // If authenticated, show main application with sidebar
    return (
      <div className="flex min-h-screen bg-slate-900">
        <Sidebar />
        <div className="flex-1 ml-64">
          <div className="container mx-auto px-6 py-8">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/tasks" component={Tasks} />
              <Route path="/customers" component={Customers} />
              <Route path="/performance" component={Performance} />
              <Route path="/users" component={Users} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/domains" component={Domains} />
              <Route path="/sql-connections" component={SqlConnections} />
              <Route path="/bot-configuration" component={BotConfiguration} />
              <Route path="/apk-download" component={APKDownload} />
              <Route path="/tracking-history" component={TrackingHistory} />
              <Route path="/office-management" component={OfficeManagement} />
              <Route path="/chat" component={Chat} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </div>
      </div>
    );

  } catch (error: any) {
    console.error("Router error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900">
        <div className="text-center">
          <h2 className="text-white text-xl mb-4">Application Error</h2>
          <p className="text-white mb-4">{error?.message || "An unexpected error occurred"}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }
}

function App() {
  console.log("App component starting...");
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="app-container">
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;