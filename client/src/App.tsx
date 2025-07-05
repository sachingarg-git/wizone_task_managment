import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import Chat from "@/pages/chat";
import Portal from "@/pages/portal";
import CustomerPortal from "@/pages/customer-portal";
import UnifiedLogin from "@/pages/unified-login";
import Sidebar from "@/components/layout/sidebar";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const [customerUser, setCustomerUser] = useState(null);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If admin is not authenticated, show unified login
  if (!isAuthenticated) {
    return (
      <UnifiedLogin 
        onAdminLogin={handleAdminLogin}
        onCustomerLogin={handleCustomerLogin}
      />
    );
  }

  // Admin is authenticated, show admin dashboard
  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/customers" component={Customers} />
          <Route path="/performance" component={Performance} />
          <Route path="/users" component={Users} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/domains" component={Domains} />
          <Route path="/sql-connections" component={SqlConnections} />
          <Route path="/chat" component={Chat} />
          <Route path="/portal" component={Portal} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
