// Main application controller for Wizone Professional Mobile App
class WizoneApp {
    constructor() {
        this.version = '1.0.0';
        this.isInitialized = false;
        this.isOnline = navigator.onLine;
        this.appState = 'loading';
        this.initStartTime = performance.now();
        
        // App modules
        this.modules = {
            config: window.CONFIG,
            ui: null,
            auth: null,
            database: null,
            tasks: null
        };
        
        // Performance metrics
        this.metrics = {
            initTime: 0,
            loadTime: 0,
            renderTime: 0
        };
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log('🚀 Wizone Professional App initializing...');
        }
    }

    // Initialize the application
    async init() {
        if (this.isInitialized) {
            console.warn('App already initialized');
            return;
        }

        try {
            this.appState = 'initializing';
            this.showSplashScreen();
            
            // Step 1: Initialize core modules
            await this.initializeCoreModules();
            
            // Step 2: Check authentication
            await this.checkAuthentication();
            
            // Step 3: Setup event listeners
            this.setupEventListeners();
            
            // Step 4: Initialize UI components
            await this.initializeUI();
            
            // Step 5: Load initial data
            await this.loadInitialData();
            
            // Step 6: Setup service worker (if supported)
            await this.setupServiceWorker();
            
            // Step 7: Finalize initialization
            this.finalizeInitialization();
            
        } catch (error) {
            this.handleInitializationError(error);
        }
    }

    // Show splash screen during initialization
    showSplashScreen() {
        const splashScreen = document.getElementById('splashScreen');
        if (splashScreen) {
            splashScreen.style.display = 'flex';
            
            // Add loading animation
            const progressBar = splashScreen.querySelector('.progress-bar');
            if (progressBar) {
                this.animateProgressBar(progressBar);
            }
        }
    }

    // Animate progress bar during loading
    animateProgressBar(progressBar) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90; // Don't complete until actually done
            
            progressBar.style.width = `${progress}%`;
            
            if (progress >= 90) {
                clearInterval(interval);
            }
        }, 200);
        
        // Store interval reference to complete it later
        this.progressInterval = interval;
    }

    // Complete progress bar animation
    completeProgressBar() {
        const splashScreen = document.getElementById('splashScreen');
        const progressBar = splashScreen?.querySelector('.progress-bar');
        
        if (progressBar) {
            progressBar.style.width = '100%';
        }
    }

    // Hide splash screen
    hideSplashScreen() {
        const splashScreen = document.getElementById('splashScreen');
        if (splashScreen) {
            splashScreen.classList.add('fade-out');
            
            setTimeout(() => {
                splashScreen.style.display = 'none';
            }, 500);
        }
    }

    // Initialize core modules
    async initializeCoreModules() {
        try {
            // Initialize UI Manager first
            if (window.UIManager) {
                await window.UIManager.init();
                this.modules.ui = window.UIManager;
                this.updateLoadingProgress('UI initialized', 20);
            }

            // Initialize Database Manager
            if (window.DatabaseManager) {
                await window.DatabaseManager.init();
                this.modules.database = window.DatabaseManager;
                this.updateLoadingProgress('Database connected', 40);
            }

            // Initialize Auth Manager
            if (window.AuthManager) {
                await window.AuthManager.init();
                this.modules.auth = window.AuthManager;
                this.updateLoadingProgress('Authentication ready', 60);
            }

            // Initialize Task Manager
            if (window.TaskManager) {
                await window.TaskManager.init();
                this.modules.tasks = window.TaskManager;
                this.updateLoadingProgress('Task manager ready', 80);
            }

            if (CONFIG.DEV.CONSOLE_LOGS) {
                console.log('✅ Core modules initialized');
            }

        } catch (error) {
            throw new Error(`Failed to initialize core modules: ${error.message}`);
        }
    }

    // Check authentication status
    async checkAuthentication() {
        try {
            if (this.modules.auth) {
                // Auth manager handles token verification internally
                if (this.modules.auth.isLoggedIn()) {
                    this.appState = 'authenticated';
                    
                    if (CONFIG.DEV.CONSOLE_LOGS) {
                        console.log('👤 User is authenticated');
                    }
                } else {
                    this.appState = 'unauthenticated';
                    
                    if (CONFIG.DEV.CONSOLE_LOGS) {
                        console.log('🔐 User needs to login');
                    }
                }
            }
        } catch (error) {
            console.warn('Authentication check failed:', error);
            this.appState = 'unauthenticated';
        }
    }

    // Setup global event listeners
    setupEventListeners() {
        // Network status changes
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
        
        // App lifecycle events
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        
        // Error handling
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handleUnhandledPromiseRejection.bind(this));
        
        // Performance monitoring
        if (CONFIG.DEV.PERFORMANCE_LOGS) {
            this.setupPerformanceMonitoring();
        }
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log('👂 Event listeners setup complete');
        }
    }

    // Initialize UI components
    async initializeUI() {
        try {
            // Setup navigation
            this.setupNavigation();
            
            // Initialize forms
            this.initializeForms();
            
            // Setup modal handlers
            this.setupModalHandlers();
            
            // Initialize search and filters
            this.initializeSearchAndFilters();
            
            // Setup touch interactions
            this.setupTouchInteractions();
            
            if (CONFIG.DEV.CONSOLE_LOGS) {
                console.log('🎨 UI components initialized');
            }
            
        } catch (error) {
            throw new Error(`Failed to initialize UI: ${error.message}`);
        }
    }

    // Load initial application data
    async loadInitialData() {
        try {
            if (this.appState === 'authenticated' && this.modules.tasks) {
                // Load user tasks
                await this.modules.tasks.loadTasks(false);
                
                if (CONFIG.DEV.CONSOLE_LOGS) {
                    console.log('📋 Initial data loaded');
                }
            }
            
            this.updateLoadingProgress('Ready!', 100);
            
        } catch (error) {
            console.warn('Failed to load initial data:', error);
            // Don't throw - app can still function without initial data
        }
    }

    // Setup service worker for offline functionality
    async setupServiceWorker() {
        if ('serviceWorker' in navigator && CONFIG.FEATURES.SERVICE_WORKER) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                
                if (CONFIG.DEV.CONSOLE_LOGS) {
                    console.log('📡 Service Worker registered:', registration);
                }
                
                // Listen for service worker updates
                registration.addEventListener('updatefound', () => {
                    this.handleServiceWorkerUpdate(registration);
                });
                
            } catch (error) {
                console.warn('Service Worker registration failed:', error);
            }
        }
    }

    // Handle service worker updates
    handleServiceWorkerUpdate(registration) {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                this.showUpdateAvailableNotification();
            }
        });
    }

    // Show update available notification
    showUpdateAvailableNotification() {
        if (this.modules.ui) {
            this.modules.ui.showModal({
                title: 'Update Available',
                message: 'A new version of the app is available. Refresh to update?',
                type: 'info',
                buttons: [
                    {
                        text: 'Later',
                        action: () => {}
                    },
                    {
                        text: 'Refresh Now',
                        primary: true,
                        action: () => window.location.reload()
                    }
                ]
            });
        }
    }

    // Finalize application initialization
    finalizeInitialization() {
        // Calculate initialization time
        this.metrics.initTime = performance.now() - this.initStartTime;
        
        // Complete progress bar
        this.completeProgressBar();
        
        // Hide splash screen after a brief delay
        setTimeout(() => {
            this.hideSplashScreen();
            this.showMainInterface();
        }, 500);
        
        // Mark as initialized
        this.isInitialized = true;
        this.appState = this.modules.auth?.isLoggedIn() ? 'ready' : 'login_required';
        
        // Log success
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log(`🎉 Wizone Professional App initialized successfully in ${this.metrics.initTime.toFixed(2)}ms`);
            this.logAppInfo();
        }
        
        // Track app launch
        this.trackAppLaunch();
    }

    // Show main application interface
    showMainInterface() {
        if (this.appState === 'ready') {
            // Show dashboard
            const dashboardScreen = document.getElementById('dashboardScreen');
            if (dashboardScreen) {
                dashboardScreen.style.display = 'block';
            }
        } else {
            // Show login screen
            const loginScreen = document.getElementById('loginScreen');
            if (loginScreen) {
                loginScreen.style.display = 'block';
            }
        }
    }

    // Handle initialization errors
    handleInitializationError(error) {
        console.error('❌ App initialization failed:', error);
        
        // Hide splash screen
        this.hideSplashScreen();
        
        // Show error screen
        this.showErrorScreen(error);
        
        // Track error
        this.trackError('initialization_failed', error);
    }

    // Show error screen
    showErrorScreen(error) {
        const errorScreen = document.createElement('div');
        errorScreen.className = 'error-screen';
        errorScreen.innerHTML = `
            <div class="error-content">
                <div class="error-icon">⚠️</div>
                <h2>Unable to Start App</h2>
                <p>We encountered an error while starting the application.</p>
                <div class="error-details">
                    <strong>Error:</strong> ${error.message}
                </div>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="location.reload()">
                        🔄 Retry
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorScreen);
    }

    // Network event handlers
    handleOnline() {
        this.isOnline = true;
        
        if (this.modules.ui) {
            this.modules.ui.showToast('Connection restored', 'success');
        }
        
        // Sync pending data
        if (this.modules.database) {
            this.modules.database.processSyncQueue();
        }
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log('📡 App is online');
        }
    }

    handleOffline() {
        this.isOnline = false;
        
        if (this.modules.ui) {
            this.modules.ui.showToast('Working offline', 'warning', 5000);
        }
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log('📡 App is offline');
        }
    }

    // App lifecycle handlers
    handleVisibilityChange() {
        if (document.hidden) {
            // App hidden - pause timers, save state
            this.onAppPause();
        } else {
            // App visible - resume timers, refresh data
            this.onAppResume();
        }
    }

    onAppPause() {
        // Pause auto-refresh
        if (this.modules.tasks) {
            this.modules.tasks.stopAutoRefresh();
        }
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log('⏸️ App paused');
        }
    }

    onAppResume() {
        // Resume auto-refresh
        if (this.modules.tasks) {
            this.modules.tasks.startAutoRefresh();
            
            // Refresh data if user is authenticated
            if (this.modules.auth?.isLoggedIn()) {
                this.modules.tasks.loadTasks(false);
            }
        }
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log('▶️ App resumed');
        }
    }

    handleBeforeUnload(event) {
        // Check for unsaved data
        if (this.modules.database?.syncQueue.length > 0) {
            event.preventDefault();
            event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return event.returnValue;
        }
    }

    // Error handlers
    handleGlobalError(event) {
        const error = event.error || event;
        console.error('Global error:', error);
        
        // Track error
        this.trackError('global_error', error);
        
        // Show user-friendly error message
        if (this.modules.ui) {
            this.modules.ui.showToast('An unexpected error occurred', 'error');
        }
    }

    handleUnhandledPromiseRejection(event) {
        console.error('Unhandled promise rejection:', event.reason);
        
        // Track error
        this.trackError('unhandled_promise', event.reason);
        
        // Prevent default browser handling
        event.preventDefault();
    }

    // Navigation setup
    setupNavigation() {
        // Bottom navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToSection(item.dataset.section);
            });
        });
        
        // Back button handling
        window.addEventListener('popstate', (e) => {
            this.handleBackNavigation(e);
        });
    }

    // Navigate to app section
    navigateToSection(section) {
        // Update navigation state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });
        
        // Show/hide sections
        document.querySelectorAll('.app-section').forEach(sectionEl => {
            sectionEl.classList.toggle('active', sectionEl.dataset.section === section);
        });
        
        // Update browser history
        history.pushState({ section }, '', `#${section}`);
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log(`📍 Navigated to: ${section}`);
        }
    }

    // Handle back navigation
    handleBackNavigation(event) {
        const state = event.state;
        if (state && state.section) {
            this.navigateToSection(state.section);
        }
    }

    // Form initialization
    initializeForms() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLoginSubmit.bind(this));
        }
        
        // Task update form
        const taskUpdateForm = document.getElementById('taskUpdateForm');
        if (taskUpdateForm) {
            taskUpdateForm.addEventListener('submit', this.handleTaskUpdateSubmit.bind(this));
        }
        
        // File upload handling
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', this.handleFileInputChange.bind(this));
        });
    }

    // Modal handlers setup
    setupModalHandlers() {
        // Task modal
        const taskModal = document.getElementById('taskModal');
        if (taskModal) {
            // Close modal when clicking outside
            taskModal.addEventListener('click', (e) => {
                if (e.target === taskModal) {
                    this.closeModal('taskModal');
                }
            });
            
            // Close button
            const closeButton = taskModal.querySelector('.close-modal');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    this.closeModal('taskModal');
                });
            }
        }
    }

    // Search and filters initialization
    initializeSearchAndFilters() {
        // Search input with debouncing
        const searchInput = document.getElementById('taskSearch');
        if (searchInput && this.modules.ui) {
            const debouncedSearch = this.modules.ui.debounce((value) => {
                if (this.modules.tasks) {
                    this.modules.tasks.handleSearch(value);
                }
            }, 300);
            
            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        }
        
        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.modules.tasks) {
                    this.modules.tasks.handleFilterChange(btn.dataset.filter);
                }
            });
        });
    }

    // Touch interactions setup
    setupTouchInteractions() {
        // Enable smooth scrolling
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // Prevent zoom on double tap for certain elements
        const preventZoomElements = document.querySelectorAll('.no-zoom');
        preventZoomElements.forEach(el => {
            el.addEventListener('touchend', (e) => {
                e.preventDefault();
            });
        });
    }

    // Form handlers
    async handleLoginSubmit(event) {
        event.preventDefault();
        
        if (!this.modules.auth) {
            console.error('Auth module not available');
            return;
        }
        
        // Form is handled by AuthManager
        // This is just for additional logging/tracking
        this.trackEvent('login_attempt');
    }

    async handleTaskUpdateSubmit(event) {
        event.preventDefault();
        
        if (!this.modules.tasks) {
            console.error('Task module not available');
            return;
        }
        
        // Form is handled by TaskManager
        this.trackEvent('task_update_attempt');
    }

    handleFileInputChange(event) {
        const files = event.target.files;
        if (files.length > 0 && this.modules.tasks) {
            // File handling is done by TaskManager
            this.trackEvent('file_upload_attempt', { fileCount: files.length });
        }
    }

    // Modal management
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    }

    // Performance monitoring setup
    setupPerformanceMonitoring() {
        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            const perfObserver = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (entry.duration > 50) { // Log tasks longer than 50ms
                        console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`);
                    }
                }
            });
            
            perfObserver.observe({ entryTypes: ['longtask'] });
        }
        
        // Monitor memory usage (if available)
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
                    console.warn('⚠️ High memory usage detected');
                }
            }, 30000); // Check every 30 seconds
        }
    }

    // Update loading progress
    updateLoadingProgress(message, percentage) {
        const splashScreen = document.getElementById('splashScreen');
        if (splashScreen) {
            const statusText = splashScreen.querySelector('.loading-status');
            const progressBar = splashScreen.querySelector('.progress-bar');
            
            if (statusText) statusText.textContent = message;
            if (progressBar) progressBar.style.width = `${percentage}%`;
        }
    }

    // Logging and analytics
    logAppInfo() {
        console.log('📱 App Information:', {
            version: this.version,
            modules: Object.keys(this.modules),
            metrics: this.metrics,
            capabilities: window.deviceCapabilities,
            config: {
                environment: CONFIG.DEV.ENABLED ? 'development' : 'production',
                serverUrl: CONFIG.SERVER.BASE_URL
            }
        });
    }

    trackAppLaunch() {
        this.trackEvent('app_launch', {
            version: this.version,
            initTime: this.metrics.initTime,
            online: this.isOnline,
            authenticated: this.appState === 'ready'
        });
    }

    trackEvent(eventName, properties = {}) {
        // In a real app, this would send to analytics service
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log(`📊 Event: ${eventName}`, properties);
        }
        
        // Store locally for offline analytics
        const events = JSON.parse(localStorage.getItem('wizone_analytics') || '[]');
        events.push({
            event: eventName,
            properties,
            timestamp: new Date().toISOString(),
            userId: this.modules.auth?.getCurrentUser()?.id
        });
        
        // Keep only last 100 events
        if (events.length > 100) {
            events.splice(0, events.length - 100);
        }
        
        localStorage.setItem('wizone_analytics', JSON.stringify(events));
    }

    trackError(errorType, error) {
        this.trackEvent('error_occurred', {
            type: errorType,
            message: error.message || String(error),
            stack: error.stack,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        });
    }

    // Public API methods
    getAppState() {
        return {
            version: this.version,
            state: this.appState,
            isInitialized: this.isInitialized,
            isOnline: this.isOnline,
            modules: Object.keys(this.modules).filter(key => this.modules[key] !== null)
        };
    }

    // Restart application
    restart() {
        if (this.modules.ui) {
            this.modules.ui.showConfirmation(
                'Restart App',
                'Are you sure you want to restart the application?',
                () => {
                    window.location.reload();
                }
            );
        } else {
            window.location.reload();
        }
    }

    // Clean shutdown
    shutdown() {
        console.log('🛑 App shutting down...');
        
        // Stop auto-refresh
        if (this.modules.tasks) {
            this.modules.tasks.stopAutoRefresh();
        }
        
        // Save any pending data
        if (this.modules.database) {
            this.modules.database.processSyncQueue();
        }
        
        // Clean up UI
        if (this.modules.ui) {
            this.modules.ui.destroy();
        }
        
        this.isInitialized = false;
    }
}

// Initialize the application
const WizoneApp_Instance = new WizoneApp();

// Auto-start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        WizoneApp_Instance.init();
    });
} else {
    WizoneApp_Instance.init();
}

// Make app instance globally available
window.WizoneApp = WizoneApp_Instance;

// Development helpers
if (CONFIG.DEV.ENABLED) {  
    window.appDebug = {
        getState: () => WizoneApp_Instance.getAppState(),
        getModules: () => WizoneApp_Instance.modules,
        getMetrics: () => WizoneApp_Instance.metrics,
        restart: () => WizoneApp_Instance.restart(),
        clearCache: () => {
            localStorage.clear();
            WizoneApp_Instance.restart();
        }
    };
    
    console.log('🛠️ Debug helpers available via window.appDebug');
}