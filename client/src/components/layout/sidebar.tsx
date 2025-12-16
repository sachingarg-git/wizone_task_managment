import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ListTodo, 
  BarChart3, 
  Users, 
  UserCog, 
  LogOut,
  TrendingUp,
  User,
  Clock,
  Bot,
  Activity,
  ClipboardList,
  MessageSquare
} from "lucide-react";
import wizoneLogoPath from "@/assets/wizone-logo.jpg";

const getNavigationForUser = (userRole: string) => {
  const baseNavigation = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
  ];

  // Field engineers only get portal access, no dashboard
  if (userRole === 'field_engineer') {
    return [
      { name: "My Portal", href: "/portal", icon: User },
    ];
  } else if (userRole === 'engineer') {
    return [
      ...baseNavigation,
      { name: "Task Management", href: "/tasks", icon: ListTodo },
      { name: "My Portal", href: "/portal", icon: User },
    ];
  } else if (userRole === 'backend_engineer') {
    return [
      ...baseNavigation,
      { name: "Task Management", href: "/tasks", icon: ListTodo },
      { name: "User Management", href: "/users", icon: UserCog },
      { name: "My Portal", href: "/portal", icon: User },
    ];
  } else if (userRole === 'admin') {
    // Admin gets full navigation including restricted modules
    return [
      ...baseNavigation,
      { name: "Task Management", href: "/tasks", icon: ListTodo },
      { name: "Customer Management", href: "/customers", icon: Users },
      { name: "Performance", href: "/performance", icon: TrendingUp },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "User Management", href: "/users", icon: UserCog },
      { name: "Engineer Reports", href: "/engineer-reports", icon: ClipboardList },
      { name: "Complaint Management", href: "/complaint-management", icon: MessageSquare },
      { name: "Bot Configuration", href: "/bot-configuration", icon: Bot },
      { name: "Tracking History", href: "/tracking-history", icon: Clock },
      { name: "Real-time Monitor", href: "/real-time-monitor", icon: Activity },
      { name: "My Portal", href: "/portal", icon: User },
    ];
  } else {
    // Manager, support, and other roles - restricted modules hidden
    return [
      ...baseNavigation,
      { name: "Task Management", href: "/tasks", icon: ListTodo },
      { name: "Customer Management", href: "/customers", icon: Users },
      { name: "Performance", href: "/performance", icon: TrendingUp },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "User Management", href: "/users", icon: UserCog },
      { name: "Engineer Reports", href: "/engineer-reports", icon: ClipboardList },
      { name: "Tracking History", href: "/tracking-history", icon: Clock },
      { name: "Real-time Monitor", href: "/real-time-monitor", icon: Activity },
      { name: "My Portal", href: "/portal", icon: User },
    ];
  }
};

// Icon color mapping for light theme
const getIconColor = (name: string, isActive: boolean) => {
  const colors: { [key: string]: string } = {
    'Dashboard': isActive ? '#3b82f6' : '#6366f1', // Blue/Indigo
    'Task Management': isActive ? '#22c55e' : '#10b981', // Green/Emerald
    'Customer Management': isActive ? '#f59e0b' : '#d97706', // Amber/Orange
    'Performance': isActive ? '#8b5cf6' : '#7c3aed', // Violet/Purple
    'Analytics': isActive ? '#06b6d4' : '#0891b2', // Cyan/Teal
    'User Management': isActive ? '#ef4444' : '#dc2626', // Red
    'Engineer Reports': isActive ? '#a855f7' : '#9333ea', // Purple
    'Complaint Management': isActive ? '#ec4899' : '#db2777', // Pink
    'Bot Configuration': isActive ? '#8b5cf6' : '#7c3aed', // Purple
    'Real-time Monitor': isActive ? '#06b6d4' : '#0891b2', // Cyan/Teal
    'Tracking History': isActive ? '#f97316' : '#ea580c', // Orange
    'My Portal': isActive ? '#06b6d4' : '#0891b2', // Cyan
  };
  return colors[name] || (isActive ? '#3b82f6' : '#64748b');
};

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  // Fetch tasks for pending + in-progress count only
  const { data: tasks } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      const response = await fetch("/api/tasks", { credentials: "include" });
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 30000,
  });

  // Fetch customer count (all customers)
  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers", { credentials: "include" });
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 30000,
  });

  // Fetch engineer reports count (all reports)
  const { data: reports } = useQuery({
    queryKey: ["/api/daily-reports"],
    queryFn: async () => {
      const response = await fetch("/api/daily-reports", { credentials: "include" });
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 30000,
  });

  // Fetch complaints for pending + investigating count only
  const { data: complaints } = useQuery({
    queryKey: ["/api/complaints"],
    queryFn: async () => {
      const response = await fetch("/api/complaints", { credentials: "include" });
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 30000,
  });

  // Fetch tracking history count
  const { data: trackingHistory } = useQuery({
    queryKey: ["/api/tracking-history"],
    queryFn: async () => {
      const response = await fetch("/api/tracking-history", { credentials: "include" });
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 30000,
  });

  // Calculate counts with proper conditions
  // Task Management: Only pending + in-progress tasks (not completed/resolved/cancelled)
  const taskCount = Array.isArray(tasks) 
    ? tasks.filter((t: any) => t.status === 'pending' || t.status === 'in_progress' || t.status === 'in-progress').length 
    : 0;
  
  // Customer Management: All customers
  const customerCount = Array.isArray(customers) ? customers.length : 0;
  
  // Engineer Reports: All reports
  const reportCount = Array.isArray(reports) ? reports.length : 0;
  
  // Complaint Management: Only pending + investigating (not resolved/completed)
  const complaintCount = Array.isArray(complaints) 
    ? complaints.filter((c: any) => c.status === 'pending' || c.status === 'investigating' || c.status === 'in_progress' || c.status === 'in-progress').length 
    : 0;

  // Tracking History: All tracking records
  const trackingCount = Array.isArray(trackingHistory) ? trackingHistory.length : 0;

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      window.location.href = "/login";
    },
    onError: () => {
      // Force redirect even on error
      window.location.href = "/login";
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navigation = getNavigationForUser(user?.role || 'engineer');

  return (
    <div className="fixed left-0 top-0 h-full w-72 z-50 overflow-y-auto bg-white shadow-xl border-r border-gray-200">
      {/* Logo Section */}
      <div className="p-6 text-center border-b border-gray-200">
        <div className="flex flex-col items-center cursor-pointer">
          <img 
            src={wizoneLogoPath} 
            alt="Wizone Logo" 
            className="w-32 h-auto object-contain mb-3 rounded-lg"
          />
          <p className="text-sm text-indigo-600 font-medium tracking-wide">IT Support Portal</p>
        </div>
      </div>
      
      {/* Section Title */}
      <div className="px-6 pt-6 pb-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Main Menu</p>
      </div>
      
      {/* Navigation */}
      <nav className="px-3 space-y-1">
        {navigation.map((item, index) => {
          const isActive = location === item.href;
          
          // Get count for specific navigation items
          let itemCount = 0;
          if (item.name === "Task Management") {
            itemCount = taskCount;
          } else if (item.name === "Customer Management") {
            itemCount = customerCount;
          } else if (item.name === "Engineer Reports") {
            itemCount = reportCount;
          } else if (item.name === "Complaint Management") {
            itemCount = complaintCount;
          } else if (item.name === "Tracking History") {
            itemCount = trackingCount;
          }
          
          // Icon colors for each navigation item
          const getIconColor = (name: string) => {
            const colors: { [key: string]: string } = {
              'Dashboard': '#60a5fa', // Blue
              'Task Management': '#4ade80', // Green
              'Customer Management': '#fbbf24', // Amber
              'Performance': '#a78bfa', // Purple
              'Analytics': '#22d3ee', // Cyan
              'User Management': '#f472b6', // Pink
              'Engineer Reports': '#c084fc', // Light Purple
              'Complaint Management': '#fb923c', // Orange
              'Bot Configuration': '#a78bfa', // Purple
              'Tracking History': '#38bdf8', // Sky Blue
              'Real-time Monitor': '#34d399', // Emerald
              'My Portal': '#67e8f9', // Cyan
            };
            return colors[name] || '#60a5fa';
          };
          
          // Add section dividers
          const showManagementSection = item.name === "User Management" && index > 0;
          const showSystemSection = item.name === "Bot Configuration" && index > 0;
          
          return (
            <div key={item.name}>
              {showManagementSection && (
                <div className="px-3 pt-6 pb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Management</p>
                </div>
              )}
              {showSystemSection && (
                <div className="px-3 pt-6 pb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">System</p>
                </div>
              )}
              <button
                className={`w-full flex items-center px-4 py-3 mx-2 rounded-xl transition-all duration-300 text-left ${
                  isActive
                    ? "bg-indigo-100 text-indigo-700 font-bold"
                    : "hover:bg-gray-100 hover:translate-x-1 font-semibold"
                }`}
                onClick={() => setLocation(item.href)}
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" style={{ color: isActive ? '#4f46e5' : getIconColor(item.name) }} />
                <span className="flex-1 text-sm font-semibold" style={{ color: isActive ? '#4338ca' : '#374151' }}>{item.name}</span>
                {itemCount > 0 && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full min-w-[24px] text-center ${
                    isActive 
                      ? "bg-white/30 text-white" 
                      : "bg-gray-200 text-gray-700"
                  }`}>
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.firstName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">
              {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || 'User'}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ') || 'User'}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all duration-300 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
