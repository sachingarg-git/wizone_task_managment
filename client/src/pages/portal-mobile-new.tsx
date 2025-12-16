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
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Geolocation } from '@capacitor/geolocation';
import { Camera as CapacitorCamera } from '@capacitor/camera';

// Detect mobile environment
const isCapacitor = Capacitor.isNativePlatform();
const API_BASE_URL = isCapacitor ? 'http://103.122.85.61:3007' : '';

// Helper to resolve URLs for mobile
function resolveUrl(path: string): string {
  return isCapacitor && path.startsWith('/') ? `${API_BASE_URL}${path}` : path;
}

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

  // Active tab for bottom navigation: 'home' | 'tasks' | 'reports' | 'dailyreport' | 'complaint' | 'profile'
  const [activeTab, setActiveTab] = useState<'home' | 'tasks' | 'reports' | 'dailyreport' | 'complaint' | 'profile'>('home');
  
  // Sync/refresh loading state
  const [isSyncing, setIsSyncing] = useState(false);

  // Task filter for Tasks tab
  const [taskFilter, setTaskFilter] = useState('all');

  // Daily Report form state
  const [dailyReportForm, setDailyReportForm] = useState({
    sitesVisited: 0,
    workDone: '',
    sitesCompleted: 0,
    completedSitesNames: '',
    incompleteSitesNames: '',
    reasonNotDone: '',
    hasIssue: false,
    issueDetails: ''
  });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Complaint form state (existing support ticket form)
  const [complaintForm, setComplaintForm] = useState({
    mobile: '',
    complaintType: '',
    department: '',
    complaintDetails: ''
  });
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  // NEW Complaint form state (for new complaint management system)
  const [newComplaintForm, setNewComplaintForm] = useState({
    subject: '',
    description: '',
    category: ''
  });
  const [isSubmittingNewComplaint, setIsSubmittingNewComplaint] = useState(false);

  // Fetch my complaints
  const { data: myComplaints = [], refetch: refetchComplaints } = useQuery<any[]>({
    queryKey: ["/api/complaints/my"],
  });

  // Fetch tasks
  const { data: tasks = [], isLoading, refetch } = useQuery<Task[]>({
    queryKey: ["/api/tasks/my-tasks"],
  });

  // Filtered tasks based on status filter
  const filteredTasks = taskFilter === 'all' 
    ? tasks 
    : tasks.filter(t => t.status === taskFilter);

  // WebSocket ref for mobile real-time notifications
  const wsRef = useRef<WebSocket | null>(null);
  const [isWsConnected, setIsWsConnected] = useState(false);

  // Profile modal state (now used for profile tab)
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Permission dialog state
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState({
    notifications: false,
    location: false,
    camera: false
  });

  // Load profile when profile tab is active
  useEffect(() => {
    if (activeTab === 'profile' && !profileData && !profileLoading) {
      setProfileLoading(true);
      apiRequest('GET', '/api/profile')
        .then((p) => setProfileData(p))
        .catch((err) => {
          console.error('Failed to load profile', err);
          toast({ title: 'Failed to load profile' });
        })
        .finally(() => setProfileLoading(false));
    }
  }, [activeTab, profileData, profileLoading]);

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
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
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
      const response = await fetch(`${API_BASE_URL}/api/daily-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dailyReportForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit report');
      }

      toast({ title: '✅ Daily report submitted successfully!' });
      
      // Reset form
      setDailyReportForm({
        sitesVisited: 0,
        workDone: '',
        sitesCompleted: 0,
        completedSitesNames: '',
        incompleteSitesNames: '',
        reasonNotDone: '',
        hasIssue: false,
        issueDetails: ''
      });
    } catch (err: any) {
      toast({ title: err.message || 'Failed to submit report', variant: 'destructive' });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Submit complaint (original support ticket form)
  const handleSubmitComplaint = async () => {
    if (!complaintForm.complaintType) {
      toast({ title: 'Please select complaint type', variant: 'destructive' });
      return;
    }
    if (!complaintForm.complaintDetails.trim()) {
      toast({ title: 'Please enter complaint details', variant: 'destructive' });
      return;
    }

    setIsSubmittingComplaint(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/support-tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(complaintForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit complaint');
      }

      const result = await response.json();
      toast({ 
        title: '✅ Complaint submitted successfully!',
        description: `Ticket ID: ${result.ticket_id || result.ticketId}`
      });
      
      // Reset form
      setComplaintForm({
        mobile: '',
        complaintType: '',
        department: '',
        complaintDetails: ''
      });
    } catch (err: any) {
      toast({ title: err.message || 'Failed to submit complaint', variant: 'destructive' });
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  // Submit NEW complaint (for new complaint management system)
  const handleSubmitNewComplaint = async () => {
    if (!newComplaintForm.category) {
      toast({ title: 'Please select category', variant: 'destructive' });
      return;
    }
    if (!newComplaintForm.subject.trim()) {
      toast({ title: 'Please enter subject', variant: 'destructive' });
      return;
    }
    if (!newComplaintForm.description.trim()) {
      toast({ title: 'Please enter description', variant: 'destructive' });
      return;
    }

    setIsSubmittingNewComplaint(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subject: newComplaintForm.subject,
          description: newComplaintForm.description,
          category: newComplaintForm.category
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit complaint');
      }

      const result = await response.json();
      toast({ 
        title: '✅ Complaint submitted successfully!',
        description: `Complaint ID: ${result.complaintId}`
      });
      
      // Reset form
      setNewComplaintForm({
        subject: '',
        description: '',
        category: ''
      });
      
      // Refresh complaints list
      refetchComplaints();
    } catch (err: any) {
      toast({ title: err.message || 'Failed to submit complaint', variant: 'destructive' });
    } finally {
      setIsSubmittingNewComplaint(false);
    }
  };

  // Get complaint status color
  const getComplaintStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'under_investigation': return 'bg-purple-100 text-purple-800';
      case 'review': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get complaint status label
  const getComplaintStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'under_investigation': return 'Under Investigation';
      case 'review': return 'Review';
      case 'resolved': return 'Resolved';
      default: return status;
    }
  };

  // Show permission dialog after user logs in
  useEffect(() => {
    if (isCapacitor && user) {
      // Check if we've already asked for permissions
      const hasAskedPermissions = localStorage.getItem('permissions_requested');
      if (!hasAskedPermissions) {
        // Show permission dialog after a short delay
        setTimeout(() => {
          setShowPermissionDialog(true);
        }, 1000);
      } else {
        // Just check permissions status
        checkPermissionsStatus();
      }

      // Listen for local notification actions (when user taps notification)
      LocalNotifications.addListener('localNotificationActionPerformed', (action: any) => {
        console.log('👆 Local notification action:', action);
        const data = action.notification?.extra;
        if (data?.taskId) {
          setSelectedTaskId(parseInt(data.taskId));
        }
      });
    }
  }, [user]);

  // Check current permissions status
  const checkPermissionsStatus = async () => {
    if (!isCapacitor) return;

    try {
      // Check notifications
      const notifResult = await LocalNotifications.checkPermissions();
      const hasNotif = notifResult.display === 'granted';

      // Check location
      const locResult = await Geolocation.checkPermissions();
      const hasLoc = locResult.location === 'granted' || locResult.coarseLocation === 'granted';

      // Check camera
      const camResult = await CapacitorCamera.checkPermissions();
      const hasCam = camResult.camera === 'granted' || camResult.photos === 'granted';

      setPermissionsGranted({
        notifications: hasNotif,
        location: hasLoc,
        camera: hasCam
      });

      console.log('📋 Permissions status:', { notifications: hasNotif, location: hasLoc, camera: hasCam });
    } catch (err) {
      console.error('Error checking permissions:', err);
    }
  };

  // Request all permissions
  const requestAllPermissions = async () => {
    if (!isCapacitor) return;

    try {
      toast({ title: '🔐 Requesting Permissions', description: 'Please allow all permissions for best experience' });

      // 1. Request Notifications
      console.log('📢 Requesting notification permission...');
      const notifResult = await LocalNotifications.requestPermissions();
      const hasNotif = notifResult.display === 'granted';
      console.log('📢 Notification result:', hasNotif);

      // 2. Request Location
      console.log('📍 Requesting location permission...');
      const locResult = await Geolocation.requestPermissions();
      const hasLoc = locResult.location === 'granted' || locResult.coarseLocation === 'granted';
      console.log('📍 Location result:', hasLoc);

      // 3. Request Camera (includes photo gallery access)
      console.log('📷 Requesting camera permission...');
      const camResult = await CapacitorCamera.requestPermissions();
      const hasCam = camResult.camera === 'granted' || camResult.photos === 'granted';
      console.log('📷 Camera result:', hasCam);

      setPermissionsGranted({
        notifications: hasNotif,
        location: hasLoc,
        camera: hasCam
      });

      // Mark as requested
      localStorage.setItem('permissions_requested', 'true');
      setShowPermissionDialog(false);

      if (hasNotif && hasLoc && hasCam) {
        toast({ title: '✅ All Permissions Granted', description: 'You will receive notifications for new tasks!' });
      } else {
        toast({ 
          title: '⚠️ Some Permissions Denied', 
          description: 'You can enable them later in phone Settings → Apps → WIZONE',
          duration: 8000
        });
      }
    } catch (err) {
      console.error('Error requesting permissions:', err);
      toast({ title: '❌ Permission Error', description: 'Please enable permissions manually in Settings' });
      setShowPermissionDialog(false);
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
            const taskId = msg.task?.id;

            // Vibrate device if supported (mobile only)
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]); // vibrate pattern
            }

            // Show LOCAL NOTIFICATION (works even when app is closed/background)
            if (isCapacitor) {
              LocalNotifications.schedule({
                notifications: [
                  {
                    title,
                    body,
                    id: taskId || Date.now(),
                    schedule: { at: new Date(Date.now() + 100) }, // show immediately
                    sound: 'default',
                    smallIcon: 'ic_stat_icon_config_sample',
                    iconColor: '#488AFF',
                    extra: { taskId } // Pass data to handle tap
                  }
                ]
              }).then(() => {
                console.log('✅ Local notification scheduled');
              }).catch((err: any) => {
                console.error('❌ Local notification error:', err);
              });
            } else {
              // Fallback to browser notifications
              if (window.Notification && Notification.permission === 'granted') {
                const n = new Notification(title, { 
                  body,
                  icon: '/mobile/assets/icon.png',
                  badge: '/mobile/assets/icon.png',
                  tag: `task-${taskId}`,
                  requireInteraction: true
                });
                n.onclick = () => {
                  window.focus();
                  if (taskId) setSelectedTaskId(taskId);
                };
              } else if (window.Notification && Notification.permission !== 'denied') {
                Notification.requestPermission().then((perm) => {
                  if (perm === 'granted') {
                    new Notification(title, { body });
                  }
                });
              }
            }

            // Also show in-app toast with sound
            toast({ 
              title, 
              description: body,
              duration: 5000 
            });
            
            // Refresh tasks to show new assignment
            refetch();
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

  // Upload collected files to server (base64 encode and send)
  const uploadFilesToServer = async (taskId: number, note?: string) => {
    if (!taskId) return;
    if (uploadFiles.length === 0) {
      toast({ title: 'No files selected' });
      return;
    }

    try {
      toast({ title: 'Uploading files...', description: `Uploading ${uploadFiles.length} file(s)` });
      console.log('📤 Starting file upload for task:', taskId);
      
      const filesPayload: any[] = [];
      for (const file of uploadFiles) {
        console.log('📁 Processing file:', file.name, 'Size:', file.size);
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            console.log('✅ File read successfully:', file.name);
            resolve(reader.result as string);
          };
          reader.onerror = (e) => {
            console.error('❌ File read error:', e);
            reject(e);
          };
          reader.readAsDataURL(file);
        });
        filesPayload.push({ name: file.name, type: file.type, data });
      }

      console.log('📤 Sending upload request with', filesPayload.length, 'files');
      const response = await apiRequest('POST', `/api/tasks/${taskId}/upload`, { 
        files: filesPayload, 
        notes: note || `Uploaded ${filesPayload.length} file(s)`
      });
      
      console.log('✅ Upload successful');
      toast({ 
        title: 'Files uploaded successfully!', 
        description: `${uploadFiles.length} file(s) uploaded` 
      });
      
      setUploadFiles([]);
      
      // Refresh task updates to show the uploaded files
      await queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/updates`] });
      console.log('🔄 Task updates refreshed');
    } catch (err: any) {
      console.error('❌ Upload error:', err);
      toast({ 
        title: 'Upload failed', 
        description: err?.message || 'Failed to upload files. Please check network connection.',
        variant: 'destructive'
      });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div className="font-semibold text-lg">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-sm text-blue-100">{user?.role?.replace("_", " ")}</div>
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
            <h1 className="text-2xl font-bold text-blue-600">Wizone</h1>
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
            {/* User Banner */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-5 py-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl shadow-lg">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    Welcome, {user?.firstName || user?.username}
                  </h2>
                  <p className="text-sm text-blue-100">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Statistics Cards - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-4 p-5">
              {/* My Tasks */}
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-5 shadow-sm">
                <div className="text-4xl mb-2">📋</div>
                <div className="text-3xl font-bold text-blue-900">{taskStats.total}</div>
                <div className="text-sm text-blue-700 font-medium">My Tasks</div>
              </div>

              {/* Pending */}
              <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl p-5 shadow-sm">
                <div className="text-4xl mb-2">⏱️</div>
                <div className="text-3xl font-bold text-yellow-900">{taskStats.pending}</div>
                <div className="text-sm text-yellow-700 font-medium">Pending</div>
              </div>

              {/* In Progress */}
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-5 shadow-sm">
                <div className="text-4xl mb-2">🔄</div>
                <div className="text-3xl font-bold text-purple-900">{taskStats.inProgress}</div>
                <div className="text-sm text-purple-700 font-medium">In Progress</div>
              </div>

              {/* Completed */}
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-5 shadow-sm">
                <div className="text-4xl mb-2">✅</div>
                <div className="text-3xl font-bold text-green-900">{taskStats.completed}</div>
                <div className="text-sm text-green-700 font-medium">Completed</div>
              </div>
            </div>

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

              {/* Task Cards */}
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No tasks assigned</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="bg-white rounded-xl p-4 shadow-sm active:shadow-md transition-shadow cursor-pointer border border-gray-100"
                    >
                      {/* Task Header */}
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-blue-600 font-semibold text-sm">
                          {task.ticketNumber}
                        </span>
                        <Badge
                          className={`${getStatusColor(task.status)} text-xs px-2 py-1`}
                        >
                          {task.status}
                        </Badge>
                      </div>

                      {/* Task Title */}
                      <h4 className="font-semibold text-gray-900 mb-1 text-base">
                        {task.title}
                      </h4>

                      {/* Customer Name */}
                      <div className="flex items-center gap-2 text-gray-700 mb-1">
                        <User className="w-4 h-4" />
                        <span className="font-medium text-sm">{task.customerName}</span>
                      </div>

                      {/* Customer Address (if available) */}
                      {task.customer?.address && (
                        <div className="text-xs text-gray-500 mb-2 pl-6">
                          📍 {[task.customer.address, task.customer.city].filter(Boolean).join(', ')}
                        </div>
                      )}

                      {/* Task Details */}
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          📅 {task.dueDate && new Date(task.dueDate).getFullYear() > 1970 
                            ? new Date(task.dueDate).toLocaleDateString() 
                            : 'Not Set'}
                        </span>
                        <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                          {task.priority}
                        </Badge>
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

            {/* Status Filter Pills */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {['all', 'pending', 'in-progress', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setTaskFilter(status)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    taskFilter === status 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Filtered Task List */}
            <div className="space-y-3">
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
                    className="bg-white rounded-xl p-4 shadow-sm active:shadow-md transition-shadow cursor-pointer border border-gray-100"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-blue-600 font-semibold text-sm">{task.ticketNumber}</span>
                      <Badge className={`${getStatusColor(task.status)} text-xs px-2 py-1`}>
                        {task.status}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <User className="w-4 h-4" />
                      <span>{task.customerName}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                      <span>📅 {task.dueDate && new Date(task.dueDate).getFullYear() > 1970 
                        ? new Date(task.dueDate).toLocaleDateString() 
                        : 'Not Set'}</span>
                      <Badge className={`${getPriorityColor(task.priority)} text-xs`}>{task.priority}</Badge>
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
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reports</h3>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                <div className="text-3xl font-bold">{monthlyCount}</div>
                <div className="text-sm opacity-90">This Month</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                <div className="text-3xl font-bold">{yearlyCount}</div>
                <div className="text-sm opacity-90">This Year</div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
              <h4 className="font-semibold text-gray-900 mb-4">Task Status Breakdown</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pending</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 rounded-full" 
                        style={{ width: `${tasks.length ? (taskStats.pending / tasks.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="font-semibold text-yellow-600 w-8 text-right">{taskStats.pending}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">In Progress</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${tasks.length ? (taskStats.inProgress / tasks.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="font-semibold text-blue-600 w-8 text-right">{taskStats.inProgress}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completed</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: `${tasks.length ? (taskStats.completed / tasks.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="font-semibold text-green-600 w-8 text-right">{taskStats.completed}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-4">Quick Stats</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
                  <div className="text-xs text-gray-500">Total Tasks</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {tasks.length ? Math.round((taskStats.completed / tasks.length) * 100) : 0}%
                  </div>
                  <div className="text-xs text-gray-500">Completion Rate</div>
                </div>
              </div>
            </div>
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
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6 text-white text-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-3xl mx-auto mb-3 shadow-lg">
                    {(profileData?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                  </div>
                  <h4 className="text-xl font-semibold">
                    {profileData?.firstName} {profileData?.lastName}
                  </h4>
                  <p className="text-blue-100 text-sm mt-1">{profileData?.role?.replace('_', ' ')}</p>
                </div>

                {/* Profile Details */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600">📧</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Email</div>
                      <div className="font-medium text-gray-900">{profileData?.email || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600">📱</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Phone</div>
                      <div className="font-medium text-gray-900">{profileData?.phone || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600">🏢</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Department</div>
                      <div className="font-medium text-gray-900">{profileData?.department || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600">👤</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Username</div>
                      <div className="font-medium text-gray-900">{profileData?.username || user?.username || 'N/A'}</div>
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
          <div className="p-5">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Daily Report</h3>
            
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-5">
              {/* Auto-filled Name */}
              <div>
                <Label className="text-gray-700 font-medium">Your Name</Label>
                <Input 
                  value={user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.username || '')}
                  disabled
                  className="mt-1 bg-gray-100 font-medium"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-filled from your profile</p>
              </div>

              {/* Sites Visited */}
              <div>
                <Label className="text-gray-700 font-medium">Sites Visited Today</Label>
                <Input 
                  type="number"
                  min="0"
                  value={dailyReportForm.sitesVisited}
                  onChange={(e) => setDailyReportForm({...dailyReportForm, sitesVisited: parseInt(e.target.value) || 0})}
                  className="mt-1"
                  placeholder="Enter number of sites visited"
                />
              </div>

              {/* Work Done */}
              <div>
                <Label className="text-gray-700 font-medium">Work Done Today <span className="text-red-500">*</span></Label>
                <Textarea 
                  value={dailyReportForm.workDone}
                  onChange={(e) => setDailyReportForm({...dailyReportForm, workDone: e.target.value})}
                  className="mt-1 min-h-[100px]"
                  placeholder="Describe the work you completed today..."
                />
              </div>

              {/* Sites Completed */}
              <div>
                <Label className="text-gray-700 font-medium">Sites Completed</Label>
                <Input 
                  type="number"
                  min="0"
                  value={dailyReportForm.sitesCompleted}
                  onChange={(e) => setDailyReportForm({...dailyReportForm, sitesCompleted: parseInt(e.target.value) || 0})}
                  className="mt-1"
                  placeholder="Enter number of sites completed"
                />
              </div>

              {/* Completed Sites Names */}
              <div>
                <Label className="text-gray-700 font-medium">Completed Sites Names</Label>
                <Textarea 
                  value={dailyReportForm.completedSitesNames}
                  onChange={(e) => setDailyReportForm({...dailyReportForm, completedSitesNames: e.target.value})}
                  className="mt-1"
                  placeholder="Enter names of completed sites (one per line)"
                />
              </div>

              {/* Incomplete Sites Names */}
              <div>
                <Label className="text-gray-700 font-medium">Incomplete Sites Names</Label>
                <Textarea 
                  value={dailyReportForm.incompleteSitesNames}
                  onChange={(e) => setDailyReportForm({...dailyReportForm, incompleteSitesNames: e.target.value})}
                  className="mt-1"
                  placeholder="Enter names of incomplete sites (one per line)"
                />
              </div>

              {/* Reason Not Done */}
              <div>
                <Label className="text-gray-700 font-medium">Reason for Incomplete Work</Label>
                <Textarea 
                  value={dailyReportForm.reasonNotDone}
                  onChange={(e) => setDailyReportForm({...dailyReportForm, reasonNotDone: e.target.value})}
                  className="mt-1"
                  placeholder="Explain why some work couldn't be completed..."
                />
              </div>

              {/* Has Issue Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-gray-700 font-medium">Any Issues Faced?</Label>
                  <p className="text-xs text-gray-500">Toggle if you encountered any problems</p>
                </div>
                <Switch 
                  checked={dailyReportForm.hasIssue}
                  onCheckedChange={(checked) => setDailyReportForm({...dailyReportForm, hasIssue: checked})}
                />
              </div>

              {/* Issue Details (shown only if hasIssue is true) */}
              {dailyReportForm.hasIssue && (
                <div>
                  <Label className="text-gray-700 font-medium">Issue Details</Label>
                  <Textarea 
                    value={dailyReportForm.issueDetails}
                    onChange={(e) => setDailyReportForm({...dailyReportForm, issueDetails: e.target.value})}
                    className="mt-1 min-h-[80px]"
                    placeholder="Describe the issues you faced..."
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button 
                onClick={handleSubmitDailyReport}
                disabled={isSubmittingReport || !dailyReportForm.workDone.trim()}
                className="w-full py-6 text-lg font-medium bg-blue-600 hover:bg-blue-700"
              >
                {isSubmittingReport ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Daily Report
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
                    value={newComplaintForm.category}
                    onChange={(e) => setNewComplaintForm({...newComplaintForm, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    value={newComplaintForm.subject}
                    onChange={(e) => setNewComplaintForm({...newComplaintForm, subject: e.target.value})}
                    placeholder="Enter complaint subject"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={newComplaintForm.description}
                    onChange={(e) => setNewComplaintForm({...newComplaintForm, description: e.target.value})}
                    placeholder="Describe your complaint in detail..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  onClick={handleSubmitNewComplaint}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3"
                  disabled={isSubmittingNewComplaint || !newComplaintForm.subject || !newComplaintForm.description || !newComplaintForm.category}
                >
                  {isSubmittingNewComplaint ? (
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
                        <span className="text-xs font-mono text-gray-500">{complaint.complaintId}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          complaint.status === 'resolved' ? 'bg-green-100 text-green-700' :
                          complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
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
                        {new Date(complaint.createdAt).toLocaleDateString('en-GB')}
                      </p>
                      {complaint.statusNote && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                          <span className="font-medium">Note:</span> {complaint.statusNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-40">
        <div className="flex justify-around py-2">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 py-2 px-2 ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-medium">Home</span>
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`flex flex-col items-center gap-1 py-2 px-2 ${activeTab === 'tasks' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[9px] font-medium">Tasks</span>
          </button>
          <button 
            onClick={() => setActiveTab('dailyreport')}
            className={`flex flex-col items-center gap-1 py-2 px-2 ${activeTab === 'dailyreport' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-[9px] font-medium">Report</span>
          </button>
          <button 
            onClick={() => setActiveTab('complaint')}
            className={`flex flex-col items-center gap-1 py-2 px-2 ${activeTab === 'complaint' ? 'text-orange-600' : 'text-gray-600'}`}
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="text-[9px] font-medium">Complaint</span>
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center gap-1 py-2 px-2 ${activeTab === 'reports' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[9px] font-medium">Reports</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 py-2 px-2 ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[9px] font-medium">Profile</span>
          </button>
        </div>
      </nav>

      {/* Task Details Modal */}
      <Dialog open={!!selectedTaskId} onOpenChange={() => setSelectedTaskId(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex justify-between items-center">
                <Badge className={getStatusColor(selectedTask.status)}>
                  {selectedTask.status}
                </Badge>
                <Badge className={getPriorityColor(selectedTask.priority)}>
                  {selectedTask.priority} Priority
                </Badge>
              </div>

              {/* Task Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Ticket:</span>
                  <span className="ml-2 font-semibold text-blue-600">
                    {selectedTask.ticketNumber}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Customer:</span>
                  <span className="ml-2 font-semibold">{selectedTask.customerName}</span>
                </div>
                {/* Customer Phone */}
                {selectedTask.customer?.mobilePhone && (
                  <div>
                    <span className="text-sm text-gray-600">Phone:</span>
                    <a href={`tel:${selectedTask.customer.mobilePhone}`} className="ml-2 font-semibold text-blue-600">
                      {selectedTask.customer.mobilePhone}
                    </a>
                  </div>
                )}
                {/* Customer Address */}
                {(selectedTask.customer?.address || selectedTask.customer?.city) && (
                  <div>
                    <span className="text-sm text-gray-600">Address:</span>
                    <span className="ml-2 font-semibold">
                      {[selectedTask.customer?.address, selectedTask.customer?.city, selectedTask.customer?.state]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-600">Due Date:</span>
                  <span className="ml-2 font-semibold">
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
              </div>

              {/* Upload Files */}
              <div className="space-y-3">
                <h4 className="font-semibold">Upload Files</h4>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCameraCapture}
                    variant="outline"
                    className="flex-1"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Camera
                  </Button>
                  <Button
                    onClick={handleGallerySelect}
                    variant="outline"
                    className="flex-1"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Gallery
                  </Button>
                </div>

                {uploadFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded"
                      >
                        <span className="text-sm truncate">{file.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
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
                        disabled={!selectedTask || uploadFiles.length === 0}
                      >
                        Upload Files
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Task History */}
              <div className="space-y-3">
                <h4 className="font-semibold">Task History</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {taskUpdates.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No updates yet
                    </div>
                  ) : (
                    taskUpdates.map((update) => {
                      // Check if this is a file upload update
                      const isFileUpload = update.type === 'file_upload' || update.message.includes('Files:');
                      const messageParts = update.message.split('\nFiles:\n');
                      const mainMessage = messageParts[0];
                      const fileLinks = messageParts[1]?.split('\n').filter(f => f.trim()) || [];

                      return (
                        <div
                          key={update.id}
                          className={`bg-gray-50 p-3 rounded-lg border-l-4 ${
                            isFileUpload ? 'border-green-500' : 'border-blue-500'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm">
                              {update.createdByName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(update.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{mainMessage}</p>
                          
                          {/* Show file links if present */}
                          {fileLinks.length > 0 && (
                            <div className="space-y-1 mt-2">
                              {fileLinks.map((link, idx) => {
                                const fileName = link.split('/').pop() || link;
                                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                                const resolvedLink = resolveUrl(link);
                                
                                return (
                                  <a
                                    key={idx}
                                    href={resolvedLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded"
                                    onClick={(e) => {
                                      // For mobile, open in browser
                                      if (isCapacitor) {
                                        e.preventDefault();
                                        window.open(resolvedLink, '_system');
                                      }
                                    }}
                                  >
                                    {isImage ? (
                                      <ImageIcon className="w-4 h-4" />
                                    ) : (
                                      <FileText className="w-4 h-4" />
                                    )}
                                    <span className="truncate flex-1">{fileName}</span>
                                    <Eye className="w-3 h-3" />
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Permission Request Dialog */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">🔐 App Permissions Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-center text-gray-600">
              To provide the best experience, this app needs access to:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl">🔔</div>
                <div>
                  <div className="font-semibold">Notifications</div>
                  <div className="text-sm text-gray-600">
                    Receive alerts when new tasks are assigned to you
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="text-2xl">📍</div>
                <div>
                  <div className="font-semibold">Location</div>
                  <div className="text-sm text-gray-600">
                    Track your location for field work and task completion
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl">📷</div>
                <div>
                  <div className="font-semibold">Camera & Gallery</div>
                  <div className="text-sm text-gray-600">
                    Take photos and upload documents for tasks
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              <strong>Important:</strong> Please tap "Allow" for all permissions when prompted.
              You can change these later in Settings → Apps → WIZONE.
            </div>

            <Button 
              onClick={requestAllPermissions} 
              className="w-full py-6 text-lg"
            >
              ✅ Grant All Permissions
            </Button>

            <Button 
              onClick={() => {
                localStorage.setItem('permissions_requested', 'true');
                setShowPermissionDialog(false);
              }} 
              variant="ghost"
              className="w-full"
            >
              Skip for now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
