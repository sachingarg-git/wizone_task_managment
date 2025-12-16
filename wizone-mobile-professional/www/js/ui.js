// UI Manager for enhanced user interactions and interface management
class UIManager {
    constructor() {
        this.toasts = [];
        this.modals = [];
        this.isInitialized = false;
        this.currentTheme = 'professional';
        this.animations = {
            enabled: CONFIG.UI.ANIMATIONS_ENABLED,
            duration: CONFIG.UI.ANIMATION_SPEED
        };
        
        // Touch and gesture handling
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.lastTap = 0;
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log('🎨 UI Manager initialized');
        }
    }

    // Initialize UI Manager
    init() {
        if (this.isInitialized) return;
        
        this.createToastContainer();
        this.initializeGlobalEventListeners();
        this.initializeGestures();
        this.initializeKeyboardShortcuts();
        this.setupResponsiveHandling();
        this.initializeTheme();
        
        // Check for device capabilities
        this.detectDeviceCapabilities();
        
        this.isInitialized = true;
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log('🚀 UI Manager ready');
        }
    }

    // Create toast notification container
    createToastContainer() {
        if (document.getElementById('toastContainer')) return;
        
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Show toast notification
    showToast(message, type = 'info', duration = CONFIG.UI.TOAST_DURATION) {
        const toast = this.createToastElement(message, type, duration);
        const container = document.getElementById('toastContainer');
        
        if (container) {
            container.appendChild(toast);
            this.toasts.push(toast);
            
            // Animate in
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });
            
            // Auto remove
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
            
            // Add haptic feedback for mobile
            this.triggerHapticFeedback('light');
        }
    }

    // Create toast element
    createToastElement(message, type, duration) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-message">${this.escapeHtml(message)}</div>
            <button class="toast-close" onclick="UIManager.removeToast(this.parentElement)">&times;</button>
        `;
        
        // Add click to dismiss
        toast.addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        return toast;
    }

    // Remove toast notification
    removeToast(toast) {
        if (!toast || !toast.parentElement) return;
        
        toast.classList.add('hide');
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
            
            const index = this.toasts.indexOf(toast);
            if (index > -1) {
                this.toasts.splice(index, 1);
            }
        }, 300);
    }

    // Show custom modal
    showModal(options = {}) {
        const modal = this.createModalElement(options);
        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        
        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
        
        this.modals.push(modal);
        
        // Add to modal stack
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
        
        return modal;
    }

    // Create modal element
    createModalElement(options) {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        
        const {
            title = 'Confirmation',
            message = '',
            buttons = [{ text: 'OK', primary: true }],
            type = 'info',
            closable = true
        } = options;
        
        const buttonHTML = buttons.map(btn => `
            <button class="btn ${btn.primary ? 'btn-primary' : 'btn-secondary'}" 
                    data-action="${btn.action || 'close'}">
                ${btn.text}
            </button>
        `).join('');
        
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    ${closable ? '<button class="modal-close">&times;</button>' : ''}
                    <div class="modal-header">
                        <div class="modal-icon modal-icon-${type}">
                            ${this.getModalIcon(type)}
                        </div>
                        <h3 class="modal-title">${this.escapeHtml(title)}</h3>
                    </div>
                    <div class="modal-body">
                        <p>${this.escapeHtml(message)}</p>
                    </div>
                    <div class="modal-actions">
                        ${buttonHTML}
                    </div>
                </div>
            </div>
        `;
        
        // Add button event listeners
        modal.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                
                if (action === 'close') {
                    this.closeModal(modal);
                } else if (typeof action === 'function') {
                    action();
                    this.closeModal(modal);
                }
            });
        });
        
        // Close button
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal(modal);
            });
        }
        
        return modal;
    }

    // Get modal icon based on type
    getModalIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️',
            'question': '❓'
        };
        return icons[type] || icons.info;
    }

    // Close modal
    closeModal(modal) {
        if (!modal) return;
        
        modal.classList.add('hide');
        
        setTimeout(() => {
            if (modal.parentElement) {
                modal.parentElement.removeChild(modal);
            }
            
            const index = this.modals.indexOf(modal);
            if (index > -1) {
                this.modals.splice(index, 1);
            }
            
            // Remove modal-open class if no modals are open
            if (this.modals.length === 0) {
                document.body.classList.remove('modal-open');
            }
        }, 300);
    }

    // Show confirmation dialog
    showConfirmation(title, message, onConfirm, onCancel = null) {
        return this.showModal({
            title,
            message,
            type: 'question',
            buttons: [
                {
                    text: 'Cancel',
                    action: onCancel || (() => {})
                },
                {
                    text: 'Confirm',
                    primary: true,
                    action: onConfirm
                }
            ]
        });
    }

    // Show loading overlay
    showLoading(message = 'Loading...') {
        let loader = document.getElementById('globalLoader');
        
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'globalLoader';
            loader.className = 'global-loader';
            loader.innerHTML = `
                <div class="loader-content">
                    <div class="loader-spinner"></div>
                    <div class="loader-message">${this.escapeHtml(message)}</div>
                </div>
            `;
            document.body.appendChild(loader);
        } else {
            loader.querySelector('.loader-message').textContent = message;
        }
        
        loader.style.display = 'flex';
        document.body.classList.add('loading');
        
        return loader;
    }

    // Hide loading overlay
    hideLoading() {
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.style.display = 'none';
            document.body.classList.remove('loading');
        }
    }

    // Animate element
    animateElement(element, animation, duration = this.animations.duration) {
        if (!this.animations.enabled) return Promise.resolve();
        
        return new Promise((resolve) => {
            element.style.animationDuration = `${duration}ms`;
            element.classList.add(`animate-${animation}`);
            
            const handleAnimationEnd = () => {
                element.classList.remove(`animate-${animation}`);
                element.removeEventListener('animationend', handleAnimationEnd);
                resolve();
            };
            
            element.addEventListener('animationend', handleAnimationEnd);
        });
    }

    // Smooth scroll to element
    scrollToElement(element, offset = 0) {
        if (!element) return;
        
        const elementPosition = element.offsetTop - offset;
        
        if ('scrollBehavior' in document.documentElement.style) {
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        } else {
            // Fallback for older browsers
            this.smoothScrollPolyfill(elementPosition);
        }
    }

    // Smooth scroll polyfill
    smoothScrollPolyfill(targetPosition) {
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 500;
        let start = null;
        
        const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const percentage = Math.min(progress / duration, 1);
            
            // Easing function
            const ease = percentage < 0.5 
                ? 2 * percentage * percentage 
                : -1 + (4 - 2 * percentage) * percentage;
            
            window.scrollTo(0, startPosition + distance * ease);
            
            if (progress < duration) {
                window.requestAnimationFrame(step);
            }
        };
        
        window.requestAnimationFrame(step);
    }

    // Initialize touch gestures
    initializeGestures() {
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        
        // Double tap detection
        document.addEventListener('touchend', this.handleDoubleTap.bind(this), { passive: true });
    }

    // Handle touch start
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }

    // Handle touch move
    handleTouchMove(e) {
        if (!this.touchStartX || !this.touchStartY) return;
        
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const diffX = this.touchStartX - touchX;
        const diffY = this.touchStartY - touchY;
        
        // Detect swipe direction
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (Math.abs(diffX) > 50) { // Minimum swipe distance
                if (diffX > 0) {
                    this.handleSwipeLeft(e);
                } else {
                    this.handleSwipeRight(e);
                }
            }
        } else {
            if (Math.abs(diffY) > 50) {
                if (diffY > 0) {
                    this.handleSwipeUp(e);
                } else {
                    this.handleSwipeDown(e);
                }
            }
        }
    }

    // Handle touch end
    handleTouchEnd(e) {
        this.touchStartX = 0;
        this.touchStartY = 0;
    }

    // Handle double tap
    handleDoubleTap(e) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - this.lastTap;
        
        if (tapLength < 500 && tapLength > 0) {
            this.onDoubleTap(e);
            e.preventDefault();
        }
        
        this.lastTap = currentTime;
    }

    // Swipe handlers (can be overridden by specific components)
    handleSwipeLeft(e) {
        // Default: navigate forward or close modals
        if (this.modals.length > 0) {
            this.closeModal(this.modals[this.modals.length - 1]);
        }
    }

    handleSwipeRight(e) {
        // Default: navigate back
        if (window.history.length > 1) {
            window.history.back();
        }
    }

    handleSwipeUp(e) {
        // Default: scroll up or refresh
        if (window.pageYOffset === 0) {
            // Pull to refresh at top
            if (window.TaskManager) {
                window.TaskManager.loadTasks(true);
            }
        }
    }

    handleSwipeDown(e) {
        // Default: scroll down
    }

    onDoubleTap(e) {
        // Default: zoom or quick action
        const target = e.target.closest('.task-card');
        if (target && window.TaskManager) {
            const taskId = target.dataset.taskId;
            if (taskId) {
                window.TaskManager.openTaskDetails(parseInt(taskId));
            }
        }
    }

    // Keyboard shortcuts
    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + R: Refresh
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                if (window.TaskManager) {
                    window.TaskManager.loadTasks(true);
                }
            }
            
            // Escape: Close modals/search
            if (e.key === 'Escape') {
                if (this.modals.length > 0) {
                    this.closeModal(this.modals[this.modals.length - 1]);
                } else {
                    // Clear search
                    const searchInput = document.getElementById('taskSearch');
                    if (searchInput && searchInput.value) {
                        searchInput.value = '';
                        if (window.TaskManager) {
                            window.TaskManager.handleSearch('');
                        }
                    }
                }
            }
            
            // Ctrl/Cmd + F: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('taskSearch');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        });
    }

    // Responsive handling
    setupResponsiveHandling() {
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
        
        // Handle resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
        
        // Initial setup
        this.handleResize();
    }

    // Handle orientation change
    handleOrientationChange() {
        // Adjust UI for orientation
        const orientation = screen.orientation?.angle || window.orientation || 0;
        document.body.classList.toggle('landscape', Math.abs(orientation) === 90);
        
        // Trigger resize handling
        this.handleResize();
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log('📱 Orientation changed:', orientation);
        }
    }

    // Handle window resize
    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Update CSS custom properties
        document.documentElement.style.setProperty('--viewport-width', `${width}px`);
        document.documentElement.style.setProperty('--viewport-height', `${height}px`);
        
        // Adjust for mobile browsers
        document.documentElement.style.setProperty('--vh', `${height * 0.01}px`);
        
        // Update responsive classes
        document.body.classList.toggle('mobile', width < 768);
        document.body.classList.toggle('tablet', width >= 768 && width < 1024);
        document.body.classList.toggle('desktop', width >= 1024);
        
        // Adjust modals for small screens
        this.adjustModalSizes();
    }

    // Adjust modal sizes for different screen sizes
    adjustModalSizes() {
        this.modals.forEach(modal => {
            const dialog = modal.querySelector('.modal-dialog');
            if (dialog) {
                const isMobile = window.innerWidth < 768;
                dialog.style.maxWidth = isMobile ? '95%' : '500px';
                dialog.style.margin = isMobile ? '10px' : '50px auto';
            }
        });
    }

    // Theme management
    initializeTheme() {
        const savedTheme = localStorage.getItem('wizone_theme') || this.currentTheme;
        this.setTheme(savedTheme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme}`);
        localStorage.setItem('wizone_theme', theme);
        
        // Update theme color for mobile browsers
        const themeColors = {
            'professional': '#2c5aa0',
            'dark': '#1a1a1a',
            'light': '#ffffff'
        };
        
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', themeColors[theme] || themeColors.professional);
        }
    }

    // Device capability detection
    detectDeviceCapabilities() {
        const capabilities = {
            touchSupport: 'ontouchstart' in window,
            geolocation: 'geolocation' in navigator,
            camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
            vibration: 'vibrate' in navigator,
            notification: 'Notification' in window,
            serviceWorker: 'serviceWorker' in navigator,
            webRTC: 'RTCPeerConnection' in window,
            webGL: this.checkWebGLSupport(),
            localStorage: this.checkLocalStorageSupport(),
            indexedDB: 'indexedDB' in window,
            webAssembly: 'WebAssembly' in window
        };
        
        // Store capabilities for use by other components
        window.deviceCapabilities = capabilities;
        
        // Update UI based on capabilities
        document.body.classList.toggle('touch-device', capabilities.touchSupport);
        document.body.classList.toggle('has-camera', capabilities.camera);
        document.body.classList.toggle('has-vibration', capabilities.vibration);
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log('📱 Device capabilities:', capabilities);
        }
        
        return capabilities;
    }

    // Check WebGL support
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                     (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    // Check localStorage support
    checkLocalStorageSupport() {
        try {
            const testKey = 'wizone_test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Haptic feedback
    triggerHapticFeedback(type = 'light') {
        if (!navigator.vibrate) return;
        
        const patterns = {
            light: [10],
            medium: [20],
            heavy: [50],
            success: [10, 50, 10],
            error: [100, 50, 100],
            warning: [50, 25, 50]
        };
        
        const pattern = patterns[type] || patterns.light;
        navigator.vibrate(pattern);
    }

    // Performance monitoring
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        if (CONFIG.DEV.PERFORMANCE_LOGS) {
            console.log(`⏱️ ${name} took ${(end - start).toFixed(2)}ms`);
        }
        
        return result;
    }

    // Debounce utility
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    // Throttle utility
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Initialize global event listeners
    initializeGlobalEventListeners() {
        // Handle app visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onAppHidden();
            } else {
                this.onAppVisible();
            }
        });
        
        // Handle page unload
        window.addEventListener('beforeunload', (e) => {
            this.onAppUnload(e);
        });
        
        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showToast('Connection restored', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showToast('Working offline', 'warning');
        });
    }

    // App lifecycle handlers
    onAppVisible() {
        // App became visible - refresh data if needed
        if (window.TaskManager && window.AuthManager?.isLoggedIn()) {
            window.TaskManager.loadTasks(false);
        }
    }

    onAppHidden() {
        // App hidden - save state, pause timers, etc.
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log('📱 App hidden');
        }
    }

    onAppUnload(e) {
        // Save any pending data before unload
        if (window.DatabaseManager && window.DatabaseManager.syncQueue.length > 0) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }

    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    // Copy text to clipboard
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            
            this.showToast('Copied to clipboard', 'success');
            this.triggerHapticFeedback('light');
            
        } catch (error) {
            this.showToast('Failed to copy to clipboard', 'error');
            console.error('Copy to clipboard failed:', error);
        }
    }

    // Share content (if supported)
    async shareContent(data) {
        if (navigator.share) {
            try {
                await navigator.share(data);
                this.triggerHapticFeedback('success');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    this.showToast('Failed to share content', 'error');
                }
            }
        } else {
            // Fallback: copy to clipboard
            const shareText = `${data.title}\n${data.text}\n${data.url}`;
            this.copyToClipboard(shareText);
        }
    }

    // Get current screen info
    getScreenInfo() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            orientation: screen.orientation?.angle || window.orientation || 0,
            pixelRatio: window.devicePixelRatio || 1,
            colorDepth: screen.colorDepth,
            isTouchDevice: 'ontouchstart' in window,
            isRetina: window.devicePixelRatio > 1
        };
    }

    // Clean up UI Manager
    destroy() {
        // Clear all toasts
        this.toasts.forEach(toast => this.removeToast(toast));
        
        // Close all modals
        this.modals.forEach(modal => this.closeModal(modal));
        
        // Remove event listeners
        // (In a real implementation, you'd track and remove all listeners)
        
        this.isInitialized = false;
    }
}

// Initialize global UI manager
window.UIManager = new UIManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.UIManager.init();
    });
} else {
    window.UIManager.init();
}