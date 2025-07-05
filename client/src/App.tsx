import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
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
import Portal from "@/pages/portal";
import Sidebar from "@/components/layout/sidebar";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <>
          <Route path="/login" component={LoginPage} />
          <Route path="/" component={LoginPage} />
        </>
      ) : (
        <>
          <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 ml-64">
              <Route path="/" component={Dashboard} />
              <Route path="/tasks" component={Tasks} />
              <Route path="/customers" component={Customers} />
              <Route path="/performance" component={Performance} />
              <Route path="/users" component={Users} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/domains" component={Domains} />
              <Route path="/sql-connections" component={SqlConnections} />
              <Route path="/portal" component={Portal} />
            </div>
          </div>
        </>
      )}
      <Route component={NotFound} />
    </Switch>
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
