package com.wizoneit.fieldapp.data.model

import com.google.gson.annotations.SerializedName
import java.util.Date

// Authentication models
data class LoginRequest(
    val username: String,
    val password: String
)

data class LoginResponse(
    val id: String,
    val username: String,
    val email: String?,
    val firstName: String?,
    val lastName: String?,
    val role: String,
    val department: String?,
    val token: String? = null // For JWT token if server provides it
)

data class RefreshTokenRequest(
    val refreshToken: String
)

// User model
data class User(
    val id: String,
    val username: String,
    val email: String?,
    val firstName: String?,
    val lastName: String?,
    val role: String,
    val department: String?,
    val isActive: Boolean = true,
    val createdAt: Date?,
    val updatedAt: Date?
)

// Task models
data class Task(
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
    val assignedUser: AssignedUser?,
    val fieldEngineerId: String?,
    val backendEngineerId: String?,
    val createdAt: Date,
    val updatedAt: Date,
    val resolvedAt: Date?
)

data class AssignedUser(
    val firstName: String?,
    val lastName: String?,
    val email: String?
)

data class TaskDetail(
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
    val assignedUser: AssignedUser?,
    val fieldEngineerId: String?,
    val backendEngineerId: String?,
    val createdAt: Date,
    val updatedAt: Date,
    val resolvedAt: Date?,
    val updates: List<TaskUpdate>? = null,
    val attachments: List<TaskAttachment>? = null
)

data class TaskUpdate(
    val id: Int,
    val taskId: Int,
    val status: String?,
    val note: String?,
    val updatedBy: String,
    val filePath: String?,
    val createdAt: Date
)

data class TaskAttachment(
    val id: Int,
    val taskId: Int,
    val fileName: String,
    val filePath: String,
    val fileSize: Long,
    val mimeType: String?,
    val uploadedBy: String,
    val createdAt: Date
)

data class TaskUpdateRequest(
    val status: String?,
    val note: String?,
    val timeSpent: Int? = null
)

// Location and activity models
data class LocationUpdateRequest(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float?,
    val timestamp: Long = System.currentTimeMillis()
)

data class ActivityRequest(
    val type: String, // "location", "task_update", "login", etc.
    val data: Map<String, Any>,
    val timestamp: Long = System.currentTimeMillis()
)

// File upload models
data class AttachmentResponse(
    val id: Int,
    val fileName: String,
    val filePath: String,
    val message: String
)

// Health check model
data class HealthResponse(
    val status: String,
    val timestamp: Long,
    val version: String? = null,
    val database: String? = null
)

// Error response model
data class ErrorResponse(
    val message: String,
    val error: String? = null,
    val code: Int? = null
)