import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Radio, 
  Navigation, 
  Ruler, 
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Compass,
  Locate,
  RotateCcw,
  Calculator
} from "lucide-react";

// Leaflet Map Component
function LeafletMap({ towerCoords, clientCoords, towerName }: { 
  towerCoords: { lat: number; lng: number }; 
  clientCoords: { lat: number; lng: number };
  towerName: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Dynamically load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Dynamically load Leaflet JS
    const loadLeaflet = async () => {
      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      const L = (window as any).L;
      
      // Clear existing map if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Calculate center and bounds
      const centerLat = (towerCoords.lat + clientCoords.lat) / 2;
      const centerLng = (towerCoords.lng + clientCoords.lng) / 2;

      // Create map
      const map = L.map(mapRef.current).setView([centerLat, centerLng], 13);
      mapInstanceRef.current = map;

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Custom icons
      const towerIcon = L.divIcon({
        className: 'custom-tower-icon',
        html: `<div style="
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        "><span style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 14px;">A</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });

      const clientIcon = L.divIcon({
        className: 'custom-client-icon',
        html: `<div style="
          background: linear-gradient(135deg, #22c55e, #16a34a);
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        "><span style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 14px;">B</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });

      // Add tower marker (A)
      L.marker([towerCoords.lat, towerCoords.lng], { icon: towerIcon })
        .addTo(map)
        .bindPopup(`<div style="text-align: center; padding: 5px;">
          <strong style="color: #1d4ed8; font-size: 14px;">📡 Tower (A)</strong><br/>
          <span style="font-weight: 600;">${towerName}</span><br/>
          <span style="font-size: 11px; color: #666;">${towerCoords.lat.toFixed(6)}, ${towerCoords.lng.toFixed(6)}</span>
        </div>`);

      // Add client marker (B)
      L.marker([clientCoords.lat, clientCoords.lng], { icon: clientIcon })
        .addTo(map)
        .bindPopup(`<div style="text-align: center; padding: 5px;">
          <strong style="color: #16a34a; font-size: 14px;">📍 Client (B)</strong><br/>
          <span style="font-size: 11px; color: #666;">${clientCoords.lat.toFixed(6)}, ${clientCoords.lng.toFixed(6)}</span>
        </div>`);

      // Draw line between tower and client
      const polyline = L.polyline([
        [towerCoords.lat, towerCoords.lng],
        [clientCoords.lat, clientCoords.lng]
      ], {
        color: '#ef4444',
        weight: 3,
        opacity: 0.8,
        dashArray: '10, 10'
      }).addTo(map);

      // Add distance label at midpoint
      const midLat = (towerCoords.lat + clientCoords.lat) / 2;
      const midLng = (towerCoords.lng + clientCoords.lng) / 2;
      
      // Calculate distance for label
      const R = 6371;
      const dLat = (clientCoords.lat - towerCoords.lat) * Math.PI / 180;
      const dLon = (clientCoords.lng - towerCoords.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(towerCoords.lat * Math.PI / 180) * Math.cos(clientCoords.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      const distanceLabel = L.divIcon({
        className: 'distance-label',
        html: `<div style="
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          padding: 8px 14px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 12px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
          border: 2px solid white;
          text-align: center;
        "><div style="font-size: 10px; opacity: 0.9;">✈️ Air Distance</div><div style="font-size: 14px;">${distance.toFixed(2)} km</div></div>`,
        iconSize: [120, 48],
        iconAnchor: [60, 24]
      });

      L.marker([midLat, midLng], { icon: distanceLabel }).addTo(map);

      // Fit bounds to show both markers
      const bounds = L.latLngBounds([
        [towerCoords.lat, towerCoords.lng],
        [clientCoords.lat, clientCoords.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [towerCoords, clientCoords, towerName]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '400px' }} />;
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate bearing between two points
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;
  return bearing;
}

// Get compass direction from bearing
function getCompassDirection(bearing: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}

// Get feasibility status based on distance
function getFeasibilityStatus(distance: number): { status: string; color: string; icon: any; message: string } {
  if (distance <= 2) {
    return {
      status: 'Excellent',
      color: 'bg-green-500',
      icon: CheckCircle,
      message: 'Ideal distance for high-speed connectivity. Minimal signal loss expected.'
    };
  } else if (distance <= 5) {
    return {
      status: 'Good',
      color: 'bg-emerald-500',
      icon: CheckCircle,
      message: 'Good connectivity possible. Standard equipment should work well.'
    };
  } else if (distance <= 10) {
    return {
      status: 'Moderate',
      color: 'bg-yellow-500',
      icon: AlertTriangle,
      message: 'Connectivity possible with proper equipment. Site survey recommended.'
    };
  } else if (distance <= 15) {
    return {
      status: 'Challenging',
      color: 'bg-orange-500',
      icon: AlertTriangle,
      message: 'Long-range equipment required. Line of sight critical.'
    };
  } else {
    return {
      status: 'Not Recommended',
      color: 'bg-red-500',
      icon: XCircle,
      message: 'Distance exceeds recommended range. Consider alternative tower or relay point.'
    };
  }
}

export default function FeasibilityTool() {
  const [selectedTowerId, setSelectedTowerId] = useState<string>("");
  const [clientLat, setClientLat] = useState<string>("");
  const [clientLng, setClientLng] = useState<string>("");
  const [showResult, setShowResult] = useState(false);

  // Fetch towers from tower master
  const { data: towers = [], isLoading } = useQuery({
    queryKey: ["/api/network/towers"],
    queryFn: async () => {
      const response = await fetch("/api/network/towers");
      if (!response.ok) throw new Error("Failed to fetch towers");
      return response.json();
    },
  });

  // Filter towers that have coordinates
  const towersWithCoordinates = useMemo(() => {
    return towers.filter((tower: any) => 
      tower.latitude && tower.longitude && 
      !isNaN(parseFloat(tower.latitude)) && !isNaN(parseFloat(tower.longitude))
    );
  }, [towers]);

  // Get selected tower details
  const selectedTower = useMemo(() => {
    if (!selectedTowerId) return null;
    return towers.find((t: any) => String(t.id) === selectedTowerId);
  }, [selectedTowerId, towers]);

  // Calculate distance and feasibility
  const calculationResult = useMemo(() => {
    if (!selectedTower || !clientLat || !clientLng) return null;
    
    const towerLat = parseFloat(selectedTower.latitude);
    const towerLng = parseFloat(selectedTower.longitude);
    const custLat = parseFloat(clientLat);
    const custLng = parseFloat(clientLng);
    
    if (isNaN(towerLat) || isNaN(towerLng) || isNaN(custLat) || isNaN(custLng)) return null;
    
    const distance = calculateDistance(towerLat, towerLng, custLat, custLng);
    const bearing = calculateBearing(towerLat, towerLng, custLat, custLng);
    const direction = getCompassDirection(bearing);
    const feasibility = getFeasibilityStatus(distance);
    
    return {
      distance,
      bearing,
      direction,
      feasibility,
      towerCoords: { lat: towerLat, lng: towerLng },
      clientCoords: { lat: custLat, lng: custLng }
    };
  }, [selectedTower, clientLat, clientLng]);

  const handleCalculate = () => {
    if (selectedTower && clientLat && clientLng) {
      setShowResult(true);
    }
  };

  const handleReset = () => {
    setSelectedTowerId("");
    setClientLat("");
    setClientLng("");
    setShowResult(false);
  };

  // Generate Google Maps embed URL
  const getMapUrl = () => {
    if (!calculationResult) return "";
    const { towerCoords, clientCoords } = calculationResult;
    // Center map between two points
    const centerLat = (towerCoords.lat + clientCoords.lat) / 2;
    const centerLng = (towerCoords.lng + clientCoords.lng) / 2;
    
    // Calculate zoom based on distance
    let zoom = 15;
    if (calculationResult.distance > 10) zoom = 12;
    else if (calculationResult.distance > 5) zoom = 13;
    else if (calculationResult.distance > 2) zoom = 14;
    
    return `https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${towerCoords.lat},${towerCoords.lng}&destination=${clientCoords.lat},${clientCoords.lng}&mode=walking&zoom=${zoom}`;
  };

  // Alternative: OpenStreetMap static image
  const getOSMMapUrl = () => {
    if (!calculationResult) return "";
    const { towerCoords, clientCoords } = calculationResult;
    const centerLat = (towerCoords.lat + clientCoords.lat) / 2;
    const centerLng = (towerCoords.lng + clientCoords.lng) / 2;
    
    // Calculate appropriate zoom
    let zoom = 15;
    if (calculationResult.distance > 10) zoom = 11;
    else if (calculationResult.distance > 5) zoom = 12;
    else if (calculationResult.distance > 2) zoom = 13;
    
    return `https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(towerCoords.lng, clientCoords.lng) - 0.01},${Math.min(towerCoords.lat, clientCoords.lat) - 0.01},${Math.max(towerCoords.lng, clientCoords.lng) + 0.01},${Math.max(towerCoords.lat, clientCoords.lat) + 0.01}&layer=mapnik&marker=${clientCoords.lat},${clientCoords.lng}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-6">
      <div className="w-full max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Feasibility Tool
                </h1>
                <p className="text-gray-500 mt-1">Calculate distance and connectivity feasibility between tower and client</p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className={`grid gap-6 ${showResult && calculationResult ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {/* Input Section */}
          <div className="space-y-6 flex flex-col">
            {/* Tower Selection */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm flex-1">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Radio className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Select Tower</CardTitle>
                    <CardDescription>Choose a tower from your network</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tower" className="text-sm font-semibold">Tower</Label>
                  <Select value={selectedTowerId} onValueChange={setSelectedTowerId}>
                    <SelectTrigger className="h-12 bg-gray-50/50 border-gray-200">
                      <SelectValue placeholder="Select a tower..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {isLoading ? (
                        <SelectItem value="loading" disabled>Loading towers...</SelectItem>
                      ) : towersWithCoordinates.length === 0 ? (
                        <SelectItem value="none" disabled>No towers with coordinates</SelectItem>
                      ) : (
                        towersWithCoordinates.map((tower: any) => (
                          <SelectItem key={tower.id} value={String(tower.id)}>
                            <div className="flex items-center gap-2">
                              <Radio className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">{tower.name}</span>
                              <Badge variant="outline" className={
                                tower.status === 'online' ? 'bg-green-50 text-green-700 border-green-200' :
                                tower.status === 'offline' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                              }>
                                {tower.status || 'unknown'}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTower && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-900">Tower Details</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <p className="font-medium text-gray-900">{selectedTower.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Location:</span>
                        <p className="font-medium text-gray-900">{selectedTower.location || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Latitude:</span>
                        <p className="font-mono text-gray-900">{selectedTower.latitude}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Longitude:</span>
                        <p className="font-mono text-gray-900">{selectedTower.longitude}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">IP Address:</span>
                        <p className="font-mono text-gray-900">{selectedTower.target_ip || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <Badge className={
                          selectedTower.status === 'online' ? 'bg-green-500' :
                          selectedTower.status === 'offline' ? 'bg-red-500' :
                          'bg-gray-500'
                        }>
                          {selectedTower.status || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Location */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Locate className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Client Location</CardTitle>
                    <CardDescription>Enter the client's GPS coordinates</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientLat" className="text-sm font-semibold">Latitude</Label>
                    <Input
                      id="clientLat"
                      type="text"
                      placeholder="e.g., 29.95790205"
                      value={clientLat}
                      onChange={(e) => setClientLat(e.target.value)}
                      className="h-12 bg-gray-50/50 border-gray-200 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientLng" className="text-sm font-semibold">Longitude</Label>
                    <Input
                      id="clientLng"
                      type="text"
                      placeholder="e.g., 77.79425258"
                      value={clientLng}
                      onChange={(e) => setClientLng(e.target.value)}
                      className="h-12 bg-gray-50/50 border-gray-200 font-mono"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleCalculate}
                  disabled={!selectedTowerId || !clientLat || !clientLng}
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                >
                  <Calculator className="h-5 w-5 mr-2" />
                  Calculate Feasibility
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6 flex flex-col">
            {showResult && calculationResult ? (
              <>
                {/* Distance & Feasibility Card */}
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden flex-1">
                  <div className={`h-2 ${calculationResult.feasibility.color}`}></div>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Ruler className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Feasibility Result</CardTitle>
                          <CardDescription>Distance and connectivity assessment</CardDescription>
                        </div>
                      </div>
                      <Badge className={`${calculationResult.feasibility.color} text-white px-4 py-2 text-sm font-bold`}>
                        {calculationResult.feasibility.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Distance Display */}
                    <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="text-lg">✈️</span>
                        <p className="text-sm text-gray-500 font-medium">Air Distance (Straight Line)</p>
                      </div>
                      <p className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {calculationResult.distance.toFixed(2)}
                      </p>
                      <p className="text-xl text-gray-600">kilometers</p>
                      <p className="text-sm text-gray-400 mt-1">
                        ({(calculationResult.distance * 1000).toFixed(0)} meters)
                      </p>
                    </div>

                    {/* Direction & Details */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl text-center border border-indigo-100">
                        <Compass className="h-6 w-6 text-indigo-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Direction</p>
                        <p className="text-2xl font-bold text-indigo-700">{calculationResult.direction}</p>
                        <p className="text-xs text-gray-500 mt-1">Compass Direction</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl text-center border border-purple-100">
                        <div className="h-6 w-6 mx-auto mb-2 flex items-center justify-center">
                          <span className="text-lg">🧭</span>
                        </div>
                        <p className="text-sm text-gray-500">Bearing</p>
                        <p className="text-2xl font-bold text-purple-700">{calculationResult.bearing.toFixed(1)}°</p>
                        <p className="text-xs text-gray-500 mt-1">From North</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl text-center border border-cyan-100">
                        <Navigation className="h-6 w-6 text-cyan-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Line of Sight</p>
                        <p className="text-lg font-bold text-cyan-700">
                          {calculationResult.distance <= 5 ? 'Likely Clear' : 'Survey Needed'}
                        </p>
                      </div>
                    </div>

                    {/* Detailed Bearing Information */}
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">📐</span>
                        <p className="font-semibold text-gray-800">Bearing Details</p>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500">Azimuth</p>
                          <p className="font-bold text-gray-800">{calculationResult.bearing.toFixed(2)}°</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500">Radians</p>
                          <p className="font-bold text-gray-800">{(calculationResult.bearing * Math.PI / 180).toFixed(4)}</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500">Reverse Bearing</p>
                          <p className="font-bold text-gray-800">{((calculationResult.bearing + 180) % 360).toFixed(1)}°</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <p className="text-xs text-gray-500">Quadrant</p>
                          <p className="font-bold text-gray-800">
                            {calculationResult.bearing <= 90 ? 'NE' : 
                             calculationResult.bearing <= 180 ? 'SE' : 
                             calculationResult.bearing <= 270 ? 'SW' : 'NW'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Feasibility Message */}
                    <div className={`p-4 rounded-xl border-2 ${
                      calculationResult.feasibility.status === 'Excellent' ? 'bg-green-50 border-green-200' :
                      calculationResult.feasibility.status === 'Good' ? 'bg-emerald-50 border-emerald-200' :
                      calculationResult.feasibility.status === 'Moderate' ? 'bg-yellow-50 border-yellow-200' :
                      calculationResult.feasibility.status === 'Challenging' ? 'bg-orange-50 border-orange-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        <calculationResult.feasibility.icon className={`h-5 w-5 mt-0.5 ${
                          calculationResult.feasibility.status === 'Excellent' || calculationResult.feasibility.status === 'Good' ? 'text-green-600' :
                          calculationResult.feasibility.status === 'Moderate' ? 'text-yellow-600' :
                          calculationResult.feasibility.status === 'Challenging' ? 'text-orange-600' :
                          'text-red-600'
                        }`} />
                        <div>
                          <p className="font-semibold text-gray-900">Assessment</p>
                          <p className="text-sm text-gray-600">{calculationResult.feasibility.message}</p>
                        </div>
                      </div>
                    </div>

                    {/* Coordinates Summary */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Radio className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold text-blue-900">Tower</span>
                        </div>
                        <p className="font-mono text-gray-600">
                          {calculationResult.towerCoords.lat.toFixed(6)}, {calculationResult.towerCoords.lng.toFixed(6)}
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-900">Client</span>
                        </div>
                        <p className="font-mono text-gray-600">
                          {calculationResult.clientCoords.lat.toFixed(6)}, {calculationResult.clientCoords.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Placeholder when no result */
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm h-full min-h-[500px]">
                <CardContent className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="p-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mb-6">
                    <Target className="h-16 w-16 text-indigo-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Ready to Calculate</h3>
                  <p className="text-gray-500 max-w-sm">
                    Select a tower from your network and enter the client's GPS coordinates to calculate the distance and connectivity feasibility.
                  </p>
                  <div className="mt-8 grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-xs text-gray-500">0-5 km<br/>Excellent</p>
                    </div>
                    <div>
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <AlertTriangle className="h-6 w-6 text-yellow-600" />
                      </div>
                      <p className="text-xs text-gray-500">5-10 km<br/>Moderate</p>
                    </div>
                    <div>
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <XCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <p className="text-xs text-gray-500">15+ km<br/>Not Recommended</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Map Section - Third Column */}
          {showResult && calculationResult && (
            <div className="space-y-6 flex flex-col">
              {/* Map Card */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden flex-1">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Location Map</CardTitle>
                      <CardDescription>Tower and client positions with distance line</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col flex-1">
                  <div className="relative flex-1 min-h-[450px] bg-gray-100">
                    <LeafletMap 
                      towerCoords={calculationResult.towerCoords}
                      clientCoords={calculationResult.clientCoords}
                      towerName={selectedTower?.name || 'Tower'}
                    />
                    {/* Map Legend */}
                    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg text-xs z-[1000]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-xs">A</div>
                        <span className="font-medium">Tower: {selectedTower?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white font-bold text-xs">B</div>
                        <span className="font-medium">Client Location</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-1 bg-red-500" style={{ borderTop: '2px dashed #ef4444' }}></div>
                        <span className="font-medium">✈️ Air Distance Line</span>
                      </div>
                    </div>
                  </div>
                  {/* Open in Google Maps Link */}
                  <div className="p-4 bg-gray-50 border-t">
                    <a
                      href={`https://www.google.com/maps/dir/${calculationResult.towerCoords.lat},${calculationResult.towerCoords.lng}/${calculationResult.clientCoords.lat},${calculationResult.clientCoords.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Navigation className="h-4 w-4" />
                      Open in Google Maps
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Distance Reference Guide */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Ruler className="h-5 w-5 text-indigo-600" />
              Distance Reference Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="p-4 bg-green-50 rounded-xl text-center border border-green-200">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <p className="font-bold text-green-800">0-2 km</p>
                <p className="text-xs text-green-600 mt-1">Excellent</p>
                <p className="text-xs text-gray-500 mt-2">Ideal for high-speed connectivity</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl text-center border border-emerald-200">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <p className="font-bold text-emerald-800">2-5 km</p>
                <p className="text-xs text-emerald-600 mt-1">Good</p>
                <p className="text-xs text-gray-500 mt-2">Standard equipment works well</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-xl text-center border border-yellow-200">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <p className="font-bold text-yellow-800">5-10 km</p>
                <p className="text-xs text-yellow-600 mt-1">Moderate</p>
                <p className="text-xs text-gray-500 mt-2">Site survey recommended</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl text-center border border-orange-200">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <p className="font-bold text-orange-800">10-15 km</p>
                <p className="text-xs text-orange-600 mt-1">Challenging</p>
                <p className="text-xs text-gray-500 mt-2">Long-range equipment needed</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl text-center border border-red-200">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <XCircle className="h-5 w-5 text-white" />
                </div>
                <p className="font-bold text-red-800">15+ km</p>
                <p className="text-xs text-red-600 mt-1">Not Recommended</p>
                <p className="text-xs text-gray-500 mt-2">Consider alternative tower</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
