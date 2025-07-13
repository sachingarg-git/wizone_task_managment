import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Plus, X, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";

interface HeaderProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, children, actions }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Mock notifications - in real app, this would come from API
  const notifications = [
    {
      id: 1,
      title: "New Task Assigned",
      message: "Task T000012 has been assigned to you",
      type: "task",
      time: "2 min ago",
      read: false
    },
    {
      id: 2,
      title: "Task Completed",
      message: "Customer CUST001 task has been completed",
      type: "completion",
      time: "5 min ago",
      read: false
    },
    {
      id: 3,
      title: "System Update",
      message: "New features available in task management",
      type: "system",
      time: "1 hour ago",
      read: true
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-2xl border-b border-blue-500/30 px-6 py-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="page-enter">
          <h1 className="text-2xl font-bold text-white drop-shadow-sm">{title}</h1>
          <p className="text-blue-100 font-medium">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {children}
          <Popover open={showNotifications} onOpenChange={setShowNotifications}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="btn-animate relative text-white hover:text-blue-100 hover:bg-white/20 rounded-lg transition-all duration-300 border border-white/20"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center pulse-glow border border-white">
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
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => {
                            // Handle notification click based on type
                            if (notification.type === 'task') {
                              // Use window.location for proper navigation
                              window.location.href = '/portal';
                            } else if (notification.type === 'completion') {
                              window.location.href = '/portal';
                            } else if (notification.type === 'system') {
                              // Handle system notifications
                              window.location.href = '/portal';
                            }
                            setShowNotifications(false);
                          }}
                          className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {notification.type === 'task' && (
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Plus className="w-4 h-4 text-blue-600" />
                                </div>
                              )}
                              {notification.type === 'completion' && (
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </div>
                              )}
                              {notification.type === 'system' && (
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                  <Bell className="w-4 h-4 text-purple-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                                    New
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-100">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-center text-blue-600 hover:text-blue-700"
                        onClick={() => {
                          window.location.href = '/portal';
                          setShowNotifications(false);
                        }}
                      >
                        View All Notifications
                      </Button>
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
