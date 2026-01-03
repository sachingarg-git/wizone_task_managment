import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Server,
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Wifi,
  Router,
  HardDrive,
  Radio,
  X,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface NetworkDevice {
  id: number;
  device_id: string;
  name: string;
  type: string;
  model: string | null;
  tower_id: number | null;
  tower_name?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface NetworkTower {
  id: number;
  name: string;
  location: string | null;
}

interface DeviceEntry {
  id: number;
  type: string;
  customType: string;
  name: string;
  model: string;
  ipAddress: string;
}

export default function DeviceMaster() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<NetworkDevice | null>(null);
  const [selectedTower, setSelectedTower] = useState<string>("");
  const [deviceEntries, setDeviceEntries] = useState<DeviceEntry[]>([
    { id: 1, type: "Sector", customType: "", name: "", model: "", ipAddress: "" }
  ]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch devices
  const { data: devices = [], isLoading, error } = useQuery<NetworkDevice[]>({
    queryKey: ["/api/isp/devices"],
  });

  // Fetch towers for dropdown
  const { data: towers = [] } = useQuery<NetworkTower[]>({
    queryKey: ["/api/network/towers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/isp/devices", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/isp/devices"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await apiRequest("PUT", `/api/isp/devices/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/isp/devices"] });
      setIsEditDialogOpen(false);
      setEditingDevice(null);
      toast({ title: "Success", description: "Device updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/isp/devices/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/isp/devices"] });
      toast({ title: "Success", description: "Device deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.device_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || device.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-500">Inactive</Badge>;
      case "maintenance":
        return <Badge className="bg-yellow-500">Maintenance</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "sector":
        return <Radio className="h-4 w-4" />;
      case "router":
        return <Router className="h-4 w-4" />;
      case "switch":
        return <Server className="h-4 w-4" />;
      case "access point":
        return <Wifi className="h-4 w-4" />;
      case "ptp":
        return <Radio className="h-4 w-4" />;
      case "ptmp":
        return <Radio className="h-4 w-4" />;
      case "backhaul ptp device":
        return <Radio className="h-4 w-4" />;
      default:
        return <HardDrive className="h-4 w-4" />;
    }
  };

  const addDeviceEntry = () => {
    setDeviceEntries([
      ...deviceEntries,
      { id: Date.now(), type: "Sector", customType: "", name: "", model: "", ipAddress: "" }
    ]);
  };

  const removeDeviceEntry = (id: number) => {
    if (deviceEntries.length > 1) {
      setDeviceEntries(deviceEntries.filter(d => d.id !== id));
    }
  };

  const updateDeviceEntry = (id: number, field: string, value: string) => {
    setDeviceEntries(deviceEntries.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  const handleSaveAllDevices = async () => {
    if (!selectedTower) {
      toast({ title: "Error", description: "Please select a tower", variant: "destructive" });
      return;
    }

    const validDevices = deviceEntries.filter(d => d.name.trim() !== "");
    if (validDevices.length === 0) {
      toast({ title: "Error", description: "Please add at least one device with a name", variant: "destructive" });
      return;
    }

    try {
      for (const device of validDevices) {
        const deviceType = device.type === "Custom" ? device.customType : device.type;
        await createMutation.mutateAsync({
          name: device.name,
          type: deviceType,
          model: device.model || null,
          ip_address: device.ipAddress || null,
          tower_id: parseInt(selectedTower),
          status: "active",
        });
      }
      
      setIsAddDialogOpen(false);
      setSelectedTower("");
      setDeviceEntries([{ id: 1, type: "Sector", customType: "", name: "", model: "", ipAddress: "" }]);
      toast({ title: "Success", description: `${validDevices.length} device(s) added successfully` });
    } catch (error) {
      console.error("Error saving devices:", error);
    }
  };

  const handleEdit = (formData: FormData) => {
    if (!editingDevice) return;
    const deviceType = formData.get("type") as string;
    const customType = formData.get("customType") as string;
    const data = {
      name: formData.get("name") as string,
      type: deviceType === "Custom" ? customType : deviceType,
      model: formData.get("model") as string || null,
      ip_address: formData.get("ip_address") as string || null,
      tower_id: formData.get("tower_id") ? parseInt(formData.get("tower_id") as string) : null,
      status: formData.get("status") as string,
    };
    updateMutation.mutate({ id: editingDevice.id, data });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this device?")) {
      deleteMutation.mutate(id);
    }
  };

  // Stats
  const totalDevices = devices.length;
  const activeCount = devices.filter((d) => d.status === "active").length;
  const sectorCount = devices.filter((d) => d.type === "Sector").length;
  const switchCount = devices.filter((d) => d.type === "Switch").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading devices...</span>
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
          <h1 className="text-3xl font-bold">Device Master</h1>
          <p className="text-muted-foreground">Manage network devices and equipment</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Server className="h-5 w-5" />
                Add Devices to Tower
              </DialogTitle>
            </DialogHeader>
            
            {/* Select Tower Section */}
            <div className="space-y-4 border-b pb-4">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4" />
                <span className="font-medium">Select Tower</span>
              </div>
              <div>
                <Label htmlFor="tower">Tower *</Label>
                <Select value={selectedTower} onValueChange={setSelectedTower}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- Select Tower --" />
                  </SelectTrigger>
                  <SelectContent>
                    {towers.map((tower) => (
                      <SelectItem key={tower.id} value={tower.id.toString()}>
                        {tower.name} - {tower.location || "No Location"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Device Entries */}
            <div className="space-y-4">
              {deviceEntries.map((entry, index) => (
                <div key={entry.id} className="p-3 bg-gray-50 rounded-lg space-y-3">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-3">
                      <Label>Device Type *</Label>
                      <Select 
                        value={entry.type} 
                        onValueChange={(value) => updateDeviceEntry(entry.id, "type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sector">Sector</SelectItem>
                          <SelectItem value="Switch">Switch</SelectItem>
                          <SelectItem value="Router">Router</SelectItem>
                          <SelectItem value="PTP">PTP</SelectItem>
                          <SelectItem value="PTMP">PTMP</SelectItem>
                          <SelectItem value="BACKHAUL PTP DEVICE">BACKHAUL PTP DEVICE</SelectItem>
                          <SelectItem value="Access Point">Access Point</SelectItem>
                          <SelectItem value="Custom">Custom (Enter Below)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {entry.type === "Custom" && (
                      <div className="col-span-3">
                        <Label>Custom Type *</Label>
                        <Input 
                          placeholder="Enter custom type" 
                          value={entry.customType}
                          onChange={(e) => updateDeviceEntry(entry.id, "customType", e.target.value)}
                        />
                      </div>
                    )}
                    <div className={entry.type === "Custom" ? "col-span-3" : "col-span-4"}>
                      <Label>Device Name *</Label>
                      <Input 
                        placeholder="e.g., Sector-A1, Switch-01" 
                        value={entry.name}
                        onChange={(e) => updateDeviceEntry(entry.id, "name", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Model</Label>
                      <Input 
                        placeholder="Optional" 
                        value={entry.model}
                        onChange={(e) => updateDeviceEntry(entry.id, "model", e.target.value)}
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {deviceEntries.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeDeviceEntry(entry.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-4">
                      <Label>IP Address</Label>
                      <Input 
                        placeholder="e.g., 192.168.1.100" 
                        value={entry.ipAddress}
                        onChange={(e) => updateDeviceEntry(entry.id, "ipAddress", e.target.value)}
                      />
                  </div>
                  </div>
                </div>
              ))}

              <Button 
                type="button" 
                variant="outline" 
                onClick={addDeviceEntry}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Device
              </Button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setSelectedTower("");
                  setDeviceEntries([{ id: 1, type: "Sector", customType: "", name: "", model: "", ipAddress: "" }]);
                }}
                className="bg-red-500 hover:bg-red-600 text-white border-0"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAllDevices}
                disabled={createMutation.isPending}
                className="bg-green-500 hover:bg-green-600"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Save All Devices
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDevices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Router className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sectors</CardTitle>
            <Radio className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{sectorCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Switches</CardTitle>
            <Server className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{switchCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or model..."
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
            <SelectItem value="Sector">Sector</SelectItem>
            <SelectItem value="Switch">Switch</SelectItem>
            <SelectItem value="Router">Router</SelectItem>
            <SelectItem value="PTP">PTP</SelectItem>
            <SelectItem value="PTMP">PTMP</SelectItem>
            <SelectItem value="BACKHAUL PTP DEVICE">BACKHAUL PTP DEVICE</SelectItem>
            <SelectItem value="Access Point">Access Point</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Devices Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Tower</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-mono text-sm">{device.device_id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(device.type)}
                      <span className="font-medium">{device.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{device.type}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{(device as any).ip_address || "-"}</TableCell>
                  <TableCell>{device.model || "-"}</TableCell>
                  <TableCell>
                    {device.tower_name || towers.find(t => t.id === device.tower_id)?.name || "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(device.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingDevice(device);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(device.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredDevices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No devices found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
          </DialogHeader>
          {editingDevice && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEdit(new FormData(e.currentTarget));
              }}
              className="space-y-4"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-tower_id">Tower</Label>
                  <Select name="tower_id" defaultValue={editingDevice.tower_id?.toString() || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Tower" />
                    </SelectTrigger>
                    <SelectContent>
                      {towers.map((tower) => (
                        <SelectItem key={tower.id} value={tower.id.toString()}>
                          {tower.name} - {tower.location || "No Location"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-type">Device Type *</Label>
                  <Select name="type" defaultValue={editingDevice.type}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sector">Sector</SelectItem>
                      <SelectItem value="Switch">Switch</SelectItem>
                      <SelectItem value="Router">Router</SelectItem>
                      <SelectItem value="PTP">PTP</SelectItem>
                      <SelectItem value="PTMP">PTMP</SelectItem>
                      <SelectItem value="BACKHAUL PTP DEVICE">BACKHAUL PTP DEVICE</SelectItem>
                      <SelectItem value="Access Point">Access Point</SelectItem>
                      <SelectItem value="Custom">Custom (Enter Below)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-customType">Custom Type (if Custom selected)</Label>
                  <Input id="edit-customType" name="customType" placeholder="Enter custom device type" />
                </div>
                <div>
                  <Label htmlFor="edit-name">Device Name *</Label>
                  <Input id="edit-name" name="name" defaultValue={editingDevice.name} required />
                </div>
                <div>
                  <Label htmlFor="edit-model">Model</Label>
                  <Input id="edit-model" name="model" defaultValue={editingDevice.model || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-ip_address">IP Address</Label>
                  <Input id="edit-ip_address" name="ip_address" placeholder="e.g., 192.168.1.100" defaultValue={(editingDevice as any).ip_address || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={editingDevice.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Device
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
