import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const { toast } = useToast();

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
      adminLoginMutation.mutate(loginForm);
    } else if (loginType === "customer") {
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
              <p className="text-gray-600 mt-2">
                {loginType === "admin" ? "Staff Access" : "Customer Support Portal"}
              </p>
            </div>
          </div>

          {/* Login Form */}
          <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl text-center text-gray-900 font-semibold">
                {loginType === "admin" ? "Staff Login" : "Customer Login"}
              </CardTitle>
              <CardDescription className="text-center text-gray-600">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-700 font-medium">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    placeholder={loginType === "admin" ? "Enter staff username" : "Enter customer username"}
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      placeholder="Enter your password"
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-50 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 shadow-lg transition-all duration-300 hover:shadow-xl"
                  disabled={adminLoginMutation.isPending || customerLoginMutation.isPending}
                >
                  {(adminLoginMutation.isPending || customerLoginMutation.isPending) ? "Signing In..." : "Sign In"}
                </Button>
              </form>

              {/* Back Button */}
              <Button
                variant="outline"
                onClick={handleBackToSelection}
                className="w-full border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                ← Back to Login Selection
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}