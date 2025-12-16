import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  Search, 
  MapPin,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Network,
  Signal,
  Zap,
  Users,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Database,
  Wifi,
  Link as LinkIcon
} from 'lucide-react';

interface NetworkTower {
  id?: number;
  tower_name?: string;
  name?: string; // Database field name
  location: string;
  ip_address?: string;
  target_ip?: string; // Database field name
  tower_type: 'Telecom' | 'Internet' | 'Broadcasting' | 'Emergency';
  installation_date: string;
  owner_operator: string;
  maintenance_schedule: string;
  coverage_area_km: number;
  frequency_band: string;
  antenna_height_m: number;
  power_consumption_kw: number;
  backup_power_hours: number;
  technician_assigned: string;
  last_inspection_date: string;
  next_inspection_date: string;
  status: 'Active' | 'Maintenance' | 'Inactive' | 'Critical' | 'online' | 'offline'; // Include database connectivity status
  notes: string;
  created_at?: string;
  updated_at?: string;
  // Database connectivity fields
  actual_latency?: string;
  expected_latency?: string;
  last_test_at?: string;
  bandwidth?: string;
  description?: string;
  total_devices?: number;
  ssid?: string;
}

interface PingResult {
  success: boolean;
  responseTime?: number;
  error?: string;
}

interface PerformanceMetrics {
  ping_response_time: number;
  connectivity_status: 'Online' | 'Offline';
  last_check: string;
}

interface NetworkLog {
  id: string;
  tower_id: number;
  timestamp: string;
  event_type: 'ping' | 'status_change' | 'flapping' | 'alert' | 'info';
  message: string;
  latency?: number;
  previous_status?: string;
  new_status?: string;
}

interface PingDetails {
  tower: NetworkTower;
  isLoading: boolean;
  result?: {
    success: boolean;
    responseTime?: number;
    error?: string;
    timestamp: string;
  };
  history: Array<{
    timestamp: string;
    success: boolean;
    responseTime?: number;
  }>;
}

const NetworkMonitoring: React.FC = () => {
  const [towers, setTowers] = useState<NetworkTower[]>([]);
  const [filteredTowers, setFilteredTowers] = useState<NetworkTower[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Dialog states
  const [isAddTowerOpen, setIsAddTowerOpen] = useState(false);
  const [isEditTowerOpen, setIsEditTowerOpen] = useState(false);
  const [isViewTowerOpen, setIsViewTowerOpen] = useState(false);
  const [isPingDialogOpen, setIsPingDialogOpen] = useState(false);
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);
  
  // Form data
  const [selectedTower, setSelectedTower] = useState<NetworkTower | null>(null);
  const [formData, setFormData] = useState<Partial<NetworkTower>>({});

  // Performance data
  const [performanceData, setPerformanceData] = useState<Record<number, PerformanceMetrics>>({});
  
  // Enhanced monitoring data
  const [pingDetails, setPingDetails] = useState<PingDetails | null>(null);
  const [towerLogs, setTowerLogs] = useState<NetworkLog[]>([]);
  const [flappingAlerts, setFlappingAlerts] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchTowers();
  }, []);

  useEffect(() => {
    filterTowers();
  }, [towers, searchTerm, filterStatus, filterType]);

  // Auto-generate logs every 5 minutes
  useEffect(() => {
    const autoTestInterval = setInterval(() => {
      console.log('🔄 Auto-testing all towers (5-minute interval)...');
      towers.forEach(tower => {
        if (tower.id && (tower.ip_address || tower.target_ip)) {
          testConnectivity(tower);
        }
      });
    }, 5 * 60 * 1000); // 5 minutes

    // Initial test after 30 seconds
    const initialTimeout = setTimeout(() => {
      console.log('🔄 Initial auto-test for all towers...');
      towers.forEach(tower => {
        if (tower.id && (tower.ip_address || tower.target_ip)) {
          testConnectivity(tower);
        }
      });
    }, 30000); // 30 seconds

    return () => {
      clearInterval(autoTestInterval);
      clearTimeout(initialTimeout);
    };
  }, [towers]);

  const fetchTowers = async () => {
    try {
      const response = await fetch('/api/network-monitoring/towers');
      if (response.ok) {
        const data = await response.json();
        setTowers(data);
      }
    } catch (error) {
      console.error('Error fetching towers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTowers = () => {
    let filtered = towers;

    if (searchTerm) {
      filtered = filtered.filter(tower =>
        tower.tower_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tower.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tower.ip_address?.includes(searchTerm) ||
        tower.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tower.target_ip?.includes(searchTerm)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(tower => tower.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(tower => tower.tower_type === filterType);
    }

    setFilteredTowers(filtered);
  };

  const resetForm = () => {
    setFormData({
      tower_name: '',
      location: '',
      ip_address: '',
      tower_type: 'Telecom',
      installation_date: '',
      owner_operator: '',
      maintenance_schedule: '',
      coverage_area_km: 0,
      frequency_band: '',
      antenna_height_m: 0,
      power_consumption_kw: 0,
      backup_power_hours: 0,
      technician_assigned: '',
      last_inspection_date: '',
      next_inspection_date: '',
      status: 'Active',
      notes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = selectedTower 
        ? `/api/network-monitoring/towers/${selectedTower.id}` 
        : '/api/network-monitoring/towers';
      const method = selectedTower ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchTowers();
        setIsAddTowerOpen(false);
        setIsEditTowerOpen(false);
        resetForm();
        setSelectedTower(null);
      }
    } catch (error) {
      console.error('Error saving tower:', error);
    }
  };

  const handleEdit = (tower: NetworkTower) => {
    setSelectedTower(tower);
    setFormData(tower);
    setIsEditTowerOpen(true);
  };

  const handleView = (tower: NetworkTower) => {
    setSelectedTower(tower);
    setIsViewTowerOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this tower?')) {
      try {
        const response = await fetch(`/api/network-monitoring/towers/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchTowers();
        }
      } catch (error) {
        console.error('Error deleting tower:', error);
      }
    }
  };

  const testConnectivity = async (tower: NetworkTower) => {
    try {
      const ipAddress = tower.ip_address || tower.target_ip;
      console.log('🔍 Testing connectivity for tower:', {
        id: tower.id,
        name: tower.name || tower.tower_name,
        ip_address: tower.ip_address,
        target_ip: tower.target_ip,
        sending: ipAddress
      });

      if (!ipAddress) {
        console.error('❌ No IP address found for tower:', tower);
        return;
      }

      const response = await fetch('/api/network-monitoring/test-connectivity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip_address: ipAddress }),
      });

      const result: PingResult = await response.json();
      console.log('✅ Ping result received:', result);
      
      if (tower.id) {
        setPerformanceData(prev => ({
          ...prev,
          [tower.id!]: {
            ping_response_time: result.responseTime || 0,
            connectivity_status: result.success ? 'Online' : 'Offline',
            last_check: new Date().toLocaleString()
          }
        }));
        
        // Add log entry for this test
        const newLog: NetworkLog = {
          id: `log-${Date.now()}`,
          tower_id: tower.id,
          timestamp: new Date().toISOString(),
          event_type: 'ping',
          message: result.success 
            ? `Ping successful - ${result.responseTime}ms` 
            : `Ping failed - ${result.error || 'Connection failed'}`,
          latency: result.responseTime
        };
        setTowerLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
      }
    } catch (error) {
      console.error('Error testing connectivity:', error);
    }
  };

  const handleIPClick = async (tower: NetworkTower) => {
    // Initialize ping details
    setPingDetails({
      tower,
      isLoading: true,
      history: []
    });
    setIsPingDialogOpen(true);

    // Perform multiple pings
    const history: Array<{ timestamp: string; success: boolean; responseTime?: number }> = [];
    
    for (let i = 0; i < 5; i++) {
      try {
        const response = await fetch('/api/network-monitoring/test-connectivity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ip_address: tower.ip_address || tower.target_ip }),
        });

        const result: PingResult = await response.json();
        history.push({
          timestamp: new Date().toISOString(),
          success: result.success,
          responseTime: result.responseTime
        });

        // Update ping details with latest result
        setPingDetails(prev => prev ? {
          ...prev,
          isLoading: i < 4,
          result: {
            success: result.success,
            responseTime: result.responseTime,
            error: result.error,
            timestamp: new Date().toISOString()
          },
          history: [...history]
        } : null);

        if (i < 4) await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Ping error:', error);
      }
    }

    // Check for flapping (rapid status changes)
    const statuses = history.map(h => h.success);
    const changes = statuses.filter((status, idx) => idx > 0 && status !== statuses[idx - 1]).length;
    if (changes >= 2 && tower.id) {
      setFlappingAlerts(prev => ({ ...prev, [tower.id!]: (prev[tower.id!] || 0) + 1 }));
      
      const flappingLog: NetworkLog = {
        id: `log-flap-${Date.now()}`,
        tower_id: tower.id,
        timestamp: new Date().toISOString(),
        event_type: 'flapping',
        message: `Network flapping detected - ${changes} status changes in 5 pings`
      };
      setTowerLogs(prev => [flappingLog, ...prev]);
    }
  };

  const fetchTowerLogs = async (towerId: number) => {
    // Note: Logs are stored in towerLogs state, we don't need to filter here
    // The logs dialog already filters by tower_id when displaying
    // This function is kept for future API integration
  };

  const openLogsDialog = (tower: NetworkTower) => {
    console.log('📋 Opening logs for tower:', {
      id: tower.id,
      name: tower.name || tower.tower_name,
      ip: tower.ip_address || tower.target_ip,
      total_logs: towerLogs.length,
      tower_logs: towerLogs.filter(l => l.tower_id === tower.id).length
    });
    setSelectedTower(tower);
    setIsLogsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
      case 'online':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Maintenance':
      case 'offline':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
      case 'online':
        return <CheckCircle className="h-4 w-4" />;
      case 'Maintenance':
      case 'offline':
        return <AlertTriangle className="h-4 w-4" />;
      case 'Inactive':
        return <XCircle className="h-4 w-4" />;
      case 'Critical':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getConnectivityStatus = (towerId?: number, towerStatus?: string, towerData?: any) => {
    // First check if tower has actual connectivity status from database
    if (towerData?.status && (towerData.status === 'online' || towerData.status === 'offline')) {
      const isOnline = towerData.status === 'online';
      return (
        <div className="flex items-center space-x-2 text-sm">
          <div className={`h-2 w-2 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className={isOnline ? 'text-green-700' : 'text-red-700'}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
          {towerData.actual_latency && (
            <span className="text-gray-500">({towerData.actual_latency})</span>
          )}
          {towerData.last_test_at && (
            <span className="text-xs text-gray-400 ml-2">
              Last checked: {new Date(towerData.last_test_at).toLocaleString()}
            </span>
          )}
        </div>
      );
    }

    // Fallback to performance data if available
    if (!towerId || !performanceData[towerId]) return null;
    
    const data = performanceData[towerId];
    return (
      <div className="flex items-center space-x-2 text-sm">
        <div className={`h-2 w-2 rounded-full ${
          data.connectivity_status === 'Online' ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span className={data.connectivity_status === 'Online' ? 'text-green-700' : 'text-red-700'}>
          {data.connectivity_status}
        </span>
        {data.ping_response_time > 0 && (
          <span className="text-gray-500">({data.ping_response_time}ms)</span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading network towers...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Network className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">WIZONE Network Monitoring</h1>
        </div>
        <Button onClick={() => { resetForm(); setIsAddTowerOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Tower
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {towers.filter(t => t.status === 'Active' || t.status === 'online').length}
                </p>
                <p className="text-gray-600">Active/Online</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {towers.filter(t => t.status === 'Maintenance' || t.status === 'offline').length}
                </p>
                <p className="text-gray-600">Maintenance/Offline</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{towers.filter(t => t.status === 'Critical' || t.status === 'Inactive').length}</p>
                <p className="text-gray-600">Critical/Inactive</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{towers.length}</p>
                <p className="text-gray-600">Total Towers</p>
              </div>
              <Signal className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search towers by name, location, or IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Telecom">Telecom</SelectItem>
                <SelectItem value="Internet">Internet</SelectItem>
                <SelectItem value="Broadcasting">Broadcasting</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Towers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTowers.map((tower) => {
          const towerName = tower.tower_name || tower.name || 'Unnamed Tower';
          const ipAddress = tower.ip_address || tower.target_ip || 'N/A';
          const isOnline = tower.status === 'online' || tower.status === 'Active';
          const flappingCount = tower.id ? flappingAlerts[tower.id] || 0 : 0;
          
          return (
            <Card key={tower.id} className="hover:shadow-lg transition-all duration-200 border-l-4 overflow-hidden" style={{
              borderLeftColor: isOnline ? '#10b981' : '#ef4444'
            }}>
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Network className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <CardTitle className="text-sm font-semibold truncate">{towerName}</CardTitle>
                  </div>
                  <Badge className={`${getStatusColor(tower.status)} flex items-center gap-1 text-xs px-2 py-0.5 flex-shrink-0`}>
                    {getStatusIcon(tower.status)}
                    <span className="capitalize">{tower.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="px-4 pb-3 space-y-2">
                {/* Location */}
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{tower.location}</span>
                </div>
                
                {/* IP Address & Status - Compact Row */}
                <div className="flex items-center justify-between gap-2 bg-gray-50 px-2 py-1.5 rounded">
                  <button
                    onClick={() => handleIPClick(tower)}
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-mono text-xs group"
                  >
                    <LinkIcon className="h-3 w-3 flex-shrink-0" />
                    <span className="underline decoration-dashed">{ipAddress}</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className={`text-xs font-medium ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
                        {tower.actual_latency || '0ms'}
                      </span>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => testConnectivity(tower)}
                      className="h-6 w-6 p-0"
                      title="Test connectivity"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Metrics Grid - Compact */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="bg-blue-50 px-2 py-1.5 rounded text-center">
                    <Wifi className="h-3 w-3 text-blue-600 mx-auto mb-0.5" />
                    <p className="text-xs font-semibold text-blue-700">{tower.bandwidth || '1G'}</p>
                  </div>
                  
                  <div className="bg-green-50 px-2 py-1.5 rounded text-center">
                    <Database className="h-3 w-3 text-green-600 mx-auto mb-0.5" />
                    <p className="text-xs font-semibold text-green-700">{tower.total_devices || 0}</p>
                  </div>
                  
                  <div className="bg-orange-50 px-2 py-1.5 rounded text-center">
                    <Zap className="h-3 w-3 text-orange-600 mx-auto mb-0.5" />
                    <p className="text-xs font-semibold text-orange-700">{tower.power_consumption_kw || 0}kW</p>
                  </div>
                </div>

                {/* Flapping Alert - If present */}
                {flappingCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    <TrendingDown className="h-3 w-3" />
                    <span className="font-medium">{flappingCount} flapping events</span>
                  </div>
                )}

                {/* Action Buttons - Compact */}
                <div className="flex gap-1 pt-1 border-t">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => openLogsDialog(tower)}
                    className="flex-1 h-7 text-xs"
                  >
                    <Activity className="h-3 w-3 mr-1" />
                    Logs
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleView(tower)} className="h-7 w-7 p-0">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(tower)} className="h-7 w-7 p-0">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => tower.id && handleDelete(tower.id)}
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTowers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No towers found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first network tower'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Tower Dialog */}
      <Dialog open={isAddTowerOpen || isEditTowerOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddTowerOpen(false);
          setIsEditTowerOpen(false);
          setSelectedTower(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTower ? 'Edit Network Tower' : 'Add New Network Tower'}
            </DialogTitle>
            <DialogDescription>
              {selectedTower 
                ? 'Update the tower information below' 
                : 'Fill in the details to add a new network tower to your monitoring system'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tower_name">Tower Name *</Label>
                <Input
                  id="tower_name"
                  value={formData.tower_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, tower_name: e.target.value }))}
                  placeholder="e.g., Tower Alpha-1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Mumbai Central"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ip_address">IP Address *</Label>
                <Input
                  id="ip_address"
                  value={formData.ip_address || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, ip_address: e.target.value }))}
                  placeholder="e.g., 192.168.1.100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tower_type">Tower Type *</Label>
                <Select 
                  value={formData.tower_type || 'Telecom'} 
                  onValueChange={(value: 'Telecom' | 'Internet' | 'Broadcasting' | 'Emergency') => 
                    setFormData(prev => ({ ...prev, tower_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Telecom">Telecom</SelectItem>
                    <SelectItem value="Internet">Internet</SelectItem>
                    <SelectItem value="Broadcasting">Broadcasting</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="installation_date">Installation Date</Label>
                <Input
                  id="installation_date"
                  type="date"
                  value={formData.installation_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, installation_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select 
                  value={formData.status || 'Active'} 
                  onValueChange={(value: 'Active' | 'Maintenance' | 'Inactive' | 'Critical') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_operator">Owner/Operator</Label>
                <Input
                  id="owner_operator"
                  value={formData.owner_operator || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner_operator: e.target.value }))}
                  placeholder="e.g., WIZONE Networks"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance_schedule">Maintenance Schedule</Label>
                <Input
                  id="maintenance_schedule"
                  value={formData.maintenance_schedule || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, maintenance_schedule: e.target.value }))}
                  placeholder="e.g., Monthly"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverage_area_km">Coverage Area (km)</Label>
                <Input
                  id="coverage_area_km"
                  type="number"
                  step="0.1"
                  value={formData.coverage_area_km || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverage_area_km: parseFloat(e.target.value) || 0 }))}
                  placeholder="e.g., 5.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency_band">Frequency Band</Label>
                <Input
                  id="frequency_band"
                  value={formData.frequency_band || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency_band: e.target.value }))}
                  placeholder="e.g., 2.4GHz"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="antenna_height_m">Antenna Height (m)</Label>
                <Input
                  id="antenna_height_m"
                  type="number"
                  step="0.1"
                  value={formData.antenna_height_m || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, antenna_height_m: parseFloat(e.target.value) || 0 }))}
                  placeholder="e.g., 50.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="power_consumption_kw">Power Consumption (kW)</Label>
                <Input
                  id="power_consumption_kw"
                  type="number"
                  step="0.1"
                  value={formData.power_consumption_kw || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, power_consumption_kw: parseFloat(e.target.value) || 0 }))}
                  placeholder="e.g., 10.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup_power_hours">Backup Power (hours)</Label>
                <Input
                  id="backup_power_hours"
                  type="number"
                  value={formData.backup_power_hours || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, backup_power_hours: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g., 24"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="technician_assigned">Assigned Technician</Label>
                <Input
                  id="technician_assigned"
                  value={formData.technician_assigned || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, technician_assigned: e.target.value }))}
                  placeholder="e.g., John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_inspection_date">Last Inspection Date</Label>
                <Input
                  id="last_inspection_date"
                  type="date"
                  value={formData.last_inspection_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_inspection_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="next_inspection_date">Next Inspection Date</Label>
                <Input
                  id="next_inspection_date"
                  type="date"
                  value={formData.next_inspection_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, next_inspection_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about the tower..."
                rows={3}
              />
            </div>

            <DialogFooter className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsAddTowerOpen(false);
                  setIsEditTowerOpen(false);
                  setSelectedTower(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {selectedTower ? 'Update Tower' : 'Add Tower'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Tower Dialog */}
      <Dialog open={isViewTowerOpen} onOpenChange={setIsViewTowerOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Network className="h-5 w-5" />
              <span>Tower Details</span>
            </DialogTitle>
            <DialogDescription>
              Complete information for {selectedTower?.tower_name}
            </DialogDescription>
          </DialogHeader>

          {selectedTower && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tower Name</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTower.tower_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Location</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTower.location}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">IP Address</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTower.ip_address}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tower Type</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTower.tower_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedTower.status)}>
                      {getStatusIcon(selectedTower.status)}
                      <span className="ml-1">{selectedTower.status}</span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Installation Date</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTower.installation_date || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Owner/Operator</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTower.owner_operator || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Maintenance Schedule</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTower.maintenance_schedule || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Coverage Area</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTower.coverage_area_km} km</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Frequency Band</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTower.frequency_band || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Antenna Height</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTower.antenna_height_m} m</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Power Consumption</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTower.power_consumption_kw} kW</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Backup Power</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTower.backup_power_hours} hours</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Assigned Technician</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTower.technician_assigned || 'Not assigned'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Inspection</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTower.last_inspection_date || 'Not recorded'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Next Inspection</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTower.next_inspection_date || 'Not scheduled'}</p>
                </div>
              </div>

              {selectedTower.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Notes</Label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{selectedTower.notes}</p>
                </div>
              )}

              {selectedTower.id && performanceData[selectedTower.id] && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium text-gray-500">Connectivity Status</Label>
                  <div className="mt-2 space-y-2">
                    {getConnectivityStatus(selectedTower.id, selectedTower.status, selectedTower) || (
                      selectedTower.status && (selectedTower.status === 'online' || selectedTower.status === 'offline') && (
                        <div className="flex items-center space-x-2 text-sm">
                          <div className={`h-2 w-2 rounded-full ${selectedTower.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className={selectedTower.status === 'online' ? 'text-green-700' : 'text-red-700'}>
                            {selectedTower.status === 'online' ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      )
                    )}
                    {(performanceData[selectedTower.id]?.last_check || selectedTower.last_test_at) && (
                      <p className="text-xs text-gray-500">
                        Last checked: {performanceData[selectedTower.id]?.last_check || 
                          (selectedTower.last_test_at ? new Date(selectedTower.last_test_at).toLocaleString() : 'Never')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => selectedTower.id && testConnectivity(selectedTower)}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Test Connectivity
                </Button>
                <Button onClick={() => handleEdit(selectedTower)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Tower
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ping Details Dialog */}
      <Dialog open={isPingDialogOpen} onOpenChange={setIsPingDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span>Ping Response - {pingDetails?.tower.tower_name || pingDetails?.tower.name}</span>
            </DialogTitle>
            <DialogDescription>
              IP Address: {pingDetails?.tower.ip_address || pingDetails?.tower.target_ip}
            </DialogDescription>
          </DialogHeader>

          {pingDetails && (
            <div className="space-y-4">
              {pingDetails.isLoading && (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                  <span className="ml-3 text-gray-600">Testing connectivity...</span>
                </div>
              )}

              {pingDetails.result && !pingDetails.isLoading && (
                <div className={`p-4 rounded-lg border-2 ${
                  pingDetails.result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {pingDetails.result.success ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                      <span className={`font-bold text-lg ${
                        pingDetails.result.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {pingDetails.result.success ? 'Connection Successful' : 'Connection Failed'}
                      </span>
                    </div>
                    {pingDetails.result.responseTime && (
                      <Badge className="text-lg px-3 py-1 bg-white">
                        <Clock className="h-4 w-4 mr-1" />
                        {pingDetails.result.responseTime}ms
                      </Badge>
                    )}
                  </div>
                  {pingDetails.result.error && (
                    <p className="text-sm text-red-600 mt-2">{pingDetails.result.error}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Last checked: {new Date(pingDetails.result.timestamp).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Ping History */}
              {pingDetails.history.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Ping History (Last 5 attempts)</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {pingDetails.history.map((ping, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-center justify-between p-3 rounded border ${
                          ping.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {ping.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm font-medium">
                            Attempt #{idx + 1}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(ping.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {ping.responseTime && (
                          <Badge variant="outline" className="text-xs">
                            {ping.responseTime}ms
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <p className="text-xs text-gray-600">Success Rate</p>
                      <p className="text-lg font-bold text-blue-700">
                        {Math.round((pingDetails.history.filter(p => p.success).length / pingDetails.history.length) * 100)}%
                      </p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="text-xs text-gray-600">Avg Response</p>
                      <p className="text-lg font-bold text-green-700">
                        {Math.round(
                          pingDetails.history
                            .filter(p => p.responseTime)
                            .reduce((acc, p) => acc + (p.responseTime || 0), 0) / 
                          pingDetails.history.filter(p => p.responseTime).length
                        )}ms
                      </p>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <p className="text-xs text-gray-600">Packet Loss</p>
                      <p className="text-lg font-bold text-purple-700">
                        {Math.round((pingDetails.history.filter(p => !p.success).length / pingDetails.history.length) * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => pingDetails.tower && handleIPClick(pingDetails.tower)}
                  disabled={pingDetails.isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Again
                </Button>
                <Button onClick={() => setIsPingDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <span>Network Logs - {selectedTower?.tower_name || selectedTower?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Connection history, status changes, and flapping events
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-blue-50">
                <CardContent className="p-3 text-center">
                  <Database className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Total Logs</p>
                  <p className="text-xl font-bold text-blue-700">
                    {selectedTower?.id ? towerLogs.filter(l => l.tower_id === selectedTower.id).length : 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-orange-50">
                <CardContent className="p-3 text-center">
                  <TrendingDown className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Flapping Events</p>
                  <p className="text-xl font-bold text-orange-700">
                    {selectedTower?.id ? flappingAlerts[selectedTower.id] || 0 : 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-50">
                <CardContent className="p-3 text-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Uptime</p>
                  <p className="text-xl font-bold text-green-700">
                    {selectedTower?.status === 'online' ? '99.9%' : '0%'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Device Load Metrics */}
            {selectedTower && (
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <span>Device Load & Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-4 gap-3">
                  <div className="text-center">
                    <Database className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Connected</p>
                    <p className="text-lg font-bold text-purple-700">{selectedTower.total_devices || 0}</p>
                  </div>
                  <div className="text-center">
                    <Wifi className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Bandwidth</p>
                    <p className="text-sm font-bold text-blue-700">{selectedTower.bandwidth || '1 Gbps'}</p>
                  </div>
                  <div className="text-center">
                    <Clock className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Latency</p>
                    <p className="text-sm font-bold text-green-700">{selectedTower.actual_latency || selectedTower.expected_latency || 'N/A'}</p>
                  </div>
                  <div className="text-center">
                    <Zap className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-600">Power</p>
                    <p className="text-sm font-bold text-yellow-700">{selectedTower.power_consumption_kw || 0} kW</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Logs List */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Recent Activity</Label>
              <div className="space-y-2 max-h-[350px] overflow-y-auto border rounded-lg p-3 bg-gray-50">
                {selectedTower?.id && towerLogs.filter(l => l.tower_id === selectedTower.id).length > 0 ? (
                  towerLogs
                    .filter(l => l.tower_id === selectedTower.id)
                    .map((log) => {
                      const getLogIcon = () => {
                        switch (log.event_type) {
                          case 'ping': return <Activity className="h-4 w-4 text-blue-600" />;
                          case 'status_change': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
                          case 'flapping': return <TrendingDown className="h-4 w-4 text-orange-600" />;
                          case 'alert': return <XCircle className="h-4 w-4 text-red-600" />;
                          default: return <CheckCircle className="h-4 w-4 text-gray-600" />;
                        }
                      };

                      const getLogBgColor = () => {
                        switch (log.event_type) {
                          case 'ping': return 'bg-blue-50 border-blue-200';
                          case 'status_change': return 'bg-yellow-50 border-yellow-200';
                          case 'flapping': return 'bg-orange-50 border-orange-200';
                          case 'alert': return 'bg-red-50 border-red-200';
                          default: return 'bg-white border-gray-200';
                        }
                      };

                      return (
                        <div key={log.id} className={`p-3 rounded border ${getLogBgColor()}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2 flex-1">
                              {getLogIcon()}
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{log.message}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(log.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            {log.latency && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {log.latency}ms
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No logs available yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Logs will appear here when you test connectivity or network events occur
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => selectedTower && testConnectivity(selectedTower)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
              <Button onClick={() => setIsLogsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NetworkMonitoring;