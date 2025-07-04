import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  Download,
  Calendar,
  Filter,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("30");
  const [selectedMetric, setSelectedMetric] = useState("completion_rate");
  const { toast } = useToast();

  // Analytics queries
  const { data: overviewStats, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ["/api/analytics/overview", timeRange],
  });

  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ["/api/analytics/performance", timeRange, selectedMetric],
  });

  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ["/api/analytics/trends", timeRange],
  });

  const { data: engineerStats, isLoading: engineerLoading } = useQuery({
    queryKey: ["/api/analytics/engineers", timeRange],
  });

  const { data: customerStats, isLoading: customerLoading } = useQuery({
    queryKey: ["/api/analytics/customers", timeRange],
  });

  const handleRefresh = () => {
    refetchOverview();
    toast({
      title: "Data Refreshed",
      description: "Analytics data has been updated",
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="space-y-6">
      <Header 
        title="Analytics & Reporting" 
        subtitle="Advanced insights and performance metrics"
      >
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </Header>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="engineers">Engineers</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {overviewLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : overviewStats ? (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                        <p className="text-2xl font-bold">{overviewStats.totalTasks}</p>
                        <p className="text-xs text-green-600 flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +{overviewStats.taskGrowth}% vs last period
                        </p>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-full">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                        <p className="text-2xl font-bold">{overviewStats.completionRate}%</p>
                        <p className="text-xs text-green-600 flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +{overviewStats.completionGrowth}% improvement
                        </p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-full">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                        <p className="text-2xl font-bold">{formatDuration(overviewStats.avgResponseTime)}</p>
                        <p className="text-xs text-red-600 flex items-center">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          -{overviewStats.responseImprovement}% faster
                        </p>
                      </div>
                      <div className="bg-orange-100 p-3 rounded-full">
                        <Clock className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Engineers</p>
                        <p className="text-2xl font-bold">{overviewStats.activeEngineers}</p>
                        <p className="text-xs text-gray-600">
                          {overviewStats.totalEngineers} total engineers
                        </p>
                      </div>
                      <div className="bg-purple-100 p-3 rounded-full">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>

          {/* Task Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {overviewLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : overviewStats?.statusDistribution ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={overviewStats.statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {overviewStats.statusDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {overviewLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : overviewStats?.priorityDistribution ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={overviewStats.priorityDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Performance Metrics</h3>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completion_rate">Completion Rate</SelectItem>
                <SelectItem value="response_time">Response Time</SelectItem>
                <SelectItem value="resolution_time">Resolution Time</SelectItem>
                <SelectItem value="customer_satisfaction">Customer Satisfaction</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : performanceData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Volume Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : trendsData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="created" stroke="#3B82F6" name="Created" />
                    <Line type="monotone" dataKey="completed" stroke="#10B981" name="Completed" />
                    <Line type="monotone" dataKey="cancelled" stroke="#EF4444" name="Cancelled" />
                  </LineChart>
                </ResponsiveContainer>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engineers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Engineer Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {engineerLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : engineerStats && Array.isArray(engineerStats) ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Engineer</TableHead>
                      <TableHead>Tasks Completed</TableHead>
                      <TableHead>Avg Response Time</TableHead>
                      <TableHead>Performance Score</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {engineerStats.map((engineer: any) => (
                      <TableRow key={engineer.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{engineer.firstName} {engineer.lastName}</p>
                            <p className="text-sm text-gray-600">{engineer.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{engineer.completedTasks}</TableCell>
                        <TableCell>{formatDuration(engineer.avgResponseTime)}</TableCell>
                        <TableCell>
                          <span className={getPerformanceColor(engineer.performanceScore)}>
                            {engineer.performanceScore}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={engineer.isActive ? "default" : "secondary"}>
                            {engineer.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {customerLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : customerStats && Array.isArray(customerStats) ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total Tasks</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Avg Resolution Time</TableHead>
                      <TableHead>Satisfaction</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerStats.map((customer: any) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-gray-600">{customer.city}</p>
                          </div>
                        </TableCell>
                        <TableCell>{customer.totalTasks}</TableCell>
                        <TableCell>{customer.completedTasks}</TableCell>
                        <TableCell>{formatDuration(customer.avgResolutionTime)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span>{customer.satisfaction}/5</span>
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-xs ${i < customer.satisfaction ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}