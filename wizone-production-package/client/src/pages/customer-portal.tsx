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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Eye, EyeOff, MessageSquare, Clock, CheckCircle, AlertCircle, User, LogOut, Plus, AlertTriangle, FileText, Calendar, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const [systemDetailsForm, setSystemDetailsForm] = useState({
    empId: "",
    systemName: "",
    systemConfiguration: "",
    processorName: "",
    ram: "",
    hardDisk: "",
    ssd: "",
    sharingStatus: false,
    administratorAccount: false,
    antivirusAvailable: false,
    upsAvailable: false
  });
  const { toast } = useToast();

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
      console.log('🔵 CUSTOMER PORTAL LOGIN - Making API call to:', "/api/customer/login");
      console.log('🔵 CUSTOMER PORTAL LOGIN - With credentials:', credentials);
      
      const response = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
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
    onSuccess: (customer) => {
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
    enabled: !!customerUser,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  // Fetch task history when a task is selected
  const { data: taskHistory = [] } = useQuery<any[]>({
    queryKey: [`/api/customer-portal/tasks/${selectedTask?.id}/history`],
    enabled: !!selectedTask,
    refetchInterval: 3000, // Real-time history updates every 3 seconds
  });

  // Fetch task comments
  const { data: comments = [] } = useQuery<CustomerComment[]>({
    queryKey: [`/api/customer-portal/tasks/${selectedTask?.id}/comments`],
    enabled: !!selectedTask,
  });

  // Fetch customer system details
  const { data: systemDetails = [], isLoading: systemDetailsLoading, refetch: refetchSystemDetails } = useQuery<any[]>({
    queryKey: [`/api/customer-portal/system-details`],
    enabled: !!customerUser,
  });

  // Customer task update mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const response = await fetch(`/api/customer-portal/tasks/${selectedTask?.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      const response = await fetch("/api/customer-portal/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskData,
          customerId: customerUser?.id,
        }),
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
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
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      setShowSystemDetailsForm(false);
      setSystemDetailsForm({
        empId: "",
        systemName: "",
        systemConfiguration: "",
        processorName: "",
        ram: "",
        hardDisk: "",
        ssd: "",
        sharingStatus: false,
        administratorAccount: false,
        antivirusAvailable: false,
        upsAvailable: false
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
    createSystemDetailsMutation.mutate(systemDetailsForm);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "tasks" && (
          <>
            {/* Task Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
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
                    {tasks?.filter(t => t.status !== 'completed').length || 0}
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

        {/* Tasks List */}
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
              <div className="space-y-4">
                {tasks.map((task) => (
                  <Card key={task.id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{task.title}</h3>
                          <button 
                            onClick={() => {
                              setSelectedTask(task);
                              setShowTaskDetails(true);
                            }}
                            className="text-sm text-cyan-600 hover:text-cyan-800 font-medium underline cursor-pointer"
                          >
                            Ticket #{task.ticketNumber}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-sm text-gray-500">Issue Type</Label>
                          <p className="font-medium">{task.issueType}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500">Assigned To</Label>
                          <p className="font-medium">
                            {task.assignedUser ? 
                              `${task.assignedUser.firstName} ${task.assignedUser.lastName}` : 
                              "Unassigned"
                            }
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500">Created</Label>
                          <p className="font-medium">
                            {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {task.completionTime && (
                          <div>
                            <Label className="text-sm text-gray-500">Completed</Label>
                            <p className="font-medium">
                              {formatDistanceToNow(new Date(task.completionTime), { addSuffix: true })}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <Label className="text-sm text-gray-500">Description</Label>
                        <p className="mt-1">{task.description}</p>
                      </div>

                      {task.resolution && (
                        <div className="mb-4">
                          <Label className="text-sm text-gray-500">Resolution</Label>
                          <p className="mt-1 text-green-700 dark:text-green-300">{task.resolution}</p>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Dialog open={isCommentsOpen && selectedTask?.id === task.id} onOpenChange={(open) => {
                          setIsCommentsOpen(open);
                          if (open) setSelectedTask(task);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Comments
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
                                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
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
                    </CardContent>
                  </Card>
                ))}
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
                        <p>{formatDistanceToNow(new Date(selectedTask.createdAt))} ago</p>
                      </div>
                      {selectedTask.completionTime && (
                        <div>
                          <Label className="text-gray-500">Completed</Label>
                          <p>{formatDistanceToNow(new Date(selectedTask.completionTime))} ago</p>
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
                            <div key={index} className="border-l-2 border-cyan-200 pl-4 pb-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">{update.note}</p>
                                  <p className="text-xs text-gray-500">
                                    by {update.updatedBy} • {formatDistanceToNow(new Date(update.createdAt))} ago
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
            {/* System Details Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Systems</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {systemDetails?.length || 0}
                      </p>
                    </div>
                    <Settings className="h-8 w-8 text-cyan-600" />
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
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee ID</TableHead>
                          <TableHead>System Name</TableHead>
                          <TableHead>Configuration</TableHead>
                          <TableHead>Processor</TableHead>
                          <TableHead>RAM</TableHead>
                          <TableHead>Storage</TableHead>
                          <TableHead>Security</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {systemDetails?.map((system: any) => (
                          <TableRow key={system.id}>
                            <TableCell className="font-medium">{system.empId}</TableCell>
                            <TableCell>{system.systemName}</TableCell>
                            <TableCell>{system.systemConfiguration}</TableCell>
                            <TableCell>{system.processorName}</TableCell>
                            <TableCell>{system.ram}</TableCell>
                            <TableCell>
                              {system.hardDisk && `HDD: ${system.hardDisk}`}
                              {system.ssd && `, SSD: ${system.ssd}GB`}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {system.antivirusAvailable && <Badge variant="outline" className="text-xs">Antivirus</Badge>}
                                {system.upsAvailable && <Badge variant="outline" className="text-xs">UPS</Badge>}
                                {system.administratorAccount && <Badge variant="outline" className="text-xs">Admin</Badge>}
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
        <Dialog open={showSystemDetailsForm} onOpenChange={setShowSystemDetailsForm}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Add System Details
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSystemDetails} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="empId">Employee ID</Label>
                  <Input
                    id="empId"
                    value={systemDetailsForm.empId}
                    onChange={(e) => setSystemDetailsForm({...systemDetailsForm, empId: e.target.value})}
                    placeholder="e.g., EMP001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="systemName">System Name</Label>
                  <Input
                    id="systemName"
                    value={systemDetailsForm.systemName}
                    onChange={(e) => setSystemDetailsForm({...systemDetailsForm, systemName: e.target.value})}
                    placeholder="e.g., Desktop-001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="systemConfiguration">System Configuration</Label>
                  <Input
                    id="systemConfiguration"
                    value={systemDetailsForm.systemConfiguration}
                    onChange={(e) => setSystemDetailsForm({...systemDetailsForm, systemConfiguration: e.target.value})}
                    placeholder="e.g., Workstation"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="processorName">Processor</Label>
                  <Input
                    id="processorName"
                    value={systemDetailsForm.processorName}
                    onChange={(e) => setSystemDetailsForm({...systemDetailsForm, processorName: e.target.value})}
                    placeholder="e.g., Intel Core i7-8700K"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ram">RAM</Label>
                  <Input
                    id="ram"
                    value={systemDetailsForm.ram}
                    onChange={(e) => setSystemDetailsForm({...systemDetailsForm, ram: e.target.value})}
                    placeholder="e.g., 16GB DDR4"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hardDisk">Hard Disk</Label>
                  <Input
                    id="hardDisk"
                    value={systemDetailsForm.hardDisk}
                    onChange={(e) => setSystemDetailsForm({...systemDetailsForm, hardDisk: e.target.value})}
                    placeholder="e.g., 1TB SATA"
                  />
                </div>
                <div>
                  <Label htmlFor="ssd">SSD (GB)</Label>
                  <Input
                    id="ssd"
                    value={systemDetailsForm.ssd}
                    onChange={(e) => setSystemDetailsForm({...systemDetailsForm, ssd: e.target.value})}
                    placeholder="e.g., 256"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sharingStatus"
                    checked={systemDetailsForm.sharingStatus}
                    onChange={(e) => setSystemDetailsForm({...systemDetailsForm, sharingStatus: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="sharingStatus">File Sharing Enabled</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="administratorAccount"
                    checked={systemDetailsForm.administratorAccount}
                    onChange={(e) => setSystemDetailsForm({...systemDetailsForm, administratorAccount: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="administratorAccount">Administrator Account</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="antivirusAvailable"
                    checked={systemDetailsForm.antivirusAvailable}
                    onChange={(e) => setSystemDetailsForm({...systemDetailsForm, antivirusAvailable: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="antivirusAvailable">Antivirus Installed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="upsAvailable"
                    checked={systemDetailsForm.upsAvailable}
                    onChange={(e) => setSystemDetailsForm({...systemDetailsForm, upsAvailable: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="upsAvailable">UPS Available</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSystemDetailsForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-700"
                  disabled={createSystemDetailsMutation.isPending}
                >
                  {createSystemDetailsMutation.isPending ? "Adding..." : "Add System"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}