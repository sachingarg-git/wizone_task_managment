import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Download, 
  TrendingUp,
  TrendingDown,
  Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Performance() {
  const [timePeriod, setTimePeriod] = useState("30");
  const { toast } = useToast();

  const { data: topPerformers, isLoading: performersLoading } = useQuery({
    queryKey: ["/api/performance/top-performers"],
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

  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
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

  const getRankBadge = (index: number) => {
    if (index === 0) return "bg-yellow-500 text-white";
    if (index === 1) return "bg-gray-400 text-white";
    if (index === 2) return "bg-amber-600 text-white";
    return "bg-gray-200 text-gray-800";
  };

  const getPerformanceScore = (user: any) => {
    const latestMetrics = user.performanceMetrics?.[0];
    return latestMetrics?.performanceScore ? parseFloat(latestMetrics.performanceScore) : 0;
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 75) return "text-warning";
    return "text-error";
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Performance Dashboard"
        subtitle="Track team performance and individual metrics"
      >
        <div className="flex space-x-3">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="365">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </Header>
      
      <div className="p-6 space-y-8">
        {/* Team Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Performance Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              {performersLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : topPerformers && topPerformers.length > 0 ? (
                <div className="space-y-4">
                  {topPerformers.slice(0, 5).map((performer: any, index: number) => {
                    const score = getPerformanceScore(performer);
                    return (
                      <div key={performer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadge(index)}`}>
                            {index + 1}
                          </div>
                          <div className="flex items-center space-x-3">
                            {performer.profileImageUrl ? (
                              <img 
                                src={performer.profileImageUrl} 
                                alt={`${performer.firstName} ${performer.lastName}`}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                  {performer.firstName?.[0]}{performer.lastName?.[0]}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {performer.firstName} {performer.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{performer.department}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${getPerformanceColor(score)}`}>
                            {score.toFixed(1)}
                          </p>
                          <p className="text-sm text-gray-500">Score</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No performance data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Team Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Task Completion Rate</span>
                  <span className="text-sm font-bold text-gray-900">87.5%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-success h-2 rounded-full transition-all duration-300" style={{ width: "87.5%" }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Average Response Time</span>
                  <span className="text-sm font-bold text-gray-900">2.4 hrs</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: "76%" }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Customer Satisfaction</span>
                  <span className="text-sm font-bold text-gray-900">4.6/5.0</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-warning h-2 rounded-full transition-all duration-300" style={{ width: "92%" }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">First Call Resolution</span>
                  <span className="text-sm font-bold text-gray-900">73.2%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: "73.2%" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Individual Performance Scorecard</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : allUsers && allUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Engineer Name</TableHead>
                      <TableHead>Performance %</TableHead>
                      <TableHead>Total Tasks</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Avg Response</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((user: any) => {
                      const latestMetrics = user.performanceMetrics?.[0];
                      const score = getPerformanceScore(user);
                      const totalTasks = latestMetrics?.totalTasks || 0;
                      const completedTasks = latestMetrics?.completedTasks || 0;
                      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                      const avgResponse = latestMetrics?.averageResponseTime ? parseFloat(latestMetrics.averageResponseTime) : 0;
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              {user.profileImageUrl ? (
                                <img 
                                  src={user.profileImageUrl} 
                                  alt={`${user.firstName} ${user.lastName}`}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-600">
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                  </span>
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{user.department}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-success h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${Math.min(completionRate, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {completionRate.toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{totalTasks}</TableCell>
                          <TableCell>{completedTasks}</TableCell>
                          <TableCell>{avgResponse.toFixed(1)}h</TableCell>
                          <TableCell>
                            <span className={`text-lg font-bold ${getPerformanceColor(score)}`}>
                              {score.toFixed(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              {Math.random() > 0.5 ? (
                                <>
                                  <TrendingUp className="w-4 h-4 text-success mr-1" />
                                  <span className="text-success font-medium">+{(Math.random() * 10).toFixed(1)}</span>
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="w-4 h-4 text-error mr-1" />
                                  <span className="text-error font-medium">-{(Math.random() * 5).toFixed(1)}</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No users found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
