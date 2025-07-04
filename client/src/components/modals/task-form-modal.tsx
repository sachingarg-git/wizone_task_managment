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
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

const taskFormSchema = z.object({
  customerId: z.number().min(1, "Customer is required"),
  assignedTo: z.string().min(1, "Assigned engineer is required"),
  priority: z.enum(["high", "medium", "low"]),
  issueType: z.string().min(1, "Issue type is required"),
  description: z.string().min(1, "Description is required"),
  contactPerson: z.string().optional(),
  visitCharges: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: number;
}

export default function TaskFormModal({ isOpen, onClose, taskId }: TaskFormModalProps) {
  const [selectedPriority, setSelectedPriority] = useState<string>("medium");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      priority: "medium",
      description: "",
      issueType: "",
      contactPerson: "",
      visitCharges: "",
    },
  });

  // Fetch customers for dropdown
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
    enabled: isOpen,
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

  // Fetch users for assignment dropdown
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled: isOpen,
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

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const payload = {
        ...data,
        visitCharges: data.visitCharges ? parseFloat(data.visitCharges) : undefined,
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

  const engineerUsers = users?.filter((user: any) => 
    user.role === 'engineer' || user.role === 'manager'
  ) || [];

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
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Issue Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Network Connectivity">Network Connectivity</SelectItem>
                          <SelectItem value="Speed Issues">Speed Issues</SelectItem>
                          <SelectItem value="Router Problems">Router Problems</SelectItem>
                          <SelectItem value="Configuration">Configuration</SelectItem>
                          <SelectItem value="Hardware Failure">Hardware Failure</SelectItem>
                          <SelectItem value="Software Issue">Software Issue</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
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
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {user.role}
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
