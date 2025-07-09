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
  Image
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
    enabled: !!selectedTaskId,
  });

  // Task update mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/tasks/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my-tasks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${selectedTaskId}/updates`] });
      handleCloseModal();
      toast({
        title: "Task Updated",
        description: "Task has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task",
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

  return (
    <div className="min-h-screen">
      <Header 
        title={`Welcome, ${user?.firstName || 'User'}`}
        subtitle="Your Personal Task Portal"
      >
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-1" />
            {user?.role?.replace('_', ' ').toUpperCase()}
          </div>
          <div className="flex items-center">
            <Mail className="w-4 h-4 mr-1" />
            {user?.email}
          </div>
        </div>
      </Header>

      <div className="p-6 space-y-8">
        {/* Task Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">My Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{statsData.total}</p>
                </div>
                <FileText className="w-5 h-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{statsData.pending}</p>
                </div>
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{statsData.inProgress}</p>
                </div>
                <AlertCircle className="w-5 h-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{statsData.completed}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Assigned Tasks</CardTitle>
              <Badge variant="outline" className="text-sm">
                {myTasks.length} tasks assigned to you
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : myTasks.length > 0 ? (
              <div className="overflow-x-auto">
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
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No tasks assigned</p>
                <p>You don't have any tasks assigned to you at the moment.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Task Details Modal with Update Functionality */}
      <Dialog open={!!selectedTaskId} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                Task Details - {selectedTaskId ? myTasks.find(t => t.id === selectedTaskId)?.ticketNumber : ''}
              </DialogTitle>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {selectedTaskId && (() => {
            const task = myTasks.find(t => t.id === selectedTaskId);
            if (!task) return <div>Task not found</div>;

            return (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="update">Update</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4 max-h-[calc(90vh-180px)] overflow-y-auto">
                  {/* Task Header */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{task.ticketNumber}</h3>
                        <p className="text-gray-600">{task.title}</p>
                        <p className="text-sm text-gray-500 mt-2">{task.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Task Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Task Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-500">Issue Type</Label>
                          <p className="font-medium">{task.issueType}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500">Assigned Engineer</Label>
                          <p className="font-medium">
                            {task.assignedUser ? 
                              `${task.assignedUser.firstName} ${task.assignedUser.lastName}` : 
                              "Not assigned"
                            }
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500">Created</Label>
                          <p className="font-medium">
                            {task.createdAt ? format(new Date(task.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500">Last Updated</Label>
                          <p className="font-medium">
                            {task.updatedAt ? format(new Date(task.updatedAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Customer Info */}
                  {task.customer && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Customer Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-gray-500">Name</Label>
                            <p className="font-medium">{task.customer.name}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">Contact Person</Label>
                            <p className="font-medium">{task.customer.contactPerson}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">Location</Label>
                            <p className="font-medium">{task.customer.address}, {task.customer.city}, {task.customer.state}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">Phone</Label>
                            <p className="font-medium">{task.customer.mobilePhone}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">Email</Label>
                            <p className="font-medium">{task.customer.email}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">Service Plan</Label>
                            <p className="font-medium">{task.customer.servicePlan}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4 max-h-[calc(90vh-180px)] overflow-y-auto">
                  {taskUpdates && taskUpdates.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Task History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {taskUpdates.map((update: any) => (
                            <div key={update.id} className="border-l-4 border-blue-200 pl-4 pb-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <p className="text-sm font-medium">
                                      {update.updatedByUser?.firstName} {update.updatedByUser?.lastName}
                                    </p>
                                    <Badge variant="outline" className="text-xs">
                                      {update.updatedByUser?.role?.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{update.note}</p>
                                  {update.files && update.files.length > 0 && (
                                    <div className="mt-2 flex items-center space-x-2">
                                      <FileText className="w-4 h-4 text-gray-400" />
                                      <p className="text-xs text-gray-500">Files: {update.files.join(', ')}</p>
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                                  {update.createdAt ? format(new Date(update.createdAt), 'MMM dd, HH:mm') : 'N/A'}
                                </span>
                              </div>
                            </div>
                          ))}
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

                <TabsContent value="update" className="space-y-4 max-h-[calc(90vh-180px)] overflow-y-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center space-x-2">
                        <Edit className="w-4 h-4" />
                        <span>Update Task Status</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">Change Status</Label>
                        <Select value={taskStatus} onValueChange={setTaskStatus}>
                          <SelectTrigger>
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
                        <p className="text-xs text-gray-500">
                          Current status: <span className="font-medium">{task.status?.replace('_', ' ')}</span>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Update Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder={taskStatus === 'completed' ? 'Provide resolution details (required)' : 'Add notes about this update (optional)'}
                          value={updateNotes}
                          onChange={(e) => setUpdateNotes(e.target.value)}
                          rows={4}
                          className="resize-none"
                        />
                        {taskStatus === 'completed' && (
                          <p className="text-xs text-amber-600">
                            ⚠️ Resolution notes are required when marking task as completed
                          </p>
                        )}
                      </div>

                      {/* File Upload Section */}
                      <div className="space-y-3 border-t pt-4">
                        <Label className="text-sm font-medium flex items-center space-x-2">
                          <Upload className="w-4 h-4" />
                          <span>Upload Photos/Files</span>
                        </Label>
                        
                        <div className="space-y-3">
                          {/* File Upload Input */}
                          <div className="flex items-center space-x-3">
                            <Input
                              type="file"
                              multiple
                              accept="image/*,.pdf,.doc,.docx,.txt"
                              onChange={handleFileChange}
                              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
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
                          disabled={updateTaskMutation.isPending || uploadFilesMutation.isPending || (!taskStatus && !updateNotes.trim() && uploadFiles.length === 0)}
                          className="bg-primary hover:bg-blue-700 text-white"
                        >
                          {updateTaskMutation.isPending || uploadFilesMutation.isPending ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>
                                {uploadFilesMutation.isPending ? 'Uploading...' : 'Updating...'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
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

                <TabsContent value="files" className="space-y-4 max-h-[calc(90vh-180px)] overflow-y-auto">
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
    </div>
  );
}