import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Switch, Route } from "wouter";
import { useState } from "react";

// Components
import UnifiedLogin from "@/components/unified-login";
import Sidebar from "@/components/sidebar";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import Customers from "@/pages/customers";
import Performance from "@/pages/performance";
import Users from "@/pages/users";
import Analytics from "@/pages/analytics";
import Domains from "@/pages/domains";
import SqlConnections from "@/pages/sql-connections-fixed";
import BotConfiguration from "@/pages/bot-configuration";
import APKDownload from "@/pages/apk-download";
import TrackingHistory from "@/pages/tracking-history";
import OfficeManagement from "@/pages/office-management";
import Chat from "@/pages/chat";
import Portal from "@/pages/portal";
import NotFound from "@/pages/not-found";

// Query client setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Simplified for now
  
  if (!isAuthenticated) {
    return (
      <UnifiedLogin 
        onAdminLogin={() => setIsAuthenticated(true)}
        onCustomerLogin={() => setIsAuthenticated(true)}
      />
    );
  }

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
}

function App() {
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