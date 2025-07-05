import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import CustomerFormModal from "@/components/modals/customer-form-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Download, 
  Users, 
  Wifi, 
  UserPlus,
  Settings, 
  Headphones,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

export default function Customers() {
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [portalCustomer, setPortalCustomer] = useState<any>(null);
  const [portalUsername, setPortalUsername] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers", { search: searchQuery, location: locationFilter }],
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

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Success",
        description: "Customer deleted successfully",
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
        description: "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const totalCustomers = customers?.length || 0;
  const activeCustomers = customers?.filter(c => c.status === 'active').length || 0;
  const newThisMonth = Math.floor(totalCustomers * 0.04); // Mock calculation

  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsEditing(false);
    setShowCustomerForm(true);
  };

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsEditing(true);
    setShowCustomerForm(true);
  };

  const handleDeleteCustomer = (id: number) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      deleteCustomerMutation.mutate(id);
    }
  };

  const handleCloseCustomerForm = () => {
    setShowCustomerForm(false);
    setSelectedCustomer(null);
    setIsEditing(false);
  };

  const handlePortalAccess = (customer: any) => {
    setPortalCustomer(customer);
    setPortalUsername(customer.username || "");
    setPortalPassword(customer.password || "");
    setShowPortalModal(true);
  };

  const portalAccessMutation = useMutation({
    mutationFn: async ({ customerId, username, password, portalAccess }: { customerId: number, username: string, password: string, portalAccess: boolean }) => {
      await apiRequest("PATCH", `/api/customers/${customerId}/portal-access`, {
        username,
        password,
        portalAccess
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setShowPortalModal(false);
      toast({
        title: "Success",
        description: "Customer portal access updated successfully",
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
        description: "Failed to update portal access",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen">
      <Header 
        title="Customer Management"
        subtitle="Manage customer information and service history"
      >
        <div className="flex space-x-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowCustomerForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </Header>
      
      <div className="p-6 space-y-8">
        {/* Customer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
                </div>
                <Users className="w-5 h-5 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Services</p>
                  <p className="text-2xl font-bold text-gray-900">{activeCustomers}</p>
                </div>
                <Wifi className="w-5 h-5 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{newThisMonth}</p>
                </div>
                <UserPlus className="w-5 h-5 text-warning" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Support Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.floor(totalCustomers * 0.07)}</p>
                </div>
                <Headphones className="w-5 h-5 text-error" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <CardTitle>Customer Database</CardTitle>
              <div className="flex space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="bangalore">Bangalore</SelectItem>
                    <SelectItem value="mumbai">Mumbai</SelectItem>
                    <SelectItem value="delhi">Delhi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {customersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : customers && customers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Service Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Portal Access</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer: any) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.customerId}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.contactPerson}</div>
                          </div>
                        </TableCell>
                        <TableCell>{customer.city}, {customer.state}</TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{customer.mobilePhone}</div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{customer.servicePlan}</TableCell>
                        <TableCell>
                          <Badge className={customer.status === 'active' ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-700'}>
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {customer.portalAccess ? (
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-green-100 text-green-700">Active</Badge>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handlePortalAccess(customer)}
                                title="Manage Portal Access"
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePortalAccess(customer)}
                              title="Setup Portal Access"
                            >
                              Setup Portal
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewCustomer(customer)}
                              title="View Customer"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditCustomer(customer)}
                              title="Edit Customer"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="text-error hover:text-error"
                              title="Delete Customer"
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
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No customers found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CustomerFormModal 
        isOpen={showCustomerForm} 
        onClose={handleCloseCustomerForm}
        customer={selectedCustomer}
        isEditing={isEditing}
      />

      {/* Portal Access Management Dialog */}
      <Dialog open={showPortalModal} onOpenChange={setShowPortalModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Portal Access</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Customer: {portalCustomer?.name}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={portalCustomer?.portalAccess || false}
                onCheckedChange={(checked) => {
                  setPortalCustomer(prev => ({ ...prev, portalAccess: checked }));
                }}
              />
              <Label>Enable Portal Access</Label>
            </div>
            {portalCustomer?.portalAccess && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="portal-username">Username</Label>
                  <Input
                    id="portal-username"
                    type="text"
                    value={portalUsername}
                    onChange={(e) => setPortalUsername(e.target.value)}
                    placeholder="Enter username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portal-password">Password</Label>
                  <Input
                    id="portal-password"
                    type="password"
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  Portal URL: <code className="bg-gray-100 px-2 py-1 rounded">/customer-portal</code>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowPortalModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!portalCustomer) return;
                portalAccessMutation.mutate({
                  customerId: portalCustomer.id,
                  username: portalUsername,
                  password: portalPassword,
                  portalAccess: portalCustomer.portalAccess || false
                });
              }}
              disabled={portalAccessMutation.isPending}
            >
              {portalAccessMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
