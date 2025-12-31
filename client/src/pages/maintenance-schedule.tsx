import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Clock,
  AlertTriangle,
  CheckCircle,
  Wrench,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MaintenanceSchedule {
  id: number;
  task_id: string;
  title: string;
  description: string | null;
  tower_id: number | null;
  device_id: number | null;
  device_name?: string;
  scheduled_date: string;
  scheduled_time: string | null;
  estimated_duration: string | null;
  assigned_to: number | null;
  assigned_to_name: string | null;
  type: string;
  priority: string;
  status: string;
  checklist: { item: string; completed: boolean }[] | null;
  notes: string | null;
  completed_date: string | null;
  completed_by: number | null;
  created_at: string;
  updated_at: string;
}

export default function MaintenanceSchedulePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);
  const [editAssignedTo, setEditAssignedTo] = useState<string>("");
  const [editAssignedToName, setEditAssignedToName] = useState<string>("");
  const [editType, setEditType] = useState<string>("");
  const [editPriority, setEditPriority] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("");
  // Multi-engineer selection for add form
  const [selectedEngineers, setSelectedEngineers] = useState<{id: number, name: string}[]>([]);
  // Task history dialog state
  const [viewingTaskHistory, setViewingTaskHistory] = useState<MaintenanceSchedule | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const { data: schedules = [], isLoading, error } = useQuery<MaintenanceSchedule[]>({
    queryKey: ["/api/isp/maintenance"],
  });

  // Fetch towers for dropdown
  const { data: towers = [] } = useQuery({
    queryKey: ["/api/network/towers"],
  });

  // Fetch users/engineers for dropdown
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/isp/maintenance", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/isp/maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setIsAddDialogOpen(false);
      setSelectedEngineers([]);
      toast({ title: "Success", description: "Maintenance scheduled successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await apiRequest("PUT", `/api/isp/maintenance/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/isp/maintenance"] });
      setIsEditDialogOpen(false);
      setEditingSchedule(null);
      toast({ title: "Success", description: "Maintenance updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/isp/maintenance/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/isp/maintenance"] });
      toast({ title: "Success", description: "Maintenance deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch =
      schedule.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.task_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.assigned_to_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || schedule.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-500">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-500">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "routine_inspection":
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Routine Inspection</Badge>;
      case "equipment_check":
        return <Badge variant="outline" className="border-purple-500 text-purple-600">Equipment Check</Badge>;
      case "cleaning":
        return <Badge variant="outline" className="border-green-500 text-green-600">Cleaning</Badge>;
      case "repair":
        return <Badge variant="outline" className="border-orange-500 text-orange-600">Repair</Badge>;
      case "upgrade":
        return <Badge variant="outline" className="border-indigo-500 text-indigo-600">Upgrade</Badge>;
      case "preventive_maintenance":
        return <Badge variant="outline" className="border-teal-500 text-teal-600">Preventive Maintenance</Badge>;
      case "emergency_maintenance":
        return <Badge variant="outline" className="border-red-500 text-red-600">Emergency Maintenance</Badge>;
      case "other":
        return <Badge variant="outline" className="border-gray-500 text-gray-600">Other</Badge>;
      // Backward compatibility
      case "preventive":
        return <Badge variant="outline" className="border-teal-500 text-teal-600">Preventive</Badge>;
      case "corrective":
        return <Badge variant="outline" className="border-orange-500 text-orange-600">Corrective</Badge>;
      case "emergency":
        return <Badge variant="outline" className="border-red-500 text-red-600">Emergency</Badge>;
      case "inspection":
        return <Badge variant="outline" className="border-green-500 text-green-600">Inspection</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handleAdd = (formData: FormData) => {
    const baseData = {
      tower_id: formData.get("tower_id") ? parseInt(formData.get("tower_id") as string) : null,
      title: `Tower Maintenance - ${formData.get("tower_name") || 'Scheduled'}`,
      description: formData.get("description") as string || null,
      scheduled_date: formData.get("scheduled_date") as string,
      schedule_mode: formData.get("schedule_mode") as string || "one-time",
      type: formData.get("type") as string || "routine_inspection",
      priority: formData.get("priority") as string || "medium",
      status: "scheduled",
      notes: formData.get("description") as string || null,
    };
    
    // If multiple engineers selected, create SEPARATE entries for each engineer
    if (selectedEngineers.length > 0) {
      selectedEngineers.forEach((engineer, index) => {
        const data = {
          ...baseData,
          assigned_to: engineer.id,
          assigned_to_name: engineer.name,
        };
        // Stagger mutations to avoid duplicate task IDs
        setTimeout(() => {
          createMutation.mutate(data);
        }, index * 200);
      });
    } else {
      // Fallback: no engineer selected
      const data = {
        ...baseData,
        assigned_to: null,
        assigned_to_name: null,
      };
      createMutation.mutate(data);
    }
    
    // Reset selected engineers
    setSelectedEngineers([]);
  };

  const handleEdit = (formData: FormData) => {
    if (!editingSchedule) return;
    
    // Validate required fields
    if (!editType || !editPriority || !editStatus) {
      toast({ 
        title: "Error", 
        description: "Please fill in all required fields (Type, Priority, Status)", 
        variant: "destructive" 
      });
      return;
    }
    
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      scheduled_date: formData.get("scheduled_date") as string,
      scheduled_time: formData.get("scheduled_time") as string || null,
      estimated_duration: formData.get("estimated_duration") as string || null,
      assigned_to: editAssignedTo ? parseInt(editAssignedTo) : null,
      assigned_to_name: editAssignedToName || null,
      type: editType,
      priority: editPriority,
      status: editStatus,
      notes: formData.get("notes") as string || null,
    };
    
    console.log('Submitting edit data:', data);
    updateMutation.mutate({ id: editingSchedule.id, data });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this maintenance schedule?")) {
      deleteMutation.mutate(id);
    }
  };

  // Stats
  const totalSchedules = schedules.length;
  const scheduledCount = schedules.filter((s) => s.status === "scheduled").length;
  const inProgressCount = schedules.filter((s) => s.status === "in_progress").length;
  const completedCount = schedules.filter((s) => s.status === "completed").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading maintenance schedules...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Error loading data: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Schedule</h1>
          <p className="text-muted-foreground">Schedule and track network maintenance tasks</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Maintenance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Schedule Tower Maintenance
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAdd(new FormData(e.currentTarget));
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Select Tower */}
                <div>
                  <Label htmlFor="tower_id">
                    Select Tower <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    name="tower_id" 
                    required
                    onValueChange={(value) => {
                      const selectedTower = towers.find((t: any) => t.id.toString() === value);
                      if (selectedTower) {
                        const nameInput = document.getElementById('tower_name') as HTMLInputElement;
                        if (nameInput) nameInput.value = selectedTower.name;
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="-- Select Tower --" />
                    </SelectTrigger>
                    <SelectContent>
                      {towers.map((tower: any) => (
                        <SelectItem key={tower.id} value={tower.id.toString()}>
                          {tower.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="tower_name" id="tower_name" />
                </div>

                {/* Maintenance Type */}
                <div>
                  <Label htmlFor="type">
                    Maintenance Type <span className="text-red-500">*</span>
                  </Label>
                  <Select name="type" defaultValue="routine_inspection" required>
                    <SelectTrigger>
                      <SelectValue placeholder="-- Select Type --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine_inspection">Routine Inspection</SelectItem>
                      <SelectItem value="equipment_check">Equipment Check</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="upgrade">Upgrade</SelectItem>
                      <SelectItem value="preventive_maintenance">Preventive Maintenance</SelectItem>
                      <SelectItem value="emergency_maintenance">Emergency Maintenance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Assign Engineers - Multi-Select */}
                <div className="col-span-2">
                  <Label>
                    Assign Engineers <span className="text-red-500">*</span>
                  </Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto bg-background">
                    <div className="grid grid-cols-2 gap-2">
                      {users
                        .filter((user: any) => user.role === 'field_engineer' || user.role === 'engineer' || user.role === 'admin')
                        .map((user: any) => (
                          <label key={user.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedEngineers.some(e => e.id === user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEngineers(prev => [...prev, { id: user.id, name: user.username }]);
                                } else {
                                  setSelectedEngineers(prev => prev.filter(eng => eng.id !== user.id));
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <span className="text-sm">{user.username} <span className="text-muted-foreground">({user.role})</span></span>
                          </label>
                        ))}
                    </div>
                  </div>
                  {selectedEngineers.length > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {selectedEngineers.length} engineer(s) selected - Separate task will be created for each
                    </p>
                  )}
                  {selectedEngineers.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      🛈 Select one or more engineers (each will receive their own task)
                    </p>
                  )}
                </div>

                {/* Schedule Mode */}
                <div>
                  <Label htmlFor="schedule_mode">
                    Schedule Mode <span className="text-red-500">*</span>
                  </Label>
                  <Select name="schedule_mode" defaultValue="one-time" required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">One-Time Date</SelectItem>
                      <SelectItem value="recurring">Recurring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Schedule Date */}
                <div>
                  <Label htmlFor="scheduled_date">
                    Schedule Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="scheduled_date"
                    name="scheduled_date"
                    type="date"
                    required
                    placeholder="dd-mm-yyyy"
                  />
                </div>

                {/* Priority */}
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description / Notes */}
                <div className="col-span-2">
                  <Label htmlFor="description">Description / Notes</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter maintenance details, checklist items, or special instructions..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  ✕ Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-green-600 hover:bg-green-700">
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  ✓ Schedule Maintenance
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSchedules}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{scheduledCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, task ID, or assigned person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Schedules Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-mono text-sm">
                    <button 
                      onClick={() => setViewingTaskHistory(schedule)}
                      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {schedule.task_id}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{schedule.title}</div>
                      {schedule.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">{schedule.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(schedule.type)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(schedule.scheduled_date).toLocaleDateString()}</div>
                      <div className="text-muted-foreground">{schedule.scheduled_time}</div>
                    </div>
                  </TableCell>
                  <TableCell>{schedule.estimated_duration || "-"}</TableCell>
                  <TableCell>{schedule.assigned_to_name || "-"}</TableCell>
                  <TableCell>{getPriorityBadge(schedule.priority)}</TableCell>
                  <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingSchedule(schedule);
                          setEditAssignedTo(schedule.assigned_to?.toString() || "");
                          setEditAssignedToName(schedule.assigned_to_name || "");
                          setEditType(schedule.type || "routine_inspection");
                          setEditPriority(schedule.priority || "medium");
                          setEditStatus(schedule.status || "scheduled");
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(schedule.id)}
                          disabled={deleteMutation.isPending}
                          title="Delete (Admin only)"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSchedules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No maintenance schedules found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Maintenance Schedule</DialogTitle>
          </DialogHeader>
          {editingSchedule && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEdit(new FormData(e.currentTarget));
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="edit-title">Task Title *</Label>
                  <Input id="edit-title" name="title" defaultValue={editingSchedule.title} required />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea id="edit-description" name="description" defaultValue={editingSchedule.description || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-scheduled_date">Scheduled Date *</Label>
                  <Input id="edit-scheduled_date" name="scheduled_date" type="date" defaultValue={editingSchedule.scheduled_date?.split("T")[0] || ""} required />
                </div>
                <div>
                  <Label htmlFor="edit-scheduled_time">Scheduled Time</Label>
                  <Input id="edit-scheduled_time" name="scheduled_time" type="time" defaultValue={editingSchedule.scheduled_time || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-estimated_duration">Estimated Duration</Label>
                  <Input id="edit-estimated_duration" name="estimated_duration" defaultValue={editingSchedule.estimated_duration || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-assigned_to">Assigned To</Label>
                  <Select 
                    value={editAssignedTo}
                    onValueChange={(value) => {
                      setEditAssignedTo(value);
                      const selectedUser = users.find((u: any) => u.id.toString() === value);
                      if (selectedUser) {
                        setEditAssignedToName(selectedUser.username);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="-- Select Engineer --" />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter((user: any) => user.role === 'field_engineer' || user.role === 'engineer' || user.role === 'admin')
                        .map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.username} ({user.role})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-type">Maintenance Type</Label>
                  <Select value={editType} onValueChange={setEditType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventive">Preventive</SelectItem>
                      <SelectItem value="corrective">Corrective</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="routine_inspection">Routine Inspection</SelectItem>
                      <SelectItem value="equipment_check">Equipment Check</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="upgrade">Upgrade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select value={editPriority} onValueChange={setEditPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea id="edit-notes" name="notes" defaultValue={editingSchedule.notes || ""} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Task History Dialog */}
      <Dialog open={!!viewingTaskHistory} onOpenChange={(open) => !open && setViewingTaskHistory(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              📋 Activity History - {viewingTaskHistory?.task_id}
            </DialogTitle>
          </DialogHeader>
          {viewingTaskHistory && (
            <div className="space-y-4">
              {/* Task Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Title</p>
                    <p className="font-medium">{viewingTaskHistory.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="font-medium">{viewingTaskHistory.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Assigned To</p>
                    <p className="font-medium">{viewingTaskHistory.assigned_to_name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Scheduled Date</p>
                    <p className="font-medium">{new Date(viewingTaskHistory.scheduled_date).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="font-medium">{viewingTaskHistory.type?.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Priority</p>
                    <p className="font-medium">{viewingTaskHistory.priority}</p>
                  </div>
                </div>
                {viewingTaskHistory.description && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">Description</p>
                    <p className="text-sm">{viewingTaskHistory.description}</p>
                  </div>
                )}
              </div>

              {/* Update History / Notes */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  📝 Activity Log & Notes
                </h4>
                {viewingTaskHistory.notes ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                      {viewingTaskHistory.notes}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No activity notes recorded yet</p>
                )}
              </div>

              {/* Timeline */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  📅 Timeline
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-500">Created:</span>
                    <span>{new Date(viewingTaskHistory.created_at).toLocaleString('en-IN')}</span>
                  </div>
                  {viewingTaskHistory.updated_at && viewingTaskHistory.updated_at !== viewingTaskHistory.created_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-500">Last Updated:</span>
                      <span>{new Date(viewingTaskHistory.updated_at).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {viewingTaskHistory.completed_date && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-500">Completed:</span>
                      <span>{new Date(viewingTaskHistory.completed_date).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={() => setViewingTaskHistory(null)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
