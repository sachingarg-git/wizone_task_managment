import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Task } from "@shared/schema";
import { 
  Clock, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertTriangle,
  Upload 
} from "lucide-react";

const statusUpdateSchema = z.object({
  status: z.string().min(1, "Status selection is required"),
  note: z.string().optional(),
});

const completionSchema = z.object({
  completionNote: z.string().min(1, "Completion note is required"),
  files: z.array(z.string()).optional(),
});

type StatusUpdateFormData = z.infer<typeof statusUpdateSchema>;
type CompletionFormData = z.infer<typeof completionSchema>;

interface FieldTaskWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
}

const FIELD_STATUSES = [
  {
    value: "start_task",
    label: "Start Task",
    icon: Play,
    description: "Begin working on the task",
    color: "bg-blue-500",
  },
  {
    value: "waiting_for_customer",
    label: "Waiting for Customer",
    icon: Pause,
    description: "Waiting for customer response or access",
    color: "bg-yellow-500",
  },
  {
    value: "completed",
    label: "Complete Task",
    icon: CheckCircle,
    description: "Mark task as completed",
    color: "bg-green-500",
  },
];

export default function FieldTaskWorkflowModal({
  isOpen,
  onClose,
  task,
}: FieldTaskWorkflowModalProps) {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showCompletion, setShowCompletion] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [completionNote, setCompletionNote] = useState<string>("");

  // Early return if no task
  if (!task) {
    return null;
  }

  const statusForm = useForm<StatusUpdateFormData>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      status: "",
      note: "",
    },
  });

  const completionForm = useForm<CompletionFormData>({
    resolver: zodResolver(completionSchema),
    defaultValues: {
      completionNote: "",
      files: [],
    },
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: async (data: StatusUpdateFormData) => {
      return await apiRequest("POST", `/api/tasks/${task.id}/field-status`, data);
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Task status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", task.id] });
      handleClose();
    },
    onError: (error) => {
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
        title: "Update Failed",
        description: "Failed to update task status",
        variant: "destructive",
      });
    },
  });

  // Completion mutation
  const completionMutation = useMutation({
    mutationFn: async (data: CompletionFormData) => {
      return await apiRequest("POST", `/api/tasks/${task.id}/complete`, data);
    },
    onSuccess: () => {
      toast({
        title: "Task Completed",
        description: "Task has been marked as completed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", task.id] });
      handleClose();
    },
    onError: (error) => {
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
        title: "Completion Failed",
        description: "Failed to complete task",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    statusForm.setValue("status", value);
    if (value === "completed") {
      setShowCompletion(true);
      // Reset completion state
      setCompletionNote("");
      setUploadedFiles([]);
      completionForm.reset({
        completionNote: "",
        files: [],
      });
    } else {
      setShowCompletion(false);
    }
  };

  const handleClose = () => {
    statusForm.reset();
    completionForm.reset();
    setSelectedStatus("");
    setShowCompletion(false);
    setUploadedFiles([]);
    setCompletionNote("");
    onClose();
  };

  const onStatusSubmit = (data: StatusUpdateFormData) => {
    if (data.status === "completed") {
      setShowCompletion(true);
      return;
    }
    statusMutation.mutate(data);
  };

  const onCompletionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completionNote.trim()) {
      toast({
        title: "Validation Error",
        description: "Completion note is required",
        variant: "destructive",
      });
      return;
    }
    
    completionMutation.mutate({
      completionNote: completionNote.trim(),
      files: uploadedFiles,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileNames = Array.from(files).map(file => file.name);
      setUploadedFiles(prev => [...prev, ...fileNames]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getCurrentStatusBadge = () => {
    if (!task) return null;
    
    const statusColors: Record<string, string> = {
      pending: "bg-gray-500",
      assigned_to_field: "bg-blue-500",
      start_task: "bg-green-500",
      waiting_for_customer: "bg-yellow-500",
      completed: "bg-green-600",
      cancelled: "bg-red-500",
    };

    return (
      <Badge 
        className={`${statusColors[task.status] || "bg-gray-500"} text-white`}
      >
        {task.status.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Field Task Workflow</DialogTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Current Status:</span>
            {getCurrentStatusBadge()}
          </div>
        </DialogHeader>

        {!showCompletion ? (
          <Form {...statusForm}>
            <form onSubmit={statusForm.handleSubmit(onStatusSubmit)} className="space-y-4">
              {/* Task Information */}
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Task Details</h4>
                <p className="text-sm"><strong>Ticket:</strong> {task.ticketNumber}</p>
                <p className="text-sm"><strong>Priority:</strong> {task.priority}</p>
                <p className="text-sm"><strong>Issue Type:</strong> {task.issueType}</p>
              </div>

              {/* Status Selection */}
              <FormField
                control={statusForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Update Status</FormLabel>
                    <Select onValueChange={handleStatusChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select new status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FIELD_STATUSES.map((status) => {
                          const Icon = status.icon;
                          return (
                            <SelectItem key={status.value} value={status.value}>
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${status.color}`} />
                                <Icon className="w-4 h-4" />
                                <div className="flex flex-col">
                                  <span className="font-medium">{status.label}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {status.description}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Note Field (required for waiting_for_customer) */}
              {selectedStatus === "waiting_for_customer" && (
                <FormField
                  control={statusForm.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Waiting Reason <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explain why you're waiting for the customer..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Optional Note for other statuses */}
              {selectedStatus && selectedStatus !== "waiting_for_customer" && selectedStatus !== "completed" && (
                <FormField
                  control={statusForm.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes..."
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={statusMutation.isPending || !selectedStatus}
                >
                  {statusMutation.isPending ? "Updating..." : "Update Status"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <form onSubmit={onCompletionSubmit} className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-800">Complete Task</h4>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Please provide completion details and any supporting files.
                </p>
              </div>

              {/* Completion Note */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Completion Notes <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Describe what was completed, any issues resolved, and any follow-up needed..."
                  rows={4}
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  className="w-full"
                />
                {!completionNote && (
                  <p className="text-sm text-red-500">Completion note is required</p>
                )}
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Attachments (Optional)</label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="file:mr-2 file:px-3 file:py-1 file:rounded file:border-0 file:bg-muted file:text-muted-foreground"
                  />
                  <Upload className="w-4 h-4 text-muted-foreground" />
                </div>
                
                {uploadedFiles.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Uploaded files:</p>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{file}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCompletion(false)}
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={completionMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {completionMutation.isPending ? "Completing..." : "Complete Task"}
                </Button>
              </div>
            </form>
        )}
      </DialogContent>
    </Dialog>
  );
}