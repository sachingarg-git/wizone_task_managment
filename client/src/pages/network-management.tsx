import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Network,
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Activity,
  Wifi,
  Globe,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface NetworkSegment {
  id: number;
  name: string;
  type: string;
  ip_range: string | null;
  gateway: string | null;
  subnet_mask: string | null;
  dns1: string | null;
  dns2: string | null;
  vlan_id: string | null;
  description: string | null;
  total_devices: number | null;
  active_devices: number | null;
  utilization: number | null;
  last_ping: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface IspStats {
  totalClients: number;
  activeClients: number;
  totalDevices: number;
  onlineDevices: number;
  totalSegments: number;
  pendingMaintenance: number;
}

export default function NetworkManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<NetworkSegment | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: segments = [], isLoading, error } = useQuery<NetworkSegment[]>({
    queryKey: ["/api/isp/segments"],
  });

  const { data: stats } = useQuery<IspStats>({
    queryKey: ["/api/isp/stats"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/isp/segments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/isp/segments"] });
      setIsAddDialogOpen(false);
      toast({ title: "Success", description: "Network segment created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await apiRequest("PUT", `/api/isp/segments/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/isp/segments"] });
      setIsEditDialogOpen(false);
      setEditingSegment(null);
      toast({ title: "Success", description: "Network segment updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/isp/segments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/isp/segments"] });
      toast({ title: "Success", description: "Network segment deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const pingMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/isp/segments/${id}/ping`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/isp/segments"] });
      toast({ 
        title: data.success ? "Ping Success" : "Ping Failed", 
        description: `Latency: ${data.latency}ms`,
        variant: data.success ? "default" : "destructive"
      });
    },
    onError: (error: Error) => {
      toast({ title: "Ping Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredSegments = segments.filter((segment) => {
    const matchesSearch =
      segment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      segment.ip_range?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      segment.vlan_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || segment.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "degraded":
        return <Badge className="bg-yellow-500">Degraded</Badge>;
      case "down":
        return <Badge className="bg-red-500">Down</Badge>;
      case "maintenance":
        return <Badge className="bg-blue-500">Maintenance</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "backbone":
        return <Badge variant="outline" className="border-purple-500 text-purple-500">Backbone</Badge>;
      case "distribution":
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Distribution</Badge>;
      case "access":
        return <Badge variant="outline" className="border-green-500 text-green-500">Access</Badge>;
      case "management":
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Management</Badge>;
      case "guest":
        return <Badge variant="outline" className="border-gray-500 text-gray-500">Guest</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handleAdd = (formData: FormData) => {
    const data = {
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      ip_range: formData.get("ip_range") as string || null,
      gateway: formData.get("gateway") as string || null,
      subnet_mask: formData.get("subnet_mask") as string || null,
      dns1: formData.get("dns1") as string || null,
      dns2: formData.get("dns2") as string || null,
      vlan_id: formData.get("vlan_id") as string || null,
      description: formData.get("description") as string || null,
      status: formData.get("status") as string || "active",
    };
    createMutation.mutate(data);
  };

  const handleEdit = (formData: FormData) => {
    if (!editingSegment) return;
    const data = {
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      ip_range: formData.get("ip_range") as string || null,
      gateway: formData.get("gateway") as string || null,
      subnet_mask: formData.get("subnet_mask") as string || null,
      dns1: formData.get("dns1") as string || null,
      dns2: formData.get("dns2") as string || null,
      vlan_id: formData.get("vlan_id") as string || null,
      description: formData.get("description") as string || null,
      status: formData.get("status") as string,
    };
    updateMutation.mutate({ id: editingSegment.id, data });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this network segment?")) {
      deleteMutation.mutate(id);
    }
  };

  // Calculate stats
  const totalSegments = segments.length;
  const activeSegments = segments.filter((s) => s.status === "active").length;
  const totalDevicesInSegments = segments.reduce((acc, s) => acc + (s.total_devices || 0), 0);
  const avgUtilization = segments.length > 0
    ? Math.round(segments.reduce((acc, s) => acc + (s.utilization || 0), 0) / segments.length)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading network segments...</span>
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
          <h1 className="text-3xl font-bold">Network Management</h1>
          <p className="text-muted-foreground">Manage network segments, VLANs, and IP ranges</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Segment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Network Segment</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAdd(new FormData(e.currentTarget));
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" placeholder="Backbone-Main" required />
                </div>
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backbone">Backbone</SelectItem>
                      <SelectItem value="distribution">Distribution</SelectItem>
                      <SelectItem value="access">Access</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ip_range">IP Range</Label>
                  <Input id="ip_range" name="ip_range" placeholder="10.0.0.0/24" />
                </div>
                <div>
                  <Label htmlFor="gateway">Gateway</Label>
                  <Input id="gateway" name="gateway" placeholder="10.0.0.1" />
                </div>
                <div>
                  <Label htmlFor="subnet_mask">Subnet Mask</Label>
                  <Input id="subnet_mask" name="subnet_mask" placeholder="255.255.255.0" />
                </div>
                <div>
                  <Label htmlFor="vlan_id">VLAN ID</Label>
                  <Input id="vlan_id" name="vlan_id" placeholder="100" />
                </div>
                <div>
                  <Label htmlFor="dns1">Primary DNS</Label>
                  <Input id="dns1" name="dns1" placeholder="8.8.8.8" />
                </div>
                <div>
                  <Label htmlFor="dns2">Secondary DNS</Label>
                  <Input id="dns2" name="dns2" placeholder="8.8.4.4" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="active">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="degraded">Degraded</SelectItem>
                      <SelectItem value="down">Down</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Segment description..." />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Segment
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
            <CardTitle className="text-sm font-medium">Total Segments</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSegments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Segments</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeSegments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Wifi className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDevicesInSegments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Utilization</CardTitle>
            <Globe className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgUtilization}%</div>
          </CardContent>
        </Card>
      </div>

      {/* ISP Overview Stats */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>ISP Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{stats.totalClients}</div>
                <div className="text-sm text-muted-foreground">Total Clients</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.activeClients}</div>
                <div className="text-sm text-muted-foreground">Active Clients</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{stats.totalDevices}</div>
                <div className="text-sm text-muted-foreground">Total Devices</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.onlineDevices}</div>
                <div className="text-sm text-muted-foreground">Online Devices</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{stats.totalSegments}</div>
                <div className="text-sm text-muted-foreground">Network Segments</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingMaintenance}</div>
                <div className="text-sm text-muted-foreground">Pending Tasks</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, IP range, or VLAN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="backbone">Backbone</SelectItem>
            <SelectItem value="distribution">Distribution</SelectItem>
            <SelectItem value="access">Access</SelectItem>
            <SelectItem value="management">Management</SelectItem>
            <SelectItem value="guest">Guest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Network Segments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>IP Range</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead>VLAN</TableHead>
                <TableHead>Devices</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSegments.map((segment) => (
                <TableRow key={segment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{segment.name}</div>
                      <div className="text-sm text-muted-foreground">{segment.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(segment.type)}</TableCell>
                  <TableCell className="font-mono text-sm">{segment.ip_range || "-"}</TableCell>
                  <TableCell className="font-mono text-sm">{segment.gateway || "-"}</TableCell>
                  <TableCell>{segment.vlan_id || "-"}</TableCell>
                  <TableCell>
                    {segment.active_devices || 0} / {segment.total_devices || 0}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (segment.utilization || 0) > 80
                              ? "bg-red-500"
                              : (segment.utilization || 0) > 60
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${segment.utilization || 0}%` }}
                        />
                      </div>
                      <span className="text-sm">{segment.utilization || 0}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(segment.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => pingMutation.mutate(segment.id)}
                        disabled={pingMutation.isPending}
                        title="Ping"
                      >
                        <RefreshCw className={`h-4 w-4 ${pingMutation.isPending ? "animate-spin" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingSegment(segment);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(segment.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSegments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No network segments found
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
            <DialogTitle>Edit Network Segment</DialogTitle>
          </DialogHeader>
          {editingSegment && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEdit(new FormData(e.currentTarget));
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input id="edit-name" name="name" defaultValue={editingSegment.name} required />
                </div>
                <div>
                  <Label htmlFor="edit-type">Type *</Label>
                  <Select name="type" defaultValue={editingSegment.type}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backbone">Backbone</SelectItem>
                      <SelectItem value="distribution">Distribution</SelectItem>
                      <SelectItem value="access">Access</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-ip_range">IP Range</Label>
                  <Input id="edit-ip_range" name="ip_range" defaultValue={editingSegment.ip_range || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-gateway">Gateway</Label>
                  <Input id="edit-gateway" name="gateway" defaultValue={editingSegment.gateway || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-subnet_mask">Subnet Mask</Label>
                  <Input id="edit-subnet_mask" name="subnet_mask" defaultValue={editingSegment.subnet_mask || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-vlan_id">VLAN ID</Label>
                  <Input id="edit-vlan_id" name="vlan_id" defaultValue={editingSegment.vlan_id || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-dns1">Primary DNS</Label>
                  <Input id="edit-dns1" name="dns1" defaultValue={editingSegment.dns1 || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-dns2">Secondary DNS</Label>
                  <Input id="edit-dns2" name="dns2" defaultValue={editingSegment.dns2 || ""} />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={editingSegment.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="degraded">Degraded</SelectItem>
                      <SelectItem value="down">Down</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea id="edit-description" name="description" defaultValue={editingSegment.description || ""} />
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
    </div>
  );
}
