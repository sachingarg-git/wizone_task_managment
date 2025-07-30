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
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Dashboard"
        subtitle="Overview of your performance and tasks"
      />
      
      <div className="p-6 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-full bg-gray-200" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatsCard
                title="Total Tasks"
                value={dashboardStats?.totalTasks?.toString() || "0"}
                icon={ListTodo}
                iconColor="text-blue-500"
                iconBg="bg-blue-500/10"
                trend="+12% from last month"
                trendUp={true}
                clickable={true}
                onClick={() => navigateToTasks()}
              />
              
              <StatsCard
                title="Completed"
                value={dashboardStats?.completedTasks?.toString() || "0"}
                icon={CheckCircle}
                iconColor="text-green-500"
                iconBg="bg-green-500/10"
                trend={`${completionRate.toFixed(1)}% completion rate`}
                trendUp={completionRate > 70}
                clickable={true}
                onClick={() => navigateToTasks('completed')}
              />
              
              <StatsCard
                title="In Progress"
                value={dashboardStats?.inProgressTasks?.toString() || "0"}
                icon={PlayCircle}
                iconColor="text-purple-500"
                iconBg="bg-purple-500/10"
                trend="Active tasks"
                trendUp={true}
                clickable={true}
                onClick={() => navigateToTasks('in_progress')}
              />
              
              <StatsCard
                title="Cancelled"
                value={dashboardStats?.cancelledTasks?.toString() || "0"}
                icon={XCircle}
                iconColor="text-red-500"
                iconBg="bg-red-500/10"
                trend="Cancelled tasks"
                trendUp={false}
                clickable={true}
                onClick={() => navigateToTasks('cancelled')}
              />
              
              <StatsCard
                title="Pending"
                value={dashboardStats?.pendingTasks?.toString() || "0"}
                icon={Clock}
                iconColor="text-orange-500"
                iconBg="bg-orange-500/10"
                trend="Pending tasks"
                trendUp={false}
                clickable={true}
                onClick={() => navigateToTasks('pending')}
              />
              
              <StatsCard
                title="Resolved"
                value={dashboardStats?.resolvedTasks?.toString() || "0"}
                icon={CheckCircle}
                iconColor="text-emerald-500"
                iconBg="bg-emerald-500/10"
                trend="Resolved tasks"
                trendUp={true}
                clickable={true}
                onClick={() => navigateToTasks('resolved')}
              />
              
              <StatsCard
                title="Performance Score"
                value={dashboardStats?.avgPerformanceScore?.toFixed(1) || "0.0"}
                icon={Star}
                iconColor="text-yellow-500"
                iconBg="bg-yellow-500/10"
                trend="+5.2 points this week"
                trendUp={true}
              />
              
              <StatsCard
                title="Avg Response"
                value={`${dashboardStats?.avgResponseTime?.toFixed(1) || "0.0"}h`}
                icon={Clock}
                iconColor="text-indigo-500"
                iconBg="bg-indigo-500/10"
                trend="-20min faster than target"
                trendUp={true}
              />
            </>
          )}
        </div>

        {/* Recent Tasks and Performance Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tasks */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-blue-500" />
                Recent Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full bg-gray-200" />
                  ))}
                </div>
              ) : recentTasks && recentTasks.length > 0 ? (
                <div className="space-y-4">
                  {recentTasks.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-2 h-2 rounded-full ${
                          task.priority === 'high' ? 'bg-red-500' :
                          task.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900">
                            {task.issueType || 'Task'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {task.customer?.name || 'Unknown Customer'} - {task.ticketNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-purple-100 text-purple-700 border border-purple-200">
                          {task.priority}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
                          {task.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-4 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400">
                    View All Tasks
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ListTodo className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No recent tasks found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Trend */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Performance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Task Completion Rate</span>
                    <span className="text-sm font-bold text-gray-900">{completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(completionRate, 100)}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Average Response Time</span>
                    <span className="text-sm font-bold text-gray-900">
                      {dashboardStats?.avgResponseTime?.toFixed(1) || "0.0"} hrs
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: "76%" }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Customer Satisfaction</span>
                    <span className="text-sm font-bold text-gray-900">4.6/5.0</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full transition-all duration-300" style={{ width: "92%" }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">First Call Resolution</span>
                    <span className="text-sm font-bold text-gray-900">73.2%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
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
