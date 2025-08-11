package com.wizoneit.fieldapp.ui.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wizoneit.fieldapp.data.model.Task
import com.wizoneit.fieldapp.data.repository.TaskRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class TaskListViewModel(
    private val taskRepository: TaskRepository
) : ViewModel() {
    
    private val _tasks = MutableStateFlow<List<Task>>(emptyList())
    val tasks: StateFlow<List<Task>> = _tasks.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    init {
        // Observe cached tasks
        viewModelScope.launch {
            taskRepository.getTasksFlow().collect { cachedTasks ->
                _tasks.value = cachedTasks
            }
        }
    }
    
    fun loadTasks() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            taskRepository.syncTasks()
                .onSuccess { tasks ->
                    // Tasks are automatically updated via Flow
                }
                .onFailure { throwable ->
                    _error.value = throwable.message ?: "Failed to load tasks"
                }
            
            _isLoading.value = false
        }
    }
    
    fun refreshTasks() {
        loadTasks()
    }
    
    fun getTaskStats(): TaskStats {
        val taskList = _tasks.value
        return TaskStats(
            total = taskList.size,
            pending = taskList.count { it.status == "pending" },
            inProgress = taskList.count { it.status == "in_progress" },
            completed = taskList.count { it.status == "completed" || it.status == "resolved" },
            highPriority = taskList.count { it.priority == "high" && it.status !in listOf("completed", "resolved") }
        )
    }
}

data class TaskStats(
    val total: Int,
    val pending: Int,
    val inProgress: Int,
    val completed: Int,
    val highPriority: Int
)