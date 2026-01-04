import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  BarChart3,
  Search,
  Loader2,
  Users,
  ClipboardList,
  AlertTriangle,
  FileText,
  Download,
  Filter,
  Eye,
  Wifi,
  Gauge,
  Router,
  Settings,
  HardDrive,
  Monitor,
  Wrench,
  Camera,
  Laptop,
  Printer,
  Phone,
  Building,
  Server,
  Battery,
  Fingerprint,
  Package,
  CheckCircle,
  CheckCircle2,
  UserCog,
  Trophy,
  Clock,
  Target,
  TrendingUp,
  Star,
  Zap,
} from "lucide-react";

// Define all issue types matching task form and database categories exactly
const ISSUE_TYPES = [
  { key: "NETWORK CONNECTIVITY", label: "Network", icon: Wifi, color: "bg-blue-500" },
  { key: "SPEED ISSUES", label: "Speed", icon: Gauge, color: "bg-orange-500" },
  { key: "ROUTER PROBLEMS", label: "Router", icon: Router, color: "bg-red-500" },
  { key: "CONFIGURATION", label: "Config", icon: Settings, color: "bg-purple-500" },
  { key: "HARDWARE FAILURE", label: "Hardware", icon: HardDrive, color: "bg-gray-600" },
  { key: "SOFTWARE ISSUE", label: "Software", icon: Monitor, color: "bg-cyan-500" },
  { key: "MAINTENANCE", label: "Maint.", icon: Wrench, color: "bg-green-500" },
  { key: "CCTV MAINTENANCE", label: "CCTV", icon: Camera, color: "bg-pink-500" },
  { key: "NEW INSTALLATION", label: "New Inst.", icon: Settings, color: "bg-teal-500" },
  { key: "TOWER MAINTENANCE", label: "Tower", icon: Wifi, color: "bg-indigo-500" },
  { key: "AMC CUSTOMER (SERVICES)", label: "AMC", icon: ClipboardList, color: "bg-emerald-500" },
  { key: "NON AMC (SERVICES)", label: "Non AMC", icon: ClipboardList, color: "bg-amber-500" },
  { key: "OFFICE SUPPORT", label: "Office", icon: Building, color: "bg-slate-500" },
  { key: "DESKTOP/LAPTOP SUPPORT", label: "Desktop", icon: Laptop, color: "bg-violet-500" },
  { key: "DESKTOP/LAPTOP ISSUE", label: "Laptop Issue", icon: Laptop, color: "bg-violet-400" },
  { key: "PRINTER RELATED ISSUE", label: "Printer", icon: Printer, color: "bg-yellow-500" },
  { key: "BIOMETRIC RELATED ISSUE", label: "Biometric", icon: Fingerprint, color: "bg-rose-500" },
  { key: "INTERCOM RELATED ISSUE", label: "Intercom", icon: Phone, color: "bg-lime-500" },
  { key: "SERVER MAINTENANCE", label: "Server", icon: Server, color: "bg-sky-500" },
  { key: "UPS AND POWER RELATED", label: "UPS", icon: Battery, color: "bg-amber-600" },
  { key: "UPS ISSUE", label: "UPS Issue", icon: Battery, color: "bg-amber-500" },
  { key: "PLAN ACTION", label: "Plan", icon: ClipboardList, color: "bg-blue-400" },
  { key: "NEW ACTION", label: "New Action", icon: CheckCircle, color: "bg-green-400" },
  { key: "NEW REQUIREMENT", label: "New Req", icon: Package, color: "bg-purple-400" },
];

// Normalize issue type for matching (uppercase and trim)
const normalizeIssueType = (type: string): string => {
  if (!type) return "";
  return type.toUpperCase().trim();
};

interface Customer {
  id: number;
  customerId: string;
  name: string;
  contactPerson?: string;
  email?: string;
  mobilePhone?: string;
  city?: string;
  status: string;
}

interface Task {
  id: number;
  ticketNumber: string;
  title: string;
  customerId: number;
  customerName?: string;
  status: string;
  priority: string;
  issueType?: string;
  issue_type?: string;
  createdAt: string;
  created_at?: string;
  completionTime?: string;
  completion_time?: string;
  actualTime?: number;
}

interface CustomerReport {
  customer: Customer;
  totalTasks: number;
  tasksByIssueType: Record<string, number>;
  avgResolutionTime: number;
  tasks: Task[];
}

interface User {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: string;
  department?: string;
  isActive?: boolean;
  active?: boolean;
}

interface EngineerReport {
  engineer: User;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  tasksByIssueType: Record<string, number>;
  avgResolutionTime: number;
  completionRate: number;
  slaCompliance: number;
  speedScore: number;
  performanceScore: number;
  tasks: Task[];
}

export default function Reports() {
  const [reportType, setReportType] = useState<"engineer" | "customer">("engineer");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerReport | null>(null);
  const [selectedEngineer, setSelectedEngineer] = useState<EngineerReport | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEngineerDialogOpen, setIsEngineerDialogOpen] = useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState<string | null>(null);

  // Fetch customers - with caching and auto-refresh for live updates
  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    staleTime: 30000, // Data considered fresh for 30 seconds
    refetchInterval: 60000, // Auto-refresh every 60 seconds for live updates
  });

  // Fetch tasks - with caching and auto-refresh for live updates
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    staleTime: 30000, // Data considered fresh for 30 seconds
    refetchInterval: 60000, // Auto-refresh every 60 seconds for live updates
  });

  // Fetch users (engineers) - with caching and auto-refresh for live updates
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    staleTime: 60000, // Users don't change often, cache for 60 seconds
    refetchInterval: 120000, // Auto-refresh every 2 minutes
  });

  const isLoading = customersLoading || tasksLoading || usersLoading;

  // Filter engineers only
  const engineers = useMemo(() => {
    return users.filter(u => 
      u.role === 'field_engineer' || 
      u.role === 'engineer' || 
      u.role === 'manager' ||
      u.role === 'admin'
    );
  }, [users]);

  // Generate customer reports with exact issue type matching
  const customerReports: CustomerReport[] = useMemo(() => {
    return customers.map((customer) => {
      // Filter tasks for this customer - check all possible field variations
      const customerTasks = tasks.filter((task: any) => {
        const taskCustId = task.customerId || task.customer_id;
        const taskCustName = task.customerName || task.customer_name;
        
        return (
          taskCustId === customer.id || 
          String(taskCustId) === String(customer.id) ||
          taskCustName?.toLowerCase() === customer.name?.toLowerCase()
        );
      });

      // Tasks by issue type - using exact matching
      const tasksByIssueType: Record<string, number> = {};
      ISSUE_TYPES.forEach(type => {
        tasksByIssueType[type.key] = 0;
      });
      tasksByIssueType["OTHER"] = 0;
      
      customerTasks.forEach((task: any) => {
        // Check multiple possible field names: issueType, issue_type, category
        const rawType = normalizeIssueType(task.issueType || task.issue_type || task.category || '');
        // Check if this type matches any of our defined types
        const matchedType = ISSUE_TYPES.find(t => t.key === rawType);
        if (matchedType) {
          tasksByIssueType[matchedType.key] = (tasksByIssueType[matchedType.key] || 0) + 1;
        } else if (rawType) {
          // If there's a type but it doesn't match, count as OTHER
          tasksByIssueType["OTHER"] = (tasksByIssueType["OTHER"] || 0) + 1;
        }
      });

      // Calculate average resolution time (in hours)
      let avgResolutionTime = 0;
      const resolvedTasks = customerTasks.filter((t: any) => t.completionTime || t.completion_time);
      if (resolvedTasks.length > 0) {
        const totalTime = resolvedTasks.reduce((sum: number, task: any) => {
          const created = new Date(task.createdAt || task.created_at).getTime();
          const completed = new Date(task.completionTime || task.completion_time).getTime();
          return sum + (completed - created);
        }, 0);
        avgResolutionTime = Math.round(totalTime / resolvedTasks.length / (1000 * 60 * 60));
      }

      return {
        customer,
        totalTasks: customerTasks.length,
        tasksByIssueType,
        avgResolutionTime,
        tasks: customerTasks,
      };
    });
  }, [customers, tasks]);

  // Filter reports
  const filteredReports = customerReports.filter((report) => {
    const matchesSearch =
      report.customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.customer.customerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.customer.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "with_tasks") return matchesSearch && report.totalTasks > 0;
    
    return matchesSearch;
  });

  // Sort by total tasks
  const sortedReports = filteredReports.sort((a, b) => b.totalTasks - a.totalTasks);

  // Overall statistics by issue type
  const overallStats = useMemo(() => {
    const stats: Record<string, number> = {};
    ISSUE_TYPES.forEach(type => stats[type.key] = 0);
    stats["OTHER"] = 0;
    
    customerReports.forEach(report => {
      Object.entries(report.tasksByIssueType).forEach(([type, count]) => {
        stats[type] = (stats[type] || 0) + count;
      });
    });
    return stats;
  }, [customerReports]);

  // Generate engineer reports with performance metrics
  const engineerReports: EngineerReport[] = useMemo(() => {
    return engineers.map((engineer) => {
      // Filter tasks assigned to this engineer (as assignedTo or fieldEngineerId)
      // Use Number() to handle string/number type mismatches
      const engineerId = Number(engineer.id);
      const engineerTasks = tasks.filter((task: any) => {
        const assignedTo = Number(task.assignedTo || task.assigned_to || 0);
        const fieldEngineerId = Number(task.fieldEngineerId || task.field_engineer_id || 0);
        return assignedTo === engineerId || fieldEngineerId === engineerId;
      });

      const completedTasks = engineerTasks.filter((t: any) => 
        t.status === 'completed' || t.status === 'resolved'
      );
      const approvedTasks = engineerTasks.filter((t: any) => 
        t.status === 'approved'
      );
      const pendingTasks = engineerTasks.filter((t: any) => 
        t.status === 'pending' || t.status === 'open'
      );
      const inProgressTasks = engineerTasks.filter((t: any) => 
        t.status === 'in_progress' || t.status === 'in-progress' || t.status === 'assigned'
      );

      // Tasks by issue type
      const tasksByIssueType: Record<string, number> = {};
      ISSUE_TYPES.forEach(type => tasksByIssueType[type.key] = 0);
      tasksByIssueType["OTHER"] = 0;
      
      engineerTasks.forEach((task: any) => {
        const rawType = normalizeIssueType(task.category || task.issueType || task.issue_type || '');
        const matchedType = ISSUE_TYPES.find(t => t.key === rawType);
        if (matchedType) {
          tasksByIssueType[matchedType.key] = (tasksByIssueType[matchedType.key] || 0) + 1;
        } else if (rawType) {
          tasksByIssueType["OTHER"] = (tasksByIssueType["OTHER"] || 0) + 1;
        }
      });

      // Calculate average resolution time (in hours)
      let avgResolutionTime = 0;
      const resolvedTasks = engineerTasks.filter((t: any) => t.completionTime || t.completion_time);
      if (resolvedTasks.length > 0) {
        const totalTime = resolvedTasks.reduce((sum: number, task: any) => {
          const created = new Date(task.createdAt || task.created_at).getTime();
          const completed = new Date(task.completionTime || task.completion_time).getTime();
          return sum + Math.max(0, completed - created);
        }, 0);
        avgResolutionTime = Math.round(totalTime / resolvedTasks.length / (1000 * 60 * 60));
      }

      // Calculate completion rate (%)
      const completionRate = engineerTasks.length > 0 
        ? Math.round((completedTasks.length / engineerTasks.length) * 100) 
        : 0;

      // Calculate approved rate (%)
      const approvedRate = engineerTasks.length > 0 
        ? Math.round((approvedTasks.length / engineerTasks.length) * 100) 
        : 0;

      // Calculate SLA compliance (tasks completed within 24 hours = 100%, within 48h = 75%, else 50%)
      let slaCompliance = 0;
      if (resolvedTasks.length > 0) {
        const slaScores = resolvedTasks.map((task: any) => {
          const created = new Date(task.createdAt || task.created_at).getTime();
          const completed = new Date(task.completionTime || task.completion_time).getTime();
          const hoursToComplete = (completed - created) / (1000 * 60 * 60);
          if (hoursToComplete <= 24) return 100;
          if (hoursToComplete <= 48) return 75;
          if (hoursToComplete <= 72) return 50;
          return 25;
        });
        slaCompliance = Math.round(slaScores.reduce((a, b) => a + b, 0) / slaScores.length);
      }

      // Calculate speed score (inverse of avg resolution time, max 100)
      let speedScore = 0;
      if (avgResolutionTime > 0) {
        speedScore = Math.max(0, Math.min(100, Math.round(100 - (avgResolutionTime * 2))));
      } else if (completedTasks.length > 0) {
        speedScore = 100; // If completed same day
      }

      // Performance Score = (Approved % × 0.5) + (SLA Compliance × 0.3) + (Speed Score × 0.2)
      const performanceScore = Math.round(
        (approvedRate * 0.5) + 
        (slaCompliance * 0.3) + 
        (speedScore * 0.2)
      );

      return {
        engineer,
        totalTasks: engineerTasks.length,
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        inProgressTasks: inProgressTasks.length,
        tasksByIssueType,
        avgResolutionTime,
        completionRate,
        approvedRate,
        approvedTasks: approvedTasks.length,
        slaCompliance,
        speedScore,
        performanceScore,
        tasks: engineerTasks,
      };
    });
  }, [engineers, tasks]);

  // Filter engineer reports
  const filteredEngineerReports = engineerReports.filter((report) => {
    const name = `${report.engineer.firstName || ''} ${report.engineer.lastName || ''} ${report.engineer.username}`.toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) ||
      report.engineer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "with_tasks") return matchesSearch && report.totalTasks > 0;
    
    return matchesSearch;
  });

  // Sort by performance score
  const sortedEngineerReports = filteredEngineerReports.sort((a, b) => b.performanceScore - a.performanceScore);

  // Overall engineer statistics
  const engineerOverallStats = useMemo(() => {
    const totalEngineers = engineers.length;
    
    // Count unique assigned tasks (tasks that have either assigned_to or field_engineer_id set)
    const tasksWithAssignment = tasks.filter((task: any) => {
      const assignedTo = task.assignedTo || task.assigned_to;
      const fieldEngineerId = task.fieldEngineerId || task.field_engineer_id;
      return assignedTo || fieldEngineerId;
    });
    const totalAssignedTasks = tasksWithAssignment.length;
    
    // Count unique completed tasks
    const completedTasks = tasksWithAssignment.filter((t: any) => 
      t.status === 'completed' || t.status === 'resolved'
    );
    const totalCompleted = completedTasks.length;
    
    const avgPerformance = engineerReports.length > 0 
      ? Math.round(engineerReports.reduce((sum, r) => sum + r.performanceScore, 0) / engineerReports.length)
      : 0;
    const topPerformer = sortedEngineerReports[0];
    
    return { totalEngineers, totalAssignedTasks, totalCompleted, avgPerformance, topPerformer };
  }, [engineers, engineerReports, sortedEngineerReports, tasks]);

  const totalTasks = tasks.length;
  const totalCustomers = customers.length;
  const customersWithTasks = customerReports.filter(r => r.totalTasks > 0).length;

  const handleViewDetails = (report: CustomerReport) => {
    setSelectedCustomer(report);
    setSelectedIssueType(null); // Reset filter when opening new customer
    setIsDetailDialogOpen(true);
  };

  const handleViewEngineerDetails = (report: EngineerReport) => {
    setSelectedEngineer(report);
    setIsEngineerDialogOpen(true);
  };

  // Export Engineer CSV
  const handleExportEngineerCSV = () => {
    const headers = ["Engineer Name", "Email", "Total Tasks", "Completed", "Pending", "In Progress", "Completion %", "SLA %", "Speed Score", "Performance Score"];
    const rows = sortedEngineerReports.map(r => [
      `${r.engineer.firstName || ''} ${r.engineer.lastName || r.engineer.username}`.trim(),
      r.engineer.email || '-',
      r.totalTasks,
      r.completedTasks,
      r.pendingTasks,
      r.inProgressTasks,
      r.completionRate,
      r.slaCompliance,
      r.speedScore,
      r.performanceScore
    ]);

    const csv = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `engineer-performance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Get performance color based on score
  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'bg-green-500' };
    if (score >= 60) return { label: 'Good', color: 'bg-blue-500' };
    if (score >= 40) return { label: 'Average', color: 'bg-yellow-500' };
    return { label: 'Needs Improvement', color: 'bg-red-500' };
  };

  const handleExportCSV = () => {
    const typeKeys = ISSUE_TYPES.map(t => t.key);
    const headers = ["Customer ID", "Customer Name", "City", "Total Tasks", ...ISSUE_TYPES.map(t => t.label), "Avg Resolution (hrs)"];
    const rows = sortedReports.map(r => [
      r.customer.customerId,
      r.customer.name,
      r.customer.city || "-",
      r.totalTasks,
      ...typeKeys.map(type => r.tasksByIssueType[type] || 0),
      r.avgResolutionTime || "-"
    ]);

    const csv = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customer-issue-type-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Get icon for issue type
  const getIssueTypeIcon = (type: string) => {
    const found = ISSUE_TYPES.find(t => t.key === type);
    if (found) {
      const Icon = found.icon;
      return <Icon className="h-3 w-3" />;
    }
    return <ClipboardList className="h-3 w-3" />;
  };

  const getIssueTypeColor = (type: string) => {
    const found = ISSUE_TYPES.find(t => t.key === type);
    return found?.color || "bg-gray-500";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-purple-600" />
            Reports
          </h1>
          <p className="text-muted-foreground">Comprehensive performance and task analysis</p>
        </div>
      </div>

      {/* Tabs for Engineer vs Customer Reports */}
      <Tabs value={reportType} onValueChange={(value) => setReportType(value as "engineer" | "customer")} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="engineer" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Engineer Report
          </TabsTrigger>
          <TabsTrigger value="customer" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customer Report
          </TabsTrigger>
        </TabsList>

        {/* Engineer Report Tab */}
        <TabsContent value="engineer" className="space-y-6 mt-6">
          {/* Export Button */}
          <div className="flex justify-end">
            <Button onClick={handleExportEngineerCSV} className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Export Engineer Report
            </Button>
          </div>

          {/* Engineer Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-1">
                  <UserCog className="h-4 w-4" />
                  Total Engineers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{engineerOverallStats.totalEngineers}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-1">
                  <ClipboardList className="h-4 w-4" />
                  Assigned Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{engineerOverallStats.totalAssignedTasks}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-100 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{engineerOverallStats.totalCompleted}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-100 flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Avg Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{engineerOverallStats.avgPerformance}%</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-100 flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  Top Performer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold truncate">
                  {engineerOverallStats.topPerformer 
                    ? `${engineerOverallStats.topPerformer.engineer.firstName || engineerOverallStats.topPerformer.engineer.username}` 
                    : '-'}
                </div>
                {engineerOverallStats.topPerformer && (
                  <div className="text-xs text-yellow-100">{engineerOverallStats.topPerformer.performanceScore}% score</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Score Formula Explanation */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-purple-500" />
                <h4 className="font-semibold">Performance Score Formula</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono bg-purple-100 px-2 py-1 rounded">
                  Score = (Approved % × 0.5) + (SLA Compliance × 0.3) + (Speed Score × 0.2)
                </span>
              </p>
              <div className="grid grid-cols-3 gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>Approved %: Tasks approved vs assigned (50% weight)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-blue-500" />
                  <span>SLA Compliance: Resolved within SLA (30% weight)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-yellow-500" />
                  <span>Speed Score: Based on resolution time (20% weight)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by engineer name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Engineers</SelectItem>
                <SelectItem value="with_tasks">With Tasks Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Engineer Reports Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Engineer Performance ({sortedEngineerReports.length} engineers)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="sticky left-0 bg-gray-50 z-10 min-w-[180px]">Engineer</TableHead>
                      <TableHead className="text-center min-w-[70px]">Total</TableHead>
                      <TableHead className="text-center min-w-[80px]">
                        <div className="flex flex-col items-center">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-xs">Completed</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center min-w-[70px]">
                        <div className="flex flex-col items-center">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span className="text-xs">Pending</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center min-w-[80px]">
                        <div className="flex flex-col items-center">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          <span className="text-xs">In Progress</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center min-w-[90px]">
                        <div className="flex flex-col items-center">
                          <Target className="h-4 w-4 text-green-600" />
                          <span className="text-xs">Completion %</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center min-w-[80px]">
                        <div className="flex flex-col items-center">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-xs">SLA %</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center min-w-[80px]">
                        <div className="flex flex-col items-center">
                          <Zap className="h-4 w-4 text-yellow-600" />
                          <span className="text-xs">Speed</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center min-w-[100px]">
                        <div className="flex flex-col items-center">
                          <Star className="h-4 w-4 text-purple-600" />
                          <span className="text-xs">Performance</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedEngineerReports.map((report, index) => {
                      const perfBadge = getPerformanceBadge(report.performanceScore);
                      return (
                        <TableRow key={report.engineer.id} className="hover:bg-gray-50">
                          <TableCell className="sticky left-0 bg-white z-10">
                            <div className="flex items-center gap-2">
                              {index === 0 && report.performanceScore > 0 && (
                                <Trophy className="h-4 w-4 text-yellow-500" />
                              )}
                              <div>
                                <div className="font-medium">
                                  {report.engineer.firstName} {report.engineer.lastName || report.engineer.username}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {report.engineer.email || '-'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-blue-50 font-bold">
                              {report.totalTasks}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-green-500">{report.completedTasks}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-orange-50 text-orange-700">{report.pendingTasks}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">{report.inProgressTasks}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-bold ${report.completionRate >= 70 ? 'text-green-600' : report.completionRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {report.completionRate}%
                              </span>
                              <Progress value={report.completionRate} className="w-16 h-1" />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`font-bold ${report.slaCompliance >= 70 ? 'text-green-600' : report.slaCompliance >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {report.slaCompliance}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-bold text-blue-600">{report.speedScore}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`${perfBadge.color} text-white font-bold`}>
                              {report.performanceScore}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewEngineerDetails(report)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {sortedEngineerReports.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No engineers found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Report Tab */}
        <TabsContent value="customer" className="space-y-6 mt-6">
          {/* Export Button */}
          <div className="flex justify-end">
            <Button onClick={handleExportCSV} className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Export Customer Report
            </Button>
          </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Customers with Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customersWithTasks}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">Issue Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ISSUE_TYPES.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Issue Type Summary Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            Issue Type Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {ISSUE_TYPES.map(({ key, label, icon: Icon, color }) => (
              <div key={key} className={`p-3 rounded-lg ${color} text-white text-center`}>
                <Icon className="h-5 w-5 mx-auto mb-1" />
                <p className="text-xs font-medium truncate">{label}</p>
                <p className="text-lg font-bold">{overallStats[key] || 0}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name, ID, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            <SelectItem value="with_tasks">With Tasks Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customer Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer-wise Report ({sortedReports.length} customers)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="sticky left-0 bg-gray-50 z-10 min-w-[200px]">Customer</TableHead>
                  <TableHead className="text-center min-w-[80px]">Total</TableHead>
                  {ISSUE_TYPES.map(({ key, label, icon: Icon, color }) => (
                    <TableHead key={key} className="text-center min-w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`p-1 rounded ${color}`}>
                          <Icon className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-xs">{label}</span>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center min-w-[80px]">Avg Res.</TableHead>
                  <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedReports.slice(0, 100).map((report) => (
                  <TableRow key={report.customer.id} className="hover:bg-gray-50">
                    <TableCell className="sticky left-0 bg-white z-10">
                      <div>
                        <div className="font-medium">{report.customer.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {report.customer.customerId} • {report.customer.city || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-blue-50 font-bold">
                        {report.totalTasks}
                      </Badge>
                    </TableCell>
                    {ISSUE_TYPES.map(({ key, color }) => (
                      <TableCell key={key} className="text-center">
                        {report.tasksByIssueType[key] > 0 ? (
                          <Badge className={`${color} text-white`}>
                            {report.tasksByIssueType[key]}
                          </Badge>
                        ) : (
                          <span className="text-gray-300">0</span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      {report.avgResolutionTime > 0 ? (
                        <span className="text-sm font-medium">{report.avgResolutionTime}h</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(report)}
                        disabled={report.totalTasks === 0}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {sortedReports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={ISSUE_TYPES.length + 4} className="text-center py-8 text-muted-foreground">
                      No customers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              {selectedCustomer?.customer.name} - Issue Type Breakdown
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Customer ID</p>
                    <p className="font-medium">{selectedCustomer.customer.customerId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Contact</p>
                    <p className="font-medium">{selectedCustomer.customer.contactPerson || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedCustomer.customer.mobilePhone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">City</p>
                    <p className="font-medium">{selectedCustomer.customer.city || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Issue Type Breakdown */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Tasks by Issue Type
                  {selectedIssueType && (
                    <Badge 
                      variant="outline" 
                      className="ml-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => setSelectedIssueType(null)}
                    >
                      Showing: {selectedIssueType} ✕
                    </Badge>
                  )}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ISSUE_TYPES.map(({ key, label, icon: Icon, color }) => {
                    const count = selectedCustomer.tasksByIssueType[key] || 0;
                    const isSelected = selectedIssueType === key;
                    return (
                      <div 
                        key={key} 
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          count > 0 
                            ? `${color} text-white ${isSelected ? 'ring-2 ring-offset-2 ring-black scale-105' : 'hover:scale-105'}` 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => count > 0 && setSelectedIssueType(isSelected ? null : key)}
                        title={count > 0 ? `Click to filter by ${label}` : 'No tasks'}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <p className="text-2xl font-bold mt-1">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-blue-600">{selectedCustomer.totalTasks}</p>
                    <p className="text-sm text-muted-foreground">Total Tasks</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-purple-600">{selectedCustomer.avgResolutionTime || 0}h</p>
                    <p className="text-sm text-muted-foreground">Avg Resolution</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Tasks */}
              {selectedCustomer.tasks.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    {selectedIssueType ? (
                      <>
                        Tasks - {selectedIssueType} 
                        <Badge className="text-xs">{
                          selectedCustomer.tasks.filter((t: any) => {
                            const type = normalizeIssueType(t.category || t.issueType || t.issue_type || '');
                            return type === selectedIssueType;
                          }).length
                        } tasks</Badge>
                      </>
                    ) : (
                      <>Recent Tasks</>
                    )}
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedCustomer.tasks
                      .filter((task: any) => {
                        if (!selectedIssueType) return true;
                        const type = normalizeIssueType(task.category || task.issueType || task.issue_type || '');
                        return type === selectedIssueType;
                      })
                      .slice(0, 50).map((task: any) => {
                      const issueType = normalizeIssueType(task.category || task.issueType || task.issue_type || 'OTHER');
                      return (
                        <div key={task.id} className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <Badge className={getIssueTypeColor(issueType) + ' text-white text-xs'}>
                              {getIssueTypeIcon(issueType)}
                              <span className="ml-1 truncate max-w-[100px]">{issueType}</span>
                            </Badge>
                            <div>
                              <p className="font-medium text-sm">{task.ticketNumber || task.ticket_number}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{task.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={
                              task.status === 'completed' ? 'bg-green-500' :
                              task.status === 'in_progress' || task.status === 'in-progress' ? 'bg-blue-500' :
                              task.status === 'pending' ? 'bg-orange-500' :
                              'bg-gray-500'
                            }>
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                    {selectedIssueType && selectedCustomer.tasks.filter((t: any) => {
                      const type = normalizeIssueType(t.category || t.issueType || t.issue_type || '');
                      return type === selectedIssueType;
                    }).length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No tasks found for this issue type</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>
      </Tabs>

      {/* Engineer Detail Dialog */}
      <Dialog open={isEngineerDialogOpen} onOpenChange={setIsEngineerDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-purple-600" />
              {selectedEngineer?.engineer.firstName} {selectedEngineer?.engineer.lastName || selectedEngineer?.engineer.username} - Performance Details
            </DialogTitle>
          </DialogHeader>

          {selectedEngineer && (
            <div className="space-y-6">
              {/* Engineer Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Engineer Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedEngineer.engineer.firstName} {selectedEngineer.engineer.lastName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Username</p>
                    <p className="font-medium">{selectedEngineer.engineer.username}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedEngineer.engineer.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Role</p>
                    <p className="font-medium capitalize">{selectedEngineer.engineer.role}</p>
                  </div>
                </div>
              </div>

              {/* Performance Score Breakdown */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-purple-500" />
                  Performance Score Breakdown
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className={`${getPerformanceColor(selectedEngineer.performanceScore)}`}>
                    <CardContent className="p-4 text-center">
                      <Trophy className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-3xl font-bold">{selectedEngineer.performanceScore}%</p>
                      <p className="text-sm font-medium">Overall Score</p>
                      <Badge className={getPerformanceBadge(selectedEngineer.performanceScore).color + ' mt-2'}>
                        {getPerformanceBadge(selectedEngineer.performanceScore).label}
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50">
                    <CardContent className="p-4 text-center">
                      <Target className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      <p className="text-3xl font-bold text-green-600">{selectedEngineer.completionRate}%</p>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                      <p className="text-xs text-green-600 mt-1">Weight: 50%</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50">
                    <CardContent className="p-4 text-center">
                      <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <p className="text-3xl font-bold text-blue-600">{selectedEngineer.slaCompliance}%</p>
                      <p className="text-sm text-muted-foreground">SLA Compliance</p>
                      <p className="text-xs text-blue-600 mt-1">Weight: 30%</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-yellow-50">
                    <CardContent className="p-4 text-center">
                      <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                      <p className="text-3xl font-bold text-yellow-600">{selectedEngineer.speedScore}</p>
                      <p className="text-sm text-muted-foreground">Speed Score</p>
                      <p className="text-xs text-yellow-600 mt-1">Weight: 20%</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Task Statistics */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Task Statistics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="bg-blue-50">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600">{selectedEngineer.totalTasks}</p>
                      <p className="text-xs text-muted-foreground">Total Assigned</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{selectedEngineer.completedTasks}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-50">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-orange-600">{selectedEngineer.pendingTasks}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-purple-600">{selectedEngineer.inProgressTasks}</p>
                      <p className="text-xs text-muted-foreground">In Progress</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Tasks by Issue Type */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Tasks by Issue Type
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
                  {ISSUE_TYPES.map(({ key, label, icon: Icon, color }) => {
                    const count = selectedEngineer.tasksByIssueType[key] || 0;
                    return (
                      <div 
                        key={key} 
                        className={`p-3 rounded-lg border ${count > 0 ? `${color} text-white` : 'bg-gray-50'}`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <p className="text-2xl font-bold mt-1">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Average Resolution Time */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span className="font-semibold">Average Resolution Time</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {selectedEngineer.avgResolutionTime > 0 ? `${selectedEngineer.avgResolutionTime}h` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Recent Tasks */}
              {selectedEngineer.tasks.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    Recent Tasks
                    <Badge className="text-xs">{selectedEngineer.tasks.length} tasks</Badge>
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedEngineer.tasks.slice(0, 20).map((task: any) => {
                      const issueType = normalizeIssueType(task.category || task.issueType || task.issue_type || 'OTHER');
                      return (
                        <div key={task.id} className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <Badge className={getIssueTypeColor(issueType) + ' text-white text-xs'}>
                              {getIssueTypeIcon(issueType)}
                              <span className="ml-1 truncate max-w-[80px]">{issueType}</span>
                            </Badge>
                            <div>
                              <p className="font-medium text-sm">{task.ticketNumber || task.ticket_number}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{task.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={
                              task.status === 'completed' ? 'bg-green-500' :
                              task.status === 'in_progress' || task.status === 'in-progress' ? 'bg-blue-500' :
                              task.status === 'pending' ? 'bg-orange-500' :
                              'bg-gray-500'
                            }>
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
