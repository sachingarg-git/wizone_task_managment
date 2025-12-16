import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  TableRow 
} from "@/components/ui/table";
import { 
  Download, 
  TrendingUp,
  TrendingDown,
  Award,
  Eye,
  ListTodo,
  LogIn,
  UserCheck,
  UserX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Performance() {
  const [timePeriod, setTimePeriod] = useState("30");
  const [, setLocation] = useLocation();
  const [selectedEngineer, setSelectedEngineer] = useState<any>(null);
  const [showTasksDialog, setShowTasksDialog] = useState(false);
  const [showLoginStatusDialog, setShowLoginStatusDialog] = useState(false);
  const [loginStatusFilter, setLoginStatusFilter] = useState<'all' | 'loggedIn' | 'notLoggedIn'>('all');
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

  // Fetch all tasks for engineer dialog
  const { data: allTasks } = useQuery({
    queryKey: ["/api/tasks"],
  });

  // Calculate login statistics for today
  const getLoginStats = () => {
    if (!allUsers) return { loggedInToday: [], notLoggedInToday: [], totalEngineers: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Include engineers, managers, and admins
    const engineers = (allUsers as any[]).filter((u: any) => 
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
                    const score = performer.calculatedPerformanceScore || getPerformanceScore(performer);
                    const totalTasks = performer.totalTasksCount || 0;
                    const completedTasks = performer.completedTasksCount || 0;
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
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {performer.firstName?.[0]}{performer.lastName?.[0]}
                                </span>
                              </div>
                            )}
                            <div 
                              className="cursor-pointer"
                              onClick={() => {
                                setSelectedEngineer({
                                  id: performer.id,
                                  name: `${performer.firstName || ''} ${performer.lastName || ''}`.trim() || performer.username,
                                  role: performer.role,
                                  total: totalTasks,
                                  completed: completedTasks
                                });
                                setShowTasksDialog(true);
                              }}
                              title={`View all tasks assigned to ${performer.firstName} ${performer.lastName}`}
                            >
                              <p className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                                {performer.firstName} {performer.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {totalTasks > 0 ? `${completedTasks}/${totalTasks} tasks` : 'No tasks'}
                              </p>
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
              {(() => {
                // Calculate team-wide metrics from allUsers data
                const users = allUsers || [];
                const totalTasks = users.reduce((sum: number, u: any) => sum + (u.totalTasksCount || 0), 0);
                const completedTasks = users.reduce((sum: number, u: any) => sum + (u.completedTasksCount || 0), 0);
                const resolvedTasks = users.reduce((sum: number, u: any) => sum + (u.resolvedTasksCount || 0), 0);
                const finishedTasks = completedTasks + resolvedTasks;
                const completionRate = totalTasks > 0 ? (finishedTasks / totalTasks) * 100 : 0;
                
                const avgResponseTimes = users.filter((u: any) => u.avgResponseTime > 0).map((u: any) => u.avgResponseTime);
                const avgResponseTime = avgResponseTimes.length > 0 
                  ? avgResponseTimes.reduce((sum: number, t: number) => sum + t, 0) / avgResponseTimes.length 
                  : 0;
                const responseTimeScore = Math.max(0, Math.min(100, 100 - (avgResponseTime * 10))); // Lower is better
                
                return (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Task Completion Rate</span>
                        <span className="text-sm font-bold text-gray-900">{completionRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-success h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(completionRate, 100)}%` }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Average Response Time</span>
                        <span className="text-sm font-bold text-gray-900">{avgResponseTime.toFixed(1)} hrs</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${responseTimeScore}%` }} />
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
                        <span className="text-sm font-bold text-gray-900">{completionRate > 0 ? Math.min(completionRate + 10, 100).toFixed(1) : '0.0'}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(completionRate + 10, 100)}%` }} />
                      </div>
                    </div>
                  </>
                );
              })()}
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
                      <TableHead>Resolved</TableHead>
                      <TableHead>Avg Response</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((user: any) => {
                      // Use directly calculated values from backend
                      const totalTasks = user.totalTasksCount || user.performanceMetrics?.[0]?.totalTasks || 0;
                      const completedTasks = user.completedTasksCount || user.performanceMetrics?.[0]?.completedTasks || 0;
                      const resolvedTasks = user.resolvedTasksCount || 0;
                      const avgResponse = user.avgResponseTime || (user.performanceMetrics?.[0]?.averageResponseTime ? parseFloat(user.performanceMetrics[0].averageResponseTime) : 0);
                      const score = user.calculatedPerformanceScore || getPerformanceScore(user);
                      const completionRate = totalTasks > 0 ? ((completedTasks + resolvedTasks) / totalTasks) * 100 : 0;
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div 
                              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                setSelectedEngineer({
                                  id: user.id,
                                  name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
                                  role: user.role,
                                  total: totalTasks,
                                  completed: completedTasks,
                                  resolved: resolvedTasks
                                });
                                setShowTasksDialog(true);
                              }}
                              title={`View all tasks assigned to ${user.firstName} ${user.lastName}`}
                            >
                              {user.profileImageUrl ? (
                                <img 
                                  src={user.profileImageUrl} 
                                  alt={`${user.firstName} ${user.lastName}`}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-white">
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                  </span>
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
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
                          <TableCell>{resolvedTasks}</TableCell>
                          <TableCell>{avgResponse.toFixed(1)}h</TableCell>
                          <TableCell>
                            <span className={`text-lg font-bold ${getPerformanceColor(score)}`}>
                              {score.toFixed(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              {score >= 50 ? (
                                <>
                                  <TrendingUp className="w-4 h-4 text-success mr-1" />
                                  <span className="text-success font-medium">+{(score / 10).toFixed(1)}</span>
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="w-4 h-4 text-error mr-1" />
                                  <span className="text-error font-medium">-{((100 - score) / 10).toFixed(1)}</span>
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

        {/* Engineer Login Status Today */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
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
          <CardContent>
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
                          setSelectedEngineer({
                            id: user.id,
                            name: user.name,
                            role: user.role
                          });
                          setShowTasksDialog(true);
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
                          setSelectedEngineer({
                            id: user.id,
                            name: user.name,
                            role: user.role
                          });
                          setShowTasksDialog(true);
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
      <Dialog open={showTasksDialog} onOpenChange={setShowTasksDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                {selectedEngineer?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <span>Tasks Assigned to {selectedEngineer?.name}</span>
                <p className="text-sm font-normal text-gray-500 capitalize">{selectedEngineer?.role?.replace('_', ' ')}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto mt-4">
            {selectedEngineer && allTasks ? (
              (() => {
                // Filter tasks for this engineer
                const engineerTasks = (allTasks as any[]).filter((task: any) => {
                  const assignedToMatch = task.assignedTo === selectedEngineer.id || 
                    String(task.assignedTo) === String(selectedEngineer.id) ||
                    task.assigned_to === selectedEngineer.id ||
                    String(task.assigned_to) === String(selectedEngineer.id);
                  const fieldEngineerMatch = task.fieldEngineerId === selectedEngineer.id ||
                    String(task.fieldEngineerId) === String(selectedEngineer.id) ||
                    task.field_engineer_id === selectedEngineer.id ||
                    String(task.field_engineer_id) === String(selectedEngineer.id);
                  return assignedToMatch || fieldEngineerMatch;
                });

                if (engineerTasks.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-400">
                      <ListTodo className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No tasks assigned to this user</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600">{engineerTasks.length}</p>
                        <p className="text-xs text-gray-600">Total</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {engineerTasks.filter((t: any) => t.status === 'completed').length}
                        </p>
                        <p className="text-xs text-gray-600">Completed</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-amber-600">
                          {engineerTasks.filter((t: any) => t.status === 'in_progress' || t.status === 'in-progress').length}
                        </p>
                        <p className="text-xs text-gray-600">In Progress</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-orange-600">
                          {engineerTasks.filter((t: any) => t.status === 'pending').length}
                        </p>
                        <p className="text-xs text-gray-600">Pending</p>
                      </div>
                    </div>

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
                                setShowLoginStatusDialog(false);
                                setSelectedEngineer({
                                  id: user.id,
                                  name: user.name,
                                  role: user.role
                                });
                                setShowTasksDialog(true);
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
