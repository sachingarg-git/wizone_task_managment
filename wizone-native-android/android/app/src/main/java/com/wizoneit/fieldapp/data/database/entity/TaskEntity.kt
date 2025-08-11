package com.wizoneit.fieldapp.data.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.Date

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey
    val id: Int,
    val title: String,
    val ticketNumber: String,
    val description: String?,
    val status: String,
    val priority: String,
    val issueType: String?,
    val customerId: Int?,
    val customerName: String?,
    val assignedTo: String?,
    val assignedUserFirstName: String?,
    val assignedUserLastName: String?,
    val assignedUserEmail: String?,
    val fieldEngineerId: String?,
    val backendEngineerId: String?,
    val createdAt: Date,
    val updatedAt: Date,
    val resolvedAt: Date?,
    val lastModified: Long = System.currentTimeMillis(),
    val isSynced: Boolean = true
)

@Entity(tableName = "pending_uploads")
data class PendingUploadEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val taskId: Int,
    val type: String, // "task_update", "attachment", "location"
    val data: String, // JSON data
    val filePath: String? = null,
    val fileName: String? = null,
    val retryCount: Int = 0,
    val maxRetries: Int = 3,
    val createdAt: Date = Date(),
    val lastAttempt: Date? = null
)