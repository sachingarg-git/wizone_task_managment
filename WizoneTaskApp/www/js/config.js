// Configuration for Wizone Professional Mobile App
const CONFIG = {
    // Server Configuration
    SERVER: {
        HOST: '103.122.85.61',
        PORT: 4000,
        PROTOCOL: 'http',
        get BASE_URL() {
            return `${this.PROTOCOL}://${this.HOST}:${this.PORT}`;
        },
        
        // API Endpoints
        ENDPOINTS: {
            AUTH: '/api/auth',
            LOGIN: '/api/auth/login',
            LOGOUT: '/api/auth/logout',
            USER: '/api/auth/user',
            TASKS: '/api/tasks',
            MY_TASKS: '/api/tasks/my-tasks',
            TASK_UPDATES: '/api/tasks/{id}/updates',
            TASK_FILES: '/api/tasks/{id}/files',
            SYNC: '/api/tasks/sync',
            UPLOAD: '/api/upload',
            CUSTOMERS: '/api/customers'
        }
    },

    // Database Configuration
    DATABASE: {
        // PostgreSQL connection will be handled server-side
        // Mobile app connects via REST API
        SYNC_INTERVAL: 30000, // 30 seconds
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 2000, // 2 seconds
        OFFLINE_STORAGE: true
    },

    // App Configuration
    APP: {
        NAME: 'Wizone Professional',
        VERSION: '2.0.0',
        BUILD: '2024.10.11',
        ENVIRONMENT: 'production',
        DEBUG: false,
        
        // Feature Flags
        FEATURES: {
            OFFLINE_MODE: true,
            REAL_TIME_SYNC: true,
            FILE_UPLOAD: true,
            CAMERA_CAPTURE: true,
            PUSH_NOTIFICATIONS: true,
            BIOMETRIC_AUTH: false,
            DARK_MODE: true,
            ANALYTICS: false
        }
    },

    // UI Configuration
    UI: {
        THEME: 'professional',
        ANIMATIONS: true,
        HAPTIC_FEEDBACK: true,
        PULL_TO_REFRESH: true,
        SWIPE_GESTURES: true,
        
        // Timeouts and Delays
        TOAST_DURATION: 4000,
        SPLASH_DURATION: 2000,
        LOADING_TIMEOUT: 10000,
        
        // Limits
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
        MAX_FILES_PER_UPLOAD: 5,
        TASK_DESCRIPTION_LIMIT: 500,
        NOTES_LIMIT: 1000,
        
        // Supported file types
        SUPPORTED_FILE_TYPES: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/csv'
        ]
    },

    // Security Configuration
    SECURITY: {
        TOKEN_STORAGE_KEY: 'wizone_auth_token',
        USER_STORAGE_KEY: 'wizone_user_data',
        SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours
        AUTO_LOGOUT: true,
        ENCRYPT_STORAGE: false, // Set to true for production
        
        // API Security
        REQUEST_TIMEOUT: 30000, // 30 seconds
        MAX_RETRY_ATTEMPTS: 3,
        RATE_LIMIT_REQUESTS: 100,
        RATE_LIMIT_WINDOW: 60000 // 1 minute
    },

    // Notification Configuration
    NOTIFICATIONS: {
        ENABLED: true,
        SOUND: true,
        VIBRATION: true,
        BADGE: true,
        
        // Notification types
        TYPES: {
            TASK_ASSIGNED: 'task_assigned',
            TASK_UPDATED: 'task_updated',
            TASK_COMPLETED: 'task_completed',
            SYNC_COMPLETED: 'sync_completed',
            CONNECTION_LOST: 'connection_lost',
            CONNECTION_RESTORED: 'connection_restored'
        }
    },

    // Performance Configuration
    PERFORMANCE: {
        LAZY_LOADING: true,
        IMAGE_COMPRESSION: true,
        CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
        PRELOAD_TASKS: 20,
        VIRTUAL_SCROLLING: true,
        
        // Memory management
        MAX_CACHED_IMAGES: 50,
        MAX_CACHED_TASKS: 200,
        CLEANUP_INTERVAL: 10 * 60 * 1000 // 10 minutes
    },

    // Development Configuration
    DEV: {
        CONSOLE_LOGS: true,
        NETWORK_LOGS: true,
        PERFORMANCE_LOGS: false,
        MOCK_DATA: false,
        SIMULATE_OFFLINE: false,
        SIMULATE_SLOW_NETWORK: false
    },

    // Status Configuration
    STATUS: {
        PENDING: 'pending',
        IN_PROGRESS: 'in_progress',
        RESOLVED: 'resolved',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
        
        // Status colors
        COLORS: {
            pending: '#f59e0b',
            in_progress: '#3b82f6',
            resolved: '#10b981',
            completed: '#6b7280',
            cancelled: '#ef4444'
        },
        
        // Status icons
        ICONS: {
            pending: 'fas fa-clock',
            in_progress: 'fas fa-spinner',
            resolved: 'fas fa-check-circle',
            completed: 'fas fa-archive',
            cancelled: 'fas fa-times-circle'
        }
    },

    // Priority Configuration
    PRIORITY: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical',
        
        // Priority colors
        COLORS: {
            low: '#10b981',
            medium: '#f59e0b',
            high: '#ef4444',
            critical: '#dc2626'
        },
        
        // Priority icons
        ICONS: {
            low: 'fas fa-arrow-down',
            medium: 'fas fa-minus',
            high: 'fas fa-arrow-up',
            critical: 'fas fa-exclamation-triangle'
        }
    }
};

// Utility functions for configuration
CONFIG.getApiUrl = function(endpoint, params = {}) {
    let url = this.SERVER.BASE_URL + endpoint;
    
    // Replace path parameters
    Object.keys(params).forEach(key => {
        url = url.replace(`{${key}}`, params[key]);
    });
    
    return url;
};

CONFIG.isFeatureEnabled = function(feature) {
    return this.APP.FEATURES[feature] === true;
};

CONFIG.getStatusColor = function(status) {
    return this.STATUS.COLORS[status] || this.STATUS.COLORS.pending;
};

CONFIG.getStatusIcon = function(status) {
    return this.STATUS.ICONS[status] || this.STATUS.ICONS.pending;
};

CONFIG.getPriorityColor = function(priority) {
    return this.PRIORITY.COLORS[priority] || this.PRIORITY.COLORS.medium;
};

CONFIG.getPriorityIcon = function(priority) {
    return this.PRIORITY.ICONS[priority] || this.PRIORITY.ICONS.medium;
};

CONFIG.isSupportedFileType = function(fileType) {
    return this.UI.SUPPORTED_FILE_TYPES.includes(fileType);
};

CONFIG.formatFileSize = function(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

CONFIG.validateFileUpload = function(file) {
    const errors = [];
    
    if (!this.isSupportedFileType(file.type)) {
        errors.push('File type not supported');
    }
    
    if (file.size > this.UI.MAX_FILE_SIZE) {
        errors.push(`File size exceeds ${this.formatFileSize(this.UI.MAX_FILE_SIZE)} limit`);
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
};

// Environment-specific overrides
if (CONFIG.APP.ENVIRONMENT === 'development') {
    CONFIG.DEV.CONSOLE_LOGS = true;
    CONFIG.DEV.NETWORK_LOGS = true;
    CONFIG.APP.DEBUG = true;
    CONFIG.DATABASE.SYNC_INTERVAL = 10000; // 10 seconds for dev
}

// Export configuration
window.CONFIG = CONFIG;

// Log configuration on load
if (CONFIG.DEV.CONSOLE_LOGS) {
    console.log('📱 Wizone Professional Mobile App Configuration:', {
        version: CONFIG.APP.VERSION,
        environment: CONFIG.APP.ENVIRONMENT,
        server: CONFIG.SERVER.BASE_URL,
        features: CONFIG.APP.FEATURES
    });
}