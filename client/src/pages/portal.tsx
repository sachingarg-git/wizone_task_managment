import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Menu,
  Home,
  FileText,
  BarChart3,
  User,
  LogOut,
  RefreshCw,
  Eye,
  Camera,
  Image as ImageIcon,
  X,
  ClipboardList,
  Send,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FolderOpen,
  Upload,
  Trash2,
  Search,
  Download,
  Calendar,
  MoreVertical,
  Play,
  MessageSquare,
} from "lucide-react";

interface Task {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  customerName: string;
  status: string;
  priority: string;
  dueDate: string;
  category: string;
  fieldEngineerName: string;
  createdAt?: string;
  updatedAt?: string;
  // Customer details from joined data
  customer?: {
    id: number;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    mobilePhone?: string;
    email?: string;
  };
}

interface TaskUpdate {
  id: number;
  message: string;
  type: string;
  createdByName: string;
  createdAt: string;
}

export default function MobilePortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [taskStatus, setTaskStatus] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  // Active tab for bottom navigation: 'home' | 'tasks' | 'activity' | 'dailyreport' | 'complaint' | 'reports' | 'profile' | 'documents'
  const [activeTab, setActiveTab] = useState<'home' | 'tasks' | 'activity' | 'dailyreport' | 'complaint' | 'reports' | 'profile' | 'documents'>('home');
  
  // Sync/refresh loading state
  const [isSyncing, setIsSyncing] = useState(false);

  // Task filter for Tasks tab
  const [taskFilter, setTaskFilter] = useState('all');

  // Reports month/year selection
  const [reportMonth, setReportMonth] = useState(new Date().getMonth());
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  // Daily Report form state
  const [dailyReportForm, setDailyReportForm] = useState({
    sitesVisited: '',
    workDone: '',
    sitesCompleted: '',
    completedSitesNames: [] as string[],
    incompleteSitesNames: [] as string[],
    reasonNotDone: '',
    hasIssue: false,
    issueDetails: ''
  });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Complaint form state
  const [complaintForm, setComplaintForm] = useState({
    subject: '',
    description: '',
    category: ''
  });
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  
  // Complaint detail/history dialog state
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [engineerNote, setEngineerNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Activity remarks state
  const [activityRemarks, setActivityRemarks] = useState<{[key: number]: string}>({});
  const [isUpdatingActivity, setIsUpdatingActivity] = useState<number | null>(null);
  const [activityFilter, setActivityFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');
  const [selectedActivityDetail, setSelectedActivityDetail] = useState<any>(null);
  const [activityActionModal, setActivityActionModal] = useState<{activity: any; action: 'start' | 'complete' | 'remark'} | null>(null);

  // File upload progress states
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadFile, setCurrentUploadFile] = useState('');
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [uploadSuccessCount, setUploadSuccessCount] = useState(0);

  // Documents tab states
  const [documentsSubTab, setDocumentsSubTab] = useState<'customer' | 'engineer'>('customer');
  const [customerDocSearch, setCustomerDocSearch] = useState('');
  const [engineerDocSearch, setEngineerDocSearch] = useState('');
  const [customerDropdownSearch, setCustomerDropdownSearch] = useState('');
  const [viewingDocument, setViewingDocument] = useState<{url: string; name: string; type: string} | null>(null);
  const [customerDocForm, setCustomerDocForm] = useState({
    customerId: '',
    documentType: '',
    documentName: '',
  });
  const [engineerDocForm, setEngineerDocForm] = useState({
    documentName: '',
  });
  const [isUploadingCustomerDoc, setIsUploadingCustomerDoc] = useState(false);
  const [isUploadingEngineerDoc, setIsUploadingEngineerDoc] = useState(false);
  const customerDocFileRef = useRef<HTMLInputElement>(null);
  const engineerDocFileRef = useRef<HTMLInputElement>(null);

  // Fetch my complaints
  const { data: myComplaints = [], refetch: refetchComplaints } = useQuery<any[]>({
    queryKey: ["/api/complaints/my"],
  });
  
  // Customer search states for Daily Report
  const [completedSearch, setCompletedSearch] = useState('');
  const [incompleteSearch, setIncompleteSearch] = useState('');
  const [showCompletedDropdown, setShowCompletedDropdown] = useState(false);
  const [showIncompleteDropdown, setShowIncompleteDropdown] = useState(false);

  // Fetch customers for Daily Report dropdowns
  const { data: customers = [] } = useQuery<{id: number; name: string; customerId: string}[]>({
    queryKey: ["/api/customers"],
    select: (data: any[]) => data.map((c: any) => ({ id: c.id, name: c.name, customerId: c.customerId }))
  });

  // Fetch customer documents
  const { data: customerDocuments = [], refetch: refetchCustomerDocs } = useQuery<any[]>({
    queryKey: ["/api/portal/customer-documents", customerDocSearch],
    queryFn: async (): Promise<any[]> => {
      const url = customerDocSearch 
        ? `/api/portal/customer-documents?search=${encodeURIComponent(customerDocSearch)}`
        : '/api/portal/customer-documents';
      const res = await apiRequest('GET', url);
      return res.json();
    },
    enabled: activeTab === 'documents',
  });

  // Fetch engineer documents
  const { data: engineerDocuments = [], refetch: refetchEngineerDocs } = useQuery<any[]>({
    queryKey: ["/api/portal/engineer-documents", engineerDocSearch],
    queryFn: async (): Promise<any[]> => {
      const url = engineerDocSearch 
        ? `/api/portal/engineer-documents?search=${encodeURIComponent(engineerDocSearch)}`
        : '/api/portal/engineer-documents';
      const res = await apiRequest('GET', url);
      return res.json();
    },
    enabled: activeTab === 'documents',
  });

  // Fetch tasks
  const { data: tasks = [], isLoading, refetch } = useQuery<Task[]>({
    queryKey: ["/api/tasks/my-tasks"],
  });

  // Fetch scheduled activities (maintenance tasks) for this engineer
  const { data: scheduledActivities = [], isLoading: isLoadingActivities, refetch: refetchActivities } = useQuery<any[]>({
    queryKey: ["/api/isp/maintenance/my-activities"],
    enabled: activeTab === 'activity' || activeTab === 'home',
  });

  // Filtered tasks based on status filter
  const filteredTasks = taskFilter === 'all' 
    ? tasks 
    : tasks.filter(t => {
        // Map filter value to actual status in database (handle both formats)
        if (taskFilter === 'in-progress') {
          return t.status === 'in_progress' || t.status === 'in-progress';
        }
        return t.status === taskFilter;
      });

  // WebSocket ref for mobile real-time notifications
  const wsRef = useRef<WebSocket | null>(null);
  const [isWsConnected, setIsWsConnected] = useState(false);

  // Profile modal state (now used for profile tab)
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile on app start (for dashboard photo) and when profile tab is active
  useEffect(() => {
    if (!profileData && !profileLoading) {
      setProfileLoading(true);
      apiRequest('GET', '/api/profile')
        .then((p) => setProfileData(p))
        .catch((err) => {
          console.error('Failed to load profile', err);
        })
        .finally(() => setProfileLoading(false));
    }
  }, []);

  // Handle profile photo upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'destructive' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image size must be less than 5MB', variant: 'destructive' });
      return;
    }

    setUploadingPhoto(true);
    
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          
          // Upload to server
          await apiRequest('POST', '/api/profile/photo', { photoData: base64Data });
          
          // Update local state
          setProfileData((prev: any) => ({ ...prev, profileImageUrl: base64Data }));
          
          toast({ title: 'Profile photo updated successfully!' });
        } catch (error) {
          console.error('Failed to upload photo:', error);
          toast({ title: 'Failed to upload photo', variant: 'destructive' });
        } finally {
          setUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to read file:', error);
      toast({ title: 'Failed to read file', variant: 'destructive' });
      setUploadingPhoto(false);
    }
  };

  // Handle profile photo removal
  const handleRemovePhoto = async () => {
    setUploadingPhoto(true);
    try {
      await apiRequest('DELETE', '/api/profile/photo');
      setProfileData((prev: any) => ({ ...prev, profileImageUrl: null }));
      toast({ title: 'Profile photo removed' });
    } catch (error) {
      console.error('Failed to remove photo:', error);
      toast({ title: 'Failed to remove photo', variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Fetch task updates
  const { data: taskUpdates = [] } = useQuery<TaskUpdate[]>({
    queryKey: [`/api/tasks/${selectedTaskId}/updates`],
    enabled: !!selectedTaskId,
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      status,
      notes,
    }: {
      taskId: number;
      status: string;
      notes: string;
    }) => {
      await apiRequest("PUT", `/api/tasks/${taskId}`, {
        status,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my-tasks"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/tasks/${selectedTaskId}/updates`],
      });
      toast({ title: "Task updated successfully" });
      setUpdateNotes("");
    },
  });

  // Calculate statistics
  const taskStats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress" || t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    approved: tasks.filter((t) => t.status === "approved").length,
    cancelled: tasks.filter((t) => t.status === "cancelled").length,
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  // Calculate monthly/yearly counts for logged-in engineer (by createdAt)
  const now = new Date();
  const monthlyCount = tasks.filter((t) => {
    const created = t.createdAt ? new Date(t.createdAt) : null;
    return created && created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;
  const yearlyCount = tasks.filter((t) => {
    const created = t.createdAt ? new Date(t.createdAt) : null;
    return created && created.getFullYear() === now.getFullYear();
  }).length;

  // Sync/Refresh handler with loading animation
  const handleSync = async () => {
    setIsSyncing(true);
    toast({ title: 'Syncing tasks...' });
    try {
      await refetch();
      toast({ title: 'Tasks synced successfully!' });
    } catch (err) {
      toast({ title: 'Sync failed' });
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleUpdateTask = () => {
    if (selectedTaskId && taskStatus) {
      updateTaskMutation.mutate({
        taskId: selectedTaskId,
        status: taskStatus,
        notes: updateNotes,
      });
    }
  };

  // Submit daily report
  const handleSubmitDailyReport = async () => {
    if (!dailyReportForm.workDone.trim()) {
      toast({ title: 'Please enter work done description', variant: 'destructive' });
      return;
    }

    setIsSubmittingReport(true);
    try {
      // Convert arrays to comma-separated strings for backend
      const submitData = {
        ...dailyReportForm,
        sitesVisited: parseInt(dailyReportForm.sitesVisited) || 0,
        sitesCompleted: parseInt(dailyReportForm.sitesCompleted) || 0,
        completedSitesNames: dailyReportForm.completedSitesNames.join(', '),
        incompleteSitesNames: dailyReportForm.incompleteSitesNames.join(', '),
      };

      const response = await fetch('/api/daily-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit report');
      }

      toast({ title: '✅ Daily report submitted successfully!' });
      
      // Reset form
      setDailyReportForm({
        sitesVisited: '',
        workDone: '',
        sitesCompleted: '',
        completedSitesNames: [],
        incompleteSitesNames: [],
        reasonNotDone: '',
        hasIssue: false,
        issueDetails: ''
      });
      setCompletedSearch('');
      setIncompleteSearch('');
    } catch (err: any) {
      toast({ title: err.message || 'Failed to submit report', variant: 'destructive' });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Submit complaint
  const handleSubmitComplaint = async () => {
    if (!complaintForm.category) {
      toast({ title: 'Please select category', variant: 'destructive' });
      return;
    }
    if (!complaintForm.subject.trim()) {
      toast({ title: 'Please enter subject', variant: 'destructive' });
      return;
    }
    if (!complaintForm.description.trim()) {
      toast({ title: 'Please enter description', variant: 'destructive' });
      return;
    }

    setIsSubmittingComplaint(true);
    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subject: complaintForm.subject,
          description: complaintForm.description,
          category: complaintForm.category
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit complaint');
      }

      const result = await response.json();
      toast({ 
        title: '✅ Complaint submitted successfully!',
        description: `Complaint ID: ${result.complaint_id}`
      });
      
      // Reset form
      setComplaintForm({
        subject: '',
        description: '',
        category: ''
      });
      
      // Refresh complaints list
      refetchComplaints();
    } catch (err: any) {
      toast({ title: err.message || 'Failed to submit complaint', variant: 'destructive' });
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  // Submit engineer note for complaint
  const handleSubmitEngineerNote = async () => {
    if (!selectedComplaint || !engineerNote.trim()) {
      toast({ title: 'Please enter a note', variant: 'destructive' });
      return;
    }

    setIsSubmittingNote(true);
    try {
      const response = await fetch(`/api/complaints/${selectedComplaint.id}/engineer-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          note: engineerNote.trim()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add note');
      }

      const updatedComplaint = await response.json();
      toast({ 
        title: '✅ Note added successfully!',
      });
      
      // Update selected complaint with new data
      setSelectedComplaint(updatedComplaint);
      setEngineerNote('');
      
      // Refresh complaints list
      refetchComplaints();
    } catch (err: any) {
      toast({ title: err.message || 'Failed to add note', variant: 'destructive' });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Connect to WebSocket for mobile notifications
  useEffect(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('📲 Mobile WebSocket connected');
        setIsWsConnected(true);
        wsRef.current = websocket;
        // Authenticate over WS
        websocket.send(JSON.stringify({
          type: 'authenticate',
          userId: user?.id || user?.username,
          userRole: user?.role,
          clientType: 'mobile'
        }));
      };

      websocket.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          console.log('📩 Mobile WS message:', msg);
          if (msg.type === 'task_assigned' || msg.type === 'task_created') {
            const title = msg.task?.title || 'New Task';
            const body = msg.message || `Ticket: ${msg.task?.ticketNumber || ''}`;

            // Try to show native Notification first
            if (window.Notification && Notification.permission === 'granted') {
              const n = new Notification(title, { body });
              n.onclick = () => {
                // Focus and open task
                window.focus();
                if (msg.task?.id) setSelectedTaskId(msg.task.id);
              };
            } else if (window.Notification && Notification.permission !== 'denied') {
              Notification.requestPermission().then((perm) => {
                if (perm === 'granted') {
                  new Notification(title, { body });
                }
              });
            }

            // Also show in-app toast
            toast({ title, description: body });
          }
        } catch (err) {
          console.error('Failed to parse WS message', err);
        }
      };

      websocket.onclose = () => {
        console.log('📴 Mobile WebSocket disconnected');
        setIsWsConnected(false);
        wsRef.current = null;
        // reconnect after a while
        setTimeout(() => {
          try {
            // trigger a reload of the effect
            setIsWsConnected(false);
          } catch (e) {}
        }, 3000);
      };

      websocket.onerror = (err) => console.error('WebSocket error', err);
    } catch (error) {
      console.error('WebSocket init error', error);
    }
  }, []);

  // Upload collected files to server (base64 encode and send) with progress tracking
  const uploadFilesToServer = async (taskId: number, note?: string) => {
    if (!taskId) return;
    if (uploadFiles.length === 0) {
      toast({ title: 'No files selected' });
      return;
    }

    try {
      setIsUploadingFiles(true);
      setUploadProgress(0);
      
      const filesPayload: any[] = [];
      const totalFiles = uploadFiles.length;
      
      // Read files with progress
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        setCurrentUploadFile(file.name);
        
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onprogress = (event) => {
            if (event.lengthComputable) {
              // Calculate progress for reading phase (0-50%)
              const fileProgress = (event.loaded / event.total) * 100;
              const overallProgress = ((i / totalFiles) * 50) + ((fileProgress / 100) * (50 / totalFiles));
              setUploadProgress(Math.round(overallProgress));
            }
          };
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        });
        filesPayload.push({ name: file.name, type: file.type, data });
      }
      
      setUploadProgress(50);
      setCurrentUploadFile('Uploading to server...');
      
      // Upload to server using XMLHttpRequest for progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            // Calculate upload phase (50-95%)
            const uploadPhaseProgress = (event.loaded / event.total) * 45;
            setUploadProgress(Math.round(50 + uploadPhaseProgress));
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(100);
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error'));
        
        xhr.open('POST', `/api/tasks/${taskId}/upload`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.withCredentials = true;
        
        xhr.send(JSON.stringify({ files: filesPayload, notes: note }));
      });
      
      toast({ title: 'Files uploaded successfully!' });
      setUploadSuccessCount(uploadFiles.length);
      setShowUploadSuccess(true);
      setUploadFiles([]);
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/updates`] });
    } catch (err) {
      console.error('Upload error', err);
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setIsUploadingFiles(false);
      setUploadProgress(0);
      setCurrentUploadFile('');
    }
  };

  const handleCameraCapture = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = (e: any) => {
      if (e.target.files[0]) {
        setUploadFiles([...uploadFiles, e.target.files[0]]);
      }
    };
    input.click();
  };

  const handleGallerySelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = (e: any) => {
      if (e.target.files) {
        const filesArray = Array.from(e.target.files) as File[];
        setUploadFiles([...uploadFiles, ...filesArray]);
      }
    };
    input.click();
  };

  // Handle customer document upload
  const handleCustomerDocUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!customerDocForm.customerId) {
      toast({ title: 'Please select a customer', variant: 'destructive' });
      return;
    }
    if (!customerDocForm.documentType) {
      toast({ title: 'Please select document type', variant: 'destructive' });
      return;
    }
    if (customerDocForm.documentType === 'other' && !customerDocForm.documentName) {
      toast({ title: 'Please enter document name', variant: 'destructive' });
      return;
    }
    
    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File size must be less than 10MB', variant: 'destructive' });
      return;
    }
    
    setIsUploadingCustomerDoc(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          
          await apiRequest('POST', '/api/portal/customer-documents', {
            customerId: parseInt(customerDocForm.customerId),
            documentType: customerDocForm.documentType,
            documentName: customerDocForm.documentType === 'other' ? customerDocForm.documentName : customerDocForm.documentType.replace('_', ' '),
            fileName: file.name,
            fileUrl: base64Data,
            fileSize: file.size,
            mimeType: file.type,
          });
          
          toast({ title: 'Customer document uploaded successfully!' });
          setCustomerDocForm({ customerId: '', documentType: '', documentName: '' });
          refetchCustomerDocs();
        } catch (error) {
          console.error('Failed to upload document:', error);
          toast({ title: 'Failed to upload document', variant: 'destructive' });
        } finally {
          setIsUploadingCustomerDoc(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to read file:', error);
      toast({ title: 'Failed to read file', variant: 'destructive' });
      setIsUploadingCustomerDoc(false);
    }
    
    // Reset file input
    if (customerDocFileRef.current) {
      customerDocFileRef.current.value = '';
    }
  };
  
  // Handle engineer document upload
  const handleEngineerDocUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!engineerDocForm.documentName) {
      toast({ title: 'Please enter document name', variant: 'destructive' });
      return;
    }
    
    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File size must be less than 10MB', variant: 'destructive' });
      return;
    }
    
    setIsUploadingEngineerDoc(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          
          await apiRequest('POST', '/api/portal/engineer-documents', {
            documentName: engineerDocForm.documentName,
            fileName: file.name,
            fileUrl: base64Data,
            fileSize: file.size,
            mimeType: file.type,
          });
          
          toast({ title: 'Document uploaded successfully!' });
          setEngineerDocForm({ documentName: '' });
          refetchEngineerDocs();
        } catch (error) {
          console.error('Failed to upload document:', error);
          toast({ title: 'Failed to upload document', variant: 'destructive' });
        } finally {
          setIsUploadingEngineerDoc(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to read file:', error);
      toast({ title: 'Failed to read file', variant: 'destructive' });
      setIsUploadingEngineerDoc(false);
    }
    
    // Reset file input
    if (engineerDocFileRef.current) {
      engineerDocFileRef.current.value = '';
    }
  };
  
  // Delete customer document
  const deleteCustomerDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await apiRequest('DELETE', `/api/portal/customer-documents/${docId}`);
      toast({ title: 'Document deleted successfully' });
      refetchCustomerDocs();
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast({ title: 'Failed to delete document', variant: 'destructive' });
    }
  };
  
  // Delete engineer document
  const deleteEngineerDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await apiRequest('DELETE', `/api/portal/engineer-documents/${docId}`);
      toast({ title: 'Document deleted successfully' });
      refetchEngineerDocs();
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast({ title: 'Failed to delete document', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Drawer Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${
          drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Side Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-slate-800 text-white transform transition-transform duration-300 z-50 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-teal-600 font-bold text-xl">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div className="font-semibold text-lg">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-sm text-cyan-100">{user?.role?.replace("_", " ")}</div>
            </div>
          </div>
        </div>

        {/* Drawer Menu */}
        <nav className="p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors text-left">
            <Home className="w-5 h-5" />
            <span>My Portal</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors text-left">
            <FileText className="w-5 h-5" />
            <span>All Tasks</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors text-left">
            <BarChart3 className="w-5 h-5" />
            <span>Reports</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors text-left">
            <User className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            onClick={() => {
              apiRequest("POST", "/api/auth/logout").then(() => {
                window.location.href = "/login";
              });
            }}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-20">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 bg-white shadow-md">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              {/* WIZONE Logo */}
              <svg viewBox="0 0 120 40" className="h-8 w-auto">
                {/* Signal waves */}
                <path d="M8 12 Q8 20, 8 28" stroke="#0891B2" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                <path d="M14 8 Q14 20, 14 32" stroke="#0891B2" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                <path d="M20 4 Q20 20, 20 36" stroke="#0891B2" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                {/* WIZONE text */}
                <text x="28" y="28" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="#374151">W</text>
                <text x="45" y="28" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="#374151">i</text>
                <text x="52" y="28" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="#0891B2">zone</text>
              </svg>
            </div>
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <>
            {/* User Banner - Professional Teal Design */}
            <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-700 text-white px-5 py-8">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative z-10 flex items-center gap-4">
                {profileData?.profileImageUrl ? (
                  <div className="relative">
                    <img 
                      src={profileData.profileImageUrl} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-2xl object-cover border-3 border-white/30 shadow-xl"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white"></div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl border border-white/30">
                      {user?.username?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white"></div>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-cyan-100 text-sm font-medium">Welcome back,</p>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {profileData?.firstName || user?.firstName || user?.username}
                  </h2>
                  <p className="text-sm text-cyan-100/80 mt-0.5">{profileData?.email || user?.email}</p>
                </div>
              </div>
            </div>

            {/* Statistics Cards - Professional 2x3 Grid */}
            <div className="grid grid-cols-2 gap-4 p-5">
              {/* My Tasks */}
              <div className="relative overflow-hidden bg-white rounded-2xl p-5 shadow-lg border border-teal-100 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-teal-500/20 to-cyan-600/10 rounded-bl-full"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-teal-500/30">
                    <span className="text-white text-xl">📋</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{taskStats.total}</div>
                  <div className="text-sm text-gray-500 font-medium mt-1">My Tasks</div>
                </div>
              </div>

              {/* Pending */}
              <div className="relative overflow-hidden bg-white rounded-2xl p-5 shadow-lg border border-amber-100 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-bl-full"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-amber-500/30">
                    <span className="text-white text-xl">⏳</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{taskStats.pending}</div>
                  <div className="text-sm text-gray-500 font-medium mt-1">Pending</div>
                </div>
              </div>

              {/* In Progress */}
              <div className="relative overflow-hidden bg-white rounded-2xl p-5 shadow-lg border border-violet-100 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-500/20 to-purple-500/10 rounded-bl-full"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-violet-500/30">
                    <span className="text-white text-xl">🔄</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{taskStats.inProgress}</div>
                  <div className="text-sm text-gray-500 font-medium mt-1">In Progress</div>
                </div>
              </div>

              {/* Completed */}
              <div className="relative overflow-hidden bg-white rounded-2xl p-5 shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-green-500/10 rounded-bl-full"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/30">
                    <span className="text-white text-xl">✓</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{taskStats.completed}</div>
                  <div className="text-sm text-gray-500 font-medium mt-1">Completed</div>
                </div>
              </div>

              {/* Approved */}
              <div className="relative overflow-hidden bg-white rounded-2xl p-5 shadow-lg border border-teal-100 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-teal-500/20 to-cyan-500/10 rounded-bl-full"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-teal-500/30">
                    <span className="text-white text-xl">🏆</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{taskStats.approved}</div>
                  <div className="text-sm text-gray-500 font-medium mt-1">Approved</div>
                </div>
              </div>

              {/* Cancelled */}
              <div className="relative overflow-hidden bg-white rounded-2xl p-5 shadow-lg border border-rose-100 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-rose-500/20 to-red-500/10 rounded-bl-full"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-rose-500/30">
                    <span className="text-white text-xl">✗</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{taskStats.cancelled}</div>
                  <div className="text-sm text-gray-500 font-medium mt-1">Cancelled</div>
                </div>
              </div>
            </div>

            {/* Scheduled Activities Section */}
            {scheduledActivities.length > 0 && (
              <div className="px-5 mt-4">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Scheduled Activities
                    </h3>
                    <Badge className="bg-purple-600">{scheduledActivities.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {scheduledActivities.slice(0, 3).map((activity: any) => (
                      <div 
                        key={activity.id}
                        onClick={() => setActiveTab('activity')}
                        className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm text-gray-900">{activity.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            activity.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            activity.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          📅 {new Date(activity.scheduled_date).toLocaleDateString('en-GB')}
                          {activity.tower_name && ` • 📍 ${activity.tower_name}`}
                        </p>
                      </div>
                    ))}
                    {scheduledActivities.length > 3 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-purple-600"
                        onClick={() => setActiveTab('activity')}
                      >
                        View all {scheduledActivities.length} activities →
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tasks Section */}
            <div className="px-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">My Assigned Tasks</h3>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500 mr-2">Monthly: {monthlyCount} • Yearly: {yearlyCount}</div>
                  <button 
                    onClick={handleSync} 
                    disabled={isSyncing}
                    className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 text-gray-600 ${isSyncing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Task Cards - Professional Design */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading tasks...</div>
                ) : tasks.filter(t => t.status === 'pending' || t.status === 'in_progress' || t.status === 'in-progress').length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No pending or in-progress tasks</p>
                  </div>
                ) : (
                  tasks.filter(t => t.status === 'pending' || t.status === 'in_progress' || t.status === 'in-progress').map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100"
                    >
                      {/* Colored Top Bar based on priority */}
                      <div className={`h-1.5 ${
                        task.priority === 'critical' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                        task.priority === 'high' ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
                        task.priority === 'medium' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                        'bg-gradient-to-r from-green-400 to-emerald-500'
                      }`}></div>
                      
                      <div className="p-4">
                        {/* Task Header */}
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-teal-600 font-bold text-sm">
                              {task.ticketNumber}
                            </span>
                          </div>
                          <Badge
                            className={`${getStatusColor(task.status)} text-xs px-3 py-1 rounded-full font-medium`}
                          >
                            {task.status?.replace('_', ' ')}
                          </Badge>
                        </div>

                        {/* Task Title */}
                        <h4 className="font-bold text-gray-900 mb-2 text-base line-clamp-2">
                          {task.title}
                        </h4>

                        {/* Customer Info Card */}
                        <div className="bg-gray-50 rounded-xl p-3 mb-3">
                          <div className="flex items-center gap-2 text-gray-800">
                            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-teal-600" />
                            </div>
                            <div>
                              <span className="font-semibold text-sm block">{task.customerName}</span>
                              {task.customer?.address && (
                                <span className="text-xs text-gray-500">
                                  📍 {[task.customer.address, task.customer.city].filter(Boolean).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Task Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                              <span className="text-sm">📅</span>
                              <span className="text-xs font-medium">
                                {task.dueDate && new Date(task.dueDate).getFullYear() > 1970 
                                  ? new Date(task.dueDate).toLocaleDateString() 
                                  : 'Not Set'}
                              </span>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                            task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            <span>{task.priority === 'critical' ? '🔴' : task.priority === 'high' ? '🟠' : task.priority === 'medium' ? '🟡' : '🟢'}</span>
                            <span className="uppercase">{task.priority}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* TASKS TAB - Filter by status */}
        {activeTab === 'tasks' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">All My Tasks</h3>
              <button 
                onClick={handleSync} 
                disabled={isSyncing}
                className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Status Filter Pills with Counts */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {['all', 'pending', 'in-progress', 'completed', 'approved', 'cancelled'].map((status) => {
                const getCount = () => {
                  switch(status) {
                    case 'all': return taskStats.total;
                    case 'pending': return taskStats.pending;
                    case 'in-progress': return taskStats.inProgress;
                    case 'completed': return taskStats.completed;
                    case 'approved': return taskStats.approved;
                    case 'cancelled': return taskStats.cancelled;
                    default: return 0;
                  }
                };
                return (
                  <button
                    key={status}
                    onClick={() => setTaskFilter(status)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                      taskFilter === status 
                        ? 'bg-teal-600 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {status === 'all' ? 'All' : status === 'in-progress' ? 'In-progress' : status.charAt(0).toUpperCase() + status.slice(1)} ({getCount()})
                  </button>
                );
              })}
            </div>

            {/* Filtered Task List - Professional Design */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading tasks...</div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No tasks found</p>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100"
                  >
                    {/* Colored Top Bar based on priority */}
                    <div className={`h-1.5 ${
                      task.priority === 'critical' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                      task.priority === 'high' ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
                      task.priority === 'medium' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                      'bg-gradient-to-r from-green-400 to-emerald-500'
                    }`}></div>
                    
                    <div className="p-4">
                      {/* Task Header */}
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-teal-600 font-bold text-sm">{task.ticketNumber}</span>
                        </div>
                        <Badge className={`${getStatusColor(task.status)} text-xs px-3 py-1 rounded-full font-medium`}>
                          {task.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      {/* Task Title */}
                      <h4 className="font-bold text-gray-900 mb-2 line-clamp-2">{task.title}</h4>
                      
                      {/* Customer Info */}
                      <div className="bg-gray-50 rounded-xl p-3 mb-3">
                        <div className="flex items-center gap-2 text-gray-800">
                          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-teal-600" />
                          </div>
                          <span className="font-semibold text-sm">{task.customerName}</span>
                        </div>
                      </div>
                      
                      {/* Task Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                          <span className="text-sm">📅</span>
                          <span className="text-xs font-medium">
                            {task.dueDate && new Date(task.dueDate).getFullYear() > 1970 
                              ? new Date(task.dueDate).toLocaleDateString() 
                              : 'Not Set'}
                          </span>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                          task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          <span>{task.priority === 'critical' ? '🔴' : task.priority === 'high' ? '🟠' : task.priority === 'medium' ? '🟡' : '🟢'}</span>
                          <span className="uppercase">{task.priority}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="p-5">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Task Reports</h3>
            
            {/* Month/Year Selection */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">Select Period</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Month</label>
                  <select 
                    value={reportMonth}
                    onChange={(e) => setReportMonth(parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value={0}>January</option>
                    <option value={1}>February</option>
                    <option value={2}>March</option>
                    <option value={3}>April</option>
                    <option value={4}>May</option>
                    <option value={5}>June</option>
                    <option value={6}>July</option>
                    <option value={7}>August</option>
                    <option value={8}>September</option>
                    <option value={9}>October</option>
                    <option value={10}>November</option>
                    <option value={11}>December</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Year</label>
                  <select 
                    value={reportYear}
                    onChange={(e) => setReportYear(parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                    <option value={2028}>2028</option>
                    <option value={2029}>2029</option>
                    <option value={2030}>2030</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Selected Period Stats */}
            {(() => {
              const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
              
              // Filter tasks for selected month/year
              const filteredMonthTasks = tasks.filter((t) => {
                const created = t.createdAt ? new Date(t.createdAt) : null;
                return created && created.getMonth() === reportMonth && created.getFullYear() === reportYear;
              });
              
              // Calculate stats for filtered tasks
              const filteredStats = {
                total: filteredMonthTasks.length,
                pending: filteredMonthTasks.filter((t) => t.status === "pending").length,
                inProgress: filteredMonthTasks.filter((t) => t.status === "in_progress" || t.status === "in-progress").length,
                completed: filteredMonthTasks.filter((t) => t.status === "completed").length,
                approved: filteredMonthTasks.filter((t) => t.status === "approved").length,
              };
              
              const completionRate = filteredStats.total > 0 
                ? Math.round(((filteredStats.completed + filteredStats.approved) / filteredStats.total) * 100) 
                : 0;
              
              return (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-4 text-white">
                      <div className="text-3xl font-bold">{filteredStats.total}</div>
                      <div className="text-sm opacity-90">{monthNames[reportMonth]} {reportYear}</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                      <div className="text-3xl font-bold">{completionRate}%</div>
                      <div className="text-sm opacity-90">Completion Rate</div>
                    </div>
                  </div>

                  {/* Status Breakdown with Visual Graph */}
                  <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
                    <h4 className="font-semibold text-gray-900 mb-4">Task Status Breakdown - {monthNames[reportMonth]} {reportYear}</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 w-24">Pending</span>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-yellow-500 rounded-full transition-all duration-300" 
                              style={{ width: `${filteredStats.total ? (filteredStats.pending / filteredStats.total) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="font-semibold text-yellow-600 w-10 text-right">{filteredStats.pending}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 w-24">In Progress</span>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-teal-500 rounded-full transition-all duration-300" 
                              style={{ width: `${filteredStats.total ? (filteredStats.inProgress / filteredStats.total) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="font-semibold text-teal-600 w-10 text-right">{filteredStats.inProgress}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 w-24">Completed</span>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full transition-all duration-300" 
                              style={{ width: `${filteredStats.total ? (filteredStats.completed / filteredStats.total) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="font-semibold text-green-600 w-10 text-right">{filteredStats.completed}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 w-24">Approved</span>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full transition-all duration-300" 
                              style={{ width: `${filteredStats.total ? (filteredStats.approved / filteredStats.total) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="font-semibold text-purple-600 w-10 text-right">{filteredStats.approved}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
                    <h4 className="font-semibold text-gray-900 mb-4">Quick Stats</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-teal-50 rounded-lg">
                        <div className="text-2xl font-bold text-teal-600">{filteredStats.total}</div>
                        <div className="text-xs text-gray-500">Total Tasks</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
                        <div className="text-xs text-gray-500">Completion Rate</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{filteredStats.pending + filteredStats.inProgress}</div>
                        <div className="text-xs text-gray-500">Active Tasks</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{filteredStats.completed + filteredStats.approved}</div>
                        <div className="text-xs text-gray-500">Done Tasks</div>
                      </div>
                    </div>
                  </div>

                  {/* Yearly Overview */}
                  <div className="bg-white rounded-xl p-5 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-4">Year {reportYear} Overview</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg text-white">
                        <div className="text-2xl font-bold">
                          {tasks.filter((t) => {
                            const created = t.createdAt ? new Date(t.createdAt) : null;
                            return created && created.getFullYear() === reportYear;
                          }).length}
                        </div>
                        <div className="text-xs opacity-90">Total This Year</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg text-white">
                        <div className="text-2xl font-bold">
                          {(() => {
                            const yearTasks = tasks.filter((t) => {
                              const created = t.createdAt ? new Date(t.createdAt) : null;
                              return created && created.getFullYear() === reportYear;
                            });
                            const doneTasks = yearTasks.filter(t => t.status === 'completed' || t.status === 'approved').length;
                            return yearTasks.length > 0 ? Math.round((doneTasks / yearTasks.length) * 100) : 0;
                          })()}%
                        </div>
                        <div className="text-xs opacity-90">Year Completion</div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="p-5">
            <h3 className="text-xl font-bold text-gray-900 mb-4">My Profile</h3>
            
            {profileLoading ? (
              <div className="text-center py-8 text-gray-500">Loading profile...</div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Profile Header with Photo */}
                <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-6 text-white text-center">
                  {/* Profile Photo with Upload */}
                  <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-full mx-auto mb-3 shadow-lg overflow-hidden border-4 border-white bg-white">
                      {profileData?.profileImageUrl ? (
                        <img 
                          src={profileData.profileImageUrl} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-teal-100 to-cyan-200 flex items-center justify-center text-teal-600 font-bold text-4xl">
                          {(profileData?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* Camera Button for Photo Upload */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="absolute bottom-2 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-teal-600 hover:bg-teal-50 transition-colors disabled:opacity-50"
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                    
                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                  
                  {/* Remove Photo Button */}
                  {profileData?.profileImageUrl && (
                    <button
                      onClick={handleRemovePhoto}
                      disabled={uploadingPhoto}
                      className="text-xs text-cyan-100 hover:text-white underline mt-1 disabled:opacity-50"
                    >
                      Remove Photo
                    </button>
                  )}
                  
                  <h4 className="text-xl font-semibold mt-2">
                    {profileData?.firstName} {profileData?.lastName}
                  </h4>
                  <p className="text-cyan-100 text-sm mt-1 capitalize">{profileData?.role?.replace('_', ' ') || 'Engineer'}</p>
                </div>

                {/* Profile Details */}
                <div className="p-5 space-y-3">
                  {/* Email */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-teal-600">📧</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">Email</div>
                      <div className="font-medium text-gray-900 truncate">{profileData?.email || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600">📱</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">Phone</div>
                      <div className="font-medium text-gray-900">{profileData?.phone || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Department */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600">🏢</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">Department</div>
                      <div className="font-medium text-gray-900">{profileData?.department || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-yellow-600">👤</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">Username</div>
                      <div className="font-medium text-gray-900">{profileData?.username || user?.username || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-teal-600">🎖️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">Role</div>
                      <div className="font-medium text-gray-900 capitalize">{profileData?.role?.replace('_', ' ') || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-600">✓</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">Account Status</div>
                      <div className="font-medium">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${profileData?.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {profileData?.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-pink-600">📅</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">Member Since</div>
                      <div className="font-medium text-gray-900">
                        {profileData?.createdAt 
                          ? new Date(profileData.createdAt).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })
                          : 'N/A'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <div className="p-5 pt-0">
                  <button
                    onClick={() => {
                      apiRequest("POST", "/api/auth/logout").then(() => {
                        window.location.href = "/login";
                      });
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DAILY REPORT TAB */}
        {activeTab === 'dailyreport' && (
          <div className="p-5 pb-24">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl p-5 mb-5 text-center">
              <h3 className="text-xl font-bold">Daily Report Submission</h3>
              <p className="text-sm opacity-90 mt-1">Wizone IT Network India Pvt Ltd</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-5">
              {/* Auto-filled Name */}
              <div>
                <Label className="text-gray-700 font-semibold block">YOUR NAME</Label>
                <span className="text-sm text-gray-500 block mb-2">आपका नाम</span>
                <Input 
                  value={user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.username || '')}
                  disabled
                  className="mt-1 bg-gray-100 font-medium"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-filled from your profile</p>
              </div>

              {/* Sites Visited - Dropdown 1-20 */}
              <div>
                <Label className="text-gray-700 font-semibold block">HOW MANY SITES VISIT BY YOU TODAY</Label>
                <span className="text-sm text-gray-500 block mb-2">आज आपने कितनी साइटों पर विजिट किया?</span>
                <Select 
                  value={dailyReportForm.sitesVisited} 
                  onValueChange={(value) => setDailyReportForm({...dailyReportForm, sitesVisited: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select number of sites" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 20}, (_, i) => i + 1).map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Work Done */}
              <div>
                <Label className="text-gray-700 font-semibold block">WHAT WORK DID YOU DO TODAY <span className="text-red-500">*</span></Label>
                <span className="text-sm text-gray-500 block mb-2">आज तुमने क्या काम किया?</span>
                <Textarea 
                  value={dailyReportForm.workDone}
                  onChange={(e) => setDailyReportForm({...dailyReportForm, workDone: e.target.value})}
                  className="mt-1 min-h-[100px]"
                  placeholder="Describe your work in detail..."
                />
              </div>

              {/* Sites Completed - Dropdown 1-20 */}
              <div>
                <Label className="text-gray-700 font-semibold block">HOW MANY SITES WORK COMPLETED</Label>
                <span className="text-sm text-gray-500 block mb-2">कितनी साइटों का काम पूरा हुआ</span>
                <Select 
                  value={dailyReportForm.sitesCompleted} 
                  onValueChange={(value) => setDailyReportForm({...dailyReportForm, sitesCompleted: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select number of completed sites" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 20}, (_, i) => i + 1).map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Completed Sites Names - Customer Multi-Select */}
              <div>
                <Label className="text-gray-700 font-semibold block">COMPLETED SITES NAME</Label>
                <span className="text-sm text-gray-500 block mb-2">पूर्ण साइटों का नाम</span>
                
                {/* Selected customers chips */}
                {dailyReportForm.completedSitesNames.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {dailyReportForm.completedSitesNames.map((name, idx) => (
                      <div key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        {name}
                        <button 
                          onClick={() => setDailyReportForm({
                            ...dailyReportForm, 
                            completedSitesNames: dailyReportForm.completedSitesNames.filter((_, i) => i !== idx)
                          })}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Search input */}
                <div className="relative">
                  <Input
                    placeholder="Search customer name..."
                    value={completedSearch}
                    onChange={(e) => {
                      setCompletedSearch(e.target.value);
                      setShowCompletedDropdown(true);
                    }}
                    onFocus={() => setShowCompletedDropdown(true)}
                    className="mt-1"
                  />
                  {showCompletedDropdown && completedSearch && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {customers
                        .filter(c => 
                          c.name.toLowerCase().includes(completedSearch.toLowerCase()) &&
                          !dailyReportForm.completedSitesNames.includes(c.name)
                        )
                        .slice(0, 10)
                        .map(customer => (
                          <div
                            key={customer.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => {
                              setDailyReportForm({
                                ...dailyReportForm,
                                completedSitesNames: [...dailyReportForm.completedSitesNames, customer.name]
                              });
                              setCompletedSearch('');
                              setShowCompletedDropdown(false);
                            }}
                          >
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-xs text-gray-500">{customer.customerId}</div>
                          </div>
                        ))}
                      {customers.filter(c => 
                        c.name.toLowerCase().includes(completedSearch.toLowerCase()) &&
                        !dailyReportForm.completedSitesNames.includes(c.name)
                      ).length === 0 && (
                        <div className="px-3 py-2 text-gray-500 text-sm">No customers found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Incomplete Sites Names - Customer Multi-Select */}
              <div>
                <Label className="text-gray-700 font-semibold block">INCOMPLETE SITES NAME</Label>
                <span className="text-sm text-gray-500 block mb-2">अपूर्ण साइट का नाम</span>
                
                {/* Selected customers chips */}
                {dailyReportForm.incompleteSitesNames.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {dailyReportForm.incompleteSitesNames.map((name, idx) => (
                      <div key={idx} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        {name}
                        <button 
                          onClick={() => setDailyReportForm({
                            ...dailyReportForm, 
                            incompleteSitesNames: dailyReportForm.incompleteSitesNames.filter((_, i) => i !== idx)
                          })}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Search input */}
                <div className="relative">
                  <Input
                    placeholder="Search customer name..."
                    value={incompleteSearch}
                    onChange={(e) => {
                      setIncompleteSearch(e.target.value);
                      setShowIncompleteDropdown(true);
                    }}
                    onFocus={() => setShowIncompleteDropdown(true)}
                    className="mt-1"
                  />
                  {showIncompleteDropdown && incompleteSearch && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {customers
                        .filter(c => 
                          c.name.toLowerCase().includes(incompleteSearch.toLowerCase()) &&
                          !dailyReportForm.incompleteSitesNames.includes(c.name)
                        )
                        .slice(0, 10)
                        .map(customer => (
                          <div
                            key={customer.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => {
                              setDailyReportForm({
                                ...dailyReportForm,
                                incompleteSitesNames: [...dailyReportForm.incompleteSitesNames, customer.name]
                              });
                              setIncompleteSearch('');
                              setShowIncompleteDropdown(false);
                            }}
                          >
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-xs text-gray-500">{customer.customerId}</div>
                          </div>
                        ))}
                      {customers.filter(c => 
                        c.name.toLowerCase().includes(incompleteSearch.toLowerCase()) &&
                        !dailyReportForm.incompleteSitesNames.includes(c.name)
                      ).length === 0 && (
                        <div className="px-3 py-2 text-gray-500 text-sm">No customers found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Reason Not Done */}
              <div>
                <Label className="text-gray-700 font-semibold block">REASON FOR WORK NOT DONE</Label>
                <span className="text-sm text-gray-500 block mb-2">काम न करने का कारण</span>
                <Textarea 
                  value={dailyReportForm.reasonNotDone}
                  onChange={(e) => setDailyReportForm({...dailyReportForm, reasonNotDone: e.target.value})}
                  className="mt-1"
                  placeholder="If any work is incomplete, explain the reason..."
                />
              </div>

              {/* Has Issue Toggle */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-700 font-semibold block">HAVE YOU FACED ANY ISSUE TODAY</Label>
                    <span className="text-sm text-gray-500">क्या आज आपको किसी समस्या का सामना करना पड़ा?</span>
                  </div>
                  <Switch 
                    checked={dailyReportForm.hasIssue}
                    onCheckedChange={(checked) => setDailyReportForm({...dailyReportForm, hasIssue: checked})}
                  />
                </div>
              </div>

              {/* Issue Details (shown only if hasIssue is true) */}
              {dailyReportForm.hasIssue && (
                <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <Label className="text-gray-700 font-semibold block">IF YES DESCRIBE YOUR ISSUE</Label>
                  <span className="text-sm text-gray-500 block mb-2">यदि हो तो अपनी समस्या बताएं</span>
                  <Textarea 
                    value={dailyReportForm.issueDetails}
                    onChange={(e) => setDailyReportForm({...dailyReportForm, issueDetails: e.target.value})}
                    className="mt-1 min-h-[80px] bg-white"
                    placeholder="Describe the issue you faced..."
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button 
                onClick={handleSubmitDailyReport}
                disabled={isSubmittingReport || !dailyReportForm.workDone.trim()}
                className="w-full py-6 text-lg font-medium bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
              >
                {isSubmittingReport ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Complaint Tab */}
        {activeTab === 'complaint' && (
          <div className="pb-24 px-4 pt-4">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Submit Complaint
              </h2>
              
              <div className="space-y-4">
                {/* Auto-filled Engineer Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Engineer Name</label>
                  <input
                    type="text"
                    value={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                {/* Auto-filled Engineer Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Engineer Email</label>
                  <input
                    type="text"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                {/* Auto-filled Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="text"
                    value={new Date().toLocaleDateString('en-GB')}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={complaintForm.category}
                    onChange={(e) => setComplaintForm({...complaintForm, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">Select Category</option>
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Equipment Problem">Equipment Problem</option>
                    <option value="Site Access Issue">Site Access Issue</option>
                    <option value="Safety Concern">Safety Concern</option>
                    <option value="Material Shortage">Material Shortage</option>
                    <option value="Customer Complaint">Customer Complaint</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    value={complaintForm.subject}
                    onChange={(e) => setComplaintForm({...complaintForm, subject: e.target.value})}
                    placeholder="Enter complaint subject"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={complaintForm.description}
                    onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})}
                    placeholder="Describe your complaint in detail..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  onClick={handleSubmitComplaint}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3"
                  disabled={isSubmittingComplaint || !complaintForm.subject || !complaintForm.description || !complaintForm.category}
                >
                  {isSubmittingComplaint ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Complaint
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* My Complaints List */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-4">My Complaints</h3>
              
              {myComplaints.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No complaints submitted yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myComplaints.map((complaint: any) => (
                    <div key={complaint.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <button 
                          onClick={() => setSelectedComplaint(complaint)}
                          className="text-xs font-mono text-teal-600 hover:text-teal-800 underline cursor-pointer"
                        >
                          {complaint.complaint_id}
                        </button>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          complaint.status === 'resolved' ? 'bg-green-100 text-green-700' :
                          complaint.status === 'in_progress' ? 'bg-teal-100 text-teal-700' :
                          complaint.status === 'under_investigation' ? 'bg-yellow-100 text-yellow-700' :
                          complaint.status === 'review' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {complaint.status === 'in_progress' ? 'In Progress' :
                           complaint.status === 'under_investigation' ? 'Under Investigation' :
                           complaint.status === 'review' ? 'Review' :
                           complaint.status === 'resolved' ? 'Resolved' : 'Pending'}
                        </span>
                      </div>
                      <p className="font-medium text-sm">{complaint.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">{complaint.category}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(complaint.created_at).toLocaleDateString('en-GB')}
                      </p>
                      {complaint.status_note && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                          <span className="font-medium">Note:</span> {complaint.status_note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="p-4 pb-24">
            {/* Tab Header */}
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl p-4 mb-4 text-center">
              <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                <FolderOpen className="w-6 h-6" />
                Documents
              </h3>
              <p className="text-sm opacity-90 mt-1">Upload & Manage Documents</p>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setDocumentsSubTab('customer')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  documentsSubTab === 'customer'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Customer Docs
              </button>
              <button
                onClick={() => setDocumentsSubTab('engineer')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  documentsSubTab === 'engineer'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                My Documents
              </button>
            </div>

            {/* CUSTOMER DOCUMENTS SUB-TAB */}
            {documentsSubTab === 'customer' && (
              <div className="space-y-4">
                {/* Upload Form */}
                <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-teal-600" />
                    Upload Customer Document
                  </h4>

                  {/* Customer Selection with Search */}
                  <div>
                    <Label className="text-sm text-gray-600">Select Customer *</Label>
                    <Select
                      value={customerDocForm.customerId}
                      onValueChange={(value) => setCustomerDocForm({...customerDocForm, customerId: value})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose customer..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {/* Search Input */}
                        <div className="p-2 border-b sticky top-0 bg-white z-10">
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input
                              value={customerDropdownSearch}
                              onChange={(e) => setCustomerDropdownSearch(e.target.value)}
                              placeholder="Search customer..."
                              className="pl-8 h-8 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        {customers
                          .filter(c => 
                            customerDropdownSearch === '' || 
                            c.name.toLowerCase().includes(customerDropdownSearch.toLowerCase()) ||
                            c.customerId.toLowerCase().includes(customerDropdownSearch.toLowerCase())
                          )
                          .map((customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name} ({customer.customerId})
                            </SelectItem>
                          ))
                        }
                        {customers.filter(c => 
                          customerDropdownSearch === '' || 
                          c.name.toLowerCase().includes(customerDropdownSearch.toLowerCase()) ||
                          c.customerId.toLowerCase().includes(customerDropdownSearch.toLowerCase())
                        ).length === 0 && (
                          <div className="py-4 text-center text-sm text-gray-500">No customers found</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Document Type */}
                  <div>
                    <Label className="text-sm text-gray-600">Document Type *</Label>
                    <Select
                      value={customerDocForm.documentType}
                      onValueChange={(value) => setCustomerDocForm({...customerDocForm, documentType: value})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="challan">Challan</SelectItem>
                        <SelectItem value="bill_copy">Bill Copy</SelectItem>
                        <SelectItem value="rack_photo">Rack Photo</SelectItem>
                        <SelectItem value="company_photo">Company Photo</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Document Name (if Other) */}
                  {customerDocForm.documentType === 'other' && (
                    <div>
                      <Label className="text-sm text-gray-600">Document Name *</Label>
                      <Input
                        value={customerDocForm.documentName}
                        onChange={(e) => setCustomerDocForm({...customerDocForm, documentName: e.target.value})}
                        placeholder="Enter document name..."
                        className="mt-1"
                      />
                    </div>
                  )}

                  {/* File Upload Button */}
                  <input
                    ref={customerDocFileRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleCustomerDocUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => customerDocFileRef.current?.click()}
                    disabled={isUploadingCustomerDoc || !customerDocForm.customerId || !customerDocForm.documentType || (customerDocForm.documentType === 'other' && !customerDocForm.documentName)}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                  >
                    {isUploadingCustomerDoc ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File & Upload
                      </>
                    )}
                  </Button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={customerDocSearch}
                    onChange={(e) => setCustomerDocSearch(e.target.value)}
                    placeholder="Search by customer or document..."
                    className="pl-9"
                  />
                </div>

                {/* Documents List */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">Uploaded Documents ({customerDocuments.length})</h4>
                  {customerDocuments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No customer documents uploaded yet</p>
                    </div>
                  ) : (
                    customerDocuments.map((doc: any) => (
                      <div key={doc.id} className="bg-white rounded-lg p-3 shadow-sm border flex items-start gap-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.document_name || doc.document_type}</p>
                          <p className="text-xs text-gray-500">{doc.customer_name}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(doc.created_at).toLocaleDateString('en-GB')} • {doc.file_name}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewingDocument({
                              url: doc.file_url,
                              name: doc.document_name || doc.document_type,
                              type: doc.mime_type || ''
                            })}
                            className="h-8 w-8 p-0 text-blue-600"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(doc.file_url, '_blank')}
                            className="h-8 w-8 p-0 text-teal-600"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteCustomerDocument(doc.id)}
                            className="h-8 w-8 p-0 text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ENGINEER DOCUMENTS SUB-TAB */}
            {documentsSubTab === 'engineer' && (
              <div className="space-y-4">
                {/* Upload Form */}
                <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-teal-600" />
                    Upload My Document
                  </h4>

                  {/* Document Name */}
                  <div>
                    <Label className="text-sm text-gray-600">Document Name *</Label>
                    <Input
                      value={engineerDocForm.documentName}
                      onChange={(e) => setEngineerDocForm({...engineerDocForm, documentName: e.target.value})}
                      placeholder="Enter document name (e.g., ID Card, Certificate)"
                      className="mt-1"
                    />
                  </div>

                  {/* File Upload Button */}
                  <input
                    ref={engineerDocFileRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleEngineerDocUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => engineerDocFileRef.current?.click()}
                    disabled={isUploadingEngineerDoc || !engineerDocForm.documentName}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                  >
                    {isUploadingEngineerDoc ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File & Upload
                      </>
                    )}
                  </Button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={engineerDocSearch}
                    onChange={(e) => setEngineerDocSearch(e.target.value)}
                    placeholder="Search documents..."
                    className="pl-9"
                  />
                </div>

                {/* Documents List */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700">My Documents ({engineerDocuments.length})</h4>
                  {engineerDocuments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No personal documents uploaded yet</p>
                    </div>
                  ) : (
                    engineerDocuments.map((doc: any) => (
                      <div key={doc.id} className="bg-white rounded-lg p-3 shadow-sm border flex items-start gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.document_name}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(doc.created_at).toLocaleDateString('en-GB')} • {doc.file_name}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewingDocument({
                              url: doc.file_url,
                              name: doc.document_name,
                              type: doc.mime_type || ''
                            })}
                            className="h-8 w-8 p-0 text-blue-600"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(doc.file_url, '_blank')}
                            className="h-8 w-8 p-0 text-teal-600"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteEngineerDocument(doc.id)}
                            className="h-8 w-8 p-0 text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Document View Modal */}
            <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
                <DialogHeader className="p-4 border-b">
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-teal-600" />
                    {viewingDocument?.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="p-4 overflow-auto max-h-[70vh]">
                  {viewingDocument?.type?.startsWith('image/') ? (
                    <img 
                      src={viewingDocument.url} 
                      alt={viewingDocument.name}
                      className="max-w-full h-auto mx-auto rounded-lg"
                    />
                  ) : viewingDocument?.type === 'application/pdf' ? (
                    <iframe
                      src={viewingDocument.url}
                      className="w-full h-[60vh] border rounded-lg"
                      title={viewingDocument.name}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                      <Button
                        onClick={() => window.open(viewingDocument?.url, '_blank')}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Complaint Detail Dialog */}
      <Dialog open={!!selectedComplaint} onOpenChange={() => { setSelectedComplaint(null); setEngineerNote(''); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              {selectedComplaint?.complaint_id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedComplaint && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  selectedComplaint.status === 'resolved' ? 'bg-green-100 text-green-700' :
                  selectedComplaint.status === 'in_progress' ? 'bg-teal-100 text-teal-700' :
                  selectedComplaint.status === 'under_investigation' ? 'bg-yellow-100 text-yellow-700' :
                  selectedComplaint.status === 'review' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedComplaint.status === 'in_progress' ? 'In Progress' :
                   selectedComplaint.status === 'under_investigation' ? 'Under Investigation' :
                   selectedComplaint.status === 'review' ? 'Review' :
                   selectedComplaint.status === 'resolved' ? 'Resolved' : 'Pending'}
                </span>
                {selectedComplaint.is_locked && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">🔒 Locked</span>
                )}
              </div>

              {/* Complaint Info */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div>
                  <span className="text-xs text-gray-500">Subject:</span>
                  <p className="font-medium text-sm">{selectedComplaint.subject}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Category:</span>
                  <p className="text-sm">{selectedComplaint.category}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Description:</span>
                  <p className="text-sm text-gray-700">{selectedComplaint.description}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Created:</span>
                  <p className="text-sm">{new Date(selectedComplaint.created_at).toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Update History */}
              <div className="border rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  📜 Update History
                </h4>
                {selectedComplaint.status_history && selectedComplaint.status_history.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedComplaint.status_history.map((history: any, index: number) => (
                      <div key={index} className={`border-l-2 pl-3 py-2 ${history.isEngineerNote ? 'border-teal-300 bg-teal-50' : 'border-orange-300 bg-orange-50'} rounded-r`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            history.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            history.status === 'in_progress' ? 'bg-teal-100 text-teal-700' :
                            history.status === 'under_investigation' ? 'bg-yellow-100 text-yellow-700' :
                            history.status === 'review' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {history.status === 'in_progress' ? 'In Progress' :
                             history.status === 'under_investigation' ? 'Under Investigation' :
                             history.status === 'review' ? 'Review' :
                             history.status === 'resolved' ? 'Resolved' : 'Pending'}
                          </span>
                          <span className="text-xs text-gray-500">by {history.changedByName}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(history.changedAt).toLocaleString('en-IN')}
                        </div>
                        {history.note && (
                          <p className="text-sm text-gray-700 mt-1 bg-white p-2 rounded border">
                            {history.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No updates yet</p>
                )}
              </div>

              {/* Engineer Note Input (only if not locked) */}
              {!selectedComplaint.is_locked && (
                <div className="border rounded-lg p-3 bg-teal-50">
                  <h4 className="font-semibold text-sm mb-2 text-teal-700">✏️ Add Your Note</h4>
                  <Textarea
                    value={engineerNote}
                    onChange={(e) => setEngineerNote(e.target.value)}
                    placeholder="Add your update or note here..."
                    className="bg-white text-sm"
                    rows={3}
                  />
                  <Button
                    onClick={handleSubmitEngineerNote}
                    disabled={!engineerNote.trim() || isSubmittingNote}
                    className="mt-2 w-full bg-teal-600 hover:bg-teal-700"
                    size="sm"
                  >
                    {isSubmittingNote ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Note
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Close Button */}
              <Button
                variant="outline"
                onClick={() => { setSelectedComplaint(null); setEngineerNote(''); }}
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ACTIVITY TAB - Scheduled Maintenance Tasks */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          {/* Dashboard Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                📅 My Activities
              </h2>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => refetchActivities()}
                disabled={isLoadingActivities}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                {isLoadingActivities ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div 
                onClick={() => setActivityFilter('scheduled')}
                className={`bg-white/10 rounded-lg p-3 text-center cursor-pointer transition-all ${activityFilter === 'scheduled' ? 'ring-2 ring-white bg-white/25' : 'hover:bg-white/15'}`}
              >
                <p className="text-2xl font-bold">
                  {scheduledActivities.filter((a: any) => a.status === 'scheduled').length}
                </p>
                <p className="text-xs opacity-90">Scheduled</p>
              </div>
              <div 
                onClick={() => setActivityFilter('in_progress')}
                className={`bg-white/10 rounded-lg p-3 text-center cursor-pointer transition-all ${activityFilter === 'in_progress' ? 'ring-2 ring-white bg-white/25' : 'hover:bg-white/15'}`}
              >
                <p className="text-2xl font-bold">
                  {scheduledActivities.filter((a: any) => a.status === 'in_progress').length}
                </p>
                <p className="text-xs opacity-90">In Progress</p>
              </div>
              <div 
                onClick={() => setActivityFilter('completed')}
                className={`bg-white/10 rounded-lg p-3 text-center cursor-pointer transition-all ${activityFilter === 'completed' ? 'ring-2 ring-white bg-white/25' : 'hover:bg-white/15'}`}
              >
                <p className="text-2xl font-bold">
                  {scheduledActivities.filter((a: any) => a.status === 'completed').length}
                </p>
                <p className="text-xs opacity-90">Completed</p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActivityFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activityFilter === 'all' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({scheduledActivities.length})
            </button>
            <button
              onClick={() => setActivityFilter('scheduled')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activityFilter === 'scheduled' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              📋 Scheduled
            </button>
            <button
              onClick={() => setActivityFilter('in_progress')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activityFilter === 'in_progress' 
                  ? 'bg-yellow-500 text-white shadow-md' 
                  : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
              }`}
            >
              🔄 In Progress
            </button>
            <button
              onClick={() => setActivityFilter('completed')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activityFilter === 'completed' 
                  ? 'bg-green-600 text-white shadow-md' 
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              ✅ Completed
            </button>
          </div>

          {isLoadingActivities ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : scheduledActivities.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <ClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No activities assigned to you</p>
              <p className="text-gray-400 text-sm mt-1">Activities will appear here when assigned</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledActivities
                .filter((activity: any) => activityFilter === 'all' || activity.status === activityFilter)
                .map((activity: any) => (
                <div 
                  key={activity.id} 
                  className={`bg-white rounded-xl border-2 shadow-sm overflow-hidden transition-all hover:shadow-md ${
                    activity.status === 'completed' ? 'border-green-200' :
                    activity.status === 'in_progress' ? 'border-yellow-200' :
                    'border-blue-200'
                  }`}
                >
                  {/* Card Header with Status Bar */}
                  <div className={`px-4 py-2 ${
                    activity.status === 'completed' ? 'bg-green-50' :
                    activity.status === 'in_progress' ? 'bg-yellow-50' :
                    'bg-blue-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          activity.status === 'completed' ? 'bg-green-500' :
                          activity.status === 'in_progress' ? 'bg-yellow-500 animate-pulse' :
                          'bg-blue-500'
                        }`}></span>
                        <span className={`text-xs font-bold uppercase tracking-wide ${
                          activity.status === 'completed' ? 'text-green-700' :
                          activity.status === 'in_progress' ? 'text-yellow-700' :
                          'text-blue-700'
                        }`}>
                          {activity.status === 'in_progress' ? 'In Progress' : activity.status}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        activity.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        activity.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {activity.priority}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-base mb-2">{activity.title}</h3>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <span className="font-medium text-gray-500">ID:</span>
                        <button 
                          onClick={() => setSelectedActivityDetail(activity)}
                          className="text-purple-600 hover:text-purple-800 font-medium hover:underline"
                        >
                          {activity.task_id}
                        </button>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <span>📅</span>
                        <span>{new Date(activity.scheduled_date).toLocaleDateString('en-GB')}</span>
                      </div>
                      {activity.tower_name && (
                        <div className="flex items-center gap-1 text-gray-600 col-span-2">
                          <span>📍</span>
                          <span className="font-medium">{activity.tower_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-gray-600 col-span-2">
                        <span>🔧</span>
                        <span>{activity.type?.replace(/_/g, ' ')}</span>
                      </div>
                    </div>

                    {activity.description && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg mb-3">
                        {activity.description}
                      </p>
                    )}

                    {activity.notes && (
                      <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 mb-3">
                        <p className="text-xs font-semibold text-amber-800 mb-1">📝 Activity Log:</p>
                        <p className="text-xs text-amber-700 whitespace-pre-wrap">{activity.notes}</p>
                      </div>
                    )}

                    {/* Simple Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      {activity.status === 'scheduled' && (
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={isUpdatingActivity === activity.id}
                          onClick={() => setActivityActionModal({ activity, action: 'start' })}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start Work
                        </Button>
                      )}
                      {activity.status === 'in_progress' && (
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={isUpdatingActivity === activity.id}
                          onClick={() => setActivityActionModal({ activity, action: 'complete' })}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      )}
                      {activity.status === 'completed' && (
                        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Done
                        </span>
                      )}
                      
                      {/* Dropdown for more actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="ml-auto">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedActivityDetail(activity)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {(activity.status === 'scheduled' || activity.status === 'in_progress') && (
                            <DropdownMenuItem onClick={() => setActivityActionModal({ activity, action: 'remark' })}>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Add Remark
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Empty state when filter returns no results */}
              {scheduledActivities.filter((a: any) => activityFilter === 'all' || a.status === activityFilter).length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <p className="text-gray-500">No {activityFilter === 'all' ? '' : activityFilter.replace('_', ' ')} activities</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Activity Detail Modal */}
      <Dialog open={!!selectedActivityDetail} onOpenChange={() => setSelectedActivityDetail(null)}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              📋 Activity Details
            </DialogTitle>
          </DialogHeader>
          {selectedActivityDetail && (
            <div className="space-y-4">
              {/* Status & Priority */}
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  selectedActivityDetail.status === 'completed' ? 'bg-green-100 text-green-700' :
                  selectedActivityDetail.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {selectedActivityDetail.status === 'in_progress' ? 'In Progress' : 
                   selectedActivityDetail.status?.charAt(0).toUpperCase() + selectedActivityDetail.status?.slice(1)}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedActivityDetail.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                  selectedActivityDetail.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                  selectedActivityDetail.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedActivityDetail.priority} priority
                </span>
              </div>

              {/* Task Info Grid */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Task ID</p>
                    <p className="font-bold text-purple-600">{selectedActivityDetail.task_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Type</p>
                    <p className="font-medium">{selectedActivityDetail.type?.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Scheduled Date</p>
                    <p className="font-medium">{new Date(selectedActivityDetail.scheduled_date).toLocaleDateString('en-GB')}</p>
                  </div>
                  {selectedActivityDetail.scheduled_time && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Time</p>
                      <p className="font-medium">{selectedActivityDetail.scheduled_time}</p>
                    </div>
                  )}
                  {selectedActivityDetail.tower_name && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 font-medium">Location</p>
                      <p className="font-medium">📍 {selectedActivityDetail.tower_name}</p>
                    </div>
                  )}
                  {selectedActivityDetail.estimated_duration && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Est. Duration</p>
                      <p className="font-medium">{selectedActivityDetail.estimated_duration}</p>
                    </div>
                  )}
                </div>
                
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500 font-medium">Title</p>
                  <p className="font-semibold text-gray-900">{selectedActivityDetail.title}</p>
                </div>
                
                {selectedActivityDetail.description && (
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 font-medium">Description</p>
                    <p className="text-sm text-gray-700">{selectedActivityDetail.description}</p>
                  </div>
                )}
              </div>

              {/* Activity Log */}
              <div className="border rounded-xl p-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  📝 Activity Log & Remarks
                </h4>
                {selectedActivityDetail.notes ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                      {selectedActivityDetail.notes}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No activity log recorded yet</p>
                )}
              </div>

              {/* Timeline */}
              <div className="border rounded-xl p-4">
                <h4 className="font-semibold text-sm mb-3">📅 Timeline</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-500">Created:</span>
                    <span>{new Date(selectedActivityDetail.created_at).toLocaleString('en-IN')}</span>
                  </div>
                  {selectedActivityDetail.updated_at && selectedActivityDetail.updated_at !== selectedActivityDetail.created_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-500">Updated:</span>
                      <span>{new Date(selectedActivityDetail.updated_at).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {selectedActivityDetail.completed_date && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-500">Completed:</span>
                      <span>{new Date(selectedActivityDetail.completed_date).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={() => setSelectedActivityDetail(null)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Activity Action Modal (Start/Complete/Remark) */}
      <Dialog open={!!activityActionModal} onOpenChange={() => setActivityActionModal(null)}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activityActionModal?.action === 'start' && <><Play className="w-5 h-5 text-blue-600" /> Start Work</>}
              {activityActionModal?.action === 'complete' && <><CheckCircle className="w-5 h-5 text-green-600" /> Complete Activity</>}
              {activityActionModal?.action === 'remark' && <><MessageSquare className="w-5 h-5 text-purple-600" /> Add Remark</>}
            </DialogTitle>
          </DialogHeader>
          {activityActionModal && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-900">{activityActionModal.activity.title}</p>
                <p className="text-xs text-gray-500 mt-1">Task ID: {activityActionModal.activity.task_id}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Your Remarks (Optional)</Label>
                <Textarea
                  placeholder="Enter your observations, notes, or findings..."
                  value={activityRemarks[activityActionModal.activity.id] || ''}
                  onChange={(e) => setActivityRemarks(prev => ({...prev, [activityActionModal.activity.id]: e.target.value}))}
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setActivityActionModal(null)}
                >
                  Cancel
                </Button>
                <Button 
                  className={`flex-1 ${
                    activityActionModal.action === 'start' ? 'bg-blue-600 hover:bg-blue-700' :
                    activityActionModal.action === 'complete' ? 'bg-green-600 hover:bg-green-700' :
                    'bg-purple-600 hover:bg-purple-700'
                  }`}
                  disabled={isUpdatingActivity === activityActionModal.activity.id}
                  onClick={async () => {
                    const activity = activityActionModal.activity;
                    const action = activityActionModal.action;
                    setIsUpdatingActivity(activity.id);
                    
                    try {
                      const remarks = activityRemarks[activity.id] || '';
                      let newStatus = activity.status;
                      let actionText = '';
                      
                      if (action === 'start') {
                        newStatus = 'in_progress';
                        actionText = '▶️ Started';
                      } else if (action === 'complete') {
                        newStatus = 'completed';
                        actionText = '✅ Completed';
                      } else {
                        actionText = '📝 Remark added';
                      }
                      
                      const newNotes = activity.notes 
                        ? `${activity.notes}\n\n[${new Date().toLocaleString('en-IN')}] ${actionText} by ${user?.username}${remarks ? `\nRemarks: ${remarks}` : ''}`
                        : `[${new Date().toLocaleString('en-IN')}] ${actionText} by ${user?.username}${remarks ? `\nRemarks: ${remarks}` : ''}`;
                      
                      await apiRequest('PUT', `/api/isp/maintenance/${activity.id}`, {
                        status: newStatus,
                        notes: newNotes
                      });
                      
                      toast({ 
                        title: action === 'start' ? '🚀 Work Started!' : 
                               action === 'complete' ? '🎉 Activity Completed!' : 
                               '📝 Remark Added!',
                        description: action === 'start' ? 'Status updated to In Progress' :
                                     action === 'complete' ? 'Great work!' :
                                     'Your remark has been saved'
                      });
                      
                      setActivityRemarks(prev => ({...prev, [activity.id]: ''}));
                      setActivityActionModal(null);
                      refetchActivities();
                    } catch (err) {
                      toast({ title: 'Error', description: 'Failed to update activity', variant: 'destructive' });
                    } finally {
                      setIsUpdatingActivity(null);
                    }
                  }}
                >
                  {isUpdatingActivity === activityActionModal.activity.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : null}
                  {activityActionModal.action === 'start' ? 'Start Work' :
                   activityActionModal.action === 'complete' ? 'Mark Complete' : 
                   'Save Remark'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-40">
        <div className="flex justify-around py-2">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 py-2 px-1 ${activeTab === 'home' ? 'text-teal-600' : 'text-gray-600'}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[8px] font-medium">Home</span>
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`flex flex-col items-center gap-1 py-2 px-1 ${activeTab === 'tasks' ? 'text-teal-600' : 'text-gray-600'}`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[8px] font-medium">Tasks</span>
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`flex flex-col items-center gap-1 py-2 px-1 ${activeTab === 'activity' ? 'text-purple-600' : 'text-gray-600'}`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[8px] font-medium">Activity</span>
          </button>
          <button 
            onClick={() => setActiveTab('complaint')}
            className={`flex flex-col items-center gap-1 py-2 px-1 ${activeTab === 'complaint' ? 'text-orange-600' : 'text-gray-600'}`}
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="text-[8px] font-medium">Complaint</span>
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center gap-1 py-2 px-1 ${activeTab === 'reports' ? 'text-teal-600' : 'text-gray-600'}`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[8px] font-medium">Reports</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 py-2 px-1 ${activeTab === 'profile' ? 'text-teal-600' : 'text-gray-600'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[8px] font-medium">Profile</span>
          </button>
        </div>
      </nav>

      {/* Task Details Modal */}
      <Dialog open={!!selectedTaskId} onOpenChange={() => setSelectedTaskId(null)}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden p-4">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex flex-wrap justify-between items-center gap-2">
                <Badge className={`${getStatusColor(selectedTask.status)} text-xs`}>
                  {selectedTask.status}
                </Badge>
                <Badge className={`${getPriorityColor(selectedTask.priority)} text-xs`}>
                  {selectedTask.priority} P
                </Badge>
              </div>

              {/* Task Info */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 overflow-hidden">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600">Ticket:</span>
                  <span className="font-semibold text-teal-600 text-sm break-all">
                    {selectedTask.ticketNumber}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600">Customer:</span>
                  <span className="font-semibold text-sm break-words">{selectedTask.customerName}</span>
                </div>
                {/* Customer Phone */}
                {selectedTask.customer?.mobilePhone && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600">Phone:</span>
                    <a href={`tel:${selectedTask.customer.mobilePhone}`} className="font-semibold text-teal-600 text-sm">
                      {selectedTask.customer.mobilePhone}
                    </a>
                  </div>
                )}
                {/* Customer Address */}
                {(selectedTask.customer?.address || selectedTask.customer?.city) && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600">Address:</span>
                    <span className="font-semibold text-sm break-words">
                      {[selectedTask.customer?.address, selectedTask.customer?.city, selectedTask.customer?.state]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600">Due Date:</span>
                  <span className="font-semibold text-sm">
                    {selectedTask.dueDate && new Date(selectedTask.dueDate).getFullYear() > 1970 
                      ? new Date(selectedTask.dueDate).toLocaleDateString() 
                      : 'Not Set'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-gray-700">{selectedTask.description}</p>
              </div>

              {/* Update Status */}
              <div className="space-y-3">
                <h4 className="font-semibold">Update Status</h4>
                {(selectedTask.status === 'completed' || selectedTask.status === 'approved' || selectedTask.status === 'cancelled') ? (
                  <div className={`${selectedTask.status === 'approved' ? 'bg-purple-50 border-purple-200' : selectedTask.status === 'cancelled' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border rounded-lg p-4 text-center`}>
                    <CheckCircle className={`w-8 h-8 ${selectedTask.status === 'approved' ? 'text-purple-600' : selectedTask.status === 'cancelled' ? 'text-red-600' : 'text-green-600'} mx-auto mb-2`} />
                    <p className={`${selectedTask.status === 'approved' ? 'text-purple-700' : selectedTask.status === 'cancelled' ? 'text-red-700' : 'text-green-700'} font-medium`}>
                      Task {selectedTask.status === 'approved' ? 'Approved' : selectedTask.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                    </p>
                    <p className={`${selectedTask.status === 'approved' ? 'text-purple-600' : selectedTask.status === 'cancelled' ? 'text-red-600' : 'text-green-600'} text-sm mt-1`}>
                      This task has been {selectedTask.status === 'approved' ? 'approved' : selectedTask.status === 'cancelled' ? 'cancelled' : 'completed'} and cannot be modified.
                    </p>
                  </div>
                ) : (
                  <>
                    <Select value={taskStatus} onValueChange={setTaskStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>

                    <Textarea
                      placeholder="Add notes about this update..."
                      value={updateNotes}
                      onChange={(e) => setUpdateNotes(e.target.value)}
                      rows={3}
                    />

                    <Button
                      onClick={handleUpdateTask}
                      className="w-full"
                      disabled={!taskStatus}
                    >
                      Update Status
                    </Button>
                  </>
                )}
              </div>

              {/* Upload Files */}
              <div className="space-y-3">
                <h4 className="font-semibold">Upload Files</h4>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCameraCapture}
                    variant="outline"
                    className="flex-1"
                    disabled={isUploadingFiles}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Camera
                  </Button>
                  <Button
                    onClick={handleGallerySelect}
                    variant="outline"
                    className="flex-1"
                    disabled={isUploadingFiles}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Gallery
                  </Button>
                </div>

                {/* Upload Progress Bar */}
                {isUploadingFiles && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-teal-600 border-t-transparent"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-teal-700">Uploading...</p>
                        <p className="text-xs text-teal-600 truncate">{currentUploadFile}</p>
                      </div>
                      <span className="text-lg font-bold text-teal-700">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-teal-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-teal-500 to-cyan-600 h-3 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-teal-600 text-center">
                      {uploadProgress < 50 ? 'Reading files...' : uploadProgress < 95 ? 'Uploading to server...' : 'Finishing up...'}
                    </p>
                  </div>
                )}

                {uploadFiles.length > 0 && !isUploadingFiles && (
                  <div className="space-y-2 overflow-hidden">
                    {uploadFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded gap-2 overflow-hidden"
                      >
                        <span className="text-xs truncate flex-1 min-w-0">{file.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-shrink-0"
                          onClick={() =>
                            setUploadFiles(uploadFiles.filter((_, i) => i !== idx))
                          }
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div>
                      <Button
                        onClick={() => selectedTask && uploadFilesToServer(selectedTask.id)}
                        className="w-full mt-2"
                        disabled={!selectedTask || uploadFiles.length === 0 || isUploadingFiles}
                      >
                        Upload Files
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Task History */}
              <div className="space-y-3 overflow-hidden">
                <h4 className="font-semibold text-sm">Task History</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto overflow-x-hidden">
                  {taskUpdates.map((update) => (
                    <div
                      key={update.id}
                      className="bg-gray-50 p-2 rounded-lg border-l-4 border-teal-500 overflow-hidden"
                    >
                      <div className="flex flex-wrap justify-between items-start gap-1 mb-1">
                        <span className="font-medium text-xs">
                          {update.createdByName}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(update.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 break-all whitespace-pre-wrap">{update.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Success Popup */}
      <AlertDialog open={showUploadSuccess} onOpenChange={setShowUploadSuccess}>
        <AlertDialogContent className="w-[85vw] max-w-sm rounded-lg">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <AlertDialogTitle className="text-center text-xl">Upload Successful!</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              {uploadSuccessCount} file{uploadSuccessCount > 1 ? 's' : ''} uploaded successfully.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center sm:justify-center">
            <AlertDialogAction 
              onClick={() => setShowUploadSuccess(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-lg"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
