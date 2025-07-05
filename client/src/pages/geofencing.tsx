import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Navigation, Users, Clock, Target, Play, Square, Search, Filter } from "lucide-react";
import { insertGeofenceZoneSchema, insertUserLocationSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Form schemas
const createZoneSchema = insertGeofenceZoneSchema.extend({
  name: z.string().min(1, "Zone name is required"),
  zoneType: z.enum(["office", "customer", "service_area", "restricted"]),
  centerLatitude: z.coerce.number().min(-90).max(90),
  centerLongitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1, "Radius must be at least 1 meter"),
});

const locationUpdateSchema = insertUserLocationSchema.extend({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export default function GeofencingPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [locationTracking, setLocationTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch geofencing zones
  const { data: zones = [], isLoading: zonesLoading } = useQuery({
    queryKey: ["/api/geofencing/zones"],
  });

  // Fetch active field engineers
  const { data: fieldEngineers = [] } = useQuery({
    queryKey: ["/api/field-engineers"],
  });

  // Fetch recent geofence events
  const { data: recentEvents = [] } = useQuery({
    queryKey: ["/api/geofencing/events"],
  });

  // Fetch live locations
  const { data: liveLocations = [] } = useQuery({
    queryKey: ["/api/geofencing/locations/live"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Create zone form
  const createZoneForm = useForm({
    resolver: zodResolver(createZoneSchema),
    defaultValues: {
      name: "",
      description: "",
      zoneType: "customer",
      customerId: undefined,
      centerLatitude: 0,
      centerLongitude: 0,
      radius: 100,
    },
  });

  // Create zone mutation
  const createZoneMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/geofencing/zones", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Geofencing zone created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/geofencing/zones"] });
      setCreateDialogOpen(false);
      createZoneForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create geofencing zone",
        variant: "destructive" 
      });
    },
  });

  // Location update mutation
  const locationUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/geofencing/locations", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/geofencing/locations/live"] });
    },
    onError: (error: any) => {
      console.error("Location update failed:", error);
    },
  });

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Geolocation is not supported by this browser",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        
        // Auto-fill form if creating a zone
        if (createDialogOpen) {
          createZoneForm.setValue("centerLatitude", latitude);
          createZoneForm.setValue("centerLongitude", longitude);
        }

        toast({
          title: "Location updated",
          description: `Current location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        });
      },
      (error) => {
        toast({
          title: "Location error",
          description: "Unable to retrieve your location",
          variant: "destructive",
        });
      }
    );
  };

  // Start/stop location tracking
  const toggleLocationTracking = () => {
    if (!locationTracking) {
      if (!navigator.geolocation) {
        toast({
          title: "Location not supported",
          description: "Geolocation is not supported by this browser",
          variant: "destructive",
        });
        return;
      }

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy, altitude, speed, heading } = position.coords;
          
          locationUpdateMutation.mutate({
            latitude,
            longitude,
            accuracy,
            altitude,
            speed: speed ? speed * 3.6 : null, // Convert m/s to km/h
            heading,
            locationSource: "gps",
          });
        },
        (error) => {
          console.error("Location tracking error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );

      setLocationTracking(true);
      toast({
        title: "Location tracking started",
        description: "Your location is now being tracked",
      });

      // Store watch ID for cleanup
      (window as any).locationWatchId = watchId;
    } else {
      if ((window as any).locationWatchId) {
        navigator.geolocation.clearWatch((window as any).locationWatchId);
      }
      setLocationTracking(false);
      toast({
        title: "Location tracking stopped",
        description: "Location tracking has been disabled",
      });
    }
  };

  // Filter zones
  const filteredZones = zones.filter((zone: any) => {
    const matchesSearch = zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         zone.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || zone.zoneType === filterType;
    return matchesSearch && matchesType;
  });

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Geofencing & Location Tracking</h1>
          <p className="text-muted-foreground">
            Track field team locations and manage geofenced zones
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={getCurrentLocation} variant="outline">
            <MapPin className="mr-2 h-4 w-4" />
            Get Location
          </Button>
          <Button 
            onClick={toggleLocationTracking}
            variant={locationTracking ? "destructive" : "default"}
          >
            {locationTracking ? (
              <>
                <Square className="mr-2 h-4 w-4" />
                Stop Tracking
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Tracking
              </>
            )}
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Target className="mr-2 h-4 w-4" />
            Create Zone
          </Button>
        </div>
      </div>

      {/* Live Status Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Zones</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zones.filter((z: any) => z.isActive).length}</div>
            <p className="text-xs text-muted-foreground">
              {zones.length} total zones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Field Engineers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveLocations.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Events</CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tracking Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={locationTracking ? "default" : "secondary"}>
                {locationTracking ? "Active" : "Inactive"}
              </Badge>
            </div>
            {currentLocation && (
              <p className="text-xs text-muted-foreground">
                Last: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search zones by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="office">Office</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="service_area">Service Area</SelectItem>
            <SelectItem value="restricted">Restricted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Geofencing Zones */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {zonesLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredZones.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No geofencing zones</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first geofencing zone to start tracking locations.
            </p>
          </div>
        ) : (
          filteredZones.map((zone: any) => (
            <Card key={zone.id} className={zone.isActive ? "" : "opacity-50"}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{zone.name}</CardTitle>
                    <CardDescription>{zone.description}</CardDescription>
                  </div>
                  <Badge variant={
                    zone.zoneType === "office" ? "default" :
                    zone.zoneType === "customer" ? "secondary" :
                    zone.zoneType === "service_area" ? "outline" :
                    "destructive"
                  }>
                    {zone.zoneType.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Center:</span>
                    <span>{parseFloat(zone.centerLatitude).toFixed(4)}, {parseFloat(zone.centerLongitude).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Radius:</span>
                    <span>{zone.radius}m</span>
                  </div>
                  {currentLocation && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distance:</span>
                      <span>
                        {Math.round(calculateDistance(
                          currentLocation.latitude,
                          currentLocation.longitude,
                          parseFloat(zone.centerLatitude),
                          parseFloat(zone.centerLongitude)
                        ))}m away
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={zone.isActive ? "default" : "secondary"}>
                      {zone.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Live Engineer Locations */}
      {liveLocations.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Live Engineer Locations</CardTitle>
            <CardDescription>Real-time location tracking of field engineers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {liveLocations.map((location: any) => (
                <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <h4 className="font-medium">
                        {location.user?.firstName} {location.user?.lastName}
                      </h4>
                      <p className="text-sm text-muted-foreground">{location.user?.department}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p>{parseFloat(location.latitude).toFixed(6)}, {parseFloat(location.longitude).toFixed(6)}</p>
                    <p className="text-muted-foreground">
                      {location.accuracy && `±${Math.round(location.accuracy)}m`}
                      {location.speed && ` • ${Math.round(location.speed)}km/h`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Zone Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Geofencing Zone</DialogTitle>
            <DialogDescription>
              Set up a new geofenced area for location monitoring
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createZoneForm.handleSubmit((data) => createZoneMutation.mutate(data))} className="space-y-4">
            <div>
              <Label htmlFor="name">Zone Name</Label>
              <Input 
                id="name" 
                {...createZoneForm.register("name")}
                placeholder="e.g., Main Office, Customer Site A"
              />
              {createZoneForm.formState.errors.name && (
                <p className="text-sm text-red-500">{createZoneForm.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                {...createZoneForm.register("description")}
                placeholder="Optional description of the zone"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="zoneType">Zone Type</Label>
              <Select 
                value={createZoneForm.watch("zoneType")} 
                onValueChange={(value) => createZoneForm.setValue("zoneType", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="customer">Customer Location</SelectItem>
                  <SelectItem value="service_area">Service Area</SelectItem>
                  <SelectItem value="restricted">Restricted Zone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="centerLatitude">Latitude</Label>
                <Input 
                  id="centerLatitude" 
                  type="number" 
                  step="any"
                  {...createZoneForm.register("centerLatitude")}
                  placeholder="e.g., 40.7589"
                />
                {createZoneForm.formState.errors.centerLatitude && (
                  <p className="text-sm text-red-500">{createZoneForm.formState.errors.centerLatitude.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="centerLongitude">Longitude</Label>
                <Input 
                  id="centerLongitude" 
                  type="number" 
                  step="any"
                  {...createZoneForm.register("centerLongitude")}
                  placeholder="e.g., -73.9851"
                />
                {createZoneForm.formState.errors.centerLongitude && (
                  <p className="text-sm text-red-500">{createZoneForm.formState.errors.centerLongitude.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="radius">Radius (meters)</Label>
              <Input 
                id="radius" 
                type="number" 
                {...createZoneForm.register("radius")}
                placeholder="100"
              />
              {createZoneForm.formState.errors.radius && (
                <p className="text-sm text-red-500">{createZoneForm.formState.errors.radius.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createZoneMutation.isPending}>
                {createZoneMutation.isPending ? "Creating..." : "Create Zone"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}