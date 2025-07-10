import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  customerId: z.number().min(1, "Customer is required"),
  assignedTo: z.string().min(1, "Assigned engineer is required"),
  priority: z.enum(["high", "medium", "low"]),
  issueType: z.string().min(1, "Issue type is required"),
  description: z.string().min(1, "Description is required"),
  contactPerson: z.string().optional(),
  visitCharges: z.union([z.string(), z.number()]).optional().transform((val) => val?.toString()),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: number;
}

export default function TaskFormModal({ isOpen, onClose, taskId }: TaskFormModalProps) {
  const [selectedPriority, setSelectedPriority] = useState<string>("medium");
  const [customIssueTypes, setCustomIssueTypes] = useState<string[]>([]);
  const [showAddIssueType, setShowAddIssueType] = useState(false);
  const [newIssueType, setNewIssueType] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      customerId: 0,
      assignedTo: "",
      priority: "medium",
      description: "",
      issueType: "",
      contactPerson: "",
      visitCharges: "",
    },
  });

  // Generate automatic ticket ID
  const generateTicketId = () => {
    const now = new Date();
    const dateTime = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
    return `WIZ-${dateTime}_1`;
  };

  // Add custom issue type
  const handleAddIssueType = () => {
    if (newIssueType.trim() && !customIssueTypes.includes(newIssueType.trim())) {
      const newType = newIssueType.trim();
      setCustomIssueTypes(prev => [...prev, newType]);
      form.setValue("issueType", newType);
      setNewIssueType("");
      setShowAddIssueType(false);
      toast({
        title: "Issue Type Added",
        description: `"${newType}" has been added to issue types`,
      });
    }
  };

  // Default issue types
  const defaultIssueTypes = [
    "Network Connectivity",
    "Speed Issues", 
    "Router Problems",
    "Configuration",
    "Hardware Failure",
    "Software Issue",
    "Maintenance"
  ];

  // Combined issue types
  const allIssueTypes = [...defaultIssueTypes, ...customIssueTypes];

  // Fetch customers for dropdown
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
    enabled: isOpen,
  });

  // Fetch users for assignment dropdown
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled: isOpen,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const payload = {
        ...data,
        ticketNumber: generateTicketId(),
        visitCharges: data.visitCharges && data.visitCharges.toString().trim() !== "" ? data.visitCharges.toString() : undefined,
        customerId: data.customerId || undefined,
        assignedTo: data.assignedTo || undefined,
      };
      await apiRequest("POST", "/api/tasks", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-tasks"] });
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      onClose();
      form.reset();
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
        description: "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TaskFormData) => {
    createTaskMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    setSelectedPriority("medium");
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-error text-white hover:bg-red-600';
      case 'medium': return 'bg-warning text-white hover:bg-orange-600';
      case 'low': return 'bg-success text-white hover:bg-green-600';
      default: return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  };

  const engineerUsers = Array.isArray(users) ? users.filter((user: any) => 
    user.role === 'engineer' || 
    user.role === 'manager' || 
    user.role === 'backend_engineer' || 
    user.role === 'field_engineer'
  ) : [];

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'manager': return 'bg-purple-100 text-purple-800';
      case 'engineer': return 'bg-primary/10 text-primary';
      case 'backend_engineer': return 'bg-blue-100 text-blue-800';
      case 'field_engineer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Create New Task</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ticket Number
                  </label>
                  <Input 
                    value="Auto-generated" 
                    disabled 
                    className="bg-gray-50"
                  />
                </div>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter task title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level *
                  </label>
                  <div className="flex space-x-3">
                    {["high", "medium", "low"].map((priority) => (
                      <Button
                        key={priority}
                        type="button"
                        className={`px-4 py-2 font-medium transition-colors ${
                          selectedPriority === priority 
                            ? getPriorityColor(priority)
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => {
                          setSelectedPriority(priority);
                          form.setValue('priority', priority as "high" | "medium" | "low");
                        }}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name *</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        disabled={customersLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers?.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact person name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="issueType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Type *</FormLabel>
                      <div className="space-y-2">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Issue Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allIssueTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                            <div className="border-t pt-2 mt-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                                onClick={() => setShowAddIssueType(true)}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Custom Issue Type
                              </Button>
                            </div>
                          </SelectContent>
                        </Select>

                        {/* Add Custom Issue Type Input */}
                        {showAddIssueType && (
                          <div className="flex gap-2 p-2 border rounded-md bg-gray-50">
                            <Input
                              placeholder="Enter new issue type"
                              value={newIssueType}
                              onChange={(e) => setNewIssueType(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddIssueType();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddIssueType}
                              className="bg-cyan-600 hover:bg-cyan-700"
                            >
                              Add
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowAddIssueType(false);
                                setNewIssueType("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}

                        {/* Display Custom Issue Types */}
                        {customIssueTypes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {customIssueTypes.map((type) => (
                              <Badge
                                key={type}
                                variant="secondary"
                                className="bg-cyan-100 text-cyan-700 border-cyan-200"
                              >
                                {type}
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer hover:text-cyan-900"
                                  onClick={() => {
                                    setCustomIssueTypes(prev => prev.filter(t => t !== type));
                                    if (field.value === type) {
                                      form.setValue("issueType", "");
                                    }
                                  }}
                                />
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign To *</FormLabel>
                      <Select onValueChange={field.onChange} disabled={usersLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Engineer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {engineerUsers.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{user.firstName} {user.lastName}</span>
                                <Badge className={`ml-2 text-xs ${getRoleBadgeColor(user.role)}`}>
                                  {user.role === 'backend_engineer' ? 'Backend Engineer' : 
                                   user.role === 'field_engineer' ? 'Field Engineer' : 
                                   user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="visitCharges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visit Charges</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={4}
                        placeholder="Describe the issue in detail..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTaskMutation.isPending}
                  className="bg-primary hover:bg-blue-700"
                >
                  {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
