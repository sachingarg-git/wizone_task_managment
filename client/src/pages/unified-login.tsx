import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Building2, Users } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import wizoneLogoPath from "@/assets/wizone-logo.jpg";

interface LoginProps {
  onAdminLogin: (user: any) => void;
  onCustomerLogin: (customer: any) => void;
}

export default function UnifiedLogin({ onAdminLogin, onCustomerLogin }: LoginProps) {
  const [loginType, setLoginType] = useState<"admin" | "customer" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();

  // Load saved credentials on mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem('wizone_saved_credentials');
    if (savedCredentials) {
      try {
        const parsed = JSON.parse(savedCredentials);
        setLoginForm({ username: parsed.username || "", password: parsed.password || "" });
        setRememberMe(true);
        if (parsed.loginType) {
          setLoginType(parsed.loginType);
        }
      } catch (e) {
        console.log('Error loading saved credentials');
      }
    }
  }, []);

  // Save or clear credentials based on rememberMe
  const handleCredentialSave = (type: "admin" | "customer") => {
    if (rememberMe) {
      localStorage.setItem('wizone_saved_credentials', JSON.stringify({
        username: loginForm.username,
        password: loginForm.password,
        loginType: type
      }));
    } else {
      localStorage.removeItem('wizone_saved_credentials');
    }
  };

  // Admin login mutation
  const adminLoginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Invalid admin credentials");
      }
      return response.json();
    },
    onSuccess: (user) => {
      console.log('🔴 ADMIN LOGIN - Success:', user);
      onAdminLogin(user);
      toast({ title: `Welcome, ${user.firstName || user.username}!` });
    },
    onError: (error) => {
      toast({
        title: "Admin Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Customer login mutation
  const customerLoginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      console.log('🔵 CUSTOMER LOGIN - Attempting:', credentials.username);
      const response = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Invalid customer credentials");
      }
      return response.json();
    },
    onSuccess: (customer) => {
      console.log('🔵 CUSTOMER LOGIN - Success:', customer);
      onCustomerLogin(customer);
      toast({ title: `Welcome, ${customer.name}!` });
    },
    onError: (error) => {
      toast({
        title: "Customer Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginType === "admin") {
      handleCredentialSave("admin");
      adminLoginMutation.mutate(loginForm);
    } else if (loginType === "customer") {
      handleCredentialSave("customer");
      customerLoginMutation.mutate(loginForm);
    }
  };

  const handleBackToSelection = () => {
    setLoginType(null);
    setLoginForm({ username: "", password: "" });
  };

  // Login type selection screen
  if (!loginType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex">
        {/* Left Side - Services Showcase */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-cyan-600 p-12 text-white">
          <div className="flex flex-col justify-center space-y-12 w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Wizone IT Solutions</h1>
              <p className="text-xl text-blue-100">Your Technology Partner</p>
            </div>

            {/* Services Grid */}
            <div className="space-y-8">
              {/* Server Management */}
              <div className="flex items-center space-x-6 bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Server Management</h3>
                  <p className="text-blue-100">High-performance servers for scalable secure data management</p>
                </div>
              </div>

              {/* Software Development */}
              <div className="flex items-center space-x-6 bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Software Development</h3>
                  <p className="text-blue-100">Scalable software solutions tailored for high efficiency and innovation</p>
                </div>
              </div>

              {/* Internet Services */}
              <div className="flex items-center space-x-6 bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Internet Services</h3>
                  <p className="text-blue-100">Fast, secure, reliable online connectivity with smart networking</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Logo and Title */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <img 
                  src={wizoneLogoPath} 
                  alt="Wizone Logo" 
                  className="h-16 w-auto bg-white rounded-lg p-2 shadow-lg ring-4 ring-blue-200/50"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">IT Support Portal</h1>
                <p className="text-gray-600 mt-2">Choose your login type to access your account</p>
              </div>
            </div>

            {/* Login Type Selection */}
            <div className="space-y-4">
              <Button
                onClick={() => setLoginType("admin")}
                className="w-full h-16 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-lg shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <Building2 className="mr-3 h-6 w-6" />
                Wizone Staff Login
                <div className="text-sm font-normal opacity-80 ml-2">(Admin & Engineers)</div>
              </Button>

              <Button
                onClick={() => setLoginType("customer")}
                className="w-full h-16 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-lg shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <Users className="mr-3 h-6 w-6" />
                Customer Portal Login
                <div className="text-sm font-normal opacity-80 ml-2">(Support Tickets)</div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login form screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex">
      {/* Left Side - Services Showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-cyan-600 p-12 text-white">
        <div className="flex flex-col justify-center space-y-12 w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Wizone IT Solutions</h1>
            <p className="text-xl text-blue-100">Your Technology Partner</p>
          </div>

          {/* Services Grid */}
          <div className="space-y-8">
            {/* Server Management */}
            <div className="flex items-center space-x-6 bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Server Management</h3>
                <p className="text-blue-100">High-performance servers for scalable secure data management</p>
              </div>
            </div>

            {/* Software Development */}
            <div className="flex items-center space-x-6 bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Software Development</h3>
                <p className="text-blue-100">Scalable software solutions tailored for high efficiency and innovation</p>
              </div>
            </div>

            {/* Internet Services */}
            <div className="flex items-center space-x-6 bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Internet Services</h3>
                <p className="text-blue-100">Fast, secure, reliable online connectivity with smart networking</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="w-full max-w-md space-y-6">
          {/* Logo and Title */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-25"></div>
                <img 
                  src={wizoneLogoPath} 
                  alt="Wizone Logo" 
                  className="relative h-20 w-auto bg-white rounded-xl p-3 shadow-2xl border border-gray-100"
                />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">
                IT Support Portal
              </h1>
              <p className="text-gray-500 font-medium">
                {loginType === "admin" ? "Staff Access" : "Customer Support Portal"}
              </p>
            </div>
          </div>

          {/* Login Form */}
          <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-2xl shadow-blue-900/10 rounded-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500"></div>
            <CardHeader className="space-y-1 pb-4 pt-6">
              <CardTitle className="text-xl text-center text-gray-800 font-bold flex items-center justify-center gap-2">
                {loginType === "admin" ? (
                  <>
                    <Building2 className="w-5 h-5 text-blue-600" />
                    Staff Login
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5 text-green-600" />
                    Customer Login
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-center text-gray-500">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pb-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-700 font-semibold text-sm">Username</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      placeholder={loginType === "admin" ? "Enter staff username" : "Enter customer username"}
                      className="bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-12 pl-4 transition-all duration-200"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-semibold text-sm">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      placeholder="Enter your password"
                      className="bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-12 pl-4 pr-12 transition-all duration-200"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="rememberMe" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label 
                      htmlFor="rememberMe" 
                      className="text-sm text-gray-600 cursor-pointer select-none hover:text-gray-800 transition-colors"
                    >
                      Remember me
                    </Label>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 text-white font-semibold h-12 rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
                  disabled={adminLoginMutation.isPending || customerLoginMutation.isPending}
                >
                  {(adminLoginMutation.isPending || customerLoginMutation.isPending) ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing In...
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-400">or</span>
                </div>
              </div>

              {/* Back Button */}
              <Button
                variant="outline"
                onClick={handleBackToSelection}
                className="w-full border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 h-11 rounded-xl transition-all duration-200 hover:border-gray-300"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Back to Login Selection
              </Button>
            </CardContent>
          </Card>
          
          {/* Footer */}
          <p className="text-center text-xs text-gray-400">
            © 2026 Wizone IT Solutions. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}