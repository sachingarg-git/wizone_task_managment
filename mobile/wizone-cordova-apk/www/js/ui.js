// UI Utilities and Helper Functions
class UIManager {
    constructor() {
        this.setupGlobalEventListeners();
        this.setupKeyboardHandling();
    }

    setupGlobalEventListeners() {
        // Handle Android back button
        document.addEventListener('backbutton', (e) => {
            e.preventDefault();
            this.handleBackButton();
        }, false);

        // Handle network status changes
        document.addEventListener('online', () => {
            this.handleNetworkChange(true);
        });

        document.addEventListener('offline', () => {
            this.handleNetworkChange(false);
        });

        // Handle app pause/resume
        document.addEventListener('pause', () => {
            console.log('📱 App paused');
        }, false);

        document.addEventListener('resume', () => {
            console.log('📱 App resumed');
            this.handleAppResume();
        }, false);

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Handle viewport changes for keyboard
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                this.handleViewportResize();
            });
        }
    }

    setupKeyboardHandling() {
        // Focus management for mobile
        document.addEventListener('focusin', (e) => {
            if (this.isMobileKeyboardInput(e.target)) {
                this.handleKeyboardShow(e.target);
            }
        });

        document.addEventListener('focusout', (e) => {
            if (this.isMobileKeyboardInput(e.target)) {
                this.handleKeyboardHide();
            }
        });
    }

    isMobileKeyboardInput(element) {
        return element && (
            element.tagName === 'INPUT' || 
            element.tagName === 'TEXTAREA' ||
            element.contentEditable === 'true'
        );
    }

    handleKeyboardShow(element) {
        // Scroll element into view on mobile
        setTimeout(() => {
            if (element && element.scrollIntoView) {
                element.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }, 300);
    }

    handleKeyboardHide() {
        // Restore scroll position if needed
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 100);
    }

    handleBackButton() {
        const modal = document.getElementById('taskModal');
        const isModalOpen = modal && modal.style.display === 'flex';
        
        if (isModalOpen) {
            // Close modal
            window.taskManager?.closeTaskModal();
        } else {
            // Show exit confirmation
            this.showExitConfirmation();
        }
    }

    showExitConfirmation() {
        if (navigator.notification) {
            // Use Cordova notification plugin if available
            navigator.notification.confirm(
                'Are you sure you want to exit?',
                (buttonIndex) => {
                    if (buttonIndex === 1) { // OK button
                        this.exitApp();
                    }
                },
                'Exit App', 
                ['OK', 'Cancel']
            );
        } else {
            // Fallback to browser confirm
            if (confirm('Are you sure you want to exit?')) {
                this.exitApp();
            }
        }
    }

    exitApp() {
        if (navigator.app && navigator.app.exitApp) {
            navigator.app.exitApp();
        } else {
            window.close();
        }
    }

    handleNetworkChange(isOnline) {
        const statusElement = document.querySelector('.status-indicator');
        if (statusElement) {
            statusElement.style.background = isOnline ? '#4ade80' : '#ef4444';
        }
        
        if (isOnline) {
            console.log('📶 Network connected');
            // Optionally sync data when connection is restored
            if (window.taskManager && window.authManager?.isAuthenticated()) {
                setTimeout(() => {
                    window.taskManager.syncTasks();
                }, 2000);
            }
        } else {
            console.log('📵 Network disconnected');
        }
    }

    handleAppResume() {
        // Refresh data when app comes back to foreground
        if (window.authManager?.isAuthenticated()) {
            console.log('🔄 Refreshing data on app resume');
            window.taskManager?.loadTasks();
        }
    }

    handleOrientationChange() {
        // Handle orientation changes
        console.log('🔄 Orientation changed');
        
        // Force repaint to fix potential layout issues
        const app = document.getElementById('app');
        if (app) {
            app.style.display = 'none';
            app.offsetHeight; // Trigger reflow
            app.style.display = 'block';
        }
    }

    handleViewportResize() {
        // Handle keyboard show/hide on mobile
        const modal = document.getElementById('taskModal');
        const isModalOpen = modal && modal.style.display === 'flex';
        
        if (isModalOpen && window.visualViewport) {
            const currentHeight = window.visualViewport.height;
            const fullHeight = window.screen.height;
            const keyboardHeight = fullHeight - currentHeight;
            
            if (keyboardHeight > 200) {
                // Keyboard is likely shown
                modal.style.paddingBottom = `${keyboardHeight}px`;
            } else {
                // Keyboard is likely hidden
                modal.style.paddingBottom = '20px';
            }
        }
    }

    // Touch and gesture utilities
    setupTouchGestures() {
        let touchStartY = 0;
        let touchStartTime = 0;

        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartY = e.touches[0].clientY;
                touchStartTime = Date.now();
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 1) {
                const touchEndY = e.changedTouches[0].clientY;
                const touchEndTime = Date.now();
                const deltaY = touchStartY - touchEndY;
                const deltaTime = touchEndTime - touchStartTime;

                // Pull to refresh gesture
                if (deltaY < -100 && deltaTime < 500 && window.scrollY === 0) {
                    this.handlePullToRefresh();
                }
            }
        }, { passive: true });
    }

    handlePullToRefresh() {
        if (window.authManager?.isAuthenticated()) {
            console.log('🔄 Pull to refresh triggered');
            window.taskManager?.syncTasks();
        }
    }

    // Animation utilities
    fadeIn(element, duration = 300) {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const start = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress.toString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    fadeOut(element, duration = 300) {
        if (!element) return;
        
        const start = performance.now();
        const startOpacity = parseFloat(getComputedStyle(element).opacity);
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = (startOpacity * (1 - progress)).toString();
            
            if (progress >= 1) {
                element.style.display = 'none';
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    slideIn(element, direction = 'up', duration = 300) {
        if (!element) return;
        
        element.style.display = 'block';
        
        const transforms = {
            up: 'translateY(100%)',
            down: 'translateY(-100%)',
            left: 'translateX(100%)',
            right: 'translateX(-100%)'
        };
        
        element.style.transform = transforms[direction];
        element.style.transition = `transform ${duration}ms ease-out`;
        
        setTimeout(() => {
            element.style.transform = 'translateY(0)';
        }, 10);
        
        setTimeout(() => {
            element.style.transition = '';
            element.style.transform = '';
        }, duration + 10);
    }

    // Haptic feedback
    vibrate(pattern = [50]) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    // Local storage utilities
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    }

    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Storage load error:', error);
            return null;
        }
    }

    removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    // Device info utilities
    getDeviceInfo() {
        const info = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenWidth: screen.width,
            screenHeight: screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
            orientation: screen.orientation?.type || 'unknown',
            isOnline: navigator.onLine,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled
        };

        // Detect mobile
        info.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        info.isTablet = /iPad|Android(?=.*tablet)|Tablet/i.test(navigator.userAgent);
        info.isAndroid = /Android/i.test(navigator.userAgent);
        info.isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

        return info;
    }

    // Performance monitoring
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    }

    // Utility to handle safe area insets (notch, etc.)
    setupSafeArea() {
        const root = document.documentElement;
        
        // Check for safe area support
        if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
            root.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
            root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
            root.style.setProperty('--safe-area-left', 'env(safe-area-inset-left)');
            root.style.setProperty('--safe-area-right', 'env(safe-area-inset-right)');
        } else {
            // Fallback values
            root.style.setProperty('--safe-area-top', '0px');
            root.style.setProperty('--safe-area-bottom', '0px');
            root.style.setProperty('--safe-area-left', '0px');
            root.style.setProperty('--safe-area-right', '0px');
        }
    }

    // Debug utilities
    enableDebugMode() {
        window.DEBUG_MODE = true;
        
        // Show console logs in UI
        const originalLog = console.log;
        console.log = (...args) => {
            originalLog.apply(console, args);
            this.showDebugMessage(args.join(' '));
        };
    }

    showDebugMessage(message) {
        if (!window.DEBUG_MODE) return;
        
        const debugContainer = document.getElementById('debugContainer');
        if (!debugContainer) {
            const container = document.createElement('div');
            container.id = 'debugContainer';
            container.style.cssText = `
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(0,0,0,0.8);
                color: white;
                font-size: 12px;
                padding: 10px;
                max-height: 200px;
                overflow-y: auto;
                z-index: 9999;
                font-family: monospace;
            `;
            document.body.appendChild(container);
        }
        
        const debugContainer = document.getElementById('debugContainer');
        const timestamp = new Date().toLocaleTimeString();
        debugContainer.innerHTML += `<div>[${timestamp}] ${message}</div>`;
        debugContainer.scrollTop = debugContainer.scrollHeight;
    }
}

// Create global UI manager instance
window.uiManager = new UIManager();