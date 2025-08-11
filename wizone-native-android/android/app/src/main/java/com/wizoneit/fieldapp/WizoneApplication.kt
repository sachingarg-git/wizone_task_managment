package com.wizoneit.fieldapp

import android.app.Application
import androidx.work.Configuration
import androidx.work.WorkManager
import com.wizoneit.fieldapp.data.api.RetrofitClient
import com.wizoneit.fieldapp.data.repository.TaskRepository
import com.wizoneit.fieldapp.data.repository.AuthRepository
import com.wizoneit.fieldapp.data.storage.SecureStorage
import com.wizoneit.fieldapp.data.database.AppDatabase
import com.wizoneit.fieldapp.worker.AppWorkerFactory

class WizoneApplication : Application(), Configuration.Provider {
    
    // Lazy initialization of dependencies
    val secureStorage by lazy { SecureStorage(this) }
    val database by lazy { AppDatabase.getDatabase(this) }
    val apiService by lazy { RetrofitClient.apiService }
    val authRepository by lazy { AuthRepository(apiService, secureStorage) }
    val taskRepository by lazy { TaskRepository(apiService, database.taskDao(), secureStorage) }
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize WorkManager with custom configuration
        WorkManager.initialize(this, workManagerConfiguration)
    }
    
    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(AppWorkerFactory(taskRepository, authRepository))
            .build()
}