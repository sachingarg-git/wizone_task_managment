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
  
  // Skip validation for API routes, local development, and Replit domains
  if (req.path.startsWith('/api') || 
      hostname === 'localhost:5000' || 
      process.env.NODE_ENV === 'development' ||
      hostname.includes('replit.dev') ||
      hostname.includes('replit.app') ||
      hostname.includes('picard.replit.dev')) {
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

// Setup CORS for multiple domains
export function setupDomainCORS(app: Express) {
  app.use((req, res, next) => {
    const origin = req.get('origin');
    const hostname = req.get('host') || req.hostname;
    
    // Allow all domains that are configured
    if (origin && domainManager.isValidDomain(new URL(origin).hostname)) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (domainManager.isValidDomain(hostname)) {
      res.header('Access-Control-Allow-Origin', `${req.protocol}://${hostname}`);
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