import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

const customerFormSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  name: z.string().min(1, "Customer name is required"),
  contactPerson: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  mobilePhone: z.string().min(1, "Mobile phone is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  servicePlan: z.string().min(1, "Service plan is required"),
  connectedTower: z.string().optional(),
  wirelessIp: z.string().optional(),
  wirelessApIp: z.string().optional(),
  port: z.string().optional(),
  plan: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  locationNotes: z.string().optional(),
  locationVerified: z.boolean().optional(),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: any;
  isEditing?: boolean;
}

export default function CustomerFormModal({ isOpen, onClose, customer, isEditing = false }: CustomerFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCustomPlanInput, setShowCustomPlanInput] = useState(false);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      customerId: "",
      name: "",
      contactPerson: "",
      address: "",
      city: "",
      state: "",
      mobilePhone: "",
      email: "",
      servicePlan: "",
      connectedTower: "",
      wirelessIp: "",
      wirelessApIp: "",
      port: "",
      plan: "",
      latitude: "",
      longitude: "",
      locationNotes: "",
      locationVerified: false,
    },
  });

  // Update form values when customer prop changes
  useEffect(() => {
    if (customer) {
      // Check if we need to show custom plan input
      const isCustomPlan = customer.servicePlan && 
        !["Basic - 25 Mbps", "Standard - 50 Mbps", "Premium - 100 Mbps", 
          "Enterprise - 200 Mbps", "Business Pro - 500 Mbps", "N/A"].includes(customer.servicePlan);
      
      setShowCustomPlanInput(isCustomPlan);
      
      form.reset({
        customerId: customer.customerId || "",
        name: customer.name || "",
        contactPerson: customer.contactPerson || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        mobilePhone: customer.mobilePhone || "",
        email: customer.email || "",
        servicePlan: customer.servicePlan || "",
        connectedTower: customer.connectedTower || "",
        wirelessIp: customer.wirelessIp || "",
        wirelessApIp: customer.wirelessApIp || "",
        port: customer.port || "",
        plan: customer.plan || "",
        latitude: customer.latitude?.toString() || "",
        longitude: customer.longitude?.toString() || "",
        locationNotes: customer.locationNotes || "",
        locationVerified: customer.locationVerified || false,
      });
    } else {
      // Reset to empty form for new customer
      setShowCustomPlanInput(false);
      form.reset({
        customerId: "",
        name: "",
        contactPerson: "",
        address: "",
        city: "",
        state: "",
        mobilePhone: "",
        email: "",
        servicePlan: "",
        connectedTower: "",
        wirelessIp: "",
        wirelessApIp: "",
        port: "",
        plan: "",
        latitude: "",
        longitude: "",
        locationNotes: "",
        locationVerified: false,
      });
    }
  }, [customer, form]);

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      await apiRequest("POST", "/api/customers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      onClose();
      form.reset();
      setShowCustomPlanInput(false);
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
        description: "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      await apiRequest("PUT", `/api/customers/${customer.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      onClose();
      form.reset();
      setShowCustomPlanInput(false);
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
        description: "Failed to update customer",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    console.log("Form submit:", { isEditing, customer: customer?.id, customerData: customer });
    
    // Transform empty string coordinates to null for database compatibility
    const transformedData = {
      ...data,
      latitude: data.latitude && data.latitude.trim() !== "" ? data.latitude : undefined,
      longitude: data.longitude && data.longitude.trim() !== "" ? data.longitude : undefined,
    };

    if (isEditing && customer && customer.id) {
      console.log("Updating customer:", customer.id);
      updateCustomerMutation.mutate(transformedData);
    } else {
      console.log("Creating new customer");
      createCustomerMutation.mutate(transformedData);
    }
  };

  const handleClose = () => {
    form.reset();
    setShowCustomPlanInput(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isEditing ? "Edit Customer" : customer ? "View Customer" : "Add New Customer"}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer ID *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter unique customer ID" 
                        readOnly={customer && !isEditing}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter customer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact person name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Address *</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={3}
                        placeholder="Enter complete address"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select State" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Karnataka">Karnataka</SelectItem>
                          <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                          <SelectItem value="Delhi">Delhi</SelectItem>
                          <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                          <SelectItem value="Gujarat">Gujarat</SelectItem>
                          <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                          <SelectItem value="West Bengal">West Bengal</SelectItem>
                          <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                          <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                          <SelectItem value="Punjab">Punjab</SelectItem>
                          <SelectItem value="Uttarakhand">Uttarakhand</SelectItem>
                          <SelectItem value="custom">Other (Enter manually)</SelectItem>
                        </SelectContent>
                      </Select>
                      {field.value === "custom" && (
                        <Input 
                          placeholder="Enter state name" 
                          onChange={(e) => field.onChange(e.target.value)}
                          className="mt-2"
                        />
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="mobilePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Phone *</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="+91 98765 43210"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="customer@example.com"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="servicePlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Plan *</FormLabel>
                      {!showCustomPlanInput ? (
                        <Select onValueChange={(value) => {
                          if (value === "custom") {
                            setShowCustomPlanInput(true);
                            field.onChange("");
                          } else {
                            field.onChange(value);
                          }
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Basic - 25 Mbps">Basic - 25 Mbps</SelectItem>
                            <SelectItem value="Standard - 50 Mbps">Standard - 50 Mbps</SelectItem>
                            <SelectItem value="Premium - 100 Mbps">Premium - 100 Mbps</SelectItem>
                            <SelectItem value="Enterprise - 200 Mbps">Enterprise - 200 Mbps</SelectItem>
                            <SelectItem value="Business Pro - 500 Mbps">Business Pro - 500 Mbps</SelectItem>
                            <SelectItem value="N/A">N/A (Not Available)</SelectItem>
                            <SelectItem value="custom">Custom Plan</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="relative">
                          <Input 
                            placeholder="Enter custom plan name" 
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                            }}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomPlanInput(false);
                              field.onChange("");
                            }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="connectedTower"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Connected Tower</FormLabel>
                      <FormControl>
                        <Input placeholder="Tower name/ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="wirelessIp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wireless IP (Customer End)</FormLabel>
                      <FormControl>
                        <Input placeholder="192.168.1.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wirelessApIp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wireless AP IP</FormLabel>
                      <FormControl>
                        <Input placeholder="192.168.1.254" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port</FormLabel>
                      <FormControl>
                        <Input placeholder="Port number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Details</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={2}
                        placeholder="Additional plan details and notes"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location Management Section */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Location Management</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input placeholder="12.9716" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input placeholder="77.5946" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="locationNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={2}
                          placeholder="Additional location information"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationVerified"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Location Verified</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Mark if the location has been verified
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createCustomerMutation.isPending || updateCustomerMutation.isPending
                  }
                >
                  {createCustomerMutation.isPending || updateCustomerMutation.isPending
                    ? "Saving..."
                    : isEditing
                      ? "Update Customer"
                      : "Create Customer"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
