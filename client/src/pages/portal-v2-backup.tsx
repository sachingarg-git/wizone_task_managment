import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User,
  Settings,
  ClipboardList,
  LogOut,
  Save,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  Camera,
  RefreshCw,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Calendar
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: string;
  fieldEngineerId: string;
  customerId: number;
  customer?: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  createdAt: string;
  updatedAt: string;
  taskUpdates?: Array<{
    id: number;
    update: string;
    status: string;
    createdAt: string;
    user: {
      username: string;
      fullName: string;
    };
  }>;
}

export default function MobilePortal() {
  const [activeTab, setActiveTab] = useState("tasks");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [updateNotes, setUpdateNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: ""
  });
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's tasks
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ["/api/tasks/my-tasks"],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds for live updates
  });

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  // Update profile
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error?.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Update task status
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my-tasks"] });
      setSelectedTask(null);
      setUpdateNotes("");
      setNewStatus("");
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      setProfileData({
        fullName: `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || ""
      });
    }
  }, [profile]);

  const handleTaskUpdate = () => {
    if (!selectedTask || !updateNotes.trim()) {
      toast({
        title: "Error",
        description: "Please enter update notes",
        variant: "destructive",
      });
      return;
    }

    const updateData: any = {
      update: updateNotes,
    };

    if (newStatus && newStatus !== selectedTask.status) {
      updateData.status = newStatus;
    }

    updateTaskMutation.mutate({ id: selectedTask.id, data: updateData });
  };

  const handleProfileSave = () => {
    const [firstName, ...lastNameParts] = profileData.fullName.trim().split(' ');
    const lastName = lastNameParts.join(' ');
    
    updateProfileMutation.mutate({
      firstName: firstName || '',
      lastName: lastName || '',
      email: profileData.email,
      phone: profileData.phone
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': 
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to access the portal</p>
          <Button onClick={() => window.location.href = "/login"}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClipboardList className="h-6 w-6" />
            <h1 className="text-lg font-semibold">Wizone Task Manager</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-white hover:bg-blue-700"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-blue-100 text-sm mt-1">
          Welcome, {user.fullName || user.username}
        </p>
      </div>

      {/* Mobile Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white border-b">
          <TabsTrigger value="tasks" className="flex items-center space-x-2">
            <ClipboardList className="h-4 w-4" />
            <span>Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="p-4 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">My Tasks</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchTasks()}
              disabled={tasksLoading}
            >
              <RefreshCw className={`h-4 w-4 ${tasksLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {tasksLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No tasks assigned to you</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => refetchTasks()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tasks.map((task: Task) => (
                <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 flex-1">
                        {task.title || task.description}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTask(task)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getStatusColor(task.status)}>
                        {task.status || 'Pending'}
                      </Badge>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority || 'Medium'} Priority
                      </Badge>
                    </div>

                    {task.customer && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3" />
                          <span>{task.customer.name}</span>
                        </div>
                        {task.customer.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-3 w-3" />
                            <span>{task.customer.phone}</span>
                          </div>
                        )}
                        {task.customer.address && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{task.customer.address}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {task.createdAt ? format(new Date(task.createdAt), 'MMM dd, yyyy') : 'N/A'}
                        </span>
                      </div>
                      <span>#{task.id}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={profileData.address}
                  onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your address"
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleProfileSave}
                disabled={updateProfileMutation.isPending}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Application Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Account Information</h3>
                <p className="text-sm text-gray-600">Username: {user.username}</p>
                <p className="text-sm text-gray-600">Role: {user.role}</p>
                <p className="text-sm text-gray-600">User ID: {user.id}</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">App Information</h3>
                <p className="text-sm text-gray-600">Version: 1.0.0</p>
                <p className="text-sm text-gray-600">Server: {window.location.origin}</p>
              </div>

              <div className="border-t pt-4">
                <Button 
                  variant="destructive" 
                  onClick={logout}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Task Detail Modal */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">
                  {selectedTask.title || selectedTask.description}
                </h3>
                <p className="text-sm text-gray-600">#{selectedTask.id}</p>
              </div>

              <div className="flex space-x-2">
                <Badge className={getStatusColor(selectedTask.status)}>
                  {selectedTask.status || 'Pending'}
                </Badge>
                <Badge className={getPriorityColor(selectedTask.priority)}>
                  {selectedTask.priority || 'Medium'} Priority
                </Badge>
              </div>

              {selectedTask.customer && (
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium mb-2">Customer Information</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Name:</strong> {selectedTask.customer.name}</p>
                    {selectedTask.customer.email && (
                      <p><strong>Email:</strong> {selectedTask.customer.email}</p>
                    )}
                    {selectedTask.customer.phone && (
                      <p><strong>Phone:</strong> {selectedTask.customer.phone}</p>
                    )}
                    {selectedTask.customer.address && (
                      <p><strong>Address:</strong> {selectedTask.customer.address}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="status">Update Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="updateNotes">Update Notes</Label>
                <Textarea
                  id="updateNotes"
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Enter update notes..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={handleTaskUpdate}
                  disabled={updateTaskMutation.isPending}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateTaskMutation.isPending ? 'Updating...' : 'Update Task'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setSelectedTask(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}