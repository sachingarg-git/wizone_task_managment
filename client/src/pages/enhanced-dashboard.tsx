import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ListTodo, 
  CheckCircle, 
  Star, 
  Clock, 
  TrendingUp,
  ArrowRight,
  XCircle,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  User,
  LogOut,
  BarChart3,
  Calendar,
  Settings,
  Bell,
  Search,
  Filter,
  Menu,
  Grid3X3,
  List
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";

type DashboardStats = {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  cancelledTasks: number;
  resolvedTasks: number;
  avgResponseTime: number;
  avgPerformanceScore: number;
};

type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
};

type Task = {
  id: number;
  ticketNumber: string;
  title?: string;
  issueType?: string;
  customerName: string | string[];
  priority: string;
  status: string;
  createdAt: string;
};

export default function EnhancedDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: dashboardStats, isLoading: statsLoading, refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const { data: recentTasks, isLoading: tasksLoading, refetch: refetchTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    refetchInterval: 15000, // Refresh more frequently for real-time updates
  });

  const { data: currentUser } = useQuery<UserProfile>({
    queryKey: ["/api/auth/user"],
  });

  // Manual sync function
  const handleSync = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchStats(), refetchTasks()]);
      toast({
        title: "Sync Complete",
        description: "Data refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Unable to refresh data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Navigation function to go to tasks page with status filter
  const navigateToTasks = (status?: string) => {
    if (status) {
      setLocation(`/tasks?status=${status}`);
    } else {
      setLocation('/tasks');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  const completionRate = (dashboardStats?.totalTasks || 0) > 0 
    ? ((dashboardStats?.completedTasks || 0) / (dashboardStats?.totalTasks || 1)) * 100 
    : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Task status cards data
  const taskStatusCards = [
    {
      title: "Open Tasks",
      count: dashboardStats?.pendingTasks || 0,
      icon: ListTodo,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      borderColor: "border-blue-200",
      status: "pending",
      description: "Tasks waiting to be started"
    },
    {
      title: "In Progress",
      count: dashboardStats?.inProgressTasks || 0,
      icon: PlayCircle,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      borderColor: "border-purple-200",
      status: "in_progress",
      description: "Currently active tasks"
    },
    {
      title: "Completed",
      count: dashboardStats?.completedTasks || 0,
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      borderColor: "border-green-200",
      status: "completed",
      description: "Successfully finished tasks"
    },
    {
      title: "Cancelled",
      count: dashboardStats?.cancelledTasks || 0,
      icon: XCircle,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      borderColor: "border-red-200",
      status: "cancelled",
      description: "Cancelled or rejected tasks"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header with Sync and User Profile */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Task Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {currentUser?.firstName} {currentUser?.lastName}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Sync Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSync}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Sync
              </Button>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-md p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              {/* User Profile Menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium text-gray-900">
                      {currentUser?.firstName} {currentUser?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{currentUser?.role?.replace('_', ' ')}</p>
                  </div>
                </Button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {currentUser?.firstName} {currentUser?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{currentUser?.email}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {currentUser?.role?.replace('_', ' ')} • {currentUser?.department}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => setLocation('/profile')}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="w-4 h-4" />
                        Profile Settings
                      </button>
                      
                      <button
                        onClick={() => setLocation('/settings')}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-8">
        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardStats?.totalTasks || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">All time tasks</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {completionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">This month</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardStats?.avgResponseTime?.toFixed(1) || "0.0"}h
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Response time</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Status Cards */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Task Status Overview</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToTasks()}
              className="flex items-center gap-2"
            >
              View All Tasks
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {statsLoading ? (
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'} gap-6`}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="bg-white border-gray-200 shadow-sm">
                  <CardContent className="p-6">
                    <Skeleton className="h-24 w-full bg-gray-200" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'} gap-6`}>
              {taskStatusCards.map((card) => (
                <Card 
                  key={card.status}
                  className={`${card.bgColor} ${card.borderColor} border-2 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 group`}
                  onClick={() => navigateToTasks(card.status)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.bgColor} border ${card.borderColor}`}>
                        <card.icon className={`w-6 h-6 ${card.textColor}`} />
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${card.textColor} border-current bg-white/50`}
                      >
                        {card.count}
                      </Badge>
                    </div>
                    
                    <div>
                      <h3 className={`font-semibold text-lg ${card.textColor} mb-1`}>
                        {card.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {card.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className={`text-2xl font-bold ${card.textColor}`}>
                          {card.count}
                        </div>
                        <ArrowRight className={`w-5 h-5 ${card.textColor} group-hover:translate-x-1 transition-transform`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tasks with Enhanced View */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Recent Task Activity
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                Live Updates
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full bg-gray-200" />
                ))}
              </div>
            ) : recentTasks && recentTasks.length > 0 ? (
              <div className="space-y-4">
                {recentTasks.slice(0, 8).map((task: any) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => navigateToTasks()}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500' :
                        task.priority === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 text-sm">
                            #{task.ticketNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            {task.title || task.issueType || 'Task'}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {Array.isArray(task.customerName) 
                            ? task.customerName[0] || 'Unknown Customer'
                            : task.customerName || 'Unknown Customer'
                          } • {task.createdAt ? format(new Date(task.createdAt), 'MMM dd, hh:mm a') : 'Unknown time'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t border-gray-100">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => navigateToTasks()}
                  >
                    View All Tasks
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ListTodo className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Tasks</h3>
                <p className="text-gray-600 mb-4">No tasks found in your recent activity.</p>
                <Button onClick={() => navigateToTasks()}>
                  View All Tasks
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
}