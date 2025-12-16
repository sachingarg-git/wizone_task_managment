// Task Manager - Handles all task-related functionality
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentTask = null;
        this.selectedFiles = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Sync button
            const syncBtn = document.getElementById('syncBtn');
            if (syncBtn) {
                syncBtn.addEventListener('click', () => this.syncTasks());
            }

            // Modal close
            const closeModal = document.getElementById('closeModal');
            if (closeModal) {
                closeModal.addEventListener('click', () => this.closeTaskModal());
            }

            // Modal background click
            const taskModal = document.getElementById('taskModal');
            if (taskModal) {
                taskModal.addEventListener('click', (e) => {
                    if (e.target === taskModal) {
                        this.closeTaskModal();
                    }
                });
            }

            // Tab switching
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab-btn')) {
                    this.switchTab(e.target.dataset.tab);
                }
            });

            // Status select change
            const statusSelect = document.getElementById('statusSelect');
            if (statusSelect) {
                statusSelect.addEventListener('change', () => this.handleStatusChange());
            }

            // File input
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
            }
        });
    }

    async loadTasks() {
        try {
            console.log('📋 Loading tasks...');
            const tasks = await window.apiService.getMyTasks();
            this.tasks = Array.isArray(tasks) ? tasks : [];
            this.renderTasks();
            this.updateStats();
            console.log(`✅ Loaded ${this.tasks.length} tasks`);
        } catch (error) {
            console.error('❌ Failed to load tasks:', error);
            window.apiService.showToast('Failed to load tasks: ' + error.message, 'error');
            this.renderEmptyState();
        }
    }

    async syncTasks() {
        const syncBtn = document.getElementById('syncBtn');
        const syncIcon = syncBtn?.querySelector('.sync-icon');
        const syncText = syncBtn?.querySelector('.sync-text');

        try {
            // Show syncing state
            if (syncBtn) syncBtn.disabled = true;
            if (syncIcon) syncIcon.style.animation = 'spin 1s linear infinite';
            if (syncText) syncText.textContent = 'Syncing...';

            const result = await window.apiService.syncTasks();
            await this.loadTasks(); // Reload tasks after sync
            
            const message = result.tasks?.length 
                ? `Synced ${result.tasks.length} tasks` 
                : 'Tasks synced successfully';
            window.apiService.showToast(message, 'success');
        } catch (error) {
            console.error('❌ Sync failed:', error);
            window.apiService.showToast('Sync failed: ' + error.message, 'error');
        } finally {
            // Reset button state
            if (syncBtn) syncBtn.disabled = false;
            if (syncIcon) syncIcon.style.animation = '';
            if (syncText) syncText.textContent = 'Sync';
        }
    }

    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        const noTasks = document.getElementById('noTasks');
        const tasksCount = document.getElementById('tasksCount');

        if (!tasksList) return;

        if (this.tasks.length === 0) {
            tasksList.style.display = 'none';
            if (noTasks) noTasks.style.display = 'block';
            if (tasksCount) tasksCount.textContent = '0 tasks';
            return;
        }

        if (noTasks) noTasks.style.display = 'none';
        tasksList.style.display = 'block';
        if (tasksCount) tasksCount.textContent = `${this.tasks.length} task${this.tasks.length !== 1 ? 's' : ''}`;

        tasksList.innerHTML = this.tasks.map(task => this.createTaskCard(task)).join('');

        // Add click listeners to task cards
        tasksList.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', () => {
                const taskId = parseInt(card.dataset.taskId);
                this.openTaskModal(taskId);
            });
        });
    }

    createTaskCard(task) {
        const statusClass = window.apiService.getStatusColor(task.status);
        const priorityClass = window.apiService.getPriorityColor(task.priority);
        const formattedDate = window.apiService.formatDate(task.createdAt);

        return `
            <div class="task-card" data-task-id="${task.id}">
                <div class="task-card-header">
                    <a href="#" class="task-id">${window.apiService.escapeHtml(task.ticketNumber || `#${task.id}`)}</a>
                    <button class="task-view-btn">👁️</button>
                </div>
                
                <div class="task-customer">
                    <div class="task-customer-name">${window.apiService.escapeHtml(task.customer?.name || 'Unknown Customer')}</div>
                    <div class="task-customer-location">
                        📍 ${window.apiService.escapeHtml(task.customer?.city || 'Unknown Location')}
                    </div>
                </div>
                
                <div class="task-issue">
                    ⚠️ ${window.apiService.escapeHtml(task.issueType || 'General Issue')}
                </div>
                
                <div class="task-badges">
                    <span class="task-badge ${priorityClass}">${task.priority || 'Normal'}</span>
                    <span class="task-badge ${statusClass}">${(task.status || 'pending').replace('_', ' ')}</span>
                </div>
                
                <div class="task-footer">
                    <div class="task-date">
                        📅 ${formattedDate}
                    </div>
                    <div class="task-action">
                        View Details →
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        const tasksList = document.getElementById('tasksList');
        const noTasks = document.getElementById('noTasks');
        const tasksCount = document.getElementById('tasksCount');

        if (tasksList) tasksList.style.display = 'none';
        if (noTasks) noTasks.style.display = 'block';
        if (tasksCount) tasksCount.textContent = '0 tasks';
    }

    updateStats() {
        const stats = {
            total: this.tasks.length,
            pending: this.tasks.filter(t => t.status === 'pending').length,
            inProgress: this.tasks.filter(t => t.status === 'in_progress').length,
            completed: this.tasks.filter(t => t.status === 'completed' || t.status === 'resolved').length
        };

        const totalTasks = document.getElementById('totalTasks');
        const pendingTasks = document.getElementById('pendingTasks');
        const inProgressTasks = document.getElementById('inProgressTasks');
        const completedTasks = document.getElementById('completedTasks');

        if (totalTasks) totalTasks.textContent = stats.total;
        if (pendingTasks) pendingTasks.textContent = stats.pending;
        if (inProgressTasks) inProgressTasks.textContent = stats.inProgress;
        if (completedTasks) completedTasks.textContent = stats.completed;
    }

    async openTaskModal(taskId) {
        this.currentTask = this.tasks.find(t => t.id === taskId);
        if (!this.currentTask) {
            window.apiService.showToast('Task not found', 'error');
            return;
        }

        const modal = document.getElementById('taskModal');
        const modalTitle = document.getElementById('modalTitle');

        if (modalTitle) {
            modalTitle.textContent = `Task Details - ${this.currentTask.ticketNumber || `#${this.currentTask.id}`}`;
        }

        // Reset to details tab
        this.switchTab('details');
        
        // Render task details
        this.renderTaskDetails();
        
        // Load task history
        await this.loadTaskHistory();

        // Show modal
        if (modal) modal.style.display = 'flex';
    }

    closeTaskModal() {
        const modal = document.getElementById('taskModal');
        if (modal) modal.style.display = 'none';
        
        // Reset form states
        this.resetUpdateForm();
        this.selectedFiles = [];
        this.renderSelectedFiles();
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });

        const activeTab = document.getElementById(`${tabName}Tab`);
        if (activeTab) {
            activeTab.classList.add('active');
            activeTab.style.display = 'block';
        }
    }

    renderTaskDetails() {
        if (!this.currentTask) return;

        const taskDetails = document.getElementById('taskDetails');
        if (!taskDetails) return;

        const task = this.currentTask;
        const statusClass = window.apiService.getStatusColor(task.status);
        const priorityClass = window.apiService.getPriorityColor(task.priority);

        taskDetails.innerHTML = `
            <div class="task-detail-header">
                <div class="task-detail-title">${window.apiService.escapeHtml(task.ticketNumber || `Task #${task.id}`)}</div>
                <div class="task-detail-description">${window.apiService.escapeHtml(task.title || task.description || 'No description available')}</div>
                <div class="task-detail-badges">
                    <span class="task-badge ${priorityClass}">${task.priority || 'Normal'}</span>
                    <span class="task-badge ${statusClass}">${(task.status || 'pending').replace('_', ' ')}</span>
                </div>
            </div>

            <div class="task-info-grid">
                <div class="task-info-item">
                    <div class="task-info-label">Issue Type</div>
                    <div class="task-info-value">${window.apiService.escapeHtml(task.issueType || 'General Issue')}</div>
                </div>
                <div class="task-info-item">
                    <div class="task-info-label">Assigned Engineer</div>
                    <div class="task-info-value">${task.assignedUser ? 
                        window.apiService.escapeHtml(`${task.assignedUser.firstName || ''} ${task.assignedUser.lastName || ''}`.trim()) 
                        : 'Not assigned'}</div>
                </div>
                <div class="task-info-item">
                    <div class="task-info-label">Created</div>
                    <div class="task-info-value">${window.apiService.formatDateTime(task.createdAt)}</div>
                </div>
                <div class="task-info-item">
                    <div class="task-info-label">Last Updated</div>
                    <div class="task-info-value">${window.apiService.formatDateTime(task.updatedAt)}</div>
                </div>
            </div>

            ${task.customer ? `
                <div class="task-info-grid">
                    <div class="task-info-item">
                        <div class="task-info-label">Customer Name</div>
                        <div class="task-info-value">${window.apiService.escapeHtml(task.customer.name || 'N/A')}</div>
                    </div>
                    <div class="task-info-item">
                        <div class="task-info-label">Contact Person</div>
                        <div class="task-info-value">${window.apiService.escapeHtml(task.customer.contactPerson || 'N/A')}</div>
                    </div>
                    <div class="task-info-item">
                        <div class="task-info-label">Location</div>
                        <div class="task-info-value">${window.apiService.escapeHtml(
                            [task.customer.address, task.customer.city, task.customer.state]
                                .filter(Boolean).join(', ') || 'N/A'
                        )}</div>
                    </div>
                    <div class="task-info-item">
                        <div class="task-info-label">Phone</div>
                        <div class="task-info-value">${window.apiService.escapeHtml(task.customer.mobilePhone || 'N/A')}</div>
                    </div>
                    <div class="task-info-item">
                        <div class="task-info-label">Email</div>
                        <div class="task-info-value">${window.apiService.escapeHtml(task.customer.email || 'N/A')}</div>
                    </div>
                    <div class="task-info-item">
                        <div class="task-info-label">Service Plan</div>
                        <div class="task-info-value">${window.apiService.escapeHtml(task.customer.servicePlan || 'N/A')}</div>
                    </div>
                </div>
            ` : ''}
        `;

        // Setup update form
        this.setupUpdateForm();
    }

    setupUpdateForm() {
        if (!this.currentTask) return;

        const statusSelect = document.getElementById('statusSelect');
        const updateNotes = document.getElementById('updateNotes');
        const notesHint = document.getElementById('notesHint');

        // Set current status in select (but don't select it)
        if (statusSelect) {
            statusSelect.value = '';
            
            // Update placeholder based on current status
            const currentStatus = this.currentTask.status || 'pending';
            statusSelect.querySelector('option[value=""]').textContent = 
                `Current: ${currentStatus.replace('_', ' ')} - Select new status`;
            
            // Disable update if task is finalized
            if (currentStatus === 'resolved' || currentStatus === 'completed') {
                statusSelect.disabled = true;
                if (updateNotes) {
                    updateNotes.disabled = true;
                    updateNotes.placeholder = 'Task is finalized - no further updates allowed';
                }
                if (notesHint) {
                    notesHint.textContent = 'This task has been finalized and cannot be modified further';
                    notesHint.className = 'notes-hint error';
                    notesHint.style.display = 'block';
                }
            } else {
                statusSelect.disabled = false;
                if (updateNotes) {
                    updateNotes.disabled = false;
                    updateNotes.placeholder = 'Add notes about this update...';
                }
            }
        }

        if (updateNotes) {
            updateNotes.value = '';
        }

        this.updateNotesHint();
    }

    handleStatusChange() {
        this.updateNotesHint();
        this.updateSubmitButton();
    }

    updateNotesHint() {
        const statusSelect = document.getElementById('statusSelect');
        const notesHint = document.getElementById('notesHint');
        const updateNotes = document.getElementById('updateNotes');
        
        if (!statusSelect || !notesHint) return;

        const selectedStatus = statusSelect.value;
        const currentStatus = this.currentTask?.status;

        if (currentStatus === 'resolved' || currentStatus === 'completed') {
            notesHint.textContent = 'This task has been finalized and cannot be modified further';
            notesHint.className = 'notes-hint error';
            notesHint.style.display = 'block';
            return;
        }

        if (selectedStatus === 'completed' && currentStatus !== 'completed') {
            notesHint.textContent = '⚠️ Resolution notes are required when marking task as completed';
            notesHint.className = 'notes-hint';
            notesHint.style.display = 'block';
            if (updateNotes) {
                updateNotes.placeholder = 'Provide resolution details (required)';
            }
        } else if (selectedStatus === 'in_progress' && currentStatus === 'pending') {
            notesHint.textContent = '⏱️ Start time will be automatically recorded';
            notesHint.className = 'notes-hint success';
            notesHint.style.display = 'block';
        } else if (selectedStatus === 'cancelled') {
            notesHint.textContent = '❌ Task will be marked as cancelled';
            notesHint.className = 'notes-hint';
            notesHint.style.display = 'block';
        } else if (selectedStatus) {
            notesHint.textContent = 'Add notes about this status change (optional)';
            notesHint.className = 'notes-hint success';
            notesHint.style.display = 'block';
            if (updateNotes) {
                updateNotes.placeholder = 'Add notes about this update (optional)';
            }
        } else {
            notesHint.style.display = 'none';
            if (updateNotes) {
                updateNotes.placeholder = 'Add notes about this update...';
            }
        }
    }

    updateSubmitButton() {
        const updateBtn = document.getElementById('updateTaskBtn');
        const statusSelect = document.getElementById('statusSelect');
        const updateNotes = document.getElementById('updateNotes');
        
        if (!updateBtn) return;

        const hasStatusChange = statusSelect?.value;
        const hasNotes = updateNotes?.value.trim();
        const hasFiles = this.selectedFiles.length > 0;
        const isFinalized = this.currentTask?.status === 'resolved' || this.currentTask?.status === 'completed';

        // Validation for completed status
        const isCompletedStatus = statusSelect?.value === 'completed';
        const completedNeedsNotes = isCompletedStatus && !hasNotes;

        const canSubmit = !isFinalized && (hasStatusChange || hasNotes || hasFiles) && !completedNeedsNotes;
        
        updateBtn.disabled = !canSubmit;
        
        // Update button text
        const btnText = updateBtn.querySelector('.btn-text');
        if (btnText) {
            if (hasFiles && (hasStatusChange || hasNotes)) {
                btnText.textContent = 'Upload & Update';
            } else if (hasFiles) {
                btnText.textContent = 'Upload Files';
            } else {
                btnText.textContent = 'Update Task';
            }
        }
    }

    resetUpdateForm() {
        const statusSelect = document.getElementById('statusSelect');
        const updateNotes = document.getElementById('updateNotes');
        const notesHint = document.getElementById('notesHint');
        const updateBtn = document.getElementById('updateTaskBtn');

        if (statusSelect) {
            statusSelect.value = '';
            statusSelect.disabled = false;
        }
        if (updateNotes) {
            updateNotes.value = '';
            updateNotes.disabled = false;
            updateNotes.placeholder = 'Add notes about this update...';
        }
        if (notesHint) {
            notesHint.style.display = 'none';
        }
        if (updateBtn) {
            updateBtn.disabled = true;
            const btnText = updateBtn.querySelector('.btn-text');
            if (btnText) btnText.textContent = 'Update Task';
        }
    }

    async loadTaskHistory() {
        if (!this.currentTask) return;

        try {
            const updates = await window.apiService.getTaskUpdates(this.currentTask.id);
            this.renderTaskHistory(updates || []);
        } catch (error) {
            console.error('❌ Failed to load task history:', error);
            this.renderTaskHistory([]);
        }
    }

    renderTaskHistory(updates) {
        const taskHistory = document.getElementById('taskHistory');
        if (!taskHistory) return;

        if (updates.length === 0) {
            taskHistory.innerHTML = `
                <div class="no-tasks">
                    <div class="no-tasks-icon">📋</div>
                    <div class="no-tasks-title">No Updates Yet</div>
                    <div class="no-tasks-text">This task hasn't been updated yet.</div>
                </div>
            `;
            return;
        }

        taskHistory.innerHTML = updates.map(update => this.createHistoryItem(update)).join('');
    }

    createHistoryItem(update) {
        const typeInfo = this.getUpdateTypeInfo(update);
        const userName = update.updatedByUser?.firstName && update.updatedByUser?.lastName 
            ? `${update.updatedByUser.firstName} ${update.updatedByUser.lastName}`
            : update.createdByName || 'Unknown User';
        const userRole = update.updatedByUser?.role?.replace('_', ' ') || 'User';
        const timestamp = window.apiService.formatDateTime(update.createdAt);

        const filesHtml = update.files && update.files.length > 0 ? `
            <div class="history-files">
                <div class="history-files-title">📎 Attached Files (${update.files.length})</div>
                ${update.files.map(file => `
                    <div class="history-file">
                        <span class="history-file-name">${window.apiService.escapeHtml(file)}</span>
                        <button class="history-file-download" onclick="downloadFile('${file}')">⬇️</button>
                    </div>
                `).join('')}
            </div>
        ` : '';

        return `
            <div class="history-item ${update.type || 'comment'}">
                <div class="history-header">
                    <div class="history-icon">${typeInfo.icon}</div>
                    <div class="history-user">${window.apiService.escapeHtml(userName)}</div>
                    <div class="history-role">${window.apiService.escapeHtml(userRole)}</div>
                    <div class="history-type">${typeInfo.typeLabel}</div>
                </div>
                <div class="history-content">
                    <div class="history-message">${window.apiService.escapeHtml(update.message || 'No message provided')}</div>
                    ${filesHtml}
                </div>
                <div class="history-timestamp">${timestamp}</div>
            </div>
        `;
    }

    getUpdateTypeInfo(update) {
        const type = update.type || 'comment';
        switch (type) {
            case 'status_update':
                return { icon: '🔄', typeLabel: 'Status Change' };
            case 'file_upload':
                return { icon: '📎', typeLabel: 'File Upload' };
            case 'comment':
                return { icon: '💬', typeLabel: 'Comment' };
            default:
                return { icon: '🕐', typeLabel: 'Update' };
        }
    }

    // File handling methods will be added in the next part
    handleFileSelect(event) {
        const files = Array.from(event.target.files || []);
        this.selectedFiles = [...this.selectedFiles, ...files];
        this.renderSelectedFiles();
        this.updateSubmitButton();
    }

    renderSelectedFiles() {
        const selectedFilesContainer = document.getElementById('selectedFiles');
        if (!selectedFilesContainer) return;

        if (this.selectedFiles.length === 0) {
            selectedFilesContainer.innerHTML = '';
            return;
        }

        selectedFilesContainer.innerHTML = `
            <div style="margin-bottom: 16px;">
                <strong>Selected Files (${this.selectedFiles.length}):</strong>
            </div>
            ${this.selectedFiles.map((file, index) => `
                <div class="file-item">
                    <div class="file-info">
                        <div class="file-icon">${file.type.startsWith('image/') ? '🖼️' : '📄'}</div>
                        <div class="file-details">
                            <div class="file-name">${window.apiService.escapeHtml(file.name)}</div>
                            <div class="file-size">${(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                    </div>
                    <button class="file-remove" onclick="taskManager.removeFile(${index})">🗑️</button>
                </div>
            `).join('')}
        `;
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.renderSelectedFiles();
        this.updateSubmitButton();
    }

    clearFiles() {
        this.selectedFiles = [];
        this.renderSelectedFiles();
        this.updateSubmitButton();
        
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = '';
        
        const fileNotes = document.getElementById('fileNotes');
        if (fileNotes) fileNotes.value = '';
    }
}

// Global functions for file operations
function selectFiles() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.click();
}

function takePhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
        const files = Array.from(e.target.files || []);
        window.taskManager.selectedFiles = [...window.taskManager.selectedFiles, ...files];
        window.taskManager.renderSelectedFiles();
        window.taskManager.updateSubmitButton();
    };
    input.click();
}

function downloadFile(filename) {
    const link = document.createElement('a');
    link.href = `/uploads/${filename}`;
    link.download = filename;
    link.click();
}

// Task action functions
async function updateTask() {
    if (!window.taskManager.currentTask) return;

    const updateBtn = document.getElementById('updateTaskBtn');
    const btnText = updateBtn?.querySelector('.btn-text');
    const btnSpinner = updateBtn?.querySelector('.btn-spinner');
    const statusSelect = document.getElementById('statusSelect');
    const updateNotes = document.getElementById('updateNotes');

    const selectedStatus = statusSelect?.value;
    const notes = updateNotes?.value.trim();
    const hasFiles = window.taskManager.selectedFiles.length > 0;

    // Validation
    if (selectedStatus === 'completed' && !notes) {
        window.apiService.showToast('Resolution notes are required when marking task as completed', 'error');
        return;
    }

    // Show loading
    if (updateBtn) updateBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline';

    try {
        // Handle file uploads first if any
        if (hasFiles) {
            const formData = new FormData();
            window.taskManager.selectedFiles.forEach(file => {
                formData.append('files', file);
            });
            
            const fileNotes = document.getElementById('fileNotes');
            if (fileNotes?.value.trim()) {
                formData.append('notes', fileNotes.value.trim());
            }

            await window.apiService.uploadFiles(window.taskManager.currentTask.id, formData);
        }

        // Handle task update if status or notes changed
        if (selectedStatus || notes) {
            const updateData = {};
            if (selectedStatus) updateData.status = selectedStatus;
            if (notes) {
                updateData.notes = notes;
                if (selectedStatus !== 'completed') {
                    updateData.description = notes;
                }
            }

            await window.apiService.updateTask(window.taskManager.currentTask.id, updateData);
        }

        // Success
        window.apiService.showToast(
            hasFiles && (selectedStatus || notes) ? 'Files uploaded and task updated successfully' :
            hasFiles ? 'Files uploaded successfully' :
            'Task updated successfully',
            'success'
        );

        // Refresh data
        await window.taskManager.loadTasks();
        await window.taskManager.loadTaskHistory();
        
        // Close modal
        window.taskManager.closeTaskModal();

    } catch (error) {
        console.error('❌ Update failed:', error);
        window.apiService.showToast('Update failed: ' + error.message, 'error');
    } finally {
        // Reset button
        if (updateBtn) updateBtn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnSpinner) btnSpinner.style.display = 'none';
    }
}

async function uploadFiles() {
    if (window.taskManager.selectedFiles.length === 0) {
        window.apiService.showToast('Please select files to upload', 'error');
        return;
    }

    const uploadBtn = document.getElementById('uploadFilesBtn');
    const btnText = uploadBtn?.querySelector('.btn-text');
    const btnSpinner = uploadBtn?.querySelector('.btn-spinner');

    // Show loading
    if (uploadBtn) uploadBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline';

    try {
        const formData = new FormData();
        window.taskManager.selectedFiles.forEach(file => {
            formData.append('files', file);
        });
        
        const fileNotes = document.getElementById('fileNotes');
        if (fileNotes?.value.trim()) {
            formData.append('notes', fileNotes.value.trim());
        }

        await window.apiService.uploadFiles(window.taskManager.currentTask.id, formData);
        
        window.apiService.showToast('Files uploaded successfully', 'success');
        
        // Clear files and refresh
        window.taskManager.clearFiles();
        await window.taskManager.loadTaskHistory();

    } catch (error) {
        console.error('❌ Upload failed:', error);
        window.apiService.showToast('Upload failed: ' + error.message, 'error');
    } finally {
        // Reset button
        if (uploadBtn) uploadBtn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnSpinner) btnSpinner.style.display = 'none';
    }
}

function closeTaskModal() {
    window.taskManager.closeTaskModal();
}

async function loadTasks() {
    await window.taskManager.loadTasks();
}

// Create global task manager instance
window.taskManager = new TaskManager();