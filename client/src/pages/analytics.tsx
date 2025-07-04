import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
  Filter,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

interface AnalyticsOverview {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  avgResponseTime: number;
  activeEngineers: number;
  totalEngineers: number;
  taskGrowth: number;
  completionGrowth: number;
  responseImprovement: number;
  statusDistribution: Array<{ name: string; value: number }>;
  priorityDistribution: Array<{ name: string; value: number }>;
}

interface PerformanceData {
  date: string;
  value: number;
}

interface TrendsData {
  date: string;
  created: number;
  completed: number;
  cancelled: number;
}

interface EngineerStats {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  completedTasks: number;
  totalTasks: number;
  avgResponseTime: number;
  performanceScore: number;
  isActive: boolean;
}

interface CustomerStats {
  id: number;
  name: string;
  city: string;
  totalTasks: number;
  completedTasks: number;
  avgResolutionTime: number;
  satisfaction: number;
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("30");
  const [selectedMetric, setSelectedMetric] = useState("completion_rate");
  const { toast } = useToast();

  // Analytics queries with proper typing
  const { data: overviewStats, isLoading: overviewLoading, refetch: refetchOverview } = useQuery<AnalyticsOverview>({
    queryKey: [`/api/analytics/overview?timeRange=${timeRange}`],
  });

  const { data: performanceData, isLoading: performanceLoading } = useQuery<PerformanceData[]>({
    queryKey: [`/api/analytics/performance?timeRange=${timeRange}&metric=${selectedMetric}`],
  });

  const { data: trendsData, isLoading: trendsLoading } = useQuery<TrendsData[]>({
    queryKey: [`/api/analytics/trends?timeRange=${timeRange}`],
  });

  const { data: engineerStats, isLoading: engineerLoading } = useQuery<EngineerStats[]>({
    queryKey: [`/api/analytics/engineers?timeRange=${timeRange}`],
  });

  const { data: customerStats, isLoading: customerLoading } = useQuery<CustomerStats[]>({
    queryKey: [`/api/analytics/customers?timeRange=${timeRange}`],
  });

  const refreshAllData = () => {
    refetchOverview();
    toast({
      title: "Data Refreshed",
      description: "Analytics data has been updated",
    });
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'completion_rate': return 'Completion Rate (%)';
      case 'response_time': return 'Response Time (minutes)';
      case 'resolution_time': return 'Resolution Time (minutes)';
      case 'customer_satisfaction': return 'Customer Satisfaction (1-5)';
      default: return 'Value';
    }
  };

  // Default values for when data is loading or undefined
  const safeOverviewStats = overviewStats || {
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    avgResponseTime: 0,
    activeEngineers: 0,
    totalEngineers: 0,
    taskGrowth: 0,
    completionGrowth: 0,
    responseImprovement: 0,
    statusDistribution: [],
    priorityDistribution: []
  };

  const safePerformanceData = performanceData || [];
  const safeTrendsData = trendsData || [];
  const safeEngineerStats = engineerStats || [];
  const safeCustomerStats = customerStats || [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1">
        <Header
          title="Analytics Dashboard"
          subtitle="Comprehensive system insights and performance metrics"
        >
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={refreshAllData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </Header>

        <div className="p-6">
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
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">Total Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{safeOverviewStats.totalTasks}</div>
                    <p className="text-xs text-muted-foreground">
                      <TrendingUp className="h-4 w-4 inline mr-1" />
                      +{safeOverviewStats.taskGrowth}% from last period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{safeOverviewStats.completionRate}%</div>
                    <p className="text-xs text-muted-foreground">
                      <TrendingUp className="h-4 w-4 inline mr-1" />
                      +{safeOverviewStats.completionGrowth}% improvement
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">Avg Response Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{safeOverviewStats.avgResponseTime}m</div>
                    <p className="text-xs text-muted-foreground">
                      <TrendingDown className="h-4 w-4 inline mr-1" />
                      -{safeOverviewStats.responseImprovement}% faster
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">Active Engineers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {safeOverviewStats.activeEngineers}/{safeOverviewStats.totalEngineers}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <Users className="h-4 w-4 inline mr-1" />
                      Currently working on tasks
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Task Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {safeOverviewStats.statusDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={safeOverviewStats.statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {safeOverviewStats.statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Priority Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {safeOverviewStats.priorityDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={safeOverviewStats.priorityDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Performance Metrics
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
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {safePerformanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={safePerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#8884d8" 
                          strokeWidth={2}
                          name={getMetricLabel(selectedMetric)}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-gray-500">
                      No performance data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Task Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  {safeTrendsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={safeTrendsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="created" stackId="1" stroke="#8884d8" fill="#8884d8" name="Created" />
                        <Area type="monotone" dataKey="completed" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Completed" />
                        <Area type="monotone" dataKey="cancelled" stackId="1" stroke="#ffc658" fill="#ffc658" name="Cancelled" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-gray-500">
                      No trends data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engineers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Engineer Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Engineer</TableHead>
                        <TableHead>Tasks Completed</TableHead>
                        <TableHead>Total Tasks</TableHead>
                        <TableHead>Completion Rate</TableHead>
                        <TableHead>Avg Response Time</TableHead>
                        <TableHead>Performance Score</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {safeEngineerStats.map((engineer) => (
                        <TableRow key={engineer.id}>
                          <TableCell className="font-medium">
                            {engineer.firstName} {engineer.lastName}
                          </TableCell>
                          <TableCell>{engineer.completedTasks}</TableCell>
                          <TableCell>{engineer.totalTasks}</TableCell>
                          <TableCell>
                            {engineer.totalTasks > 0 
                              ? Math.round((engineer.completedTasks / engineer.totalTasks) * 100)
                              : 0
                            }%
                          </TableCell>
                          <TableCell>{Math.round(engineer.avgResponseTime)}m</TableCell>
                          <TableCell>{Math.round(engineer.performanceScore)}</TableCell>
                          <TableCell>
                            <Badge variant={engineer.isActive ? "default" : "secondary"}>
                              {engineer.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {safeEngineerStats.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No engineer data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Total Tasks</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Completion Rate</TableHead>
                        <TableHead>Avg Resolution Time</TableHead>
                        <TableHead>Satisfaction</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {safeCustomerStats.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.city}</TableCell>
                          <TableCell>{customer.totalTasks}</TableCell>
                          <TableCell>{customer.completedTasks}</TableCell>
                          <TableCell>
                            {customer.totalTasks > 0 
                              ? Math.round((customer.completedTasks / customer.totalTasks) * 100)
                              : 0
                            }%
                          </TableCell>
                          <TableCell>{Math.round(customer.avgResolutionTime)}m</TableCell>
                          <TableCell>
                            <Badge variant={customer.satisfaction >= 4 ? "default" : "secondary"}>
                              {customer.satisfaction.toFixed(1)}/5
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {safeCustomerStats.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No customer data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}