import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText,
  Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

export default function Portal() {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const { user, isLoading: authLoading } = useAuth();

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });

  const { data: taskUpdates } = useQuery({
    queryKey: [`/api/tasks/${selectedTaskId}/updates`],
    enabled: !!selectedTaskId,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const tasksArray = Array.isArray(tasks) ? tasks : [];
  
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      case 'critical': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const myTasks = tasksArray.filter(task => 
    task.assignedTo === user?.id || task.fieldEngineerId === user?.id
  );

  const statsData = {
    total: myTasks.length,
    pending: myTasks.filter(t => t.status === 'pending').length,
    inProgress: myTasks.filter(t => t.status === 'in_progress').length,
    completed: myTasks.filter(t => t.status === 'completed' || t.status === 'resolved').length,
  };

  const handleTaskIdClick = (task: any) => {
    setSelectedTaskId(task.id);
  };

  return (
    <div className="min-h-screen">
      <Header 
        title={`Welcome, ${user?.firstName || 'User'}`}
        subtitle="Your Personal Task Portal"
      >
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-1" />
            {user?.role?.replace('_', ' ').toUpperCase()}
          </div>
          <div className="flex items-center">
            <Mail className="w-4 h-4 mr-1" />
            {user?.email}
          </div>
        </div>
      </Header>

      <div className="p-6 space-y-8">
        {/* Task Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">My Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{statsData.total}</p>
                </div>
                <FileText className="w-5 h-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{statsData.pending}</p>
                </div>
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{statsData.inProgress}</p>
                </div>
                <AlertCircle className="w-5 h-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{statsData.completed}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Assigned Tasks</CardTitle>
              <Badge variant="outline" className="text-sm">
                {myTasks.length} tasks assigned to you
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : myTasks.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Issue Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myTasks.map((task: any) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <button 
                            onClick={() => handleTaskIdClick(task)}
                            className="text-primary hover:text-blue-700 font-medium underline"
                          >
                            {task.ticketNumber}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{task.customer?.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{task.customer?.city}</p>
                          </div>
                        </TableCell>
                        <TableCell>{task.issueType}</TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.createdAt ? format(new Date(task.createdAt), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleTaskIdClick(task)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No tasks assigned</p>
                <p>You don't have any tasks assigned to you at the moment.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Details Modal */}
      <Dialog open={!!selectedTaskId} onOpenChange={() => setSelectedTaskId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          
          {selectedTaskId && (
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
              {(() => {
                const task = myTasks.find(t => t.id === selectedTaskId);
                if (!task) return <div>Task not found</div>;

                return (
                  <div className="space-y-6">
                    {/* Task Header */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{task.ticketNumber}</h3>
                          <p className="text-gray-600">{task.description}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status?.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Customer Info */}
                    {task.customer && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Customer Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm font-medium">Name:</span>
                              <p>{task.customer.name}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Contact:</span>
                              <p>{task.customer.contactPerson}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Location:</span>
                              <p>{task.customer.city}, {task.customer.state}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Phone:</span>
                              <p>{task.customer.mobilePhone}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Task History */}
                    {taskUpdates && taskUpdates.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Task History</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {taskUpdates.map((update: any) => (
                              <div key={update.id} className="border-l-2 border-gray-200 pl-4 pb-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-sm font-medium">
                                      {update.updatedByUser?.firstName} {update.updatedByUser?.lastName}
                                    </p>
                                    <p className="text-sm text-gray-600">{update.notes}</p>
                                    {update.files && update.files.length > 0 && (
                                      <div className="mt-2">
                                        <p className="text-xs text-gray-500">Files: {update.files.join(', ')}</p>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {update.createdAt ? format(new Date(update.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}