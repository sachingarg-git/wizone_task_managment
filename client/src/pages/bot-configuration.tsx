import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Bot, 
  MessageSquare, 
  Phone, 
  Link, 
  Settings, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Edit,
  Trash2,
  Bell,
  Send,
  Loader2,
  Globe,
  Smartphone,
  Webhook,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

export default function BotConfiguration() {
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [formData, setFormData] = useState({
    configName: "",
    botType: "telegram",
    isActive: true,
    
    // Notification events
    notifyOnTaskCreate: true,
    notifyOnTaskUpdate: true,
    notifyOnTaskComplete: true,
    notifyOnTaskAssign: true,
    notifyOnTaskStatusChange: true,
    notifyOnHighPriority: true,
    
    // Telegram
    telegramBotToken: "",
    telegramChatId: "",
    telegramParseMode: "HTML",
    
    // WhatsApp
    whatsappApiUrl: "",
    whatsappApiKey: "",
    whatsappPhoneNumber: "",
    whatsappBusinessId: "",
    
    // Webhook
    webhookUrl: "",
    webhookMethod: "POST",
    webhookAuth: "",
    webhookHeaders: {},
    
    // Notification Settings
    notifyOnTaskCreate: true,
    notifyOnTaskUpdate: true,
    notifyOnTaskComplete: true,
    notifyOnTaskAssign: true,
    notifyOnTaskStatusChange: true,
    notifyOnHighPriority: true,
    
    // Templates - Enhanced for automatic notifications
    taskCreateTemplate: "🆕 New Task Created - Wizone IT Support\n\n📋 Task ID: {taskNumber}\n👤 Customer: {customerName}\n📧 Email: {customerEmail}\n📱 Contact: {customerPhone}\n⚡ Priority: {priority}\n📝 Description: {description}\n👷 Assigned to: {assignedTo}\n🏢 Department: {department}\n📅 Created: {createdAt}\n\n🔗 View Task: {taskUrl}",
    taskUpdateTemplate: "📝 Task Updated - Wizone IT Support\n\n📋 Task ID: {taskNumber}\n👤 Customer: {customerName}\n🔄 Status: {status}\n💬 Latest Notes: {notes}\n👷 Updated by: {updatedBy}\n📅 Updated: {updatedAt}\n\n🔗 View Task: {taskUrl}",
    taskCompleteTemplate: "✅ Task Completed - Wizone IT Support\n\n📋 Task ID: {taskNumber}\n👤 Customer: {customerName}\n⏱️ Duration: {duration}\n✅ Completed by: {completedBy}\n📝 Resolution: {resolution}\n📅 Completed: {completedAt}\n\n🎉 Task successfully resolved!",
    taskAssignTemplate: "👷 Task Assigned - Wizone IT Support\n\n📋 Task ID: {taskNumber}\n👤 Customer: {customerName}\n⚡ Priority: {priority}\n👷 Assigned to: {assignedTo}\n🏢 Department: {department}\n📅 Assigned: {assignedAt}\n\n📝 Description: {description}\n🔗 View Task: {taskUrl}",
    statusChangeTemplate: "🔄 Status Changed - Wizone IT Support\n\n📋 Task ID: {taskNumber}\n👤 Customer: {customerName}\n📊 Status: {oldStatus} → {newStatus}\n👷 Updated by: {updatedBy}\n📅 Changed: {changedAt}\n💬 Notes: {notes}\n\n🔗 View Task: {taskUrl}",
    
    // Filtering
    filterByPriority: ["high", "medium", "low"],
    filterByStatus: ["pending", "in_progress", "completed"],
    filterByDepartment: [],
    filterByUser: [],
    
    // Rate limiting
    maxNotificationsPerHour: 100,
    retryCount: 3,
    retryDelay: 5,
    
    testMessage: "🔧 Wizone IT Support Portal - Bot Configuration Test"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: botConfigs, isLoading, error } = useQuery({
    queryKey: ["/api/bot-configurations"],
    queryFn: async () => {
      const response = await fetch("/api/bot-configurations");
      if (!response.ok) throw new Error("Failed to fetch bot configurations");
      return response.json();
    },
  });

  const { data: notificationLogs } = useQuery({
    queryKey: ["/api/notification-logs"],
    queryFn: async () => {
      const response = await fetch("/api/notification-logs");
      if (!response.ok) throw new Error("Failed to fetch notification logs");
      return response.json();
    },
  });

  const createConfigMutation = useMutation({
    mutationFn: async (configData: any) => {
      await apiRequest("POST", "/api/bot-configurations", configData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot-configurations"] });
      setShowConfigForm(false);
      resetForm();
      toast({
        title: "Success",
        description: "Bot configuration created successfully",
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
        description: "Failed to create bot configuration",
        variant: "destructive",
      });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PUT", `/api/bot-configurations/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot-configurations"] });
      setSelectedConfig(null);
      setShowConfigForm(false);
      resetForm();
      toast({
        title: "Success",
        description: "Bot configuration updated successfully",
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
        description: "Failed to update bot configuration",
        variant: "destructive",
      });
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/bot-configurations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot-configurations"] });
      toast({
        title: "Success",
        description: "Bot configuration deleted successfully",
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
        description: "Failed to delete bot configuration",
        variant: "destructive",
      });
    },
  });

  const testConfigMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/bot-configurations/${id}/test`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to test bot configuration");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot-configurations"] });
      toast({
        title: data.success ? "Test Successful" : "Test Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to test bot configuration",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      configName: "",
      botType: "telegram",
      isActive: true,
      telegramBotToken: "",
      telegramChatId: "",
      telegramParseMode: "HTML",
      whatsappApiUrl: "",
      whatsappApiKey: "",
      whatsappPhoneNumber: "",
      whatsappBusinessId: "",
      webhookUrl: "",
      webhookMethod: "POST",
      webhookAuth: "",
      webhookHeaders: {},
      notifyOnTaskCreate: true,
      notifyOnTaskUpdate: true,
      notifyOnTaskComplete: true,
      notifyOnTaskAssign: true,
      notifyOnTaskStatusChange: true,
      notifyOnHighPriority: true,
      taskCreateTemplate: "🆕 New Task Created\n\n📋 Task: {taskNumber}\n👤 Customer: {customerName}\n⚡ Priority: {priority}\n📝 Description: {description}\n👷 Assigned to: {assignedTo}",
      taskUpdateTemplate: "📝 Task Updated\n\n📋 Task: {taskNumber}\n👤 Customer: {customerName}\n🔄 Status: {status}\n💬 Notes: {notes}",
      taskCompleteTemplate: "✅ Task Completed\n\n📋 Task: {taskNumber}\n👤 Customer: {customerName}\n⏱️ Duration: {duration}\n✅ Completed by: {completedBy}",
      taskAssignTemplate: "👷 Task Assigned\n\n📋 Task: {taskNumber}\n👤 Customer: {customerName}\n⚡ Priority: {priority}\n👷 Assigned to: {assignedTo}",
      statusChangeTemplate: "🔄 Status Changed\n\n📋 Task: {taskNumber}\n👤 Customer: {customerName}\n📊 From: {oldStatus} → {newStatus}\n👷 Updated by: {updatedBy}",
      filterByPriority: ["high", "medium", "low"],
      filterByStatus: ["pending", "in_progress", "completed"],
      filterByDepartment: [],
      filterByUser: [],
      maxNotificationsPerHour: 100,
      retryCount: 3,
      retryDelay: 5,
      testMessage: "🔧 Wizone IT Support Portal - Bot Configuration Test"
    });
  };

  const handleEdit = (config: any) => {
    console.log("Editing config:", config); // Debug log
    setSelectedConfig(config);
    setFormData({
      configName: config.configName || "",
      botType: config.botType || "telegram",
      isActive: config.isActive ?? true,
      telegramBotToken: config.telegramBotToken || "",
      telegramChatId: config.telegramChatId || "",
      telegramParseMode: config.telegramParseMode || "HTML",
      whatsappApiUrl: config.whatsappApiUrl || "",
      whatsappApiKey: config.whatsappApiKey || "",
      whatsappPhoneNumber: config.whatsappPhoneNumber || "",
      whatsappBusinessId: config.whatsappBusinessId || "",
      webhookUrl: config.webhookUrl || "",
      webhookMethod: config.webhookMethod || "POST",
      webhookAuth: config.webhookAuth || "",
      webhookHeaders: config.webhookHeaders || {},
      notifyOnTaskCreate: config.notifyOnTaskCreate ?? true,
      notifyOnTaskUpdate: config.notifyOnTaskUpdate ?? true,
      notifyOnTaskComplete: config.notifyOnTaskComplete ?? true,
      notifyOnTaskAssign: config.notifyOnTaskAssign ?? true,
      notifyOnTaskStatusChange: config.notifyOnTaskStatusChange ?? true,
      notifyOnHighPriority: config.notifyOnHighPriority ?? true,
      taskCreateTemplate: config.taskCreateTemplate || "🆕 New Task Created\n\n📋 Task: {taskNumber}\n👤 Customer: {customerName}\n⚡ Priority: {priority}\n📝 Description: {description}\n👷 Assigned to: {assignedTo}",
      taskUpdateTemplate: config.taskUpdateTemplate || "📝 Task Updated\n\n📋 Task: {taskNumber}\n👤 Customer: {customerName}\n🔄 Status: {status}\n💬 Notes: {notes}",
      taskCompleteTemplate: config.taskCompleteTemplate || "✅ Task Completed\n\n📋 Task: {taskNumber}\n👤 Customer: {customerName}\n⏱️ Duration: {duration}\n✅ Completed by: {completedBy}",
      taskAssignTemplate: config.taskAssignTemplate || "👷 Task Assigned\n\n📋 Task: {taskNumber}\n👤 Customer: {customerName}\n⚡ Priority: {priority}\n👷 Assigned to: {assignedTo}",
      statusChangeTemplate: config.statusChangeTemplate || "🔄 Status Changed\n\n📋 Task: {taskNumber}\n👤 Customer: {customerName}\n📊 From: {oldStatus} → {newStatus}\n👷 Updated by: {updatedBy}",
      filterByPriority: config.filterByPriority || ["high", "medium", "low"],
      filterByStatus: config.filterByStatus || ["pending", "in_progress", "completed"],
      filterByDepartment: config.filterByDepartment || [],
      filterByUser: config.filterByUser || [],
      maxNotificationsPerHour: config.maxNotificationsPerHour || 100,
      retryCount: config.retryCount || 3,
      retryDelay: config.retryDelay || 5,
      testMessage: config.testMessage || "🔧 Wizone IT Support Portal - Bot Configuration Test"
    });
    setShowConfigForm(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete the bot configuration "${name}"? This action cannot be undone.`)) {
      deleteConfigMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Telegram-specific fields
    if (formData.botType === 'telegram') {
      if (!formData.telegramBotToken) {
        toast({
          title: "Validation Error",
          description: "Telegram Bot Token is required for Telegram configuration",
          variant: "destructive",
        });
        return;
      }
      if (!formData.telegramChatId) {
        toast({
          title: "Validation Error", 
          description: "Chat ID is required for Telegram notifications to work",
          variant: "destructive",
        });
        return;
      }
      if (!/^-?\d+$/.test(formData.telegramChatId)) {
        toast({
          title: "Validation Error",
          description: "Chat ID must be numeric (e.g., -1001234567890 or 123456789)",
          variant: "destructive",
        });
        return;
      }
    }
    
    console.log("Submitting form data:", formData);
    
    if (selectedConfig) {
      updateConfigMutation.mutate({ id: selectedConfig.id, data: formData });
    } else {
      createConfigMutation.mutate(formData);
    }
  };

  const getBotTypeIcon = (botType: string) => {
    switch (botType) {
      case 'telegram':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'whatsapp':
        return <Phone className="w-4 h-4 text-green-500" />;
      case 'webhook':
        return <Link className="w-4 h-4 text-purple-500" />;
      default:
        return <Bot className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (lastTestResult: string) => {
    switch (lastTestResult) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Working</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Testing</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="w-3 h-3 mr-1" />Not Tested</Badge>;
    }
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString();
  };

  // Add error boundary for debugging
  if (error) {
    console.error("Bot configuration error:", error);
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Bot Configuration</h2>
          <p className="text-gray-600">{error.message}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bot configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Header 
        title="Bot Configuration"
        subtitle="Configure notification bots for Telegram, WhatsApp, and webhooks"
        actions={
          <div className="flex space-x-3">
            <Button onClick={() => {
              setSelectedConfig(null);
              resetForm();
              setFormData(prev => ({ ...prev, botType: "telegram" }));
              setShowConfigForm(true);
            }}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Add Telegram Bot
            </Button>
            <Button onClick={() => {
              setSelectedConfig(null);
              resetForm();
              setFormData(prev => ({ ...prev, botType: "webhook" }));
              setShowConfigForm(true);
            }} variant="outline">
              <Webhook className="w-4 h-4 mr-2" />
              Add Webhook Config
            </Button>
            <Button onClick={() => {
              setSelectedConfig(null);
              resetForm();
              setShowConfigForm(true);
            }} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Bot Configuration
            </Button>
          </div>
        }
      />

      <Dialog open={showConfigForm} onOpenChange={setShowConfigForm}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>
              {selectedConfig ? 'Edit Bot Configuration' : 'Add New Bot Configuration'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                <TabsTrigger value="config">Bot Configuration</TabsTrigger>
                <TabsTrigger value="templates">Message Templates</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="configName">Configuration Name</Label>
                        <Input
                          id="configName"
                          placeholder="e.g., Main Telegram Bot"
                          value={formData.configName}
                          onChange={(e) => setFormData({ ...formData, configName: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="botType">Bot Type</Label>
                        <Select value={formData.botType} onValueChange={(value) => {
                          console.log("Bot type changed to:", value);
                          setFormData({ ...formData, botType: value });
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select bot type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="telegram">
                              <div className="flex items-center">
                                <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                                Telegram
                              </div>
                            </SelectItem>
                            <SelectItem value="whatsapp">
                              <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-2 text-green-500" />
                                WhatsApp
                              </div>
                            </SelectItem>
                            <SelectItem value="webhook">
                              <div className="flex items-center">
                                <Link className="w-4 h-4 mr-2 text-purple-500" />
                                Custom Webhook
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Notification Events</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="notifyOnTaskCreate"
                            checked={formData.notifyOnTaskCreate}
                            onCheckedChange={(checked) => setFormData({ ...formData, notifyOnTaskCreate: checked })}
                          />
                          <Label htmlFor="notifyOnTaskCreate">Task Created</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="notifyOnTaskUpdate"
                            checked={formData.notifyOnTaskUpdate}
                            onCheckedChange={(checked) => setFormData({ ...formData, notifyOnTaskUpdate: checked })}
                          />
                          <Label htmlFor="notifyOnTaskUpdate">Task Updated</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="notifyOnTaskComplete"
                            checked={formData.notifyOnTaskComplete}
                            onCheckedChange={(checked) => setFormData({ ...formData, notifyOnTaskComplete: checked })}
                          />
                          <Label htmlFor="notifyOnTaskComplete">Task Completed</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="notifyOnTaskAssign"
                            checked={formData.notifyOnTaskAssign}
                            onCheckedChange={(checked) => setFormData({ ...formData, notifyOnTaskAssign: checked })}
                          />
                          <Label htmlFor="notifyOnTaskAssign">Task Assigned</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="notifyOnTaskStatusChange"
                            checked={formData.notifyOnTaskStatusChange}
                            onCheckedChange={(checked) => setFormData({ ...formData, notifyOnTaskStatusChange: checked })}
                          />
                          <Label htmlFor="notifyOnTaskStatusChange">Status Changed</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="notifyOnHighPriority"
                            checked={formData.notifyOnHighPriority}
                            onCheckedChange={(checked) => setFormData({ ...formData, notifyOnHighPriority: checked })}
                          />
                          <Label htmlFor="notifyOnHighPriority">High Priority Tasks</Label>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="config" className="space-y-4">
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Current bot type: <span className="font-medium">{formData.botType}</span>
                      </p>
                    </div>
                    {formData.botType === 'telegram' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center">
                          <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
                          Telegram Bot Configuration
                        </h3>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How to get Bot Token:</h4>
                          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            <li>1. Message @BotFather on Telegram</li>
                            <li>2. Send /newbot and follow instructions</li>
                            <li>3. Copy the token (format: 123456789:ABCdefGHI...)</li>
                            <li>4. For Chat ID: Add bot to group or get your chat ID from @userinfobot</li>
                          </ol>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="telegramBotToken">Bot Token</Label>
                            <Input
                              id="telegramBotToken"
                              type="password"
                              placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxyz"
                              value={formData.telegramBotToken}
                              onChange={(e) => setFormData({ ...formData, telegramBotToken: e.target.value })}
                              className={
                                formData.telegramBotToken && !/^\d{8,10}:[A-Za-z0-9_-]{35}$/.test(formData.telegramBotToken)
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                            {formData.telegramBotToken && !/^\d{8,10}:[A-Za-z0-9_-]{35}$/.test(formData.telegramBotToken) && (
                              <p className="text-sm text-red-500 mt-1">
                                Invalid token format. Expected: 123456789:ABCdefGHIjklMNOpqrSTUvwxyz
                              </p>
                            )}
                          </div>
                        <div>
                          <Label htmlFor="telegramChatId" className="text-base font-semibold text-red-600 dark:text-red-400">
                            Chat ID (Required) *
                          </Label>
                          <Input
                            id="telegramChatId"
                            placeholder="-1001234567890 (group) or 123456789 (private)"
                            value={formData.telegramChatId}
                            onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
                            className={
                              !formData.telegramChatId || (formData.telegramChatId && !/^-?\d+$/.test(formData.telegramChatId))
                                ? "border-red-500 border-2"
                                : "border-green-500 border-2"
                            }
                            data-testid="telegram-chat-id"
                            required
                          />
                          {!formData.telegramChatId && (
                            <p className="text-sm text-red-600 mt-1 font-medium">
                              ⚠️ Chat ID is required for Telegram notifications to work!
                            </p>
                          )}
                          {formData.telegramChatId && !/^-?\d+$/.test(formData.telegramChatId) && (
                            <p className="text-sm text-red-500 mt-1">
                              Chat ID must be numeric (e.g., -1001234567890 or 123456789)
                            </p>
                          )}
                          {formData.telegramChatId && /^-?\d+$/.test(formData.telegramChatId) && (
                            <p className="text-sm text-green-600 mt-1">
                              ✅ Valid Chat ID format
                            </p>
                          )}
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 mt-2">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              <strong>How to get Chat ID:</strong><br/>
                              • For private chat: Message @userinfobot and copy your ID<br/>
                              • For groups: Add bot to group, then use @userinfobot to get group ID<br/>
                              • Group IDs start with -100 (e.g., -1001234567890)
                            </p>
                          </div>
                        </div>
                        </div>
                        <div>
                          <Label htmlFor="telegramParseMode">Parse Mode</Label>
                          <Select value={formData.telegramParseMode} onValueChange={(value) => setFormData({ ...formData, telegramParseMode: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HTML">HTML</SelectItem>
                              <SelectItem value="Markdown">Markdown</SelectItem>
                              <SelectItem value="MarkdownV2">MarkdownV2</SelectItem>
                              <SelectItem value="">None (Plain Text)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                    
                    {formData.botType === 'whatsapp' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center">
                          <Phone className="w-5 h-5 mr-2 text-green-500" />
                          WhatsApp API Configuration
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="whatsappApiUrl">API URL</Label>
                            <Input
                              id="whatsappApiUrl"
                              placeholder="https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages"
                              value={formData.whatsappApiUrl}
                              onChange={(e) => setFormData({ ...formData, whatsappApiUrl: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="whatsappApiKey">API Key</Label>
                            <Input
                              id="whatsappApiKey"
                              type="password"
                              placeholder="EAAxxxxxx..."
                              value={formData.whatsappApiKey}
                              onChange={(e) => setFormData({ ...formData, whatsappApiKey: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="whatsappPhoneNumber">Phone Number</Label>
                            <Input
                              id="whatsappPhoneNumber"
                              placeholder="91XXXXXXXXXX"
                              value={formData.whatsappPhoneNumber}
                              onChange={(e) => setFormData({ ...formData, whatsappPhoneNumber: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="whatsappBusinessId">Business ID</Label>
                            <Input
                              id="whatsappBusinessId"
                              placeholder="Your WhatsApp Business ID"
                              value={formData.whatsappBusinessId}
                              onChange={(e) => setFormData({ ...formData, whatsappBusinessId: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {formData.botType === 'webhook' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center">
                          <Link className="w-5 h-5 mr-2 text-purple-500" />
                          Custom Webhook Configuration
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="webhookUrl">Webhook URL</Label>
                            <Input
                              id="webhookUrl"
                              placeholder="https://your-webhook-url.com/notifications"
                              value={formData.webhookUrl}
                              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="webhookMethod">HTTP Method</Label>
                            <Select value={formData.webhookMethod} onValueChange={(value) => setFormData({ ...formData, webhookMethod: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="POST">POST</SelectItem>
                                <SelectItem value="GET">GET</SelectItem>
                                <SelectItem value="PUT">PUT</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="webhookAuth">Authorization Token</Label>
                          <Input
                            id="webhookAuth"
                            type="password"
                            placeholder="Bearer token or API key"
                            value={formData.webhookAuth}
                            onChange={(e) => setFormData({ ...formData, webhookAuth: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="templates" className="space-y-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Message Templates</h3>
                      <p className="text-sm text-gray-600">
                        Use variables like {"{taskNumber}"}, {"{customerName}"}, {"{priority}"}, {"{status}"}, {"{assignedTo}"}, etc.
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="taskCreateTemplate">Task Created Template</Label>
                          <Textarea
                            id="taskCreateTemplate"
                            rows={3}
                            value={formData.taskCreateTemplate}
                            onChange={(e) => setFormData({ ...formData, taskCreateTemplate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="taskUpdateTemplate">Task Updated Template</Label>
                          <Textarea
                            id="taskUpdateTemplate"
                            rows={3}
                            value={formData.taskUpdateTemplate}
                            onChange={(e) => setFormData({ ...formData, taskUpdateTemplate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="taskCompleteTemplate">Task Completed Template</Label>
                          <Textarea
                            id="taskCompleteTemplate"
                            rows={3}
                            value={formData.taskCompleteTemplate}
                            onChange={(e) => setFormData({ ...formData, taskCompleteTemplate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="taskAssignTemplate">Task Assigned Template</Label>
                          <Textarea
                            id="taskAssignTemplate"
                            rows={3}
                            value={formData.taskAssignTemplate}
                            onChange={(e) => setFormData({ ...formData, taskAssignTemplate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="statusChangeTemplate">Status Changed Template</Label>
                          <Textarea
                            id="statusChangeTemplate"
                            rows={3}
                            value={formData.statusChangeTemplate}
                            onChange={(e) => setFormData({ ...formData, statusChangeTemplate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="space-y-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Advanced Settings</h3>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="maxNotificationsPerHour">Max Notifications/Hour</Label>
                          <Input
                            id="maxNotificationsPerHour"
                            type="number"
                            value={formData.maxNotificationsPerHour}
                            onChange={(e) => setFormData({ ...formData, maxNotificationsPerHour: parseInt(e.target.value) || 100 })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="retryCount">Retry Count</Label>
                          <Input
                            id="retryCount"
                            type="number"
                            value={formData.retryCount}
                            onChange={(e) => setFormData({ ...formData, retryCount: parseInt(e.target.value) || 3 })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="retryDelay">Retry Delay (seconds)</Label>
                          <Input
                            id="retryDelay"
                            type="number"
                            value={formData.retryDelay}
                            onChange={(e) => setFormData({ ...formData, retryDelay: parseInt(e.target.value) || 5 })}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="testMessage">Test Message</Label>
                        <Textarea
                          id="testMessage"
                          rows={2}
                          value={formData.testMessage}
                          onChange={(e) => setFormData({ ...formData, testMessage: e.target.value })}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowConfigForm(false);
                      setSelectedConfig(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createConfigMutation.isPending || updateConfigMutation.isPending}
                  >
                    {createConfigMutation.isPending || updateConfigMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {selectedConfig ? 'Update' : 'Create'} Configuration
                  </Button>
                </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics Cards */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Configurations</p>
                    <p className="text-2xl font-bold">{botConfigs?.length || 0}</p>
                  </div>
                  <Bot className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Bots</p>
                    <p className="text-2xl font-bold">{botConfigs?.filter((c: any) => c.isActive).length || 0}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Working Bots</p>
                    <p className="text-2xl font-bold">{botConfigs?.filter((c: any) => c.lastTestResult === 'success').length || 0}</p>
                  </div>
                  <TestTube className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Notifications Sent</p>
                    <p className="text-2xl font-bold">{notificationLogs?.filter((log: any) => log.status === 'sent').length || 0}</p>
                  </div>
                  <Bell className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bot Configurations Table */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Bot Configurations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Test Result</TableHead>
                      <TableHead>Last Test</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {botConfigs?.map((config: any) => (
                      <TableRow key={config.id}>
                        <TableCell className="font-medium">{config.configName}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getBotTypeIcon(config.botType)}
                            <span className="ml-2 capitalize">{config.botType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={config.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {config.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(config.lastTestResult)}
                        </TableCell>
                        <TableCell>
                          {config.lastTestTime ? formatDateTime(config.lastTestTime) : 'Never'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => testConfigMutation.mutate(config.id)}
                              disabled={testConfigMutation.isPending}
                              title="Test Configuration"
                            >
                              {testConfigMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <TestTube className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(config)}
                              title="Edit Configuration"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(config.id, config.configName)}
                              title="Delete Configuration"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}