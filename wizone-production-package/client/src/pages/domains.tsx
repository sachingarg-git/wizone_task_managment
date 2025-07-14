import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Globe, Shield, Trash2, Edit, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

const domainFormSchema = z.object({
  domain: z.string().min(1, "Domain is required").regex(
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    "Please enter a valid domain name"
  ),
  customDomain: z.string().optional(),
  ssl: z.boolean().default(false),
  status: z.enum(["active", "pending", "inactive"]).default("pending"),
});

type DomainFormData = z.infer<typeof domainFormSchema>;

interface Domain {
  id: number;
  domain: string;
  customDomain?: string;
  ssl: boolean;
  status: "active" | "pending" | "inactive";
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DomainsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const { toast } = useToast();

  const { data: domains, isLoading } = useQuery({
    queryKey: ["/api/domains"],
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
        description: "Failed to load domains. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createDomainMutation = useMutation({
    mutationFn: async (data: DomainFormData) => {
      return await apiRequest("/api/domains", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      setIsFormOpen(false);
      setEditingDomain(null);
      toast({
        title: "Success",
        description: "Domain created successfully",
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
        description: "Failed to create domain. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateDomainMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: DomainFormData }) => {
      return await apiRequest(`/api/domains/${id}`, {
        method: "PUT",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      setIsFormOpen(false);
      setEditingDomain(null);
      toast({
        title: "Success",
        description: "Domain updated successfully",
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
        description: "Failed to update domain. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/domains/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      toast({
        title: "Success",
        description: "Domain deleted successfully",
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
        description: "Failed to delete domain. Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<DomainFormData>({
    resolver: zodResolver(domainFormSchema),
    defaultValues: {
      domain: "",
      customDomain: "",
      ssl: false,
      status: "pending",
    },
  });

  const onSubmit = (data: DomainFormData) => {
    if (editingDomain) {
      updateDomainMutation.mutate({ id: editingDomain.id, data });
    } else {
      createDomainMutation.mutate(data);
    }
  };

  const handleEdit = (domain: Domain) => {
    setEditingDomain(domain);
    form.reset({
      domain: domain.domain,
      customDomain: domain.customDomain || "",
      ssl: domain.ssl,
      status: domain.status,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this domain?")) {
      deleteDomainMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success/10 text-success";
      case "pending": return "bg-warning/10 text-warning";
      case "inactive": return "bg-error/10 text-error";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Shield className="w-4 h-4" />;
      case "pending": return <AlertCircle className="w-4 h-4" />;
      case "inactive": return <Globe className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Domain Management</h1>
          <p className="text-gray-600">Configure custom domains for your application hosting</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingDomain(null);
              form.reset({
                domain: "",
                customDomain: "",
                ssl: false,
                status: "pending",
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingDomain ? "Edit Domain" : "Add New Domain"}
              </DialogTitle>
              <DialogDescription>
                Configure a custom domain for your application hosting.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customDomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Domain (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="app.example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ssl"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          SSL Certificate
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable HTTPS for this domain
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createDomainMutation.isPending || updateDomainMutation.isPending}
                  >
                    {editingDomain ? "Update" : "Create"} Domain
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Domain Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Domains</p>
                <p className="text-2xl font-bold text-gray-900">
                  {domains?.length || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Domains</p>
                <p className="text-2xl font-bold text-gray-900">
                  {domains?.filter(d => d.status === 'active').length || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-success" />
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
                  {domains?.filter(d => d.ssl).length || 0}
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
                <p className="text-sm font-medium text-gray-600">Pending Setup</p>
                <p className="text-2xl font-bold text-gray-900">
                  {domains?.filter(d => d.status === 'pending').length || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domains Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Domains</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading domains...</p>
            </div>
          ) : domains && domains.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Custom Domain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SSL</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((domain) => (
                    <TableRow key={domain.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(domain.status)}
                          <span>{domain.domain}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {domain.customDomain || (
                          <span className="text-gray-400">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(domain.status)}>
                          {domain.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {domain.ssl ? (
                          <Badge className="bg-success/10 text-success">
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Disabled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(domain.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(domain)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(domain.id)}
                            disabled={deleteDomainMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
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
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No domains configured yet</p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Domain
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}