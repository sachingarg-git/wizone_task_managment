// Database connection and API management for Wizone Professional
class DatabaseManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.retryAttempts = 0;
        this.maxRetries = CONFIG.DATABASE.RETRY_ATTEMPTS;
        this.retryDelay = CONFIG.DATABASE.RETRY_DELAY;
        
        // Local storage keys
        this.STORAGE_KEYS = {
            TASKS: 'wizone_tasks',
            USER: 'wizone_user',
            SYNC_QUEUE: 'wizone_sync_queue',
            LAST_SYNC: 'wizone_last_sync',
            OFFLINE_DATA: 'wizone_offline_data'
        };
        
        this.initializeEventListeners();
        this.startSyncTimer();
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log('🗄️ Database Manager initialized');
        }
    }

    // Initialize event listeners for network status
    initializeEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showConnectionStatus('online');
            this.processSyncQueue();
            if (CONFIG.DEV.CONSOLE_LOGS) {
                console.log('📡 Connection restored');
            }
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showConnectionStatus('offline');
            if (CONFIG.DEV.CONSOLE_LOGS) {
                console.log('📡 Connection lost - switching to offline mode');
            }
        });
    }

    // Show connection status to user
    showConnectionStatus(status) {
        const indicator = document.getElementById('connectionIndicator') || this.createConnectionIndicator();
        
        indicator.className = `connection-indicator ${status}`;
        
        switch (status) {
            case 'offline':
                indicator.textContent = '📵 No internet connection - Working offline';
                break;
            case 'reconnecting':
                indicator.textContent = '🔄 Reconnecting...';
                break;
            case 'online':
                indicator.textContent = '✅ Connected - Syncing data...';
                break;
        }
    }

    createConnectionIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'connectionIndicator';
        indicator.className = 'connection-indicator';
        document.body.appendChild(indicator);
        return indicator;
    }

    // Make API requests with offline support
    async makeRequest(method, endpoint, data = null, options = {}) {
        const url = CONFIG.getApiUrl(endpoint);
        const token = this.getAuthToken();
        
        const requestOptions = {
            method: method.toUpperCase(),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            timeout: CONFIG.SECURITY.REQUEST_TIMEOUT,
            ...options
        };

        // Add authorization header if token exists
        if (token) {
            requestOptions.headers['Authorization'] = `Bearer ${token}`;
        }

        // Add body for POST/PUT requests
        if (data && method.toUpperCase() !== 'GET') {
            if (data instanceof FormData) {
                delete requestOptions.headers['Content-Type']; // Let browser set it for FormData
                requestOptions.body = data;
            } else {
                requestOptions.body = JSON.stringify(data);
            }
        }

        try {
            if (!this.isOnline) {
                throw new Error('No internet connection');
            }

            if (CONFIG.DEV.NETWORK_LOGS) {
                console.log(`🌐 ${method.toUpperCase()} ${url}`, data);
            }

            const response = await this.fetchWithTimeout(url, requestOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (CONFIG.DEV.NETWORK_LOGS) {
                console.log(`✅ Response from ${endpoint}:`, result);
            }

            // Reset retry attempts on successful request
            this.retryAttempts = 0;
            
            return result;

        } catch (error) {
            if (CONFIG.DEV.CONSOLE_LOGS) {
                console.error(`❌ Request failed ${method.toUpperCase()} ${endpoint}:`, error.message);
            }

            // Handle offline scenarios
            if (!this.isOnline || error.message.includes('fetch')) {
                if (method.toUpperCase() === 'GET') {
                    return this.getOfflineData(endpoint, data);
                } else {
                    this.addToSyncQueue(method, endpoint, data);
                    throw new Error('Request queued for when connection is restored');
                }
            }

            // Handle authentication errors
            if (error.message.includes('401') || error.message.includes('403')) {
                this.handleAuthError();
                throw new Error('Authentication required');
            }

            throw error;
        }
    }

    // Fetch with timeout support
    async fetchWithTimeout(url, options) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), options.timeout || 30000);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeout);
            return response;
        } catch (error) {
            clearTimeout(timeout);
            throw error;
        }
    }

    // Authentication token management
    getAuthToken() {
        return localStorage.getItem(CONFIG.SECURITY.TOKEN_STORAGE_KEY);
    }

    setAuthToken(token) {
        localStorage.setItem(CONFIG.SECURITY.TOKEN_STORAGE_KEY, token);
    }

    removeAuthToken() {
        localStorage.removeItem(CONFIG.SECURITY.TOKEN_STORAGE_KEY);
        localStorage.removeItem(CONFIG.SECURITY.USER_STORAGE_KEY);
    }

    // Handle authentication errors
    handleAuthError() {
        this.removeAuthToken();
        if (window.AuthManager) {
            window.AuthManager.logout();
        }
    }

    // Offline data management
    getOfflineData(endpoint, params = null) {
        const cacheKey = this.getCacheKey(endpoint, params);
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            const data = JSON.parse(cached);
            if (CONFIG.DEV.CONSOLE_LOGS) {
                console.log(`📦 Returning cached data for ${endpoint}`, data);
            }
            return data;
        }
        
        throw new Error('No cached data available');
    }

    cacheData(endpoint, params, data) {
        const cacheKey = this.getCacheKey(endpoint, params);
        const cacheEntry = {
            data: data,
            timestamp: Date.now(),
            endpoint: endpoint
        };
        
        localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log(`💾 Cached data for ${endpoint}`);
        }
    }

    getCacheKey(endpoint, params) {
        const base = `cache_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
        return params ? `${base}_${JSON.stringify(params)}` : base;
    }

    // Sync queue management
    addToSyncQueue(method, endpoint, data) {
        const syncItem = {
            id: Date.now() + Math.random(),
            method,
            endpoint,
            data,
            timestamp: Date.now(),
            attempts: 0
        };
        
        this.syncQueue.push(syncItem);
        this.saveSyncQueue();
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log(`📋 Added to sync queue: ${method} ${endpoint}`);
        }

        // Show user feedback
        this.showToast('Changes saved locally - will sync when connection is restored', 'info');
    }

    async processSyncQueue() {
        if (this.syncQueue.length === 0) return;
        
        this.showConnectionStatus('reconnecting');
        
        const itemsToProcess = [...this.syncQueue];
        const successfulItems = [];
        
        for (const item of itemsToProcess) {
            try {
                await this.makeRequest(item.method, item.endpoint, item.data);
                successfulItems.push(item);
                
                if (CONFIG.DEV.CONSOLE_LOGS) {
                    console.log(`✅ Synced: ${item.method} ${item.endpoint}`);
                }
            } catch (error) {
                item.attempts = (item.attempts || 0) + 1;
                
                if (item.attempts >= this.maxRetries) {
                    successfulItems.push(item); // Remove from queue after max attempts
                    console.error(`❌ Failed to sync after ${this.maxRetries} attempts:`, item);
                }
            }
        }
        
        // Remove successful items from queue
        this.syncQueue = this.syncQueue.filter(item => !successfulItems.includes(item));
        this.saveSyncQueue();
        
        if (successfulItems.length > 0) {
            this.showToast(`Synced ${successfulItems.length} pending changes`, 'success');
        }
        
        // Update last sync time
        localStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, Date.now().toString());
    }

    saveSyncQueue() {
        localStorage.setItem(this.STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(this.syncQueue));
    }

    loadSyncQueue() {
        const saved = localStorage.getItem(this.STORAGE_KEYS.SYNC_QUEUE);
        if (saved) {
            this.syncQueue = JSON.parse(saved);
        }
    }

    // Periodic sync timer
    startSyncTimer() {
        if (CONFIG.DATABASE.SYNC_INTERVAL > 0) {
            setInterval(() => {
                if (this.isOnline && this.syncQueue.length > 0) {
                    this.processSyncQueue();
                }
            }, CONFIG.DATABASE.SYNC_INTERVAL);
        }
    }

    // Task-specific API methods
    async getTasks(forceRefresh = false) {
        try {
            const tasks = await this.makeRequest('GET', CONFIG.SERVER.ENDPOINTS.MY_TASKS);
            
            // Cache tasks for offline access
            this.cacheData(CONFIG.SERVER.ENDPOINTS.MY_TASKS, null, tasks);
            
            return tasks;
        } catch (error) {
            if (!forceRefresh) {
                // Try to return cached data
                try {
                    return this.getOfflineData(CONFIG.SERVER.ENDPOINTS.MY_TASKS);
                } catch (cacheError) {
                    throw error;
                }
            }
            throw error;
        }
    }

    async getTaskUpdates(taskId) {
        const endpoint = CONFIG.SERVER.ENDPOINTS.TASK_UPDATES.replace('{id}', taskId);
        
        try {
            const updates = await this.makeRequest('GET', endpoint);
            this.cacheData(endpoint, null, updates);
            return updates;
        } catch (error) {
            try {
                return this.getOfflineData(endpoint);
            } catch (cacheError) {
                throw error;
            }
        }
    }

    async updateTask(taskId, updateData) {
        const endpoint = CONFIG.SERVER.ENDPOINTS.TASKS + `/${taskId}`;
        return await this.makeRequest('PUT', endpoint, updateData);
    }

    async uploadFiles(taskId, formData) {
        const endpoint = CONFIG.SERVER.ENDPOINTS.TASK_FILES.replace('{id}', taskId);
        return await this.makeRequest('POST', endpoint, formData);
    }

    async syncTasks() {
        return await this.makeRequest('POST', CONFIG.SERVER.ENDPOINTS.SYNC, {});
    }

    // Authentication methods
    async login(credentials) {
        const result = await this.makeRequest('POST', CONFIG.SERVER.ENDPOINTS.LOGIN, credentials);
        
        if (result.token) {
            this.setAuthToken(result.token);
            localStorage.setItem(CONFIG.SECURITY.USER_STORAGE_KEY, JSON.stringify(result.user));
        }
        
        return result;
    }

    async logout() {
        try {
            await this.makeRequest('POST', CONFIG.SERVER.ENDPOINTS.LOGOUT);
        } catch (error) {
            console.warn('Logout request failed:', error.message);
        } finally {
            this.removeAuthToken();
        }
    }

    async getCurrentUser() {
        try {
            const user = await this.makeRequest('GET', CONFIG.SERVER.ENDPOINTS.USER);
            localStorage.setItem(CONFIG.SECURITY.USER_STORAGE_KEY, JSON.stringify(user));
            return user;
        } catch (error) {
            // Return cached user data if available
            const cached = localStorage.getItem(CONFIG.SECURITY.USER_STORAGE_KEY);
            if (cached) {
                return JSON.parse(cached);
            }
            throw error;
        }
    }

    // Utility methods
    showToast(message, type = 'info', duration = CONFIG.UI.TOAST_DURATION) {
        if (window.UIManager) {
            window.UIManager.showToast(message, type, duration);
        }
    }

    // Cleanup old cached data
    cleanupCache() {
        const now = Date.now();
        const maxAge = CONFIG.PERFORMANCE.CACHE_DURATION;
        
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('cache_')) {
                try {
                    const cached = JSON.parse(localStorage.getItem(key));
                    if (cached.timestamp && (now - cached.timestamp) > maxAge) {
                        localStorage.removeItem(key);
                        if (CONFIG.DEV.CONSOLE_LOGS) {
                            console.log(`🧹 Cleaned up expired cache: ${key}`);
                        }
                    }
                } catch (error) {
                    // Remove corrupted cache entries
                    localStorage.removeItem(key);
                }
            }
        });
    }

    // Initialize database manager
    init() {
        this.loadSyncQueue();
        this.cleanupCache();
        
        // Schedule periodic cleanup
        setInterval(() => {
            this.cleanupCache();
        }, CONFIG.PERFORMANCE.CLEANUP_INTERVAL);
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log('🚀 Database Manager ready');
        }
    }
}

// Initialize global database manager
window.DatabaseManager = new DatabaseManager();
window.DatabaseManager.init();