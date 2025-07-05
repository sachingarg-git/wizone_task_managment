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
  Clock
} from "lucide-react";
import wizoneLogoPath from "@assets/wizone logo_1751691807955.jpg";

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
      { name: "Geofencing", href: "/geofencing", icon: MapPin },
      { name: "Tracking History", href: "/tracking-history", icon: Clock },
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
    <div className="fixed left-0 top-0 h-full w-64 bg-slate-900 shadow-xl z-50">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <img 
            src={wizoneLogoPath} 
            alt="Wizone Logo" 
            className="w-32 h-auto object-contain bg-white/10 p-2 rounded-lg backdrop-blur-sm"
          />
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Button
              key={item.name}
              variant="ghost"
              className={`w-full justify-start space-x-3 font-medium ${
                isActive
                  ? "text-white bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30"
                  : "text-gray-300 hover:bg-slate-800 hover:text-white"
              }`}
              onClick={() => setLocation(item.href)}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Button>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3 px-4 py-3">
          {user?.profileImageUrl ? (
            <img 
              src={user.profileImageUrl} 
              alt="User avatar" 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-400">{user?.role || 'User'}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-400 hover:text-white hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
