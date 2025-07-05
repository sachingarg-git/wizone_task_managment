import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import UserFormModal from "@/components/modals/user-form-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  UserPlus, 
  Search, 
  Shield, 
  Users, 
  UserCheck, 
  UserX,
  Eye,
  Edit,
  Ban,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      await apiRequest("PUT", `/api/users/${id}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const usersArray = Array.isArray(users) ? users : [];
  
  const filteredUsers = usersArray.filter((user: any) => {
    const matchesSearch = !searchQuery || 
      `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const totalUsers = usersArray.length;
  const activeUsers = usersArray.filter((u: any) => u.isActive).length;
  const adminUsers = usersArray.filter((u: any) => u.role === 'admin').length;
  const pendingUsers = Math.floor(totalUsers * 0.05); // Mock calculation

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-error/10 text-error';
      case 'manager': return 'bg-purple-100 text-purple-800';
      case 'engineer': return 'bg-primary/10 text-primary';
      case 'backend_engineer': return 'bg-blue-100 text-blue-800';
      case 'field_engineer': return 'bg-green-100 text-green-800';
      case 'support': return 'bg-success/10 text-success';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPerformanceScore = (user: any) => {
    const latestMetrics = user.performanceMetrics?.[0];
    return latestMetrics?.performanceScore ? parseFloat(latestMetrics.performanceScore) : 0;
  };

  const getLastActive = (user: any) => {
    // Mock last active calculation
    const hours = Math.floor(Math.random() * 24);
    if (hours === 0) return "Online now";
    if (hours === 1) return "1 hour ago";
    return `${hours} hours ago`;
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ id: userId, role: newRole });
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setShowEditUser(true);
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="User Management"
        subtitle="Manage system users and their permissions"
      >
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => setShowRoleManagement(true)}>
            <Shield className="w-4 h-4 mr-2" />
            Manage Roles
          </Button>
          <Button onClick={() => setShowAddUserModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </Header>
      
      <div className="p-6 space-y-8">
        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                </div>
                <Users className="w-5 h-5 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Today</p>
                  <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
                </div>
                <UserCheck className="w-5 h-5 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Administrators</p>
                  <p className="text-2xl font-bold text-gray-900">{adminUsers}</p>
                </div>
                <Shield className="w-5 h-5 text-warning" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingUsers}</p>
                </div>
                <UserX className="w-5 h-5 text-error" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <CardTitle>System Users</CardTitle>
              <div className="flex space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="engineer">Engineer</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => {
                      const performanceScore = getPerformanceScore(user);
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              {user.profileImageUrl ? (
                                <img 
                                  src={user.profileImageUrl} 
                                  alt={`${user.firstName} ${user.lastName}`}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-600">
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                  </span>
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={user.role} 
                              onValueChange={(value) => handleRoleChange(user.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <Badge className={getRoleColor(user.role)}>
                                  {user.role === 'backend_engineer' ? 'Backend Engineer' : 
                                   user.role === 'field_engineer' ? 'Field Engineer' : 
                                   user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrator</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="engineer">Engineer</SelectItem>
                                <SelectItem value="backend_engineer">Backend Engineer</SelectItem>
                                <SelectItem value="field_engineer">Field Engineer</SelectItem>
                                <SelectItem value="support">Support</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{user.department || 'Unassigned'}</TableCell>
                          <TableCell className="text-sm text-gray-500">{getLastActive(user)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-success h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${Math.min(performanceScore, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-900">{performanceScore.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={user.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleViewUser(user)}
                                title="View User Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditUser(user)}
                                title="Edit User"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-error hover:text-error"
                                title="Deactivate User"
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No users found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add User Modal */}
      <UserFormModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
      />

      {/* User Details Modal */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>User Details</DialogTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowUserDetails(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* User Profile */}
              <div className="flex items-center space-x-4">
                {selectedUser.profileImageUrl ? (
                  <img 
                    src={selectedUser.profileImageUrl} 
                    alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-600">
                      {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <Badge className={getRoleColor(selectedUser.role)}>
                    {selectedUser.role === 'backend_engineer' ? 'Backend Engineer' : 
                     selectedUser.role === 'field_engineer' ? 'Field Engineer' : 
                     selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                  </Badge>
                </div>
              </div>

              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Contact Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Email</span>
                      <p className="text-gray-900">{selectedUser.email}</p>
                    </div>
                    {selectedUser.phone && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Phone</span>
                        <p className="text-gray-900">{selectedUser.phone}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-500">Department</span>
                      <p className="text-gray-900">{selectedUser.department || 'Not assigned'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">System Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">User ID</span>
                      <p className="text-gray-900 font-mono text-sm">{selectedUser.id}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Status</span>
                      <div>
                        <Badge className={selectedUser.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}>
                          {selectedUser.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Last Active</span>
                      <p className="text-gray-900">{getLastActive(selectedUser)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Performance Score</span>
                      <p className="text-gray-900">{getPerformanceScore(selectedUser).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowUserDetails(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setShowUserDetails(false);
                  handleEditUser(selectedUser);
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Edit User</DialogTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowEditUser(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          {selectedUser && (
            <div className="p-4">
              <div className="text-center text-gray-600">
                <p>User editing functionality will be implemented here.</p>
                <p className="text-sm mt-2">Currently, you can modify user roles directly from the table dropdown.</p>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" onClick={() => setShowEditUser(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Role Management Modal */}
      <Dialog open={showRoleManagement} onOpenChange={setShowRoleManagement}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Role Management</DialogTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowRoleManagement(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="p-4">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Available Roles</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-red-700">Admin</span>
                      <p className="text-sm text-gray-600">Full system access, user management</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Highest</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-purple-700">Manager</span>
                      <p className="text-sm text-gray-600">Task oversight, performance tracking</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">High</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-blue-700">Engineer</span>
                      <p className="text-sm text-gray-600">Task execution, customer interaction</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Standard</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-indigo-700">Backend Engineer</span>
                      <p className="text-sm text-gray-600">Backend systems, API development</p>
                    </div>
                    <Badge className="bg-indigo-100 text-indigo-800">Technical</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-emerald-700">Field Engineer</span>
                      <p className="text-sm text-gray-600">On-site installations, field work</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800">Field</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-green-700">Support</span>
                      <p className="text-sm text-gray-600">Customer support, basic tasks</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Basic</Badge>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> You can change user roles directly from the users table using the dropdown in the "Role" column.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowRoleManagement(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
