import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import StatsCard from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Users,
  BarChart3,
  Eye,
  X,
  LogIn,
  LogOut,
  UserCheck,
  UserX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

// Stats card colors for light theme
const getStatsCardColor = (title: string) => {
  const colors = {
    'Total Tasks': 'from-blue-500 to-blue-600',
    'Completed': 'from-green-500 to-green-600', 
    'Pending': 'from-orange-500 to-orange-600',
    'In Progress': 'from-purple-500 to-purple-600',
    'High Priority': 'from-red-500 to-red-600',
    'Performance': 'from-cyan-500 to-cyan-600'
  };
  return colors[title] || 'from-gray-500 to-gray-600';
};

export default function Dashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [timePeriod, setTimePeriod] = useState("monthly"); // weekly, monthly, yearly
  const [selectedEngineer, setSelectedEngineer] = useState<any>(null);
  const [showTasksDialog, setShowTasksDialog] = useState(false);
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'completed' | 'approved' | 'in_progress' | 'pending' | 'cancelled'>('all');
  const [showLoginStatusDialog, setShowLoginStatusDialog] = useState(false);
  const [loginStatusFilter, setLoginStatusFilter] = useState<'all' | 'loggedIn' | 'notLoggedIn'>('all');

  // React Query for users - with caching disabled
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const timestamp = Date.now();
      const res = await fetch(`/api/users?_t=${timestamp}`, { 
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      });
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error('Failed to fetch users');
      }
      return res.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  // React Query for tasks - with caching disabled
  const { data: allTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      const timestamp = Date.now();
      const res = await fetch(`/api/tasks?_t=${timestamp}`, { 
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      });
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error('Failed to fetch tasks');
      }
      return res.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const dataLoading = usersLoading || tasksLoading;

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error('Failed to fetch dashboard stats');
      }
      return res.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const { data: recentTasks, isLoading: recentTasksLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-tasks"],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/recent-tasks', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error('Failed to fetch recent tasks');
      }
      return res.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const completionRate = dashboardStats?.totalTasks > 0 
    ? (dashboardStats.completedTasks / dashboardStats.totalTasks) * 100 
    : 0;

  // Calculate engineer performance statistics
  const getEngineerStats = () => {
    if (!users || users.length === 0 || !allTasks || allTasks.length === 0) {
      console.log('🔍 Dashboard: Missing data', { users: users?.length, allTasks: allTasks?.length });
      return [];
    }

    console.log('🔍 Dashboard: Sample task fields', {
      sampleTask: allTasks[0],
      hasAssignedTo: 'assignedTo' in allTasks[0],
      hasAssigned_to: 'assigned_to' in allTasks[0],
      hasFieldEngineerId: 'fieldEngineerId' in allTasks[0],
      hasField_engineer_id: 'field_engineer_id' in allTasks[0]
    });

    // Include all users regardless of role
    const engineers = users;

    const now = new Date();
    const getFilteredTasks = (userId: number) => {
      let filtered = allTasks.filter((t: any) => 
        t.assignedUser?.id === userId || 
        t.fieldEngineer?.id === userId
      );

      // Apply time period filter
      if (timePeriod === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((t: any) => new Date(t.createdAt) >= weekAgo);
      } else if (timePeriod === 'monthly') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((t: any) => new Date(t.createdAt) >= monthAgo);
      } else if (timePeriod === 'yearly') {
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((t: any) => new Date(t.createdAt) >= yearAgo);
      }

      return filtered;
    };

    return engineers.map((engineer: any) => {
      const engineerTasks = getFilteredTasks(engineer.id);
      const completed = engineerTasks.filter((t: any) => t.status === 'completed').length;
      const approved = engineerTasks.filter((t: any) => t.status === 'approved').length;
      const inProgress = engineerTasks.filter((t: any) => t.status === 'in_progress').length;
      const pending = engineerTasks.filter((t: any) => t.status === 'pending').length;
      const cancelled = engineerTasks.filter((t: any) => t.status === 'cancelled').length;
      const total = engineerTasks.length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        id: engineer.id,
        name: `${engineer.firstName || ''} ${engineer.lastName || ''}`.trim() || engineer.username,
        role: engineer.role,
        total,
        completed,
        approved,
        inProgress,
        pending,
        cancelled,
        completionRate,
      };
    }).sort((a: { total: number }, b: { total: number }) => b.total - a.total);
  };

  const engineerStats = getEngineerStats();

  // Calculate login statistics for today
  const getLoginStats = () => {
    if (!users || users.length === 0) return { loggedInToday: [], notLoggedInToday: [], totalEngineers: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Include engineers, managers, and admins
    const engineers = (users as any[]).filter((u: any) => 
      u.role === 'engineer' || u.role === 'backend_engineer' || u.role === 'field_engineer' || u.role === 'technician' || u.role === 'manager' || u.role === 'admin'
    );

    const loggedInToday: any[] = [];
    const notLoggedInToday: any[] = [];

    engineers.forEach((user: any) => {
      const userLastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
      const loginDate = userLastLogin ? new Date(userLastLogin) : null;
      if (loginDate) {
        loginDate.setHours(0, 0, 0, 0);
      }
      
      const userInfo = {
        id: user.id,
        username: user.username,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        role: user.role,
        lastLogin: user.lastLogin,
        active: user.active
      };

      if (loginDate && loginDate.getTime() === today.getTime()) {
        loggedInToday.push(userInfo);
      } else {
        notLoggedInToday.push(userInfo);
      }
    });

    return {
      loggedInToday,
      notLoggedInToday,
      totalEngineers: engineers.length
    };
  };

  const loginStats = getLoginStats();

  // Navigation function to go to tasks page with status filter
  const navigateToTasks = (status?: string) => {
    if (status) {
      setLocation(`/tasks?status=${status}`);
    } else {
      setLocation('/tasks');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-error/10 text-error';
      case 'medium': return 'bg-warning/10 text-warning';
      case 'low': return 'bg-success/10 text-success';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-success/10 text-success';
      case 'in_progress': return 'bg-info/10 text-info';
      case 'pending': return 'bg-warning/10 text-warning';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header 
        title="Dashboard"
        subtitle="Overview of your performance and tasks"
      />
      
      <div className="p-6 space-y-8">
        {/* Stats Cards - Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
          {statsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full bg-gray-200" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              {/* Total Tasks Card */}
              <Card 
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden relative group"
                onClick={() => navigateToTasks()}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-gray-500 text-sm font-medium mb-1">Total Tasks</p>
                      <p className="text-3xl font-bold text-blue-600">{dashboardStats?.totalTasks || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <ListTodo className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> +12% from last month
                    </span>
                    <span className="text-sm text-blue-600 font-medium group-hover:underline">View details →</span>
                  </div>
                </CardContent>
              </Card>

              {/* Completed Card */}
              <Card 
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden relative group"
                onClick={() => navigateToTasks('completed')}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-gray-500 text-sm font-medium mb-1">Completed</p>
                      <p className="text-3xl font-bold text-green-600">{dashboardStats?.completedTasks || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-sm text-green-600 font-medium">{completionRate.toFixed(1)}% completion rate</span>
                    <span className="text-sm text-green-600 font-medium group-hover:underline">View details →</span>
                  </div>
                </CardContent>
              </Card>

              {/* In Progress Card */}
              <Card 
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden relative group"
                onClick={() => navigateToTasks('in_progress')}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-600"></div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-gray-500 text-sm font-medium mb-1">In Progress</p>
                      <p className="text-3xl font-bold text-amber-600">{dashboardStats?.inProgressTasks || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                      <PlayCircle className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">Active tasks</span>
                    <span className="text-sm text-amber-600 font-medium group-hover:underline">View details →</span>
                  </div>
                </CardContent>
              </Card>

              {/* Cancelled Card */}
              <Card 
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden relative group"
                onClick={() => navigateToTasks('cancelled')}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-gray-500 text-sm font-medium mb-1">Cancelled</p>
                      <p className="text-3xl font-bold text-red-600">{dashboardStats?.cancelledTasks || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">Cancelled tasks</span>
                    <span className="text-sm text-red-600 font-medium group-hover:underline">View details →</span>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Card */}
              <Card 
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden relative group"
                onClick={() => navigateToTasks('pending')}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-gray-500 text-sm font-medium mb-1">Pending</p>
                      <p className="text-3xl font-bold text-orange-600">{dashboardStats?.pendingTasks || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">Pending tasks</span>
                    <span className="text-sm text-orange-600 font-medium group-hover:underline">View details →</span>
                  </div>
                </CardContent>
              </Card>

              {/* Resolved Card */}
              <Card 
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden relative group"
                onClick={() => navigateToTasks('resolved')}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-gray-500 text-sm font-medium mb-1">Resolved</p>
                      <p className="text-3xl font-bold text-emerald-600">{dashboardStats?.resolvedTasks || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">Resolved tasks</span>
                    <span className="text-sm text-emerald-600 font-medium group-hover:underline">View details →</span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Recent Tasks and Performance Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Recent Tasks */}
          <Card className="bg-white rounded-2xl shadow-md border-0 flex flex-col h-[400px]">
            <CardHeader className="border-b-2 border-gray-100 pb-4 flex-shrink-0">
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-blue-600" />
                Recent Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex-1 overflow-hidden flex flex-col">
              {tasksLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full bg-gray-200" />
                  ))}
                </div>
              ) : recentTasks && recentTasks.length > 0 ? (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {recentTasks.map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            task.priority === 'high' ? 'bg-red-500' :
                            task.priority === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`} />
                          <div>
                            <p className="text-base font-semibold text-gray-900">
                              {task.issueType || 'Task'}
                            </p>
                            <p className="text-sm font-medium text-gray-600">
                              {task.customer?.name || 'Unknown Customer'} - {task.ticketNumber}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <Badge className="bg-purple-100 text-purple-700 border border-purple-200 text-sm px-3 py-1">
                            {task.priority}
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-sm px-3 py-1">
                            {task.status?.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold flex-shrink-0"
                    onClick={() => setLocation('/tasks')}
                  >
                    View All Tasks
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <ListTodo className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No recent tasks found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Trend */}
          <Card className="bg-white rounded-2xl shadow-md border-0 flex flex-col h-[400px]">
            <CardHeader className="border-b-2 border-gray-100 pb-4 flex-shrink-0 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Performance Trend
              </CardTitle>
              <Select defaultValue="monthly">
                <SelectTrigger className="w-[120px] h-9 text-sm">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="pt-6 pb-6 flex-1 flex flex-col justify-center">
              <div className="space-y-6">
                {/* Task Completion Rate */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Task Completion Rate</span>
                    <span className="text-sm font-bold text-gray-900">{completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500" 
                      style={{ width: `${Math.min(completionRate, 100)}%` }}
                    />
                  </div>
                </div>
                
                {/* Average Response Time */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Average Response Time</span>
                    <span className="text-sm font-bold text-gray-900">
                      {dashboardStats?.avgResponseTime?.toFixed(1) || "0.0"} hrs
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500" 
                      style={{ width: "76%" }}
                    />
                  </div>
                </div>
                
                {/* Customer Satisfaction */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Customer Satisfaction</span>
                    <span className="text-sm font-bold text-gray-900">4.6/5.0</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-500" 
                      style={{ width: "92%" }}
                    />
                  </div>
                </div>
                
                {/* First Call Resolution */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">First Call Resolution</span>
                    <span className="text-sm font-bold text-gray-900">73.2%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500" 
                      style={{ width: "73.2%" }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Performance Report - Table Style */}
        <Card className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 py-5 px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-white" />
                <h3 className="text-xl font-bold text-white">Team Performance Report</h3>
              </div>
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-[140px] h-10 text-sm bg-white border-gray-300 text-gray-800 hover:bg-gray-50 font-medium shadow-md">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Quarterly</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {dataLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-gray-200" />
                ))}
              </div>
            ) : engineerStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{backgroundColor: '#f1f5f9'}}>
                      <th className="text-left py-4 px-6 text-sm uppercase tracking-wider border-r border-gray-300" style={{color: '#1e293b', fontWeight: 700}}>Team Member</th>
                      <th className="text-center py-4 px-4 text-sm uppercase tracking-wider border-r border-gray-300" style={{color: '#1e293b', fontWeight: 700}}>Total</th>
                      <th className="text-center py-4 px-4 text-sm uppercase tracking-wider border-r border-gray-300" style={{color: '#1e293b', fontWeight: 700}}>Completed</th>
                      <th className="text-center py-4 px-4 text-sm uppercase tracking-wider border-r border-gray-300" style={{color: '#1e293b', fontWeight: 700}}>Approved</th>
                      <th className="text-center py-4 px-4 text-sm uppercase tracking-wider border-r border-gray-300" style={{color: '#1e293b', fontWeight: 700}}>In Progress</th>
                      <th className="text-center py-4 px-4 text-sm uppercase tracking-wider border-r border-gray-300" style={{color: '#1e293b', fontWeight: 700}}>Pending</th>
                      <th className="text-center py-4 px-4 text-sm uppercase tracking-wider border-r border-gray-300" style={{color: '#1e293b', fontWeight: 700}}>Cancelled</th>
                      <th className="text-center py-4 px-6 text-sm uppercase tracking-wider" style={{color: '#1e293b', fontWeight: 700}}>Completion %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {engineerStats.map((engineer, index) => (
                      <tr 
                        key={engineer.id} 
                        className={`border-b-2 border-gray-200 hover:bg-indigo-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <td className="py-4 px-6 border-r-2 border-gray-200">
                          <div 
                            className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              setSelectedEngineer(engineer);
                              setShowTasksDialog(true);
                            }}
                            title={`View all tasks assigned to ${engineer.name}`}
                          >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-base shadow-md">
                              {engineer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-bold text-base text-gray-800 hover:text-indigo-600 hover:underline transition-colors">{engineer.name}</p>
                              <p className="text-sm text-gray-500 capitalize font-medium">{engineer.role.replace('_', ' ')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center py-4 px-4 border-r-2 border-gray-200">
                          <span 
                            className="font-bold text-lg text-gray-800 cursor-pointer hover:text-indigo-600 hover:underline transition-colors"
                            onClick={() => {
                              setSelectedEngineer(engineer);
                              setTaskStatusFilter('all');
                              setShowTasksDialog(true);
                            }}
                            title={`View all ${engineer.total} tasks`}
                          >{engineer.total}</span>
                        </td>
                        <td className="text-center py-4 px-4 border-r-2 border-gray-200">
                          <span 
                            className="font-bold text-lg text-emerald-600 cursor-pointer hover:text-emerald-800 hover:underline transition-colors"
                            onClick={() => {
                              setSelectedEngineer(engineer);
                              setTaskStatusFilter('completed');
                              setShowTasksDialog(true);
                            }}
                            title={`View ${engineer.completed} completed tasks`}
                          >{engineer.completed}</span>
                        </td>
                        <td className="text-center py-4 px-4 border-r-2 border-gray-200">
                          <span 
                            className="font-bold text-lg text-blue-600 cursor-pointer hover:text-blue-800 hover:underline transition-colors"
                            onClick={() => {
                              setSelectedEngineer(engineer);
                              setTaskStatusFilter('approved');
                              setShowTasksDialog(true);
                            }}
                            title={`View ${engineer.approved} approved tasks`}
                          >{engineer.approved}</span>
                        </td>
                        <td className="text-center py-4 px-4 border-r-2 border-gray-200">
                          <span 
                            className="font-bold text-lg text-amber-600 cursor-pointer hover:text-amber-800 hover:underline transition-colors"
                            onClick={() => {
                              setSelectedEngineer(engineer);
                              setTaskStatusFilter('in_progress');
                              setShowTasksDialog(true);
                            }}
                            title={`View ${engineer.inProgress} in-progress tasks`}
                          >{engineer.inProgress}</span>
                        </td>
                        <td className="text-center py-4 px-4 border-r-2 border-gray-200">
                          <span 
                            className="font-bold text-lg text-orange-600 cursor-pointer hover:text-orange-800 hover:underline transition-colors"
                            onClick={() => {
                              setSelectedEngineer(engineer);
                              setTaskStatusFilter('pending');
                              setShowTasksDialog(true);
                            }}
                            title={`View ${engineer.pending} pending tasks`}
                          >{engineer.pending}</span>
                        </td>
                        <td className="text-center py-4 px-4 border-r-2 border-gray-200">
                          <span 
                            className="font-bold text-lg text-red-600 cursor-pointer hover:text-red-800 hover:underline transition-colors"
                            onClick={() => {
                              setSelectedEngineer(engineer);
                              setTaskStatusFilter('cancelled');
                              setShowTasksDialog(true);
                            }}
                            title={`View ${engineer.cancelled} cancelled tasks`}
                          >{engineer.cancelled}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3 justify-center">
                            <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  engineer.completionRate >= 80 ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
                                  engineer.completionRate >= 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                                  'bg-gradient-to-r from-red-500 to-pink-400'
                                }`}
                                style={{ width: `${Math.min(engineer.completionRate, 100)}%` }}
                              />
                            </div>
                            <span className={`font-bold text-base min-w-[55px] text-right ${
                              engineer.completionRate >= 80 ? 'text-emerald-600' :
                              engineer.completionRate >= 50 ? 'text-amber-600' :
                              'text-red-600'
                            }`}>
                              {engineer.completionRate.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No team member data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Engineer Login Status Today */}
        <Card className="bg-white rounded-2xl shadow-md border-0">
          <CardHeader className="border-b-2 border-gray-100 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <LogIn className="w-5 h-5 text-green-600" />
                Engineer Login Status - Today
              </CardTitle>
              <div className="flex items-center gap-3">
                {/* Login Stats Summary */}
                <div className="flex items-center gap-4 mr-4">
                  <div 
                    className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-full cursor-pointer hover:bg-green-200 transition-colors"
                    onClick={() => {
                      setLoginStatusFilter('loggedIn');
                      setShowLoginStatusDialog(true);
                    }}
                  >
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span className="font-bold text-green-700">{loginStats.loggedInToday.length}</span>
                    <span className="text-sm text-green-600">Logged In</span>
                  </div>
                  <div 
                    className="flex items-center gap-2 bg-red-100 px-3 py-1.5 rounded-full cursor-pointer hover:bg-red-200 transition-colors"
                    onClick={() => {
                      setLoginStatusFilter('notLoggedIn');
                      setShowLoginStatusDialog(true);
                    }}
                  >
                    <UserX className="w-4 h-4 text-red-600" />
                    <span className="font-bold text-red-700">{loginStats.notLoggedInToday.length}</span>
                    <span className="text-sm text-red-600">Not Logged In</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setLoginStatusFilter('all');
                    setShowLoginStatusDialog(true);
                  }}
                >
                  View All
                  <Eye className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logged In Today */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Logged In Today ({loginStats.loggedInToday.length})
                </h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {loginStats.loggedInToday.length > 0 ? (
                    loginStats.loggedInToday.map((user: any) => (
                      <div 
                        key={user.id} 
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-green-100 cursor-pointer hover:bg-green-50 transition-colors"
                        onClick={() => {
                          // Find this user in engineerStats and show their tasks
                          const engineerData = engineerStats.find((e: any) => e.id === user.id);
                          if (engineerData) {
                            setSelectedEngineer(engineerData);
                            setShowTasksDialog(true);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center font-bold text-xs">
                            {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm hover:text-green-600 hover:underline">{user.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user.role?.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <span className="text-xs text-green-600">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleTimeString('en-IN', { 
                            hour: '2-digit', 
                            minute: '2-digit'
                          }) : '-'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      <p className="text-sm">No engineers logged in today</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Not Logged In Today */}
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <UserX className="w-5 h-5" />
                  Not Logged In Today ({loginStats.notLoggedInToday.length})
                </h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {loginStats.notLoggedInToday.length > 0 ? (
                    loginStats.notLoggedInToday.map((user: any) => (
                      <div 
                        key={user.id} 
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-red-100 cursor-pointer hover:bg-red-50 transition-colors"
                        onClick={() => {
                          // Find this user in engineerStats and show their tasks
                          const engineerData = engineerStats.find((e: any) => e.id === user.id);
                          if (engineerData) {
                            setSelectedEngineer(engineerData);
                            setShowTasksDialog(true);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-500 text-white flex items-center justify-center font-bold text-xs">
                            {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm hover:text-red-600 hover:underline">{user.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user.role?.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {user.lastLogin ? `Last: ${new Date(user.lastLogin).toLocaleDateString('en-IN', { 
                            day: 'numeric',
                            month: 'short'
                          })}` : 'Never'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      <p className="text-sm">All engineers logged in today!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Dialog for Selected Engineer */}
      <Dialog open={showTasksDialog} onOpenChange={(open) => {
        setShowTasksDialog(open);
        if (!open) setTaskStatusFilter('all');
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                {selectedEngineer?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <span>
                  {taskStatusFilter === 'all' ? 'All Tasks' : 
                   taskStatusFilter === 'completed' ? 'Completed Tasks' :
                   taskStatusFilter === 'approved' ? 'Approved Tasks' :
                   taskStatusFilter === 'in_progress' ? 'In Progress Tasks' :
                   taskStatusFilter === 'pending' ? 'Pending Tasks' :
                   taskStatusFilter === 'cancelled' ? 'Cancelled Tasks' : 'Tasks'} - {selectedEngineer?.name}
                </span>
                <p className="text-sm font-normal text-gray-500 capitalize">{selectedEngineer?.role?.replace('_', ' ')}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto mt-4">
            {selectedEngineer && allTasks ? (
              (() => {
                // Filter tasks for this engineer
                let engineerTasks = (allTasks as any[]).filter((task: any) => {
                  const assignedToMatch = task.assignedUser?.id === selectedEngineer.id;
                  const fieldEngineerMatch = task.fieldEngineer?.id === selectedEngineer.id;
                  return assignedToMatch || fieldEngineerMatch;
                });

                // Apply status filter
                if (taskStatusFilter !== 'all') {
                  engineerTasks = engineerTasks.filter((task: any) => {
                    if (taskStatusFilter === 'in_progress') {
                      return task.status === 'in_progress' || task.status === 'in-progress';
                    }
                    return task.status === taskStatusFilter;
                  });
                }

                if (engineerTasks.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-400">
                      <ListTodo className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No {taskStatusFilter !== 'all' ? taskStatusFilter.replace('_', ' ') : ''} tasks found</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {/* Filter Pills */}
                    <div className="flex gap-2 flex-wrap">
                      {['all', 'completed', 'approved', 'in_progress', 'pending', 'cancelled'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setTaskStatusFilter(status as any)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            taskStatusFilter === status 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {status === 'all' ? 'All' : status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                        </button>
                      ))}
                    </div>

                    {/* Tasks Count */}
                    <p className="text-sm text-gray-500">Showing {engineerTasks.length} task(s)</p>

                    {/* Tasks Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">Ticket #</TableHead>
                            <TableHead className="font-semibold">Title</TableHead>
                            <TableHead className="font-semibold">Customer</TableHead>
                            <TableHead className="font-semibold">Priority</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {engineerTasks.slice(0, 20).map((task: any) => (
                            <TableRow key={task.id} className="hover:bg-gray-50">
                              <TableCell className="font-mono text-sm text-blue-600">
                                {task.ticketNumber}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate" title={task.title}>
                                {task.title}
                              </TableCell>
                              <TableCell className="max-w-[150px] truncate" title={task.customerName}>
                                {task.customerName || task.customer?.name || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={
                                  task.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                                  task.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                  'bg-green-50 text-green-700 border-green-200'
                                }>
                                  {task.priority}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={
                                  task.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                  task.status === 'in_progress' || task.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  task.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  task.status === 'approved' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                  'bg-gray-50 text-gray-700 border-gray-200'
                                }>
                                  {task.status?.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                }) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {engineerTasks.length > 20 && (
                      <p className="text-center text-sm text-gray-500">
                        Showing 20 of {engineerTasks.length} tasks
                      </p>
                    )}

                    {/* View All Button */}
                    <div className="flex justify-center pt-2">
                      <Button 
                        onClick={() => {
                          setShowTasksDialog(false);
                          setLocation(`/tasks?assignedTo=${selectedEngineer.id}`);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View All in Task Management
                      </Button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Status Dialog */}
      <Dialog open={showLoginStatusDialog} onOpenChange={setShowLoginStatusDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <LogIn className="w-6 h-6 text-green-600" />
              <div>
                <span>Engineer Login Status - Today</span>
                <p className="text-sm font-normal text-gray-500">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto mt-4">
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4">
              <Button 
                variant={loginStatusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLoginStatusFilter('all')}
                className={loginStatusFilter === 'all' ? 'bg-blue-600' : ''}
              >
                All ({loginStats.totalEngineers})
              </Button>
              <Button 
                variant={loginStatusFilter === 'loggedIn' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLoginStatusFilter('loggedIn')}
                className={loginStatusFilter === 'loggedIn' ? 'bg-green-600' : ''}
              >
                <UserCheck className="w-4 h-4 mr-1" />
                Logged In ({loginStats.loggedInToday.length})
              </Button>
              <Button 
                variant={loginStatusFilter === 'notLoggedIn' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLoginStatusFilter('notLoggedIn')}
                className={loginStatusFilter === 'notLoggedIn' ? 'bg-red-600' : ''}
              >
                <UserX className="w-4 h-4 mr-1" />
                Not Logged In ({loginStats.notLoggedInToday.length})
              </Button>
            </div>

            {/* Engineers List */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Engineer</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Last Login</TableHead>
                    <TableHead className="font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    let filteredUsers: any[] = [];
                    if (loginStatusFilter === 'loggedIn') {
                      filteredUsers = loginStats.loggedInToday;
                    } else if (loginStatusFilter === 'notLoggedIn') {
                      filteredUsers = loginStats.notLoggedInToday;
                    } else {
                      filteredUsers = [...loginStats.loggedInToday, ...loginStats.notLoggedInToday];
                    }

                    if (filteredUsers.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                            No engineers found for this filter
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return filteredUsers.map((user: any) => {
                      const isLoggedInToday = loginStats.loggedInToday.some((u: any) => u.id === user.id);
                      return (
                        <TableRow key={user.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full ${isLoggedInToday ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-400 to-red-500'} text-white flex items-center justify-center font-bold text-xs`}>
                                {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{user.name}</p>
                                <p className="text-xs text-gray-500">@{user.username}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {user.role?.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isLoggedInToday ? (
                              <Badge className="bg-green-100 text-green-700 border border-green-200">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Logged In
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 border border-red-200">
                                <UserX className="w-3 h-3 mr-1" />
                                Not Logged In
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {user.lastLogin ? (
                              <div>
                                <p>{new Date(user.lastLogin).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}</p>
                                <p className="text-xs">{new Date(user.lastLogin).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</p>
                              </div>
                            ) : (
                              <span className="text-gray-400">Never</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const engineerData = engineerStats.find((e: any) => e.id === user.id);
                                if (engineerData) {
                                  setShowLoginStatusDialog(false);
                                  setSelectedEngineer(engineerData);
                                  setShowTasksDialog(true);
                                }
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Tasks
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
