import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ClipboardList, 
  Calendar,
  User,
  Building,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Filter,
  Eye,
  RefreshCw,
  Download,
  TrendingUp
} from "lucide-react";

interface DailyReport {
  id: number;
  engineer_id: number;
  engineer_name: string;
  report_date: string;
  sites_visited: number;
  work_done: string;
  sites_completed: number;
  completed_sites_names: string | null;
  incomplete_sites_names: string | null;
  reason_not_done: string | null;
  has_issue: boolean;
  issue_details: string | null;
  created_at: string;
  updated_at: string;
}

interface ReportStats {
  engineerStats: { name: string; reportCount: number }[];
  weeklyCount: number;
  monthlyCount: number;
  totalCount: number;
}

export default function EngineerReports() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'dashboard' | 'table'>('dashboard');
  const [filterEngineer, setFilterEngineer] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'week' | 'month'>('all');
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Fetch daily reports - get all and filter client-side
  const { data: reports = [], isLoading, isFetching, refetch } = useQuery<DailyReport[]>({
    queryKey: ["/api/daily-reports"],
    queryFn: async () => {
      const response = await fetch(`/api/daily-reports`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      return response.json();
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: false
  });

  // Fetch report stats
  const { data: stats } = useQuery<ReportStats>({
    queryKey: ["/api/daily-reports/stats"],
    queryFn: async () => {
      const response = await fetch('/api/daily-reports/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  // Get unique engineers from reports
  const engineers = Array.from(new Set(reports.map(r => r.engineer_name))).filter(Boolean).sort();

  // Filter reports by period, engineer, and date range (client-side filtering)
  const filteredReports = reports.filter(report => {
    // Filter by engineer name
    if (filterEngineer !== 'all' && report.engineer_name !== filterEngineer) {
      return false;
    }
    
    const reportDate = new Date(report.report_date);
    reportDate.setHours(0, 0, 0, 0);
    
    // Filter by custom date range (takes priority over period filter)
    if (dateFrom || dateTo) {
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (reportDate < fromDate) return false;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (reportDate > toDate) return false;
      }
      return true;
    }
    
    // Filter by period preset (only if no custom date range)
    if (filterPeriod === 'all') {
      return true; // Show all reports
    }
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (filterPeriod === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return reportDate >= weekAgo;
    } else if (filterPeriod === 'month') {
      // Start of current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return reportDate >= startOfMonth;
    }
    return true;
  });

  // Calculate stats for filtered reports
  const totalSitesVisited = filteredReports.reduce((sum, r) => sum + (r.sites_visited || 0), 0);
  const totalSitesCompleted = filteredReports.reduce((sum, r) => sum + (r.sites_completed || 0), 0);
  const reportsWithIssues = filteredReports.filter(r => r.has_issue).length;

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-blue-600" />
            Engineer Reports
          </h1>
          <p className="text-gray-500 mt-1">View and manage daily reports from field engineers</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setViewMode('dashboard')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant={viewMode === 'table' ? 'default' : 'outline'}
            onClick={() => setViewMode('table')}
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Table View
          </Button>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700">Filters:</span>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm text-gray-500">Period</label>
              <Select value={filterPeriod} onValueChange={(v: 'all' | 'week' | 'month') => setFilterPeriod(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-500">Engineer</label>
              <Select value={filterEngineer} onValueChange={setFilterEngineer}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Engineers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Engineers</SelectItem>
                  {engineers.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-500">From Date</label>
              <Input 
                type="date" 
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[150px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-500">To Date</label>
              <Input 
                type="date" 
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[150px]"
              />
            </div>

            <Button variant="ghost" onClick={() => {
              setFilterPeriod('all');
              setFilterEngineer('all');
              setDateFrom('');
              setDateTo('');
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard View */}
      {viewMode === 'dashboard' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-2 border-blue-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Reports</p>
                    <p className="text-3xl font-bold mt-1 text-blue-600">{stats?.totalCount || filteredReports.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-green-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Sites Completed</p>
                    <p className="text-3xl font-bold mt-1 text-green-600">{totalSitesCompleted}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-purple-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Sites Visited</p>
                    <p className="text-3xl font-bold mt-1 text-purple-600">{totalSitesVisited}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Building className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-orange-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Reports with Issues</p>
                    <p className="text-3xl font-bold mt-1 text-orange-600">{reportsWithIssues}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Engineer-wise Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Engineer-wise Report Count
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.engineerStats?.length ? (
                  <div className="space-y-3">
                    {stats.engineerStats.map((eng, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                            {eng.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{eng.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          {eng.reportCount}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats?.weeklyCount || 0}</p>
                    <p className="text-sm text-gray-600">This Week</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats?.monthlyCount || 0}</p>
                    <p className="text-sm text-gray-600">This Month</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {filteredReports.length > 0 
                        ? Math.round(totalSitesCompleted / filteredReports.length * 10) / 10 
                        : 0}
                    </p>
                    <p className="text-sm text-gray-600">Avg Sites/Report</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">
                      {filteredReports.length > 0 
                        ? Math.round((reportsWithIssues / filteredReports.length) * 100) 
                        : 0}%
                    </p>
                    <p className="text-sm text-gray-600">Issue Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reports Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Recent Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-4 text-gray-500">Loading reports...</p>
              ) : filteredReports.length === 0 ? (
                <p className="text-center py-4 text-gray-500">No reports found</p>
              ) : (
                <div className="space-y-3">
                  {filteredReports.slice(0, 5).map(report => (
                    <div 
                      key={report.id} 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => setSelectedReport(report)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                          {report.engineer_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{report.engineer_name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(report.report_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{report.sites_visited} visited</p>
                          <p className="text-sm text-green-600">{report.sites_completed} completed</p>
                        </div>
                        {report.has_issue && (
                          <AlertTriangle className="w-5 h-5 text-orange-500" />
                        )}
                        <Eye className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Engineer Name</TableHead>
                  <TableHead>Sites Visited</TableHead>
                  <TableHead>Sites Completed</TableHead>
                  <TableHead>Work Done</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Loading reports...
                    </TableCell>
                  </TableRow>
                ) : filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map(report => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {new Date(report.report_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {report.engineer_name?.charAt(0).toUpperCase()}
                          </div>
                          {report.engineer_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.sites_visited}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700">{report.sites_completed}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {report.work_done}
                      </TableCell>
                      <TableCell>
                        {report.has_issue ? (
                          <Badge className="bg-orange-100 text-orange-700">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Report Details Modal */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Daily Report Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {selectedReport.engineer_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-900">{selectedReport.engineer_name}</p>
                  <p className="text-gray-600 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedReport.report_date).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">{selectedReport.sites_visited}</p>
                  <p className="text-sm text-gray-600">Sites Visited</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedReport.sites_completed}</p>
                  <p className="text-sm text-gray-600">Sites Completed</p>
                </div>
              </div>

              {/* Work Done */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Work Done</h4>
                <p className="p-4 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap">
                  {selectedReport.work_done}
                </p>
              </div>

              {/* Completed Sites */}
              {selectedReport.completed_sites_names && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Completed Sites
                  </h4>
                  <p className="p-4 bg-green-50 rounded-lg text-gray-700 whitespace-pre-wrap">
                    {selectedReport.completed_sites_names}
                  </p>
                </div>
              )}

              {/* Incomplete Sites */}
              {selectedReport.incomplete_sites_names && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    Incomplete Sites
                  </h4>
                  <p className="p-4 bg-red-50 rounded-lg text-gray-700 whitespace-pre-wrap">
                    {selectedReport.incomplete_sites_names}
                  </p>
                </div>
              )}

              {/* Reason Not Done */}
              {selectedReport.reason_not_done && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Reason for Incomplete Work</h4>
                  <p className="p-4 bg-yellow-50 rounded-lg text-gray-700 whitespace-pre-wrap">
                    {selectedReport.reason_not_done}
                  </p>
                </div>
              )}

              {/* Issues */}
              {selectedReport.has_issue && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    Issue Details
                  </h4>
                  <p className="p-4 bg-orange-50 rounded-lg text-gray-700 whitespace-pre-wrap">
                    {selectedReport.issue_details || 'No details provided'}
                  </p>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-sm text-gray-500 pt-4 border-t">
                Submitted: {new Date(selectedReport.created_at).toLocaleString()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
