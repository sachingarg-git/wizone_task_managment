import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  LayoutList,
  Clock, 
  Loader, 
  CheckCircle, 
  Eye,
  X,
  RefreshCw
} from "lucide-react";

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Fetch task stats
  const { data: taskStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/tasks/stats"],
    queryFn: async () => {
      const res = await fetch('/api/tasks/stats', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error('Failed to fetch task stats');
      }
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  // Fetch tasks with direct fetch and loading states
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<any>(null);

  const fetchTasks = async () => {
    console.log('🔄 TASKS: Starting fetch...');
    setTasksLoading(true);
    setTasksError(null);
    
    try {
      console.log('📡 TASKS: Making request to /api/tasks');
      const response = await fetch('/api/tasks', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      
      console.log('📡 TASKS: Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ TASKS: HTTP Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ TASKS: Raw response data:', data);
      console.log('✅ TASKS: Data type:', typeof data, 'Is Array:', Array.isArray(data));
      console.log('✅ TASKS: Data length:', Array.isArray(data) ? data.length : 'N/A');
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('✅ TASKS: First task sample:', data[0]);
        setTasks(data);
      } else if (Array.isArray(data) && data.length === 0) {
        console.log('⚠️ TASKS: Empty array received');
        setTasks([]);
      } else {
        console.error('❌ TASKS: Expected array, got:', typeof data, data);
        setTasksError(new Error('Invalid data format received'));
        setTasks([]);
      }
    } catch (error: any) {
      console.error('❌ TASKS: Fetch error:', error);
      console.error('❌ TASKS: Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setTasksError(error);
      setTasks([]);
    } finally {
      console.log('🏁 TASKS: Fetch complete, setting loading to false');
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Filter tasks based on search and status
  const filteredTasks = useMemo(() => {
    console.log('🔍 FILTER: Filtering tasks. Raw tasks:', tasks?.length || 0);
    console.log('🔍 FILTER: Search query:', searchQuery);
    console.log('🔍 FILTER: Status filter:', statusFilter);
    
    if (!Array.isArray(tasks)) {
      console.log('⚠️ FILTER: Tasks is not an array:', typeof tasks, tasks);
      return [];
    }
    
    const filtered = tasks.filter((task: any) => {
      const matchesSearch = searchQuery === "" || 
        task.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (Array.isArray(task.customerName) ? task.customerName[0] : task.customerName)?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    console.log('🔍 FILTER: Filtered result:', filtered?.length || 0, 'tasks');
    return filtered;
  }, [tasks, searchQuery, statusFilter]);

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'approved': return 'bg-purple-100 text-purple-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Task Management" subtitle="Create, assign, and track task progress" />
      
      <div className="p-6 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Management (Working Version)</h1>
            <p className="text-gray-600 mt-1">Simplified version without problematic filtering</p>
          </div>
          <Button onClick={fetchTasks} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards - Only Basic Ones */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {statsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 border-l-4 border-l-slate-500 bg-gradient-to-r from-slate-50 to-white"
                onClick={() => setStatusFilter('all')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Total Tasks</p>
                      <p className="text-4xl font-bold text-slate-800 mt-1">{(taskStats as any)?.total || 0}</p>
                    </div>
                    <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center shadow-sm">
                      <LayoutList className="w-7 h-7 text-slate-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-white"
                onClick={() => setStatusFilter('pending')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide">Pending</p>
                      <p className="text-4xl font-bold text-orange-800 mt-1">{(taskStats as any)?.pending || 0}</p>
                    </div>
                    <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center shadow-sm">
                      <Clock className="w-7 h-7 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white"
                onClick={() => setStatusFilter('in_progress')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">In Progress</p>
                      <p className="text-4xl font-bold text-blue-800 mt-1">{(taskStats as any)?.inProgress || 0}</p>
                    </div>
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center shadow-sm">
                      <Loader className="w-7 h-7 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-white"
                onClick={() => setStatusFilter('approved')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Approved</p>
                      <p className="text-4xl font-bold text-purple-800 mt-1">{(taskStats as any)?.approved || 0}</p>
                    </div>
                    <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center shadow-sm">
                      <CheckCircle className="w-7 h-7 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white"
                onClick={() => setStatusFilter('completed')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Completed</p>
                      <p className="text-4xl font-bold text-green-800 mt-1">{(taskStats as any)?.completed || 0}</p>
                    </div>
                    <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center shadow-sm">
                      <CheckCircle className="w-7 h-7 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <CardTitle>All Tasks ({filteredTasks.length})</CardTitle>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {statusFilter !== 'all' && (
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear Filter
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
              <strong>Debug Info:</strong><br/>
              Tasks Loading: {tasksLoading ? 'Yes' : 'No'}<br/>
              Tasks Error: {tasksError ? tasksError.message : 'None'}<br/>
              Raw Tasks Count: {tasks?.length || 0}<br/>
              Filtered Tasks Count: {filteredTasks?.length || 0}<br/>
              Status Filter: {statusFilter}<br/>
              Search Query: "{searchQuery}"
            </div>
            {tasksLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader className="w-6 h-6 animate-spin mr-2" />
                <span>Loading tasks...</span>
              </div>
            ) : tasksError ? (
              <div className="text-center py-8 text-red-500">
                <p>Error: {tasksError.message}</p>
                <Button onClick={fetchTasks} className="mt-4" variant="outline">
                  Retry
                </Button>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No tasks found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task: any) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {task.ticketNumber}
                          </Badge>
                        </TableCell>
                        <TableCell>{task.title || 'No Title'}</TableCell>
                        <TableCell>
                          {Array.isArray(task.customerName) 
                            ? task.customerName[0] || 'Unknown'
                            : task.customerName || 'Unknown'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(task.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}