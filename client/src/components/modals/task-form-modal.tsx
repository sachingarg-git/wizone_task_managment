import { useState, useMemo } from "react";
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
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X, Plus, Search, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  customerId: z.number().min(1, "Customer is required"),
  assignedTo: z.number().min(1, "Assigned engineer is required"),
  priority: z.enum(["high", "medium", "low"]),
  issueType: z.string().min(1, "Issue type is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.string().optional(),
  contactPerson: z.string().optional(),
  visitCharges: z.union([z.string(), z.number()]).optional()
    .refine((val) => {
      if (!val) return true; // Optional field
      const num = parseFloat(val.toString());
      return !isNaN(num) && num <= 999.99;
    }, {
      message: "Visit charges cannot exceed ₹999.99 (database limit). Contact admin to increase."
    })
    .transform((val) => val?.toString()),
  // New auto-populated fields
  customerAddress: z.string().optional(),
  customerCity: z.string().optional(),
  customerPlan: z.string().optional(),
  connectedTower: z.string().optional(),
  wirelessIpCustomer: z.string().optional(),
  apIpAccessPoint: z.string().optional(),
  customerMobile: z.string().optional(),
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
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearchValue, setCustomerSearchValue] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      customerId: 0,
      assignedTo: 0,
      priority: "medium" as const,
      description: "",
      issueType: "",
      contactPerson: "",
      visitCharges: "",
      dueDate: new Date().toISOString().split('T')[0], // Default to today
      customerAddress: "",
      customerCity: "",
      customerPlan: "",
      connectedTower: "",
      wirelessIpCustomer: "",
      apIpAccessPoint: "",
      customerMobile: "",
    },
  });

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
    "NETWORK CONNECTIVITY",
    "SPEED ISSUES", 
    "ROUTER PROBLEMS",
    "CONFIGURATION",
    "HARDWARE FAILURE",
    "SOFTWARE ISSUE",
    "MAINTENANCE",
    "CCTV MAINTENANCE",
    "NEW ACTION",
    "NEW INSTALLATION",
    "PLAN ACTION",
    "MATERIAL DELIVERED",
    "MATERIAL RECEIVED",
    "AMC CUSTOMER (SERVICES)",
    "NON AMC (SERVICES)",
    "TOWER MAINTENANCE",
    "INTERCOM ISSUE",
    "SERVER INSTALLATION",
    "SERVER MAINTENANCE",
    "OFFICE SUPPORT",
    "FLAT WORK (ANY)"
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
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      // Find selected customer and assigned user for names
      const selectedCustomer = Array.isArray(customers) ? customers.find((c: any) => c.id === data.customerId) : null;
      const assignedUser = Array.isArray(users) ? users.find((u: any) => u.id === data.assignedTo) : null;
      
      // Convert visit charges to number for estimatedHours
      let estimatedHoursValue: number | undefined = undefined;
      if (data.visitCharges) {
        const visitChargesStr = data.visitCharges.toString().trim();
        if (visitChargesStr !== "") {
          const numValue = parseFloat(visitChargesStr);
          if (!isNaN(numValue)) {
            estimatedHoursValue = numValue;
          }
        }
      }
      
      // Only send fields that exist in the tasks schema
      const payload = {
        title: data.title,
        description: data.description,
        customerId: data.customerId || undefined,
        customerName: selectedCustomer?.name || "Unknown Customer",
        priority: data.priority,
        category: data.issueType, // Map issueType to category
        assignedTo: data.assignedTo || undefined,
        assignedToName: assignedUser ? `${assignedUser.firstName || ''} ${assignedUser.lastName || ''}`.trim() || assignedUser.username : "Unknown User",
        status: "pending", // Set default status
        estimatedHours: estimatedHoursValue, // Send as number, not string
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(), // Convert string to Date object
      };
      console.log('🚀 Task creation payload (schema-compliant):', payload);
      await apiRequest("POST", "/api/tasks", payload);
    },
    onSuccess: () => {
      // Invalidate all task-related queries to ensure list updates
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.includes('/api/tasks');
        }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      console.error('❌ Task creation error:', error);
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
        description: `Failed to create task: ${error.message}`,
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
    setCustomerSearchOpen(false);
    setCustomerSearchValue("");
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

  // Show ALL users and engineers in the assign dropdown
  const engineerUsers = Array.isArray(users) ? users.filter((user: any) => 
    user.active !== false // Only filter out inactive users
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

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!customers || !Array.isArray(customers)) return [];
    if (!customerSearchValue) return customers;
    
    return customers.filter((customer: any) =>
      customer.name?.toLowerCase().includes(customerSearchValue.toLowerCase()) ||
      customer.customerId?.toLowerCase().includes(customerSearchValue.toLowerCase()) ||
      customer.email?.toLowerCase().includes(customerSearchValue.toLowerCase())
    );
  }, [customers, customerSearchValue]);

  // Get selected customer name for display and auto-populate fields
  const selectedCustomer = useMemo(() => {
    const customerId = form.watch("customerId");
    if (!customerId || !customers || !Array.isArray(customers)) return "";
    const customer = customers.find((c: any) => c.id === customerId);
    return customer ? customer.name : "";
  }, [form.watch("customerId"), customers]);

  // Auto-populate customer fields when customer is selected
  const handleCustomerSelect = (customer: any) => {
    form.setValue("customerId", customer.id);
    form.setValue("contactPerson", customer.contactPerson || customer.contact_person || "");
    form.setValue("customerAddress", customer.address || "");
    form.setValue("customerCity", customer.city || "");
    form.setValue("customerPlan", customer.servicePlan || customer.service_plan || customer.planType || customer.plan_type || "");
    form.setValue("connectedTower", customer.connectedTower || customer.connected_tower || "");
    // Fixed mapping for Wireless IP Customer End - handle null, empty, and placeholder values
    const wirelessIp = customer.wireless_ip && 
                      customer.wireless_ip !== "N/A" && 
                      customer.wireless_ip !== "Data Not available in Database" && 
                      customer.wireless_ip.trim() !== "" 
                      ? customer.wireless_ip : "";
    form.setValue("wirelessIpCustomer", wirelessIp);
    
    // Fixed mapping for AP IP Access Point End - handle null, empty, and placeholder values  
    const apIp = customer.wireless_ap_ip && 
                customer.wireless_ap_ip !== "N/A" && 
                customer.wireless_ap_ip !== "Data Not available in Database" && 
                customer.wireless_ap_ip.trim() !== "" 
                ? customer.wireless_ap_ip : "";
    form.setValue("apIpAccessPoint", apIp);
    form.setValue("customerMobile", customer.mobilePhone || customer.mobile_phone || customer.phone || "");
    setCustomerSearchOpen(false);
    setCustomerSearchValue("");
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
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Level *</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedPriority(value);
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="high">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span>High</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <span>Medium</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="low">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                              <span>Low</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Customer Name *</FormLabel>
                      <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={customerSearchOpen}
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={customersLoading}
                            >
                              {field.value ? selectedCustomer : "Search and select customer..."}
                              <div className="flex items-center space-x-1">
                                <Search className="h-4 w-4 opacity-50" />
                                <ChevronsUpDown className="h-4 w-4 opacity-50" />
                              </div>
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Search customers..." 
                              value={customerSearchValue}
                              onValueChange={setCustomerSearchValue}
                            />
                            <CommandEmpty>No customers found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {filteredCustomers.map((customer: any) => (
                                <CommandItem
                                  key={customer.id}
                                  value={`${customer.name} ${customer.customerId} ${customer.email || ''}`}
                                  onSelect={() => handleCustomerSelect(customer)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === customer.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{customer.name}</span>
                                    <span className="text-sm text-gray-500">
                                      ID: {customer.customerId} 
                                      {customer.email && ` • ${customer.email}`}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
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

              {/* Auto-populated Customer Details - ALWAYS VISIBLE FOR TESTING */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-300 mb-6 shadow-sm">
                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-blue-600 rounded-full mr-3 animate-pulse"></span>
                  🔄 Auto-Populated Customer Information 
                  <span className="ml-2 text-sm font-normal">
                    {form.watch("customerId") ? '✅ Customer Selected' : '⚠️ No Customer Selected'}
                  </span>
                </h3>
                <div className="text-xs text-blue-700 mb-3 p-2 bg-blue-100 rounded">
                  Debug: Customers loaded: {Array.isArray(customers) ? customers.length : 0} | Loading: {customersLoading ? 'Yes' : 'No'}<br/>
                  First customer: {Array.isArray(customers) && customers[0] ? customers[0].name : 'None'}<br/>  
                  Selected ID: {form.watch("customerId") || 'None'}<br/>
                  Customer fields should appear below this line...
                </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700 font-medium">Customer Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              rows={2}
                              placeholder="Auto-filled from customer database"
                              className="bg-white border-blue-300 focus:border-blue-500"
                              readOnly
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700 font-medium">City</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Auto-filled from customer database"
                              className="bg-white border-blue-300 focus:border-blue-500"
                              readOnly
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerPlan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700 font-medium">Plan</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Auto-filled from customer database"
                              className="bg-white border-blue-300 focus:border-blue-500"
                              readOnly
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="connectedTower"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700 font-medium">Connected Tower</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Auto-filled from customer database"
                              className="bg-white border-blue-300 focus:border-blue-500"
                              readOnly
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="wirelessIpCustomer"
                      render={({ field }) => {
                        const hasValue = field.value && field.value.trim() !== "";
                        return (
                          <FormItem>
                            <FormLabel className="text-blue-700 font-medium">
                              Wireless IP Customer End
                              {hasValue && <span className="text-green-600 text-xs ml-2">(Auto-filled)</span>}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={hasValue ? "Auto-filled from customer database" : "Enter customer end IP address"}
                                className={`border-blue-300 focus:border-blue-500 ${
                                  hasValue ? "bg-green-50" : "bg-white"
                                }`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="apIpAccessPoint"
                      render={({ field }) => {
                        const hasValue = field.value && field.value.trim() !== "";
                        return (
                          <FormItem>
                            <FormLabel className="text-blue-700 font-medium">
                              AP IP Access Point End
                              {hasValue && <span className="text-green-600 text-xs ml-2">(Auto-filled)</span>}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={hasValue ? "Auto-filled from customer database" : "Enter access point IP address"}
                                className={`border-blue-300 focus:border-blue-500 ${
                                  hasValue ? "bg-green-50" : "bg-white"
                                }`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="customerMobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700 font-medium">Mobile Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Auto-filled from customer database"
                              className="bg-white border-blue-300 focus:border-blue-500"
                              readOnly
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                      <Select 
                        onValueChange={(value) => {
                          console.log('🔍 Selected user ID:', value);
                          field.onChange(Number(value));
                        }} 
                        disabled={usersLoading}
                        value={String(field.value || '')}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={usersLoading ? "Loading engineers..." : "Select Engineer"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {usersLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading engineers...
                            </SelectItem>
                          ) : engineerUsers.length === 0 ? (
                            <SelectItem value="no-users" disabled>
                              No engineers available
                            </SelectItem>
                          ) : (
                            engineerUsers.map((user: any) => (
                              <SelectItem key={user.id} value={String(user.id)}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{user.firstName} {user.lastName} ({user.username})</span>
                                  <Badge className={`ml-2 text-xs ${getRoleBadgeColor(user.role)}`}>
                                    {user.role === 'backend_engineer' ? 'Backend Engineer' : 
                                     user.role === 'field_engineer' ? 'Field Engineer' : 
                                     user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))
                          )}
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
                render={({ field }) => {
                  const visitChargeValue = parseFloat(field.value || "0");
                  const isOverLimit = visitChargeValue > 999.99;
                  
                  return (
                    <FormItem>
                      <FormLabel>Visit Charges</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          className={isOverLimit ? "border-red-500 focus:border-red-600" : ""}
                          {...field} 
                        />
                      </FormControl>
                      {isOverLimit && (
                        <p className="text-sm text-red-600 mt-1">
                          ⚠️ Database limit: Maximum ₹999.99. Contact admin to increase limit.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
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
