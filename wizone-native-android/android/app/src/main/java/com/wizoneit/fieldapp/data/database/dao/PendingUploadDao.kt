package com.wizoneit.fieldapp.data.database.dao

import androidx.room.*
import com.wizoneit.fieldapp.data.database.entity.PendingUploadEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface PendingUploadDao {
    
    @Query("SELECT * FROM pending_uploads ORDER BY createdAt ASC")
    suspend fun getAllPendingUploads(): List<PendingUploadEntity>
    
    @Query("SELECT * FROM pending_uploads WHERE retryCount < maxRetries ORDER BY createdAt ASC")
    suspend fun getPendingUploadsForRetry(): List<PendingUploadEntity>
    
    @Query("SELECT COUNT(*) FROM pending_uploads WHERE retryCount < maxRetries")
    fun getPendingUploadCountFlow(): Flow<Int>
    
    @Query("SELECT COUNT(*) FROM pending_uploads WHERE retryCount < maxRetries")
    suspend fun getPendingUploadCount(): Int
    
    @Insert
    suspend fun insertPendingUpload(upload: PendingUploadEntity): Long
    
    @Update
    suspend fun updatePendingUpload(upload: PendingUploadEntity)
    
    @Delete
    suspend fun deletePendingUpload(upload: PendingUploadEntity)
    
    @Query("DELETE FROM pending_uploads WHERE id = :uploadId")
    suspend fun deletePendingUploadById(uploadId: Long)
    
    @Query("UPDATE pending_uploads SET retryCount = retryCount + 1, lastAttempt = datetime('now') WHERE id = :uploadId")
    suspend fun incrementRetryCount(uploadId: Long)
    
    @Query("DELETE FROM pending_uploads WHERE retryCount >= maxRetries")
    suspend fun deleteFailedUploads()
}