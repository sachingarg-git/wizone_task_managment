import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText,
  Eye,
  Edit,
  Save,
  X,
  Upload,
  Camera,
  Trash2,
  Image,
  Download,
  RefreshCw,
  MessageCircle,
  ArrowRight,
  Signal,
  Wifi,
  Activity
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

export default function Portal() {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [showNetworkMonitoring, setShowNetworkMonitoring] = useState(false);
  const [updateNotes, setUpdateNotes] = useState("");
  const [taskStatus, setTaskStatus] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadNotes, setUploadNotes] = useState("");
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks/my-tasks"],
    enabled: !!user,
  });

  const { data: taskUpdates } = useQuery({
    queryKey: [`/api/tasks/${selectedTaskId}/updates`],
    enabled: !!selectedTaskId && !isNaN(selectedTaskId),
  });

  // Task update mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my-tasks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${selectedTaskId}/updates`] });
      handleCloseModal();
      toast({
        title: "Task Updated",
        description: "Task has been updated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Update task error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });

  // Sync mutation for refreshing data
  const syncTasksMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/tasks/sync", {}),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my-tasks"] });
      toast({
        title: "Data Synced",
        description: `Successfully synced tasks`,
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync task data",
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const tasksArray = Array.isArray(tasks) ? tasks : [];
  
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      case 'critical': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // No need to filter since the API already filters by user
  const myTasks = tasksArray;

  const statsData = {
    total: myTasks.length,
    pending: myTasks.filter(t => t.status === 'pending').length,
    inProgress: myTasks.filter(t => t.status === 'in_progress').length,
    completed: myTasks.filter(t => t.status === 'completed' || t.status === 'resolved').length,
  };

  const handleTaskIdClick = (task: any) => {
    setSelectedTaskId(task.id);
  };

  const handleCloseModal = () => {
    setSelectedTaskId(null);
    setUpdateNotes("");
    setTaskStatus("");
    setUploadFiles([]);
    setUploadNotes("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTask = () => {
    if (!selectedTaskId) return;
    
    // Validation for completed status
    if (taskStatus === 'completed' && !updateNotes.trim()) {
      toast({
        title: "Resolution Required",
        description: "Please provide resolution notes when marking task as completed",
        variant: "destructive",
      });
      return;
    }
    
    const updateData: any = {};
    if (taskStatus) updateData.status = taskStatus;
    if (updateNotes.trim()) {
      updateData.notes = updateNotes.trim();
      // Also update description if it's general notes
      if (taskStatus !== 'completed') {
        updateData.description = updateNotes.trim();
      }
    }
    
    // Handle file uploads if any
    if (uploadFiles.length > 0) {
      const formData = new FormData();
      uploadFiles.forEach(file => formData.append('files', file));
      if (uploadNotes.trim()) formData.append('notes', uploadNotes.trim());
      
      // First upload files, then update task
      uploadFilesMutation.mutate({
        taskId: selectedTaskId,
        formData
      });
    } else {
      updateTaskMutation.mutate({ 
        id: selectedTaskId, 
        data: updateData 
      });
    }
  };

  // File upload mutation
  const uploadFilesMutation = useMutation({
    mutationFn: ({ taskId, formData }: { taskId: number; formData: FormData }) =>
      fetch(`/api/tasks/${taskId}/files`, {
        method: 'POST',
        body: formData,
      }).then(res => res.json()),
    onSuccess: () => {
      // After files are uploaded, update the task if needed
      if (taskStatus || updateNotes.trim()) {
        const updateData: any = {};
        if (taskStatus) updateData.status = taskStatus;
        if (updateNotes.trim()) {
          updateData.notes = updateNotes.trim();
          if (taskStatus !== 'completed') {
            updateData.description = updateNotes.trim();
          }
        }
        updateTaskMutation.mutate({ 
          id: selectedTaskId!, 
          data: updateData 
        });
      } else {
        // Just files uploaded, refresh and close
        queryClient.invalidateQueries({ queryKey: ["/api/tasks/my-tasks"] });
        queryClient.invalidateQueries({ queryKey: [`/api/tasks/${selectedTaskId}/updates`] });
        handleCloseModal();
        toast({
          title: "Files Uploaded",
          description: "Files have been uploaded successfully",
        });
      }
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload files",
        variant: "destructive",
      });
    },
  });

  // Network Monitoring Component
  const NetworkMonitoringModule = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [selectedTower, setSelectedTower] = useState(null);
    
    // Fetch network data from API endpoints
    const { data: towers = [], isLoading: towersLoading } = useQuery({
      queryKey: ["/api/network/towers"],
      enabled: showNetworkMonitoring,
      refetchInterval: 30000, // Refresh every 30 seconds
    });

    const { data: networkStats = {}, isLoading: statsLoading } = useQuery({
      queryKey: ["/api/network/stats"],
      enabled: showNetworkMonitoring,
      refetchInterval: 15000, // Refresh every 15 seconds
    });

    const { data: networkAlerts = [], isLoading: alertsLoading } = useQuery({
      queryKey: ["/api/network/alerts"],
      enabled: showNetworkMonitoring,
      refetchInterval: 10000, // Refresh every 10 seconds
    });

    const { data: monitoringLogs = [], isLoading: logsLoading } = useQuery({
      queryKey: ["/api/network/monitoring-logs"],
      enabled: showNetworkMonitoring,
      refetchInterval: 20000, // Refresh every 20 seconds
    });

    const { data: networkDevices = [], isLoading: devicesLoading } = useQuery({
      queryKey: ["/api/network/devices"],
      enabled: showNetworkMonitoring,
      refetchInterval: 60000, // Refresh every minute
    });

    const { data: analytics = {}, isLoading: analyticsLoading } = useQuery({
      queryKey: ["/api/network/analytics"],
      enabled: showNetworkMonitoring,
      refetchInterval: 300000, // Refresh every 5 minutes
    });

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'online': return 'text-green-600 bg-green-50';
        case 'warning': return 'text-yellow-600 bg-yellow-50';
        case 'offline': return 'text-red-600 bg-red-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'online': return <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>;
        case 'warning': return <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>;
        case 'offline': return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
        default: return <div className="w-3 h-3 bg-gray-500 rounded-full"></div>;
      }
    };

    return (
      <Dialog open={showNetworkMonitoring} onOpenChange={setShowNetworkMonitoring}>
        <DialogContent className="w-full max-w-7xl h-[95vh] max-h-[90vh] overflow-hidden mx-2 rounded-lg border bg-white">
          <DialogHeader className="p-6 bg-gradient-to-r from-green-50 to-emerald-100 border-b sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <Signal className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-gray-900">
                      WIZONE Network Monitoring & Feasibility Tool
                    </DialogTitle>
                    <p className="text-sm text-green-700 font-medium">
                      Real-time Tower Management & Performance Analytics
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                    <Activity className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">Live Monitoring</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNetworkMonitoring(false)} 
                className="h-10 w-10 p-0 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-full shadow-sm"
              >
                <X className="w-5 h-5 text-gray-600 hover:text-red-600" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-6 bg-gray-100 border shadow-sm h-auto p-2 mx-6 mt-4 rounded-lg">
                <TabsTrigger value="dashboard" className="text-sm py-3 font-semibold data-[state=active]:bg-green-500 data-[state=active]:text-white">
                  <Activity className="w-4 h-4 mr-2" />Dashboard
                </TabsTrigger>
                <TabsTrigger value="towers" className="text-sm py-3 font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  <Signal className="w-4 h-4 mr-2" />Towers
                </TabsTrigger>
                <TabsTrigger value="monitoring" className="text-sm py-3 font-semibold data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                  <Wifi className="w-4 h-4 mr-2" />Monitoring
                </TabsTrigger>
                <TabsTrigger value="analytics" className="text-sm py-3 font-semibold data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                  <FileText className="w-4 h-4 mr-2" />Analytics
                </TabsTrigger>
                <TabsTrigger value="alerts" className="text-sm py-3 font-semibold data-[state=active]:bg-red-500 data-[state=active]:text-white">
                  <AlertCircle className="w-4 h-4 mr-2" />Alerts
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-sm py-3 font-semibold data-[state=active]:bg-gray-500 data-[state=active]:text-white">
                  <Edit className="w-4 h-4 mr-2" />Settings
                </TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="space-y-6 mt-0">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-600 text-sm font-medium">Total Towers</p>
                            <p className="text-2xl font-bold text-green-700">
                              {statsLoading ? '...' : networkStats.totalTowers || 0}
                            </p>
                          </div>
                          <Signal className="w-8 h-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-blue-50 to-cyan-100 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-600 text-sm font-medium">Online Towers</p>
                            <p className="text-2xl font-bold text-blue-700">
                              {statsLoading ? '...' : networkStats.onlineTowers || 0}
                            </p>
                          </div>
                          <Wifi className="w-8 h-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-yellow-50 to-orange-100 border-yellow-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-yellow-600 text-sm font-medium">Active Alerts</p>
                            <p className="text-2xl font-bold text-yellow-700">
                              {alertsLoading ? '...' : networkAlerts.length || 0}
                            </p>
                          </div>
                          <AlertCircle className="w-8 h-8 text-yellow-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-purple-50 to-indigo-100 border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-600 text-sm font-medium">Avg Uptime</p>
                            <p className="text-2xl font-bold text-purple-700">
                              {statsLoading ? '...' : networkStats.avgUptime || '0%'}
                            </p>
                          </div>
                          <Activity className="w-8 h-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Status Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-green-600" />
                        <span>Tower Status Overview</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {towersLoading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-32 w-full" />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {towers.map(tower => (
                            <Card key={tower.id} className="border-l-4 border-l-green-500">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="font-semibold text-gray-900">{tower.name}</h3>
                                  <div className="flex items-center space-x-2">
                                    {getStatusIcon(tower.status)}
                                    <Badge className={`text-xs ${getStatusColor(tower.status)}`}>
                                      {tower.status.toUpperCase()}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <p><span className="text-gray-500">Location:</span> {tower.location}</p>
                                  <p><span className="text-gray-500">Bandwidth:</span> {tower.bandwidth}</p>
                                  <p><span className="text-gray-500">Latency:</span> {tower.latency}</p>
                                  <p><span className="text-gray-500">Devices:</span> {tower.devices}</p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Towers Management Tab */}
                <TabsContent value="towers" className="space-y-6 mt-0">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <Signal className="w-5 h-5 text-blue-600" />
                          <span>Tower Management</span>
                        </CardTitle>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <span className="mr-2">+</span> Add New Tower
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {towersLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-16 w-full" />
                          ))}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Tower Name</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Bandwidth</TableHead>
                                <TableHead>Latency</TableHead>
                                <TableHead>Uptime</TableHead>
                                <TableHead>Devices</TableHead>
                                <TableHead>Alerts</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {towers.map(tower => (
                                <TableRow key={tower.id}>
                                  <TableCell className="font-medium">{tower.name}</TableCell>
                                  <TableCell>{tower.location}</TableCell>
                                  <TableCell>
                                    <Badge className={`${getStatusColor(tower.status)}`}>
                                      {tower.status.toUpperCase()}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{tower.bandwidth}</TableCell>
                                  <TableCell>{tower.latency}</TableCell>
                                  <TableCell>{tower.uptime}</TableCell>
                                  <TableCell>{tower.devices}</TableCell>
                                  <TableCell>
                                    {tower.alerts > 0 ? (
                                      <Badge variant="destructive">{tower.alerts}</Badge>
                                    ) : (
                                      <Badge variant="secondary">0</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      <Button variant="outline" size="sm">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                      <Button variant="outline" size="sm">
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Real-time Monitoring Tab */}
                <TabsContent value="monitoring" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Activity className="w-5 h-5 text-purple-600" />
                          <span>Real-time Performance</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500">Real-time Performance Chart</p>
                              <p className="text-xs text-gray-400">Bandwidth, Latency, Throughput</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <MapPin className="w-5 h-5 text-green-600" />
                          <span>Network Map</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">Interactive Network Map</p>
                            <p className="text-xs text-gray-400">Tower locations and coverage areas</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Wifi className="w-5 h-5 text-blue-600" />
                        <span>Live Device Status</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {towers.map(tower => (
                          <Card key={tower.id} className="bg-gray-50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium">{tower.name}</h4>
                                {getStatusIcon(tower.status)}
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>CPU Usage:</span>
                                  <span className="font-medium">65%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Memory:</span>
                                  <span className="font-medium">78%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Network I/O:</span>
                                  <span className="font-medium">156 Mbps</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Temperature:</span>
                                  <span className="font-medium">42°C</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Performance Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">Performance Analytics Chart</p>
                            <p className="text-xs text-gray-400">30-day trend analysis</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Capacity Planning</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Network Utilization</span>
                              <span>73%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{width: '73%'}}></div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Storage Usage</span>
                              <span>45%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-green-600 h-2 rounded-full" style={{width: '45%'}}></div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Bandwidth Capacity</span>
                              <span>89%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-yellow-600 h-2 rounded-full" style={{width: '89%'}}></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Alerts Tab */}
                <TabsContent value="alerts" className="space-y-6 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span>Active Alerts</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {alertsLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-24 w-full" />
                          ))}
                        </div>
                      ) : networkAlerts.length > 0 ? (
                        <div className="space-y-4">
                          {networkAlerts.map(alert => (
                            <div key={alert.id} className={`border-l-4 ${
                              alert.type === 'critical' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
                            } p-4 rounded`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className={`font-medium ${
                                    alert.type === 'critical' ? 'text-red-800' : 'text-yellow-800'
                                  }`}>{alert.title}</h4>
                                  <p className={`text-sm ${
                                    alert.type === 'critical' ? 'text-red-700' : 'text-yellow-700'
                                  }`}>{alert.message}</p>
                                  <p className={`text-xs ${
                                    alert.type === 'critical' ? 'text-red-600' : 'text-yellow-600'
                                  }`}>
                                    {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} • {
                                      format(new Date(alert.timestamp), 'HH:mm:ss')
                                    } ago
                                  </p>
                                </div>
                                <Badge variant={alert.type === 'critical' ? 'destructive' : 'secondary'} 
                                       className={alert.type === 'critical' ? '' : 'bg-yellow-200 text-yellow-800'}>
                                  {alert.type.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium mb-2">No Active Alerts</p>
                          <p>All systems are operating normally</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-6 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Monitoring Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <Label className="text-sm font-medium">Polling Interval</Label>
                          <Select defaultValue="30">
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15">15 seconds</SelectItem>
                              <SelectItem value="30">30 seconds</SelectItem>
                              <SelectItem value="60">1 minute</SelectItem>
                              <SelectItem value="300">5 minutes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Alert Thresholds</Label>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                              <Label className="text-xs text-gray-500">Bandwidth (%)</Label>
                              <Input defaultValue="90" type="number" />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Latency (ms)</Label>
                              <Input defaultValue="100" type="number" />
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Notification Settings</Label>
                          <div className="space-y-2 mt-2">
                            <label className="flex items-center space-x-2">
                              <input type="checkbox" defaultChecked />
                              <span className="text-sm">Email notifications</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input type="checkbox" defaultChecked />
                              <span className="text-sm">SMS alerts for critical issues</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input type="checkbox" />
                              <span className="text-sm">Push notifications</span>
                            </label>
                          </div>
                        </div>
                        
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                          Save Configuration
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-4 sm:pb-6">
      {/* Enhanced Mobile Header */}
      <div className="bg-white shadow-lg border-b sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">
                  Welcome, {user?.firstName || 'User'}
                </h1>
                <p className="text-sm text-gray-600 truncate">
                  Your Personal Task Portal
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNetworkMonitoring(true)}
                className="h-10 px-3 border-blue-200 hover:border-blue-300 hover:bg-blue-50 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border text-green-700 font-semibold shadow-md"
              >
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Signal className="w-4 h-4" />
                    <Wifi className="w-4 h-4" />
                  </div>
                  <span className="hidden sm:inline">WIZONE Monitoring</span>
                  <span className="sm:hidden">Network</span>
                </div>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncTasksMutation.mutate()}
                disabled={syncTasksMutation.isPending}
                className="h-10 w-10 p-0 border-blue-200 hover:border-blue-300 hover:bg-blue-50 rounded-full"
              >
                <RefreshCw className={`w-5 h-5 ${syncTasksMutation.isPending ? 'animate-spin' : ''} text-blue-600`} />
              </Button>
            </div>
          </div>
          
          {/* User Info Card */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    <span className="font-semibold text-sm">{user?.role?.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  <div className="flex items-center min-w-0">
                    <Mail className="w-4 h-4 mr-2 shrink-0" />
                    <span className="truncate text-sm opacity-90">{user?.email}</span>
                  </div>
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="text-xs opacity-90">Today</div>
                <div className="text-sm font-semibold">{format(new Date(), 'MMM dd')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 lg:p-6 space-y-6">
        {/* Mobile Optimized Task Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 cursor-pointer">
            <CardContent className="p-4 lg:p-6">
              <div className="text-center space-y-2">
                <FileText className="w-8 h-8 lg:w-10 lg:h-10 text-blue-600 mx-auto" />
                <div>
                  <p className="text-2xl lg:text-3xl font-bold text-blue-700">{statsData.total}</p>
                  <p className="text-sm font-semibold text-blue-600">My Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 cursor-pointer">
            <CardContent className="p-4 lg:p-6">
              <div className="text-center space-y-2">
                <Clock className="w-8 h-8 lg:w-10 lg:h-10 text-yellow-600 mx-auto" />
                <div>
                  <p className="text-2xl lg:text-3xl font-bold text-yellow-700">{statsData.pending}</p>
                  <p className="text-sm font-semibold text-yellow-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 cursor-pointer">
            <CardContent className="p-4 lg:p-6">
              <div className="text-center space-y-2">
                <AlertCircle className="w-8 h-8 lg:w-10 lg:h-10 text-indigo-600 mx-auto" />
                <div>
                  <p className="text-2xl lg:text-3xl font-bold text-indigo-700">{statsData.inProgress}</p>
                  <p className="text-sm font-semibold text-indigo-600">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 cursor-pointer">
            <CardContent className="p-4 lg:p-6">
              <div className="text-center space-y-2">
                <CheckCircle className="w-8 h-8 lg:w-10 lg:h-10 text-green-600 mx-auto" />
                <div>
                  <p className="text-2xl lg:text-3xl font-bold text-green-700">{statsData.completed}</p>
                  <p className="text-sm font-semibold text-green-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Table */}
        <Card className="shadow-sm">
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg lg:text-xl truncate">My Assigned Tasks</CardTitle>
                <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2">
                  <Badge variant="outline" className="text-xs w-fit whitespace-nowrap">
                    {myTasks.length} task{myTasks.length !== 1 ? 's' : ''}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => syncTasksMutation.mutate()}
                    disabled={syncTasksMutation.isPending}
                    className="text-xs h-8 px-3 w-full xs:w-auto min-w-[80px]"
                  >
                    {syncTasksMutation.isPending ? (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="hidden xs:inline">Syncing</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        <span>Sync</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-3 lg:p-6">
            {tasksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : myTasks.length > 0 ? (
              <>
                {/* Mobile Optimized Card Layout */}
                <div className="block lg:hidden space-y-4 p-3">
                  {myTasks.map((task: any) => (
                    <Card 
                      key={task.id} 
                      className="bg-white border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-98"
                    >
                      <CardContent className="p-4 space-y-4">
                        {/* Task Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <p className="font-bold text-blue-700 text-sm truncate">
                                {task.ticketNumber}
                              </p>
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">
                              {task.customer?.name || 'Unknown Customer'}
                            </h3>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTaskIdClick(task)}
                            className="h-10 w-10 p-0 rounded-full border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                          >
                            <Eye className="w-5 h-5 text-blue-600" />
                          </Button>
                        </div>

                        {/* Task Information */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 text-gray-700">
                            <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            <span className="text-base font-medium truncate">{task.customer?.city || 'Location not specified'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-gray-700">
                            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                            <span className="text-base font-medium truncate">{task.issueType || 'General Issue'}</span>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            <Badge className={`${getPriorityColor(task.priority)} text-sm font-semibold px-3 py-1.5 rounded-full`}>
                              {task.priority || 'Normal'}
                            </Badge>
                            <Badge className={`${getStatusColor(task.status)} text-sm font-semibold px-3 py-1.5 rounded-full`}>
                              {task.status?.replace('_', ' ') || 'Pending'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">
                              {task.createdAt ? format(new Date(task.createdAt), 'MMM dd') : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button 
                          onClick={() => handleTaskIdClick(task)}
                          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                        >
                          <span>View Task Details</span>
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Issue Type</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myTasks.map((task: any) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <button 
                              onClick={() => handleTaskIdClick(task)}
                              className="text-primary hover:text-blue-700 font-medium underline"
                            >
                              {task.ticketNumber}
                            </button>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{task.customer?.name || 'Unknown'}</p>
                              <p className="text-sm text-gray-500">{task.customer?.city}</p>
                            </div>
                          </TableCell>
                          <TableCell>{task.issueType}</TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(task.status)}>
                              {task.status?.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {task.createdAt ? format(new Date(task.createdAt), 'MMM dd, yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleTaskIdClick(task)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="text-center py-8 sm:py-12 px-3 sm:px-4 text-gray-500">
                <div className="max-w-sm mx-auto">
                  <div className="relative mb-6">
                    <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <p className="text-base sm:text-lg lg:text-xl font-bold mb-2 text-gray-700">No Tasks Yet!</p>
                  <p className="text-sm sm:text-base text-gray-500 leading-relaxed mb-6">You don't have any tasks assigned to you right now. New tasks will appear here when they're assigned to you.</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => syncTasksMutation.mutate()}
                    disabled={syncTasksMutation.isPending}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 text-blue-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2"
                  >
                    {syncTasksMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Checking for Tasks...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        <span>Check for New Tasks</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Optimized Task Details Modal */}
      <Dialog open={!!selectedTaskId} onOpenChange={handleCloseModal}>
        <DialogContent className="w-full max-w-full sm:max-w-4xl h-[95vh] sm:max-h-[90vh] overflow-hidden mx-0 sm:mx-2 rounded-t-xl sm:rounded-lg border-0 sm:border bg-white">
          <DialogHeader className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-3">
                <DialogTitle className="text-lg font-bold text-gray-900 truncate">
                  Task Details
                </DialogTitle>
                <p className="text-sm text-blue-600 font-semibold truncate">
                  {selectedTaskId ? myTasks.find(t => t.id === selectedTaskId)?.ticketNumber : ''}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCloseModal} 
                className="h-10 w-10 p-0 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-full shadow-sm shrink-0"
              >
                <X className="w-5 h-5 text-gray-600 hover:text-red-600" />
              </Button>
            </div>
          </DialogHeader>
          
          {selectedTaskId && (() => {
            const task = myTasks.find(t => t.id === selectedTaskId);
            if (!task) return <div>Task not found</div>;

            return (
              <Tabs defaultValue="details" className="w-full px-3">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-gray-100 border shadow-sm h-auto p-1.5 rounded-lg">
                  <TabsTrigger 
                    value="details" 
                    className="text-sm py-3 px-3 rounded-md font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>Details</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="text-sm py-3 px-3 rounded-md font-semibold data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>History</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="update" 
                    className="text-sm py-3 px-3 rounded-md font-semibold data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Edit className="w-4 h-4" />
                      <span>Update</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="files" 
                    className="text-sm py-3 px-3 rounded-md font-semibold data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="w-4 h-4" />
                      <span>Files</span>
                    </div>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-6 max-h-[calc(95vh-200px)] overflow-y-auto overscroll-contain scroll-smooth p-4">
                  {/* Task Header */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="space-y-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900">{task.ticketNumber}</h3>
                        <p className="text-gray-700 text-base mt-1">{task.title}</p>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{task.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={`${getPriorityColor(task.priority)} text-sm px-3 py-1 rounded-full font-semibold`}>
                          {task.priority}
                        </Badge>
                        <Badge className={`${getStatusColor(task.status)} text-sm px-3 py-1 rounded-full font-semibold`}>
                          {task.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Task Info */}
                  <Card className="shadow-lg">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base font-bold">Task Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <Label className="text-sm text-gray-600 font-semibold">Issue Type</Label>
                          <p className="font-medium text-base text-gray-900 mt-1">{task.issueType}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <Label className="text-sm text-gray-600 font-semibold">Assigned Engineer</Label>
                          <p className="font-medium text-base text-gray-900 mt-1">
                            {task.assignedUser ? 
                              `${task.assignedUser.firstName} ${task.assignedUser.lastName}` : 
                              "Not assigned"
                            }
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <Label className="text-sm text-gray-600 font-semibold">Created</Label>
                          <p className="font-medium text-base text-gray-900 mt-1">
                            {task.createdAt ? format(new Date(task.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <Label className="text-sm text-gray-600 font-semibold">Last Updated</Label>
                          <p className="font-medium text-base text-gray-900 mt-1">
                            {task.updatedAt ? format(new Date(task.updatedAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Customer Info */}
                  {task.customer && (
                    <Card className="shadow-lg">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base font-bold">Customer Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 p-4">
                        <div className="space-y-4">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <Label className="text-sm text-blue-700 font-semibold">Customer Name</Label>
                            <p className="font-medium text-base text-gray-900 mt-1">{task.customer.name}</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-3">
                            <Label className="text-sm text-blue-700 font-semibold">Contact Person</Label>
                            <p className="font-medium text-base text-gray-900 mt-1">{task.customer.contactPerson}</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-3">
                            <Label className="text-sm text-blue-700 font-semibold">Location</Label>
                            <p className="font-medium text-base text-gray-900 mt-1">{task.customer.address}, {task.customer.city}, {task.customer.state}</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-3">
                            <Label className="text-sm text-blue-700 font-semibold">Phone</Label>
                            <p className="font-medium text-base text-gray-900 mt-1">{task.customer.mobilePhone}</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-3">
                            <Label className="text-sm text-blue-700 font-semibold">Email</Label>
                            <p className="font-medium text-base text-gray-900 mt-1 break-all">{task.customer.email}</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-3">
                            <Label className="text-sm text-blue-700 font-semibold">Service Plan</Label>
                            <p className="font-medium text-base text-gray-900 mt-1">{task.customer.servicePlan}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4 max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-180px)] overflow-y-auto overscroll-contain scroll-smooth">
                  {taskUpdates && taskUpdates.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Task History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {taskUpdates.map((update: any, index: number) => {
                            // Simple task history display for everyone
                            const getUpdateTypeInfo = (update: any) => {
                              const type = update.type || 'comment';
                              switch (type) {
                                case 'status_update':
                                  return {
                                    icon: <RefreshCw className="w-4 h-4 text-blue-600" />,
                                    borderColor: 'border-blue-400',
                                    bgColor: 'bg-blue-50',
                                    typeLabel: 'Status Change'
                                  };
                                case 'file_upload':
                                  return {
                                    icon: <FileText className="w-4 h-4 text-green-600" />,
                                    borderColor: 'border-green-400',
                                    bgColor: 'bg-green-50',
                                    typeLabel: 'File Upload'
                                  };
                                case 'comment':
                                  return {
                                    icon: <MessageCircle className="w-4 h-4 text-gray-600" />,
                                    borderColor: 'border-gray-400',
                                    bgColor: 'bg-gray-50',
                                    typeLabel: 'Comment'
                                  };
                                default:
                                  return {
                                    icon: <Clock className="w-4 h-4 text-purple-600" />,
                                    borderColor: 'border-purple-400',
                                    bgColor: 'bg-purple-50',
                                    typeLabel: 'Update'
                                  };
                              }
                            };

                            const typeInfo = getUpdateTypeInfo(update);

                            return (
                              <div key={update.id} className={`border-l-4 ${typeInfo.borderColor} pl-4 pb-4`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    {/* Header with user info and update type */}
                                    <div className="flex items-center space-x-2 mb-3">
                                      {typeInfo.icon}
                                      <div className="flex items-center space-x-2">
                                        <p className="text-sm font-medium">
                                          {update.updatedByUser?.firstName && update.updatedByUser?.lastName 
                                            ? `${update.updatedByUser.firstName} ${update.updatedByUser.lastName}`
                                            : update.createdByName || 'Unknown User'
                                          }
                                        </p>
                                        <Badge variant="outline" className="text-xs">
                                          {update.updatedByUser?.role?.replace('_', ' ') || 'User'}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">
                                          {typeInfo.typeLabel}
                                        </Badge>
                                      </div>
                                    </div>



                                    {/* Main message/content - Simple display for everyone */}
                                    <div className={`p-3 rounded-lg ${typeInfo.bgColor} border`}>
                                      <div className="space-y-2">
                                        <p className="text-sm text-gray-700 font-medium">
                                          {update.type === 'assignment' ? 'Assignment:' : 
                                           update.type === 'status_update' ? 'Status Update:' :
                                           update.type === 'comment' ? 'Comment:' :
                                           update.type === 'file_upload' ? 'File Upload:' : 'Update:'}
                                        </p>
                                        <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                                          {update.message || 'No message provided'}
                                        </p>
                                      </div>
                                    </div>

                                    {/* File attachments */}
                                    {update.files && update.files.length > 0 && (
                                      <div className="mt-3">
                                        <div className="flex items-center gap-1 text-xs text-green-600 mb-2">
                                          <FileText className="w-3 h-3" />
                                          <span className="font-medium">Attached Files ({update.files.length})</span>
                                        </div>
                                        <div className="space-y-1">
                                          {update.files.map((file: string, fileIndex: number) => (
                                            <div key={fileIndex} className="flex items-center justify-between text-xs bg-green-50 border border-green-200 px-3 py-2 rounded">
                                              <span className="truncate flex-1 font-medium">{file}</span>
                                              <button
                                                onClick={() => {
                                                  const link = document.createElement('a');
                                                  link.href = `/uploads/${file}`;
                                                  link.download = file;
                                                  link.click();
                                                }}
                                                className="ml-2 text-green-600 hover:text-green-800 p-1 hover:bg-green-100 rounded"
                                              >
                                                <Download className="w-3 h-3" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Timestamp */}
                                  <div className="text-right ml-4">
                                    <span className="text-xs text-gray-500 whitespace-nowrap block">
                                      {update.createdAt ? format(new Date(update.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                    </span>
                                    <span className="text-xs text-gray-400 whitespace-nowrap block">
                                      {update.createdAt ? format(new Date(update.createdAt), 'HH:mm:ss') : ''}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No Updates Yet</p>
                      <p>This task hasn't been updated yet.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="update" className="space-y-4 max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-180px)] overflow-y-auto overscroll-contain scroll-smooth">
                  <Card>
                    <CardHeader className="p-3 sm:p-6">
                      <CardTitle className="text-sm sm:text-base flex items-center space-x-2">
                        <Edit className="w-4 h-4" />
                        <span>Update Task Status</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-3 sm:p-6">
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-xs sm:text-sm">Change Status</Label>
                        {task.status === 'resolved' || task.status === 'completed' ? (
                          <div className="p-3 bg-gray-100 border border-gray-200 rounded-md">
                            <p className="text-xs sm:text-sm text-gray-600">
                              Status: <span className="font-medium capitalize">{task.status?.replace('_', ' ')}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Task is {task.status} and cannot be modified
                            </p>
                          </div>
                        ) : (
                          <Select value={taskStatus} onValueChange={setTaskStatus}>
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select new status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <p className="text-xs text-gray-500">
                          Current status: <span className="font-medium">{task.status?.replace('_', ' ')}</span>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes" className="text-xs sm:text-sm">Update Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder={task.status === 'resolved' || task.status === 'completed' ? 'Task is finalized - no further updates allowed' : (taskStatus === 'completed' ? 'Provide resolution details (required)' : 'Add notes about this update (optional)')}
                          value={updateNotes}
                          onChange={(e) => setUpdateNotes(e.target.value)}
                          rows={3}
                          className="text-sm resize-none"
                          disabled={task.status === 'resolved' || task.status === 'completed'}
                        />
                        {taskStatus === 'completed' && task.status !== 'resolved' && task.status !== 'completed' && (
                          <p className="text-xs text-amber-600">
                            ⚠️ Resolution notes are required when marking task as completed
                          </p>
                        )}
                        {(task.status === 'resolved' || task.status === 'completed') && (
                          <p className="text-xs text-blue-600">
                            ℹ️ This task has been finalized and cannot be modified further
                          </p>
                        )}
                      </div>

                      {/* File Upload Section */}
                      <div className="space-y-3 border-t pt-4">
                        <Label className="text-xs sm:text-sm font-medium flex items-center space-x-2">
                          <Upload className="w-4 h-4" />
                          <span>Upload Photos/Files</span>
                        </Label>
                        
                        {task.status === 'resolved' || task.status === 'completed' ? (
                          <div className="p-3 bg-gray-100 border border-gray-200 rounded-md">
                            <p className="text-xs sm:text-sm text-gray-600">
                              File uploads are disabled for {task.status} tasks
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* File Upload Input */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                              <Input
                                type="file"
                                multiple
                                accept="image/*,.pdf,.doc,.docx,.txt"
                                onChange={handleFileChange}
                                className="flex-1 text-xs sm:text-sm file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto text-xs flex items-center space-x-2"
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.capture = 'environment';
                                  input.onchange = (e) => {
                                    const files = Array.from((e.target as HTMLInputElement).files || []);
                                    setUploadFiles(prev => [...prev, ...files]);
                                  };
                                  input.click();
                                }}
                              >
                                <Camera className="w-4 h-4" />
                                <span>Camera</span>
                              </Button>
                            </div>
                            
                            {/* File List */}
                            {uploadFiles.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-xs text-gray-500">Selected Files:</Label>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {uploadFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                                        {file.type.startsWith('image/') ? (
                                          <Image className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        ) : (
                                          <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                        )}
                                        <span className="truncate">{file.name}</span>
                                        <span className="text-gray-400 text-xs flex-shrink-0">
                                          ({(file.size / 1024).toFixed(1)} KB)
                                        </span>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(index)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Trash2 className="w-3 h-3 text-red-500" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Upload Notes */}
                                <div className="space-y-2">
                                  <Label htmlFor="uploadNotes" className="text-xs">Notes for files (optional)</Label>
                                  <Textarea
                                    id="uploadNotes"
                                    placeholder="Add notes about the uploaded files..."
                                    value={uploadNotes}
                                    onChange={(e) => setUploadNotes(e.target.value)}
                                    rows={2}
                                    className="resize-none text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Status Change Warnings */}
                      {taskStatus && taskStatus !== task.status && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm text-blue-700">
                            {taskStatus === 'in_progress' && task.status === 'pending' && 
                              "⏱️ Start time will be automatically recorded"}
                            {taskStatus === 'completed' && task.status !== 'completed' && 
                              "✅ Completion time will be recorded and duration calculated"}
                            {taskStatus === 'cancelled' && 
                              "❌ Task will be marked as cancelled"}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={handleCloseModal} className="w-full sm:w-auto text-sm">
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleUpdateTask}
                          disabled={task.status === 'resolved' || task.status === 'completed' || updateTaskMutation.isPending || uploadFilesMutation.isPending || (!taskStatus && !updateNotes.trim() && uploadFiles.length === 0)}
                          className="bg-primary hover:bg-blue-700 text-white w-full sm:w-auto text-sm"
                        >
                          {updateTaskMutation.isPending || uploadFilesMutation.isPending ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>
                                {uploadFilesMutation.isPending ? 'Uploading...' : 'Updating...'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-2">
                              <Save className="w-4 h-4" />
                              <span>
                                {uploadFiles.length > 0 ? 'Upload & Update' : 'Update Task'}
                              </span>
                            </div>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="files" className="space-y-4 max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-180px)] overflow-y-auto overscroll-contain scroll-smooth">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>Quick File Upload</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center border-2 border-dashed border-gray-300 rounded-lg p-8">
                        <div className="space-y-4">
                          <div className="flex justify-center space-x-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.multiple = true;
                                input.accept = 'image/*,.pdf,.doc,.docx,.txt';
                                input.onchange = (e) => {
                                  const files = Array.from((e.target as HTMLInputElement).files || []);
                                  setUploadFiles(prev => [...prev, ...files]);
                                };
                                input.click();
                              }}
                              className="flex items-center space-x-2"
                            >
                              <Upload className="w-4 h-4" />
                              <span>Choose Files</span>
                            </Button>
                            
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.capture = 'environment';
                                input.onchange = (e) => {
                                  const files = Array.from((e.target as HTMLInputElement).files || []);
                                  setUploadFiles(prev => [...prev, ...files]);
                                };
                                input.click();
                              }}
                              className="flex items-center space-x-2"
                            >
                              <Camera className="w-4 h-4" />
                              <span>Take Photo</span>
                            </Button>
                          </div>
                          
                          <p className="text-sm text-gray-500">
                            Upload photos, documents, or other files related to this task
                          </p>
                          <p className="text-xs text-gray-400">
                            Supported: Images, PDF, DOC, DOCX, TXT (Max 10MB per file)
                          </p>
                        </div>
                      </div>
                      
                      {/* File List */}
                      {uploadFiles.length > 0 && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Files to Upload ({uploadFiles.length})</Label>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {uploadFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  {file.type.startsWith('image/') ? (
                                    <Image className="w-5 h-5 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {file.type} • {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          
                          {/* Upload Notes */}
                          <div className="space-y-2">
                            <Label htmlFor="fileUploadNotes">Notes for upload</Label>
                            <Textarea
                              id="fileUploadNotes"
                              placeholder="Add notes about these files..."
                              value={uploadNotes}
                              onChange={(e) => setUploadNotes(e.target.value)}
                              rows={3}
                              className="resize-none"
                            />
                          </div>
                          
                          <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setUploadFiles([]);
                                setUploadNotes("");
                              }}
                            >
                              Clear All
                            </Button>
                            <Button 
                              onClick={handleUpdateTask}
                              disabled={uploadFilesMutation.isPending}
                              className="bg-primary hover:bg-blue-700 text-white"
                            >
                              {uploadFilesMutation.isPending ? (
                                <div className="flex items-center space-x-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Uploading...</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <Upload className="w-4 h-4" />
                                  <span>Upload Files</span>
                                </div>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Network Monitoring Module */}
      <NetworkMonitoringModule />
    </div>
  );
}