import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Database, Settings, Users, Shield } from 'lucide-react';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  trustCertificate: boolean;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: any;
}

const SETUP_STEPS: SetupStep[] = [
  {
    id: 'config',
    title: 'Database Configuration',
    description: 'Enter your MS SQL Server connection details',
    icon: Database
  },
  {
    id: 'test',
    title: 'Test Connection',
    description: 'Verify database connectivity',
    icon: Settings
  },
  {
    id: 'tables',
    title: 'Create Tables',
    description: 'Initialize database schema',
    icon: Database
  },
  {
    id: 'admin',
    title: 'Admin Setup',
    description: 'Create default administrator account',
    icon: Shield
  },
  {
    id: 'complete',
    title: 'Setup Complete',
    description: 'Ready to use the application',
    icon: CheckCircle
  }
];

export default function DatabaseSetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<DatabaseConfig>({
    host: 'localhost',
    port: 1433,
    database: 'WIZONE_TASK_MANAGER',
    username: 'sa',
    password: '',
    ssl: false,
    trustCertificate: true
  });
  const [adminConfig, setAdminConfig] = useState({
    username: 'admin',
    password: 'admin123',
    email: 'admin@wizoneit.com',
    firstName: 'System',
    lastName: 'Administrator'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress((currentStep / (SETUP_STEPS.length - 1)) * 100);
  }, [currentStep]);

  const testConnection = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/setup/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('Database connection successful!');
        setTimeout(() => setCurrentStep(2), 1500);
      } else {
        setError(result.error || 'Connection failed');
      }
    } catch (err) {
      setError('Failed to test connection');
    } finally {
      setLoading(false);
    }
  };

  const createTables = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/setup/create-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess(`${result.tablesCreated} tables created successfully!`);
        setTimeout(() => setCurrentStep(3), 1500);
      } else {
        setError(result.error || 'Failed to create tables');
      }
    } catch (err) {
      setError('Failed to create tables');
    } finally {
      setLoading(false);
    }
  };

  const createAdminUser = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/setup/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, admin: adminConfig })
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('Admin user created successfully!');
        setTimeout(() => setCurrentStep(4), 1500);
      } else {
        setError(result.error || 'Failed to create admin user');
      }
    } catch (err) {
      setError('Failed to create admin user');
    } finally {
      setLoading(false);
    }
  };

  const completeSetup = () => {
    // Redirect to login page
    window.location.href = '/login';
  };

  const renderStepContent = () => {
    const step = SETUP_STEPS[currentStep];
    
    switch (step.id) {
      case 'config':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="host">Server Host</Label>
                <Input
                  id="host"
                  value={config.host}
                  onChange={(e) => setConfig({...config, host: e.target.value})}
                  placeholder="localhost or IP address"
                />
              </div>
              <div>
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={config.port}
                  onChange={(e) => setConfig({...config, port: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="database">Database Name</Label>
              <Input
                id="database"
                value={config.database}
                onChange={(e) => setConfig({...config, database: e.target.value})}
                placeholder="Database name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={config.username}
                  onChange={(e) => setConfig({...config, username: e.target.value})}
                  placeholder="SQL Server username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={config.password}
                  onChange={(e) => setConfig({...config, password: e.target.value})}
                  placeholder="SQL Server password"
                />
              </div>
            </div>
            <Button 
              onClick={() => setCurrentStep(1)} 
              disabled={!config.host || !config.username || !config.password}
              className="w-full"
            >
              Next: Test Connection
            </Button>
          </div>
        );

      case 'test':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Database className="mx-auto h-16 w-16 text-blue-500" />
              <h3 className="mt-4 text-lg font-semibold">Testing Database Connection</h3>
              <p className="text-muted-foreground">
                Connecting to {config.host}:{config.port}
              </p>
            </div>
            <Button 
              onClick={testConnection} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing Connection...' : 'Test Connection'}
            </Button>
          </div>
        );

      case 'tables':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Settings className="mx-auto h-16 w-16 text-green-500" />
              <h3 className="mt-4 text-lg font-semibold">Create Database Tables</h3>
              <p className="text-muted-foreground">
                This will create all required tables for the application
              </p>
            </div>
            <Button 
              onClick={createTables} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating Tables...' : 'Create Tables'}
            </Button>
          </div>
        );

      case 'admin':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Shield className="mx-auto h-16 w-16 text-purple-500" />
              <h3 className="mt-4 text-lg font-semibold">Setup Administrator Account</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adminUsername">Admin Username</Label>
                <Input
                  id="adminUsername"
                  value={adminConfig.username}
                  onChange={(e) => setAdminConfig({...adminConfig, username: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="adminPassword">Admin Password</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={adminConfig.password}
                  onChange={(e) => setAdminConfig({...adminConfig, password: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                value={adminConfig.email}
                onChange={(e) => setAdminConfig({...adminConfig, email: e.target.value})}
              />
            </div>
            <Button 
              onClick={createAdminUser} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating Admin User...' : 'Create Admin User'}
            </Button>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-4 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h3 className="text-lg font-semibold">Setup Complete!</h3>
            <p className="text-muted-foreground">
              Your Wizone IT Support Portal is ready to use.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold">Login Credentials:</p>
              <p>Username: {adminConfig.username}</p>
              <p>Password: {adminConfig.password}</p>
            </div>
            <Button onClick={completeSetup} className="w-full">
              Go to Login Page
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Database className="h-6 w-6" />
            Wizone IT Support Portal Setup
          </CardTitle>
          <CardDescription>
            Configure your database and set up the application
          </CardDescription>
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              Step {currentStep + 1} of {SETUP_STEPS.length}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              {React.createElement(SETUP_STEPS[currentStep].icon, { 
                className: "h-5 w-5 text-blue-500" 
              })}
              <h2 className="text-xl font-semibold">{SETUP_STEPS[currentStep].title}</h2>
            </div>
            <p className="text-muted-foreground">{SETUP_STEPS[currentStep].description}</p>
          </div>

          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {renderStepContent()}
        </CardContent>
      </Card>
    </div>
  );
}