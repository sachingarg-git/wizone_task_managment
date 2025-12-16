import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { Eye, EyeOff, MessageSquare, Clock, CheckCircle, AlertCircle, User, LogOut, Plus, AlertTriangle, FileText, Calendar, Settings, Monitor, Cpu, HardDrive, Wifi, Shield, Info, Camera, Upload, Trash2, Edit, Download, FileSpreadsheet } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// CCTV Information interface
interface CctvInfo {
  id: number;
  customerId: number;
  customerName: string;
  serialNumber?: string;
  cameraIp?: string;
  addedIn?: string;
  port?: string;
  httpPort?: string;
  modelNo?: string;
  locationName?: string;
  uplink?: string;
  rackPhoto?: string;
  nvrCameraPhoto?: string;
  deviceSerialNo?: string;
  macAddress?: string;
  updatedBy?: number;
  updatedByName?: string;
  createdAt: string;
  updatedAt?: string;
}

interface CustomerUser {
  id: number;
  username: string;
  name: string;
  email: string;
  contactPerson: string;
  mobilePhone: string;
  address: string;
  city: string;
  state: string;
}

interface CustomerTask {
  id: number;
  ticketNumber: string;
  title: string;
  priority: string;
  issueType: string;
  status: string;
  description: string;
  resolution: string;
  createdAt: string;
  completionTime: string;
  assignedUser?: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface CustomerComment {
  id: number;
  taskId: number;
  comment: string;
  attachments: string[];
  isInternal: boolean;
  createdAt: string;
  respondedByUser?: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface TaskHistoryUpdate {
  id: number;
  taskId: number;
  message: string;
  type: string;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  isCustomerUpdate: boolean;
  isAdminUpdate: boolean;
  priority?: string;
  status?: string;
  updatedByUser?: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface SystemDetail {
  id: number;
  // Support both snake_case (from raw SQL) and camelCase (from Drizzle ORM)
  customer_id?: string;
  customerId?: number;
  customer_name?: string;
  customerName?: string;
  emp_id?: string;
  empId?: string;
  emp_name?: string;
  empName?: string;
  department?: string;
  system_name?: string;
  systemName?: string;
  system_type?: string;
  systemType?: string;
  system_configuration?: string;
  systemConfiguration?: string;
  processor?: string;
  processor_name?: string;
  processorName?: string;
  processor_cores?: string;
  processorCores?: string;
  processor_speed?: string;
  processorSpeed?: string;
  ram?: string;
  ram_type?: string;
  ramType?: string;
  ram_frequency?: string;
  ramFrequency?: string;
  ram_slots?: string;
  ramSlots?: string;
  motherboard?: string;
  motherboard_manufacturer?: string;
  motherboardManufacturer?: string;
  hard_disk?: string;
  hardDisk?: string;
  hdd_capacity?: string;
  hddCapacity?: string;
  ssd?: string;
  ssd_capacity?: string;
  ssdCapacity?: string;
  graphics_card?: string;
  graphicsCard?: string;
  graphics_memory?: string;
  graphicsMemory?: string;
  operating_system?: string;
  operatingSystem?: string;
  os_version?: string;
  osVersion?: string;
  os_architecture?: string;
  osArchitecture?: string;
  mac_address?: string;
  macAddress?: string;
  ip_address?: string;
  ipAddress?: string;
  ethernet_speed?: string;
  ethernetSpeed?: string;
  serial_number?: string;
  serialNumber?: string;
  bios_version?: string;
  biosVersion?: string;
  antivirus?: string;
  antivirus_available?: boolean;
  antivirusAvailable?: boolean;
  ms_office?: string;
  msOffice?: string;
  other_software?: string;
  otherSoftware?: string;
  sharing_status?: boolean;
  sharingStatus?: boolean;
  administrator_account?: boolean;
  administratorAccount?: boolean;
  ups_available?: boolean;
  upsAvailable?: boolean;
  is_active?: boolean;
  isActive?: boolean;
  collected_at?: string;
  collectedAt?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

// Helper function to get value from either snake_case or camelCase field
const getField = (obj: any, snakeCase: string, camelCase: string): any => {
  return obj[snakeCase] ?? obj[camelCase] ?? null;
};

export default function CustomerPortal() {
  console.log('🟢 CustomerPortal component is rendering');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CustomerTask | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createTaskForm, setCreateTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    issueType: "technical"
  });
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [showUpdateTask, setShowUpdateTask] = useState(false);
  const [updateTaskForm, setUpdateTaskForm] = useState({
    comment: "",
    status: "",
    priority: ""
  });
  const [activeTab, setActiveTab] = useState("tasks");
  const [showSystemDetailsForm, setShowSystemDetailsForm] = useState(false);
  const [selectedSystemDetail, setSelectedSystemDetail] = useState<SystemDetail | null>(null);
  const [showSystemDetailView, setShowSystemDetailView] = useState(false);
  const [isEditingSystem, setIsEditingSystem] = useState(false);
  const [editSystemId, setEditSystemId] = useState<number | null>(null);
  const [customDepartment, setCustomDepartment] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  
  // CCTV State
  const [showCctvForm, setShowCctvForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedCctv, setSelectedCctv] = useState<CctvInfo | null>(null);
  const [showCctvView, setShowCctvView] = useState(false);
  const [isEditingCctv, setIsEditingCctv] = useState(false);
  const [editCctvId, setEditCctvId] = useState<number | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  // Upload progress states
  const [rackPhotoUploadProgress, setRackPhotoUploadProgress] = useState(0);
  const [nvrPhotoUploadProgress, setNvrPhotoUploadProgress] = useState(0);
  const [isUploadingRackPhoto, setIsUploadingRackPhoto] = useState(false);
  const [isUploadingNvrPhoto, setIsUploadingNvrPhoto] = useState(false);
  // CCTV Filters
  const [cctvFilterCameraIp, setCctvFilterCameraIp] = useState("");
  const [cctvFilterAddedIn, setCctvFilterAddedIn] = useState("all");
  const [cctvFilterModelNo, setCctvFilterModelNo] = useState("all");
  const [cctvFilterUplink, setCctvFilterUplink] = useState("");
  const [cctvFilterSerialNo, setCctvFilterSerialNo] = useState("");
  const [cctvForm, setCctvForm] = useState({
    serialNumber: "",
    cameraIp: "",
    addedIn: "",
    port: "",
    httpPort: "",
    modelNo: "",
    locationName: "",
    uplink: "",
    rackPhoto: "",
    nvrCameraPhoto: "",
    deviceSerialNo: "",
    macAddress: "",
  });
  const [bulkUploadData, setBulkUploadData] = useState<any[]>([]);
  
  const [systemDetailsForm, setSystemDetailsForm] = useState({
    empId: "",
    empName: "",
    systemName: "",
    systemType: "Desktop",
    department: "",
    processor: "",
    processorCores: "",
    processorSpeed: "",
    ram: "",
    ramType: "",
    ramFrequency: "",
    ramSlots: "",
    motherboard: "",
    motherboardManufacturer: "",
    hardDisk: "",
    hddCapacity: "",
    ssd: "",
    ssdCapacity: "",
    graphicsCard: "",
    graphicsMemory: "",
    operatingSystem: "",
    osVersion: "",
    osArchitecture: "",
    macAddress: "",
    ipAddress: "",
    ethernetSpeed: "",
    serialNumber: "",
    biosVersion: "",
    antivirus: "",
    msOffice: "",
    otherSoftware: ""
  });
  const { toast } = useToast();

  // Fetch all users for employee dropdown
  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ['/api/customer-portal/users'],
    queryFn: async () => {
      const response = await fetch('/api/customer-portal/users', {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!customerUser
  });

  // Helper function to format timestamps correctly
  const formatTimestamp = (timestamp: string | Date) => {
    try {
      // Debug logging - temporarily enabled
      console.log('🕐 Formatting timestamp:', timestamp, typeof timestamp);
      
      let date: Date;
      if (typeof timestamp === 'string') {
        // Parse the ISO string properly - this should handle timezone correctly
        date = parseISO(timestamp);
      } else {
        date = timestamp;
      }
      
      console.log('🕐 Parsed date object:', date.toString());
      console.log('🕐 ISO format:', date.toISOString());
      console.log('🕐 Local string:', date.toLocaleString());
      
      // Use the browser's local timezone for display
      const result = format(date, 'MMM dd, yyyy • hh:mm a');
      console.log('🕐 Formatted result:', result);
      
      return result;
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return 'Invalid date';
    }
  };

  // Check if customer is already logged in
  useEffect(() => {
    const storedCustomer = localStorage.getItem("customerPortalUser");
    if (storedCustomer) {
      const customer = JSON.parse(storedCustomer);
      setCustomerUser(customer);
      setIsLoggedIn(true);
    }
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      console.log('🔵 CUSTOMER PORTAL LOGIN - Making API call to:', "/api/customer-portal/auth/login");
      console.log('🔵 CUSTOMER PORTAL LOGIN - With credentials:', credentials);
      
      const response = await fetch("/api/customer-portal/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: 'include', // Important for session management
      });
      
      console.log('🔵 CUSTOMER PORTAL LOGIN - Response status:', response.status);
      console.log('🔵 CUSTOMER PORTAL LOGIN - Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔵 CUSTOMER PORTAL LOGIN - Error response:', errorText);
        throw new Error("Invalid credentials");
      }
      const result = await response.json();
      console.log('🔵 CUSTOMER PORTAL LOGIN - Success result:', result);
      return result;
    },
    onSuccess: (response) => {
      console.log('🔵 CUSTOMER PORTAL LOGIN SUCCESS - Response:', response);
      const customer = response.user || response;
      console.log('🔵 CUSTOMER PORTAL LOGIN SUCCESS - Customer:', customer);
      setCustomerUser(customer);
      setIsLoggedIn(true);
      localStorage.setItem("customerPortalUser", JSON.stringify(customer));
      toast({ title: `Welcome, ${customer.name}!` });
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch customer tasks with real-time updates (every 5 seconds)
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<CustomerTask[]>({
    queryKey: [`/api/customer-portal/tasks`],
    enabled: !!customerUser && !!customerUser.id,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
    queryFn: async () => {
      const response = await fetch('/api/customer-portal/tasks', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    }
  });

  // Fetch task history when a task is selected
  const { data: taskHistory = [] } = useQuery<TaskHistoryUpdate[]>({
    queryKey: [`/api/customer-portal/tasks/${selectedTask?.id}/history`],
    enabled: !!selectedTask,
    refetchInterval: 3000, // Real-time history updates every 3 seconds
    queryFn: async () => {
      const response = await fetch(`/api/customer-portal/tasks/${selectedTask?.id}/history`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch task history');
      return response.json();
    }
  });

  // Fetch task comments
  const { data: comments = [] } = useQuery<CustomerComment[]>({
    queryKey: [`/api/customer-portal/tasks/${selectedTask?.id}/comments`],
    enabled: !!selectedTask,
    queryFn: async () => {
      const response = await fetch(`/api/customer-portal/tasks/${selectedTask?.id}/comments`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    }
  });

  // Fetch customer system details
  const { data: systemDetails = [], isLoading: systemDetailsLoading, refetch: refetchSystemDetails } = useQuery<any[]>({
    queryKey: [`/api/customer-portal/system-details`],
    enabled: !!customerUser,
    queryFn: async () => {
      const response = await fetch('/api/customer-portal/system-details', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch system details');
      return response.json();
    }
  });

  // Fetch CCTV Information
  const { data: cctvData = [], isLoading: cctvLoading, refetch: refetchCctv } = useQuery<CctvInfo[]>({
    queryKey: [`/api/customer-portal/cctv-information`],
    enabled: !!customerUser,
    queryFn: async () => {
      const response = await fetch(`/api/customer-portal/cctv-information`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch CCTV information');
      return response.json();
    }
  });

  // Upload image helper function with progress tracking
  const uploadImage = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      // Simulate reading progress
      reader.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const readProgress = Math.round((event.loaded / event.total) * 30); // Reading is 30% of total
          onProgress(readProgress);
        }
      };
      
      reader.onload = async () => {
        try {
          if (onProgress) onProgress(35); // Reading complete
          
          const base64Data = reader.result as string;
          const extension = file.name.split('.').pop() || 'jpg';
          
          if (onProgress) onProgress(40); // Preparing upload
          
          // Use XMLHttpRequest for upload progress tracking
          const xhr = new XMLHttpRequest();
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
              const uploadProgress = 40 + Math.round((event.loaded / event.total) * 50); // Upload is 50% of total (40-90)
              onProgress(uploadProgress);
            }
          };
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              if (onProgress) onProgress(95); // Processing response
              try {
                const result = JSON.parse(xhr.responseText);
                if (onProgress) onProgress(100); // Complete
                resolve(result.imageUrl);
              } catch (e) {
                reject(new Error('Failed to parse response'));
              }
            } else {
              reject(new Error('Failed to upload image'));
            }
          };
          
          xhr.onerror = () => reject(new Error('Network error during upload'));
          
          xhr.open('POST', '/api/customer-portal/cctv-upload-image', true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.withCredentials = true;
          
          xhr.send(JSON.stringify({
            imageData: base64Data,
            imageType: extension,
            fileName: `${Date.now()}_${file.name}`,
          }));
          
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      if (onProgress) onProgress(5); // Starting read
      reader.readAsDataURL(file);
    });
  };

  // Create CCTV mutation
  const createCctvMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/customer-portal/cctv-information", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create CCTV record");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customer-portal/cctv-information`] });
      setShowCctvForm(false);
      setCctvForm({
        serialNumber: "",
        cameraIp: "",
        addedIn: "",
        port: "",
        httpPort: "",
        modelNo: "",
        locationName: "",
        uplink: "",
        rackPhoto: "",
        nvrCameraPhoto: "",
        deviceSerialNo: "",
        macAddress: "",
      });
      toast({ title: "CCTV record added successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to add CCTV record", variant: "destructive" });
    },
  });

  // Delete CCTV mutation
  const deleteCctvMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/customer-portal/cctv-information/${id}`, {
        method: "DELETE",
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to delete CCTV record");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customer-portal/cctv-information`] });
      toast({ title: "CCTV record deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete CCTV record", variant: "destructive" });
    },
  });

  // Update CCTV mutation
  const updateCctvMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/customer-portal/cctv-information/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update CCTV record");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customer-portal/cctv-information`] });
      setShowCctvForm(false);
      setIsEditingCctv(false);
      setEditCctvId(null);
      setCctvForm({
        serialNumber: "",
        cameraIp: "",
        addedIn: "",
        port: "",
        httpPort: "",
        modelNo: "",
        locationName: "",
        uplink: "",
        rackPhoto: "",
        nvrCameraPhoto: "",
        deviceSerialNo: "",
        macAddress: "",
      });
      toast({ title: "CCTV record updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update CCTV record", variant: "destructive" });
    },
  });

  // Bulk upload CCTV mutation
  const bulkUploadCctvMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const response = await fetch("/api/customer-portal/cctv-information/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ data }),
      });
      if (!response.ok) throw new Error("Failed to upload CCTV records");
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [`/api/customer-portal/cctv-information`] });
      setShowBulkUpload(false);
      setBulkUploadData([]);
      toast({ title: `${result.count} CCTV records uploaded successfully!` });
    },
    onError: () => {
      toast({ title: "Failed to upload CCTV records", variant: "destructive" });
    },
  });

  // Customer task update mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const response = await fetch(`/api/customer-portal/tasks/${selectedTask?.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error("Failed to update task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customer-portal/tasks`] });
      queryClient.invalidateQueries({ queryKey: [`/api/customer-portal/tasks/${selectedTask?.id}/history`] });
      setShowUpdateTask(false);
      setUpdateTaskForm({ comment: "", status: "", priority: "" });
      toast({ title: "Task updated successfully!" });
    },
    onError: () => {
      toast({
        title: "Failed to update task",
        variant: "destructive",
      });
    },
  });

  // Add comment mutation
  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      console.log('🔵 CUSTOMER PORTAL CREATE TASK - Making API call with data:', taskData);
      const response = await fetch("/api/customer-portal/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          ...taskData,
          customerId: customerUser?.id,
        }),
      });
      console.log('🔵 CUSTOMER PORTAL CREATE TASK - Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔵 CUSTOMER PORTAL CREATE TASK - Error response:', errorText);
        throw new Error("Failed to create task");
      }
      const result = await response.json();
      console.log('🔵 CUSTOMER PORTAL CREATE TASK - Success result:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customer-portal/tasks`] });
      setShowCreateTask(false);
      setCreateTaskForm({
        title: "",
        description: "",
        priority: "medium",
        issueType: "technical"
      });
      toast({ title: "Task created successfully!" });
    },
    onError: () => {
      toast({
        title: "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentData: { taskId: number; customerId: number; comment: string }) => {
      const response = await fetch("/api/customer-portal/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(commentData),
      });
      if (!response.ok) throw new Error("Failed to add comment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customer-portal/tasks/${selectedTask?.id}/comments`] });
      setCommentText("");
      toast({ title: "Comment added successfully!" });
    },
    onError: () => {
      toast({
        title: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  // System details mutations
  const createSystemDetailsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/customer-portal/system-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      setShowSystemDetailsForm(false);
      setCustomDepartment("");
      setSystemDetailsForm({
        empId: "",
        empName: "",
        systemName: "",
        systemType: "Desktop",
        department: "",
        processor: "",
        processorCores: "",
        processorSpeed: "",
        ram: "",
        ramType: "",
        ramFrequency: "",
        ramSlots: "",
        motherboard: "",
        motherboardManufacturer: "",
        hardDisk: "",
        hddCapacity: "",
        ssd: "",
        ssdCapacity: "",
        graphicsCard: "",
        graphicsMemory: "",
        operatingSystem: "",
        osVersion: "",
        osArchitecture: "",
        macAddress: "",
        ipAddress: "",
        ethernetSpeed: "",
        serialNumber: "",
        biosVersion: "",
        antivirus: "",
        msOffice: "",
        otherSoftware: ""
      });
      refetchSystemDetails();
      toast({
        title: "Success",
        description: "System details added successfully",
      });
    },
    onError: (error) => {
      console.error("System details error:", error);
      toast({
        title: "Error",
        description: "Failed to add system details. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update system details mutation
  const updateSystemDetailsMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/customer-portal/system-details/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      setShowSystemDetailsForm(false);
      setIsEditingSystem(false);
      setEditSystemId(null);
      setCustomDepartment("");
      setSystemDetailsForm({
        empId: "",
        empName: "",
        systemName: "",
        systemType: "Desktop",
        department: "",
        processor: "",
        processorCores: "",
        processorSpeed: "",
        ram: "",
        ramType: "",
        ramFrequency: "",
        ramSlots: "",
        motherboard: "",
        motherboardManufacturer: "",
        hardDisk: "",
        hddCapacity: "",
        ssd: "",
        ssdCapacity: "",
        graphicsCard: "",
        graphicsMemory: "",
        operatingSystem: "",
        osVersion: "",
        osArchitecture: "",
        macAddress: "",
        ipAddress: "",
        ethernetSpeed: "",
        serialNumber: "",
        biosVersion: "",
        antivirus: "",
        msOffice: "",
        otherSoftware: ""
      });
      refetchSystemDetails();
      toast({
        title: "Success",
        description: "System details updated successfully",
      });
    },
    onError: (error) => {
      console.error("System details update error:", error);
      toast({
        title: "Error",
        description: "Failed to update system details. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔵 CUSTOMER PORTAL FORM SUBMIT - Login form data:', loginForm);
    console.log('🔵 CUSTOMER PORTAL FORM SUBMIT - About to call mutation');
    loginMutation.mutate(loginForm);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskMutation.mutate(createTaskForm);
  };

  const handleCreateSystemDetails = (e: React.FormEvent) => {
    e.preventDefault();
    // Use custom department if "OTHER" is selected
    const formData = {
      ...systemDetailsForm,
      department: systemDetailsForm.department === "OTHER" ? customDepartment : systemDetailsForm.department
    };
    
    if (isEditingSystem && editSystemId) {
      // Update existing record
      updateSystemDetailsMutation.mutate({ id: editSystemId, data: formData });
    } else {
      // Create new record
      createSystemDetailsMutation.mutate(formData);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "assigned": return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300";
      case "open": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCustomerUser(null);
    localStorage.removeItem("customerPortalUser");
    toast({ title: "Logged out successfully" });
  };

  const handleAddComment = () => {
    if (!selectedTask || !customerUser || !commentText.trim()) return;
    
    addCommentMutation.mutate({
      taskId: selectedTask.id,
      customerId: customerUser.id,
      comment: commentText.trim(),
    });
  };





  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              Customer Portal
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Access your service tickets and track progress
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter your password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-700"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <img 
                src="/wizone_logo.png" 
                alt="Wizone" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Task Management Portal
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Welcome, {customerUser?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2">
                <Button
                  onClick={() => setActiveTab("tasks")}
                  variant={activeTab === "tasks" ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Tasks
                </Button>
                <Button
                  onClick={() => setActiveTab("systems")}
                  variant={activeTab === "systems" ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  System Details
                </Button>
                <Button
                  onClick={() => setActiveTab("cctv")}
                  variant={activeTab === "cctv" ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  CCTV Information
                </Button>
              </div>
              
              {activeTab === "tasks" && (
                <Button
                  onClick={() => setShowCreateTask(true)}
                  className="bg-cyan-600 hover:bg-cyan-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Task
                </Button>
              )}
              
              {activeTab === "systems" && (
                <Button
                  onClick={() => setShowSystemDetailsForm(true)}
                  className="bg-cyan-600 hover:bg-cyan-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add System
                </Button>
              )}
              
              {activeTab === "cctv" && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowCctvForm(true)}
                    className="bg-cyan-600 hover:bg-cyan-700 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add CCTV
                  </Button>
                  <Button
                    onClick={() => setShowBulkUpload(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Bulk Upload
                  </Button>
                </div>
              )}
              
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "tasks" && (
          <>
            {/* Task Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {tasks?.length || 0}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Tasks</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {tasks?.filter(t => !t.status || t.status === 'open' || t.status === 'pending').length || 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved by Wizone</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {tasks?.filter(t => t.status === 'approved' || t.status === 'in-progress' || t.status === 'in_progress' || t.status === 'assigned').length || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {tasks?.filter(t => t.status === 'completed').length || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Priority</p>
                  <p className="text-2xl font-bold text-red-600">
                    {tasks?.filter(t => t.priority === 'high' && t.status !== 'completed').length || 0}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List - Table View */}
        <Card>
          <CardHeader>
            <CardTitle>Your Service Tickets</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Track the status of your service requests
            </p>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="text-center py-8">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No service tickets found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <button 
                            onClick={() => {
                              setSelectedTask(task);
                              setShowTaskDetails(true);
                            }}
                            className="text-cyan-600 hover:text-cyan-800 font-medium underline cursor-pointer"
                          >
                            {task.ticketNumber}
                          </button>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="font-medium truncate" title={task.title}>
                            {task.title}
                          </div>
                          <div className="text-xs text-gray-500 truncate" title={task.description}>
                            {task.description?.substring(0, 50)}{task.description?.length > 50 ? '...' : ''}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.assignedUser ? 
                            `${task.assignedUser.firstName} ${task.assignedUser.lastName}` : 
                            <span className="text-gray-400">Unassigned</span>
                          }
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatTimestamp(task.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {task.completionTime ? (
                            <span className="text-green-600">{formatTimestamp(task.completionTime)}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTask(task);
                                setShowTaskDetails(true);
                              }}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Dialog open={isCommentsOpen && selectedTask?.id === task.id} onOpenChange={(open) => {
                              setIsCommentsOpen(open);
                              if (open) setSelectedTask(task);
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-1"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh]">
                                <DialogHeader>
                                  <DialogTitle>Ticket Comments - {task.ticketNumber}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <ScrollArea className="h-64">
                                    <div className="space-y-3">
                                      {comments.filter(c => !c.isInternal).map((comment) => (
                                        <Card key={comment.id} className="p-3">
                                          <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                              {comment.respondedByUser ? (
                                                <Badge variant="outline">
                                                  {comment.respondedByUser.firstName} {comment.respondedByUser.lastName}
                                                </Badge>
                                              ) : (
                                                <Badge variant="secondary">You</Badge>
                                              )}
                                            </div>
                                            <span className="text-xs text-gray-500">
                                              {formatTimestamp(comment.createdAt)}
                                            </span>
                                          </div>
                                          <p className="text-sm">{comment.comment}</p>
                                        </Card>
                                      ))}
                                    </div>
                                  </ScrollArea>
                                  
                                  <Separator />
                                  
                                  <div className="space-y-3">
                                    <Textarea
                                      placeholder="Add your comment or question..."
                                      value={commentText}
                                      onChange={(e) => setCommentText(e.target.value)}
                                      rows={3}
                                    />
                                    <Button
                                      onClick={handleAddComment}
                                      disabled={!commentText.trim() || addCommentMutation.isPending}
                                      className="w-full"
                                    >
                                      {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Task Modal */}
        <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Support Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={createTaskForm.title}
                  onChange={(e) => setCreateTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createTaskForm.description}
                  onChange={(e) => setCreateTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide detailed information about your issue"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={createTaskForm.priority}
                    onValueChange={(value) => setCreateTaskForm(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="issueType">Issue Type</Label>
                  <Select
                    value={createTaskForm.issueType}
                    onValueChange={(value) => setCreateTaskForm(prev => ({ ...prev, issueType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="network">Network Problem</SelectItem>
                      <SelectItem value="hardware">Hardware Issue</SelectItem>
                      <SelectItem value="software">Software Issue</SelectItem>
                      <SelectItem value="security">Security Concern</SelectItem>
                      <SelectItem value="maintenance">Maintenance Request</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateTask(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-700"
                  disabled={createTaskMutation.isPending}
                >
                  {createTaskMutation.isPending ? "Creating..." : "Create Ticket"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Task Details Modal with History and Update */}
        <Dialog open={showTaskDetails} onOpenChange={setShowTaskDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-600" />
                Ticket #{selectedTask?.ticketNumber} - {selectedTask?.title}
              </DialogTitle>
            </DialogHeader>
            
            {selectedTask && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Task Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Task Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">Priority</Label>
                        <Badge className={getPriorityColor(selectedTask.priority)}>
                          {selectedTask.priority}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Status</Label>
                        <Badge className={getStatusColor(selectedTask.status)}>
                          {selectedTask.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-500">Issue Type</Label>
                      <p className="font-medium">{selectedTask.issueType}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-500">Assigned Engineer</Label>
                      <p className="font-medium">
                        {selectedTask.assignedUser ? 
                          `${selectedTask.assignedUser.firstName} ${selectedTask.assignedUser.lastName}` : 
                          "Not assigned yet"
                        }
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-500">Description</Label>
                      <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">
                        {selectedTask.description}
                      </p>
                    </div>
                    
                    {selectedTask.resolution && (
                      <div>
                        <Label className="text-sm text-gray-500">Resolution</Label>
                        <p className="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                          {selectedTask.resolution}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-gray-500">Created</Label>
                        <p>{formatTimestamp(selectedTask.createdAt)}</p>
                      </div>
                      {selectedTask.completionTime && (
                        <div>
                          <Label className="text-gray-500">Completed</Label>
                          <p>{formatTimestamp(selectedTask.completionTime)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Task History */}
                <Card>
                  <CardHeader>
                    <CardTitle>Task History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      {taskHistory.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No history available</p>
                      ) : (
                        <div className="space-y-4">
                          {taskHistory.map((update, index) => (
                            <div key={update.id || index} className={`border-l-4 pl-4 pb-4 ${
                              update.isCustomerUpdate ? 'border-cyan-400 bg-cyan-50' : 'border-green-400 bg-green-50'
                            }`}>
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {update.isCustomerUpdate ? (
                                      <Badge variant="outline" className="bg-cyan-100 text-cyan-800 border-cyan-300">
                                        You
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                        {update.createdByName || 'Admin'}
                                      </Badge>
                                    )}
                                    {update.type && update.type !== 'status_update' && (
                                      <Badge variant="secondary" className="text-xs">
                                        {update.type.replace('_', ' ')}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="font-medium text-sm text-gray-800">{update.message}</p>
                                  {(update.status || update.priority) && (
                                    <div className="flex gap-2 mt-2">
                                      {update.status && (
                                        <Badge className={getStatusColor(update.status)}>
                                          Status: {update.status.replace("_", " ")}
                                        </Badge>
                                      )}
                                      {update.priority && (
                                        <Badge className={getPriorityColor(update.priority)}>
                                          Priority: {update.priority}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  <p className="text-xs text-gray-500 mt-2">
                                    {formatTimestamp(update.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Customer Update Section */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Update This Ticket
                  <Button
                    size="sm"
                    onClick={() => setShowUpdateTask(!showUpdateTask)}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    {showUpdateTask ? "Cancel" : "Add Update"}
                  </Button>
                </CardTitle>
              </CardHeader>
              
              {showUpdateTask && (
                <CardContent>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    updateTaskMutation.mutate(updateTaskForm);
                  }} className="space-y-4">
                    <div>
                      <Label htmlFor="comment">Your Comment</Label>
                      <Textarea
                        id="comment"
                        placeholder="Add your comment or update..."
                        value={updateTaskForm.comment}
                        onChange={(e) => setUpdateTaskForm(prev => ({ ...prev, comment: e.target.value }))}
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="priority">Change Priority</Label>
                        <Select
                          value={updateTaskForm.priority}
                          onValueChange={(value) => setUpdateTaskForm(prev => ({ ...prev, priority: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Keep current priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="status">Update Status</Label>
                        <Select
                          value={updateTaskForm.status}
                          onValueChange={(value) => setUpdateTaskForm(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Keep current status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="cancelled">Cancel Request</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowUpdateTask(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-cyan-600 hover:bg-cyan-700"
                        disabled={updateTaskMutation.isPending}
                      >
                        {updateTaskMutation.isPending ? "Updating..." : "Submit Update"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              )}
            </Card>
          </DialogContent>
        </Dialog>
          </>
        )}

        {activeTab === "systems" && (
          <>
            {/* Department Filter */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium whitespace-nowrap">Filter by Department:</Label>
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm min-w-[200px]"
                    >
                      <option value="all">All Departments</option>
                      {(() => {
                        // Get unique departments from system details
                        const departments = new Set<string>();
                        systemDetails?.forEach((system: SystemDetail) => {
                          const dept = getField(system, 'department', 'department');
                          if (dept) departments.add(dept);
                        });
                        return Array.from(departments).sort().map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ));
                      })()}
                    </select>
                  </div>
                  {departmentFilter !== "all" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDepartmentFilter("all")}
                    >
                      Clear Filter
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Details Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Systems</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {(() => {
                          if (departmentFilter === "all") return systemDetails?.length || 0;
                          return systemDetails?.filter((s: SystemDetail) => 
                            getField(s, 'department', 'department') === departmentFilter
                          ).length || 0;
                        })()}
                      </p>
                    </div>
                    <Settings className="h-8 w-8 text-cyan-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Desktops</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {(() => {
                          let filtered = systemDetails || [];
                          if (departmentFilter !== "all") {
                            filtered = filtered.filter((s: SystemDetail) => 
                              getField(s, 'department', 'department') === departmentFilter
                            );
                          }
                          return filtered.filter((s: SystemDetail) => 
                            getField(s, 'system_type', 'systemType')?.toLowerCase() === 'desktop'
                          ).length;
                        })()}
                      </p>
                    </div>
                    <Monitor className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Laptops</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {(() => {
                          let filtered = systemDetails || [];
                          if (departmentFilter !== "all") {
                            filtered = filtered.filter((s: SystemDetail) => 
                              getField(s, 'department', 'department') === departmentFilter
                            );
                          }
                          return filtered.filter((s: SystemDetail) => 
                            getField(s, 'system_type', 'systemType')?.toLowerCase() === 'laptop'
                          ).length;
                        })()}
                      </p>
                    </div>
                    <Cpu className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {departmentFilter === "all" ? "Departments" : "Employees"}
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {(() => {
                          if (departmentFilter === "all") {
                            // Count unique departments
                            const departments = new Set<string>();
                            systemDetails?.forEach((s: SystemDetail) => {
                              const dept = getField(s, 'department', 'department');
                              if (dept) departments.add(dept);
                            });
                            return departments.size;
                          } else {
                            // Count unique employees in selected department
                            const employees = new Set<string>();
                            systemDetails?.filter((s: SystemDetail) => 
                              getField(s, 'department', 'department') === departmentFilter
                            ).forEach((s: SystemDetail) => {
                              const emp = getField(s, 'emp_name', 'empName') || getField(s, 'emp_id', 'empId');
                              if (emp) employees.add(emp);
                            });
                            return employees.size;
                          }
                        })()}
                      </p>
                    </div>
                    <User className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Details List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Details
                  {departmentFilter !== "all" && (
                    <Badge variant="secondary" className="ml-2">{departmentFilter}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {systemDetailsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading system details...</p>
                  </div>
                ) : systemDetails?.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No system details found</p>
                    <p className="text-sm text-gray-500">Click "Add System" to create your first system record</p>
                  </div>
                ) : (departmentFilter !== "all" && systemDetails?.filter((s: SystemDetail) => getField(s, 'department', 'department') === departmentFilter).length === 0) ? (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No systems found for department: <strong>{departmentFilter}</strong></p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setDepartmentFilter("all")}
                    >
                      Clear Filter
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee ID</TableHead>
                          <TableHead>Employee Name</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>System Name</TableHead>
                          <TableHead>System Type</TableHead>
                          <TableHead>Processor</TableHead>
                          <TableHead>RAM</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(departmentFilter === "all" 
                          ? systemDetails 
                          : systemDetails?.filter((s: SystemDetail) => getField(s, 'department', 'department') === departmentFilter)
                        )?.map((system: SystemDetail) => (
                          <TableRow key={system.id}>
                            <TableCell className="font-medium">{getField(system, 'emp_id', 'empId') || '-'}</TableCell>
                            <TableCell>{getField(system, 'emp_name', 'empName') || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{getField(system, 'department', 'department') || '-'}</Badge>
                            </TableCell>
                            <TableCell>{getField(system, 'system_name', 'systemName') || '-'}</TableCell>
                            <TableCell>{getField(system, 'system_type', 'systemType') || '-'}</TableCell>
                            <TableCell>{getField(system, 'processor', 'processor') || getField(system, 'processor_name', 'processorName') || '-'}</TableCell>
                            <TableCell>{getField(system, 'ram', 'ram') || '-'}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-1"
                                  onClick={() => {
                                    setSelectedSystemDetail(system);
                                    setShowSystemDetailView(true);
                                  }}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
                                  onClick={() => {
                                    // Populate form with system data for editing
                                    setSystemDetailsForm({
                                      empId: getField(system, 'emp_id', 'empId') || "",
                                      empName: getField(system, 'emp_name', 'empName') || "",
                                      systemName: getField(system, 'system_name', 'systemName') || "",
                                      systemType: getField(system, 'system_type', 'systemType') || "Desktop",
                                      department: getField(system, 'department', 'department') || "",
                                      processor: getField(system, 'processor', 'processor') || getField(system, 'processor_name', 'processorName') || "",
                                      processorCores: getField(system, 'processor_cores', 'processorCores') || "",
                                      processorSpeed: getField(system, 'processor_speed', 'processorSpeed') || "",
                                      ram: getField(system, 'ram', 'ram') || "",
                                      ramType: getField(system, 'ram_type', 'ramType') || "",
                                      ramFrequency: getField(system, 'ram_frequency', 'ramFrequency') || "",
                                      ramSlots: getField(system, 'ram_slots', 'ramSlots') || "",
                                      motherboard: getField(system, 'motherboard', 'motherboard') || "",
                                      motherboardManufacturer: getField(system, 'motherboard_manufacturer', 'motherboardManufacturer') || "",
                                      hardDisk: getField(system, 'hard_disk', 'hardDisk') || "",
                                      hddCapacity: getField(system, 'hdd_capacity', 'hddCapacity') || "",
                                      ssd: getField(system, 'ssd', 'ssd') || "",
                                      ssdCapacity: getField(system, 'ssd_capacity', 'ssdCapacity') || "",
                                      graphicsCard: getField(system, 'graphics_card', 'graphicsCard') || "",
                                      graphicsMemory: getField(system, 'graphics_memory', 'graphicsMemory') || "",
                                      operatingSystem: getField(system, 'operating_system', 'operatingSystem') || "",
                                      osVersion: getField(system, 'os_version', 'osVersion') || "",
                                      osArchitecture: getField(system, 'os_architecture', 'osArchitecture') || "",
                                      macAddress: getField(system, 'mac_address', 'macAddress') || "",
                                      ipAddress: getField(system, 'ip_address', 'ipAddress') || "",
                                      ethernetSpeed: getField(system, 'ethernet_speed', 'ethernetSpeed') || "",
                                      serialNumber: getField(system, 'serial_number', 'serialNumber') || "",
                                      biosVersion: getField(system, 'bios_version', 'biosVersion') || "",
                                      antivirus: getField(system, 'antivirus', 'antivirus') || "",
                                      msOffice: getField(system, 'ms_office', 'msOffice') || "",
                                      otherSoftware: getField(system, 'other_software', 'otherSoftware') || ""
                                    });
                                    setEditSystemId(system.id);
                                    setIsEditingSystem(true);
                                    setShowSystemDetailsForm(true);
                                  }}
                                  title="Edit System"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* System Details Form Dialog */}
        <Dialog open={showSystemDetailsForm} onOpenChange={(open) => {
          setShowSystemDetailsForm(open);
          if (!open) {
            setIsEditingSystem(false);
            setEditSystemId(null);
            setCustomDepartment("");
            setSystemDetailsForm({
              empId: "",
              empName: "",
              systemName: "",
              systemType: "Desktop",
              department: "",
              processor: "",
              processorCores: "",
              processorSpeed: "",
              ram: "",
              ramType: "",
              ramFrequency: "",
              ramSlots: "",
              motherboard: "",
              motherboardManufacturer: "",
              hardDisk: "",
              hddCapacity: "",
              ssd: "",
              ssdCapacity: "",
              graphicsCard: "",
              graphicsMemory: "",
              operatingSystem: "",
              osVersion: "",
              osArchitecture: "",
              macAddress: "",
              ipAddress: "",
              ethernetSpeed: "",
              serialNumber: "",
              biosVersion: "",
              antivirus: "",
              msOffice: "",
              otherSoftware: ""
            });
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {isEditingSystem ? <Edit className="h-5 w-5 text-blue-600" /> : <Settings className="h-5 w-5" />}
                {isEditingSystem ? "Edit System Details" : "Add System Details"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSystemDetails} className="space-y-6">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="empName">Employee Name</Label>
                    <select
                      id="empName"
                      value={systemDetailsForm.empName}
                      onChange={(e) => {
                        const selectedUser = allUsers.find((u: any) => 
                          `${u.firstName || ''} ${u.lastName || ''}`.trim() === e.target.value ||
                          u.username === e.target.value
                        );
                        setSystemDetailsForm({
                          ...systemDetailsForm, 
                          empName: e.target.value,
                          empId: selectedUser ? String(selectedUser.id) : ''
                        });
                      }}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="">Select Employee</option>
                      {allUsers.map((user: any) => {
                        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
                        return (
                          <option key={user.id} value={fullName}>
                            {fullName} ({user.username})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="empId">Employee ID</Label>
                    <Input
                      id="empId"
                      value={systemDetailsForm.empId}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, empId: e.target.value})}
                      placeholder="Auto-filled from selection"
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <select
                      id="department"
                      value={systemDetailsForm.department}
                      onChange={(e) => {
                        setSystemDetailsForm({...systemDetailsForm, department: e.target.value});
                        if (e.target.value !== "OTHER") {
                          setCustomDepartment("");
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="">Select Department</option>
                      <option value="ACCOUNTS">ACCOUNTS</option>
                      <option value="HLL">HLL</option>
                      <option value="AD LAB">AD LAB</option>
                      <option value="PRODUCTION">PRODUCTION</option>
                      <option value="MD OFFICE">MD OFFICE</option>
                      <option value="GUARD ROOM">GUARD ROOM</option>
                      <option value="CANDY">CANDY</option>
                      <option value="QC">QC</option>
                      <option value="QA">QA</option>
                      <option value="FOOD LAB">FOOD LAB</option>
                      <option value="COSMETIC">COSMETIC</option>
                      <option value="STORE">STORE</option>
                      <option value="RM STORE">RM STORE</option>
                      <option value="IT">IT</option>
                      <option value="HR">HR</option>
                      <option value="OTHER">OTHER (Custom)</option>
                    </select>
                  </div>
                  {systemDetailsForm.department === "OTHER" && (
                    <div>
                      <Label htmlFor="customDepartment">Custom Department Name</Label>
                      <Input
                        id="customDepartment"
                        value={customDepartment}
                        onChange={(e) => setCustomDepartment(e.target.value)}
                        placeholder="Enter department name"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="systemName">System Name *</Label>
                    <Input
                      id="systemName"
                      value={systemDetailsForm.systemName}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, systemName: e.target.value})}
                      placeholder="e.g., WIN-PC001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="systemType">System Type</Label>
                    <select
                      id="systemType"
                      value={systemDetailsForm.systemType}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, systemType: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="Desktop">Desktop</option>
                      <option value="Laptop">Laptop</option>
                      <option value="Workstation">Workstation</option>
                      <option value="Server">Server</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      value={systemDetailsForm.serialNumber}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, serialNumber: e.target.value})}
                      placeholder="e.g., SN123456789"
                    />
                  </div>
                </div>
              </div>

              {/* Processor Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Processor Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="processor">Processor</Label>
                    <Input
                      id="processor"
                      value={systemDetailsForm.processor}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, processor: e.target.value})}
                      placeholder="e.g., Intel Core i7-8700K"
                    />
                  </div>
                  <div>
                    <Label htmlFor="processorCores">Cores</Label>
                    <Input
                      id="processorCores"
                      value={systemDetailsForm.processorCores}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, processorCores: e.target.value})}
                      placeholder="e.g., 6 Cores 12 Threads"
                    />
                  </div>
                  <div>
                    <Label htmlFor="processorSpeed">Speed</Label>
                    <Input
                      id="processorSpeed"
                      value={systemDetailsForm.processorSpeed}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, processorSpeed: e.target.value})}
                      placeholder="e.g., 3.70 GHz"
                    />
                  </div>
                </div>
              </div>

              {/* Memory Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Memory (RAM)</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="ram">Total RAM</Label>
                    <Input
                      id="ram"
                      value={systemDetailsForm.ram}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, ram: e.target.value})}
                      placeholder="e.g., 16 GB"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ramType">RAM Type</Label>
                    <select
                      id="ramType"
                      value={systemDetailsForm.ramType}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, ramType: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="">Select Type</option>
                      <option value="DDR3">DDR3</option>
                      <option value="DDR4">DDR4</option>
                      <option value="DDR5">DDR5</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="ramFrequency">Frequency</Label>
                    <Input
                      id="ramFrequency"
                      value={systemDetailsForm.ramFrequency}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, ramFrequency: e.target.value})}
                      placeholder="e.g., 3200 MHz"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ramSlots">Slots (Used/Total)</Label>
                    <Input
                      id="ramSlots"
                      value={systemDetailsForm.ramSlots}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, ramSlots: e.target.value})}
                      placeholder="e.g., 2/4"
                    />
                  </div>
                </div>
              </div>

              {/* Motherboard Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Motherboard</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="motherboard">Motherboard Model</Label>
                    <Input
                      id="motherboard"
                      value={systemDetailsForm.motherboard}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, motherboard: e.target.value})}
                      placeholder="e.g., ASUS ROG STRIX B450-F"
                    />
                  </div>
                  <div>
                    <Label htmlFor="motherboardManufacturer">Manufacturer</Label>
                    <Input
                      id="motherboardManufacturer"
                      value={systemDetailsForm.motherboardManufacturer}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, motherboardManufacturer: e.target.value})}
                      placeholder="e.g., ASUS"
                    />
                  </div>
                </div>
              </div>

              {/* Storage Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Storage</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="hardDisk">Hard Disk Model</Label>
                    <Input
                      id="hardDisk"
                      value={systemDetailsForm.hardDisk}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, hardDisk: e.target.value})}
                      placeholder="e.g., Seagate Barracuda"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hddCapacity">HDD Capacity</Label>
                    <Input
                      id="hddCapacity"
                      value={systemDetailsForm.hddCapacity}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, hddCapacity: e.target.value})}
                      placeholder="e.g., 1 TB"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ssd">SSD Model</Label>
                    <Input
                      id="ssd"
                      value={systemDetailsForm.ssd}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, ssd: e.target.value})}
                      placeholder="e.g., Samsung 970 EVO"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ssdCapacity">SSD Capacity</Label>
                    <Input
                      id="ssdCapacity"
                      value={systemDetailsForm.ssdCapacity}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, ssdCapacity: e.target.value})}
                      placeholder="e.g., 256 GB"
                    />
                  </div>
                </div>
              </div>

              {/* Graphics Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Graphics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="graphicsCard">Graphics Card</Label>
                    <Input
                      id="graphicsCard"
                      value={systemDetailsForm.graphicsCard}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, graphicsCard: e.target.value})}
                      placeholder="e.g., NVIDIA GeForce GTX 1660"
                    />
                  </div>
                  <div>
                    <Label htmlFor="graphicsMemory">Graphics Memory</Label>
                    <Input
                      id="graphicsMemory"
                      value={systemDetailsForm.graphicsMemory}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, graphicsMemory: e.target.value})}
                      placeholder="e.g., 6 GB GDDR6"
                    />
                  </div>
                </div>
              </div>

              {/* Operating System Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Operating System</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="operatingSystem">OS Name</Label>
                    <Input
                      id="operatingSystem"
                      value={systemDetailsForm.operatingSystem}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, operatingSystem: e.target.value})}
                      placeholder="e.g., Windows 10 Pro"
                    />
                  </div>
                  <div>
                    <Label htmlFor="osVersion">OS Version/Build</Label>
                    <Input
                      id="osVersion"
                      value={systemDetailsForm.osVersion}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, osVersion: e.target.value})}
                      placeholder="e.g., 22H2 (Build 19045)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="osArchitecture">Architecture</Label>
                    <select
                      id="osArchitecture"
                      value={systemDetailsForm.osArchitecture}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, osArchitecture: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="">Select</option>
                      <option value="64-bit">64-bit</option>
                      <option value="32-bit">32-bit</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Network Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Network</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="macAddress">MAC Address</Label>
                    <Input
                      id="macAddress"
                      value={systemDetailsForm.macAddress}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, macAddress: e.target.value})}
                      placeholder="e.g., 00:1A:2B:3C:4D:5E"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ipAddress">IP Address</Label>
                    <Input
                      id="ipAddress"
                      value={systemDetailsForm.ipAddress}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, ipAddress: e.target.value})}
                      placeholder="e.g., 192.168.1.100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ethernetSpeed">Ethernet Speed</Label>
                    <Input
                      id="ethernetSpeed"
                      value={systemDetailsForm.ethernetSpeed}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, ethernetSpeed: e.target.value})}
                      placeholder="e.g., 1 Gbps"
                    />
                  </div>
                </div>
              </div>

              {/* BIOS Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">BIOS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="biosVersion">BIOS Version</Label>
                    <Input
                      id="biosVersion"
                      value={systemDetailsForm.biosVersion}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, biosVersion: e.target.value})}
                      placeholder="e.g., American Megatrends v2.17"
                    />
                  </div>
                </div>
              </div>

              {/* Software Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Software</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="antivirus">Antivirus</Label>
                    <Input
                      id="antivirus"
                      value={systemDetailsForm.antivirus}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, antivirus: e.target.value})}
                      placeholder="e.g., Windows Defender"
                    />
                  </div>
                  <div>
                    <Label htmlFor="msOffice">MS Office</Label>
                    <Input
                      id="msOffice"
                      value={systemDetailsForm.msOffice}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, msOffice: e.target.value})}
                      placeholder="e.g., Microsoft Office 2021"
                    />
                  </div>
                  <div>
                    <Label htmlFor="otherSoftware">Other Software</Label>
                    <Input
                      id="otherSoftware"
                      value={systemDetailsForm.otherSoftware}
                      onChange={(e) => setSystemDetailsForm({...systemDetailsForm, otherSoftware: e.target.value})}
                      placeholder="e.g., Tally, AutoCAD"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowSystemDetailsForm(false);
                    setIsEditingSystem(false);
                    setEditSystemId(null);
                    setCustomDepartment("");
                    setSystemDetailsForm({
                      empId: "",
                      empName: "",
                      systemName: "",
                      systemType: "Desktop",
                      department: "",
                      processor: "",
                      processorCores: "",
                      processorSpeed: "",
                      ram: "",
                      ramType: "",
                      ramFrequency: "",
                      ramSlots: "",
                      motherboard: "",
                      motherboardManufacturer: "",
                      hardDisk: "",
                      hddCapacity: "",
                      ssd: "",
                      ssdCapacity: "",
                      graphicsCard: "",
                      graphicsMemory: "",
                      operatingSystem: "",
                      osVersion: "",
                      osArchitecture: "",
                      macAddress: "",
                      ipAddress: "",
                      ethernetSpeed: "",
                      serialNumber: "",
                      biosVersion: "",
                      antivirus: "",
                      msOffice: "",
                      otherSoftware: ""
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className={isEditingSystem ? "bg-blue-600 hover:bg-blue-700" : "bg-cyan-600 hover:bg-cyan-700"}
                  disabled={isEditingSystem ? updateSystemDetailsMutation.isPending : createSystemDetailsMutation.isPending}
                >
                  {isEditingSystem 
                    ? (updateSystemDetailsMutation.isPending ? "Updating..." : "Update System")
                    : (createSystemDetailsMutation.isPending ? "Adding..." : "Add System")
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* System Details View Modal */}
        <Dialog open={showSystemDetailView} onOpenChange={setShowSystemDetailView}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-cyan-600" />
                Complete System Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedSystemDetail && (
              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Employee ID</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'emp_id', 'empId') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Employee Name</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'emp_name', 'empName') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Department</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'department', 'department') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">System Name</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'system_name', 'systemName') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">System Type</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'system_type', 'systemType') || getField(selectedSystemDetail, 'system_configuration', 'systemConfiguration') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Serial Number</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'serial_number', 'serialNumber') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Collection Date</Label>
                        <p className="font-medium">{(() => {
                          const collectedAt = getField(selectedSystemDetail, 'collected_at', 'collectedAt');
                          const createdAt = getField(selectedSystemDetail, 'created_at', 'createdAt');
                          const dateStr = collectedAt || createdAt;
                          if (!dateStr) return '-';
                          try {
                            return formatTimestamp(dateStr);
                          } catch {
                            return '-';
                          }
                        })()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Processor Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      Processor & Memory
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Processor</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'processor', 'processor') || getField(selectedSystemDetail, 'processor_name', 'processorName') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Cores</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'processor_cores', 'processorCores') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Speed</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'processor_speed', 'processorSpeed') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">RAM</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'ram', 'ram') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">RAM Type</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'ram_type', 'ramType') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">RAM Frequency</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'ram_frequency', 'ramFrequency') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">RAM Slots</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'ram_slots', 'ramSlots') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Motherboard</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'motherboard', 'motherboard') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Motherboard Manufacturer</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'motherboard_manufacturer', 'motherboardManufacturer') || '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Storage Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      Storage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Hard Disk</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'hard_disk', 'hardDisk') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">HDD Capacity</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'hdd_capacity', 'hddCapacity') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">SSD</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'ssd', 'ssd') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">SSD Capacity</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'ssd_capacity', 'ssdCapacity') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Graphics Card</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'graphics_card', 'graphicsCard') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Graphics Memory</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'graphics_memory', 'graphicsMemory') || '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Operating System & Network */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      Operating System & Network
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Operating System</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'operating_system', 'operatingSystem') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">OS Version</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'os_version', 'osVersion') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Architecture</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'os_architecture', 'osArchitecture') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">MAC Address</Label>
                        <p className="font-medium font-mono text-sm">{getField(selectedSystemDetail, 'mac_address', 'macAddress') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">IP Address</Label>
                        <p className="font-medium font-mono text-sm">{getField(selectedSystemDetail, 'ip_address', 'ipAddress') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Ethernet Speed</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'ethernet_speed', 'ethernetSpeed') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">BIOS Version</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'bios_version', 'biosVersion') || '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security & Software */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Security & Software
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Antivirus</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'antivirus', 'antivirus') || (getField(selectedSystemDetail, 'antivirus_available', 'antivirusAvailable') ? 'Available' : '-')}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">MS Office</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'ms_office', 'msOffice') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Other Software</Label>
                        <p className="font-medium">{getField(selectedSystemDetail, 'other_software', 'otherSoftware') || '-'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getField(selectedSystemDetail, 'sharing_status', 'sharingStatus') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm">File Sharing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getField(selectedSystemDetail, 'administrator_account', 'administratorAccount') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm">Admin Account</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getField(selectedSystemDetail, 'antivirus_available', 'antivirusAvailable') || getField(selectedSystemDetail, 'antivirus', 'antivirus') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm">Antivirus</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getField(selectedSystemDetail, 'ups_available', 'upsAvailable') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm">UPS</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Footer */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowSystemDetailView(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* CCTV Tab Content */}
        {activeTab === "cctv" && (
          <>
            {/* CCTV Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cameras</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {cctvData?.length || 0}
                      </p>
                    </div>
                    <Camera className="h-8 w-8 text-cyan-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">NVR/DVR Count</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {(() => {
                          const nvrSet = new Set<string>();
                          cctvData?.forEach((c: CctvInfo) => {
                            if (c.addedIn) nvrSet.add(c.addedIn);
                          });
                          return nvrSet.size;
                        })()}
                      </p>
                    </div>
                    <Monitor className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Locations</p>
                      <p className="text-2xl font-bold text-green-600">
                        {(() => {
                          const locSet = new Set<string>();
                          cctvData?.forEach((c: CctvInfo) => {
                            if (c.locationName) locSet.add(c.locationName);
                          });
                          return locSet.size;
                        })()}
                      </p>
                    </div>
                    <Wifi className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CCTV Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-cyan-600" />
                  CCTV Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* CCTV Filters */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 p-3 bg-gray-50 rounded-lg border">
                  <div>
                    <Label className="text-xs text-gray-500">Camera IP</Label>
                    <Input
                      placeholder="Filter by IP..."
                      value={cctvFilterCameraIp}
                      onChange={(e) => setCctvFilterCameraIp(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Added In (NVR/DVR)</Label>
                    <Select value={cctvFilterAddedIn} onValueChange={setCctvFilterAddedIn}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {Array.from(new Set((cctvData || []).map((c: CctvInfo) => c.addedIn).filter(Boolean))).map((nvr: any) => (
                          <SelectItem key={nvr} value={nvr}>{nvr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Model No.</Label>
                    <Select value={cctvFilterModelNo} onValueChange={setCctvFilterModelNo}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {Array.from(new Set((cctvData || []).map((c: CctvInfo) => c.modelNo).filter(Boolean))).map((model: any) => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Uplink</Label>
                    <Input
                      placeholder="Filter by Uplink..."
                      value={cctvFilterUplink}
                      onChange={(e) => setCctvFilterUplink(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Serial No.</Label>
                    <Input
                      placeholder="Filter by Serial..."
                      value={cctvFilterSerialNo}
                      onChange={(e) => setCctvFilterSerialNo(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                
                {cctvLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                  </div>
                ) : cctvData?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Camera className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No CCTV information available</p>
                    <p className="text-sm mt-2">Add CCTV records using the buttons above</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>S.NO.</TableHead>
                          <TableHead>Camera IP</TableHead>
                          <TableHead>Added In</TableHead>
                          <TableHead>Port</TableHead>
                          <TableHead>HTTP Port</TableHead>
                          <TableHead>Model No.</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Uplink</TableHead>
                          <TableHead>Serial No.</TableHead>
                          <TableHead>MAC Address</TableHead>
                          <TableHead>Photo</TableHead>
                          <TableHead>Updated By</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cctvData
                          ?.filter((cctv: CctvInfo) => {
                            // Apply filters
                            if (cctvFilterCameraIp && !cctv.cameraIp?.toLowerCase().includes(cctvFilterCameraIp.toLowerCase())) return false;
                            if (cctvFilterAddedIn && cctvFilterAddedIn !== "all" && cctv.addedIn !== cctvFilterAddedIn) return false;
                            if (cctvFilterModelNo && cctvFilterModelNo !== "all" && cctv.modelNo !== cctvFilterModelNo) return false;
                            if (cctvFilterUplink && !cctv.uplink?.toLowerCase().includes(cctvFilterUplink.toLowerCase())) return false;
                            if (cctvFilterSerialNo && !cctv.deviceSerialNo?.toLowerCase().includes(cctvFilterSerialNo.toLowerCase())) return false;
                            return true;
                          })
                          .map((cctv: CctvInfo, index: number) => (
                          <TableRow key={cctv.id}>
                            <TableCell>{cctv.serialNumber || index + 1}</TableCell>
                            <TableCell>
                              <button
                                className="font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                onClick={() => {
                                  setSelectedCctv(cctv);
                                  setShowCctvView(true);
                                }}
                              >
                                {cctv.cameraIp || '-'}
                              </button>
                            </TableCell>
                            <TableCell>{cctv.addedIn || '-'}</TableCell>
                            <TableCell>{cctv.port || '-'}</TableCell>
                            <TableCell>{cctv.httpPort || '-'}</TableCell>
                            <TableCell>{cctv.modelNo || '-'}</TableCell>
                            <TableCell>{cctv.locationName || '-'}</TableCell>
                            <TableCell>{cctv.uplink || '-'}</TableCell>
                            <TableCell>{cctv.deviceSerialNo || '-'}</TableCell>
                            <TableCell className="font-mono text-xs">{cctv.macAddress || '-'}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {cctv.rackPhoto && (
                                  <button
                                    className="cursor-pointer hover:opacity-75 transition-opacity"
                                    onClick={() => {
                                      setPreviewImageUrl(cctv.rackPhoto!);
                                      setShowImagePreview(true);
                                    }}
                                    title="Rack Photo"
                                  >
                                    <img 
                                      src={cctv.rackPhoto} 
                                      alt="Rack" 
                                      className="w-8 h-8 object-cover rounded border border-gray-300"
                                    />
                                  </button>
                                )}
                                {cctv.nvrCameraPhoto && (
                                  <button
                                    className="cursor-pointer hover:opacity-75 transition-opacity"
                                    onClick={() => {
                                      setPreviewImageUrl(cctv.nvrCameraPhoto!);
                                      setShowImagePreview(true);
                                    }}
                                    title="NVR/Camera Photo"
                                  >
                                    <img 
                                      src={cctv.nvrCameraPhoto} 
                                      alt="NVR" 
                                      className="w-8 h-8 object-cover rounded border border-gray-300"
                                    />
                                  </button>
                                )}
                                {!cctv.rackPhoto && !cctv.nvrCameraPhoto && (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs text-gray-500">
                                {cctv.updatedByName || '-'}
                                {cctv.updatedAt && (
                                  <div className="text-xs text-gray-400">
                                    {format(new Date(cctv.updatedAt), 'dd/MM/yyyy HH:mm')}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCctv(cctv);
                                    setShowCctvView(true);
                                  }}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-500 hover:text-blue-700"
                                  onClick={() => {
                                    // Populate form with CCTV data for editing
                                    setCctvForm({
                                      serialNumber: cctv.serialNumber || "",
                                      cameraIp: cctv.cameraIp || "",
                                      addedIn: cctv.addedIn || "",
                                      port: cctv.port || "",
                                      httpPort: cctv.httpPort || "",
                                      modelNo: cctv.modelNo || "",
                                      locationName: cctv.locationName || "",
                                      uplink: cctv.uplink || "",
                                      rackPhoto: cctv.rackPhoto || "",
                                      nvrCameraPhoto: cctv.nvrCameraPhoto || "",
                                      deviceSerialNo: cctv.deviceSerialNo || "",
                                      macAddress: cctv.macAddress || "",
                                    });
                                    setEditCctvId(cctv.id);
                                    setIsEditingCctv(true);
                                    setShowCctvForm(true);
                                  }}
                                  title="Edit CCTV"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this CCTV record?')) {
                                      deleteCctvMutation.mutate(cctv.id);
                                    }
                                  }}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Image Preview Modal */}
                <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Image Preview</DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center items-center p-4">
                      <img 
                        src={previewImageUrl} 
                        alt="Preview" 
                        className="max-w-full max-h-[70vh] object-contain rounded-lg"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowImagePreview(false)}>Close</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Add/Edit CCTV Modal */}
            <Dialog open={showCctvForm} onOpenChange={(open) => {
              setShowCctvForm(open);
              if (!open) {
                setIsEditingCctv(false);
                setEditCctvId(null);
                setCctvForm({
                  serialNumber: "",
                  cameraIp: "",
                  addedIn: "",
                  port: "",
                  httpPort: "",
                  modelNo: "",
                  locationName: "",
                  uplink: "",
                  rackPhoto: "",
                  nvrCameraPhoto: "",
                  deviceSerialNo: "",
                  macAddress: "",
                });
              }
            }}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {isEditingCctv ? <Edit className="h-5 w-5 text-blue-600" /> : <Camera className="h-5 w-5 text-cyan-600" />}
                    {isEditingCctv ? "Edit CCTV Information" : "Add CCTV Information"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (isEditingCctv && editCctvId) {
                    // Update existing record
                    updateCctvMutation.mutate({ id: editCctvId, data: cctvForm });
                  } else {
                    // Auto-generate serial number based on existing records
                    const nextSerialNumber = String(cctvData.length + 1);
                    createCctvMutation.mutate({...cctvForm, serialNumber: nextSerialNumber});
                  }
                }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="serialNumber">S.NO. {isEditingCctv ? "" : "(Auto Generated)"}</Label>
                      <Input
                        id="serialNumber"
                        value={isEditingCctv ? cctvForm.serialNumber : String(cctvData.length + 1)}
                        onChange={(e) => isEditingCctv && setCctvForm({...cctvForm, serialNumber: e.target.value})}
                        readOnly={!isEditingCctv}
                        disabled={!isEditingCctv}
                        className={isEditingCctv ? "" : "bg-gray-100"}
                        placeholder={isEditingCctv ? "Serial Number" : "Auto-generated"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cameraIp">Camera IP</Label>
                      <Input
                        id="cameraIp"
                        value={cctvForm.cameraIp}
                        onChange={(e) => setCctvForm({...cctvForm, cameraIp: e.target.value})}
                        placeholder="e.g., 192.168.1.100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="addedIn">Added In (NVR/DVR)</Label>
                      <Input
                        id="addedIn"
                        value={cctvForm.addedIn}
                        onChange={(e) => setCctvForm({...cctvForm, addedIn: e.target.value})}
                        placeholder="e.g., NVR1, DVR2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="port">Port</Label>
                      <Input
                        id="port"
                        value={cctvForm.port}
                        onChange={(e) => setCctvForm({...cctvForm, port: e.target.value})}
                        placeholder="e.g., 554"
                      />
                    </div>
                    <div>
                      <Label htmlFor="httpPort">HTTP Port</Label>
                      <Input
                        id="httpPort"
                        value={cctvForm.httpPort}
                        onChange={(e) => setCctvForm({...cctvForm, httpPort: e.target.value})}
                        placeholder="e.g., 80"
                      />
                    </div>
                    <div>
                      <Label htmlFor="modelNo">Model No.</Label>
                      <Input
                        id="modelNo"
                        value={cctvForm.modelNo}
                        onChange={(e) => setCctvForm({...cctvForm, modelNo: e.target.value})}
                        placeholder="e.g., DS-2CD2043G0-I"
                      />
                    </div>
                    <div>
                      <Label htmlFor="locationName">Location Name</Label>
                      <Input
                        id="locationName"
                        value={cctvForm.locationName}
                        onChange={(e) => setCctvForm({...cctvForm, locationName: e.target.value})}
                        placeholder="e.g., Main Entrance"
                      />
                    </div>
                    <div>
                      <Label htmlFor="uplink">Uplink</Label>
                      <Input
                        id="uplink"
                        value={cctvForm.uplink}
                        onChange={(e) => setCctvForm({...cctvForm, uplink: e.target.value})}
                        placeholder="e.g., Switch Port 1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deviceSerialNo">Device Serial No.</Label>
                      <Input
                        id="deviceSerialNo"
                        value={cctvForm.deviceSerialNo}
                        onChange={(e) => setCctvForm({...cctvForm, deviceSerialNo: e.target.value})}
                        placeholder="e.g., SN123456789"
                      />
                    </div>
                    <div>
                      <Label htmlFor="macAddress">MAC Address</Label>
                      <Input
                        id="macAddress"
                        value={cctvForm.macAddress}
                        onChange={(e) => setCctvForm({...cctvForm, macAddress: e.target.value})}
                        placeholder="e.g., 00:1A:2B:3C:4D:5E"
                      />
                    </div>
                    
                    {/* Rack Photo Upload */}
                    <div className="md:col-span-2">
                      <Label htmlFor="rackPhotoUpload">Rack Photo</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="rackPhotoUpload"
                          type="file"
                          accept="image/*"
                          className="flex-1"
                          disabled={isUploadingRackPhoto}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                setIsUploadingRackPhoto(true);
                                setRackPhotoUploadProgress(0);
                                const imageUrl = await uploadImage(file, (progress) => {
                                  setRackPhotoUploadProgress(progress);
                                });
                                setCctvForm({...cctvForm, rackPhoto: imageUrl});
                                toast({ title: "Rack photo uploaded successfully!" });
                              } catch (error) {
                                toast({ title: "Failed to upload rack photo", variant: "destructive" });
                              } finally {
                                setIsUploadingRackPhoto(false);
                                setRackPhotoUploadProgress(0);
                              }
                            }
                          }}
                        />
                        {cctvForm.rackPhoto && (
                          <img src={cctvForm.rackPhoto} alt="Rack" className="h-12 w-12 object-cover rounded border" />
                        )}
                      </div>
                      {/* Upload Progress Bar */}
                      {isUploadingRackPhoto && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-600 border-t-transparent"></div>
                            <span className="text-sm text-cyan-600 font-medium">Uploading... {rackPhotoUploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${rackPhotoUploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      {cctvForm.rackPhoto && !isUploadingRackPhoto && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <span className="inline-block w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
                          Image uploaded successfully
                        </p>
                      )}
                    </div>
                    
                    {/* NVR/Camera Photo Upload */}
                    <div className="md:col-span-2">
                      <Label htmlFor="nvrCameraPhotoUpload">NVR/Camera Location Photo</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="nvrCameraPhotoUpload"
                          type="file"
                          accept="image/*"
                          className="flex-1"
                          disabled={isUploadingNvrPhoto}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                setIsUploadingNvrPhoto(true);
                                setNvrPhotoUploadProgress(0);
                                const imageUrl = await uploadImage(file, (progress) => {
                                  setNvrPhotoUploadProgress(progress);
                                });
                                setCctvForm({...cctvForm, nvrCameraPhoto: imageUrl});
                                toast({ title: "NVR/Camera photo uploaded successfully!" });
                              } catch (error) {
                                toast({ title: "Failed to upload photo", variant: "destructive" });
                              } finally {
                                setIsUploadingNvrPhoto(false);
                                setNvrPhotoUploadProgress(0);
                              }
                            }
                          }}
                        />
                        {cctvForm.nvrCameraPhoto && (
                          <img src={cctvForm.nvrCameraPhoto} alt="NVR/Camera" className="h-12 w-12 object-cover rounded border" />
                        )}
                      </div>
                      {/* Upload Progress Bar */}
                      {isUploadingNvrPhoto && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-600 border-t-transparent"></div>
                            <span className="text-sm text-cyan-600 font-medium">Uploading... {nvrPhotoUploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${nvrPhotoUploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      {cctvForm.nvrCameraPhoto && !isUploadingNvrPhoto && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <span className="inline-block w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
                          Image uploaded successfully
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCctvForm(false);
                        setIsEditingCctv(false);
                        setEditCctvId(null);
                        setCctvForm({
                          serialNumber: "",
                          cameraIp: "",
                          addedIn: "",
                          port: "",
                          httpPort: "",
                          modelNo: "",
                          locationName: "",
                          uplink: "",
                          rackPhoto: "",
                          nvrCameraPhoto: "",
                          deviceSerialNo: "",
                          macAddress: "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className={isEditingCctv ? "bg-blue-600 hover:bg-blue-700" : "bg-cyan-600 hover:bg-cyan-700"}
                      disabled={isEditingCctv ? updateCctvMutation.isPending : createCctvMutation.isPending}
                    >
                      {isEditingCctv 
                        ? (updateCctvMutation.isPending ? "Updating..." : "Update CCTV")
                        : (createCctvMutation.isPending ? "Adding..." : "Add CCTV")
                      }
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Bulk Upload Modal */}
            <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-cyan-600" />
                    Bulk Upload CCTV Information
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Download Template Button */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Step 1: Download Excel Template
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Download the template, fill in your CCTV data, and upload it back.
                    </p>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        // Create Excel template with headers
                        const headers = ['S.NO.', 'CAMERA IP', 'ADDED IN', 'PORT', 'HTTP PORT', 'MODEL NO.', 'LOCATION NAME', 'UPLINK', 'DEVICE SERIAL NO.', 'MAC ADDRESS'];
                        const exampleRow = ['1', '192.168.1.10', 'NVR1', '554', '80', 'DS-2CD2043', 'Main Gate', 'Port 1', 'SN123456', '00:1A:2B:3C:4D:5E'];
                        const csvContent = headers.join(',') + '\n' + exampleRow.join(',');
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = 'cctv_upload_template.csv';
                        link.click();
                        toast({ title: "Template downloaded! Open with Excel and fill your data." });
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Download CSV Template
                    </Button>
                  </div>
                  
                  {/* Upload Excel/CSV File */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Step 2: Upload Your Excel/CSV File
                    </h4>
                    <Input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        try {
                          const text = await file.text();
                          const lines = text.trim().split('\n');
                          
                          // Skip header row if present
                          const dataLines = lines[0].toLowerCase().includes('camera') || lines[0].toLowerCase().includes('s.no') 
                            ? lines.slice(1) 
                            : lines;
                          
                          const startingSerialNumber = cctvData.length + 1;
                          const parsed = dataLines.filter(line => line.trim()).map((line, index) => {
                            const parts = line.split(/[,\t]/).map(p => p.trim().replace(/^"|"$/g, ''));
                            return {
                              serialNumber: String(startingSerialNumber + index),
                              cameraIp: parts[1] || parts[0] || '',
                              addedIn: parts[2] || '',
                              port: parts[3] || '',
                              httpPort: parts[4] || '',
                              modelNo: parts[5] || '',
                              locationName: parts[6] || '',
                              uplink: parts[7] || '',
                              deviceSerialNo: parts[8] || '',
                              macAddress: parts[9] || '',
                            };
                          });
                          setBulkUploadData(parsed);
                          toast({ title: `${parsed.length} records loaded from file!` });
                        } catch (error) {
                          toast({ title: "Failed to read file", variant: "destructive" });
                        }
                      }}
                    />
                  </div>
                  
                  {/* Or paste data manually */}
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-medium mb-2">Or Paste CSV Data Manually</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Format: CAMERA IP, ADDED IN, PORT, HTTP PORT, MODEL NO., LOCATION NAME, UPLINK, DEVICE SERIAL NO., MAC ADDRESS
                    </p>
                    <Textarea
                      className="min-h-[150px] font-mono text-sm"
                      placeholder={`Example (one row per line):
192.168.1.10, NVR1, 554, 80, DS-2CD2043, Main Gate, Port 1, SN123, 00:1A:2B:3C:4D:5E
192.168.1.11, NVR1, 554, 80, DS-2CD2043, Back Door, Port 2, SN124, 00:1A:2B:3C:4D:5F`}
                      onChange={(e) => {
                        const lines = e.target.value.trim().split('\n');
                        const startingSerialNumber = cctvData.length + 1;
                        const parsed = lines.filter(line => line.trim()).map((line, index) => {
                          const parts = line.split(/[,\t]/).map(p => p.trim());
                          return {
                            serialNumber: String(startingSerialNumber + index),
                            cameraIp: parts[0] || '',
                            addedIn: parts[1] || '',
                            port: parts[2] || '',
                            httpPort: parts[3] || '',
                            modelNo: parts[4] || '',
                            locationName: parts[5] || '',
                            uplink: parts[6] || '',
                            deviceSerialNo: parts[7] || '',
                            macAddress: parts[8] || '',
                          };
                        });
                        setBulkUploadData(parsed);
                      }}
                    />
                  </div>

                  {bulkUploadData.length > 0 && (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-green-700 font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          {bulkUploadData.length} records parsed and ready to upload (S.NO. will be auto-assigned)
                        </p>
                      </div>
                      
                      {/* Preview Table */}
                      <div className="max-h-[200px] overflow-auto border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="text-xs">S.NO.</TableHead>
                              <TableHead className="text-xs">Camera IP</TableHead>
                              <TableHead className="text-xs">Added In</TableHead>
                              <TableHead className="text-xs">Location</TableHead>
                              <TableHead className="text-xs">Model</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bulkUploadData.slice(0, 5).map((item, idx) => (
                              <TableRow key={idx} className="text-xs">
                                <TableCell className="font-medium">{item.serialNumber}</TableCell>
                                <TableCell className="font-mono">{item.cameraIp}</TableCell>
                                <TableCell>{item.addedIn}</TableCell>
                                <TableCell>{item.locationName}</TableCell>
                                <TableCell>{item.modelNo}</TableCell>
                              </TableRow>
                            ))}
                            {bulkUploadData.length > 5 && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-gray-500 text-xs">
                                  ... and {bulkUploadData.length - 5} more records
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowBulkUpload(false);
                        setBulkUploadData([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => bulkUploadCctvMutation.mutate(bulkUploadData)}
                      className="bg-cyan-600 hover:bg-cyan-700"
                      disabled={bulkUploadData.length === 0 || bulkUploadCctvMutation.isPending}
                    >
                      {bulkUploadCctvMutation.isPending ? "Uploading..." : `Upload ${bulkUploadData.length} Records`}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* View CCTV Details Modal */}
            <Dialog open={showCctvView} onOpenChange={setShowCctvView}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-cyan-600" />
                    CCTV Details
                  </DialogTitle>
                </DialogHeader>
                {selectedCctv && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">S.NO.</Label>
                        <p className="font-medium">{selectedCctv.serialNumber || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Camera IP</Label>
                        <p className="font-medium font-mono">{selectedCctv.cameraIp || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Added In</Label>
                        <p className="font-medium">{selectedCctv.addedIn || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Port</Label>
                        <p className="font-medium">{selectedCctv.port || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">HTTP Port</Label>
                        <p className="font-medium">{selectedCctv.httpPort || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Model No.</Label>
                        <p className="font-medium">{selectedCctv.modelNo || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Location Name</Label>
                        <p className="font-medium">{selectedCctv.locationName || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Uplink</Label>
                        <p className="font-medium">{selectedCctv.uplink || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Device Serial No.</Label>
                        <p className="font-medium">{selectedCctv.deviceSerialNo || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">MAC Address</Label>
                        <p className="font-medium font-mono text-sm">{selectedCctv.macAddress || '-'}</p>
                      </div>
                    </div>
                    
                    {(selectedCctv.rackPhoto || selectedCctv.nvrCameraPhoto) && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        {selectedCctv.rackPhoto && (
                          <div>
                            <Label className="text-xs text-gray-500">Rack Photo</Label>
                            <img 
                              src={selectedCctv.rackPhoto} 
                              alt="Rack" 
                              className="mt-2 max-h-40 object-contain rounded border"
                            />
                          </div>
                        )}
                        {selectedCctv.nvrCameraPhoto && (
                          <div>
                            <Label className="text-xs text-gray-500">NVR/Camera Location Photo</Label>
                            <img 
                              src={selectedCctv.nvrCameraPhoto} 
                              alt="NVR/Camera Location" 
                              className="mt-2 max-h-40 object-contain rounded border"
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="text-xs text-gray-500">
                        {selectedCctv.updatedByName && (
                          <span>Updated by: {selectedCctv.updatedByName}</span>
                        )}
                        {selectedCctv.updatedAt && (
                          <span className="ml-2">on {format(new Date(selectedCctv.updatedAt), 'dd/MM/yyyy HH:mm')}</span>
                        )}
                      </div>
                      <Button variant="outline" onClick={() => setShowCctvView(false)}>
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}