package com.wizoneit.fieldapp.data.api

import com.wizoneit.fieldapp.data.model.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    // Authentication endpoints
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>
    
    @POST("api/auth/logout")
    suspend fun logout(): Response<Unit>
    
    @GET("api/auth/user")
    suspend fun getCurrentUser(): Response<User>
    
    @POST("api/auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): Response<LoginResponse>
    
    // Task endpoints
    @GET("api/tasks")
    suspend fun getTasks(@Query("assignedTo") engineerId: String? = null): Response<List<Task>>
    
    @GET("api/tasks/{id}")
    suspend fun getTask(@Path("id") taskId: Int): Response<TaskDetail>
    
    @PUT("api/tasks/{id}")
    suspend fun updateTask(@Path("id") taskId: Int, @Body request: TaskUpdateRequest): Response<Task>
    
    @GET("api/tasks/{id}/updates")
    suspend fun getTaskUpdates(@Path("id") taskId: Int): Response<List<TaskUpdate>>
    
    // File upload endpoints
    @Multipart
    @POST("api/tasks/{id}/attachments")
    suspend fun uploadAttachment(
        @Path("id") taskId: Int,
        @Part file: MultipartBody.Part,
        @Part("notes") notes: RequestBody
    ): Response<AttachmentResponse>
    
    // Location tracking endpoints
    @POST("api/engineer/{id}/location")
    suspend fun updateLocation(
        @Path("id") engineerId: String,
        @Body request: LocationUpdateRequest
    ): Response<Unit>
    
    @POST("api/activity/publish")
    suspend fun publishActivity(@Body request: ActivityRequest): Response<Unit>
    
    // Connection test endpoints
    @GET("api/health")
    suspend fun testConnection(): Response<HealthResponse>
    
    @GET("test-connection")
    suspend fun testConnectionFallback(): Response<HealthResponse>
}