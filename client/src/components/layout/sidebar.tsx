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

  // All users get portal access, but different navigation structures
  if (userRole === 'field_engineer') {
    return [
      ...baseNavigation,
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
    <div className="fixed left-0 top-0 h-full w-64 sidebar-backdrop shadow-2xl z-50 border-r border-slate-700/50">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center space-x-3 logo-container cursor-pointer">
          <img 
            src={wizoneLogoPath} 
            alt="Wizone Logo" 
            className="w-32 h-auto object-contain bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-3 rounded-xl backdrop-blur-sm ring-1 ring-white/10"
          />
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Button
              key={item.name}
              variant="ghost"
              className={`nav-item w-full justify-start space-x-3 font-medium h-12 rounded-xl transition-all duration-300 ${
                isActive
                  ? "active text-white bg-gradient-to-r from-purple-600/30 to-blue-600/30 hover:from-purple-600/40 hover:to-blue-600/40 border border-purple-500/30 shadow-lg"
                  : "text-gray-300 hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50 hover:text-white hover:border-slate-600/30"
              }`}
              onClick={() => setLocation(item.href)}
            >
              <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <div className="absolute right-2 w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full pulse-glow"></div>
              )}
            </Button>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
        <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-slate-800/30 to-slate-700/30 rounded-xl backdrop-blur-sm hover:from-slate-800/50 hover:to-slate-700/50 transition-all duration-300">
          {user?.profileImageUrl ? (
            <img 
              src={user.profileImageUrl} 
              alt="User avatar" 
              className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-400/30 hover:ring-purple-400/60 transition-all duration-300"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center ring-2 ring-purple-400/30 hover:ring-purple-400/60 transition-all duration-300 hover:scale-105">
              <span className="text-sm font-medium text-white">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-white gradient-animate">
              {user?.username || 'User'}
            </p>
            <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ') || 'User'}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="btn-animate text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-400/30 transition-all duration-300 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
