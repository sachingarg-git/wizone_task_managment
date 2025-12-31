import type { Express } from "express";

export interface DomainConfig {
  domain: string;
  customDomain?: string;
  ssl: boolean;
  status: 'active' | 'pending' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export class DomainManager {
  private domains: Map<string, DomainConfig> = new Map();
  
  // Default domains that are always available
  private readonly defaultDomains = [
    'localhost:5000',
    'localhost:4000',
    'localhost:3000',
    'localhost',
    '127.0.0.1:4000',
    '127.0.0.1:5000',
    'task.wizoneit.com',
    '*.wizoneit.com',
    '*.replit.app',
    '*.replit.dev',
    '*.repl.co'
  ];

  constructor() {
    // Initialize with default domains
    this.addDomain({
      domain: '*.replit.app',
      ssl: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Add production domain
    this.addDomain({
      domain: 'task.wizoneit.com',
      ssl: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Add wildcard for Wizone domains
    this.addDomain({
      domain: '*.wizoneit.com',
      ssl: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  addDomain(config: Omit<DomainConfig, 'updatedAt'> & { updatedAt?: Date }): DomainConfig {
    const domainConfig: DomainConfig = {
      ...config,
      updatedAt: new Date()
    };
    
    this.domains.set(config.domain, domainConfig);
    return domainConfig;
  }

  updateDomain(domain: string, updates: Partial<DomainConfig>): DomainConfig | null {
    const existing = this.domains.get(domain);
    if (!existing) return null;

    const updated: DomainConfig = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    this.domains.set(domain, updated);
    return updated;
  }

  removeDomain(domain: string): boolean {
    return this.domains.delete(domain);
  }

  getDomain(domain: string): DomainConfig | null {
    return this.domains.get(domain) || null;
  }

  getAllDomains(): DomainConfig[] {
    return Array.from(this.domains.values());
  }

  isValidDomain(hostname: string): boolean {
    // Check exact matches first
    if (this.domains.has(hostname)) {
      return this.domains.get(hostname)?.status === 'active';
    }

    // Check wildcard matches
    for (const domain of Array.from(this.domains.keys())) {
      const config = this.domains.get(domain)!;
      if (config.status !== 'active') continue;
      
      if (domain.startsWith('*.')) {
        const baseDomain = domain.substring(2);
        if (hostname.endsWith(baseDomain)) {
          return true;
        }
      }
    }

    // Check default domains
    return this.defaultDomains.some(defaultDomain => {
      if (defaultDomain.startsWith('*.')) {
        const baseDomain = defaultDomain.substring(2);
        return hostname.endsWith(baseDomain);
      }
      return hostname === defaultDomain;
    });
  }

  getCustomDomainForHost(hostname: string): DomainConfig | null {
    // Find custom domain configuration for this hostname
    for (const domain of Array.from(this.domains.keys())) {
      const config = this.domains.get(domain)!;
      if (config.customDomain === hostname && config.status === 'active') {
        return config;
      }
      
      if (domain === hostname && config.status === 'active') {
        return config;
      }
    }
    return null;
  }
}

export const domainManager = new DomainManager();

// Middleware to validate domain access
export function domainValidationMiddleware(req: any, res: any, next: any) {
  const hostname = req.get('host') || req.hostname;
  
  // Skip validation for API routes and local development
  if (req.path.startsWith('/api') || hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1') || process.env.NODE_ENV === 'development') {
    return next();
  }

  if (!domainManager.isValidDomain(hostname)) {
    return res.status(403).json({
      error: 'Domain not authorized',
      message: 'This domain is not configured for this application'
    });
  }

  // Add domain info to request for later use
  req.domainConfig = domainManager.getCustomDomainForHost(hostname);
  next();
}

// Setup CORS for multiple domains + Mobile App Support
export function setupDomainCORS(app: Express) {
  app.use((req, res, next) => {
    const origin = req.get('origin');
    const hostname = req.get('host') || req.hostname;
    
    const userAgent = req.get('user-agent') || '';
    
    // ENHANCED MOBILE APP SUPPORT: Detect mobile apps explicitly by user-agent
    // Don't rely on missing origin as desktop browsers may also have no origin
    const isMobileApp = userAgent.includes('WizoneFieldEngineerApp') ||
                       userAgent.includes('wv') || // Android WebView
                       (userAgent.includes('Mobile') && userAgent.includes('Android')) ||
                       req.headers['x-mobile-app'] === 'true' ||
                       req.headers['x-mobile-app'] === 'WizoneFieldEngineerApp' ||
                       origin === 'file://'; // APK file:// protocol
                       
    if (isMobileApp) {
      // For mobile apps (especially APKs), we need to handle CORS differently
      // APKs don't have a proper origin, so we need to be more permissive
      
      console.log(`📱 Mobile request detected - Origin: ${origin}, UA: ${userAgent.substring(0, 50)}...`);
      
      // For APK requests without proper origin, we need to handle credentials carefully
      if (!origin || origin === 'null' || origin === 'undefined' || origin.startsWith('file://')) {
        // For APK with no origin, we can't use wildcard with credentials
        // But APK needs session support, so allow specific localhost for APK
        res.header('Access-Control-Allow-Origin', 'http://localhost:3007');
        res.header('Access-Control-Allow-Credentials', 'true');
      } else {
        // For mobile apps with proper origin, allow credentials
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
      }
      
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie, User-Agent, X-Mobile-App, x-mobile-app, x-requested-with, content-type, X-Session-Token');
      res.header('Access-Control-Expose-Headers', 'Set-Cookie, Authorization, X-Session-Token');
      res.header('Access-Control-Max-Age', '86400');
      res.header('X-Mobile-Supported', 'true');
      
      console.log(`📱 Mobile APK request: ${req.method} ${req.path} - UA: ${userAgent.substring(0, 30)}...`);
      
      if (req.method === 'OPTIONS') {
        console.log('📱 Mobile OPTIONS preflight request handled for:', req.path);
        console.log('📱 CORS Response Headers:', {
          'Access-Control-Allow-Origin': res.get('Access-Control-Allow-Origin'),
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
          'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie, User-Agent, X-Mobile-App, x-mobile-app, x-requested-with, content-type, X-Session-Token',
          'Access-Control-Allow-Credentials': res.get('Access-Control-Allow-Credentials'),
          'Access-Control-Max-Age': '86400'
        });
        res.status(200).end();
        return; // Exit early - don't continue to general CORS logic
      }
      
      // Log non-OPTIONS mobile requests for debugging
      console.log(`📱 Mobile ${req.method} request to ${req.path} proceeding to handler`);
      console.log(`📱 Request headers:`, {
        'content-type': req.headers['content-type'],
        'authorization': req.headers['authorization'] ? 'Present' : 'Missing',
        'x-mobile-app': req.headers['x-mobile-app'],
        'cookie': req.headers['cookie'] ? 'Present' : 'Missing'
      });
      console.log(`📱 Request body:`, req.body);
      next();
      return; // Exit early - don't continue to general CORS logic
    }
    
    // Allow all domains that are configured
    if (origin && origin !== 'null' && origin !== 'undefined') {
      try {
        const originUrl = new URL(origin);
        if (domainManager.isValidDomain(originUrl.hostname)) {
          res.header('Access-Control-Allow-Origin', origin);
        }
      } catch (error) {
        console.log('⚠️ Invalid origin URL:', origin);
      }
    } else if (domainManager.isValidDomain(hostname)) {
      res.header('Access-Control-Allow-Origin', `${req.protocol}://${hostname}`);
    } else {
      // Fallback: Allow localhost and development environments
      if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.') || origin.includes('10.0.2.2'))) {
        res.header('Access-Control-Allow-Origin', origin);
      }
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}