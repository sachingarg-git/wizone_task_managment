import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSqlConnectionSchema, type SqlConnection } from "@shared/schema";
import { z } from "zod";
import { 
  Plus, 
  Database, 
  TestTube, 
  Shield, 
  Globe, 
  Trash2, 
  Edit, 
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Server,
  Download,
  Sprout
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type SqlConnectionFormData = z.infer<typeof insertSqlConnectionSchema>;

export default function SqlConnectionsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<SqlConnection | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading } = useQuery<SqlConnection[]>({
    queryKey: ['/api/sql-connections'],
  });

  const createConnectionMutation = useMutation({
    mutationFn: (data: SqlConnectionFormData) =>
      apiRequest('POST', '/api/sql-connections', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sql-connections'] });
      setIsFormOpen(false);
      toast({
        title: "Success",
        description: "SQL connection created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create SQL connection",
        variant: "destructive",
      });
    },
  });

  const updateConnectionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SqlConnectionFormData> }) =>
      apiRequest('PUT', `/api/sql-connections/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sql-connections'] });
      setEditingConnection(null);
      toast({
        title: "Success",
        description: "SQL connection updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update SQL connection",
        variant: "destructive",
      });
    },
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest('DELETE', `/api/sql-connections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sql-connections'] });
      toast({
        title: "Success",
        description: "SQL connection deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete SQL connection",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/sql-connections/${id}/test`);
      return await response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sql-connections'] });
      toast({
        title: result.success ? "Success" : "Test Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to test SQL connection",
        variant: "destructive",
      });
    },
  });

  const migrateDatabaseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/sql-connections/${id}/migrate`);
      return await response.json();
    },
    onSuccess: (result) => {
      toast({
        title: result.success ? "Migration Success" : "Migration Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to run migration",
        variant: "destructive",
      });
    },
  });

  const seedDatabaseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/sql-connections/${id}/seed`);
      return await response.json();
    },
    onSuccess: (result) => {
      toast({
        title: result.success ? "Seed Success" : "Seed Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to seed data",
        variant: "destructive",
      });
    },
  });

  const form = useForm<SqlConnectionFormData>({
    resolver: zodResolver(insertSqlConnectionSchema),
    defaultValues: {
      name: "",
      description: "",
      host: "",
      port: 5432,
      database: "",
      username: "",
      password: "",
      connectionType: "postgresql",
      sslEnabled: false,
      isActive: true,
    },
  });

  const handleSubmit = (data: SqlConnectionFormData) => {
    if (editingConnection) {
      updateConnectionMutation.mutate({ id: editingConnection.id, data });
    } else {
      createConnectionMutation.mutate(data);
    }
  };

  const handleEdit = (connection: SqlConnection) => {
    setEditingConnection(connection);
    form.reset({
      name: connection.name,
      description: connection.description || "",
      host: connection.host,
      port: connection.port,
      database: (connection as any).database_name,
      username: connection.username,
      password: "", // Don't populate password for security
      connectionType: (connection as any).connection_type,
      sslEnabled: (connection as any).ssl_enabled || false,
      isActive: (connection as any).is_active,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (connection: SqlConnection) => {
    if (confirm(`Are you sure you want to delete "${connection.name}"?`)) {
      deleteConnectionMutation.mutate(connection.id);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Database className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Testing...</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SQL Connections</h1>
          <p className="text-gray-600">Manage external database connections</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingConnection(null);
                form.reset();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Connection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingConnection ? "Edit SQL Connection" : "Add SQL Connection"}
              </DialogTitle>
              <DialogDescription>
                Configure a new external database connection with secure credentials.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Connection Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Production Database" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Main production database for customer data..."
                          className="min-h-[60px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="connectionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Database Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select database type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="postgresql">PostgreSQL</SelectItem>
                          <SelectItem value="mysql">MySQL</SelectItem>
                          <SelectItem value="mssql">SQL Server</SelectItem>
                          <SelectItem value="sqlite">SQLite</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="host"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Host (Server:Port)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="For SQL Server: 14.102.70.90,1443 (comma format) | Others: localhost:5432"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="database"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Database Name</FormLabel>
                      <FormControl>
                        <Input placeholder="production_db" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="db_user" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder={editingConnection ? "Leave blank to keep current" : "Enter password"}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="sslEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Enable SSL
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Active
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createConnectionMutation.isPending || updateConnectionMutation.isPending}
                  >
                    {createConnectionMutation.isPending || updateConnectionMutation.isPending 
                      ? "Saving..." 
                      : editingConnection ? "Update" : "Create"
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Connections</p>
                <p className="text-2xl font-bold text-gray-900">
                  {connections?.length || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Connections</p>
                <p className="text-2xl font-bold text-gray-900">
                  {connections?.filter(c => c.isActive).length || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">SSL Enabled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {connections?.filter(c => (c as any).ssl_enabled).length || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Connected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {connections?.filter(c => (c as any).test_status === 'success' || (c as any).test_status === 'connected').length || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <Server className="w-5 h-5 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Database Connections</CardTitle>
          <CardDescription>
            Manage and test your external database connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading connections...</p>
            </div>
          ) : connections?.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Database</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SSL</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connections.map((connection: SqlConnection) => (
                    <TableRow key={connection.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{connection.name}</div>
                          {connection.description && (
                            <div className="text-sm text-gray-500 truncate max-w-[200px]">
                              {connection.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {connection.connectionType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{connection.host}</div>
                        </div>
                      </TableCell>
                      <TableCell>{connection.database}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon((connection as any).test_status || 'never_tested')}
                          {getStatusBadge((connection as any).test_status || 'never_tested')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(connection as any).ssl_enabled ? (
                          <Shield className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testConnectionMutation.mutate(connection.id)}
                            disabled={testConnectionMutation.isPending}
                            title="Test Connection"
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                          {((connection as any).test_status === 'success' || (connection as any).test_status === 'connected') && (connection as any).connection_type === 'mssql' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => migrateDatabaseMutation.mutate(connection.id)}
                                disabled={migrateDatabaseMutation.isPending}
                                title="Create Tables"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => seedDatabaseMutation.mutate(connection.id)}
                                disabled={seedDatabaseMutation.isPending}
                                title="Seed Data"
                                className="text-green-600 hover:text-green-700"
                              >
                                <Sprout className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(connection)}
                            title="Edit Connection"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(connection)}
                            disabled={deleteConnectionMutation.isPending}
                            title="Delete Connection"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No SQL connections configured yet</p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Connection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}