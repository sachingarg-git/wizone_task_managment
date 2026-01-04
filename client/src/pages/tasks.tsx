import React, { useState, useEffect, useMemo } from "react";
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
  Trash2,
  LayoutList,
  Timer,
  Zap,
  AlertTriangle,
  Wifi,
  WifiOff
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
  const [assignedToFilter, setAssignedToFilter] = useState<string>("all");
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalTaskId, setApprovalTaskId] = useState<number | null>(null);
  const [approvalAction, setApprovalAction] = useState<"approved" | "rejected">("approved");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadNotes, setUploadNotes] = useState<string>("");
  const [showFieldAssignment, setShowFieldAssignment] = useState(false);
  const [showFieldWorkflow, setShowFieldWorkflow] = useState(false);
  const [selectedTaskForField, setSelectedTaskForField] = useState<any>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Test Connection state for AUTO-DOWN tasks
  const [testingConnectionTaskId, setTestingConnectionTaskId] = useState<number | null>(null);
  const [showTestConnectionDialog, setShowTestConnectionDialog] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState<any>(null);
  const [selectedTaskForTest, setSelectedTaskForTest] = useState<any>(null);
  
  // Pagination states for each table
  const [pendingEntriesPerPage, setPendingEntriesPerPage] = useState(10);
  const [inProgressEntriesPerPage, setInProgressEntriesPerPage] = useState(10);
  const [completedEntriesPerPage, setCompletedEntriesPerPage] = useState(10);
  const [approvedEntriesPerPage, setApprovedEntriesPerPage] = useState(10);
  const [cancelledEntriesPerPage, setCancelledEntriesPerPage] = useState(10);
  const [resolutionTimeFilter, setResolutionTimeFilter] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle URL parameter filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const statusParam = urlParams.get('status');
    const assignedToParam = urlParams.get('assignedTo');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
    if (assignedToParam) {
      setAssignedToFilter(assignedToParam);
    }
  }, [location]);

  // Direct fetch for tasks - fast async approach
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<Error | null>(null);

  // Fetch tasks on mount - optimized for network performance
  useEffect(() => {
    setTasksLoading(true);
    fetch('/api/tasks', { credentials: 'include' })
      .then(async r => {
        if (!r.ok) {
          throw new Error(`Failed to fetch tasks: ${r.status}`);
        }
        return r.json();
      })
      .then(data => {
        setTasks(data || []);
        setTasksError(null);
      })
      .catch((err) => {
        console.error('Failed to load tasks:', err);
        setTasksError(err);
        setTasks([]);
      })
      .finally(() => {
        setTasksLoading(false);
      });
  }, []);
  
  // Refetch function for mutations
  const refetchTasks = async () => {
    setTasksLoading(true);
    setTasksError(null);
    try {
      const res = await fetch('/api/tasks', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to fetch tasks: ${res.status}`);
      }
      const data = await res.json();
      console.log('Tasks refetched:', Array.isArray(data) ? data.length : 0, 'tasks');
      setTasks(data || []);
    } catch (e: any) {
      console.error('Refetch error:', e);
      setTasksError(e);
    } finally {
      setTasksLoading(false);
    }
  };
  
  // Filter tasks locally based on current filters
  const filteredTasks = React.useMemo(() => {
    console.time('🔍 Memo: filteredTasks');
    if (!tasks || !Array.isArray(tasks)) {
      console.timeEnd('🔍 Memo: filteredTasks');
      return [];
    }
    
    const result = tasks.filter((task: any) => {
      const matchesSearch = searchQuery === "" || 
        task.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (Array.isArray(task.customerName) ? task.customerName[0] : task.customerName)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesAssigned = assignedToFilter === "all" || String(task.assignedTo) === assignedToFilter;
      
      return matchesSearch && matchesPriority && matchesStatus && matchesAssigned;
    });
    console.timeEnd('🔍 Memo: filteredTasks');
    console.log(`✅ filteredTasks computed: ${result.length} tasks`);
    return result;
  }, [tasks, searchQuery, priorityFilter, statusFilter, assignedToFilter]);

  // Memoize task lists by status for better performance
  const pendingTasks = React.useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    return tasks.filter((task: any) => {
      const matchesSearch = searchQuery === "" || 
        task.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (Array.isArray(task.customerName) ? task.customerName[0] : task.customerName)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const isPending = task.status === 'pending';
      return matchesSearch && matchesPriority && matchesStatus && isPending;
    }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tasks, searchQuery, priorityFilter, statusFilter]);

  const inProgressTasks = React.useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    return tasks.filter((task: any) => {
      const matchesSearch = searchQuery === "" || 
        task.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (Array.isArray(task.customerName) ? task.customerName[0] : task.customerName)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const isInProgress = task.status === 'in_progress' || task.status === 'in-progress';
      return matchesSearch && matchesPriority && matchesStatus && isInProgress;
    }).sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [tasks, searchQuery, priorityFilter, statusFilter]);

  const completedTasks = React.useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    return tasks.filter((task: any) => {
      const matchesSearch = searchQuery === "" || 
        task.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (Array.isArray(task.customerName) ? task.customerName[0] : task.customerName)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const isCompleted = task.status === 'completed';
      return matchesSearch && matchesPriority && matchesStatus && isCompleted;
    }).sort((a: any, b: any) => new Date(b.completionTime || b.updatedAt || b.createdAt).getTime() - new Date(a.completionTime || a.updatedAt || a.createdAt).getTime());
  }, [tasks, searchQuery, priorityFilter, statusFilter]);

  const approvedTasks = React.useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    return tasks.filter((task: any) => {
      const matchesSearch = searchQuery === "" || 
        task.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (Array.isArray(task.customerName) ? task.customerName[0] : task.customerName)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const isApproved = task.status === 'approved';
      return matchesSearch && matchesPriority && matchesStatus && isApproved;
    }).sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }, [tasks, searchQuery, priorityFilter, statusFilter]);

  const rejectedTasks = React.useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    return tasks.filter((task: any) => {
      const matchesSearch = searchQuery === "" || 
        task.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (Array.isArray(task.customerName) ? task.customerName[0] : task.customerName)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const isRejected = task.status === 'rejected';
      return matchesSearch && matchesPriority && matchesStatus && isRejected;
    }).sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }, [tasks, searchQuery, priorityFilter, statusFilter]);

  const resolvedTasks = React.useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    return tasks.filter((task: any) => {
      const matchesSearch = searchQuery === "" || 
        task.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (Array.isArray(task.customerName) ? task.customerName[0] : task.customerName)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const isResolved = task.status === 'resolved';
      return matchesSearch && matchesPriority && matchesStatus && isResolved;
    }).sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }, [tasks, searchQuery, priorityFilter, statusFilter]);

  const cancelledTasks = React.useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    return tasks.filter((task: any) => {
      const matchesSearch = searchQuery === "" || 
        task.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (Array.isArray(task.customerName) ? task.customerName[0] : task.customerName)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const isCancelled = task.status === 'cancelled';
      return matchesSearch && matchesPriority && matchesStatus && isCancelled;
    }).sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [tasks, searchQuery, priorityFilter, statusFilter]);

  // Helper to get resolution time in hours for filtering
  const getResolutionHours = (task: any): number | null => {
    if (!task.completionTime || !task.createdAt) return null;
    const start = new Date(task.createdAt).getTime();
    const end = new Date(task.completionTime).getTime();
    return (end - start) / (1000 * 60 * 60); // hours
  };

  // Memoize resolution time filtered tasks
  const resolutionFilteredTasks = React.useMemo(() => {
    if (!tasks || !Array.isArray(tasks) || !resolutionTimeFilter) return [];
    return tasks.filter((task: any) => {
      const isResolved = task.status === 'completed' || task.status === 'approved' || task.status === 'resolved';
      if (!isResolved || !task.completionTime) return false;
      
      const hrs = getResolutionHours(task);
      if (hrs === null) return false;
      
      switch (resolutionTimeFilter) {
        case 'under3hrs': return hrs <= 3;
        case 'under6hrs': return hrs > 3 && hrs <= 6;
        case 'under12hrs': return hrs > 6 && hrs <= 12;
        case 'over12hrs': return hrs > 12;
        default: return false;
      }
    }).sort((a: any, b: any) => new Date(b.completionTime).getTime() - new Date(a.completionTime).getTime());
  }, [tasks, resolutionTimeFilter]);

  const { data: taskStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/tasks/stats"],
    queryFn: async () => {
      const res = await fetch('/api/tasks/stats', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error('Failed to fetch task stats');
      }
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: backendEngineers = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users", { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error('Failed to fetch users');
      }
      const users = await response.json();
      return users.filter((user: any) => user.role === 'backend_engineer' || user.role === 'admin');
    },
    staleTime: 0,
  });

  // Get all users for filter display
  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/users/all"],
    queryFn: async () => {
      const response = await fetch("/api/users", { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error('Failed to fetch users');
      }
      return response.json();
    },
    staleTime: 0,
  });

  // Get the filtered user's name for display
  const filteredUserName = assignedToFilter !== 'all' && allUsers && allUsers.length > 0
    ? allUsers.find((u: any) => String(u.id) === String(assignedToFilter))
    : null;

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user", { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) return null;
        throw new Error('Failed to fetch current user');
      }
      return response.json();
    },
    staleTime: 0,
  });

  const quickAssignMutation = useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: number; userId: string }) => {
      await apiRequest("PUT", `/api/tasks/${taskId}`, { assignedTo: userId });
    },
    onSuccess: () => {
      refetchTasks();
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
      refetchTasks();
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
      refetchTasks();
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

  const approveTaskMutation = useMutation({
    mutationFn: async (data: { taskId: number; action: "approved" | "rejected"; notes: string }) => {
      await apiRequest("PUT", `/api/tasks/${data.taskId}`, { 
        status: data.action,
        updateNotes: data.notes 
      });
    },
    onSuccess: () => {
      refetchTasks();
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
      if (approvalTaskId) {
        queryClient.invalidateQueries({ queryKey: [`/api/tasks/${approvalTaskId}/updates`] });
      }
      setShowApprovalDialog(false);
      setApprovalTaskId(null);
      setApprovalAction("approved");
      setApprovalNotes("");
      toast({
        title: "Success",
        description: approvalAction === "approved" ? "Task approved successfully" : "Task rejected successfully",
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
        description: "Failed to process approval",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      refetchTasks();
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

  // Test tower connection for AUTO-DOWN tasks
  const testTowerConnectionMutation = useMutation({
    mutationFn: async ({ taskId, autoResolve }: { taskId: number; autoResolve: boolean }) => {
      const response = await fetch(`/api/tasks/${taskId}/test-tower-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ autoResolve })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to test connection');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setTestConnectionResult(data);
      if (data.taskResolved) {
        refetchTasks();
        queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/network/towers"] });
        toast({
          title: "Tower Online!",
          description: data.message,
        });
      } else if (data.success) {
        toast({
          title: "Connection Test Complete",
          description: data.message,
        });
      } else {
        toast({
          title: "Tower Offline",
          description: "Tower is still not responding",
          variant: "destructive",
        });
      }
      setTestingConnectionTaskId(null);
    },
    onError: (error: Error) => {
      setTestingConnectionTaskId(null);
      toast({
        title: "Error",
        description: error.message || "Failed to test connection",
        variant: "destructive",
      });
    },
  });

  const handleTestConnection = (task: any, autoResolve: boolean = false) => {
    setTestingConnectionTaskId(task.id);
    setSelectedTaskForTest(task);
    testTowerConnectionMutation.mutate({ taskId: task.id, autoResolve });
  };

  // Query for task updates/history
  const { data: taskUpdates } = useQuery<any[]>({
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
    // Only calculate duration if task has completion time (completed/resolved/approved/rejected)
    if (task.completionTime) {
      const start = new Date(task.createdAt);
      const end = new Date(task.completionTime);
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.round(diffMs / (1000 * 60));
      
      if (diffMins < 60) return `${diffMins}m`;
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    } else {
      // For pending/in-progress tasks, don't show duration until completed
      return '-';
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
      case 'pending': return 'bg-amber-100 text-amber-800 font-medium';
      case 'start_task': return 'bg-blue-100 text-blue-800 font-medium';
      case 'in_progress': return 'bg-blue-100 text-blue-800 font-medium';
      case 'resolved': return 'bg-teal-100 text-teal-800 font-medium';
      case 'completed': return 'bg-emerald-100 text-emerald-800 font-medium';
      case 'approved': return 'bg-green-100 text-green-800 font-medium';
      case 'rejected': return 'bg-red-100 text-red-800 font-medium';
      case 'cancelled': return 'bg-red-100 text-red-800 font-medium';
      default: return 'bg-gray-100 text-gray-700 font-medium';
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
        actions={
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={() => {
                refetchTasks();
                queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
                toast({ title: "Refreshed", description: "Tasks refreshed successfully" });
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
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
        }
      />
      
      <div className="p-6 space-y-8">
        {/* Task Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {statsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 border-l-4 border-l-slate-500 bg-gradient-to-r from-slate-50 to-white"
                onClick={() => setStatusFilter('all')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Total Tasks</p>
                      <p className="text-4xl font-bold text-slate-800 mt-1">{(taskStats as any)?.total || 0}</p>
                    </div>
                    <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center shadow-sm">
                      <LayoutList className="w-7 h-7 text-slate-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-white"
                onClick={() => setStatusFilter('pending')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Pending Tasks</p>
                      <p className="text-4xl font-bold text-amber-600 mt-1">{(taskStats as any)?.pending || 0}</p>
                    </div>
                    <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center shadow-sm">
                      <Clock className="w-7 h-7 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white"
                onClick={() => setStatusFilter('in_progress')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">In Progress</p>
                      <p className="text-4xl font-bold text-blue-600 mt-1">{(taskStats as any)?.inProgress || 0}</p>
                    </div>
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center shadow-sm">
                      <Loader className="w-7 h-7 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-white"
                onClick={() => setStatusFilter('approved')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Approved Tasks</p>
                      <p className="text-4xl font-bold text-purple-600 mt-1">{(taskStats as any)?.approved || 0}</p>
                    </div>
                    <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center shadow-sm">
                      <TrendingUp className="w-7 h-7 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-white"
                onClick={() => setStatusFilter('completed')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Completed Today</p>
                      <p className="text-4xl font-bold text-emerald-600 mt-1">{(taskStats as any)?.completed || 0}</p>
                    </div>
                    <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center shadow-sm">
                      <CheckCircle className="w-7 h-7 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-white"
                onClick={() => setStatusFilter('cancelled')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">Cancelled Tasks</p>
                      <p className="text-4xl font-bold text-red-600 mt-1">{(taskStats as any)?.cancelledTasks || 0}</p>
                    </div>
                    <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center shadow-sm">
                      <X className="w-7 h-7 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resolution Time Cards */}
              <Card 
                className={`cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 border-l-4 border-l-green-600 bg-gradient-to-r from-green-50 to-white ${resolutionTimeFilter === 'under3hrs' ? 'ring-2 ring-green-500' : ''}`}
                onClick={() => setResolutionTimeFilter(resolutionTimeFilter === 'under3hrs' ? null : 'under3hrs')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Under 3 Hrs</p>
                      <p className="text-4xl font-bold text-green-600 mt-1">{(taskStats as any)?.under3hrs || 0}</p>
                    </div>
                    <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center shadow-sm">
                      <Zap className="w-7 h-7 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 border-l-4 border-l-cyan-500 bg-gradient-to-r from-cyan-50 to-white ${resolutionTimeFilter === 'under6hrs' ? 'ring-2 ring-cyan-500' : ''}`}
                onClick={() => setResolutionTimeFilter(resolutionTimeFilter === 'under6hrs' ? null : 'under6hrs')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-cyan-700 uppercase tracking-wide">Under 6 Hrs</p>
                      <p className="text-4xl font-bold text-cyan-600 mt-1">{(taskStats as any)?.under6hrs || 0}</p>
                    </div>
                    <div className="w-14 h-14 bg-cyan-100 rounded-xl flex items-center justify-center shadow-sm">
                      <Timer className="w-7 h-7 text-cyan-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-white ${resolutionTimeFilter === 'under12hrs' ? 'ring-2 ring-amber-500' : ''}`}
                onClick={() => setResolutionTimeFilter(resolutionTimeFilter === 'under12hrs' ? null : 'under12hrs')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Under 12 Hrs</p>
                      <p className="text-4xl font-bold text-amber-600 mt-1">{(taskStats as any)?.under12hrs || 0}</p>
                    </div>
                    <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center shadow-sm">
                      <Clock className="w-7 h-7 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 border-l-4 border-l-rose-500 bg-gradient-to-r from-rose-50 to-white ${resolutionTimeFilter === 'over12hrs' ? 'ring-2 ring-rose-500' : ''}`}
                onClick={() => setResolutionTimeFilter(resolutionTimeFilter === 'over12hrs' ? null : 'over12hrs')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-rose-700 uppercase tracking-wide">Over 12 Hrs</p>
                      <p className="text-4xl font-bold text-rose-600 mt-1">{(taskStats as any)?.over12hrs || 0}</p>
                    </div>
                    <div className="w-14 h-14 bg-rose-100 rounded-xl flex items-center justify-center shadow-sm">
                      <AlertTriangle className="w-7 h-7 text-rose-600" />
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
              <div className="flex items-center gap-3">
                <CardTitle>
                  {filteredUserName 
                    ? `Tasks for ${filteredUserName.firstName || filteredUserName.username} ${filteredUserName.lastName || ''}`.trim()
                    : 'All Tasks'
                  }
                </CardTitle>
                {filteredUserName && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Filtered by User
                  </Badge>
                )}
              </div>
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
                {(searchQuery || priorityFilter !== 'all' || statusFilter !== 'all' || assignedToFilter !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setPriorityFilter("all");
                      setStatusFilter("all");
                      setAssignedToFilter("all");
                      // Clear URL params
                      window.history.replaceState({}, '', '/tasks');
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
              <div className="text-center py-8 text-gray-500">
                <Loader className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-500" />
                <p>Loading tasks...</p>
              </div>
            ) : tasksError ? (
              <div className="text-center py-8 text-red-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                <p>Error loading tasks: {(tasksError as Error).message}</p>
                <Button onClick={() => refetchTasks()} className="mt-4">
                  Retry
                </Button>
              </div>
            ) : tasks.length > 0 ? (
              <div className="space-y-8">
                {/* Resolution Time Filtered Tasks Section - Shows when filter is active */}
                {resolutionTimeFilter && (() => {
                  const filterLabel = resolutionTimeFilter === 'under3hrs' ? 'Under 3 Hours' :
                                     resolutionTimeFilter === 'under6hrs' ? '3-6 Hours' :
                                     resolutionTimeFilter === 'under12hrs' ? '6-12 Hours' : 'Over 12 Hours';

                  return (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Tasks Resolved {filterLabel}
                          </h3>
                          <Badge variant="outline" className={`${
                            resolutionTimeFilter === 'under3hrs' ? 'bg-green-50 text-green-700 border-green-200' :
                            resolutionTimeFilter === 'under6hrs' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                            resolutionTimeFilter === 'under12hrs' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {resolutionFilteredTasks.length} task{resolutionFilteredTasks.length !== 1 ? 's' : ''}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setResolutionTimeFilter(null)}
                            className="text-gray-500 hover:text-gray-700 ml-2"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Clear Filter
                          </Button>
                        </div>
                      </div>
                      {resolutionFilteredTasks.length > 0 ? (
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto border rounded-lg">
                          <Table>
                            <TableHeader className="sticky top-0 z-10 bg-white">
                              <TableRow>
                                <TableHead>Task ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Issue Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Assigned To</TableHead>
                                <TableHead>Field Engineer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Resolved</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {resolutionFilteredTasks.map((task: any) => (
                                <TableRow key={task.id} className={`${
                                  resolutionTimeFilter === 'under3hrs' ? 'bg-green-50/60 hover:bg-green-100/80 border-l-4 border-l-green-400' :
                                  resolutionTimeFilter === 'under6hrs' ? 'bg-cyan-50/60 hover:bg-cyan-100/80 border-l-4 border-l-cyan-400' :
                                  resolutionTimeFilter === 'under12hrs' ? 'bg-amber-50/60 hover:bg-amber-100/80 border-l-4 border-l-amber-400' :
                                  'bg-rose-50/60 hover:bg-rose-100/80 border-l-4 border-l-rose-400'
                                }`}>
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
                                      <div className="font-medium">
                                        {Array.isArray(task.customerName) 
                                          ? task.customerName[0] || 'Unknown Customer'
                                          : task.customerName || 'Unknown Customer'
                                        }
                                      </div>
                                      <div className="text-sm text-gray-500">{task.customer?.city}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{task.category}</TableCell>
                                  <TableCell>
                                    <span className="text-sm text-gray-600 line-clamp-2" title={task.description || 'No description'}>
                                      {task.description || '-'}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {task.assignedUser ? (
                                      <div className="font-medium text-gray-900">
                                        {task.assignedUser.firstName} {task.assignedUser.lastName}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 italic">Not Assigned</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {task.fieldEngineer ? (
                                      <div className="font-medium text-blue-600">
                                        {task.fieldEngineer.firstName} {task.fieldEngineer.lastName}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 italic">Not Assigned</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={getStatusColor(task.status)}>
                                      {task.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">{formatDateTime(task.createdAt)}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm text-green-600 font-medium">{formatDateTime(task.completionTime)}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className={`text-sm font-bold ${
                                      resolutionTimeFilter === 'under3hrs' ? 'text-green-600' :
                                      resolutionTimeFilter === 'under6hrs' ? 'text-cyan-600' :
                                      resolutionTimeFilter === 'under12hrs' ? 'text-amber-600' : 'text-rose-600'
                                    }`}>
                                      {calculateDuration(task)}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleViewTask(task.id)}
                                      title="View Task"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 border rounded-lg">
                          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No tasks found resolved {filterLabel.toLowerCase()}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Only show regular sections when no resolution time filter is active */}
                {!resolutionTimeFilter && (
                  <>
                {/* Pending Tasks Section - Only 'pending' status */}
                {(() => {
                  return pendingTasks.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">Pending Tasks</h3>
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            {pendingTasks.length} task{pendingTasks.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Show:</span>
                          <Select value={String(pendingEntriesPerPage)} onValueChange={(v) => setPendingEntriesPerPage(Number(v))}>
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                              <SelectItem value="200">200</SelectItem>
                              <SelectItem value="500">500</SelectItem>
                              <SelectItem value="1000">1000</SelectItem>
                              <SelectItem value="2000">2000</SelectItem>
                              <SelectItem value="5000">5000</SelectItem>
                              <SelectItem value="100000">All</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-gray-600">entries</span>
                        </div>
                      </div>
                      <div className={`overflow-x-auto ${pendingEntriesPerPage > 10 ? 'max-h-[600px] overflow-y-auto' : ''}`}>
                        <Table>
                          <TableHeader className="sticky top-0 z-10">
                            <TableRow>
                              <TableHead>Task ID</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Issue Type</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Assigned To</TableHead>
                              <TableHead>Field Engineer</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingTasks.slice(0, pendingEntriesPerPage).map((task: any) => (
                              <TableRow key={task.id} className="bg-amber-50/60 hover:bg-amber-100/80 border-l-4 border-l-amber-400">
                                <TableCell className="font-medium">
                                  <button
                                    onClick={() => handleTaskIdClick(task)}
                                    className="text-primary hover:text-primary/80 underline hover:no-underline font-medium flex items-center gap-1"
                                  >
                                    {task.ticketNumber}
                                    {task.title && (task.title.includes('_2') || task.title.includes('_3') || task.title.includes('_4') || task.title.includes('_5') || task.title.includes('_6') || task.title.includes('_7') || task.title.includes('_8') || task.title.includes('_9')) && (
                                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full">
                                        D
                                      </span>
                                    )}
                                  </button>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {Array.isArray(task.customerName) 
                                        ? task.customerName[0] || 'Unknown Customer'
                                        : task.customerName || 'Unknown Customer'
                                      }
                                    </div>
                                    <div className="text-sm text-gray-500">{task.customer?.city}</div>
                                  </div>
                                </TableCell>
                                <TableCell>{task.category}</TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600 line-clamp-2" title={task.description || 'No description'}>
                                    {task.description || '-'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    {task.assignedUser ? (
                                      <>
                                        <div className="font-medium">
                                          {task.assignedUser.firstName} {task.assignedUser.lastName}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-gray-400 italic">Unassigned</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    {task.fieldEngineer ? (
                                      <>
                                        <div className="font-medium text-blue-600">
                                          {task.fieldEngineer.firstName} {task.fieldEngineer.lastName}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-gray-400 italic">Not Assigned</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-amber-100 text-amber-800 font-medium capitalize">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Pending
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
                                  <div className="text-sm font-medium">{calculateDuration(task)}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    {/* Test Connection button for AUTO-DOWN tasks */}
                                    {task.ticketNumber?.startsWith('AUTO-DOWN') && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleTestConnection(task, true)}
                                        disabled={testingConnectionTaskId === task.id}
                                        title="Test Connection & Resolve if Online"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                      >
                                        {testingConnectionTaskId === task.id ? (
                                          <Loader className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Wifi className="w-4 h-4" />
                                        )}
                                      </Button>
                                    )}
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleViewTask(task.id)}
                                      title="View Task"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    {currentUser?.role === 'admin' && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDeleteTask(task.id, task.ticketNumber)}
                                        title="Delete Task"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        Showing {Math.min(pendingEntriesPerPage, pendingTasks.length)} of {pendingTasks.length} entries
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* In Progress Tasks Section */}
                {(() => {
                  return inProgressTasks.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">In Progress Tasks</h3>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            {inProgressTasks.length} task{inProgressTasks.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Show:</span>
                          <Select value={String(inProgressEntriesPerPage)} onValueChange={(v) => setInProgressEntriesPerPage(Number(v))}>
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                              <SelectItem value="200">200</SelectItem>
                              <SelectItem value="500">500</SelectItem>
                              <SelectItem value="1000">1000</SelectItem>
                              <SelectItem value="2000">2000</SelectItem>
                              <SelectItem value="5000">5000</SelectItem>
                              <SelectItem value="100000">All</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-gray-600">entries</span>
                        </div>
                      </div>
                      <div className={`overflow-x-auto ${inProgressEntriesPerPage > 10 ? 'max-h-[600px] overflow-y-auto' : ''}`}>
                        <Table>
                          <TableHeader className="sticky top-0 z-10">
                            <TableRow>
                              <TableHead>Task ID</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Issue Type</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Assigned To</TableHead>
                              <TableHead>Field Engineer</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inProgressTasks.slice(0, inProgressEntriesPerPage).map((task: any) => (
                              <TableRow key={task.id} className="bg-blue-50/60 hover:bg-blue-100/80 border-l-4 border-l-blue-400">
                                <TableCell className="font-medium">
                                  <button
                                    onClick={() => handleTaskIdClick(task)}
                                    className="text-primary hover:text-primary/80 underline hover:no-underline font-medium flex items-center gap-1"
                                  >
                                    {task.ticketNumber}
                                    {task.title && (task.title.includes('_2') || task.title.includes('_3') || task.title.includes('_4') || task.title.includes('_5') || task.title.includes('_6') || task.title.includes('_7') || task.title.includes('_8') || task.title.includes('_9')) && (
                                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full">
                                        D
                                      </span>
                                    )}
                                  </button>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {Array.isArray(task.customerName) 
                                        ? task.customerName[0] || 'Unknown Customer'
                                        : task.customerName || 'Unknown Customer'
                                      }
                                    </div>
                                    <div className="text-sm text-gray-500">{task.customer?.city}</div>
                                  </div>
                                </TableCell>
                                <TableCell>{task.category}</TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600 line-clamp-2" title={task.description || 'No description'}>
                                    {task.description || '-'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    {task.assignedUser ? (
                                      <>
                                        <div className="font-medium">
                                          {task.assignedUser.firstName} {task.assignedUser.lastName}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-gray-400 italic">Unassigned</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    {task.fieldEngineer ? (
                                      <>
                                        <div className="font-medium text-blue-600">
                                          {task.fieldEngineer.firstName} {task.fieldEngineer.lastName}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-gray-400 italic">Not Assigned</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-blue-100 text-blue-800 font-medium capitalize">
                                    <Play className="w-3 h-3 mr-1" />
                                    In Progress
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
                                  <div className="text-sm font-medium">{calculateDuration(task)}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    {/* Test Connection button for AUTO-DOWN tasks */}
                                    {task.ticketNumber?.startsWith('AUTO-DOWN') && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleTestConnection(task, true)}
                                        disabled={testingConnectionTaskId === task.id}
                                        title="Test Connection & Resolve if Online"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                      >
                                        {testingConnectionTaskId === task.id ? (
                                          <Loader className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Wifi className="w-4 h-4" />
                                        )}
                                      </Button>
                                    )}
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleTaskIdClick(task)}
                                      title="View Details"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => deleteTaskMutation.mutate(task.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        title="Delete Task"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        Showing {Math.min(inProgressEntriesPerPage, inProgressTasks.length)} of {inProgressTasks.length} entries
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Completed Tasks Section - Only 'completed' status */}
                {(() => {
                  return completedTasks.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">Completed Tasks</h3>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Show:</span>
                          <Select value={String(completedEntriesPerPage)} onValueChange={(v) => setCompletedEntriesPerPage(Number(v))}>
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                              <SelectItem value="200">200</SelectItem>
                              <SelectItem value="500">500</SelectItem>
                              <SelectItem value="1000">1000</SelectItem>
                              <SelectItem value="2000">2000</SelectItem>
                              <SelectItem value="5000">5000</SelectItem>
                              <SelectItem value="100000">All</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-gray-600">entries</span>
                        </div>
                      </div>
                      <div className={`overflow-x-auto ${completedEntriesPerPage > 10 ? 'max-h-[600px] overflow-y-auto' : ''}`}>
                        <Table>
                          <TableHeader className="sticky top-0 z-10">
                            <TableRow>
                              <TableHead>Task ID</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Issue Type</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Assigned To</TableHead>
                              <TableHead>Field Engineer</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {completedTasks.slice(0, completedEntriesPerPage).map((task: any) => (
                              <TableRow key={task.id} className="bg-emerald-50/60 hover:bg-emerald-100/80 border-l-4 border-l-emerald-400">
                                <TableCell className="font-medium">
                                  <button
                                    onClick={() => handleTaskIdClick(task)}
                                    className="text-primary hover:text-primary/80 underline hover:no-underline font-medium flex items-center gap-1"
                                  >
                                    {task.ticketNumber}
                                    {task.title && (task.title.includes('_2') || task.title.includes('_3') || task.title.includes('_4') || task.title.includes('_5') || task.title.includes('_6') || task.title.includes('_7') || task.title.includes('_8') || task.title.includes('_9')) && (
                                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full">
                                        D
                                      </span>
                                    )}
                                  </button>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {Array.isArray(task.customerName) 
                                        ? task.customerName[0] || 'Unknown Customer'
                                        : task.customerName || 'Unknown Customer'
                                      }
                                    </div>
                                    <div className="text-sm text-gray-500">{task.customer?.city}</div>
                                  </div>
                                </TableCell>
                                <TableCell>{task.category}</TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600 line-clamp-2" title={task.description || 'No description'}>
                                    {task.description || '-'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    {task.assignedUser ? (
                                      <>
                                        <div className="font-medium">
                                          {task.assignedUser.firstName} {task.assignedUser.lastName}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-gray-400 italic">Unassigned</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    {task.fieldEngineer ? (
                                      <>
                                        <div className="font-medium text-blue-600">
                                          {task.fieldEngineer.firstName} {task.fieldEngineer.lastName}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-gray-400 italic">Not Assigned</span>
                                    )}
                                  </div>
                                </TableCell>
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
                                    {(task.status === 'completed' || task.status === 'resolved') && (currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setApprovalTaskId(task.id);
                                          setShowApprovalDialog(true);
                                        }}
                                        title="Approve/Reject Task"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleViewTask(task.id)}
                                      title="View Task"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    {currentUser?.role === 'admin' && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDeleteTask(task.id, task.ticketNumber)}
                                        title="Delete Task"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        Showing {Math.min(completedEntriesPerPage, completedTasks.length)} of {completedTasks.length} entries
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Resolved Tasks Section */}
                {(() => {
                  return resolvedTasks.length > 0 ? (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Resolved Tasks</h3>
                        <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                          {resolvedTasks.length} task{resolvedTasks.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Task ID</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Issue Type</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Assigned To</TableHead>
                              <TableHead>Field Engineer</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {resolvedTasks.map((task: any) => (
                              <TableRow key={task.id} className="bg-teal-50/60 hover:bg-teal-100/80 border-l-4 border-l-teal-400">
                                <TableCell className="font-medium">
                                  <button
                                    onClick={() => handleTaskIdClick(task)}
                                    className="text-primary hover:text-primary/80 underline hover:no-underline font-medium flex items-center gap-1"
                                  >
                                    {task.ticketNumber}
                                    {task.title && (task.title.includes('_2') || task.title.includes('_3') || task.title.includes('_4') || task.title.includes('_5') || task.title.includes('_6') || task.title.includes('_7') || task.title.includes('_8') || task.title.includes('_9')) && (
                                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full">
                                        D
                                      </span>
                                    )}
                                  </button>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {Array.isArray(task.customerName) 
                                        ? task.customerName[0] || 'Unknown Customer'
                                        : task.customerName || 'Unknown Customer'
                                      }
                                    </div>
                                    <div className="text-sm text-gray-500">{task.customer?.city}</div>
                                  </div>
                                </TableCell>
                                <TableCell>{task.category}</TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600 line-clamp-2" title={task.description || 'No description'}>
                                    {task.description || '-'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    {task.assignedUser ? (
                                      <>
                                        <div className="font-medium">
                                          {task.assignedUser.firstName} {task.assignedUser.lastName}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-gray-400 italic">Unassigned</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    {task.fieldEngineer ? (
                                      <>
                                        <div className="font-medium text-blue-600">
                                          {task.fieldEngineer.firstName} {task.fieldEngineer.lastName}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-gray-400 italic">Not Assigned</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-teal-100 text-teal-800 font-medium capitalize">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Resolved
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
                                  <div className="text-sm font-medium">{calculateDuration(task)}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleTaskIdClick(task)}
                                      title="View Details"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => deleteTaskMutation.mutate(task.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        title="Delete Task"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Approved Tasks Section */}
                {(() => {
                  return approvedTasks.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">Approved Tasks</h3>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {approvedTasks.length} task{approvedTasks.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Show:</span>
                          <Select value={String(approvedEntriesPerPage)} onValueChange={(v) => setApprovedEntriesPerPage(Number(v))}>
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                              <SelectItem value="200">200</SelectItem>
                              <SelectItem value="500">500</SelectItem>
                              <SelectItem value="1000">1000</SelectItem>
                              <SelectItem value="2000">2000</SelectItem>
                              <SelectItem value="5000">5000</SelectItem>
                              <SelectItem value="100000">All</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-gray-600">entries</span>
                        </div>
                      </div>
                      <div className={`overflow-x-auto ${approvedEntriesPerPage > 10 ? 'max-h-[600px] overflow-y-auto' : ''}`}>
                        <Table>
                          <TableHeader className="sticky top-0 z-10">
                            <TableRow>
                              <TableHead>Task ID</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Issue Type</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Assigned To</TableHead>
                              <TableHead>Field Engineer</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {approvedTasks.slice(0, approvedEntriesPerPage).map((task: any) => (
                              <TableRow key={task.id} className="bg-purple-50/60 hover:bg-purple-100/80 border-l-4 border-l-purple-400">
                                <TableCell className="font-medium">
                                  <button
                                    onClick={() => handleTaskIdClick(task)}
                                    className="text-primary hover:text-primary/80 underline hover:no-underline font-medium flex items-center gap-1"
                                  >
                                    {task.ticketNumber}
                                    {task.title && (task.title.includes('_2') || task.title.includes('_3') || task.title.includes('_4') || task.title.includes('_5') || task.title.includes('_6') || task.title.includes('_7') || task.title.includes('_8') || task.title.includes('_9')) && (
                                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full">
                                        D
                                      </span>
                                    )}
                                  </button>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {Array.isArray(task.customerName) 
                                        ? task.customerName[0] || 'Unknown Customer'
                                        : task.customerName || 'Unknown Customer'
                                      }
                                    </div>
                                    <div className="text-sm text-gray-500">{task.customer?.city}</div>
                                  </div>
                                </TableCell>
                                <TableCell>{task.category}</TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600 line-clamp-2" title={task.description || 'No description'}>
                                    {task.description || '-'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    {task.assignedUser ? (
                                      <>
                                        <div className="font-medium">
                                          {task.assignedUser.firstName} {task.assignedUser.lastName}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-gray-400 italic">Unassigned</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    {task.fieldEngineer ? (
                                      <>
                                        <div className="font-medium text-blue-600">
                                          {task.fieldEngineer.firstName} {task.fieldEngineer.lastName}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-gray-400 italic">Not Assigned</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-green-100 text-green-800 font-medium capitalize hover:bg-green-100">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Approved
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
                                    {task.createdByUser && (
                                      <div className="text-xs text-gray-500">
                                        Resolved by {task.createdByUser.firstName}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleViewTask(task.id)}
                                      title="View Task"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    {currentUser?.role === 'admin' && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDeleteTask(task.id, task.ticketNumber)}
                                        title="Delete Task"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        Showing {Math.min(approvedEntriesPerPage, approvedTasks.length)} of {approvedTasks.length} entries
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Rejected Tasks Section */}
                {(() => {
                  return rejectedTasks.length > 0 ? (
                    <div className="mt-8">
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Rejected Tasks</h3>
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {rejectedTasks.length} task{rejectedTasks.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Task ID</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Issue Type</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Assigned To</TableHead>
                              <TableHead>Field Engineer</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rejectedTasks.map((task: any) => (
                              <TableRow key={task.id} className="bg-red-50/60 hover:bg-red-100/80 border-l-4 border-l-red-400">
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <span className="text-blue-600">{task.ticketNumber}</span>
                                    {task.isDuplicate && (
                                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                                        D
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div className="font-medium">
                                      {Array.isArray(task.customerName) 
                                        ? task.customerName[0] || 'Unknown'
                                        : task.customerName || 'Unknown'
                                      }
                                    </div>
                                    {Array.isArray(task.customerName) && task.customerName[1] && (
                                      <div className="text-xs text-gray-500">{task.customerName[1]}</div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{task.issueType}</TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600 line-clamp-2" title={task.description || 'No description'}>
                                    {task.description || '-'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {task.assignedUser ? (
                                      <>
                                        <div className="font-medium">
                                          {task.assignedUser.firstName} {task.assignedUser.lastName}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-gray-400 italic">Unassigned</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {task.fieldEngineer ? (
                                      <>
                                        <div className="font-medium text-blue-600">
                                          {task.fieldEngineer.firstName} {task.fieldEngineer.lastName}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-gray-400 italic">Not Assigned</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                    <X className="w-3 h-3 mr-1" />
                                    Rejected
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div>{formatDateTime(task.createdAt)}</div>
                                    <div className="text-xs text-gray-500">
                                      by {task.createdByUser?.firstName || 'System'}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div className="font-medium">{calculateDuration(task)}</div>
                                    {task.createdByUser && (
                                      <div className="text-xs text-gray-500">
                                        Rejected by Admin
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleViewTask(task.id)}
                                      title="View Task"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    {currentUser?.role === 'admin' && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDeleteTask(task.id, task.ticketNumber)}
                                        title="Delete Task"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Cancelled Tasks Section */}
                {(() => {
                  return cancelledTasks.length > 0 ? (
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">Cancelled Tasks</h3>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {cancelledTasks.length} task{cancelledTasks.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Show:</span>
                          <Select value={String(cancelledEntriesPerPage)} onValueChange={(v) => setCancelledEntriesPerPage(Number(v))}>
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                              <SelectItem value="200">200</SelectItem>
                              <SelectItem value="500">500</SelectItem>
                              <SelectItem value="1000">1000</SelectItem>
                              <SelectItem value="2000">2000</SelectItem>
                              <SelectItem value="5000">5000</SelectItem>
                              <SelectItem value="100000">All</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-gray-600">entries</span>
                        </div>
                      </div>
                      <div className={`overflow-x-auto ${cancelledEntriesPerPage > 10 ? 'max-h-[600px] overflow-y-auto' : ''}`}>
                        <Table>
                          <TableHeader className="sticky top-0 z-10">
                            <TableRow>
                              <TableHead>Task ID</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Issue Type</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Assigned To</TableHead>
                              <TableHead>Field Engineer</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cancelledTasks.slice(0, cancelledEntriesPerPage).map((task: any) => (
                              <TableRow key={task.id} className="bg-red-50/60 hover:bg-red-100/80 border-l-4 border-l-red-400">
                                <TableCell className="font-medium">
                                  <button
                                    onClick={() => handleTaskIdClick(task)}
                                    className="text-primary hover:text-primary/80 underline hover:no-underline font-medium flex items-center gap-1"
                                  >
                                    {task.ticketNumber}
                                  </button>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {Array.isArray(task.customerName) 
                                        ? task.customerName[0] || 'Unknown Customer'
                                        : task.customerName || 'Unknown Customer'
                                      }
                                    </div>
                                    <div className="text-sm text-gray-500">{task.customer?.city}</div>
                                  </div>
                                </TableCell>
                                <TableCell>{task.category}</TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-600 line-clamp-2" title={task.description || 'No description'}>
                                    {task.description || '-'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    {task.assignedUser ? (
                                      <>
                                        <div className="font-medium">
                                          {task.assignedUser.firstName} {task.assignedUser.lastName}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-gray-400 italic">Unassigned</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    {task.fieldEngineer ? (
                                      <>
                                        <div className="font-medium text-blue-600">
                                          {task.fieldEngineer.firstName} {task.fieldEngineer.lastName}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-gray-400 italic">Not Assigned</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-red-100 text-red-800 font-medium capitalize hover:bg-red-100">
                                    <X className="w-3 h-3 mr-1" />
                                    Cancelled
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
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleViewTask(task.id)}
                                      title="View Task"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    {currentUser?.role === 'admin' && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDeleteTask(task.id, task.ticketNumber)}
                                        title="Delete Task"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        Showing {Math.min(cancelledEntriesPerPage, cancelledTasks.length)} of {cancelledTasks.length} entries
                      </div>
                    </div>
                  ) : null;
                })()}
                  </>
                )}
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
                        <p className="text-sm font-medium">
                          {Array.isArray(task.customerName) 
                            ? task.customerName[0] || 'Unknown'
                            : task.customerName || 'Unknown'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Priority</label>
                        <Badge className={`${getPriorityColor(task.priority)} mt-1`}>
                          {task.priority}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Assigned To</label>
                        {task.fieldEngineer ? (
                          <>
                            <p className="text-sm font-medium text-blue-600">{task.fieldEngineer.firstName} {task.fieldEngineer.lastName}</p>
                            <p className="text-xs text-gray-500">Field Engineer</p>
                          </>
                        ) : task.assignedUser ? (
                          <>
                            <p className="text-sm">{task.assignedUser.firstName} {task.assignedUser.lastName}</p>
                            <p className="text-xs text-gray-500">Backend Engineer</p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Unassigned</p>
                        )}
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
                                  {update.type === 'status_update' ? <RefreshCw className="w-4 h-4 text-blue-600" /> :
                                   update.type === 'comment' ? <MessageSquare className="w-4 h-4 text-blue-600" /> :
                                   update.type === 'file_upload' ? <Upload className="w-4 h-4 text-blue-600" /> :
                                   update.type === 'assignment' ? <User className="w-4 h-4 text-blue-600" /> :
                                   <Clock className="w-4 h-4 text-blue-600" />}
                                </div>
                                <div className="flex-1">
                                  <h5 className="text-sm font-semibold text-gray-900 mb-1">
                                    {update.type === 'status_update' ? 'Status Update' : 
                                     update.type === 'comment' ? 'Comment' :
                                     update.type === 'file_upload' ? 'File Upload' :
                                     update.type === 'assignment' ? 'Assignment' :
                                     update.type === 'completion' ? 'Completion' :
                                     'Task Updated'}
                                  </h5>
                                  <div className="text-xs text-gray-600 flex items-center gap-3">
                                    <span className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {update.updatedByUser 
                                        ? `${update.updatedByUser.firstName || ''} ${update.updatedByUser.lastName || ''}`.trim() || update.createdByName || 'Unknown User'
                                        : update.createdByName || 'System Update'
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
                              {/* Message/Notes */}
                              {update.message && (
                                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <div className="text-sm text-blue-900 whitespace-pre-wrap">
                                        {update.message.split('\n').map((line: string, idx: number) => {
                                          // Check if line contains file path or URL
                                          const fileMatch = line.match(/Files?:\s*(.*)/i);
                                          const urlMatch = line.match(/(\/downloads\/[^\s]+\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip|rar|csv))/i);
                                          
                                          if (fileMatch || urlMatch) {
                                            const filePath = fileMatch ? fileMatch[1] : urlMatch ? urlMatch[1] : '';
                                            const fileName = filePath.split('/').pop() || filePath;
                                            const isImage = /\.(jpg|jpeg|png|gif)$/i.test(filePath);
                                            
                                            return (
                                              <div key={idx} className="mb-2">
                                                {fileMatch && <div className="text-xs font-medium text-blue-700 mb-1">Attached Files:</div>}
                                                <div className="flex items-center gap-2 p-2 bg-white border border-blue-200 rounded">
                                                  <Paperclip className="w-4 h-4 text-blue-600" />
                                                  <span className="flex-1 text-sm font-medium text-blue-800 truncate" title={fileName}>
                                                    {fileName}
                                                  </span>
                                                  <div className="flex items-center gap-1">
                                                    {isImage && (
                                                      <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 px-2 text-xs hover:bg-blue-100"
                                                        onClick={() => {
                                                          const newWindow = window.open();
                                                          if (newWindow) {
                                                            newWindow.document.write(`<img src="${filePath}" style="max-width:100%;height:auto;" />`);
                                                          }
                                                        }}
                                                        title="View Image"
                                                      >
                                                        <Eye className="w-3 h-3" />
                                                      </Button>
                                                    )}
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      className="h-7 px-2 text-xs hover:bg-blue-100"
                                                      onClick={() => {
                                                        const link = document.createElement('a');
                                                        link.href = filePath;
                                                        link.download = fileName;
                                                        link.target = '_blank';
                                                        link.click();
                                                      }}
                                                      title="Download"
                                                    >
                                                      <Download className="w-3 h-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          }
                                          
                                          return <div key={idx}>{line}</div>;
                                        })}
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
                    {/* Field Team Assignment Section */}
                    {!task.fieldEngineerId && task.status !== "completed" && task.status !== "cancelled" && (
                      <Card className="border-blue-200 bg-blue-50">
                        <CardHeader>
                          <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Move to Field Team
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-blue-700 mb-3">Assign this task to field engineers for on-site work.</p>
                          <Button 
                            onClick={() => handleMoveToFieldTeam(task)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <User className="w-4 h-4 mr-2" />
                            Move to Field Team
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Field Engineer Information */}
                    {task.fieldEngineerId && (
                      <Card className="border-green-200 bg-green-50">
                        <CardHeader>
                          <CardTitle className="text-sm text-green-800 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Field Team Assignment
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-green-700 mb-3">
                            <span className="font-medium">Field Engineer:</span> {task.fieldEngineer?.firstName} {task.fieldEngineer?.lastName}
                          </div>
                          <Button 
                            onClick={() => handleFieldWorkflow(task)}
                            variant="outline"
                            className="border-green-300 text-green-700 hover:bg-green-100"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Field Workflow
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Update Section */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Update Task Status</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Status *</label>
                          {task.status === 'resolved' || task.status === 'completed' || task.status === 'cancelled' || task.status === 'approved' ? (
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
                            task.status === 'resolved' || task.status === 'completed' || task.status === 'cancelled' || task.status === 'approved'
                              ? "Task is finalized - no further updates allowed"
                              : (taskStatus === 'completed' 
                                ? "Describe how the issue was resolved..." 
                                : "Add progress updates, findings, or comments...")
                          }
                          rows={4}
                          className="resize-none"
                          disabled={task.status === 'resolved' || task.status === 'completed' || task.status === 'cancelled' || task.status === 'approved'}
                        />
                        {taskStatus === 'completed' && task.status !== 'resolved' && task.status !== 'completed' && (
                          <p className="text-xs text-gray-500">
                            Required when marking task as completed
                          </p>
                        )}
                        {(task.status === 'resolved' || task.status === 'completed' || task.status === 'cancelled' || task.status === 'approved') && (
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
                          disabled={task.status === 'resolved' || task.status === 'completed' || task.status === 'cancelled' || task.status === 'approved' || updateTaskMutation.isPending || (!taskStatus && !updateNotes.trim())}
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

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Task Approval
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Action *</label>
              <Select value={approvalAction} onValueChange={(value: "approved" | "rejected") => setApprovalAction(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Approve
                    </div>
                  </SelectItem>
                  <SelectItem value="rejected">
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4 text-red-600" />
                      Reject
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Notes *</label>
              <Textarea
                placeholder={approvalAction === "approved" ? "Add approval notes (e.g., Quality checked, work verified)" : "Add rejection reason (e.g., Incomplete work, needs revision)"}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">These notes will be saved in the task update history</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApprovalDialog(false);
                  setApprovalTaskId(null);
                  setApprovalAction("approved");
                  setApprovalNotes("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!approvalNotes.trim()) {
                    toast({
                      title: "Required",
                      description: "Please add notes for this action",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (approvalTaskId) {
                    approveTaskMutation.mutate({
                      taskId: approvalTaskId,
                      action: approvalAction,
                      notes: approvalNotes,
                    });
                  }
                }}
                disabled={!approvalNotes.trim() || approveTaskMutation.isPending}
                className={approvalAction === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              >
                {approveTaskMutation.isPending ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {approvalAction === "approved" ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Task
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Reject Task
                      </>
                    )}
                  </>
                )}
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
