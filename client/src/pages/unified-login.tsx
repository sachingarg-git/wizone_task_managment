import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Building2, Users } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import wizoneLogoPath from "@assets/wizone logo_1751691807955.jpg";

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
      console.log('🔴 ADMIN LOGIN - Making API call to:', "/api/auth/login");
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
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
      console.log('🔵 CUSTOMER LOGIN - Making API call to:', "/api/customer/login");
      
      const response = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        throw new Error("Invalid customer credentials");
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Title */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img 
                src={wizoneLogoPath} 
                alt="Wizone Logo" 
                className="h-16 w-auto bg-white rounded-lg p-2"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">IT Support Portal</h1>
              <p className="text-purple-200 mt-2">Choose your login type to access your account</p>
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
    );
  }

  // Login form screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={wizoneLogoPath} 
              alt="Wizone Logo" 
              className="h-16 w-auto bg-white rounded-lg p-2"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">IT Support Portal</h1>
            <p className="text-purple-200 mt-2">
              {loginType === "admin" ? "Staff Access" : "Customer Support Portal"}
            </p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="backdrop-blur-sm bg-white/10 border-white/20 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center text-white font-semibold">
              {loginType === "admin" ? "Staff Login" : "Customer Login"}
            </CardTitle>
            <CardDescription className="text-center text-purple-200">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder={loginType === "admin" ? "Enter staff username" : "Enter customer username"}
                  className="bg-white/10 border-white/30 text-white placeholder:text-purple-300 focus:border-cyan-400"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Enter your password"
                    className="bg-white/10 border-white/30 text-white placeholder:text-purple-300 focus:border-cyan-400 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-purple-300 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 shadow-lg transition-all duration-200"
                disabled={adminLoginMutation.isPending || customerLoginMutation.isPending}
              >
                {(adminLoginMutation.isPending || customerLoginMutation.isPending) ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            {/* Back Button */}
            <Button
              variant="outline"
              onClick={handleBackToSelection}
              className="w-full border-white/30 text-purple-200 hover:text-white hover:bg-white/10"
            >
              ← Back to Login Selection
            </Button>

            {/* Demo Credentials */}
            <div className="text-center text-sm text-purple-300 mt-4 p-3 bg-white/5 rounded-lg">
              <div className="font-medium text-purple-200 mb-1">Demo Credentials:</div>
              {loginType === "admin" ? (
                <div>Staff: admin / admin123</div>
              ) : (
                <div>Customer: shivalik / admin123</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}