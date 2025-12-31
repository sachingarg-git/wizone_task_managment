import { useState, useEffect, useCallback, useRef } from "react";
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
  Radio,
  Plus,
  Edit,
  Trash2,
  Search,
  Signal,
  Loader2,
  MapPin,
  Wifi,
  Activity,
  Map,
  Eye,
  X,
  Navigation,
  Globe,
  History,
  Clock,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Google Maps Component
function GoogleMapEmbed({ lat, lng, name }: { lat: string; lng: string; name: string }) {
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${lat},${lng}&zoom=15`;
  
  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border">
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={mapUrl}
        title={`Map of ${name}`}
      />
    </div>
  );
}

// Simple Map Preview using OpenStreetMap (free, no API key required)
function MapPreview({ lat, lng, zoom = 15 }: { lat: number; lng: number; zoom?: number }) {
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
  
  return (
    <div className="w-full h-48 rounded-lg overflow-hidden border bg-gray-100">
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        src={mapUrl}
        title="Tower Location Map"
      />
    </div>
  );
}

interface NetworkTower {
  id: number;
  name: string;
  target_ip: string | null;
  location: string | null;
  ssid: string | null;
  total_devices: number | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  bandwidth: string | null;
  expected_latency: string | null;
  actual_latency: string | null;
  description: string | null;
  status: string;
  last_test_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function TowerMaster() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingTower, setEditingTower] = useState<NetworkTower | null>(null);
  const [viewingTower, setViewingTower] = useState<NetworkTower | null>(null);
  const [addFormLat, setAddFormLat] = useState("");
  const [addFormLng, setAddFormLng] = useState("");
  const [addFormAddress, setAddFormAddress] = useState("");
  const [editFormLat, setEditFormLat] = useState("");
  const [editFormLng, setEditFormLng] = useState("");
  const [editFormAddress, setEditFormAddress] = useState("");
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reverse geocoding function to get address from lat/lng
  const fetchAddressFromCoords = useCallback(async (lat: string, lng: string, isEdit: boolean) => {
    if (!lat || !lng) return;
    
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    if (isNaN(latNum) || isNaN(lngNum)) return;
    
    setIsFetchingAddress(true);
    try {
      // Using Nominatim OpenStreetMap reverse geocoding (free, no API key)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lngNum}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'WizoneTaskManager/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          if (isEdit) {
            setEditFormAddress(data.display_name);
          } else {
            setAddFormAddress(data.display_name);
          }
          toast({ title: "Address Found", description: "Address auto-filled from coordinates" });
        }
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    } finally {
      setIsFetchingAddress(false);
    }
  }, [toast]);

  // Effect to auto-fetch address when lat/lng changes in Add form
  useEffect(() => {
    const timer = setTimeout(() => {
      if (addFormLat && addFormLng) {
        fetchAddressFromCoords(addFormLat, addFormLng, false);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [addFormLat, addFormLng, fetchAddressFromCoords]);

  // Effect to auto-fetch address when lat/lng changes in Edit form
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editFormLat && editFormLng && editingTower) {
        // Only fetch if coords changed from original
        if (editFormLat !== editingTower.latitude || editFormLng !== editingTower.longitude) {
          fetchAddressFromCoords(editFormLat, editFormLng, true);
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [editFormLat, editFormLng, editingTower, fetchAddressFromCoords]);

  // Reset edit form when editing tower changes
  useEffect(() => {
    if (editingTower) {
      setEditFormLat(editingTower.latitude || "");
      setEditFormLng(editingTower.longitude || "");
      setEditFormAddress(editingTower.address || "");
    }
  }, [editingTower]);

  const { data: towers = [], isLoading, error } = useQuery<NetworkTower[]>({
    queryKey: ["/api/network/towers"],
  });

  // Fetch all tasks for tower history
  const { data: allTasks = [] } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

  // Get tasks related to a specific tower (by tower name in title)
  const getTowerTasks = (towerName: string) => {
    return allTasks.filter((task: any) => 
      task.title?.toLowerCase().includes(towerName.toLowerCase()) ||
      task.title?.toLowerCase().includes('node down - ' + towerName.toLowerCase())
    ).sort((a: any, b: any) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime());
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/network/towers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/network/towers"] });
      setIsAddDialogOpen(false);
      toast({ title: "Success", description: "Tower added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await apiRequest("PUT", `/api/network/towers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/network/towers"] });
      setIsEditDialogOpen(false);
      setEditingTower(null);
      toast({ title: "Success", description: "Tower updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/network/towers/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/network/towers"] });
      toast({ title: "Success", description: "Tower deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredTowers = towers.filter((tower) => {
    const matchesSearch =
      tower.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tower.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tower.target_ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tower.ssid?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || tower.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-500">Online</Badge>;
      case "offline":
        return <Badge className="bg-red-500">Offline</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500">Warning</Badge>;
      case "maintenance":
        return <Badge className="bg-blue-500">Maintenance</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleAdd = (formData: FormData) => {
    const data = {
      name: formData.get("name") as string,
      targetIP: formData.get("target_ip") as string || null,
      location: formData.get("location") as string || null,
      ssid: formData.get("ssid") as string || null,
      totalDevices: parseInt(formData.get("total_devices") as string) || 0,
      address: addFormAddress || null,
      latitude: addFormLat || null,
      longitude: addFormLng || null,
      bandwidth: formData.get("bandwidth") as string || "1 Gbps",
      expectedLatency: formData.get("expected_latency") as string || "5ms",
      description: formData.get("description") as string || null,
    };
    createMutation.mutate(data);
    // Reset form state
    setAddFormLat("");
    setAddFormLng("");
    setAddFormAddress("");
  };

  const handleEdit = (formData: FormData) => {
    if (!editingTower) return;
    const data = {
      name: formData.get("name") as string,
      targetIP: formData.get("target_ip") as string || null,
      location: formData.get("location") as string || null,
      ssid: formData.get("ssid") as string || null,
      totalDevices: parseInt(formData.get("total_devices") as string) || 0,
      address: editFormAddress || null,
      latitude: editFormLat || null,
      longitude: editFormLng || null,
      bandwidth: formData.get("bandwidth") as string,
      expectedLatency: formData.get("expected_latency") as string,
      description: formData.get("description") as string || null,
      status: formData.get("status") as string,
    };
    updateMutation.mutate({ id: editingTower.id, data });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this tower?")) {
      deleteMutation.mutate(id);
    }
  };

  // Stats
  const totalTowers = towers.length;
  const onlineCount = towers.filter((t) => t.status === "online").length;
  const offlineCount = towers.filter((t) => t.status === "offline").length;
  const warningCount = towers.filter((t) => t.status === "warning").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading towers...</span>
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
          <h1 className="text-3xl font-bold">Tower Master</h1>
          <p className="text-muted-foreground">Manage network towers and connectivity</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setAddFormLat("");
            setAddFormLng("");
            setAddFormAddress("");
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Tower
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Add New Tower
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
                <div>
                  <Label htmlFor="name">Tower Name *</Label>
                  <Input id="name" name="name" placeholder="e.g., LAHAR TOWER" required />
                </div>
                <div>
                  <Label htmlFor="target_ip">Target IP Address</Label>
                  <Input id="target_ip" name="target_ip" placeholder="e.g., 192.168.1.1" />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" placeholder="e.g., Raipur" />
                </div>
                <div>
                  <Label htmlFor="ssid">SSID</Label>
                  <Input id="ssid" name="ssid" placeholder="e.g., WIZONE-TOWER-01" />
                </div>
                <div>
                  <Label htmlFor="total_devices">Total Devices</Label>
                  <Input id="total_devices" name="total_devices" type="number" placeholder="0" />
                </div>
                <div>
                  <Label htmlFor="bandwidth">Bandwidth</Label>
                  <Select name="bandwidth" defaultValue="1 Gbps">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100 Mbps">100 Mbps</SelectItem>
                      <SelectItem value="500 Mbps">500 Mbps</SelectItem>
                      <SelectItem value="1 Gbps">1 Gbps</SelectItem>
                      <SelectItem value="10 Gbps">10 Gbps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expected_latency">Expected Latency</Label>
                  <Select name="expected_latency" defaultValue="5ms">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1ms">1ms</SelectItem>
                      <SelectItem value="5ms">5ms</SelectItem>
                      <SelectItem value="10ms">10ms</SelectItem>
                      <SelectItem value="20ms">20ms</SelectItem>
                      <SelectItem value="50ms">50ms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location Section with Map */}
              <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Globe className="h-4 w-4 text-blue-600" />
                  GPS Coordinates & Map
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input 
                      id="latitude" 
                      name="latitude" 
                      placeholder="e.g., 29.95790205" 
                      value={addFormLat}
                      onChange={(e) => setAddFormLat(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input 
                      id="longitude" 
                      name="longitude" 
                      placeholder="e.g., 77.79425258" 
                      value={addFormLng}
                      onChange={(e) => setAddFormLng(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Map Preview */}
                {addFormLat && addFormLng && !isNaN(parseFloat(addFormLat)) && !isNaN(parseFloat(addFormLng)) && (
                  <MapPreview lat={parseFloat(addFormLat)} lng={parseFloat(addFormLng)} />
                )}

                <div>
                  <Label htmlFor="address" className="flex items-center gap-2">
                    Full Address
                    {isFetchingAddress && <Loader2 className="h-3 w-3 animate-spin" />}
                  </Label>
                  <Textarea 
                    id="address" 
                    name="address" 
                    placeholder="Auto-filled from coordinates or enter manually..."
                    value={addFormAddress}
                    onChange={(e) => setAddFormAddress(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Address will auto-fill when you enter valid lat/long coordinates
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description / Notes</Label>
                <Textarea id="description" name="description" placeholder="Additional notes about this tower..." />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Tower
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
            <CardTitle className="text-sm font-medium">Total Towers</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTowers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Signal className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{onlineCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <Wifi className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{offlineCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Warning</CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, location, IP, or SSID..."
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
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Towers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tower Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Target IP</TableHead>
                <TableHead>SSID</TableHead>
                <TableHead>Devices</TableHead>
                <TableHead>Bandwidth</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTowers.map((tower) => {
                const towerTasks = getTowerTasks(tower.name);
                const openTasks = towerTasks.filter((t: any) => t.status === 'pending' || t.status === 'in_progress');
                
                return (
                <TableRow key={tower.id}>
                  <TableCell>
                    <button 
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                      onClick={() => {
                        setViewingTower(tower);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      {tower.name}
                      {openTasks.length > 0 && (
                        <Badge className="ml-1 bg-orange-500 text-xs">{openTasks.length}</Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {tower.location || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{tower.target_ip || "-"}</TableCell>
                  <TableCell>{tower.ssid || "-"}</TableCell>
                  <TableCell>{tower.total_devices || 0}</TableCell>
                  <TableCell>{tower.bandwidth || "-"}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{tower.actual_latency || tower.expected_latency || "-"}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(tower.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setViewingTower(tower);
                          setIsViewDialogOpen(true);
                        }}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingTower(tower);
                          setIsEditDialogOpen(true);
                        }}
                        title="Edit Tower"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tower.id)}
                        disabled={deleteMutation.isPending}
                        title="Delete Tower"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
              })}
              {filteredTowers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No towers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingTower(null);
          setEditFormLat("");
          setEditFormLng("");
          setEditFormAddress("");
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Tower
            </DialogTitle>
          </DialogHeader>
          {editingTower && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEdit(new FormData(e.currentTarget));
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Tower Name *</Label>
                  <Input id="edit-name" name="name" defaultValue={editingTower.name} required />
                </div>
                <div>
                  <Label htmlFor="edit-target_ip">Target IP Address</Label>
                  <Input id="edit-target_ip" name="target_ip" defaultValue={editingTower.target_ip || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-location">Location</Label>
                  <Input id="edit-location" name="location" defaultValue={editingTower.location || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-ssid">SSID</Label>
                  <Input id="edit-ssid" name="ssid" defaultValue={editingTower.ssid || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-total_devices">Total Devices</Label>
                  <Input id="edit-total_devices" name="total_devices" type="number" defaultValue={editingTower.total_devices || 0} />
                </div>
                <div>
                  <Label htmlFor="edit-bandwidth">Bandwidth</Label>
                  <Select name="bandwidth" defaultValue={editingTower.bandwidth || "1 Gbps"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100 Mbps">100 Mbps</SelectItem>
                      <SelectItem value="500 Mbps">500 Mbps</SelectItem>
                      <SelectItem value="1 Gbps">1 Gbps</SelectItem>
                      <SelectItem value="10 Gbps">10 Gbps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-expected_latency">Expected Latency</Label>
                  <Select name="expected_latency" defaultValue={editingTower.expected_latency || "5ms"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1ms">1ms</SelectItem>
                      <SelectItem value="5ms">5ms</SelectItem>
                      <SelectItem value="10ms">10ms</SelectItem>
                      <SelectItem value="20ms">20ms</SelectItem>
                      <SelectItem value="50ms">50ms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={editingTower.status || "online"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location Section with Map */}
              <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Globe className="h-4 w-4 text-blue-600" />
                  GPS Coordinates & Map
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-latitude">Latitude</Label>
                    <Input 
                      id="edit-latitude" 
                      name="latitude"
                      value={editFormLat}
                      onChange={(e) => setEditFormLat(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-longitude">Longitude</Label>
                    <Input 
                      id="edit-longitude" 
                      name="longitude"
                      value={editFormLng}
                      onChange={(e) => setEditFormLng(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Map Preview */}
                {editFormLat && editFormLng && !isNaN(parseFloat(editFormLat)) && !isNaN(parseFloat(editFormLng)) && (
                  <MapPreview lat={parseFloat(editFormLat)} lng={parseFloat(editFormLng)} />
                )}

                <div>
                  <Label htmlFor="edit-address" className="flex items-center gap-2">
                    Full Address
                    {isFetchingAddress && <Loader2 className="h-3 w-3 animate-spin" />}
                  </Label>
                  <Textarea 
                    id="edit-address" 
                    name="address"
                    value={editFormAddress}
                    onChange={(e) => setEditFormAddress(e.target.value)}
                    className="min-h-[60px]"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Description / Notes</Label>
                <Textarea id="edit-description" name="description" defaultValue={editingTower.description || ""} />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Tower
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Tower Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
        setIsViewDialogOpen(open);
        if (!open) setViewingTower(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-blue-600" />
              Tower Details
            </DialogTitle>
          </DialogHeader>
          {viewingTower && (
            <div className="space-y-6">
              {/* Tower Info Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{viewingTower.name}</h2>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {viewingTower.location || "No location specified"}
                  </p>
                </div>
                {getStatusBadge(viewingTower.status)}
              </div>

              {/* Map Section */}
              {viewingTower.latitude && viewingTower.longitude && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    Location Map
                  </h3>
                  <div className="w-full h-72 rounded-lg overflow-hidden border">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(viewingTower.longitude) - 0.02},${parseFloat(viewingTower.latitude) - 0.02},${parseFloat(viewingTower.longitude) + 0.02},${parseFloat(viewingTower.latitude) + 0.02}&layer=mapnik&marker=${viewingTower.latitude},${viewingTower.longitude}`}
                      title="Tower Location"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://www.google.com/maps?q=${viewingTower.latitude},${viewingTower.longitude}`, '_blank')}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Open in Google Maps
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${viewingTower.latitude},${viewingTower.longitude}`, '_blank')}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Get Directions
                    </Button>
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Target IP</p>
                  <p className="font-mono font-medium">{viewingTower.target_ip || "-"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">SSID</p>
                  <p className="font-medium">{viewingTower.ssid || "-"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Devices</p>
                  <p className="font-medium">{viewingTower.total_devices || 0}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Bandwidth</p>
                  <p className="font-medium">{viewingTower.bandwidth || "-"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Expected Latency</p>
                  <p className="font-medium">{viewingTower.expected_latency || "-"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Actual Latency</p>
                  <p className="font-medium">{viewingTower.actual_latency || "-"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Latitude</p>
                  <p className="font-mono text-sm">{viewingTower.latitude || "-"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Longitude</p>
                  <p className="font-mono text-sm">{viewingTower.longitude || "-"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Last Test</p>
                  <p className="text-sm">{viewingTower.last_test_at ? new Date(viewingTower.last_test_at).toLocaleString() : "Never"}</p>
                </div>
              </div>

              {/* Full Address */}
              {viewingTower.address && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Full Address</p>
                  <p className="font-medium">{viewingTower.address}</p>
                </div>
              )}

              {/* Description */}
              {viewingTower.description && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Description / Notes</p>
                  <p>{viewingTower.description}</p>
                </div>
              )}

              {/* Task History Section */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Task History
                </h3>
                {(() => {
                  const towerTasks = getTowerTasks(viewingTower.name);
                  if (towerTasks.length === 0) {
                    return (
                      <div className="p-4 bg-gray-50 rounded-lg text-center text-muted-foreground">
                        No tasks found for this tower
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {towerTasks.map((task: any) => (
                        <div key={task.id} className="p-3 border rounded-lg hover:bg-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {task.status === 'completed' ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : task.status === 'in_progress' ? (
                              <Clock className="h-5 w-5 text-blue-500" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-orange-500" />
                            )}
                            <div>
                              <p className="font-medium text-sm">{task.ticketNumber || task.ticket_number}</p>
                              <p className="text-xs text-muted-foreground">{task.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(task.createdAt || task.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge className={
                            task.status === 'completed' ? 'bg-green-500' :
                            task.status === 'in_progress' ? 'bg-blue-500' :
                            task.status === 'pending' ? 'bg-orange-500' : 'bg-gray-500'
                          }>
                            {task.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setViewingTower(null);
                    setIsViewDialogOpen(false);
                    setEditingTower(viewingTower);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Tower
                </Button>
                <Button onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
