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
  Link2,
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Users,
  Server,
  Radio,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Tower {
  id: number;
  name: string;
  target_ip: string | null;
  address: string | null;
}

interface DeviceMasterItem {
  id: number;
  device_id: string;
  name: string;
  type: string;
  ip_address: string | null;
  model: string | null;
  status: string;
  tower_id: number | null;
  tower_name?: string;
}

interface ClientAssignment {
  id: number;
  client_id: number;
  tower_id: number;
  device_id: number | null;
  port: string | null;
  ip_assigned: string | null;
  mac_address: string | null;
  bandwidth: string | null;
  vlan_id: string | null;
  assigned_date: string | null;
  status: string;
  notes: string | null;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  device_name?: string;
  device_ip?: string;
  created_at: string;
  updated_at: string;
}

interface IspClient {
  id: number;
  client_id: string;
  name: string;
  phone: string | null;
  port: string | null;
  wireless_ip: string | null;
}

interface NetworkDevice {
  id: number;
  device_id: string;
  name: string;
  ip_address: string | null;
}

export default function AssignClients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ClientAssignment | null>(null);
  // Step-based form selection - use tower name from Device Master
  const [selectedTowerName, setSelectedTowerName] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  // Auto-fill fields for new assignment
  const [autoPort, setAutoPort] = useState("");
  const [autoIp, setAutoIp] = useState("");
  // Multi-client support
  const [clientsToAdd, setClientsToAdd] = useState<Array<{
    clientId: string;
    clientName: string;
    port: string;
    ip: string;
    bandwidth: string;
    status: string;
    notes: string;
  }>>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading, error, refetch: refetchAssignments, isFetching } = useQuery<ClientAssignment[]>({
    queryKey: ["/api/isp/assignments"],
  });

  const { data: clients = [] } = useQuery<IspClient[]>({
    queryKey: ["/api/isp/clients"],
  });

  // Filter out clients who already have assignments (compare by name since IDs differ between tables)
  const availableClients = clients.filter(client => 
    !assignments.some(assignment => assignment.client_name === client.name)
  );

  const { data: devices = [] } = useQuery<NetworkDevice[]>({
    queryKey: ["/api/isp/devices"],
  });

  // Fetch ALL devices from Device Master (includes tower_name)
  const { data: allDeviceMasterItems = [] } = useQuery<DeviceMasterItem[]>({
    queryKey: ["/api/isp/devices/with-tower"],
    queryFn: async () => {
      const res = await fetch('/api/isp/devices/with-tower');
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Get unique tower names from Device Master
  const uniqueTowers = [...new Set(allDeviceMasterItems.map(d => d.tower_name).filter(Boolean))] as string[];

  // Filter devices by selected tower name
  const filteredDevices = selectedTowerName 
    ? allDeviceMasterItems.filter(d => d.tower_name === selectedTowerName)
    : [];

  // Generate next available port and IP based on existing assignments and pending clients
  const generateAutoValues = (existingClients: typeof clientsToAdd = []) => {
    // Combine existing assignments with pending clients to add
    const usedPorts = [
      ...assignments.map(a => a.port).filter(Boolean),
      ...existingClients.map(c => c.port)
    ];
    let nextPortNum = 1;
    while (usedPorts.includes(`PON 1/${nextPortNum}`) || usedPorts.includes(`Eth ${nextPortNum}`)) {
      nextPortNum++;
    }
    setAutoPort(`PON 1/${nextPortNum}`);
    
    // Generate next IP address
    const usedIps = [
      ...assignments.map(a => a.ip_assigned).filter(Boolean) as string[],
      ...existingClients.map(c => c.ip)
    ];
    let lastOctet = 10;
    while (usedIps.includes(`10.100.0.${lastOctet}`)) {
      lastOctet++;
    }
    setAutoIp(`10.100.0.${lastOctet}`);
    // Reset client selection only
    setSelectedClientId("");
  };

  // Reset and generate values when dialog opens
  const handleOpenAddDialog = () => {
    setClientsToAdd([]);
    setSelectedTowerName("");
    setSelectedDeviceId("");
    setSelectedClientId("");
    generateAutoValues([]);
    setIsAddDialogOpen(true);
  };

  // Handle tower selection - reset device selection and clear pending clients
  const handleTowerSelect = (towerName: string) => {
    setSelectedTowerName(towerName);
    setSelectedDeviceId(""); // Reset device when tower changes
    setClientsToAdd([]); // Clear pending clients when tower changes
  };

  // Handle device selection - clear pending clients when device changes
  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setClientsToAdd([]); // Clear pending clients when device changes
    generateAutoValues([]);
  };

  // Handle client selection - auto-fill port and IP from customer data
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const selectedClient = clients.find(c => c.id.toString() === clientId);
    if (selectedClient) {
      // Use customer's existing port if available, otherwise use auto-generated
      if (selectedClient.port) {
        setAutoPort(selectedClient.port);
      }
      // Use customer's existing IP if available, otherwise use auto-generated
      if (selectedClient.wireless_ip) {
        setAutoIp(selectedClient.wireless_ip);
      }
    }
  };

  // Add client to the pending list
  const handleAddClientToList = () => {
    if (!selectedClientId) return;
    
    const selectedClient = clients.find(c => c.id.toString() === selectedClientId);
    if (!selectedClient) return;
    
    // Check if client is already in the list
    if (clientsToAdd.some(c => c.clientId === selectedClientId)) {
      toast({ title: "Warning", description: "Client already added to the list", variant: "destructive" });
      return;
    }
    
    const newClient = {
      clientId: selectedClientId,
      clientName: selectedClient.name,
      port: autoPort,
      ip: autoIp,
      bandwidth: "100 Mbps",
      status: "active",
      notes: ""
    };
    
    const updatedList = [...clientsToAdd, newClient];
    setClientsToAdd(updatedList);
    
    // Generate new auto values for next client
    generateAutoValues(updatedList);
    
    toast({ title: "Added", description: `${selectedClient.name} added to list` });
  };

  // Remove client from pending list
  const handleRemoveClientFromList = (clientId: string) => {
    const updatedList = clientsToAdd.filter(c => c.clientId !== clientId);
    setClientsToAdd(updatedList);
    generateAutoValues(updatedList);
  };

  // Get available clients (not already assigned and not in pending list)
  const getAvailableClientsForSelection = () => {
    return availableClients.filter(client => 
      !clientsToAdd.some(c => c.clientId === client.id.toString())
    );
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/isp/assignments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/isp/assignments"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Batch create mutation for multiple clients
  const batchCreateMutation = useMutation({
    mutationFn: async (dataList: Record<string, unknown>[]) => {
      const results = [];
      for (const data of dataList) {
        const res = await apiRequest("POST", "/api/isp/assignments", data);
        results.push(await res.json());
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["/api/isp/assignments"] });
      setIsAddDialogOpen(false);
      setClientsToAdd([]);
      toast({ title: "Success", description: `${results.length} client(s) assigned successfully` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await apiRequest("PUT", `/api/isp/assignments/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/isp/assignments"] });
      setIsEditDialogOpen(false);
      setEditingAssignment(null);
      toast({ title: "Success", description: "Assignment updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/isp/assignments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/isp/assignments"] });
      toast({ title: "Success", description: "Assignment deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.ip_assigned?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || assignment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "disconnected":
        return <Badge className="bg-red-500">Disconnected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Submit all clients in the list
  const handleSubmitAllClients = () => {
    if (clientsToAdd.length === 0) {
      toast({ title: "Warning", description: "No clients added to the list", variant: "destructive" });
      return;
    }
    
    const selectedDevice = allDeviceMasterItems.find(d => d.id.toString() === selectedDeviceId);
    
    const dataList = clientsToAdd.map(client => ({
      client_id: parseInt(client.clientId),
      tower_id: selectedDevice?.tower_id || null,
      device_id: selectedDeviceId ? parseInt(selectedDeviceId) : null,
      port: client.port || null,
      ip_assigned: client.ip || null,
      mac_address: null,
      bandwidth: client.bandwidth || null,
      vlan_id: null,
      assigned_date: new Date().toISOString().split('T')[0],
      status: client.status || "active",
      notes: client.notes || null,
    }));
    
    batchCreateMutation.mutate(dataList);
  };

  const handleAdd = (formData: FormData) => {
    // Get tower_id from the selected device
    const selectedDevice = allDeviceMasterItems.find(d => d.id.toString() === selectedDeviceId);
    const data = {
      client_id: parseInt(formData.get("client_id") as string),
      tower_id: selectedDevice?.tower_id || null,
      device_id: selectedDeviceId ? parseInt(selectedDeviceId) : null,
      port: formData.get("port") as string || null,
      ip_assigned: formData.get("ip_assigned") as string || null,
      mac_address: formData.get("mac_address") as string || null,
      bandwidth: formData.get("bandwidth") as string || null,
      vlan_id: formData.get("vlan_id") as string || null,
      assigned_date: formData.get("assigned_date") as string || null,
      status: formData.get("status") as string || "active",
      notes: formData.get("notes") as string || null,
    };
    createMutation.mutate(data);
  };

  const handleEdit = (formData: FormData) => {
    if (!editingAssignment) return;
    const data = {
      client_id: parseInt(formData.get("client_id") as string),
      device_id: parseInt(formData.get("device_id") as string) || null,
      port: formData.get("port") as string || null,
      ip_assigned: formData.get("ip_assigned") as string || null,
      mac_address: formData.get("mac_address") as string || null,
      bandwidth: formData.get("bandwidth") as string || null,
      vlan_id: formData.get("vlan_id") as string || null,
      status: formData.get("status") as string,
      notes: formData.get("notes") as string || null,
    };
    updateMutation.mutate({ id: editingAssignment.id, data });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this assignment?")) {
      deleteMutation.mutate(id);
    }
  };

  // Stats
  const totalAssignments = assignments.length;
  const activeCount = assignments.filter((a) => a.status === "active").length;
  const disconnectedCount = assignments.filter((a) => a.status === "disconnected").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading assignments...</span>
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
          <h1 className="text-3xl font-bold">Client Assignments</h1>
          <p className="text-muted-foreground">Manage client-to-device assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetchAssignments()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAdd(new FormData(e.currentTarget));
              }}
              className="space-y-6"
            >
              {/* Step 1: Select Tower & Device */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-600">Step 1: Select Tower & Device</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tower_id">Select Tower * <span className="text-xs text-blue-600">(From Device Master)</span></Label>
                    <Select value={selectedTowerName} onValueChange={handleTowerSelect}>
                      <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                        <SelectValue placeholder="-- Select Tower --" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueTowers.length === 0 ? (
                          <SelectItem value="none" disabled>No towers with devices</SelectItem>
                        ) : (
                          uniqueTowers.map((towerName) => (
                            <SelectItem key={towerName} value={towerName}>
                              {towerName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="device_id">Select Device *</Label>
                    <Select 
                      value={selectedDeviceId} 
                      onValueChange={handleDeviceSelect}
                      disabled={!selectedTowerName}
                    >
                      <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                        <SelectValue placeholder={selectedTowerName ? "-- Select Device --" : "-- First Select Tower --"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDevices.length === 0 ? (
                          <SelectItem value="none" disabled>No devices in this tower</SelectItem>
                        ) : (
                          filteredDevices.map((device) => (
                            <SelectItem key={device.id} value={device.id.toString()}>
                              {device.name} ({device.type}) {device.ip_address ? `- ${device.ip_address}` : ''}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Step 2: Client & Connection Details */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-600">Step 2: Add Clients to Device</span>
                  </div>
                  {clientsToAdd.length > 0 && (
                    <Badge className="bg-blue-500">{clientsToAdd.length} client(s) added</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_id">Client * <span className="text-xs text-cyan-600">(From Client Master)</span></Label>
                    <Select value={selectedClientId} onValueChange={handleClientSelect} disabled={!selectedDeviceId}>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedDeviceId ? "Select Client" : "First select device"} />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableClientsForSelection().length === 0 ? (
                          <SelectItem value="none" disabled>No unassigned clients available</SelectItem>
                        ) : (
                          getAvailableClientsForSelection().map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name} ({client.client_id || client.phone || 'N/A'})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="port">Port <span className="text-xs text-green-600">(Auto-generated)</span></Label>
                    <Input 
                      id="port" 
                      name="port" 
                      value={autoPort}
                      onChange={(e) => setAutoPort(e.target.value)}
                      placeholder="PON 1/1 or Eth 1" 
                      className="bg-green-50 border-green-200"
                      disabled={!selectedDeviceId}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ip_assigned">Assigned IP <span className="text-xs text-green-600">(Auto-generated)</span></Label>
                    <Input 
                      id="ip_assigned" 
                      name="ip_assigned" 
                      value={autoIp}
                      onChange={(e) => setAutoIp(e.target.value)}
                      placeholder="10.100.0.10" 
                      className="bg-green-50 border-green-200"
                      disabled={!selectedDeviceId}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bandwidth">Bandwidth</Label>
                    <Input id="bandwidth" name="bandwidth" placeholder="100 Mbps" defaultValue="100 Mbps" disabled={!selectedDeviceId} />
                  </div>
                </div>
                
                {/* Add to List Button */}
                <div className="mt-4 flex justify-end">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="border-green-500 text-green-600 hover:bg-green-50"
                    onClick={handleAddClientToList}
                    disabled={!selectedClientId || !selectedDeviceId}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client to List
                  </Button>
                </div>
              </div>

              {/* Step 3: Clients Added List */}
              {clientsToAdd.length > 0 && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center gap-2 mb-4">
                    <Link2 className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-blue-600">Step 3: Clients to Assign ({clientsToAdd.length})</span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Port</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Bandwidth</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientsToAdd.map((client, index) => (
                        <TableRow key={client.clientId}>
                          <TableCell className="font-medium">{client.clientName}</TableCell>
                          <TableCell>{client.port}</TableCell>
                          <TableCell className="font-mono text-sm">{client.ip}</TableCell>
                          <TableCell>{client.bandwidth}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-500">{client.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveClientFromList(client.clientId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSubmitAllClients}
                  disabled={batchCreateMutation.isPending || clientsToAdd.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {batchCreateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create {clientsToAdd.length} Assignment(s)
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Disconnected</CardTitle>
            <Server className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{disconnectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client, device, or IP..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="disconnected">Disconnected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>IP Assigned</TableHead>
                <TableHead>Bandwidth</TableHead>
                <TableHead>VLAN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{assignment.client_name}</div>
                      <div className="text-sm text-muted-foreground">{assignment.client_phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{assignment.device_name}</div>
                      <div className="text-sm text-muted-foreground font-mono">{assignment.device_ip}</div>
                    </div>
                  </TableCell>
                  <TableCell>{assignment.port || "-"}</TableCell>
                  <TableCell className="font-mono text-sm">{assignment.ip_assigned || "-"}</TableCell>
                  <TableCell>{assignment.bandwidth || "-"}</TableCell>
                  <TableCell>{assignment.vlan_id || "-"}</TableCell>
                  <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingAssignment(assignment);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(assignment.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAssignments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No assignments found
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
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          {editingAssignment && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEdit(new FormData(e.currentTarget));
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-client_id">Client *</Label>
                  <Select name="client_id" defaultValue={editingAssignment.client_id.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name} ({client.client_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-device_id">Device</Label>
                  <Select name="device_id" defaultValue={editingAssignment.device_id?.toString() || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select device" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((device) => (
                        <SelectItem key={device.id} value={device.id.toString()}>
                          {device.name} ({device.ip_address})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-port">Port</Label>
                  <Input id="edit-port" name="port" defaultValue={editingAssignment.port || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-ip_assigned">Assigned IP</Label>
                  <Input id="edit-ip_assigned" name="ip_assigned" defaultValue={editingAssignment.ip_assigned || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-mac_address">MAC Address</Label>
                  <Input id="edit-mac_address" name="mac_address" defaultValue={editingAssignment.mac_address || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-bandwidth">Bandwidth</Label>
                  <Input id="edit-bandwidth" name="bandwidth" defaultValue={editingAssignment.bandwidth || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-vlan_id">VLAN ID</Label>
                  <Input id="edit-vlan_id" name="vlan_id" defaultValue={editingAssignment.vlan_id || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={editingAssignment.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="disconnected">Disconnected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea id="edit-notes" name="notes" defaultValue={editingAssignment.notes || ""} />
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
