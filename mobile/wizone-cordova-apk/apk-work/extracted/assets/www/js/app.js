// Main Application Entry Point
class WizoneApp {
    constructor() {
        this.isInitialized = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Cordova device ready
        document.addEventListener('deviceready', () => {
            console.log('📱 Cordova device ready');
            this.initializeApp();
        }, false);

        // DOM ready fallback (for testing in browser)
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('🌐 DOM ready');
                setTimeout(() => {
                    if (!this.isInitialized) {
                        this.initializeApp();
                    }
                }, 2000);
            });
        } else {
            // DOM already loaded
            setTimeout(() => {
                if (!this.isInitialized) {
                    this.initializeApp();
                }
            }, 1000);
        }
    }

    async initializeApp() {
        if (this.isInitialized) {
            console.log('✅ App already initialized');
            return;
        }

        console.log('🚀 Initializing Wizone Mobile App...');
        
        try {
            // Show initialization progress
            this.updateLoadingMessage('Initializing mobile app...');
            
            // Setup UI manager first
            if (window.uiManager) {
                window.uiManager.setupSafeArea();
                window.uiManager.setupTouchGestures();
            }
            
            // Get device info for debugging
            const deviceInfo = window.uiManager?.getDeviceInfo();
            if (deviceInfo) {
                console.log('📱 Device Info:', deviceInfo);
            }

            // Initialize API service
            this.updateLoadingMessage('Connecting to server...');
            await this.waitForServices();

            // Check authentication status
            this.updateLoadingMessage('Checking authentication...');
            const isAuthenticated = await this.checkAuthenticationWithRetry();

            if (isAuthenticated) {
                console.log('✅ User already authenticated');
                this.showMainApp();
            } else {
                console.log('🔐 Authentication required');
                this.showLoginScreen();
            }

            this.isInitialized = true;
            console.log('✅ App initialization complete');

        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    updateLoadingMessage(message) {
        const loadingMessage = document.querySelector('.loading-message');
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
        console.log(`📱 ${message}`);
    }

    async waitForServices() {
        // Wait for global services to be available
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            if (window.apiService && window.authManager && window.taskManager && window.uiManager) {
                console.log('✅ All services loaded');
                return;
            }
            
            console.log(`⏳ Waiting for services... (${attempts + 1}/${maxAttempts})`);
            await this.sleep(500);
            attempts++;
        }
        
        throw new Error('Services failed to load within timeout');
    }

    async checkAuthenticationWithRetry() {
        for (let i = 0; i <= this.maxRetries; i++) {
            try {
                const isAuthenticated = await window.authManager.checkAuthStatus();
                return isAuthenticated;
            } catch (error) {
                console.log(`🔄 Auth check attempt ${i + 1}/${this.maxRetries + 1} failed:`, error.message);
                
                if (i === this.maxRetries) {
                    console.log('❌ All auth check attempts failed, proceeding to login');
                    return false;
                }
                
                // Wait before retry
                await this.sleep(1000 * (i + 1));
            }
        }
        return false;
    }

    showMainApp() {
        this.hideLoadingScreen();
        if (window.authManager) {
            window.authManager.showMainApp();
        }
    }

    showLoginScreen() {
        this.hideLoadingScreen();
        if (window.authManager) {
            window.authManager.showLoginScreen();
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            if (window.uiManager?.fadeOut) {
                window.uiManager.fadeOut(loadingScreen, 500);
            } else {
                loadingScreen.style.display = 'none';
            }
        }
    }

    async handleInitializationError(error) {
        console.error('🔥 Initialization error:', error);
        
        this.retryCount++;
        
        if (this.retryCount <= this.maxRetries) {
            this.updateLoadingMessage(`Initialization failed. Retrying... (${this.retryCount}/${this.maxRetries})`);
            
            // Wait before retry
            await this.sleep(2000);
            
            // Reset initialization flag and retry
            this.isInitialized = false;
            this.initializeApp();
        } else {
            // Show error screen
            this.showErrorScreen(error.message);
        }
    }

    showErrorScreen(errorMessage) {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="logo">❌ ERROR</div>
                <div class="loading-text">Initialization Failed</div>
                <div class="connection-info">
                    <div style="color: #fee2e2; background: rgba(239, 68, 68, 0.2); padding: 15px; border-radius: 12px; margin-bottom: 20px;">
                        ${this.escapeHtml(errorMessage)}
                    </div>
                    <div class="server-url">http://103.122.85.61:4000</div>
                </div>
                <button class="redirect-button" onclick="location.reload()">
                    🔄 Retry
                </button>
                <button class="redirect-button" onclick="wizoneApp.showOfflineMode()" style="margin-top: 10px;">
                    📱 Continue Offline
                </button>
            `;
        }
    }

    showOfflineMode() {
        window.apiService?.showToast('Running in offline mode. Some features may not work.', 'error');
        
        // Try to load cached user data
        const cachedUser = localStorage.getItem('currentUser');
        if (cachedUser) {
            try {
                window.authManager.currentUser = JSON.parse(cachedUser);
                this.showMainApp();
                return;
            } catch (error) {
                console.error('Failed to parse cached user:', error);
            }
        }
        
        // Fall back to login screen
        this.showLoginScreen();
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // App lifecycle methods
    onPause() {
        console.log('📱 App paused');
        // Save any pending data
        this.saveAppState();
    }

    onResume() {
        console.log('📱 App resumed');
        // Refresh data if needed
        if (window.authManager?.isAuthenticated()) {
            window.taskManager?.loadTasks();
        }
    }

    onOnline() {
        console.log('📶 Connection restored');
        if (window.authManager?.isAuthenticated()) {
            // Sync data when connection is restored
            setTimeout(() => {
                window.taskManager?.syncTasks();
            }, 1000);
        }
    }

    onOffline() {
        console.log('📵 Connection lost');
        window.apiService?.showToast('Connection lost. Some features may not work.', 'error');
    }

    saveAppState() {
        try {
            const appState = {
                lastActive: Date.now(),
                version: '3.0',
                user: window.authManager?.getCurrentUser()
            };
            localStorage.setItem('wizoneAppState', JSON.stringify(appState));
        } catch (error) {
            console.error('Failed to save app state:', error);
        }
    }

    loadAppState() {
        try {
            const appState = localStorage.getItem('wizoneAppState');
            return appState ? JSON.parse(appState) : null;
        } catch (error) {
            console.error('Failed to load app state:', error);
            return null;
        }
    }

    // Debug and development helpers
    enableDebugMode() {
        console.log('🐛 Debug mode enabled');
        if (window.uiManager) {
            window.uiManager.enableDebugMode();
        }
        
        // Add debug info to UI
        document.body.addEventListener('click', (e) => {
            if (e.ctrlKey || e.metaKey) {
                console.log('Debug click:', e.target);
            }
        });
    }

    getAppInfo() {
        return {
            version: '3.0',
            initialized: this.isInitialized,
            retryCount: this.retryCount,
            services: {
                apiService: !!window.apiService,
                authManager: !!window.authManager,
                taskManager: !!window.taskManager,
                uiManager: !!window.uiManager
            },
            user: window.authManager?.getCurrentUser(),
            tasks: window.taskManager?.tasks?.length || 0,
            deviceInfo: window.uiManager?.getDeviceInfo()
        };
    }
}

// Global app instance
window.wizoneApp = new WizoneApp();

// Global event listeners for app lifecycle
document.addEventListener('pause', () => window.wizoneApp.onPause(), false);
document.addEventListener('resume', () => window.wizoneApp.onResume(), false);
document.addEventListener('online', () => window.wizoneApp.onOnline(), false);
document.addEventListener('offline', () => window.wizoneApp.onOffline(), false);

// Global functions for debugging
function enableDebug() {
    window.wizoneApp.enableDebugMode();
}

function getAppInfo() {
    return window.wizoneApp.getAppInfo();
}

function testConnection() {
    return window.apiService?.getCurrentUser();
}

// Log app start
console.log('🚀 Wizone Mobile App v3.0 - Starting...');
console.log('📱 User Agent:', navigator.userAgent);
console.log('🌐 Online Status:', navigator.onLine);
console.log('📊 Screen:', screen.width + 'x' + screen.height);
console.log('🔗 Target Server: http://103.122.85.61:4000');

// Auto-enable debug mode in development
if (location.hostname === 'localhost' || location.protocol === 'file:') {
    setTimeout(() => {
        window.wizoneApp.enableDebugMode();
    }, 3000);
}