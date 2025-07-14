import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListTodo, Users, BarChart3, Settings } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center text-white space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
            <ListTodo className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-bold">TaskFlow</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Comprehensive Task Management & Performance Tracking System
          </p>
          <p className="text-lg text-blue-200">
            Streamline your workflow, track performance, and manage customers efficiently
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <ListTodo className="w-8 h-8 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Task Management</h3>
              <p className="text-sm text-blue-100">
                Create, assign, and track tasks with priority levels and status updates
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Customer Management</h3>
              <p className="text-sm text-blue-100">
                Maintain detailed customer profiles and service history
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Performance Tracking</h3>
              <p className="text-sm text-blue-100">
                Monitor team performance with comprehensive metrics and scoring
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <Settings className="w-8 h-8 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">User Management</h3>
              <p className="text-sm text-blue-100">
                Manage system users, roles, and permissions efficiently
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Login Section */}
        <Card className="bg-white shadow-2xl max-w-md mx-auto">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                <p className="text-gray-600 mt-2">Sign in to access your dashboard</p>
              </div>

              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="w-full bg-primary hover:bg-blue-700 text-white py-3 text-lg"
              >
                Sign In
              </Button>

              <div className="text-sm text-gray-500">
                <p>Secure authentication powered by Replit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-blue-100 text-sm">
          <p>&copy; 2024 TaskFlow. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
