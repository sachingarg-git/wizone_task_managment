import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import StatsCard from "@/components/ui/stats-card";
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
  PauseCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const { data: recentTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-tasks"],
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const completionRate = dashboardStats?.totalTasks > 0 
    ? (dashboardStats.completedTasks / dashboardStats.totalTasks) * 100 
    : 0;

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
    <div className="min-h-screen bg-slate-900">
      <Header 
        title="Dashboard"
        subtitle="Overview of your performance and tasks"
      />
      
      <div className="p-6 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-full bg-slate-700" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatsCard
                title="Total Tasks"
                value={dashboardStats?.totalTasks?.toString() || "0"}
                icon={ListTodo}
                iconColor="text-blue-400"
                iconBg="bg-blue-600/20"
                trend="+12% from last month"
                trendUp={true}
                clickable={true}
                onClick={() => navigateToTasks()}
              />
              
              <StatsCard
                title="Completed"
                value={dashboardStats?.completedTasks?.toString() || "0"}
                icon={CheckCircle}
                iconColor="text-green-400"
                iconBg="bg-green-600/20"
                trend={`${completionRate.toFixed(1)}% completion rate`}
                trendUp={completionRate > 70}
                clickable={true}
                onClick={() => navigateToTasks('completed')}
              />
              
              <StatsCard
                title="In Progress"
                value={dashboardStats?.inProgressTasks?.toString() || "0"}
                icon={PlayCircle}
                iconColor="text-cyan-400"
                iconBg="bg-cyan-600/20"
                trend="Active tasks"
                trendUp={true}
                clickable={true}
                onClick={() => navigateToTasks('in_progress')}
              />
              
              <StatsCard
                title="Cancelled"
                value={dashboardStats?.cancelledTasks?.toString() || "0"}
                icon={XCircle}
                iconColor="text-red-400"
                iconBg="bg-red-600/20"
                trend="Cancelled tasks"
                trendUp={false}
                clickable={true}
                onClick={() => navigateToTasks('cancelled')}
              />
              
              <StatsCard
                title="Pending"
                value={dashboardStats?.pendingTasks?.toString() || "0"}
                icon={Clock}
                iconColor="text-orange-400"
                iconBg="bg-orange-600/20"
                trend="Pending tasks"
                trendUp={false}
                clickable={true}
                onClick={() => navigateToTasks('pending')}
              />
              
              <StatsCard
                title="Resolved"
                value={dashboardStats?.resolvedTasks?.toString() || "0"}
                icon={CheckCircle}
                iconColor="text-green-400"
                iconBg="bg-green-600/20"
                trend="Resolved tasks"
                trendUp={true}
                clickable={true}
                onClick={() => navigateToTasks('resolved')}
              />
              
              <StatsCard
                title="Performance Score"
                value={dashboardStats?.avgPerformanceScore?.toFixed(1) || "0.0"}
                icon={Star}
                iconColor="text-yellow-400"
                iconBg="bg-yellow-600/20"
                trend="+5.2 points this week"
                trendUp={true}
              />
              
              <StatsCard
                title="Avg Response"
                value={`${dashboardStats?.avgResponseTime?.toFixed(1) || "0.0"}h`}
                icon={Clock}
                iconColor="text-purple-400"
                iconBg="bg-purple-600/20"
                trend="-20min faster than target"
                trendUp={true}
              />
            </>
          )}
        </div>

        {/* Recent ListTodo and Performance Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent ListTodo */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent ListTodo</CardTitle>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full bg-slate-700" />
                  ))}
                </div>
              ) : recentTasks && recentTasks.length > 0 ? (
                <div className="space-y-4">
                  {recentTasks.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                      <div className="flex items-center space-x-4">
                        <div className={`w-2 h-2 rounded-full ${
                          task.priority === 'high' ? 'bg-red-500' :
                          task.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} />
                        <div>
                          <p className="font-medium text-white">
                            {task.issueType || 'Task'}
                          </p>
                          <p className="text-sm text-gray-300">
                            {task.customer?.name || 'Unknown Customer'} - {task.ticketNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-purple-600/20 text-purple-300 border border-purple-500/30">
                          {task.priority}
                        </Badge>
                        <Badge className="bg-blue-600/20 text-blue-300 border border-blue-500/30">
                          {task.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full mt-4 text-gray-300 hover:text-white hover:bg-slate-700">
                    View All ListTodo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <ListTodo className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                  <p>No recent tasks found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Trend */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Performance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-300">Task Completion Rate</span>
                    <span className="text-sm font-bold text-white">{completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(completionRate, 100)}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-300">Average Response Time</span>
                    <span className="text-sm font-bold text-white">
                      {dashboardStats?.avgResponseTime?.toFixed(1) || "0.0"} hrs
                    </span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: "76%" }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-300">Customer Satisfaction</span>
                    <span className="text-sm font-bold text-white">4.6/5.0</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full transition-all duration-300" style={{ width: "92%" }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-300">First Call Resolution</span>
                    <span className="text-sm font-bold text-white">73.2%</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full transition-all duration-300" style={{ width: "73.2%" }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
