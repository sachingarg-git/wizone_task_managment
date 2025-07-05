import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, MapPin, Plus, Edit, Trash2, Save, X, Lightbulb, Target, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface OfficeLocation {
  id: number;
  name: string;
  description?: string;
  latitude: string;
  longitude: string;
  address?: string;
  isMainOffice: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OfficeLocationSuggestion {
  id: number;
  suggestedLatitude: string;
  suggestedLongitude: string;
  calculatedCenter: boolean;
  teamMembersCount: number;
  averageDistance?: string;
  maxDistance?: string;
  coverageRadius?: string;
  efficiency?: string;
  suggestedAddress?: string;
  analysisData?: any;
  createdAt: string;
  updatedAt: string;
}

interface OfficeFormData {
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  address: string;
  isMainOffice: boolean;
  isActive: boolean;
}

export default function OfficeManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedOffice, setSelectedOffice] = useState<OfficeLocation | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<OfficeFormData>({
    name: "",
    description: "",
    latitude: "",
    longitude: "",
    address: "",
    isMainOffice: false,
    isActive: true,
  });

  // Check if user is admin
  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">Only administrators can manage office locations.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch office locations
  const { data: offices = [], isLoading } = useQuery<OfficeLocation[]>({
    queryKey: ["/api/tracking/office-locations"],
  });

  // Create office mutation
  const createOfficeMutation = useMutation({
    mutationFn: async (officeData: OfficeFormData) => {
      return await apiRequest("POST", "/api/tracking/office-locations", officeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/office-locations"] });
      setIsFormOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Office location created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create office location: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update office mutation
  const updateOfficeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<OfficeFormData> }) => {
      return await apiRequest("PATCH", `/api/tracking/office-locations/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/office-locations"] });
      setSelectedOffice(null);
      setIsFormOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Office location updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update office location: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete office mutation
  const deleteOfficeMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/tracking/office-locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/office-locations"] });
      toast({
        title: "Success",
        description: "Office location deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete office location: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Fetch office location suggestions
  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery<OfficeLocationSuggestion[]>({
    queryKey: ["/api/tracking/office-suggestions"],
  });

  // Generate office suggestions mutation
  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/tracking/office-suggestions/generate");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking/office-suggestions"] });
      toast({
        title: "Success",
        description: "Office location suggestions generated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate suggestions: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      latitude: "",
      longitude: "",
      address: "",
      isMainOffice: false,
      isActive: true,
    });
  };

  const handleEdit = (office: OfficeLocation) => {
    setSelectedOffice(office);
    setFormData({
      name: office.name,
      description: office.description || "",
      latitude: office.latitude,
      longitude: office.longitude,
      address: office.address || "",
      isMainOffice: office.isMainOffice,
      isActive: office.isActive,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate coordinates
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid latitude and longitude values",
        variant: "destructive",
      });
      return;
    }

    if (selectedOffice) {
      updateOfficeMutation.mutate({ id: selectedOffice.id, data: formData });
    } else {
      createOfficeMutation.mutate(formData);
    }
  };

  const handleDelete = (office: OfficeLocation) => {
    if (office.isMainOffice) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete the main office. Set another office as main first.",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Are you sure you want to delete "${office.name}"?`)) {
      deleteOfficeMutation.mutate(office.id);
    }
  };

  const mainOffice = offices.find(office => office.isMainOffice);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Office Management</h1>
          <p className="text-muted-foreground">Manage office locations for tracking and distance calculations</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setSelectedOffice(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Office Location
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedOffice ? 'Edit Office Location' : 'Add Office Location'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Office Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Main Office"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Full address"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    placeholder="28.6139"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    placeholder="77.2090"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isMainOffice"
                  checked={formData.isMainOffice}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isMainOffice: checked }))}
                />
                <Label htmlFor="isMainOffice">Set as Main Office</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createOfficeMutation.isPending || updateOfficeMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {selectedOffice ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Main Office */}
      {mainOffice && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Main Office Location
              <Badge variant="default" className="ml-2">Primary</Badge>
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
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => handleEdit(mainOffice)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Location
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Office Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            All Office Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading office locations...</p>
            </div>
          ) : offices.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-600">No office locations found</p>
              <p className="text-sm text-gray-500">Add your first office location to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {offices.map((office) => (
                <div
                  key={office.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{office.name}</h3>
                      {office.isMainOffice && (
                        <Badge variant="default">Main Office</Badge>
                      )}
                      {!office.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{office.address}</p>
                    <p className="text-xs text-muted-foreground">
                      Coordinates: {parseFloat(office.latitude).toFixed(4)}, {parseFloat(office.longitude).toFixed(4)}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(office)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!office.isMainOffice && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(office)}
                        disabled={deleteOfficeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Office Location Suggestions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Office Location Suggestions
              </CardTitle>
              <CardDescription>
                AI-powered suggestions for optimal office placement based on team distribution
              </CardDescription>
            </div>
            <Button
              onClick={() => generateSuggestionsMutation.mutate()}
              disabled={generateSuggestionsMutation.isPending}
              variant="outline"
            >
              {generateSuggestionsMutation.isPending ? "Generating..." : "Generate Suggestions"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {suggestionsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading suggestions...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Suggestions Available</h3>
              <p className="text-muted-foreground mb-4">
                Generate suggestions based on your team's location data.
              </p>
              <Button
                onClick={() => generateSuggestionsMutation.mutate()}
                disabled={generateSuggestionsMutation.isPending}
              >
                Generate First Suggestions
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={suggestion.calculatedCenter ? "default" : "secondary"}>
                          {suggestion.calculatedCenter ? "AI Optimized" : "Basic Center"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {suggestion.teamMembersCount} team members analyzed
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Coordinates:</span>
                          <br />
                          <span className="text-muted-foreground">
                            {parseFloat(suggestion.suggestedLatitude).toFixed(6)}, {parseFloat(suggestion.suggestedLongitude).toFixed(6)}
                          </span>
                        </div>
                        {suggestion.suggestedAddress && (
                          <div>
                            <span className="font-medium">Suggested Address:</span>
                            <br />
                            <span className="text-muted-foreground">{suggestion.suggestedAddress}</span>
                          </div>
                        )}
                      </div>

                      {(suggestion.averageDistance || suggestion.maxDistance || suggestion.coverageRadius) && (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {suggestion.averageDistance && (
                            <div>
                              <span className="font-medium">Avg Distance:</span>
                              <br />
                              <span className="text-muted-foreground">{suggestion.averageDistance}</span>
                            </div>
                          )}
                          {suggestion.maxDistance && (
                            <div>
                              <span className="font-medium">Max Distance:</span>
                              <br />
                              <span className="text-muted-foreground">{suggestion.maxDistance}</span>
                            </div>
                          )}
                          {suggestion.coverageRadius && (
                            <div>
                              <span className="font-medium">Coverage:</span>
                              <br />
                              <span className="text-muted-foreground">{suggestion.coverageRadius}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {suggestion.efficiency && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Efficiency Score:</span>
                          <Badge variant="outline">{suggestion.efficiency}</Badge>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          name: "Suggested Office Location",
                          description: `AI-generated suggestion based on ${suggestion.teamMembersCount} team members`,
                          latitude: suggestion.suggestedLatitude,
                          longitude: suggestion.suggestedLongitude,
                          address: suggestion.suggestedAddress || "",
                          isMainOffice: false,
                          isActive: true,
                        });
                        setSelectedOffice(null);
                        setIsFormOpen(true);
                      }}
                    >
                      Use This Location
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Generated: {new Date(suggestion.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}