// Authentication and user management for Wizone Professional
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.loginAttempts = 0;
        this.maxLoginAttempts = CONFIG.SECURITY.MAX_LOGIN_ATTEMPTS;
        this.lockoutTime = CONFIG.SECURITY.LOCKOUT_TIME;
        
        this.initializeAuth();
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log('🔐 Auth Manager initialized');
        }
    }

    // Initialize authentication state
    async initializeAuth() {
        const token = this.getStoredToken();
        const user = this.getStoredUser();
        
        if (token && user) {
            try {
                // Verify token is still valid
                const validUser = await this.verifyToken();
                if (validUser) {
                    this.setAuthenticatedUser(validUser);
                    if (CONFIG.DEV.CONSOLE_LOGS) {
                        console.log('✅ User authenticated from stored token');
                    }
                } else {
                    this.clearStoredAuth();
                }
            } catch (error) {
                if (CONFIG.DEV.CONSOLE_LOGS) {
                    console.log('❌ Stored token invalid, clearing auth');
                }
                this.clearStoredAuth();
            }
        }
    }

    // Get stored authentication token
    getStoredToken() {
        return localStorage.getItem(CONFIG.SECURITY.TOKEN_STORAGE_KEY);
    }

    // Get stored user data
    getStoredUser() {
        const userData = localStorage.getItem(CONFIG.SECURITY.USER_STORAGE_KEY);
        return userData ? JSON.parse(userData) : null;
    }

    // Clear stored authentication data
    clearStoredAuth() {
        localStorage.removeItem(CONFIG.SECURITY.TOKEN_STORAGE_KEY);
        localStorage.removeItem(CONFIG.SECURITY.USER_STORAGE_KEY);
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    // Set authenticated user
    setAuthenticatedUser(user) {
        this.currentUser = user;
        this.isAuthenticated = true;
        this.resetLoginAttempts();
        
        // Store user data
        localStorage.setItem(CONFIG.SECURITY.USER_STORAGE_KEY, JSON.stringify(user));
        
        // Update UI
        this.updateAuthUI(true);
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log('👤 User authenticated:', user.name || user.email);
        }
    }

    // Verify current token with server
    async verifyToken() {
        try {
            if (!window.DatabaseManager) {
                throw new Error('Database manager not available');
            }
            
            return await window.DatabaseManager.getCurrentUser();
        } catch (error) {
            throw error;
        }
    }

    // Login with credentials
    async login(credentials) {
        try {
            // Check if locked out
            if (this.isLockedOut()) {
                const timeLeft = this.getLockoutTimeRemaining();
                throw new Error(`Too many failed attempts. Try again in ${Math.ceil(timeLeft / 60000)} minutes.`);
            }

            // Validate credentials format
            this.validateCredentials(credentials);

            // Show loading state
            this.showLoginLoading(true);

            // Attempt login
            const response = await window.DatabaseManager.login(credentials);
            
            if (response.success && response.user) {
                this.setAuthenticatedUser(response.user);
                this.showToast('Login successful!', 'success');
                
                // Navigate to dashboard
                this.navigateToDashboard();
                
                return response;
            } else {
                throw new Error(response.message || 'Login failed');
            }

        } catch (error) {
            this.handleLoginError(error);
            throw error;
        } finally {
            this.showLoginLoading(false);
        }
    }

    // Validate credentials format
    validateCredentials(credentials) {
        if (!credentials.email || !credentials.password) {
            throw new Error('Email and password are required');
        }

        if (!this.isValidEmail(credentials.email)) {
            throw new Error('Please enter a valid email address');
        }

        if (credentials.password.length < CONFIG.SECURITY.MIN_PASSWORD_LENGTH) {
            throw new Error(`Password must be at least ${CONFIG.SECURITY.MIN_PASSWORD_LENGTH} characters long`);
        }
    }

    // Email validation
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Handle login errors
    handleLoginError(error) {
        this.loginAttempts++;
        
        if (error.message.includes('Invalid credentials') || error.message.includes('401')) {
            this.showToast('Invalid email or password', 'error');
        } else if (error.message.includes('account locked') || error.message.includes('locked')) {
            this.showToast('Account temporarily locked. Contact support.', 'error');
        } else if (error.message.includes('network') || !navigator.onLine) {
            this.showToast('No internet connection. Please check your network.', 'error');
        } else {
            this.showToast(error.message || 'Login failed. Please try again.', 'error');
        }

        // Lock account if too many attempts
        if (this.loginAttempts >= this.maxLoginAttempts) {
            this.lockAccount();
        }

        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.error('❌ Login error:', error.message);
        }
    }

    // Lock account temporarily
    lockAccount() {
        const lockUntil = Date.now() + this.lockoutTime;
        localStorage.setItem('wizone_lockout', lockUntil.toString());
        
        this.showToast(
            `Account locked for ${this.lockoutTime / 60000} minutes due to multiple failed attempts.`,
            'error',
            8000
        );
    }

    // Check if account is locked out
    isLockedOut() {
        const lockUntil = localStorage.getItem('wizone_lockout');
        if (!lockUntil) return false;
        
        const lockTime = parseInt(lockUntil);
        if (Date.now() < lockTime) {
            return true;
        } else {
            // Clear expired lockout
            localStorage.removeItem('wizone_lockout');
            return false;
        }
    }

    // Get remaining lockout time
    getLockoutTimeRemaining() {
        const lockUntil = localStorage.getItem('wizone_lockout');
        if (!lockUntil) return 0;
        
        const lockTime = parseInt(lockUntil);
        return Math.max(0, lockTime - Date.now());
    }

    // Reset login attempts
    resetLoginAttempts() {
        this.loginAttempts = 0;
        localStorage.removeItem('wizone_lockout');
    }

    // Logout user
    async logout() {
        try {
            // Show loading
            this.showToast('Logging out...', 'info');
            
            // Attempt server logout
            if (window.DatabaseManager) {
                await window.DatabaseManager.logout();
            }
        } catch (error) {
            if (CONFIG.DEV.CONSOLE_LOGS) {
                console.warn('Logout request failed:', error.message);
            }
        } finally {
            // Clear local auth state regardless of server response
            this.clearStoredAuth();
            this.updateAuthUI(false);
            this.navigateToLogin();
            
            this.showToast('Logged out successfully', 'success');
            
            if (CONFIG.DEV.CONSOLE_LOGS) {
                console.log('👋 User logged out');
            }
        }
    }

    // Update authentication UI
    updateAuthUI(isAuthenticated) {
        // Update login screen visibility
        const loginScreen = document.getElementById('loginScreen');
        const dashboardScreen = document.getElementById('dashboardScreen');
        
        if (loginScreen && dashboardScreen) {
            if (isAuthenticated) {
                loginScreen.style.display = 'none';
                dashboardScreen.style.display = 'block';
                
                // Update user info in dashboard
                this.updateUserInfo();
            } else {
                loginScreen.style.display = 'block';
                dashboardScreen.style.display = 'none';
            }
        }

        // Update navigation menu
        const userMenu = document.getElementById('userMenu');
        if (userMenu && this.currentUser) {
            userMenu.querySelector('.user-name').textContent = this.currentUser.name || this.currentUser.email;
            userMenu.querySelector('.user-role').textContent = this.currentUser.role || 'User';
        }
    }

    // Update user information in UI
    updateUserInfo() {
        if (!this.currentUser) return;

        // Update welcome message
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.textContent = `Welcome back, ${this.currentUser.name || this.currentUser.email}!`;
        }

        // Update user avatar
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            if (this.currentUser.avatar) {
                userAvatar.src = this.currentUser.avatar;
            } else {
                // Generate avatar from initials
                userAvatar.src = this.generateAvatarFromInitials(this.currentUser.name || this.currentUser.email);
            }
        }

        // Update user stats
        this.updateUserStats();
    }

    // Generate avatar from user initials
    generateAvatarFromInitials(name) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 100;
        canvas.height = 100;

        // Background color based on name hash
        const hash = this.simpleHash(name);
        const hue = hash % 360;
        ctx.fillStyle = `hsl(${hue}, 60%, 50%)`;
        ctx.fillRect(0, 0, 100, 100);

        // Text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        ctx.fillText(initials, 50, 50);

        return canvas.toDataURL();
    }

    // Simple hash function for consistent colors
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    // Update user statistics
    async updateUserStats() {
        try {
            if (!window.DatabaseManager) return;

            // Get user tasks for statistics
            const tasks = await window.DatabaseManager.getTasks();
            
            const stats = {
                total: tasks.length,
                pending: tasks.filter(t => t.status === 'pending').length,
                in_progress: tasks.filter(t => t.status === 'in_progress').length,
                completed: tasks.filter(t => t.status === 'completed').length
            };

            // Update stats in UI
            Object.keys(stats).forEach(key => {
                const element = document.getElementById(`stat-${key}`);
                if (element) {
                    element.textContent = stats[key];
                }
            });

        } catch (error) {
            if (CONFIG.DEV.CONSOLE_LOGS) {
                console.warn('Failed to update user stats:', error);
            }
        }
    }

    // Navigation methods
    navigateToLogin() {
        const loginScreen = document.getElementById('loginScreen');
        const dashboardScreen = document.getElementById('dashboardScreen');
        
        if (loginScreen) loginScreen.style.display = 'block';
        if (dashboardScreen) dashboardScreen.style.display = 'none';
        
        // Clear any form data
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.reset();
        }
    }

    navigateToDashboard() {
        const loginScreen = document.getElementById('loginScreen');
        const dashboardScreen = document.getElementById('dashboardScreen');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboardScreen) dashboardScreen.style.display = 'block';
        
        // Load dashboard data
        if (window.TaskManager) {
            window.TaskManager.loadTasks();
        }
    }

    // Show/hide login loading state
    showLoginLoading(show) {
        const loginButton = document.getElementById('loginButton');
        const loginSpinner = document.getElementById('loginSpinner');
        
        if (loginButton) {
            loginButton.disabled = show;
            loginButton.textContent = show ? 'Signing in...' : 'Sign In';
        }
        
        if (loginSpinner) {
            loginSpinner.style.display = show ? 'block' : 'none';
        }
    }

    // Session management
    startSessionTimer() {
        const sessionTimeout = CONFIG.SECURITY.SESSION_TIMEOUT;
        if (sessionTimeout > 0) {
            setTimeout(() => {
                this.showSessionExpiredDialog();
            }, sessionTimeout);
        }
    }

    showSessionExpiredDialog() {
        if (window.UIManager) {
            window.UIManager.showModal({
                title: 'Session Expired',
                message: 'Your session has expired. Please login again.',
                buttons: [{
                    text: 'Login Again',
                    primary: true,
                    action: () => this.logout()
                }]
            });
        }
    }

    // Password strength validation
    validatePasswordStrength(password) {
        const requirements = {
            length: password.length >= CONFIG.SECURITY.MIN_PASSWORD_LENGTH,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const strength = Object.values(requirements).filter(Boolean).length;
        
        return {
            requirements,
            strength,
            isValid: requirements.length && strength >= 3
        };
    }

    // Biometric authentication (if supported)
    async authenticateWithBiometrics() {
        if ('navigator' in window && 'credentials' in navigator) {
            try {
                const credential = await navigator.credentials.create({
                    publicKey: {
                        challenge: new Uint8Array(32),
                        rp: { name: "Wizone Task Manager" },
                        user: {
                            id: new Uint8Array(16),
                            name: this.currentUser?.email || "user@wizone.com",
                            displayName: this.currentUser?.name || "User"
                        },
                        pubKeyCredParams: [{ alg: -7, type: "public-key" }]
                    }
                });
                
                if (credential) {
                    this.showToast('Biometric authentication successful!', 'success');
                    return true;
                }
            } catch (error) {
                if (CONFIG.DEV.CONSOLE_LOGS) {
                    console.log('Biometric authentication not available:', error);
                }
            }
        }
        return false;
    }

    // Utility methods
    showToast(message, type = 'info', duration = CONFIG.UI.TOAST_DURATION) {
        if (window.UIManager) {
            window.UIManager.showToast(message, type, duration);
        }
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLoginSubmit(e);
            });
        }

        // Logout button
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                this.logout();
            });
        }

        // Password visibility toggle
        const passwordToggle = document.getElementById('passwordToggle');
        if (passwordToggle) {
            passwordToggle.addEventListener('click', this.togglePasswordVisibility.bind(this));
        }
    }

    // Handle login form submission
    async handleLoginSubmit(event) {
        const formData = new FormData(event.target);
        const credentials = {
            email: formData.get('email')?.trim(),
            password: formData.get('password'),
            remember: formData.get('remember') === 'on'
        };

        try {
            await this.login(credentials);
        } catch (error) {
            // Error handling is done in login method
        }
    }

    // Toggle password visibility
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.getElementById('passwordToggleIcon');
        
        if (passwordInput && toggleIcon) {
            const isVisible = passwordInput.type === 'text';
            passwordInput.type = isVisible ? 'password' : 'text';
            toggleIcon.textContent = isVisible ? '👁️' : '👁️‍🗨️';
        }
    }

    // Check authentication status
    isLoggedIn() {
        return this.isAuthenticated && this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Initialize auth manager
    init() {
        this.initializeEventListeners();
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log('🚀 Auth Manager ready');
        }
    }
}

// Initialize global auth manager
window.AuthManager = new AuthManager();
window.AuthManager.init();