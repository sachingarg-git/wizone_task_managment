import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Route, TrendingUp, User, Building2, Car } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface TrackingEntry {
  id: number;
  userId: string;
  taskId?: number;
  latitude: string;
  longitude: string;
  distanceFromOffice?: string;
  distanceFromCustomer?: string;
  movementType?: string;
  speedKmh?: string;
  accuracy?: string;
  batteryLevel?: number;
  networkStatus?: string;
  timestamp: string;
  createdAt: string;
}

interface TrackingStats {
  totalDistance: number;
  averageSpeed: number;
  timeAtCustomerSites: number;
  timeInTransit: number;
}

interface OfficeLocation {
  id: number;
  name: string;
  description?: string;
  latitude: string;
  longitude: string;
  address?: string;
  isMainOffice: boolean;
  isActive: boolean;
}

interface Engineer {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function TrackingHistory() {
  const [selectedEngineer, setSelectedEngineer] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Fetch field engineers
  const { data: engineers = [] } = useQuery<Engineer[]>({
    queryKey: ["/api/field-engineers"],
  });

  // Fetch office locations
  const { data: officeLocations = [] } = useQuery<OfficeLocation[]>({
    queryKey: ["/api/tracking/office-locations"],
  });

  // Fetch tracking history for selected engineer
  const { data: trackingHistory = [], isLoading: historyLoading } = useQuery<TrackingEntry[]>({
    queryKey: ["/api/tracking/history", selectedEngineer],
    enabled: !!selectedEngineer,
  });

  // Fetch tracking stats
  const { data: trackingStats } = useQuery<TrackingStats>({
    queryKey: ["/api/tracking/stats", selectedEngineer, dateRange.start, dateRange.end],
    enabled: !!selectedEngineer,
  });

  const mainOffice = officeLocations.find(office => office.isMainOffice);

  const getMovementTypeColor = (type?: string) => {
    switch (type) {
      case 'at_customer_location': return 'bg-green-100 text-green-800';
      case 'traveling_to_customer': return 'bg-blue-100 text-blue-800';
      case 'returning_to_office': return 'bg-orange-100 text-orange-800';
      case 'break': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMovementTypeIcon = (type?: string) => {
    switch (type) {
      case 'at_customer_location': return <MapPin className="h-4 w-4" />;
      case 'traveling_to_customer': return <Car className="h-4 w-4" />;
      case 'returning_to_office': return <Building2 className="h-4 w-4" />;
      case 'break': return <Clock className="h-4 w-4" />;
      default: return <Route className="h-4 w-4" />;
    }
  };

  const formatMovementType = (type?: string) => {
    switch (type) {
      case 'at_customer_location': return 'At Customer';
      case 'traveling_to_customer': return 'En Route';
      case 'returning_to_office': return 'Returning';
      case 'break': return 'On Break';
      default: return 'Other';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Engineer Tracking History</h1>
          <p className="text-muted-foreground">Monitor field engineer locations and calculate distances from office</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Tracking Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="engineer">Field Engineer</Label>
              <Select value={selectedEngineer} onValueChange={setSelectedEngineer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select engineer" />
                </SelectTrigger>
                <SelectContent>
                  {engineers.map((engineer) => (
                    <SelectItem key={engineer.id} value={engineer.id}>
                      {engineer.firstName} {engineer.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Office Info */}
      {mainOffice && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Office Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Office Name</Label>
                <p className="text-lg">{mainOffice.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Address</Label>
                <p className="text-sm text-muted-foreground">{mainOffice.address}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Coordinates</Label>
                <p className="text-sm text-muted-foreground">
                  {parseFloat(mainOffice.latitude).toFixed(4)}, {parseFloat(mainOffice.longitude).toFixed(4)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracking Stats */}
      {selectedEngineer && trackingStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Route className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Max Distance</p>
                  <p className="text-2xl font-bold">{trackingStats.totalDistance.toFixed(1)} km</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Speed</p>
                  <p className="text-2xl font-bold">{trackingStats.averageSpeed.toFixed(1)} km/h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">At Customer</p>
                  <p className="text-2xl font-bold">{trackingStats.timeAtCustomerSites} min</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Car className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Transit</p>
                  <p className="text-2xl font-bold">{trackingStats.timeInTransit} min</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tracking History */}
      {selectedEngineer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tracking History
              {historyLoading && <Badge variant="secondary">Loading...</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trackingHistory.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-600">No tracking data found</p>
                <p className="text-sm text-gray-500">
                  Select an engineer to view their tracking history
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {trackingHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getMovementTypeIcon(entry.movementType)}
                        <Badge className={getMovementTypeColor(entry.movementType)}>
                          {formatMovementType(entry.movementType)}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="font-medium">
                          {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Coordinates: {parseFloat(entry.latitude).toFixed(4)}, {parseFloat(entry.longitude).toFixed(4)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm">
                      {entry.distanceFromOffice && (
                        <div className="text-center">
                          <p className="font-medium">{parseFloat(entry.distanceFromOffice).toFixed(1)} km</p>
                          <p className="text-muted-foreground">from office</p>
                        </div>
                      )}
                      
                      {entry.speedKmh && (
                        <div className="text-center">
                          <p className="font-medium">{parseFloat(entry.speedKmh).toFixed(0)} km/h</p>
                          <p className="text-muted-foreground">speed</p>
                        </div>
                      )}
                      
                      {entry.batteryLevel && (
                        <div className="text-center">
                          <p className="font-medium">{entry.batteryLevel}%</p>
                          <p className="text-muted-foreground">battery</p>
                        </div>
                      )}

                      {entry.taskId && (
                        <div className="text-center">
                          <p className="font-medium">T{entry.taskId.toString().padStart(6, '0')}</p>
                          <p className="text-muted-foreground">task</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}