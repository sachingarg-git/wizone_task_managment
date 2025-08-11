package com.wizoneit.fieldapp.ui.tasks.detail

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wizoneit.fieldapp.data.model.TaskDetail
import com.wizoneit.fieldapp.data.repository.TaskRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File

class TaskDetailViewModel(
    private val taskRepository: TaskRepository,
    private val taskId: Int
) : ViewModel() {
    
    private val _task = MutableStateFlow<TaskDetail?>(null)
    val task: StateFlow<TaskDetail?> = _task.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    private val _updateSuccess = MutableStateFlow(false)
    val updateSuccess: StateFlow<Boolean> = _updateSuccess.asStateFlow()
    
    fun loadTaskDetail() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            taskRepository.getTaskDetail(taskId)
                .onSuccess { taskDetail ->
                    _task.value = taskDetail
                }
                .onFailure { throwable ->
                    _error.value = throwable.message ?: "Failed to load task detail"
                }
            
            _isLoading.value = false
        }
    }
    
    fun updateTask(status: String, note: String, timeSpent: Int? = null) {
        val currentTask = _task.value
        if (currentTask?.status in listOf("completed", "resolved")) {
            _error.value = "Cannot update completed or resolved tasks"
            return
        }
        
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            taskRepository.updateTask(taskId, status, note, timeSpent)
                .onSuccess { updatedTask ->
                    // Reload full task detail to get latest updates
                    loadTaskDetail()
                    _updateSuccess.value = true
                    
                    // Reset success flag after a short delay
                    kotlinx.coroutines.delay(100)
                    _updateSuccess.value = false
                }
                .onFailure { throwable ->
                    _error.value = throwable.message ?: "Failed to update task"
                }
            
            _isLoading.value = false
        }
    }
    
    fun uploadAttachment(file: File, notes: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            taskRepository.uploadAttachment(taskId, file, notes)
                .onSuccess { response ->
                    // Reload task detail to show new attachment
                    loadTaskDetail()
                    _updateSuccess.value = true
                    
                    // Reset success flag
                    kotlinx.coroutines.delay(100)
                    _updateSuccess.value = false
                }
                .onFailure { throwable ->
                    _error.value = throwable.message ?: "Failed to upload attachment"
                }
            
            _isLoading.value = false
        }
    }
    
    fun getTaskUpdates() {
        viewModelScope.launch {
            taskRepository.getTaskUpdates(taskId)
                .onSuccess { updates ->
                    // Updates are typically included in task detail
                    // This could be used for a separate updates view
                }
                .onFailure { throwable ->
                    _error.value = throwable.message ?: "Failed to load task updates"
                }
        }
    }
}