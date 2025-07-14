import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
// import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
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
  
  // Test if basic rendering works
  try {
    // Add a test render to see if anything shows
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'red', color: 'white', padding: '20px' }}>
        <h1>Test Component Working!</h1>
        <p>If you see this, React is rendering correctly</p>
      </div>
    );
    
    // Original router logic
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
    // Admin login is handled by the existing useAuth hook
    // The user will be redirected automatically after successful login
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

  // Show error state if there's a fetch error (not auth error)
  if (error && !error.message.includes('401')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <p className="text-white mb-4">Unable to load application</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If admin is not authenticated, show unified login
  if (!isAuthenticated) {
    console.log("Showing unified login...");
    return (
      <UnifiedLogin 
        onAdminLogin={handleAdminLogin}
        onCustomerLogin={handleCustomerLogin}
      />
    );
  }

  // Admin is authenticated, show admin dashboard
  console.log("Showing admin dashboard...");
  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Switch>
          <Route path="/" component={(props) => {
            const { user } = useAuth();
            // Redirect field engineers to portal instead of dashboard
            if (user?.role === 'field_engineer') {
              window.location.href = '/portal';
              return null;
            }
            return <Dashboard {...props} />;
          }} />
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
          <Route path="/portal" component={Portal} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
  } catch (error) {
    console.error("Router error:", error);
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#1e293b'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h1 style={{ marginBottom: '16px' }}>Router Error</h1>
          <p>{error?.message || 'Unknown router error'}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '16px', 
              padding: '8px 16px', 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

function App() {
  console.log("App component rendering...");
  
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="app-container" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
          <Router />
          <Toaster />
        </div>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error("App rendering error:", error);
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f3f4f6'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#ef4444', marginBottom: '16px' }}>Application Error</h1>
          <p style={{ color: '#6b7280' }}>Something went wrong loading the application.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '16px', 
              padding: '8px 16px', 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}

export default App;
