// API Service - Handles all server communication
class APIService {
    constructor() {
        this.BASE_URL = 'http://103.122.85.61:4000';
        this.isOnline = navigator.onLine;
        this.setupOnlineStatusListener();
    }

    setupOnlineStatusListener() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('📶 Connection restored');
            this.showToast('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📵 Connection lost');
            this.showToast('Connection lost. Some features may not work.', 'error');
        });
    }

    async makeRequest(endpoint, options = {}) {
        if (!this.isOnline) {
            throw new Error('No internet connection');
        }

        const url = `${this.BASE_URL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Important for session cookies
        };

        const requestOptions = { ...defaultOptions, ...options };

        try {
            console.log(`🌐 API Request: ${options.method || 'GET'} ${endpoint}`);
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ API Response: ${endpoint}`, data);
            return data;
        } catch (error) {
            console.error(`❌ API Error: ${endpoint}`, error);
            throw error;
        }
    }

    // Authentication methods
    async login(username, password) {
        return this.makeRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async logout() {
        return this.makeRequest('/api/auth/logout', {
            method: 'POST'
        });
    }

    async getCurrentUser() {
        return this.makeRequest('/api/auth/user');
    }

    // Task methods
    async getMyTasks() {
        return this.makeRequest('/api/tasks/my-tasks');
    }

    async getTaskById(taskId) {
        return this.makeRequest(`/api/tasks/${taskId}`);
    }

    async updateTask(taskId, updateData) {
        return this.makeRequest(`/api/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    }

    async getTaskUpdates(taskId) {
        return this.makeRequest(`/api/tasks/${taskId}/updates`);
    }

    async syncTasks() {
        return this.makeRequest('/api/tasks/sync', {
            method: 'POST'
        });
    }

    // File upload methods
    async uploadFiles(taskId, formData) {
        // Don't set Content-Type for FormData, let browser set it with boundary
        return this.makeRequest(`/api/tasks/${taskId}/files`, {
            method: 'POST',
            body: formData,
            headers: {} // Remove default Content-Type for file uploads
        });
    }

    // Utility methods
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        if (toast && toastMessage) {
            toastMessage.textContent = message;
            toast.className = `toast ${type}`;
            toast.style.display = 'block';
            
            setTimeout(() => {
                toast.style.display = 'none';
            }, 3000);
        }
    }

    getStatusColor(status) {
        const colors = {
            'pending': 'status-pending',
            'in_progress': 'status-in_progress',
            'resolved': 'status-resolved',
            'completed': 'status-completed',
            'cancelled': 'status-cancelled'
        };
        return colors[status?.toLowerCase()] || 'status-pending';
    }

    getPriorityColor(priority) {
        const colors = {
            'high': 'priority-high',
            'medium': 'priority-medium',
            'low': 'priority-low',
            'critical': 'priority-critical'
        };
        return colors[priority?.toLowerCase()] || 'priority-medium';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                return 'Today';
            } else if (diffDays === 2) {
                return 'Yesterday';
            } else if (diffDays <= 7) {
                return `${diffDays - 1} days ago`;
            } else {
                return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
            }
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'N/A';
        }
    }

    formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('DateTime formatting error:', error);
            return 'N/A';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global API instance
window.apiService = new APIService();