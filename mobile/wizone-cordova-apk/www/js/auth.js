// Authentication Manager
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.loginForm = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.loginForm = document.getElementById('loginForm');
            if (this.loginForm) {
                this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            }

            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.handleLogout());
            }
        });
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const loginBtn = document.getElementById('loginBtn');
        const loginError = document.getElementById('loginError');
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) {
            this.showLoginError('Please enter both username and password');
            return;
        }

        // Show loading state
        this.setLoginLoading(true);
        this.hideLoginError();

        try {
            const response = await window.apiService.login(username, password);
            
            if (response && response.id) {
                this.currentUser = response;
                console.log('✅ Login successful:', response);
                
                // Store user data locally for offline access
                localStorage.setItem('currentUser', JSON.stringify(response));
                
                // Show success and transition to main app
                window.apiService.showToast('Login successful!', 'success');
                this.showMainApp();
            } else {
                throw new Error('Invalid login response');
            }
        } catch (error) {
            console.error('❌ Login failed:', error);
            this.showLoginError(error.message || 'Login failed. Please check your credentials.');
        } finally {
            this.setLoginLoading(false);
        }
    }

    async handleLogout() {
        try {
            await window.apiService.logout();
        } catch (error) {
            console.error('Logout error:', error);
            // Continue with logout even if server request fails
        }
        
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        window.apiService.showToast('Logged out successfully', 'success');
        this.showLoginScreen();
    }

    async checkAuthStatus() {
        // First check if we have stored user data
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                this.currentUser = JSON.parse(storedUser);
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                localStorage.removeItem('currentUser');
            }
        }

        try {
            // Verify with server
            const user = await window.apiService.getCurrentUser();
            if (user && user.id) {
                this.currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                return true;
            }
        } catch (error) {
            console.log('❌ Auth check failed:', error.message);
            // If server check fails but we have stored user, try to continue offline
            if (this.currentUser) {
                console.log('📱 Continuing with offline user data');
                return true;
            }
        }

        // Clear any invalid stored data
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        return false;
    }

    setLoginLoading(loading) {
        const loginBtn = document.getElementById('loginBtn');
        const btnText = loginBtn?.querySelector('.btn-text');
        const btnSpinner = loginBtn?.querySelector('.btn-spinner');

        if (loginBtn) {
            loginBtn.disabled = loading;
            if (loading) {
                loginBtn.classList.add('loading');
                if (btnText) btnText.style.display = 'none';
                if (btnSpinner) btnSpinner.style.display = 'inline';
            } else {
                loginBtn.classList.remove('loading');
                if (btnText) btnText.style.display = 'inline';
                if (btnSpinner) btnSpinner.style.display = 'none';
            }
        }
    }

    showLoginError(message) {
        const loginError = document.getElementById('loginError');
        if (loginError) {
            loginError.textContent = message;
            loginError.style.display = 'block';
        }
    }

    hideLoginError() {
        const loginError = document.getElementById('loginError');
        if (loginError) {
            loginError.style.display = 'none';
        }
    }

    showLoginScreen() {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.style.display = 'none');
        
        const loginScreen = document.getElementById('loginScreen');
        const loadingScreen = document.getElementById('loadingScreen');
        
        if (loginScreen) loginScreen.style.display = 'block';
        if (loadingScreen) loadingScreen.style.display = 'none';

        // Clear form
        const form = document.getElementById('loginForm');
        if (form) form.reset();
        this.hideLoginError();
    }

    showMainApp() {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.style.display = 'none');
        
        const mainScreen = document.getElementById('mainScreen');
        const loadingScreen = document.getElementById('loadingScreen');
        
        if (mainScreen) mainScreen.style.display = 'block';
        if (loadingScreen) loadingScreen.style.display = 'none';

        // Update header with user info
        this.updateUserInterface();
        
        // Load tasks
        if (window.taskManager) {
            window.taskManager.loadTasks();
        }
    }

    updateUserInterface() {
        if (!this.currentUser) return;

        const welcomeTitle = document.getElementById('welcomeTitle');
        const userRole = document.getElementById('userRole');

        if (welcomeTitle) {
            const firstName = this.currentUser.firstName || this.currentUser.username || 'User';
            welcomeTitle.textContent = `Welcome, ${firstName}`;
        }

        if (userRole) {
            const role = this.currentUser.role || 'field_engineer';
            userRole.textContent = role.replace('_', ' ').toUpperCase();
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }
}

// Create global auth manager instance
window.authManager = new AuthManager();