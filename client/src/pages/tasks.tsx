import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import TaskFormModal from "@/components/modals/task-form-modal";
import FieldEngineerAssignmentModal from "@/components/modals/field-engineer-assignment-modal";
import FieldTaskWorkflowModal from "@/components/modals/field-task-workflow-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Loader, 
  CheckCircle, 
  Eye, 
  Edit,
  X,
  Upload,
  FileText,
  Image,
  Calendar,
  User,
  MessageSquare,
  Download,
  Paperclip,
  TrendingUp,
  RefreshCw,
  Play,
  Trash2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

export default function Tasks() {
  const [location] = useLocation();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [updateNotes, setUpdateNotes] = useState("");
  const [taskStatus, setTaskStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadNotes, setUploadNotes] = useState<string>("");
  const [showFieldAssignment, setShowFieldAssignment] = useState(false);
  const [showFieldWorkflow, setShowFieldWorkflow] = useState(false);
  const [selectedTaskForField, setSelectedTaskForField] = useState<any>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle URL parameter filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const statusParam = urlParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [location]);

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks", searchQuery, priorityFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const url = `/api/tasks${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    },
  });

  const { data: taskStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/tasks/stats"],
  });

  const { data: backendEngineers } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error('Failed to fetch users');
      const users = await response.json();
      return users.filter((user: any) => user.role === 'backend_engineer' || user.role === 'admin');
    }
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user");
      if (!response.ok) throw new Error('Failed to fetch current user');
      return response.json();
    }
  });

  const quickAssignMutation = useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: number; userId: string }) => {
      await apiRequest("PUT", `/api/tasks/${taskId}`, { assignedTo: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
      toast({
        title: "Success",
        description: "Task assigned successfully",
      });
    },
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
      toast({
        title: "Error",
        description: "Failed to assign task",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PUT", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
      if (selectedTaskId) {
        queryClient.invalidateQueries({ queryKey: [`/api/tasks/${selectedTaskId}/updates`] });
      }
      setSelectedTaskId(null);
      setUpdateNotes("");
      setTaskStatus("");
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    },
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
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const uploadFilesMutation = useMutation({
    mutationFn: async ({ taskId, files, notes }: { taskId: number; files: string[]; notes: string }) => {
      await apiRequest("POST", `/api/tasks/${taskId}/upload`, { files, notes });
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/updates`] });
      setUploadFiles([]);
      setUploadNotes("");
      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });
    },
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
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-tasks"] });
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    },
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
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  // Query for task updates/history
  const { data: taskUpdates } = useQuery({
    queryKey: [`/api/tasks/${selectedTaskId}/updates`],
    enabled: !!selectedTaskId,
  });

  const handleTaskIdClick = (task: any) => {
    setSelectedTaskId(task.id);
    setTaskStatus(task.status);
    setUpdateNotes("");
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
    
    updateTaskMutation.mutate({ 
      id: selectedTaskId, 
      data: updateData 
    });
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

  const handleFileUpload = () => {
    if (!selectedTaskId || uploadFiles.length === 0) return;
    
    // Convert files to base64 or URLs for upload
    const filePromises = uploadFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(filePromises).then(files => {
      uploadFilesMutation.mutate({
        taskId: selectedTaskId,
        files,
        notes: uploadNotes.trim() || `Uploaded ${uploadFiles.length} file(s)`
      });
    });
  };

  const handleMoveToFieldTeam = (task: any) => {
    setSelectedTaskForField(task);
    setShowFieldAssignment(true);
  };

  const handleFieldWorkflow = (task: any) => {
    setSelectedTaskForField(task);
    setShowFieldWorkflow(true);
  };

  const handleDeleteTask = (taskId: number, taskNumber: string) => {
    if (window.confirm(`Are you sure you want to delete task ${taskNumber}? This action cannot be undone.`)) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const getUpdateTypeIcon = (updateType: string, oldValue?: string, newValue?: string, notes?: string) => {
    switch (updateType) {
      case 'status_change':
      case 'status_changed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'status_update':
        return <RefreshCw className="w-4 h-4 text-purple-500" />;
      case 'priority_changed':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'note_added':
      case 'notes_added':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'file_uploaded':
        return <Upload className="w-4 h-4 text-purple-500" />;
      case 'task_created':
        return <Plus className="w-4 h-4 text-blue-500" />;
      case 'task_assigned':
        return <User className="w-4 h-4 text-indigo-500" />;
      case 'update':
        // Determine icon from data
        if (oldValue && newValue && oldValue !== newValue) {
          return <CheckCircle className="w-4 h-4 text-blue-500" />;
        }
        if (notes) {
          return <MessageSquare className="w-4 h-4 text-green-500" />;
        }
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        // Fallback logic to determine icon
        if (oldValue && newValue && oldValue !== newValue) {
          return <CheckCircle className="w-4 h-4 text-blue-500" />;
        }
        if (notes) {
          return <MessageSquare className="w-4 h-4 text-green-500" />;
        }
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getUpdateTypeTitle = (updateType: string, oldValue?: string, newValue?: string, notes?: string) => {
    switch (updateType) {
      case 'status_change':
      case 'status_changed':
        return `Status Changed ${oldValue && newValue ? `from ${oldValue.replace(/_/g, ' ')} to ${newValue.replace(/_/g, ' ')}` : ''}`;
      case 'status_update':
        return `Status Updated ${newValue ? `to ${newValue.replace(/_/g, ' ')}` : ''}`;
      case 'priority_changed':
        return `Priority Changed ${oldValue && newValue ? `from ${oldValue} to ${newValue}` : ''}`;
      case 'note_added':
      case 'notes_added':
        return 'Note Added';
      case 'file_uploaded':
        return 'Files Uploaded';
      case 'task_created':
        return 'Task Created';
      case 'task_assigned':
        return 'Task Assigned';
      case 'update':
        // Determine update type from data
        if (oldValue && newValue) {
          if (oldValue !== newValue) {
            return `Status Changed from ${oldValue.replace(/_/g, ' ')} to ${newValue.replace(/_/g, ' ')}`;
          }
        }
        if (notes) {
          return 'Note Added';
        }
        return 'Task Updated';
      default:
        // Fallback logic to determine update type
        if (oldValue && newValue && oldValue !== newValue) {
          return `Status Changed from ${oldValue.replace(/_/g, ' ')} to ${newValue.replace(/_/g, ' ')}`;
        }
        if (notes) {
          return 'Note Added';
        }
        return 'Task Updated';
    }
  };

  const formatUpdateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const calculateDuration = (task: any) => {
    if (task.completionTime) {
      const start = new Date(task.createdAt);
      const end = new Date(task.completionTime);
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.round(diffMs / (1000 * 60));
      
      if (diffMins < 60) return `${diffMins}m`;
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    } else if (task.status === 'completed') {
      return 'Completed';
    } else {
      const start = new Date(task.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const diffMins = Math.round(diffMs / (1000 * 60));
      
      if (diffMins < 60) return `${diffMins}m (ongoing)`;
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return mins > 0 ? `${hours}h ${mins}m (ongoing)` : `${hours}h (ongoing)`;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewTask = (taskId: number) => {
    // For now, we'll use the same update modal for viewing
    const task = Array.isArray(tasks) ? tasks.find((t: any) => t.id === taskId) : null;
    if (task) {
      handleTaskIdClick(task);
    }
  };

  const handleEditTask = (taskId: number) => {
    // For now, we'll use the same update modal for editing
    const task = Array.isArray(tasks) ? tasks.find((t: any) => t.id === taskId) : null;
    if (task) {
      handleTaskIdClick(task);
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
      case 'pending': return 'bg-warning/10 text-warning';
      case 'start_task': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-info/10 text-info';
      case 'resolved': return 'bg-emerald-100 text-emerald-700';
      case 'completed': return 'bg-success/10 text-success';
      case 'cancelled': return 'bg-error/10 text-error';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateTaskMutation.mutate({
      id: taskId,
      data: { status: newStatus }
    });
  };

  const handleQuickAssign = (taskId: number, userId: string) => {
    quickAssignMutation.mutate({ taskId, userId });
  };

  const shouldShowAssignmentButtons = (task: any) => {
    // Show assignment buttons for tasks that need backend engineer assignment
    return !task.assignedTo || task.assignedTo === null;
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Task Management"
        subtitle="Create, assign, and track task progress"
      >
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => setShowFilterModal(true)}>
            <Filter className="w-4 h-4 mr-2" />
            Filter
            {(searchQuery || priorityFilter !== 'all' || statusFilter !== 'all') && (
              <span className="ml-2 w-2 h-2 bg-purple-600 rounded-full"></span>
            )}
          </Button>
          <Button onClick={() => setShowTaskForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </Header>
      
      <div className="p-6 space-y-8">
        {/* Task Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">{(taskStats as any)?.pending || 0}</p>
                    </div>
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">In Progress</p>
                      <p className="text-2xl font-bold text-gray-900">{(taskStats as any)?.inProgress || 0}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Loader className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed Today</p>
                      <p className="text-2xl font-bold text-gray-900">{(taskStats as any)?.completed || 0}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <CardTitle>All Tasks</CardTitle>
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by ticket #, type, customer, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-80"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="start_task">Start Task</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {(searchQuery || priorityFilter !== 'all' || statusFilter !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setPriorityFilter("all");
                      setStatusFilter("all");
                    }}
                    className="h-10"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : tasks && Array.isArray(tasks) && tasks.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Issue Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(tasks as any[])?.filter((task: any) => {
                      // Apply search filter
                      const matchesSearch = searchQuery === "" || 
                        task.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        task.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        task.issueType?.toLowerCase().includes(searchQuery.toLowerCase());
                      
                      // Apply priority filter
                      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
                      
                      // Apply status filter
                      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
                      
                      return matchesSearch && matchesPriority && matchesStatus;
                    }).map((task: any) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          <button
                            onClick={() => handleTaskIdClick(task)}
                            className="text-primary hover:text-primary/80 underline hover:no-underline font-medium"
                          >
                            {task.ticketNumber}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{task.customer?.name || 'Unknown Customer'}</div>
                            <div className="text-sm text-gray-500">{task.customer?.city}</div>
                          </div>
                        </TableCell>
                        <TableCell>{task.issueType}</TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{task.assignedUser?.firstName} {task.assignedUser?.lastName}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium">{formatDateTime(task.createdAt)}</div>
                            <div className="text-xs text-gray-500">
                              by {task.createdByUser?.firstName || 'System'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{calculateDuration(task)}</div>
                            {task.status === 'completed' && task.createdByUser && (
                              <div className="text-xs text-gray-500">
                                Resolved by {task.createdByUser.firstName}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {/* Quick Assignment Buttons for Backend Engineer Assignment */}
                            {shouldShowAssignmentButtons(task) && backendEngineers && (
                              <div className="flex space-x-1">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleQuickAssign(task.id, currentUser?.id)}
                                  title="Assign to Me"
                                  className="text-xs px-2 py-1"
                                  disabled={!currentUser?.id}
                                >
                                  Assign to Me
                                </Button>
                                <Select onValueChange={(userId) => handleQuickAssign(task.id, userId)}>
                                  <SelectTrigger className="h-8 w-36 text-xs">
                                    <SelectValue placeholder="Backend Eng." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {backendEngineers?.map((engineer: any) => (
                                      <SelectItem key={engineer.id} value={engineer.id}>
                                        {engineer.firstName} {engineer.lastName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewTask(task.id)}
                              title="View Task"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditTask(task.id)}
                              title="Edit Task"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteTask(task.id, task.ticketNumber)}
                              title="Delete Task"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No tasks found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TaskFormModal 
        isOpen={showTaskForm} 
        onClose={() => setShowTaskForm(false)} 
      />

      {/* Inline Task Update Modal */}
      <Dialog open={!!selectedTaskId} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                Task Details - {selectedTaskId ? Array.isArray(tasks) ? tasks.find((t: any) => t.id === selectedTaskId)?.ticketNumber : '' : ''}
              </DialogTitle>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="p-4">
            {selectedTaskId && Array.isArray(tasks) && (() => {
              const task = tasks.find((t: any) => t.id === selectedTaskId);
              if (!task) return null;
              
              return (
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="update">Update</TabsTrigger>
                    <TabsTrigger value="files">Files</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4">
                    {/* Task Info Section */}
                    <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Customer</label>
                        <p className="text-sm font-medium">{task.customer?.name || 'Unknown'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Priority</label>
                        <Badge className={`${getPriorityColor(task.priority)} mt-1`}>
                          {task.priority}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Assigned To</label>
                        <p className="text-sm">{task.assignedUser?.firstName} {task.assignedUser?.lastName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Issue Type</label>
                        <p className="text-sm">{task.issueType}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Created</label>
                        <p className="text-sm">{formatDateTime(task.createdAt)}</p>
                        <p className="text-xs text-gray-500">by {task.createdByUser?.firstName || 'System'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Duration</label>
                        <p className="text-sm font-medium">{calculateDuration(task)}</p>
                      </div>
                    </div>

                    {/* Description */}
                    {task.description && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Description</label>
                        <p className="text-sm p-3 bg-gray-50 rounded border">{task.description}</p>
                      </div>
                    )}

                    {/* Resolution */}
                    {task.resolution && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Resolution Details</label>
                        <p className="text-sm p-3 bg-green-50 rounded border border-green-200">{task.resolution}</p>
                      </div>
                    )}

                    {/* Field Team Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      {!task.fieldEngineerId && task.status !== "completed" && task.status !== "cancelled" && (
                        <Button 
                          onClick={() => handleMoveToFieldTeam(task)}
                          variant="outline"
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Move to Field Team
                        </Button>
                      )}
                      
                      {task.fieldEngineerId && task.status !== "completed" && task.status !== "cancelled" && (
                        <Button 
                          onClick={() => handleFieldWorkflow(task)}
                          variant="outline"
                          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Field Workflow
                        </Button>
                      )}
                      
                      {task.fieldEngineerId && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Field Engineer:</span> {task.fieldEngineer?.firstName} {task.fieldEngineer?.lastName}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Complete Task History
                      </h4>
                      {taskUpdates && Array.isArray(taskUpdates) && taskUpdates.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {taskUpdates.length} update{taskUpdates.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    
                    {taskUpdates && Array.isArray(taskUpdates) && taskUpdates.length > 0 ? (
                      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 p-4 space-y-4">
                        {taskUpdates.map((update: any) => (
                          <div key={update.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                            {/* Header with user info and timestamp */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  {getUpdateTypeIcon(update.updateType, update.oldValue, update.newValue, update.note)}
                                </div>
                                <div className="flex-1">
                                  <h5 className="text-sm font-semibold text-gray-900 mb-1">
                                    {getUpdateTypeTitle(update.updateType, update.oldValue, update.newValue, update.note)}
                                  </h5>
                                  <div className="text-xs text-gray-600 flex items-center gap-3">
                                    <span className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {update.updatedByUser 
                                        ? `${update.updatedByUser.firstName || ''} ${update.updatedByUser.lastName || ''}`.trim() || 'Unknown User'
                                        : update.updatedBy || 'System Update'
                                      }
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {formatUpdateTime(update.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Update details */}
                            <div className="space-y-3">
                              {/* Status/Priority Changes */}
                              {update.oldValue && update.newValue && (
                                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
                                  <div className="text-xs font-medium text-blue-800 mb-2">Change Details:</div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">
                                      {update.oldValue.replace(/_/g, ' ')}
                                    </Badge>
                                    <span className="text-gray-400">→</span>
                                    <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                                      {update.newValue.replace(/_/g, ' ')}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                              
                              {/* Notes/Comments */}
                              {update.note && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r">
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <div className="text-xs font-medium text-yellow-800 mb-1">
                                        {update.updateType === 'notes_added' || update.updateType === 'note_added' ? 'Note Added:' : 'Comment:'}
                                      </div>
                                      <div className="text-sm text-yellow-900 whitespace-pre-wrap">{update.note}</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* File Attachments */}
                              {update.attachments && update.attachments.length > 0 && (
                                <div className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded-r">
                                  <div className="flex items-start gap-2">
                                    <Upload className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <div className="text-xs font-medium text-purple-800 mb-2">
                                        Files Attached ({update.attachments.length}):
                                      </div>
                                      <div className="space-y-1">
                                        {update.attachments.map((file: string, index: number) => (
                                          <div key={index} className="flex items-center gap-2 text-xs bg-white border border-purple-200 px-2 py-1 rounded">
                                            {getFileIcon(file)}
                                            <span className="text-purple-800 font-medium">
                                              {file.includes('data:') ? `Document ${index + 1}` : file}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No Update History</h4>
                        <p className="text-gray-500">
                          This task hasn't been updated yet. Updates will appear here when engineers make changes.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="update" className="space-y-4">
                    {/* Update Section */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Update Task Status</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Status *</label>
                          {task.status === 'resolved' || task.status === 'completed' ? (
                            <div className="p-3 bg-gray-100 border border-gray-200 rounded-md">
                              <p className="text-sm text-gray-600">
                                Status: <span className="font-medium capitalize">{task.status?.replace('_', ' ')}</span>
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Task is {task.status} and cannot be modified
                              </p>
                            </div>
                          ) : (
                            <Select value={taskStatus} onValueChange={setTaskStatus}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-yellow-500" />
                                    Pending
                                  </div>
                                </SelectItem>
                                <SelectItem value="start_task">
                                  <div className="flex items-center gap-2">
                                  <Play className="w-4 h-4 text-blue-500" />
                                  Start Task
                                </div>
                              </SelectItem>
                              <SelectItem value="in_progress">
                                <div className="flex items-center gap-2">
                                  <Loader className="w-4 h-4 text-blue-500" />
                                  In Progress
                                </div>
                              </SelectItem>
                              <SelectItem value="resolved">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                                  Resolved
                                </div>
                              </SelectItem>
                              <SelectItem value="completed">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  Completed
                                </div>
                              </SelectItem>
                              <SelectItem value="cancelled">
                                <div className="flex items-center gap-2">
                                  <X className="w-4 h-4 text-red-500" />
                                  Cancelled
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Current Status</label>
                          <div className="p-2 bg-gray-50 rounded border">
                            <Badge className={getStatusColor(task.status)}>
                              {task.status ? task.status.replace('_', ' ') : 'Unknown'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          {taskStatus === 'completed' ? 'Resolution Notes *' : 'Update Notes'}
                        </label>
                        <Textarea
                          value={updateNotes}
                          onChange={(e) => setUpdateNotes(e.target.value)}
                          placeholder={
                            task.status === 'resolved' || task.status === 'completed' 
                              ? "Task is finalized - no further updates allowed"
                              : (taskStatus === 'completed' 
                                ? "Describe how the issue was resolved..." 
                                : "Add progress updates, findings, or comments...")
                          }
                          rows={4}
                          className="resize-none"
                          disabled={task.status === 'resolved' || task.status === 'completed'}
                        />
                        {taskStatus === 'completed' && task.status !== 'resolved' && task.status !== 'completed' && (
                          <p className="text-xs text-gray-500">
                            Required when marking task as completed
                          </p>
                        )}
                        {(task.status === 'resolved' || task.status === 'completed') && (
                          <p className="text-xs text-blue-600">
                            ℹ️ This task has been finalized and cannot be modified further
                          </p>
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
                      
                      <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button variant="outline" onClick={handleCloseModal}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleUpdateTask}
                          disabled={task.status === 'resolved' || task.status === 'completed' || updateTaskMutation.isPending || (!taskStatus && !updateNotes.trim())}
                          className="gradient-blue text-white"
                        >
                          {updateTaskMutation.isPending ? (
                            <div className="flex items-center gap-2">
                              <Loader className="w-4 h-4 animate-spin" />
                              Updating...
                            </div>
                          ) : (
                            taskStatus === 'completed' ? "Complete Task" : "Update Task"
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="files" className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Files & Documents
                    </h4>
                    
                    <div className="space-y-4">
                      {/* File Upload Section */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-4">
                            <label htmlFor="file-upload" className="cursor-pointer">
                              <span className="mt-2 block text-sm font-medium text-gray-900">
                                Upload images or documents
                              </span>
                              <span className="mt-1 block text-sm text-gray-500">
                                PNG, JPG, PDF up to 10MB each
                              </span>
                            </label>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              multiple
                              accept="image/*,.pdf,.doc,.docx"
                              onChange={handleFileChange}
                            />
                          </div>
                          <div className="mt-6">
                            <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                              Select Files
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Selected Files */}
                      {uploadFiles.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Selected Files</label>
                          <div className="space-y-2">
                            {uploadFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                                <div className="flex items-center gap-2">
                                  {getFileIcon(file.name)}
                                  <span className="text-sm">{file.name}</span>
                                  <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upload Notes */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Upload Notes (Optional)</label>
                        <Textarea
                          value={uploadNotes}
                          onChange={(e) => setUploadNotes(e.target.value)}
                          placeholder="Add context about these files..."
                          rows={3}
                          className="resize-none"
                        />
                      </div>

                      {/* Upload Button */}
                      <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button
                          onClick={handleFileUpload}
                          disabled={uploadFiles.length === 0 || uploadFilesMutation.isPending}
                          className="gradient-blue text-white"
                        >
                          {uploadFilesMutation.isPending ? (
                            <div className="flex items-center gap-2">
                              <Loader className="w-4 h-4 animate-spin" />
                              Uploading...
                            </div>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload {uploadFiles.length} File{uploadFiles.length !== 1 ? 's' : ''}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Field Engineer Assignment Modal */}
      <FieldEngineerAssignmentModal
        isOpen={showFieldAssignment}
        onClose={() => {
          setShowFieldAssignment(false);
          setSelectedTaskForField(null);
        }}
        taskId={selectedTaskForField?.id || 0}
        taskTitle={selectedTaskForField?.ticketNumber || ''}
      />

      {/* Field Task Workflow Modal */}
      {selectedTaskForField && (
        <FieldTaskWorkflowModal
          isOpen={showFieldWorkflow}
          onClose={() => {
            setShowFieldWorkflow(false);
            setSelectedTaskForField(null);
          }}
          task={selectedTaskForField}
        />
      )}
      {/* Filter Modal */}
      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Tasks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by ticket #, type, customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Priority
              </label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="start_task">Start Task</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setPriorityFilter("all");
                  setStatusFilter("all");
                }}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>
              <Button
                onClick={() => setShowFilterModal(false)}
                className="flex-1"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Form Modal */}
      <TaskFormModal 
        isOpen={showTaskForm} 
        onClose={() => setShowTaskForm(false)} 
      />
    </div>
  );
}
