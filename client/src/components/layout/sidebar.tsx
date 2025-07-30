import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ListTodo, 
  BarChart3, 
  Users, 
  UserCog, 
  LogOut,
  TrendingUp,
  Globe,
  User,
  Database,
  MessageCircle,
  MapPin,
  Clock,
  Building2,
  Bot,
  Smartphone
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
  } else if (userRole === 'engineer' || userRole === 'backend_engineer') {
    return [
      ...baseNavigation,
      { name: "Task Management", href: "/tasks", icon: ListTodo },
      { name: "Engineer Chat", href: "/chat", icon: MessageCircle },
      { name: "My Portal", href: "/portal", icon: User },
    ];
  } else {
    // Admin, manager, and other roles get full navigation + portal
    return [
      ...baseNavigation,
      { name: "Task Management", href: "/tasks", icon: ListTodo },
      { name: "Customer Management", href: "/customers", icon: Users },
      { name: "Performance", href: "/performance", icon: TrendingUp },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "User Management", href: "/users", icon: UserCog },
      { name: "Domain Management", href: "/domains", icon: Globe },
      { name: "SQL Connections", href: "/sql-connections", icon: Database },
      { name: "Bot Configuration", href: "/bot-configuration", icon: Bot },
      { name: "Android APK", href: "/apk-download", icon: Smartphone },
      { name: "Tracking History", href: "/tracking-history", icon: Clock },
      { name: "Office Management", href: "/office-management", icon: Building2 },
      { name: "Engineer Chat", href: "/chat", icon: MessageCircle },
      { name: "My Portal", href: "/portal", icon: User },
    ];
  }
};

// Icon color mapping for light theme
const getIconColor = (name: string, isActive: boolean) => {
  const colors = {
    'Dashboard': isActive ? '#3b82f6' : '#6366f1', // Blue/Indigo
    'Task Management': isActive ? '#22c55e' : '#10b981', // Green/Emerald
    'Customer Management': isActive ? '#f59e0b' : '#d97706', // Amber/Orange
    'Performance': isActive ? '#8b5cf6' : '#7c3aed', // Violet/Purple
    'Analytics': isActive ? '#06b6d4' : '#0891b2', // Cyan/Teal
    'User Management': isActive ? '#ef4444' : '#dc2626', // Red
    'Domain Management': isActive ? '#14b8a6' : '#0d9488', // Teal
    'SQL Connections': isActive ? '#6366f1' : '#4f46e5', // Indigo
    'Bot Configuration': isActive ? '#8b5cf6' : '#7c3aed', // Purple
    'Android APK': isActive ? '#22c55e' : '#16a34a', // Green
    'Tracking History': isActive ? '#f97316' : '#ea580c', // Orange
    'Office Management': isActive ? '#64748b' : '#475569', // Slate
    'Engineer Chat': isActive ? '#ec4899' : '#db2777', // Pink
    'My Portal': isActive ? '#06b6d4' : '#0891b2', // Cyan
  };
  return colors[name] || (isActive ? '#3b82f6' : '#64748b');
};

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

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
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50 border-r border-gray-200">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 logo-container cursor-pointer">
          <img 
            src={wizoneLogoPath} 
            alt="Wizone Logo" 
            className="w-10 h-10 rounded-lg object-cover shadow-sm"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Wizone</h1>
            <p className="text-xs text-gray-500">IT Support Portal</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const iconColor = getIconColor(item.name, isActive);
          return (
            <Button
              key={item.name}
              variant="ghost"
              className={`nav-item w-full justify-start space-x-3 font-medium h-12 rounded-xl transition-all duration-300 ${
                isActive
                  ? "active text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-md"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
              onClick={() => setLocation(item.href)}
            >
              <item.icon 
                className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} 
                style={{ color: iconColor }}
              />
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <div className="absolute right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </Button>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300">
          {user?.profileImageUrl ? (
            <img 
              src={user.profileImageUrl} 
              alt="User avatar" 
              className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-200 hover:ring-blue-300 transition-all duration-300"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center ring-2 ring-blue-200 hover:ring-blue-300 transition-all duration-300 hover:scale-105">
              <span className="text-sm font-medium text-white">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {user?.username || 'User'}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ') || 'User'}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="btn-animate text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
