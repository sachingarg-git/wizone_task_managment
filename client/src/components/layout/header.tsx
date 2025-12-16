import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Bell, Plus, X, CheckCircle, User, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { apiRequest } from "@/lib/queryClient";

interface HeaderProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, children, actions }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch current user for user info box
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user");
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Fetch real notifications from API
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/notifications");
        if (!response.ok) return [];
        return response.json();
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return [];
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/notifications/mark-all-read", {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <header className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border-2 border-white/50 px-8 py-5 mb-6">
      <div className="flex items-center justify-between">
        <div className="page-enter">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 font-medium">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* User Info Box - Shows on all pages */}
          {currentUser && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-4 py-2 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {(currentUser as any)?.firstName?.charAt(0)}{(currentUser as any)?.lastName?.charAt(0)}
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-800">
                    {(currentUser as any)?.firstName} {(currentUser as any)?.lastName}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium capitalize">
                      {(currentUser as any)?.role}
                    </span>
                    <span className="text-gray-400">|</span>
                    <span>ID: {(currentUser as any)?.id}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {actions}
          <Popover open={showNotifications} onOpenChange={setShowNotifications}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5 text-blue-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Notifications</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNotifications(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notification: any) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {(notification.eventType === 'task_created' || notification.eventType === 'task_assigned') && (
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Plus className="w-4 h-4 text-blue-600" />
                                </div>
                              )}
                              {(notification.eventType === 'task_completed' || notification.eventType === 'task_resolved') && (
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </div>
                              )}
                              {notification.eventType === 'task_update' && (
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                  <Clock className="w-4 h-4 text-orange-600" />
                                </div>
                              )}
                              {notification.eventType === 'field_assignment' && (
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-purple-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notification.title || 'Task Notification'}
                                </p>
                                {!notification.read && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                                    New
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message || notification.content || 'No message content'}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatTime(notification.createdAt || notification.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-100 space-y-2">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          size="sm" 
                          className="flex-1 text-center"
                          onClick={handleMarkAllAsRead}
                          disabled={markAllAsReadMutation.isPending || unreadCount === 0}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark All Read
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-1 text-center text-blue-600 hover:text-blue-700"
                          onClick={() => setShowNotifications(false)}
                        >
                          View All
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </PopoverContent>
          </Popover>
          {children}
        </div>
      </div>
    </header>
  );
}
