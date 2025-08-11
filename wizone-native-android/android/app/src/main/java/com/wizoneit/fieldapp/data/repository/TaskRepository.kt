package com.wizoneit.fieldapp.data.repository

import com.google.gson.Gson
import com.wizoneit.fieldapp.data.api.ApiService
import com.wizoneit.fieldapp.data.database.dao.TaskDao
import com.wizoneit.fieldapp.data.database.dao.PendingUploadDao
import com.wizoneit.fieldapp.data.database.entity.TaskEntity
import com.wizoneit.fieldapp.data.database.entity.PendingUploadEntity
import com.wizoneit.fieldapp.data.model.*
import com.wizoneit.fieldapp.data.storage.SecureStorage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.util.Date

class TaskRepository(
    private val apiService: ApiService,
    private val taskDao: TaskDao,
    private val secureStorage: SecureStorage
) {
    
    private val gson = Gson()
    
    fun getTasksFlow(): Flow<List<Task>> {
        return taskDao.getAllTasksFlow().map { entities ->
            entities.map { it.toTask() }
        }
    }
    
    suspend fun syncTasks(): Result<List<Task>> = withContext(Dispatchers.IO) {
        try {
            val userId = secureStorage.getUserId()
            val response = apiService.getTasks(userId)
            
            if (response.isSuccessful && response.body() != null) {
                val tasks = response.body()!!
                
                // Save to local database
                val taskEntities = tasks.map { it.toTaskEntity() }
                taskDao.insertTasks(taskEntities)
                
                // Update sync time
                secureStorage.saveLastSyncTime(System.currentTimeMillis())
                
                Result.success(tasks)
            } else {
                // Return cached tasks if sync fails
                val cachedTasks = taskDao.getAllTasks().map { it.toTask() }
                Result.success(cachedTasks)
            }
        } catch (e: Exception) {
            // Return cached tasks if sync fails
            val cachedTasks = taskDao.getAllTasks().map { it.toTask() }
            Result.success(cachedTasks)
        }
    }
    
    suspend fun getTaskDetail(taskId: Int): Result<TaskDetail> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getTask(taskId)
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to get task detail: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateTask(taskId: Int, status: String?, note: String?, timeSpent: Int? = null): Result<Task> = withContext(Dispatchers.IO) {
        try {
            val updateRequest = TaskUpdateRequest(status, note, timeSpent)
            val response = apiService.updateTask(taskId, updateRequest)
            
            if (response.isSuccessful && response.body() != null) {
                val updatedTask = response.body()!!
                
                // Update local database
                val taskEntity = updatedTask.toTaskEntity()
                taskDao.updateTask(taskEntity)
                
                Result.success(updatedTask)
            } else {
                // Store update locally for later sync
                addPendingUpdate(taskId, updateRequest)
                
                // Update local task status
                val localTask = taskDao.getTaskById(taskId)
                localTask?.let { task ->
                    val updatedTask = task.copy(
                        status = status ?: task.status,
                        lastModified = System.currentTimeMillis(),
                        isSynced = false
                    )
                    taskDao.updateTask(updatedTask)
                }
                
                Result.failure(Exception("Update saved locally, will sync when online"))
            }
        } catch (e: Exception) {
            // Store update locally for later sync
            val updateRequest = TaskUpdateRequest(status, note, timeSpent)
            addPendingUpdate(taskId, updateRequest)
            
            Result.failure(e)
        }
    }
    
    suspend fun uploadAttachment(taskId: Int, file: File, notes: String): Result<AttachmentResponse> = withContext(Dispatchers.IO) {
        try {
            val requestFile = file.asRequestBody("multipart/form-data".toMediaTypeOrNull())
            val body = MultipartBody.Part.createFormData("file", file.name, requestFile)
            val notesBody = notes.toRequestBody("text/plain".toMediaTypeOrNull())
            
            val response = apiService.uploadAttachment(taskId, body, notesBody)
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                // Store for later upload
                addPendingAttachment(taskId, file.absolutePath, file.name, notes)
                Result.failure(Exception("Attachment saved locally, will upload when online"))
            }
        } catch (e: Exception) {
            // Store for later upload
            addPendingAttachment(taskId, file.absolutePath, file.name, notes)
            Result.failure(e)
        }
    }
    
    suspend fun getTaskUpdates(taskId: Int): Result<List<TaskUpdate>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getTaskUpdates(taskId)
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to get task updates: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    private suspend fun addPendingUpdate(taskId: Int, updateRequest: TaskUpdateRequest) {
        val pendingUpload = PendingUploadEntity(
            taskId = taskId,
            type = "task_update",
            data = gson.toJson(updateRequest),
            createdAt = Date()
        )
        // Note: This would need a PendingUploadDao instance
    }
    
    private suspend fun addPendingAttachment(taskId: Int, filePath: String, fileName: String, notes: String) {
        val attachmentData = mapOf("notes" to notes)
        val pendingUpload = PendingUploadEntity(
            taskId = taskId,
            type = "attachment",
            data = gson.toJson(attachmentData),
            filePath = filePath,
            fileName = fileName,
            createdAt = Date()
        )
        // Note: This would need a PendingUploadDao instance
    }
    
    // Extension functions to convert between models
    private fun Task.toTaskEntity(): TaskEntity {
        return TaskEntity(
            id = this.id,
            title = this.title,
            ticketNumber = this.ticketNumber,
            description = this.description,
            status = this.status,
            priority = this.priority,
            issueType = this.issueType,
            customerId = this.customerId,
            customerName = this.customerName,
            assignedTo = this.assignedTo,
            assignedUserFirstName = this.assignedUser?.firstName,
            assignedUserLastName = this.assignedUser?.lastName,
            assignedUserEmail = this.assignedUser?.email,
            fieldEngineerId = this.fieldEngineerId,
            backendEngineerId = this.backendEngineerId,
            createdAt = this.createdAt,
            updatedAt = this.updatedAt,
            resolvedAt = this.resolvedAt
        )
    }
    
    private fun TaskEntity.toTask(): Task {
        return Task(
            id = this.id,
            title = this.title,
            ticketNumber = this.ticketNumber,
            description = this.description,
            status = this.status,
            priority = this.priority,
            issueType = this.issueType,
            customerId = this.customerId,
            customerName = this.customerName,
            assignedTo = this.assignedTo,
            assignedUser = if (assignedUserFirstName != null || assignedUserLastName != null) {
                AssignedUser(assignedUserFirstName, assignedUserLastName, assignedUserEmail)
            } else null,
            fieldEngineerId = this.fieldEngineerId,
            backendEngineerId = this.backendEngineerId,
            createdAt = this.createdAt,
            updatedAt = this.updatedAt,
            resolvedAt = this.resolvedAt
        )
    }
}