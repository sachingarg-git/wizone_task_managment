import { useState } from "react";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, 
  Download, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  Globe,
  FileText,
  Zap,
  Settings,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function APKDownload() {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const { toast } = useToast();

  const appUrl = "https://task-score-tracker-sachin160.replit.app";
  const appName = "Wizone IT Support Portal";
  const packageName = "com.wizone.itsupport";

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopiedUrl(true);
      toast({
        title: "URL Copied",
        description: "App URL has been copied to clipboard",
      });
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
  };

  const apkGenerators = [
    {
      name: "Website2APK.com",
      url: "https://website2apk.com",
      recommended: true,
      description: "Fast and reliable APK generator",
      time: "2-3 minutes"
    },
    {
      name: "AppsGeyser.com", 
      url: "https://appsgeyser.com",
      recommended: false,
      description: "Easy-to-use online converter",
      time: "3-5 minutes"
    },
    {
      name: "WebIntoApp.com",
      url: "https://webintoapp.com", 
      recommended: false,
      description: "Professional app wrapper",
      time: "5-10 minutes"
    }
  ];

  const features = [
    "Complete task management system",
    "Real-time chat messaging", 
    "Customer portal access",
    "Performance analytics dashboard",
    "Location tracking for field engineers",
    "File upload and attachments",
    "Offline data caching (PWA)",
    "Push notifications support"
  ];

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Smartphone className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold">Android APK Download</h1>
              </div>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get the Wizone IT Support Portal as a native Android app. Multiple generation methods available - choose the one that works best for you.
              </p>
            </div>

            {/* App Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  App Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="font-medium">App Name</p>
                    <p className="text-muted-foreground">{appName}</p>
                  </div>
                  <div>
                    <p className="font-medium">Package Name</p>
                    <p className="text-muted-foreground font-mono text-sm">{packageName}</p>
                  </div>
                  <div>
                    <p className="font-medium">Version</p>
                    <p className="text-muted-foreground">1.0.0</p>
                  </div>
                </div>
                
                <div>
                  <p className="font-medium mb-2">App URL</p>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <code className="flex-1 text-sm font-mono">{appUrl}</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyUrl}
                      className="flex items-center gap-1"
                    >
                      {copiedUrl ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedUrl ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* APK Generation Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Method 1: Online Generators */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-500" />
                    Instant APK Generation
                    <Badge variant="secondary">Recommended</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate APK files online in 2-3 minutes using these trusted services:
                  </p>
                  
                  {apkGenerators.map((generator, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{generator.name}</h4>
                        {generator.recommended && (
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        )}
                        <Badge variant="outline" className="text-xs">{generator.time}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{generator.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(generator.url, '_blank')}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open {generator.name}
                      </Button>
                    </div>
                  ))}
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">Steps:</h5>
                    <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                      <li>Click any generator link above</li>
                      <li>Enter the app URL (use copy button above)</li>
                      <li>Set app name: <strong>{appName}</strong></li>
                      <li>Set package: <strong>{packageName}</strong></li>
                      <li>Generate and download APK</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* Method 2: PWA Install */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-500" />
                    Progressive Web App
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Install instantly from browser - works like a native app with offline support.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Android Installation</h4>
                      <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                        <li>Open Chrome on Android device</li>
                        <li>Visit the app URL</li>
                        <li>Tap menu (⋮) → "Add to Home screen"</li>
                        <li>App installs instantly</li>
                      </ol>
                    </div>
                    
                    <Button
                      onClick={() => window.open(appUrl, '_blank')}
                      className="w-full flex items-center gap-2"
                    >
                      <Globe className="w-4 h-4" />
                      Open Web App
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Method 3: React Native Build */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-500" />
                    React Native APK
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Build native Android APK with full device access and optimal performance.
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">Build Commands:</h5>
                    <code className="text-sm block space-y-1">
                      <div>cd mobile</div>
                      <div>npm install</div>
                      <div>npm run build:apk</div>
                    </code>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="font-medium">Features:</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Native Android performance</li>
                      <li>• Full device API access</li>
                      <li>• Offline capabilities</li>
                      <li>• Push notifications</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* App Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    App Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Login Credentials */}
            <Card>
              <CardHeader>
                <CardTitle>Default Login Credentials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Username</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded">admin</code>
                  </div>
                  <div>
                    <p className="font-medium">Password</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded">admin123</code>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </div>
  );
}