import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Radio,
  Download,
  Loader2,
  MapPin,
  Wifi,
  Signal,
  Activity,
  Maximize2,
  Minimize2,
  Layers,
  Navigation,
  RefreshCw,
  Eye,
  X,
  Globe,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// Declare Leaflet types
declare global {
  interface Window {
    L: any;
  }
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

// Generate KML content for Google Earth
function generateKML(towers: NetworkTower[]): string {
  const towersWithCoords = towers.filter(t => t.latitude && t.longitude);
  
  const placemarks = towersWithCoords.map(tower => {
    const statusColor = tower.status === 'online' ? 'ff00ff00' : 
                        tower.status === 'offline' ? 'ff0000ff' :
                        tower.status === 'warning' ? 'ff00ffff' : 'ffff0000';
    
    return `
    <Placemark>
      <name>${escapeXml(tower.name)}</name>
      <description><![CDATA[
        <div style="font-family: Arial, sans-serif; padding: 10px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${escapeXml(tower.name)}</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 4px; font-weight: bold;">Status:</td><td style="padding: 4px;">${tower.status}</td></tr>
            <tr><td style="padding: 4px; font-weight: bold;">Location:</td><td style="padding: 4px;">${escapeXml(tower.location || 'N/A')}</td></tr>
            <tr><td style="padding: 4px; font-weight: bold;">Target IP:</td><td style="padding: 4px;">${escapeXml(tower.target_ip || 'N/A')}</td></tr>
            <tr><td style="padding: 4px; font-weight: bold;">SSID:</td><td style="padding: 4px;">${escapeXml(tower.ssid || 'N/A')}</td></tr>
            <tr><td style="padding: 4px; font-weight: bold;">Devices:</td><td style="padding: 4px;">${tower.total_devices || 0}</td></tr>
            <tr><td style="padding: 4px; font-weight: bold;">Bandwidth:</td><td style="padding: 4px;">${escapeXml(tower.bandwidth || 'N/A')}</td></tr>
            <tr><td style="padding: 4px; font-weight: bold;">Latency:</td><td style="padding: 4px;">${escapeXml(tower.expected_latency || 'N/A')}</td></tr>
            <tr><td style="padding: 4px; font-weight: bold;">Coordinates:</td><td style="padding: 4px;">${tower.latitude}, ${tower.longitude}</td></tr>
            <tr><td style="padding: 4px; font-weight: bold;">Address:</td><td style="padding: 4px;">${escapeXml(tower.address || 'N/A')}</td></tr>
          </table>
        </div>
      ]]></description>
      <Style>
        <IconStyle>
          <color>${statusColor}</color>
          <scale>1.2</scale>
          <Icon>
            <href>http://maps.google.com/mapfiles/kml/shapes/donut.png</href>
          </Icon>
        </IconStyle>
        <LabelStyle>
          <color>ffffffff</color>
          <scale>0.8</scale>
        </LabelStyle>
      </Style>
      <Point>
        <coordinates>${tower.longitude},${tower.latitude},0</coordinates>
      </Point>
    </Placemark>`;
  }).join('\n');

  // Create network lines connecting towers
  let networkLines = '';
  if (towersWithCoords.length > 1) {
    const lineCoords = towersWithCoords
      .map(t => `${t.longitude},${t.latitude},0`)
      .join('\n            ');
    
    networkLines = `
    <Placemark>
      <name>Network Connections</name>
      <description>Network tower interconnections</description>
      <Style>
        <LineStyle>
          <color>7f00ff00</color>
          <width>2</width>
        </LineStyle>
      </Style>
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>
            ${lineCoords}
        </coordinates>
      </LineString>
    </Placemark>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Wizone Network Towers</name>
    <description>Network tower locations and details - Generated on ${new Date().toLocaleString()}</description>
    
    <Style id="onlineStyle">
      <IconStyle>
        <color>ff00ff00</color>
        <scale>1.2</scale>
        <Icon><href>http://maps.google.com/mapfiles/kml/shapes/donut.png</href></Icon>
      </IconStyle>
    </Style>
    
    <Style id="offlineStyle">
      <IconStyle>
        <color>ff0000ff</color>
        <scale>1.2</scale>
        <Icon><href>http://maps.google.com/mapfiles/kml/shapes/donut.png</href></Icon>
      </IconStyle>
    </Style>
    
    <Folder>
      <name>Network Towers (${towersWithCoords.length})</name>
      <open>1</open>
      ${placemarks}
      ${networkLines}
    </Folder>
  </Document>
</kml>`;
}

function escapeXml(str: string | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Interactive Map Component using Leaflet
function InteractiveMap({ 
  towers, 
  selectedTower, 
  onTowerSelect,
  isFullscreen 
}: { 
  towers: NetworkTower[]; 
  selectedTower: NetworkTower | null;
  onTowerSelect: (tower: NetworkTower | null) => void;
  isFullscreen: boolean;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const towersWithCoords = towers.filter(t => t.latitude && t.longitude);
  
  // Load Leaflet from CDN
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    // Load Leaflet CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(cssLink);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts before load
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !window.L) return;
    if (leafletMapRef.current) return; // Already initialized

    const L = window.L;

    // Calculate center and bounds
    if (towersWithCoords.length === 0) return;

    const centerLat = towersWithCoords.reduce((sum, t) => sum + parseFloat(t.latitude!), 0) / towersWithCoords.length;
    const centerLng = towersWithCoords.reduce((sum, t) => sum + parseFloat(t.longitude!), 0) / towersWithCoords.length;

    // Create map
    const map = L.map(mapRef.current, {
      center: [centerLat, centerLng],
      zoom: 12,
      zoomControl: true,
    });

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    leafletMapRef.current = map;

    // Fit bounds to show all towers
    if (towersWithCoords.length > 0) {
      const bounds = L.latLngBounds(
        towersWithCoords.map(t => [parseFloat(t.latitude!), parseFloat(t.longitude!)])
      );
      map.fitBounds(bounds.pad(0.2));
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [leafletLoaded, towersWithCoords.length === 0]);

  // Update markers when towers change
  useEffect(() => {
    if (!leafletLoaded || !leafletMapRef.current || !window.L) return;

    const L = window.L;
    const map = leafletMapRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Create custom tower icon function
    const createTowerIcon = (tower: NetworkTower, isSelected: boolean) => {
      const statusColor = tower.status === 'online' ? '#22c55e' : 
                          tower.status === 'offline' ? '#ef4444' :
                          tower.status === 'warning' ? '#eab308' : '#3b82f6';
      
      const size = isSelected ? 50 : 40;
      const iconHtml = `
        <div style="position: relative; width: ${size}px; height: ${size + 10}px;">
          <svg width="${size}" height="${size + 10}" viewBox="0 0 40 48" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
            <path d="M20 0C9 0 0 9 0 20c0 15 20 28 20 28s20-13 20-28C40 9 31 0 20 0z" 
              fill="${statusColor}" stroke="white" stroke-width="2"/>
            <g transform="translate(8, 6)" fill="white">
              <rect x="10" y="20" width="4" height="8" rx="1"/>
              <path d="M12 4L6 20h4l2-10 2 10h4L12 4z"/>
              <path d="M4 8c0 0 3-3 8-3s8 3 8 3" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M7 11c0 0 2-2 5-2s5 2 5 2" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="12" cy="4" r="2"/>
            </g>
          </svg>
          ${tower.status === 'online' ? `
            <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 30px; height: 30px; 
              background: ${statusColor}40; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          ` : ''}
        </div>
      `;

      return L.divIcon({
        html: iconHtml,
        className: 'tower-marker',
        iconSize: [size, size + 10],
        iconAnchor: [size / 2, size + 10],
        popupAnchor: [0, -(size + 10)],
      });
    };

    // Add markers for each tower
    towersWithCoords.forEach((tower) => {
      const lat = parseFloat(tower.latitude!);
      const lng = parseFloat(tower.longitude!);
      const isSelected = selectedTower?.id === tower.id;

      const marker = L.marker([lat, lng], {
        icon: createTowerIcon(tower, isSelected),
      });

      // Create popup content
      const statusBg = tower.status === 'online' ? '#22c55e' : 
                       tower.status === 'offline' ? '#ef4444' :
                       tower.status === 'warning' ? '#eab308' : '#3b82f6';

      const popupContent = `
        <div style="min-width: 200px; padding: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
              <circle cx="12" cy="5" r="3"/>
              <line x1="12" y1="8" x2="12" y2="18"/>
              <line x1="8" y1="18" x2="16" y2="18"/>
              <path d="M5 10c2-2 5-3 7-3s5 1 7 3"/>
              <path d="M8 13c1-1 3-2 4-2s3 1 4 2"/>
            </svg>
            <strong style="font-size: 14px;">${tower.name}</strong>
          </div>
          <div style="color: #666; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            ${tower.location || tower.address || 'No location'}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="background: ${statusBg}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">
              ${tower.status.toUpperCase()}
            </span>
            ${tower.total_devices ? `<span style="color: #666; font-size: 12px;">${tower.total_devices} devices</span>` : ''}
          </div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; font-size: 11px; color: #888;">
            <div>Lat: ${tower.latitude}</div>
            <div>Lng: ${tower.longitude}</div>
            ${tower.target_ip ? `<div>IP: ${tower.target_ip}</div>` : ''}
          </div>
          <div style="margin-top: 10px; display: flex; gap: 8px;">
            <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" 
              style="flex: 1; text-align: center; padding: 6px 10px; background: #4285f4; color: white; 
                border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: 500;">
              📍 View on Google Maps
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'tower-popup',
      });

      marker.on('click', () => {
        onTowerSelect(tower);
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    // Add CSS for animations if not already added
    if (!document.getElementById('tower-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'tower-marker-styles';
      style.textContent = `
        @keyframes ping {
          75%, 100% {
            transform: translateX(-50%) scale(2);
            opacity: 0;
          }
        }
        .tower-marker {
          background: transparent !important;
          border: none !important;
        }
        .tower-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .tower-popup .leaflet-popup-tip {
          box-shadow: 0 3px 6px rgba(0,0,0,0.1);
        }
      `;
      document.head.appendChild(style);
    }

  }, [leafletLoaded, towers, selectedTower]);

  // Handle fullscreen changes
  useEffect(() => {
    if (leafletMapRef.current) {
      setTimeout(() => {
        leafletMapRef.current.invalidateSize();
      }, 100);
    }
  }, [isFullscreen]);
  
  if (towersWithCoords.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-8">
          <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600">No Tower Locations Available</h3>
          <p className="text-sm text-gray-500 mt-2">
            Add towers with latitude/longitude coordinates to see them on the map
          </p>
          <Link href="/tower-master">
            <Button className="mt-4">
              <Radio className="h-4 w-4 mr-2" />
              Go to Tower Master
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!leafletLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-lg"
      style={{ minHeight: '400px' }}
    />
  );
}

// Tower Details Panel
function TowerDetailsPanel({ tower, onClose }: { tower: NetworkTower; onClose: () => void }) {
  return (
    <Card className="absolute right-4 top-4 w-80 z-50 shadow-2xl">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Radio className="h-4 w-4 text-blue-600" />
              {tower.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {tower.location || 'No location'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Badge className={
            tower.status === 'online' ? 'bg-green-500' :
            tower.status === 'offline' ? 'bg-red-500' :
            tower.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
          }>
            {tower.status}
          </Badge>
          {tower.total_devices && (
            <Badge variant="outline">{tower.total_devices} Devices</Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-xs text-muted-foreground">Target IP</p>
            <p className="font-mono font-medium">{tower.target_ip || '-'}</p>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-xs text-muted-foreground">SSID</p>
            <p className="font-medium">{tower.ssid || '-'}</p>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-xs text-muted-foreground">Bandwidth</p>
            <p className="font-medium">{tower.bandwidth || '-'}</p>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-xs text-muted-foreground">Latency</p>
            <p className="font-medium">{tower.expected_latency || '-'}</p>
          </div>
        </div>

        <div className="p-2 bg-blue-50 rounded text-sm">
          <p className="text-xs text-muted-foreground">Coordinates</p>
          <p className="font-mono text-xs">{tower.latitude}, {tower.longitude}</p>
        </div>

        {tower.address && (
          <div className="p-2 bg-gray-50 rounded text-sm">
            <p className="text-xs text-muted-foreground">Address</p>
            <p className="text-xs">{tower.address}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => window.open(`https://www.google.com/maps?q=${tower.latitude},${tower.longitude}`, '_blank')}
          >
            <Navigation className="h-3 w-3 mr-1" />
            Google Maps
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => window.open(`https://earth.google.com/web/@${tower.latitude},${tower.longitude},0a,1000d,35y,0h,0t,0r`, '_blank')}
          >
            <Globe className="h-3 w-3 mr-1" />
            Google Earth
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NetworkMap() {
  const [selectedTower, setSelectedTower] = useState<NetworkTower | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showTowerList, setShowTowerList] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPinging, setIsPinging] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Fetch towers
  const { data: towers = [], isLoading, error, refetch } = useQuery<NetworkTower[]>({
    queryKey: ["/api/network/towers"],
    refetchInterval: 30000, // Refresh from server every 30 seconds to see auto-ping updates
  });

  // Ping all towers mutation
  const pingAllTowers = useMutation({
    mutationFn: async () => {
      // First reset all to offline
      await fetch('/api/network/towers/reset-status', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Then ping all towers
      const response = await fetch('/api/network/towers/ping-all', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to ping towers');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/network/towers"] });
      toast({
        title: "Towers Pinged",
        description: `${data.summary.online} online, ${data.summary.warning} warning, ${data.summary.offline} offline`,
      });
      setIsPinging(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Ping Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsPinging(false);
    },
  });

  // Manual ping handler (server auto-pings every 5 minutes)
  const handlePingAll = () => {
    setIsPinging(true);
    pingAllTowers.mutate();
  };

  // Filter towers
  const filteredTowers = towers.filter((tower) => {
    const matchesStatus = filterStatus === "all" || tower.status === filterStatus;
    const matchesSearch = searchTerm === "" || 
      tower.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tower.location?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Stats
  const towersWithCoords = towers.filter(t => t.latitude && t.longitude);
  const onlineCount = towers.filter(t => t.status === 'online').length;
  const offlineCount = towers.filter(t => t.status === 'offline').length;
  const warningCount = towers.filter(t => t.status === 'warning').length;

  // Download KML
  const handleDownloadKML = () => {
    if (towersWithCoords.length === 0) {
      toast({
        title: "No Data",
        description: "No towers with coordinates available for KML export",
        variant: "destructive"
      });
      return;
    }

    const kmlContent = generateKML(filteredTowers);
    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wizone-towers-${new Date().toISOString().split('T')[0]}.kml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "KML Downloaded",
      description: `Exported ${towersWithCoords.length} towers. Open in Google Earth to view.`
    });
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading network map...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Error loading data: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 text-blue-600" />
              Network Map
            </h1>
            <p className="text-muted-foreground text-sm">
              Interactive map of all network towers • {towersWithCoords.length} towers mapped
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handlePingAll}
              disabled={isPinging}
            >
              <Activity className={`h-4 w-4 mr-2 ${isPinging ? 'animate-pulse' : ''}`} />
              {isPinging ? 'Pinging...' : 'Ping All'}
            </Button>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleDownloadKML}>
              <Download className="h-4 w-4 mr-2" />
              Export KML
            </Button>
            <Link href="/tower-master">
              <Button>
                <Radio className="h-4 w-4 mr-2" />
                Tower Master
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-3 mt-4">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Towers</p>
                <p className="text-xl font-bold">{towers.length}</p>
              </div>
              <Radio className="h-5 w-5 text-blue-500" />
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Mapped</p>
                <p className="text-xl font-bold text-blue-600">{towersWithCoords.length}</p>
              </div>
              <MapPin className="h-5 w-5 text-blue-500" />
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Online</p>
                <p className="text-xl font-bold text-green-600">{onlineCount}</p>
              </div>
              <Signal className="h-5 w-5 text-green-500" />
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Offline</p>
                <p className="text-xl font-bold text-red-600">{offlineCount}</p>
              </div>
              <Wifi className="h-5 w-5 text-red-500" />
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Warning</p>
                <p className="text-xl font-bold text-yellow-600">{warningCount}</p>
              </div>
              <Activity className="h-5 w-5 text-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mt-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search towers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setShowTowerList(!showTowerList)}
            title={showTowerList ? "Hide Tower List" : "Show Tower List"}
          >
            <Layers className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="flex-1 relative bg-gray-100">
        <InteractiveMap
          towers={filteredTowers}
          selectedTower={selectedTower}
          onTowerSelect={setSelectedTower}
          isFullscreen={isFullscreen}
        />

        {/* Selected Tower Details */}
        {selectedTower && (
          <TowerDetailsPanel tower={selectedTower} onClose={() => setSelectedTower(null)} />
        )}

        {/* Tower List Sidebar */}
        {showTowerList && (
          <div 
            className="absolute left-4 top-4 bottom-4 w-72 bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col z-[1000]"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Towers ({filteredTowers.length})
                </h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 hover:bg-white/20 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTowerList(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div 
              className="flex-1 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
            {filteredTowers.map((tower) => {
              const hasCoords = tower.latitude && tower.longitude;
              const isSelected = selectedTower?.id === tower.id;
              
              return (
                <div
                  key={tower.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasCoords) {
                      setSelectedTower(isSelected ? null : tower);
                    }
                  }}
                  className={`p-3 border-b cursor-pointer transition-all duration-200
                    ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600 shadow-sm' : 'hover:bg-gray-50'}
                    ${!hasCoords ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{tower.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {tower.location || 'No location'}
                      </p>
                      {tower.target_ip && (
                        <p className="text-xs text-gray-500 font-mono mt-1">{tower.target_ip}</p>
                      )}
                    </div>
                    <Badge className={`text-xs shrink-0 ${
                      tower.status === 'online' ? 'bg-green-500 hover:bg-green-600' :
                      tower.status === 'offline' ? 'bg-red-500 hover:bg-red-600' :
                      tower.status === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' : 
                      'bg-blue-500 hover:bg-blue-600'
                    }`}>
                      {tower.status}
                    </Badge>
                  </div>
                  {!hasCoords && (
                    <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      No coordinates
                    </p>
                  )}
                  {hasCoords && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span className="font-mono">{parseFloat(tower.latitude!).toFixed(4)}, {parseFloat(tower.longitude!).toFixed(4)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredTowers.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Layers className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium">No towers found</p>
                <p className="text-xs mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Show Tower List Button - When Hidden */}
        {!showTowerList && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setShowTowerList(true);
            }}
            className="absolute left-4 top-4 z-[1000] shadow-lg bg-blue-600 hover:bg-blue-700"
            size="default"
            style={{ pointerEvents: 'auto' }}
          >
            <Layers className="h-4 w-4 mr-2" />
            Show Towers
          </Button>
        )}

        {/* Legend */}
        <div 
          className="absolute right-4 bottom-4 bg-white rounded-lg shadow-lg p-3 z-[1000]"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          <h4 className="text-xs font-semibold mb-2">Legend</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span>Online</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span>Offline</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span>Warning</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>Maintenance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
