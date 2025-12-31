import { useState, useEffect } from "react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  AlertCircle,
  X,
  User,
  Mail,
  MapPin,
  Phone,
  Camera,
  ClipboardList,
  Monitor,
  ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export default function Customers() {
  const { user: currentUser } = useAuth();
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
  // Customer Tasks and CCTV dialogs
  const [showTasksDialog, setShowTasksDialog] = useState(false);
  const [selectedCustomerForTasks, setSelectedCustomerForTasks] = useState<any>(null);
  const [showCctvDialog, setShowCctvDialog] = useState(false);
  const [selectedCustomerForCctv, setSelectedCustomerForCctv] = useState<any>(null);
  // Search filters for dialogs
  const [systemSearchQuery, setSystemSearchQuery] = useState("");
  const [cctvSearchQuery, setCctvSearchQuery] = useState("");
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  // Pagination for customer table
  const [customerEntriesPerPage, setCustomerEntriesPerPage] = useState(20);
  // ISP filter: 'all' | 'isp' | 'non-isp'
  const [ispFilter, setIspFilter] = useState<'all' | 'isp' | 'non-isp'>('all');
  // View detail dialogs
  const [showSystemDetailView, setShowSystemDetailView] = useState(false);
  const [selectedSystemDetail, setSelectedSystemDetail] = useState<any>(null);
  const [showCctvDetailView, setShowCctvDetailView] = useState(false);
  const [selectedCctvDetail, setSelectedCctvDetail] = useState<any>(null);
  const [showTaskHistoryView, setShowTaskHistoryView] = useState(false);
  const [selectedTaskForHistory, setSelectedTaskForHistory] = useState<any>(null);
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
        description: `Successfully imported ${data.imported} new customers, updated ${data.updated || 0} existing customers. ${data.errors || 0} errors occurred.`,
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
      'customerId', 'name', 'contactPerson', 'email', 'mobilePhone', 
      'address', 'city', 'state', 'country',
      'servicePlan', 'connectedTower', 'wirelessIp', 'wirelessApIp', 'port',
      'connectionType', 'planType', 'monthlyFee', 'latitude', 'longitude', 'status'
    ];
    
    const sampleRow = [
      'C001', 'Sample Customer', 'John Doe', 'customer@example.com', '9876543210',
      '123 Main Street', 'Mumbai', 'Maharashtra', 'India',
      'Premium - 100 Mbps', 'OSHO Tower', '192.168.1.100', '192.168.1.1', '8080',
      'fiber', 'business', '2500', '19.076', '72.8777', 'active'
    ];
    
    const csvContent = headers.join(',') + '\n' + sampleRow.join(',');
    
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

  // Direct fetch for customers - bypassing React Query for speed
  const [customers, setCustomers] = useState<any[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  
  const fetchCustomers = async () => {
    try {
      console.log('📡 CUSTOMERS: Starting fetch...');
      setCustomersLoading(true);
      
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (locationFilter !== 'all') params.append('location', locationFilter);
      
      const url = `/api/customers${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, { credentials: 'include', cache: 'no-store' });
      
      if (!response.ok) {
        if (response.status === 401) {
          setCustomers([]);
          setCustomersLoading(false);
          return;
        }
        throw new Error('Failed to fetch customers');
      }
      
      let data = await response.json();
      
      // Client-side filtering if server-side search is not working
      if (searchQuery.trim() && data) {
        const searchLower = searchQuery.toLowerCase();
        data = data.filter((customer: any) => 
          (customer.name && customer.name.toLowerCase().includes(searchLower)) ||
          (customer.customer_id && customer.customer_id.toLowerCase().includes(searchLower)) ||
          (customer.customerId && customer.customerId.toLowerCase().includes(searchLower)) ||
          (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
          (customer.contact_person && customer.contact_person.toLowerCase().includes(searchLower)) ||
          (customer.contactPerson && customer.contactPerson.toLowerCase().includes(searchLower)) ||
          (customer.mobile_phone && customer.mobile_phone.includes(searchQuery)) ||
          (customer.mobilePhone && customer.mobilePhone.includes(searchQuery)) ||
          (customer.phone && customer.phone.includes(searchQuery)) ||
          (customer.city && customer.city.toLowerCase().includes(searchLower)) ||
          (customer.state && customer.state.toLowerCase().includes(searchLower)) ||
          (customer.address && customer.address.toLowerCase().includes(searchLower))
        );
      }
      
      console.log('📡 CUSTOMERS: Got', data?.length || 0, 'customers');
      setCustomers(data || []);
    } catch (error) {
      console.error('📡 CUSTOMERS: Error:', error);
      setCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  };

  // Fetch on mount and when filters change (including ISP filter)
  useEffect(() => {
    // Fetch customers when search query exists OR when ISP filter is active
    fetchCustomers();
  }, [searchQuery, locationFilter, ispFilter]);

  // Fetch system details for selected customer
  const { data: customerSystemDetails = [], isLoading: systemDetailsLoading } = useQuery({
    queryKey: [`/api/customers/${selectedCustomerForSystems?.id}/system-details`],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${selectedCustomerForSystems?.id}/system-details`, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error('Failed to fetch system details');
      }
      return res.json();
    },
    enabled: !!selectedCustomerForSystems,
    staleTime: 0,
  });

  // Fetch all tasks to calculate support ticket counts per customer
  const { data: allTasks = [] } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      const res = await fetch('/api/tasks', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error('Failed to fetch tasks');
      }
      return res.json();
    },
    staleTime: 0,
  });

  // Fetch tasks for selected customer
  const { data: customerTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: [`/api/tasks/customer/${selectedCustomerForTasks?.id}`],
    queryFn: async () => {
      const customerId = selectedCustomerForTasks?.id;
      if (!customerId || !allTasks) return [];
      return allTasks.filter((task: any) => 
        task.customer?.id === customerId || 
        task.customerId === customerId || 
        task.customer_id === customerId
      );
    },
    enabled: !!selectedCustomerForTasks && allTasks.length > 0,
  });

  // Fetch CCTV information for selected customer
  const { data: customerCctvData = [], isLoading: cctvLoading } = useQuery({
    queryKey: [`/api/customers/${selectedCustomerForCctv?.id}/cctv-information`],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${selectedCustomerForCctv?.id}/cctv-information`, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error('Failed to fetch CCTV information');
      }
      return res.json();
    },
    enabled: !!selectedCustomerForCctv,
    staleTime: 0,
  });

  // Calculate support ticket count for a specific customer
  const getCustomerTaskCount = (customerId: number) => {
    if (!allTasks || allTasks.length === 0) return 0;
    return allTasks.filter((task: any) => task.customerId === customerId).length;
  };

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

  const customersArray = Array.isArray(customers) ? customers : [];
  const totalCustomers = customersArray.length || 0;
  const activeCustomers = customersArray.filter((c: any) => c.status === 'active').length || 0;
  const newThisMonth = Math.floor(totalCustomers * 0.04); // Mock calculation

  // Apply ISP filter
  const displayedCustomers = customersArray.filter((c: any) => {
    if (ispFilter === 'all') return true;
    if (ispFilter === 'isp') return c.is_isp_customer || c.isIspCustomer;
    if (ispFilter === 'non-isp') return !c.is_isp_customer && !c.isIspCustomer;
    return true;
  });

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
    console.log('🔧 Portal access clicked for customer:', customer);
    setPortalCustomer(customer);
    setPortalUsername(customer.portalUsername || "");
    setPortalPassword(customer.portalPassword || "");
    setShowPortalModal(true);
    console.log('🔧 Modal should be open now');
  };

  const handleViewSystemDetails = (customer: any) => {
    setSelectedCustomerForSystems(customer);
    setShowSystemDetailsDialog(true);
  };

  const handleViewTasks = (customer: any) => {
    setSelectedCustomerForTasks(customer);
    setShowTasksDialog(true);
  };

  const handleViewCctv = (customer: any) => {
    setSelectedCustomerForCctv(customer);
    setShowCctvDialog(true);
  };

  const portalAccessMutation = useMutation({
    mutationFn: async ({ customerId, username, password, portalAccess }: { customerId: number, username: string, password: string, portalAccess: boolean }) => {
      console.log('🔑 Sending portal access request:', {
        customerId,
        username,
        portalAccess
      });
      
      return await apiRequest("PATCH", `/api/customers/${customerId}/portal-access`, {
        username,
        password,
        portalAccess
      });
    },
    onSuccess: (data) => {
      console.log('✅ Portal update success:', data);
      // Invalidate all customer queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.refetchQueries({ queryKey: ["/api/customers"] });
      
      // Clear modal state properly
      setPortalCustomer(null);
      setPortalUsername("");
      setPortalPassword("");
      setShowPortalModal(false);
      toast({
        title: "Success",
        description: "Customer portal access updated successfully",
      });
    },
    onError: (error: Error) => {
      console.error('❌ Portal update error:', error);
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
        description: "Failed to update portal access. Please try again.",
        variant: "destructive",
      });
    },
  });

  // ISP Status Toggle Mutation
  const ispStatusMutation = useMutation({
    mutationFn: async ({ customerId, isIspCustomer }: { customerId: number, isIspCustomer: boolean }) => {
      console.log('🌐 Toggling ISP status:', { customerId, isIspCustomer });
      return await apiRequest("PATCH", `/api/customers/${customerId}/isp-status`, {
        isIspCustomer
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Success",
        description: "Customer ISP status updated successfully",
      });
    },
    onError: (error: Error) => {
      console.error('❌ ISP status update error:', error);
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
        description: "Failed to update ISP status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggleIspStatus = (customer: any) => {
    const currentStatus = customer.is_isp_customer || customer.isIspCustomer || false;
    ispStatusMutation.mutate({
      customerId: customer.id,
      isIspCustomer: !currentStatus
    });
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Customer Management"
        subtitle={`Manage customer information and service history - ${totalCustomers} customers, ${activeCustomers} active services`}
        actions={
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setShowImportDialog(true)} className="bg-white hover:bg-gray-50">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => setShowCustomerForm(true)} className="bg-primary hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </div>
        }
      />
      
      <div className="p-6 space-y-8">
        {/* Customer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Customers</p>
                  <p className="text-3xl font-bold text-blue-900">{totalCustomers}</p>
                  <p className="text-xs text-blue-600 mt-1">Registered in system</p>
                </div>
                <div className="bg-blue-500 p-3 rounded-full">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Active Services</p>
                  <p className="text-3xl font-bold text-green-900">{activeCustomers}</p>
                  <p className="text-xs text-green-600 mt-1">Currently connected</p>
                </div>
                <div className="bg-green-500 p-3 rounded-full">
                  <Wifi className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`bg-gradient-to-r from-cyan-50 to-cyan-100 border-cyan-200 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${ispFilter === 'isp' ? 'ring-2 ring-cyan-500 shadow-lg' : ''}`}
            onClick={() => setIspFilter(ispFilter === 'isp' ? 'all' : 'isp')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-cyan-700">ISP Customers</p>
                  <p className="text-3xl font-bold text-cyan-900">
                    {customersArray.filter((c: any) => c.is_isp_customer || c.isIspCustomer).length || 0}
                  </p>
                  <p className="text-xs text-cyan-600 mt-1">{ispFilter === 'isp' ? '✓ Showing ISP only' : 'Click to filter'}</p>
                </div>
                <div className="bg-cyan-500 p-3 rounded-full">
                  <Wifi className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${ispFilter === 'non-isp' ? 'ring-2 ring-gray-500 shadow-lg' : ''}`}
            onClick={() => setIspFilter(ispFilter === 'non-isp' ? 'all' : 'non-isp')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Non-ISP Customers</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {customersArray.filter((c: any) => !c.is_isp_customer && !c.isIspCustomer).length || 0}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{ispFilter === 'non-isp' ? '✓ Showing Non-ISP only' : 'Click to filter'}</p>
                </div>
                <div className="bg-gray-500 p-3 rounded-full">
                  <Computer className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Portal Access</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {customersArray.filter((c: any) => c.portalAccess).length || 0}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Enabled customers</p>
                </div>
                <div className="bg-purple-500 p-3 rounded-full">
                  <Settings className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Support Tickets</p>
                  <p className="text-3xl font-bold text-orange-900">{allTasks?.length || 0}</p>
                  <p className="text-xs text-orange-600 mt-1">Open requests</p>
                </div>
                <div className="bg-orange-500 p-3 rounded-full">
                  <Headphones className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>Customer Database</span>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Search for customers by name, ID, email, phone, or location
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Type customer name, ID, phone, or keyword to search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-96 bg-white border-gray-300 focus:border-primary"
                    autoFocus
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
                {searchQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="h-10 bg-white hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Show prompt when no search query AND no ISP filter */}
            {!searchQuery.trim() && ispFilter === 'all' ? (
              <div className="text-center py-16">
                <div className="bg-blue-50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Search className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Search for Customers</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-4">
                  Enter a customer name, ID, phone number, email, or any keyword in the search box above to find customers.
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-400">
                  <span className="bg-gray-100 px-3 py-1 rounded-full">Customer Name</span>
                  <span className="bg-gray-100 px-3 py-1 rounded-full">Customer ID</span>
                  <span className="bg-gray-100 px-3 py-1 rounded-full">Phone Number</span>
                  <span className="bg-gray-100 px-3 py-1 rounded-full">Email</span>
                  <span className="bg-gray-100 px-3 py-1 rounded-full">Location</span>
                </div>
              </div>
            ) : customersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : displayedCustomers && displayedCustomers.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    Found: <span className="font-semibold text-primary">{displayedCustomers.length}</span> customers{ispFilter !== 'all' ? ` (${ispFilter === 'isp' ? 'ISP' : 'Non-ISP'} only)` : ''}{searchQuery ? ` matching "${searchQuery}"` : ''}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show:</span>
                    <Select value={String(customerEntriesPerPage)} onValueChange={(v) => setCustomerEntriesPerPage(Number(v))}>
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-600">entries</span>
                  </div>
                </div>
                <div className={`overflow-x-auto ${customerEntriesPerPage > 20 ? 'max-h-[700px] overflow-y-auto' : ''}`}>
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-[120px]">Customer ID</TableHead>
                      <TableHead className="w-[200px]">Name & Contact Person</TableHead>
                      <TableHead className="w-[180px]">Contact Details</TableHead>
                      <TableHead className="w-[140px]">Phone Number</TableHead>
                      <TableHead className="w-[150px]">Service Plan</TableHead>
                      <TableHead className="w-[130px]">Location</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[120px]">Portal Access</TableHead>
                      <TableHead className="w-[100px]">Support Tickets</TableHead>
                      <TableHead className="w-[80px]">ISP</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedCustomers.slice(0, customerEntriesPerPage).map((customer: any) => (
                      <TableRow key={customer.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-primary">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">#</span>
                            <span className="font-mono font-semibold">{customer.customer_id || customer.customerId || `C${customer.id}`}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="font-medium text-cyan-600 hover:text-cyan-800 cursor-pointer text-left flex items-center gap-1"
                                >
                                  {customer.name}
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-48">
                                <DropdownMenuItem onClick={() => handleViewTasks(customer)} className="cursor-pointer">
                                  <ClipboardList className="w-4 h-4 mr-2 text-orange-600" />
                                  <span>View Tasks</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewSystemDetails(customer)} className="cursor-pointer">
                                  <Monitor className="w-4 h-4 mr-2 text-blue-600" />
                                  <span>System Details</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewCctv(customer)} className="cursor-pointer">
                                  <Camera className="w-4 h-4 mr-2 text-cyan-600" />
                                  <span>CCTV Information</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="text-sm text-gray-600 flex items-center">
                              <User className="w-3 h-3 mr-1 text-gray-400" />
                              {customer.contact_person || customer.contactPerson || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm flex items-center">
                              <Mail className="w-3 h-3 mr-1 text-gray-400" />
                              <span className="truncate max-w-[120px]" title={customer.email}>
                                {customer.email || 'N/A'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                              {customer.address ? (
                                <span className="truncate max-w-[120px]" title={customer.address}>
                                  {customer.address}
                                </span>
                              ) : 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-green-600" />
                            <div>
                              <div className="font-mono font-medium text-sm">
                                {customer.mobile_phone || customer.mobilePhone || customer.phone || 'N/A'}
                              </div>
                              {(customer.mobile_phone || customer.mobilePhone || customer.phone) && (
                                <a 
                                  href={`tel:${customer.mobile_phone || customer.mobilePhone || customer.phone}`}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Call
                                </a>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Wifi className="w-4 h-4 text-blue-500" />
                            <div>
                              <div className="font-medium text-sm">
                                {(customer.service_plan && customer.service_plan.trim()) || 
                                 customer.plan_type || 
                                 customer.servicePlan || 
                                 customer.planType || 
                                 customer.connection_type || 
                                 'Standard Plan'}
                              </div>
                              {(customer.monthly_fee || customer.monthlyFee) && parseFloat(customer.monthly_fee || customer.monthlyFee) > 0 && (
                                <div className="text-xs text-green-600 font-semibold">
                                  ₹{customer.monthly_fee || customer.monthlyFee}/month
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <div className="text-sm">
                              <div className="font-medium">{customer.city}</div>
                              <div className="text-xs text-gray-500">{customer.state}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={customer.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${customer.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                              <span className="capitalize">{customer.status}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {customer.portalAccess ? (
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  <span>Active</span>
                                </div>
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handlePortalAccess(customer)}
                                title="Manage Portal Access"
                                className="h-6 w-6 p-0"
                              >
                                <Settings className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePortalAccess(customer)}
                              title="Setup Portal Access"
                              className="text-xs h-7"
                            >
                              Setup
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                              <div className="flex items-center space-x-1">
                                <Headphones className="w-3 h-3" />
                                <span>{getCustomerTaskCount(customer.id)}</span>
                              </div>
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={customer.is_isp_customer || customer.isIspCustomer || false}
                              onCheckedChange={() => handleToggleIspStatus(customer)}
                              disabled={ispStatusMutation.isPending}
                              className="data-[state=checked]:bg-cyan-600"
                            />
                            <span className={`text-xs font-medium ${
                              customer.is_isp_customer || customer.isIspCustomer
                                ? 'text-cyan-600'
                                : 'text-gray-400'
                            }`}>
                              {customer.is_isp_customer || customer.isIspCustomer ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewCustomer(customer)}
                              title="View Customer Details"
                              className="h-8 w-8 p-0 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditCustomer(customer)}
                              title="Edit Customer"
                              className="h-8 w-8 p-0 hover:bg-yellow-50"
                            >
                              <Edit className="w-4 h-4 text-yellow-600" />
                            </Button>
                            {currentUser?.role === 'admin' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteCustomer(customer.id)}
                                className="h-8 w-8 p-0 hover:bg-red-50 text-red-600 hover:text-red-700"
                                title="Delete Customer"
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
                <div className="mt-3 text-sm text-gray-500">
                  Showing {Math.min(customerEntriesPerPage, displayedCustomers.length)} of {displayedCustomers.length} {ispFilter !== 'all' ? `${ispFilter === 'isp' ? 'ISP' : 'Non-ISP'} ` : ''}customers
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">No customers found</h3>
                <p className="text-sm text-gray-400">
                  {ispFilter !== 'all' 
                    ? `No ${ispFilter === 'isp' ? 'ISP' : 'Non-ISP'} customers found${searchQuery ? ` matching "${searchQuery}"` : ''}`
                    : `No customers match "${searchQuery}"`
                  }
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {ispFilter !== 'all' && (
                    <button 
                      onClick={() => setIspFilter('all')} 
                      className="text-cyan-600 hover:underline"
                    >
                      Clear ISP filter
                    </button>
                  )}
                </p>
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
                  setPortalCustomer((prev: any) => ({ ...prev, portalAccess: checked }));
                  // Clear fields when disabling
                  if (!checked) {
                    setPortalUsername("");
                    setPortalPassword("");
                  }
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
                const updateData = {
                  customerId: portalCustomer.id,
                  username: portalUsername.trim(),
                  password: portalPassword.trim(),
                  portalAccess: portalCustomer.portalAccess
                };
                console.log('🔄 Portal update request:', updateData);
                portalAccessMutation.mutate(updateData);
              }}
              disabled={portalAccessMutation.isPending || !portalUsername.trim() || !portalPassword.trim()}
            >
              {portalAccessMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* System Details Modal */}
      <Dialog open={showSystemDetailsDialog} onOpenChange={setShowSystemDetailsDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-600" />
              System Details - {selectedCustomerForSystems?.name}
            </DialogTitle>
          </DialogHeader>
          
          {systemDetailsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
              <span className="ml-2">Loading system details...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Count Card and Search */}
              <div className="flex items-center justify-between gap-4">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Computer className="w-8 h-8" />
                    <div>
                      <div className="text-2xl font-bold">
                        {Array.isArray(customerSystemDetails) ? customerSystemDetails.length : 0}
                      </div>
                      <div className="text-sm opacity-90">Total Systems</div>
                    </div>
                  </div>
                </Card>
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Search by system name, emp ID, processor..."
                    value={systemSearchQuery}
                    onChange={(e) => setSystemSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              {Array.isArray(customerSystemDetails) && customerSystemDetails.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>System Name</TableHead>
                      <TableHead>Emp ID</TableHead>
                      <TableHead>Processor</TableHead>
                      <TableHead>RAM</TableHead>
                      <TableHead>Hard Disk</TableHead>
                      <TableHead>SSD</TableHead>
                      <TableHead>OS</TableHead>
                      <TableHead>Antivirus</TableHead>
                      <TableHead>MS Office</TableHead>
                      <TableHead>Other Software</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(customerSystemDetails as any[])
                      .filter((detail: any) => {
                        if (!systemSearchQuery) return true;
                        const search = systemSearchQuery.toLowerCase();
                        return (
                          (detail.systemName?.toLowerCase() || '').includes(search) ||
                          (detail.empId?.toLowerCase() || '').includes(search) ||
                          (detail.processor?.toLowerCase() || '').includes(search) ||
                          (detail.operatingSystem?.toLowerCase() || '').includes(search)
                        );
                      })
                      .map((detail: any) => (
                      <TableRow key={detail.id}>
                        <TableCell>
                          <button
                            className="font-medium text-cyan-600 hover:text-cyan-800 hover:underline cursor-pointer"
                            onClick={() => {
                              setSelectedSystemDetail(detail);
                              setShowSystemDetailView(true);
                            }}
                          >
                            {detail.systemName || '-'}
                          </button>
                        </TableCell>
                        <TableCell>{detail.empId || '-'}</TableCell>
                        <TableCell>{detail.processor || '-'}</TableCell>
                        <TableCell>{detail.ram || '-'}</TableCell>
                        <TableCell>{detail.hardDisk || '-'}</TableCell>
                        <TableCell>{detail.ssd || '-'}</TableCell>
                        <TableCell>{detail.operatingSystem || '-'}</TableCell>
                        <TableCell>{detail.antivirus || '-'}</TableCell>
                        <TableCell>{detail.msOffice || '-'}</TableCell>
                        <TableCell className="max-w-[150px] truncate" title={detail.otherSoftware}>{detail.otherSoftware || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {detail.updatedAt ? format(new Date(detail.updatedAt), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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

      {/* System Detail View Dialog */}
      <Dialog open={showSystemDetailView} onOpenChange={setShowSystemDetailView}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Computer className="w-5 h-5 text-blue-600" />
              System Details - {selectedSystemDetail?.systemName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSystemDetail && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">System Name</div>
                  <div className="font-medium">{selectedSystemDetail.systemName || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Employee ID</div>
                  <div className="font-medium">{selectedSystemDetail.empId || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Processor</div>
                  <div className="font-medium">{selectedSystemDetail.processor || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">RAM</div>
                  <div className="font-medium">{selectedSystemDetail.ram || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Hard Disk</div>
                  <div className="font-medium">{selectedSystemDetail.hardDisk || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">SSD</div>
                  <div className="font-medium">{selectedSystemDetail.ssd || '-'}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Operating System</div>
                  <div className="font-medium">{selectedSystemDetail.operatingSystem || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Antivirus</div>
                  <div className="font-medium">{selectedSystemDetail.antivirus || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">MS Office</div>
                  <div className="font-medium">{selectedSystemDetail.msOffice || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Other Software</div>
                  <div className="font-medium text-sm">{selectedSystemDetail.otherSoftware || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Last Updated</div>
                  <div className="font-medium">
                    {selectedSystemDetail.updatedAt ? format(new Date(selectedSystemDetail.updatedAt), 'dd/MM/yyyy HH:mm') : '-'}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSystemDetailView(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Tasks Dialog */}
      <Dialog open={showTasksDialog} onOpenChange={setShowTasksDialog}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-orange-600" />
              Tasks - {selectedCustomerForTasks?.name}
            </DialogTitle>
          </DialogHeader>
          
          {tasksLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-2">Loading tasks...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Count Card and Search */}
              <div className="flex items-center justify-between gap-4">
                <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="w-8 h-8" />
                    <div>
                      <div className="text-2xl font-bold">
                        {Array.isArray(customerTasks) ? customerTasks.length : 0}
                      </div>
                      <div className="text-sm opacity-90">Total Tasks</div>
                    </div>
                  </div>
                </Card>
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Search by ticket number, issue type..."
                    value={taskSearchQuery}
                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              {Array.isArray(customerTasks) && customerTasks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket #</TableHead>
                      <TableHead>Issue Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerTasks
                      .filter((task: any) => {
                        if (!taskSearchQuery) return true;
                        const search = taskSearchQuery.toLowerCase();
                        return (
                          (task.ticketNumber?.toLowerCase() || '').includes(search) ||
                          (task.issueType?.toLowerCase() || '').includes(search) ||
                          (task.description?.toLowerCase() || '').includes(search) ||
                          (task.assignedUserName?.toLowerCase() || '').includes(search)
                        );
                      })
                      .map((task: any) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <button
                            className="font-mono text-sm font-medium text-cyan-600 hover:text-cyan-800 hover:underline cursor-pointer"
                            onClick={() => {
                              setSelectedTaskForHistory(task);
                              setShowTaskHistoryView(true);
                            }}
                          >
                            {task.ticketNumber || `T${task.id}`}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{task.issueType || 'General'}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[200px]">{task.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            task.priority === 'urgent' ? 'destructive' :
                            task.priority === 'high' ? 'destructive' :
                            task.priority === 'medium' ? 'secondary' : 'outline'
                          }>
                            {task.priority || 'normal'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            task.status === 'completed' ? 'default' :
                            task.status === 'in_progress' ? 'secondary' :
                            task.status === 'pending' ? 'outline' : 'outline'
                          } className={
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''
                          }>
                            {task.status?.replace('_', ' ') || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {task.assignedUserName || task.assignedToName || 'Unassigned'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {task.createdAt ? format(new Date(task.createdAt), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-8">
                  <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Found</h3>
                  <p className="text-gray-500">
                    This customer has no support tickets yet.
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTasksDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer CCTV Information Dialog */}
      <Dialog open={showCctvDialog} onOpenChange={setShowCctvDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-cyan-600" />
              CCTV Information - {selectedCustomerForCctv?.name}
            </DialogTitle>
          </DialogHeader>
          
          {cctvLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
              <span className="ml-2">Loading CCTV information...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Count Card and Search */}
              <div className="flex items-center justify-between gap-4">
                <Card className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white p-4 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Camera className="w-8 h-8" />
                    <div>
                      <div className="text-2xl font-bold">
                        {Array.isArray(customerCctvData) ? customerCctvData.length : 0}
                      </div>
                      <div className="text-sm opacity-90">Total Cameras</div>
                    </div>
                  </div>
                </Card>
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Search by IP, name, location, model..."
                    value={cctvSearchQuery}
                    onChange={(e) => setCctvSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              {Array.isArray(customerCctvData) && customerCctvData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.NO.</TableHead>
                      <TableHead>Camera IP</TableHead>
                      <TableHead>Added In</TableHead>
                      <TableHead>Port</TableHead>
                      <TableHead>Model No.</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Uplink</TableHead>
                      <TableHead>Serial No.</TableHead>
                      <TableHead>MAC Address</TableHead>
                      <TableHead>Updated By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerCctvData
                      .filter((cctv: any) => {
                        if (!cctvSearchQuery) return true;
                        const search = cctvSearchQuery.toLowerCase();
                        return (
                          (cctv.cameraIp?.toLowerCase() || '').includes(search) ||
                          (cctv.locationName?.toLowerCase() || '').includes(search) ||
                          (cctv.modelNo?.toLowerCase() || '').includes(search) ||
                          (cctv.deviceSerialNo?.toLowerCase() || '').includes(search) ||
                          (cctv.macAddress?.toLowerCase() || '').includes(search)
                        );
                      })
                      .map((cctv: any, index: number) => (
                      <TableRow key={cctv.id}>
                        <TableCell>{cctv.serialNumber || index + 1}</TableCell>
                        <TableCell>
                          <button
                            className="font-mono text-sm text-cyan-600 hover:text-cyan-800 hover:underline cursor-pointer"
                            onClick={() => {
                              setSelectedCctvDetail(cctv);
                              setShowCctvDetailView(true);
                            }}
                          >
                            {cctv.cameraIp || '-'}
                          </button>
                        </TableCell>
                        <TableCell>{cctv.addedIn || '-'}</TableCell>
                        <TableCell>{cctv.port || '-'}</TableCell>
                        <TableCell>{cctv.modelNo || '-'}</TableCell>
                        <TableCell>{cctv.locationName || '-'}</TableCell>
                        <TableCell>{cctv.uplink || '-'}</TableCell>
                        <TableCell>{cctv.deviceSerialNo || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{cctv.macAddress || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {cctv.updatedByName || '-'}
                          {cctv.updatedAt && (
                            <div className="text-xs text-gray-400">
                              {format(new Date(cctv.updatedAt), 'dd/MM/yyyy')}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-8">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No CCTV Information Found</h3>
                  <p className="text-gray-500">
                    This customer has no CCTV records yet.
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCctvDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CCTV Detail View Dialog */}
      <Dialog open={showCctvDetailView} onOpenChange={setShowCctvDetailView}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-cyan-600" />
              Camera Details - {selectedCctvDetail?.cameraIp}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCctvDetail && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Camera IP</div>
                  <div className="font-medium font-mono">{selectedCctvDetail.cameraIp || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Port</div>
                  <div className="font-medium">{selectedCctvDetail.port || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Model No.</div>
                  <div className="font-medium">{selectedCctvDetail.modelNo || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Location</div>
                  <div className="font-medium">{selectedCctvDetail.locationName || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Added In</div>
                  <div className="font-medium">{selectedCctvDetail.addedIn || '-'}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Uplink</div>
                  <div className="font-medium">{selectedCctvDetail.uplink || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Device Serial No.</div>
                  <div className="font-medium">{selectedCctvDetail.deviceSerialNo || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">MAC Address</div>
                  <div className="font-medium font-mono text-sm">{selectedCctvDetail.macAddress || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Updated By</div>
                  <div className="font-medium">{selectedCctvDetail.updatedByName || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Last Updated</div>
                  <div className="font-medium">
                    {selectedCctvDetail.updatedAt ? format(new Date(selectedCctvDetail.updatedAt), 'dd/MM/yyyy HH:mm') : '-'}
                  </div>
                </div>
              </div>
              {selectedCctvDetail.imagePath && (
                <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase mb-2">Camera Image</div>
                  <img 
                    src={selectedCctvDetail.imagePath} 
                    alt="CCTV Camera" 
                    className="max-h-48 object-contain rounded"
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCctvDetailView(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task History View Dialog */}
      <Dialog open={showTaskHistoryView} onOpenChange={setShowTaskHistoryView}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-orange-600" />
              Task Details - {selectedTaskForHistory?.ticketNumber || `T${selectedTaskForHistory?.id}`}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTaskForHistory && (
            <div className="space-y-4">
              {/* Task Header */}
              <div className="flex items-center gap-3">
                <Badge variant={
                  selectedTaskForHistory.priority === 'urgent' ? 'destructive' :
                  selectedTaskForHistory.priority === 'high' ? 'destructive' :
                  selectedTaskForHistory.priority === 'medium' ? 'secondary' : 'outline'
                }>
                  {selectedTaskForHistory.priority || 'normal'}
                </Badge>
                <Badge variant={
                  selectedTaskForHistory.status === 'completed' ? 'default' :
                  selectedTaskForHistory.status === 'in_progress' ? 'secondary' : 'outline'
                } className={
                  selectedTaskForHistory.status === 'completed' ? 'bg-green-100 text-green-800' :
                  selectedTaskForHistory.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  selectedTaskForHistory.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''
                }>
                  {selectedTaskForHistory.status?.replace('_', ' ') || 'pending'}
                </Badge>
              </div>

              {/* Task Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Ticket Number</div>
                  <div className="font-medium font-mono">{selectedTaskForHistory.ticketNumber || `T${selectedTaskForHistory.id}`}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Issue Type</div>
                  <div className="font-medium">{selectedTaskForHistory.issueType || 'General'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Assigned To</div>
                  <div className="font-medium">{selectedTaskForHistory.assignedUserName || selectedTaskForHistory.assignedToName || 'Unassigned'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Created</div>
                  <div className="font-medium">
                    {selectedTaskForHistory.createdAt ? format(new Date(selectedTaskForHistory.createdAt), 'dd/MM/yyyy HH:mm') : '-'}
                  </div>
                </div>
                {selectedTaskForHistory.startTime && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase">Start Time</div>
                    <div className="font-medium">
                      {format(new Date(selectedTaskForHistory.startTime), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                )}
                {selectedTaskForHistory.completedAt && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase">Completed At</div>
                    <div className="font-medium">
                      {format(new Date(selectedTaskForHistory.completedAt), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 uppercase mb-1">Description</div>
                <div className="text-sm">{selectedTaskForHistory.description || 'No description provided'}</div>
              </div>

              {/* Solution if available */}
              {selectedTaskForHistory.solution && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-xs text-green-600 uppercase mb-1">Solution</div>
                  <div className="text-sm text-green-800">{selectedTaskForHistory.solution}</div>
                </div>
              )}

              {/* Comments if available */}
              {selectedTaskForHistory.comments && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs text-blue-600 uppercase mb-1">Comments</div>
                  <div className="text-sm text-blue-800">{selectedTaskForHistory.comments}</div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskHistoryView(false)}>
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
