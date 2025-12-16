import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  RefreshCw,
  Lock,
  FileText,
  ShieldX
} from "lucide-react";

interface Complaint {
  id: number;
  complaint_id: string;
  engineer_id: number;
  engineer_name: string;
  engineer_email: string | null;
  subject: string;
  description: string;
  category: string | null;
  status: string;
  status_note: string | null;
  status_history: Array<{
    status: string;
    note: string;
    changedBy: number;
    changedByName: string;
    changedAt: string;
  }> | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'under_investigation', label: 'Under Investigation', color: 'bg-purple-100 text-purple-800' },
  { value: 'review', label: 'Review', color: 'bg-orange-100 text-orange-800' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800' },
];

const getStatusColor = (status: string) => {
  const option = statusOptions.find(s => s.value === status);
  return option?.color || 'bg-gray-100 text-gray-800';
};

const getStatusLabel = (status: string) => {
  const option = statusOptions.find(s => s.value === status);
  return option?.label || status;
};

export default function ComplaintManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  // Check if user is admin - only admins can access this page
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <ShieldX className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              Only administrators can access the Complaint Management page.
            </p>
            <Button onClick={() => navigate("/")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch complaints
  const { data: complaints = [], isLoading, refetch } = useQuery<Complaint[]>({
    queryKey: ["/api/complaints"],
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: number; status: string; note: string }) => {
      const response = await apiRequest("PUT", `/api/complaints/${id}/status`, {
        status,
        statusNote: note,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      toast({
        title: "Status Updated",
        description: "Complaint status has been updated successfully.",
      });
      setShowStatusDialog(false);
      setSelectedComplaint(null);
      setNewStatus("");
      setStatusNote("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Filter complaints
  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = 
      (complaint.complaint_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (complaint.engineer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (complaint.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (complaint.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    inProgress: complaints.filter(c => c.status === 'in_progress').length,
    underInvestigation: complaints.filter(c => c.status === 'under_investigation').length,
    review: complaints.filter(c => c.status === 'review').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  };

  const handleStatusChange = () => {
    if (!selectedComplaint || !newStatus) return;
    
    updateStatusMutation.mutate({
      id: selectedComplaint.id,
      status: newStatus,
      note: statusNote,
    });
  };

  const openStatusDialog = (complaint: Complaint) => {
    if (complaint.is_locked) {
      toast({
        title: "Complaint Locked",
        description: "This complaint is resolved and cannot be modified.",
        variant: "destructive",
      });
      return;
    }
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setStatusNote("");
    setShowStatusDialog(true);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-purple-600" />
            शिकायत प्रबंधन (Complaint Management)
          </h1>
          <p className="text-gray-600 mt-1">Manage and track all engineer complaints</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{stats.inProgress}</div>
            <div className="text-sm text-blue-600">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">{stats.underInvestigation}</div>
            <div className="text-sm text-purple-600">Investigating</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-700">{stats.review}</div>
            <div className="text-sm text-orange-600">Review</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{stats.resolved}</div>
            <div className="text-sm text-green-600">Resolved</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by ID, name, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Complaints Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Complaints ({filteredComplaints.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10 text-gray-500">Loading complaints...</div>
          ) : filteredComplaints.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No complaints found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Complaint ID</TableHead>
                    <TableHead>Engineer</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints.map((complaint) => (
                    <TableRow key={complaint.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono font-semibold text-purple-600">
                        {complaint.complaint_id}
                        {complaint.is_locked && (
                          <Lock className="inline-block w-3 h-3 ml-1 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{complaint.engineer_name}</div>
                          <div className="text-xs text-gray-500">{complaint.engineer_email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{complaint.subject}</TableCell>
                      <TableCell>{complaint.category || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(complaint.status)}>
                          {getStatusLabel(complaint.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(complaint.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedComplaint(complaint)}
                            className="gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                          {!complaint.is_locked && (
                            <Button
                              size="sm"
                              onClick={() => openStatusDialog(complaint)}
                              className="gap-1 bg-purple-600 hover:bg-purple-700"
                            >
                              Change Status
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Complaint Dialog */}
      <Dialog open={!!selectedComplaint && !showStatusDialog} onOpenChange={() => setSelectedComplaint(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              Complaint Details - {selectedComplaint?.complaint_id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedComplaint && (
            <div className="space-y-6">
              {/* Status & Lock Badge */}
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(selectedComplaint.status)}>
                  {getStatusLabel(selectedComplaint.status)}
                </Badge>
                {selectedComplaint.is_locked && (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="w-3 h-3" />
                    Locked
                  </Badge>
                )}
              </div>

              {/* Engineer Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-gray-700">Engineer Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 font-medium">{selectedComplaint.engineer_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 font-medium">{selectedComplaint.engineer_email || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Complaint Info */}
              <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-purple-700">Complaint Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Subject:</span>
                    <span className="ml-2 font-medium">{selectedComplaint.subject}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-2 font-medium">{selectedComplaint.category || '-'}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-gray-500 block mb-1">Description:</span>
                  <p className="text-gray-800 bg-white rounded p-3 border">
                    {selectedComplaint.description}
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium">
                    {new Date(selectedComplaint.created_at).toLocaleString('en-IN')}
                  </span>
                </div>
                {selectedComplaint.resolved_at && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-500">Resolved:</span>
                    <span className="font-medium">
                      {new Date(selectedComplaint.resolved_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              {/* Status History */}
              {selectedComplaint.status_history && selectedComplaint.status_history.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Status History
                  </h4>
                  <div className="space-y-3">
                    {selectedComplaint.status_history.map((history, index) => (
                      <div key={index} className="border-l-2 border-purple-200 pl-4 py-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(history.status)} variant="outline">
                            {getStatusLabel(history.status)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            by {history.changedByName}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(history.changedAt).toLocaleString('en-IN')}
                        </div>
                        {history.note && (
                          <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                            {history.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Latest Status Note */}
              {selectedComplaint.status_note && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Latest Note
                  </h4>
                  <p className="text-gray-700 mt-2">{selectedComplaint.status_note}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                {!selectedComplaint.is_locked && (
                  <Button 
                    onClick={() => {
                      setShowStatusDialog(true);
                      setNewStatus(selectedComplaint.status);
                      setStatusNote("");
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Change Status
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedComplaint(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Complaint Status</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Complaint ID</label>
              <Input value={selectedComplaint?.complaint_id || ''} disabled />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">New Status *</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newStatus === 'resolved' && (
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Once resolved, the complaint will be locked and cannot be changed.
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Status Note *</label>
              <Textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Enter notes about this status change..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStatusChange}
              disabled={!newStatus || !statusNote || updateStatusMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
