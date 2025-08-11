package com.wizoneit.fieldapp.worker

import android.content.Context
import androidx.work.*
import com.wizoneit.fieldapp.WizoneApplication
import com.wizoneit.fieldapp.data.repository.TaskRepository
import com.wizoneit.fieldapp.data.repository.AuthRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

class SyncWorker(
    context: Context,
    params: WorkerParameters,
    private val taskRepository: TaskRepository,
    private val authRepository: AuthRepository
) : CoroutineWorker(context, params) {
    
    companion object {
        private const val WORK_NAME = "sync_work"
        
        fun startPeriodicSync(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(true)
                .build()
            
            val syncRequest = PeriodicWorkRequestBuilder<SyncWorker>(15, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .setBackoffCriteria(
                    BackoffPolicy.EXPONENTIAL,
                    WorkRequest.MIN_BACKOFF_MILLIS,
                    TimeUnit.MILLISECONDS
                )
                .build()
            
            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(
                    WORK_NAME,
                    ExistingPeriodicWorkPolicy.KEEP,
                    syncRequest
                )
        }
        
        fun startOneTimeSync(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            
            val syncRequest = OneTimeWorkRequestBuilder<SyncWorker>()
                .setConstraints(constraints)
                .build()
            
            WorkManager.getInstance(context).enqueue(syncRequest)
        }
        
        fun cancelSync(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }
    }
    
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        return@withContext try {
            // Check if user is still authenticated
            if (!authRepository.isLoggedIn()) {
                Result.failure()
            }
            
            // Sync tasks
            taskRepository.syncTasks()
                .onSuccess {
                    // Success
                }
                .onFailure {
                    // Try token refresh if unauthorized
                    authRepository.refreshToken()
                        .onSuccess {
                            // Retry sync after refresh
                            taskRepository.syncTasks()
                        }
                }
            
            // TODO: Process pending uploads
            // processPendingUploads()
            
            Result.success()
        } catch (e: Exception) {
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }
    
    private suspend fun processPendingUploads() {
        // This would process any pending task updates or file uploads
        // that were queued while offline
        
        // Get pending uploads from database
        // For each upload:
        //   - Try to send to server
        //   - If successful, remove from pending
        //   - If failed, increment retry count
        //   - If max retries reached, mark as failed
    }
}

class SyncWorkerFactory(
    private val taskRepository: TaskRepository,
    private val authRepository: AuthRepository
) : ChildWorkerFactory {
    
    override fun create(context: Context, params: WorkerParameters): CoroutineWorker {
        return SyncWorker(context, params, taskRepository, authRepository)
    }
}

// Custom WorkerFactory to inject dependencies
class AppWorkerFactory(
    private val taskRepository: TaskRepository,
    private val authRepository: AuthRepository
) : WorkerFactory() {
    
    override fun createWorker(
        appContext: Context,
        workerClassName: String,
        workerParameters: WorkerParameters
    ): ListenableWorker? {
        return when (workerClassName) {
            SyncWorker::class.java.name -> {
                SyncWorker(appContext, workerParameters, taskRepository, authRepository)
            }
            else -> null
        }
    }
}

interface ChildWorkerFactory {
    fun create(context: Context, params: WorkerParameters): CoroutineWorker
}