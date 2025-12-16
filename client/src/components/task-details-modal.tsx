import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Star,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  ExternalLink,
  Copy,
  RefreshCw,
  Edit,
  Send
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number | null;
  taskNumber?: string;
}

interface TaskDetails {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  issueType: string;
  createdAt: string;
  updatedAt: string;
  completionTime?: string;
  assignedTo: string;
  fieldEngineerId?: string;
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
  };
  fieldEngineer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  customer?: {
    id: number;
    name: string;
    email: string;
    contactPerson: string;
    mobilePhone: string;
    address: string;
    city: string;
    state: string;
  };
  createdByUser?: {
    firstName: string;
    lastName: string;
  };
}

interface TaskUpdate {
  id: number;
  taskId: number;
  message: string;
  type: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  updatedByUser?: {
    firstName: string;
    lastName: string;
  };
}

export default function TaskDetailsModal({ isOpen, onClose, taskId, taskNumber }: TaskDetailsModalProps) {
  const { toast } = useToast();
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");

  // Fetch task details
  const { data: task, isLoading: taskLoading, refetch: refetchTask } = useQuery<TaskDetails>({
    queryKey: [`/api/tasks/${taskId}`],
    enabled: !!taskId && isOpen,
  });

  // Fetch task update history
  const { data: taskUpdates, isLoading: updatesLoading, refetch: refetchUpdates } = useQuery<TaskUpdate[]>({
    queryKey: [`/api/tasks/${taskId}/updates`],
    enabled: !!taskId && isOpen,
  });

  // Status update mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes: string }) => {
      return await apiRequest("PATCH", `/api/tasks/${taskId}`, {
        status,
        notes: notes.trim() || `Status updated to ${status.replace('_', ' ')}`,
      });
    },
    onSuccess: () => {
      toast({
        title: "Task Updated",
        description: "Task status and notes have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/updates`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setShowUpdateForm(false);
      setSelectedStatus("");
      setUpdateNotes("");
      refetchTask();
      refetchUpdates();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Please login again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Update Failed",
        description: "Failed to update task status",
        variant: "destructive",
      });
    },
  });

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchTask(), refetchUpdates()]);
      toast({
        title: "Data Refreshed",
        description: "Task details updated successfully",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh task data",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = () => {
    if (!task) return;
    setSelectedStatus(task.status);
    setUpdateNotes("");
    setShowUpdateForm(true);
  };

  const handleSubmitUpdate = () => {
    if (!selectedStatus) {
      toast({
        title: "Validation Error",
        description: "Please select a status",
        variant: "destructive",
      });
      return;
    }

    if (!updateNotes.trim()) {
      toast({
        title: "Validation Error", 
        description: "Please add update notes",
        variant: "destructive",
      });
      return;
    }

    updateTaskMutation.mutate({
      status: selectedStatus,
      notes: updateNotes.trim(),
    });
  };

  const handleCancelUpdate = () => {
    setShowUpdateForm(false);
    setSelectedStatus("");
    setUpdateNotes("");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: `${label} copied successfully`,
      });
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'resolved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy • hh:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const calculateDuration = (startDate: string, endDate?: string) => {
    try {
      const start = parseISO(startDate);
      const end = endDate ? parseISO(endDate) : new Date();
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.round(diffMs / (1000 * 60));
      
      if (diffMins < 60) return `${diffMins}m`;
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    } catch (error) {
      return 'Unknown';
    }
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'status_update':
      case 'status_change':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'comment':
      case 'customer_feedback':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'priority_change':
        return <Star className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!isOpen || !taskId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <span>Task Details</span>
              {task && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {task.ticketNumber}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(task.ticketNumber, 'Task Number')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={taskLoading}>
                <RefreshCw className={`w-4 h-4 ${taskLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 p-4">
            {taskLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : task ? (
              <>
                {/* Task Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-500" />
                        Task Overview
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority} Priority
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ').replace('-', ' ')}
                        </Badge>
                        {!showUpdateForm && (
                          <Button
                            onClick={handleUpdateTask}
                            className="bg-blue-600 hover:bg-blue-700"
                            size="sm"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Update Task Status
                          </Button>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Task Title</label>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {task.title || task.issueType || 'No title provided'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Issue Type</label>
                        <p className="text-sm text-gray-900 mt-1">{task.issueType || 'General'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Created</label>
                        <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDateTime(task.createdAt)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Duration</label>
                        <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {calculateDuration(task.createdAt, task.completionTime)}
                          {!task.completionTime && ' (ongoing)'}
                        </p>
                      </div>
                    </div>
                    
                    {task.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Description</label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{task.description}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Update Task Status Form */}
                {showUpdateForm && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-800">
                        <Edit className="w-5 h-5" />
                        Update Task Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-blue-900 mb-2 block">
                            Task Status <span className="text-red-500">*</span>
                          </label>
                          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">⏳ Pending</SelectItem>
                              <SelectItem value="in_progress">🔄 In Progress</SelectItem>
                              <SelectItem value="completed">✅ Completed</SelectItem>
                              <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-blue-900 mb-2 block">
                            Current Status
                          </label>
                          <div className="p-2 bg-white rounded border">
                            <Badge className={getStatusColor(task.status)}>
                              {task.status.replace('_', ' ').replace('-', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-blue-900 mb-2 block">
                          Update Notes <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                          placeholder="Enter update notes explaining the status change..."
                          value={updateNotes}
                          onChange={(e) => setUpdateNotes(e.target.value)}
                          rows={3}
                          className="bg-white"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={handleCancelUpdate}
                          disabled={updateTaskMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubmitUpdate}
                          disabled={updateTaskMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {updateTaskMutation.isPending ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Update Task
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Customer Information */}
                {task.customer && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-green-500" />
                        Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Customer Name</label>
                          <p className="text-sm font-semibold text-gray-900 mt-1 flex items-center gap-2">
                            {task.customer.name}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(task.customer!.name, 'Customer Name')}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Contact Person</label>
                          <p className="text-sm text-gray-900 mt-1">{task.customer.contactPerson}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Phone Number</label>
                          <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <a 
                              href={`tel:${task.customer.mobilePhone}`}
                              className="hover:text-blue-600 hover:underline"
                            >
                              {task.customer.mobilePhone}
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(task.customer!.mobilePhone, 'Phone Number')}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Email</label>
                          <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <a 
                              href={`mailto:${task.customer.email}`}
                              className="hover:text-blue-600 hover:underline"
                            >
                              {task.customer.email}
                            </a>
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-gray-600">Address</label>
                          <p className="text-sm text-gray-900 mt-1 flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <span>
                              {task.customer.address}<br />
                              {task.customer.city}, {task.customer.state}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(`${task.customer!.address}, ${task.customer!.city}, ${task.customer!.state}`, 'Address')}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Assignment Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-purple-500" />
                      Assignment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {task.assignedUser && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Backend Engineer</label>
                          <div className="mt-1 p-3 bg-blue-50 rounded-md border border-blue-200">
                            <p className="text-sm font-semibold text-blue-900">
                              {task.assignedUser.firstName} {task.assignedUser.lastName}
                            </p>
                            <p className="text-xs text-blue-700 capitalize">
                              {task.assignedUser.role.replace('_', ' ')}
                            </p>
                            {task.assignedUser.email && (
                              <p className="text-xs text-blue-600 mt-1">{task.assignedUser.email}</p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {task.fieldEngineer && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Field Engineer</label>
                          <div className="mt-1 p-3 bg-green-50 rounded-md border border-green-200">
                            <p className="text-sm font-semibold text-green-900">
                              {task.fieldEngineer.firstName} {task.fieldEngineer.lastName}
                            </p>
                            <p className="text-xs text-green-700">Field Engineer</p>
                            {task.fieldEngineer.email && (
                              <p className="text-xs text-green-600 mt-1">{task.fieldEngineer.email}</p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {task.createdByUser && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Created By</label>
                          <p className="text-sm text-gray-900 mt-1">
                            {task.createdByUser.firstName} {task.createdByUser.lastName}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Task History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-500" />
                        Task History
                      </div>
                      {taskUpdates && (
                        <Badge variant="outline">
                          {taskUpdates.length} update{taskUpdates.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {updatesLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : taskUpdates && taskUpdates.length > 0 ? (
                      <div className="space-y-4 max-h-64 overflow-y-auto">
                        {taskUpdates.map((update, index) => (
                          <div key={update.id} className="relative">
                            {index !== taskUpdates.length - 1 && (
                              <div className="absolute left-5 top-12 w-px h-full bg-gray-200"></div>
                            )}
                            
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                                {getUpdateIcon(update.type)}
                              </div>
                              
                              <div className="flex-1">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-900">
                                      {update.message}
                                    </p>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>
                                      By: {update.updatedByUser 
                                        ? `${update.updatedByUser.firstName} ${update.updatedByUser.lastName}`
                                        : update.createdByName || 'System'
                                      }
                                    </span>
                                    <span>{formatDateTime(update.createdAt)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No update history available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Task Not Found</h3>
                <p className="text-gray-600">
                  Unable to load details for task {taskNumber || taskId}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}