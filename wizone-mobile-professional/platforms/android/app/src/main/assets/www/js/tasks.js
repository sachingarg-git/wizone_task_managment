// Task management system for Wizone Professional
class TaskManager {
    constructor() {
        this.tasks = [];
        this.filteredTasks = [];
        this.currentFilter = 'all';
        this.currentSort = 'newest';
        this.searchQuery = '';
        this.selectedTaskId = null;
        this.refreshInterval = null;
        
        // File upload tracking
        this.pendingUploads = new Map();
        this.maxFileSize = CONFIG.UI.MAX_FILE_SIZE;
        this.allowedFileTypes = CONFIG.UI.ALLOWED_FILE_TYPES;
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log('📋 Task Manager initialized');
        }
    }

    // Initialize task manager
    async init() {
        this.initializeEventListeners();
        this.startAutoRefresh();
        
        // Load tasks if user is authenticated
        if (window.AuthManager && window.AuthManager.isLoggedIn()) {
            await this.loadTasks();
        }
        
        if (CONFIG.DEV.CONSOLE_LOGS) {
            console.log('🚀 Task Manager ready');
        }
    }

    // Load tasks from server
    async loadTasks(showLoading = true) {
        try {
            if (showLoading) {
                this.showTasksLoading(true);
            }

            const response = await window.DatabaseManager.getTasks();
            
            if (response.success && Array.isArray(response.tasks)) {
                this.tasks = response.tasks;
                this.applyFiltersAndSort();
                this.renderTaskList();
                this.updateTaskStatistics();
                
                if (CONFIG.DEV.CONSOLE_LOGS) {
                    console.log(`📋 Loaded ${this.tasks.length} tasks`);
                }
            } else {
                throw new Error('Invalid task data received');
            }

        } catch (error) {
            this.handleTaskError('Failed to load tasks', error);
        } finally {
            if (showLoading) {
                this.showTasksLoading(false);
            }
        }
    }

    // Apply current filters and sorting
    applyFiltersAndSort() {
        let filtered = [...this.tasks];

        // Apply status filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(task => task.status === this.currentFilter);
        }

        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(task => 
                task.title.toLowerCase().includes(query) ||
                task.description.toLowerCase().includes(query) ||
                task.customer_name.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.currentSort) {
                case 'newest':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'oldest':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'priority':
                    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
                case 'deadline':
                    const dateA = a.deadline ? new Date(a.deadline) : new Date('2099-12-31');
                    const dateB = b.deadline ? new Date(b.deadline) : new Date('2099-12-31');
                    return dateA - dateB;
                case 'title':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });

        this.filteredTasks = filtered;
    }

    // Render task list
    renderTaskList() {
        const taskContainer = document.getElementById('taskList');
        if (!taskContainer) return;

        if (this.filteredTasks.length === 0) {
            taskContainer.innerHTML = this.getEmptyTasksHTML();
            return;
        }

        taskContainer.innerHTML = this.filteredTasks.map(task => this.getTaskCardHTML(task)).join('');
        
        // Add click listeners to task cards
        this.attachTaskCardListeners();
    }

    // Generate HTML for empty task state
    getEmptyTasksHTML() {
        const message = this.searchQuery 
            ? `No tasks found matching "${this.searchQuery}"`
            : this.currentFilter === 'all' 
                ? 'No tasks assigned to you yet'
                : `No ${this.currentFilter} tasks found`;

        return `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>No Tasks Found</h3>
                <p>${message}</p>
                ${this.searchQuery || this.currentFilter !== 'all' ? 
                    '<button class="btn btn-secondary" onclick="TaskManager.clearFilters()">Clear Filters</button>' : 
                    ''}
            </div>
        `;
    }

    // Generate HTML for task card
    getTaskCardHTML(task) {
        const priorityColor = {
            'high': '#ff4757',
            'medium': '#ffa502',
            'low': '#3742fa'
        };

        const statusColor = {
            'pending': '#ffa502',
            'in_progress': '#3742fa',
            'completed': '#2ed573',
            'cancelled': '#ff4757'
        };

        const deadlineText = task.deadline ? this.formatDeadline(task.deadline) : '';
        const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';
        
        return `
            <div class="task-card ${isOverdue ? 'overdue' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-priority" style="background-color: ${priorityColor[task.priority] || '#999'}">
                        ${task.priority || 'medium'}
                    </div>
                    <div class="task-status" style="background-color: ${statusColor[task.status] || '#999'}">
                        ${this.formatStatus(task.status)}
                    </div>
                </div>
                
                <div class="task-content">
                    <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                    <p class="task-description">${this.escapeHtml(task.description || '')}</p>
                    
                    ${task.customer_name ? `
                        <div class="task-customer">
                            <span class="customer-icon">👤</span>
                            <span>${this.escapeHtml(task.customer_name)}</span>
                        </div>
                    ` : ''}
                    
                    ${deadlineText ? `
                        <div class="task-deadline ${isOverdue ? 'overdue' : ''}">
                            <span class="deadline-icon">⏰</span>
                            <span>${deadlineText}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="task-footer">
                    <div class="task-meta">
                        <span class="task-date">Created: ${this.formatDate(task.created_at)}</span>
                        ${task.file_count > 0 ? `
                            <span class="task-files">
                                📎 ${task.file_count} file${task.file_count !== 1 ? 's' : ''}
                            </span>
                        ` : ''}
                    </div>
                    
                    <div class="task-actions">
                        <button class="btn-icon quick-update" data-task-id="${task.id}" title="Quick Update">
                            <span class="icon">⚡</span>
                        </button>
                        <button class="btn-icon view-details" data-task-id="${task.id}" title="View Details">
                            <span class="icon">👁️</span>
                        </button>
                    </div>
                </div>
                
                ${task.latest_update ? `
                    <div class="task-latest-update">
                        <div class="update-content">
                            <strong>Latest Update:</strong> ${this.escapeHtml(task.latest_update)}
                        </div>
                        <div class="update-time">${this.formatRelativeTime(task.updated_at)}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Attach event listeners to task cards
    attachTaskCardListeners() {
        // Task card click for details
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.task-actions')) {
                    const taskId = card.dataset.taskId;
                    this.openTaskDetails(parseInt(taskId));
                }
            });
        });

        // Quick update buttons
        document.querySelectorAll('.quick-update').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = parseInt(btn.dataset.taskId);
                this.openQuickUpdateModal(taskId);
            });
        });

        // View details buttons
        document.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = parseInt(btn.dataset.taskId);
                this.openTaskDetails(taskId);
            });
        });
    }

    // Open task details modal
    async openTaskDetails(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.selectedTaskId = taskId;
        
        try {
            // Load task updates/history
            const updates = await window.DatabaseManager.getTaskUpdates(taskId);
            
            // Populate modal with task data
            this.populateTaskModal(task, updates);
            
            // Show modal
            const modal = document.getElementById('taskModal');
            if (modal) {
                modal.style.display = 'block';
                document.body.classList.add('modal-open');
            }
            
        } catch (error) {
            this.showToast('Failed to load task details', 'error');
            console.error('Error loading task details:', error);
        }
    }

    // Populate task modal with data
    populateTaskModal(task, updates = []) {
        // Basic task info
        document.getElementById('modalTaskTitle').textContent = task.title;
        document.getElementById('modalTaskDescription').textContent = task.description || 'No description';
        document.getElementById('modalTaskStatus').textContent = this.formatStatus(task.status);
        document.getElementById('modalTaskPriority').textContent = task.priority || 'medium';
        document.getElementById('modalTaskCustomer').textContent = task.customer_name || 'Not specified';
        document.getElementById('modalTaskDeadline').textContent = task.deadline ? 
            this.formatDate(task.deadline) : 'No deadline';
        document.getElementById('modalTaskCreated').textContent = this.formatDate(task.created_at);

        // Status selector
        const statusSelect = document.getElementById('taskStatusSelect');
        if (statusSelect) {
            statusSelect.value = task.status;
        }

        // File upload area
        this.updateFileUploadArea(task);

        // Task history
        this.populateTaskHistory(updates);

        // Set active tab
        this.setActiveModalTab('details');
    }

    // Update file upload area
    updateFileUploadArea(task) {
        const fileList = document.getElementById('taskFileList');
        if (!fileList) return;

        if (task.files && task.files.length > 0) {
            fileList.innerHTML = task.files.map(file => `
                <div class="file-item">
                    <span class="file-icon">${this.getFileIcon(file.type)}</span>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${this.formatFileSize(file.size)}</span>
                    <a href="${file.url}" target="_blank" class="file-download">📥</a>
                </div>
            `).join('');
        } else {
            fileList.innerHTML = '<p class="no-files">No files uploaded yet</p>';
        }
    }

    // Populate task history tab
    populateTaskHistory(updates) {
        const historyContainer = document.getElementById('taskHistoryList');
        if (!historyContainer) return;

        if (updates.length === 0) {
            historyContainer.innerHTML = '<p class="no-history">No updates recorded yet</p>';
            return;
        }

        historyContainer.innerHTML = updates.map(update => `
            <div class="history-item">
                <div class="history-header">
                    <span class="history-user">${update.user_name || 'System'}</span>
                    <span class="history-time">${this.formatRelativeTime(update.created_at)}</span>
                </div>
                <div class="history-content">
                    ${this.escapeHtml(update.description)}
                    ${update.status_changed ? `
                        <div class="status-change">
                            Status changed to: <strong>${this.formatStatus(update.new_status)}</strong>
                        </div>
                    ` : ''}
                </div>
                ${update.files && update.files.length > 0 ? `
                    <div class="history-files">
                        <strong>Files:</strong>
                        ${update.files.map(file => `
                            <a href="${file.url}" target="_blank" class="history-file">
                                ${this.getFileIcon(file.type)} ${file.name}
                            </a>
                        `).join(', ')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    // Handle task status update
    async updateTaskStatus(taskId, newStatus, description = '') {
        try {
            this.showUpdateLoading(true);

            const updateData = {
                status: newStatus,
                description: description,
                timestamp: new Date().toISOString()
            };

            await window.DatabaseManager.updateTask(taskId, updateData);
            
            // Update local task data
            const taskIndex = this.tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                this.tasks[taskIndex].status = newStatus;
                this.tasks[taskIndex].updated_at = updateData.timestamp;
                
                if (description) {
                    this.tasks[taskIndex].latest_update = description;
                }
            }

            // Refresh UI
            this.applyFiltersAndSort();
            this.renderTaskList();
            this.updateTaskStatistics();

            this.showToast('Task updated successfully', 'success');
            
            // If modal is open for this task, refresh it
            if (this.selectedTaskId === taskId) {
                await this.refreshTaskModal();
            }

        } catch (error) {
            this.handleTaskError('Failed to update task', error);
        } finally {
            this.showUpdateLoading(false);
        }
    }

    // Handle file uploads
    async handleFileUpload(taskId, files) {
        if (!files || files.length === 0) return;

        try {
            // Validate files
            const validFiles = Array.from(files).filter(file => this.validateFile(file));
            
            if (validFiles.length === 0) {
                this.showToast('No valid files selected', 'error');
                return;
            }

            // Show upload progress
            this.showUploadProgress(validFiles.length);

            // Create FormData
            const formData = new FormData();
            validFiles.forEach((file, index) => {
                formData.append(`files[${index}]`, file);
            });
            formData.append('task_id', taskId);
            formData.append('description', document.getElementById('updateDescription')?.value || '');

            // Upload files
            const result = await window.DatabaseManager.uploadFiles(taskId, formData);

            if (result.success) {
                this.showToast(`${validFiles.length} file(s) uploaded successfully`, 'success');
                
                // Refresh task data
                await this.loadTasks(false);
                
                // Refresh modal if open
                if (this.selectedTaskId === taskId) {
                    await this.refreshTaskModal();
                }
                
                // Clear file input
                const fileInput = document.getElementById('taskFileInput');
                if (fileInput) fileInput.value = '';
                
            } else {
                throw new Error(result.message || 'Upload failed');
            }

        } catch (error) {
            this.handleTaskError('File upload failed', error);
        } finally {
            this.hideUploadProgress();
        }
    }

    // Validate uploaded file
    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            this.showToast(`File "${file.name}" is too large. Maximum size: ${this.formatFileSize(this.maxFileSize)}`, 'error');
            return false;
        }

        // Check file type
        const fileType = file.type || this.getFileTypeFromName(file.name);
        if (this.allowedFileTypes.length > 0 && !this.allowedFileTypes.includes(fileType)) {
            this.showToast(`File type "${fileType}" is not allowed`, 'error');
            return false;
        }

        return true;
    }

    // Get file type from filename
    getFileTypeFromName(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const typeMap = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'txt': 'text/plain'
        };
        return typeMap[extension] || 'application/octet-stream';
    }

    // Show upload progress
    showUploadProgress(fileCount) {
        const progress = document.getElementById('uploadProgress');
        if (progress) {
            progress.style.display = 'block';
            progress.querySelector('.progress-text').textContent = `Uploading ${fileCount} file(s)...`;
        }
    }

    // Hide upload progress
    hideUploadProgress() {
        const progress = document.getElementById('uploadProgress');
        if (progress) {
            progress.style.display = 'none';
        }
    }

    // Camera capture for file upload
    async capturePhoto() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported on this device');
            }

            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } // Use back camera
            });

            // Create camera modal
            this.showCameraModal(stream);

        } catch (error) {
            if (error.name === 'NotAllowedError') {
                this.showToast('Camera permission denied', 'error');
            } else if (error.name === 'NotFoundError') {
                this.showToast('No camera found on this device', 'error');
            } else {
                this.showToast('Failed to access camera: ' + error.message, 'error');
            }
        }
    }

    // Show camera modal for photo capture
    showCameraModal(stream) {
        const modal = document.createElement('div');
        modal.className = 'camera-modal';
        modal.innerHTML = `
            <div class="camera-container">
                <video id="cameraVideo" autoplay></video>
                <canvas id="cameraCanvas" style="display: none;"></canvas>
                <div class="camera-controls">
                    <button id="captureButton" class="btn btn-primary">📸 Capture</button>
                    <button id="cancelCamera" class="btn btn-secondary">❌ Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        const video = modal.querySelector('#cameraVideo');
        const canvas = modal.querySelector('#cameraCanvas');
        const captureBtn = modal.querySelector('#captureButton');
        const cancelBtn = modal.querySelector('#cancelCamera');

        video.srcObject = stream;

        captureBtn.addEventListener('click', () => {
            this.capturePhotoFromVideo(video, canvas, stream);
            document.body.removeChild(modal);
        });

        cancelBtn.addEventListener('click', () => {
            stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(modal);
        });
    }

    // Capture photo from video stream
    capturePhotoFromVideo(video, canvas, stream) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob(blob => {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            
            // Add to file input
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            
            const fileInput = document.getElementById('taskFileInput');
            if (fileInput) {
                fileInput.files = dataTransfer.files;
                
                // Trigger file upload
                if (this.selectedTaskId) {
                    this.handleFileUpload(this.selectedTaskId, dataTransfer.files);
                }
            }
        }, 'image/jpeg', 0.8);

        // Stop camera stream
        stream.getTracks().forEach(track => track.stop());
    }

    // Search and filter functionality
    handleSearch(query) {
        this.searchQuery = query.trim();
        this.applyFiltersAndSort();
        this.renderTaskList();
    }

    handleFilterChange(filter) {
        this.currentFilter = filter;
        this.applyFiltersAndSort();
        this.renderTaskList();
        
        // Update filter UI
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
    }

    handleSortChange(sort) {
        this.currentSort = sort;
        this.applyFiltersAndSort();
        this.renderTaskList();
        
        // Update sort UI
        const sortSelect = document.getElementById('taskSort');
        if (sortSelect) {
            sortSelect.value = sort;
        }
    }

    // Clear all filters
    clearFilters() {
        this.searchQuery = '';
        this.currentFilter = 'all';
        this.currentSort = 'newest';
        
        // Update UI
        const searchInput = document.getElementById('taskSearch');
        if (searchInput) searchInput.value = '';
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === 'all');
        });
        
        const sortSelect = document.getElementById('taskSort');
        if (sortSelect) sortSelect.value = 'newest';
        
        this.applyFiltersAndSort();
        this.renderTaskList();
    }

    // Update task statistics
    updateTaskStatistics() {
        const stats = {
            total: this.tasks.length,
            pending: this.tasks.filter(t => t.status === 'pending').length,
            in_progress: this.tasks.filter(t => t.status === 'in_progress').length,
            completed: this.tasks.filter(t => t.status === 'completed').length
        };

        // Update stat displays
        Object.keys(stats).forEach(key => {
            const element = document.getElementById(`stat-${key}`);
            if (element) {
                element.textContent = stats[key];
            }
        });

        // Update filter buttons with counts
        document.querySelectorAll('.filter-btn').forEach(btn => {
            const filter = btn.dataset.filter;
            const count = filter === 'all' ? stats.total : stats[filter] || 0;
            const countEl = btn.querySelector('.filter-count');
            if (countEl) {
                countEl.textContent = count;
            }
        });
    }

    // Auto-refresh functionality
    startAutoRefresh() {
        if (CONFIG.DATABASE.AUTO_REFRESH_INTERVAL > 0) {
            this.refreshInterval = setInterval(() => {
                if (window.AuthManager && window.AuthManager.isLoggedIn()) {
                    this.loadTasks(false); // Refresh without showing loading
                }
            }, CONFIG.DATABASE.AUTO_REFRESH_INTERVAL);
        }
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // Utility methods
    formatStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatDeadline(dateString) {
        const deadline = new Date(dateString);
        const now = new Date();
        const diffTime = deadline - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
        } else if (diffDays === 0) {
            return 'Due today';
        } else if (diffDays === 1) {
            return 'Due tomorrow';
        } else {
            return `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
        }
    }

    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        
        return this.formatDate(dateString);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getFileIcon(type) {
        if (type.startsWith('image/')) return '🖼️';
        if (type.includes('pdf')) return '📄';
        if (type.includes('word')) return '📝';
        if (type.includes('excel')) return '📊';
        if (type.includes('video')) return '🎥';
        if (type.includes('audio')) return '🎵';
        return '📎';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // UI state management
    showTasksLoading(show) {
        const loader = document.getElementById('tasksLoader');
        const taskList = document.getElementById('taskList');
        
        if (loader) loader.style.display = show ? 'block' : 'none';
        if (taskList) taskList.style.opacity = show ? '0.5' : '1';
    }

    showUpdateLoading(show) {
        const button = document.getElementById('updateTaskButton');
        if (button) {
            button.disabled = show;
            button.textContent = show ? 'Updating...' : 'Update Task';
        }
    }

    // Error handling
    handleTaskError(message, error) {
        console.error(message + ':', error);
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info', duration = CONFIG.UI.TOAST_DURATION) {
        if (window.UIManager) {
            window.UIManager.showToast(message, type, duration);
        }
    }

    // Modal management
    setActiveModalTab(tabName) {
        document.querySelectorAll('.modal-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tab === tabName);
        });
    }

    closeTaskModal() {
        const modal = document.getElementById('taskModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
        this.selectedTaskId = null;
    }

    async refreshTaskModal() {
        if (this.selectedTaskId) {
            const task = this.tasks.find(t => t.id === this.selectedTaskId);
            if (task) {
                const updates = await window.DatabaseManager.getTaskUpdates(this.selectedTaskId);
                this.populateTaskModal(task, updates);
            }
        }
    }

    // Event listeners
    initializeEventListeners() {
        // Search input
        const searchInput = document.getElementById('taskSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleFilterChange(btn.dataset.filter);
            });
        });

        // Sort dropdown
        const sortSelect = document.getElementById('taskSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.handleSortChange(e.target.value);
            });
        }

        // Modal tabs
        document.querySelectorAll('.modal-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.setActiveModalTab(tab.dataset.tab);
            });
        });

        // Modal close
        const modalClose = document.getElementById('closeTaskModal');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeTaskModal();
            });
        }

        // Update task button
        const updateButton = document.getElementById('updateTaskButton');
        if (updateButton) {
            updateButton.addEventListener('click', () => {
                this.handleTaskUpdate();
            });
        }

        // File input
        const fileInput = document.getElementById('taskFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (this.selectedTaskId && e.target.files.length > 0) {
                    this.handleFileUpload(this.selectedTaskId, e.target.files);
                }
            });
        }

        // Camera button
        const cameraButton = document.getElementById('cameraButton');
        if (cameraButton) {
            cameraButton.addEventListener('click', () => {
                this.capturePhoto();
            });
        }

        // Pull to refresh
        this.initializePullToRefresh();
    }

    // Handle task update from modal
    async handleTaskUpdate() {
        if (!this.selectedTaskId) return;

        const statusSelect = document.getElementById('taskStatusSelect');
        const descriptionInput = document.getElementById('updateDescription');
        
        const newStatus = statusSelect?.value;
        const description = descriptionInput?.value?.trim();
        
        if (newStatus) {
            await this.updateTaskStatus(this.selectedTaskId, newStatus, description);
            
            // Clear description after update
            if (descriptionInput) {
                descriptionInput.value = '';
            }
        }
    }

    // Pull to refresh functionality
    initializePullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let isPulling = false;
        
        const taskContainer = document.getElementById('taskList');
        if (!taskContainer) return;

        taskContainer.addEventListener('touchstart', (e) => {
            if (taskContainer.scrollTop === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        });

        taskContainer.addEventListener('touchmove', (e) => {
            if (!isPulling) return;
            
            currentY = e.touches[0].clientY;
            const pullDistance = currentY - startY;
            
            if (pullDistance > 100) {
                // Show refresh indicator
                this.showPullToRefreshIndicator(true);
            }
        });

        taskContainer.addEventListener('touchend', (e) => {
            if (!isPulling) return;
            
            const pullDistance = currentY - startY;
            
            if (pullDistance > 100) {
                // Trigger refresh
                this.loadTasks(true);
            }
            
            this.showPullToRefreshIndicator(false);
            isPulling = false;
        });
    }

    showPullToRefreshIndicator(show) {
        let indicator = document.getElementById('pullToRefreshIndicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'pullToRefreshIndicator';
            indicator.className = 'pull-to-refresh-indicator';
            indicator.innerHTML = '<div class="refresh-spinner"></div><span>Release to refresh</span>';
            document.body.appendChild(indicator);
        }
        
        indicator.style.display = show ? 'flex' : 'none';
    }

    // Quick update modal
    openQuickUpdateModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const modal = document.createElement('div');
        modal.className = 'quick-update-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Quick Update: ${this.escapeHtml(task.title)}</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Status:</label>
                        <select id="quickStatusSelect">
                            <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                            <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Update Description:</label>
                        <textarea id="quickUpdateDescription" placeholder="What's the update?"></textarea>
                    </div>
                </div>
                <div class="modal-actions">
                    <button id="quickUpdateButton" class="btn btn-primary">Update</button>
                    <button class="btn btn-secondary close-btn">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        });

        modal.querySelector('#quickUpdateButton').addEventListener('click', async () => {
            const newStatus = modal.querySelector('#quickStatusSelect').value;
            const description = modal.querySelector('#quickUpdateDescription').value.trim();
            
            await this.updateTaskStatus(taskId, newStatus, description);
            document.body.removeChild(modal);
        });
    }
}

// Initialize global task manager
window.TaskManager = new TaskManager();