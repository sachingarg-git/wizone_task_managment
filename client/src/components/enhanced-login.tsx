import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User, Lock, Smartphone, Monitor, Loader2, CheckCircle, Shield, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface EnhancedLoginPageProps {
  onAdminLogin: (user: any) => void;
  onCustomerLogin: (customer: any) => void;
}

export default function EnhancedLoginPage({ onAdminLogin, onCustomerLogin }: EnhancedLoginPageProps) {
  const [loginType, setLoginType] = useState<'admin' | 'customer'>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Check if we're in mobile webview
  const isMobileWebView = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) || 
                          window.location.search.includes('mobile=true');

  const adminLoginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      setIsConnecting(true);
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response;
    },
    onSuccess: (user: any) => {
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.firstName || ''} ${user.lastName || ''}`,
      });
      onAdminLogin(user);
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsConnecting(false);
    }
  });

  const customerLoginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      setIsConnecting(true);
      const response = await apiRequest("POST", "/api/customer-portal/auth/login", data);
      return response;
    },
    onSuccess: (customer: any) => {
      toast({
        title: "Customer Login Successful",
        description: `Welcome, ${customer.name || 'Customer'}`,
      });
      onCustomerLogin(customer);
    },
    onError: (error: any) => {
      toast({
        title: "Customer Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsConnecting(false);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username.trim() || !credentials.password.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    if (loginType === 'admin') {
      adminLoginMutation.mutate(credentials);
    } else {
      customerLoginMutation.mutate(credentials);
    }
  };

  const isLoading = adminLoginMutation.isPending || customerLoginMutation.isPending || isConnecting;

  // Quick login for development/demo
  const quickLogin = (type: 'admin' | 'demo') => {
    if (type === 'admin') {
      setCredentials({ username: 'admin', password: 'admin123' });
      setLoginType('admin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
            <span className="text-white text-2xl font-bold">W</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isMobileWebView ? 'Wizone Mobile' : 'Wizone Task Manager'}
            </h1>
            <p className="text-purple-200">
              {isMobileWebView ? 'Field Engineer Portal' : 'Professional Task Management System'}
            </p>
          </div>
          
          {/* Platform Indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-purple-300">
            {isMobileWebView ? (
              <>
                <Smartphone className="w-4 h-4" />
                <span>Mobile Optimized</span>
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4" />
                <span>Desktop Version</span>
              </>
            )}
          </div>
        </div>

        {/* Enhanced Login Card */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center space-x-1">
              <Button
                variant={loginType === 'admin' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLoginType('admin')}
                className={`flex-1 ${
                  loginType === 'admin' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Shield className="w-4 h-4 mr-2" />
                Staff Login
              </Button>
              <Button
                variant={loginType === 'customer' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLoginType('customer')}
                className={`flex-1 ${
                  loginType === 'customer' 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <User className="w-4 h-4 mr-2" />
                Customer Portal
              </Button>
            </div>
            
            <CardTitle className="text-white text-xl font-semibold">
              {loginType === 'admin' ? 'Staff Access' : 'Customer Portal'}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">
                  {loginType === 'admin' ? 'Username or Employee ID' : 'Customer Username'}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder={loginType === 'admin' ? 'Enter your username' : 'Enter customer username'}
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    className="pl-12 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:ring-blue-400/50 h-12 text-base"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="pl-12 pr-12 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:ring-blue-400/50 h-12 text-base"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Enhanced Login Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 h-12 text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isConnecting ? 'Connecting...' : 'Signing In...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Sign In Securely
                  </div>
                )}
              </Button>
            </form>

            {/* Quick Access */}
            {loginType === 'admin' && !isLoading && (
              <div className="pt-4 border-t border-white/20">
                <p className="text-xs text-white/60 mb-3 text-center">Quick Access (Development)</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin('admin')}
                    className="flex-1 bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:text-white text-xs"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Admin Demo
                  </Button>
                </div>
              </div>
            )}

            {/* Features List */}
            <div className="pt-4 border-t border-white/20">
              <p className="text-xs text-white/60 mb-3 text-center">Enhanced Features</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  Real-time Sync
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  Task History
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  Profile Management
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  Live Updates
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="text-center text-xs text-white/50">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Connected to Production Server
              </div>
              <div className="mt-1">103.122.85.61:4000</div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Footer */}
        <div className="text-center text-sm text-white/60 space-y-2">
          <p>Wizone Task Management System v2.0</p>
          <p className="text-xs">Enhanced with real-time sync and mobile optimization</p>
        </div>
      </div>
    </div>
  );
}