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
  Upload,
  Users, 
  Wifi, 
  UserPlus,
  Settings, 
  Headphones,
  Eye,
  Edit,
  Trash2,
  Computer,
  FileSpreadsheet,
  AlertCircle
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
  const [showSystemDetailsDialog, setShowSystemDetailsDialog] = useState(false);
  const [selectedCustomerForSystems, setSelectedCustomerForSystems] = useState<any>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Export customers to CSV
  const exportCustomers = async () => {
    try {
      const response = await fetch('/api/customers/export', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to export customers');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `customers-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Success",
        description: "Customer data has been exported successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export customer data",
        variant: "destructive",
      });
    }
  };

  // Import customers from Excel/CSV
  const importCustomersMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/customers/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Import failed' }));
        throw new Error(errorData.message || 'Failed to import customers');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setShowImportDialog(false);
      setImportFile(null);
      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.imported} customers. ${data.errors || 0} errors occurred.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImport = () => {
    if (importFile) {
      importCustomersMutation.mutate(importFile);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'customerId', 'name', 'email', 'contactPerson', 'mobilePhone', 
      'address', 'city', 'state', 'latitude', 'longitude', 
      'connectionType', 'planType', 'monthlyFee', 'status'
    ];
    
    const csvContent = headers.join(',') + '\n' +
      'C001,Sample Company,contact@example.com,John Doe,9876543210,' +
      '"123 Main St",Mumbai,Maharashtra,19.0760,72.8777,' +
      'fiber,business,2500,active';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'customer-import-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers", searchQuery, locationFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (locationFilter !== 'all') params.append('location', locationFilter);
      
      const url = `/api/customers${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch customers');
      return response.json();
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
    },
  });

  // Fetch system details for selected customer
  const { data: customerSystemDetails = [], isLoading: systemDetailsLoading } = useQuery({
    queryKey: [`/api/customers/${selectedCustomerForSystems?.id}/system-details`],
    enabled: !!selectedCustomerForSystems,
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

  const handleViewSystemDetails = (customer: any) => {
    setSelectedCustomerForSystems(customer);
    setShowSystemDetailsDialog(true);
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
          <Button variant="outline" onClick={exportCustomers}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import
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
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, ID, email, or location..."
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
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="bangalore">Bangalore</SelectItem>
                    <SelectItem value="mumbai">Mumbai</SelectItem>
                    <SelectItem value="delhi">Delhi</SelectItem>
                  </SelectContent>
                </Select>
                {(searchQuery || locationFilter !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setLocationFilter("all");
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
                            <button
                              onClick={() => handleViewSystemDetails(customer)}
                              className="font-medium text-cyan-600 hover:text-cyan-800 underline cursor-pointer text-left"
                            >
                              {customer.name}
                            </button>
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

      {/* System Details Modal */}
      <Dialog open={showSystemDetailsDialog} onOpenChange={setShowSystemDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              System Details - {selectedCustomerForSystems?.name}
            </DialogTitle>
          </DialogHeader>
          
          {systemDetailsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
              <span className="ml-2">Loading system details...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {customerSystemDetails.length > 0 ? (
                <div className="grid gap-6">
                  {customerSystemDetails.map((detail: any) => (
                    <Card key={detail.id} className="border border-gray-200">
                      <CardHeader className="bg-gray-50 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium text-gray-900">
                            {detail.systemName}
                          </h3>
                          <span className="text-sm text-gray-500">
                            ID: {detail.empId}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Hardware</h4>
                            <div className="space-y-2 text-sm">
                              <div><span className="font-medium">Processor:</span> {detail.processor}</div>
                              <div><span className="font-medium">RAM:</span> {detail.ram}</div>
                              <div><span className="font-medium">Hard Disk:</span> {detail.hardDisk}</div>
                              <div><span className="font-medium">SSD:</span> {detail.ssd}</div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Security & Software</h4>
                            <div className="space-y-2 text-sm">
                              <div><span className="font-medium">Operating System:</span> {detail.operatingSystem}</div>
                              <div><span className="font-medium">Antivirus:</span> {detail.antivirus}</div>
                              <div><span className="font-medium">MS Office:</span> {detail.msOffice}</div>
                              <div><span className="font-medium">Other Software:</span> {detail.otherSoftware}</div>
                            </div>
                          </div>
                        </div>
                        {detail.configuration && (
                          <div className="mt-4">
                            <h4 className="font-medium text-gray-900 mb-2">Configuration Details</h4>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                              {detail.configuration}
                            </p>
                          </div>
                        )}
                        <div className="mt-4 flex justify-between text-xs text-gray-500">
                          <span>Created: {new Date(detail.createdAt).toLocaleDateString()}</span>
                          <span>Updated: {new Date(detail.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8">
                  <Computer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No System Details Found</h3>
                  <p className="text-gray-500">
                    This customer hasn't added any system details yet.
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSystemDetailsDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Customers Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import Customers</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Import Instructions:</p>
                  <ul className="text-blue-700 space-y-1">
                    <li>• Upload Excel (.xlsx) or CSV (.csv) files</li>
                    <li>• Download template below for correct format</li>
                    <li>• Existing customers will be updated if ID matches</li>
                    <li>• Maximum file size: 10MB</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                variant="outline" 
                onClick={downloadTemplate}
                className="w-full"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Download Template
              </Button>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="import-file"
                />
                <label 
                  htmlFor="import-file"
                  className="cursor-pointer flex flex-col items-center text-center"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900">
                    Choose file to upload
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Excel (.xlsx) or CSV (.csv) files only
                  </p>
                </label>
              </div>

              {importFile && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      {importFile.name}
                    </span>
                    <span className="text-xs text-green-600">
                      ({(importFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false);
                setImportFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || importCustomersMutation.isPending}
            >
              {importCustomersMutation.isPending ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
