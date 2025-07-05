import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  ListTodo, 
  BarChart3, 
  Users, 
  UserCog, 
  LogOut,
  TrendingUp,
  Globe,
  User
} from "lucide-react";

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
      { name: "My Portal", href: "/portal", icon: User },
    ];
  }
};

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const navigation = getNavigationForUser(user?.role || 'engineer');

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <ListTodo className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">TaskFlow</h1>
            <p className="text-sm text-gray-500">Management System</p>
          </div>
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
                  ? "text-primary bg-blue-50 hover:bg-blue-50"
                  : "text-gray-700 hover:bg-gray-100"
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
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 px-4 py-3">
          {user?.profileImageUrl ? (
            <img 
              src={user.profileImageUrl} 
              alt="User avatar" 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500">{user?.role || 'User'}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-600"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
