import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Eye, EyeOff, LogIn, User, Lock, ListTodo } from "lucide-react";
import wizoneLogoPath from "@/assets/wizone-logo.jpg";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginFormData) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      // Redirect field engineers to portal instead of dashboard
      if (user.role === 'field_engineer') {
        setLocation("/portal");
      } else {
        setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <img 
              src={wizoneLogoPath} 
              alt="Wizone Logo" 
              className="w-40 h-auto object-contain rounded-lg bg-white/10 p-2 backdrop-blur-sm"
            />
          </div>
          <p className="text-gray-300 mt-2 font-medium">IT Support Portal</p>
        </div>

        {/* Login Form */}
        <Card className="bg-white/10 backdrop-blur-md shadow-2xl border border-white/20">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center text-white">Welcome back</CardTitle>
            <CardDescription className="text-center text-gray-300">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-300" />
                          <Input
                            placeholder="Enter your username"
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:bg-white/20"
                            {...field}
                          />
                        </div>
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
                      <FormLabel className="text-white">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-300" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:bg-white/20"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-300" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-300" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg transition-all duration-300"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}