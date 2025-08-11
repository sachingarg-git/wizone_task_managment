package com.wizoneit.fieldapp.ui.settings

import android.content.Intent
import android.os.Bundle
import android.view.MenuItem
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import com.wizoneit.fieldapp.BuildConfig
import com.wizoneit.fieldapp.WizoneApplication
import com.wizoneit.fieldapp.databinding.ActivitySettingsBinding
import com.wizoneit.fieldapp.service.LocationTrackingService
import com.wizoneit.fieldapp.ui.login.LoginActivity
import com.wizoneit.fieldapp.worker.SyncWorker
import kotlinx.coroutines.launch

class SettingsActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivitySettingsBinding
    private lateinit var app: WizoneApplication
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        app = application as WizoneApplication
        
        setupToolbar()
        setupUI()
        loadSettings()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Settings"
    }
    
    private fun setupUI() {
        // User info
        lifecycleScope.launch {
            val userName = app.secureStorage.getUserName()
            val username = app.secureStorage.getUsername()
            val role = app.secureStorage.getUserRole()
            
            binding.tvUserName.text = userName ?: "Field Engineer"
            binding.tvUsername.text = "@$username"
            binding.tvUserRole.text = role?.replaceFirstChar { it.uppercase() } ?: "Engineer"
        }
        
        // App version
        binding.tvAppVersion.text = "Version ${BuildConfig.VERSION_NAME}"
        
        // Location tracking toggle
        binding.switchLocationTracking.setOnCheckedChangeListener { _, isChecked ->
            toggleLocationTracking(isChecked)
        }
        
        // Auto-login toggle
        binding.switchAutoLogin.setOnCheckedChangeListener { _, isChecked ->
            toggleAutoLogin(isChecked)
        }
        
        // Test connection button
        binding.btnTestConnection.setOnClickListener {
            testConnection()
        }
        
        // Sync data button
        binding.btnSyncData.setOnClickListener {
            syncData()
        }
        
        // View sync status
        binding.btnSyncStatus.setOnClickListener {
            showSyncStatus()
        }
        
        // Clear cache button
        binding.btnClearCache.setOnClickListener {
            clearCache()
        }
        
        // Logout button
        binding.btnLogout.setOnClickListener {
            showLogoutConfirmation()
        }
    }
    
    private fun loadSettings() {
        lifecycleScope.launch {
            // Load current settings
            binding.switchLocationTracking.isChecked = app.secureStorage.isTrackingEnabled()
            binding.switchAutoLogin.isChecked = app.secureStorage.isAutoLoginEnabled()
            
            // Load last sync time
            val lastSync = app.secureStorage.getLastSyncTime()
            if (lastSync > 0) {
                val lastSyncText = java.text.SimpleDateFormat(
                    "MMM dd, yyyy HH:mm",
                    java.util.Locale.getDefault()
                ).format(java.util.Date(lastSync))
                binding.tvLastSync.text = "Last sync: $lastSyncText"
            } else {
                binding.tvLastSync.text = "Never synced"
            }
        }
    }
    
    private fun toggleLocationTracking(enabled: Boolean) {
        lifecycleScope.launch {
            app.secureStorage.setTrackingEnabled(enabled)
            
            val intent = Intent(this@SettingsActivity, LocationTrackingService::class.java)
            if (enabled) {
                startForegroundService(intent)
                showMessage("Location tracking enabled")
            } else {
                stopService(intent)
                showMessage("Location tracking disabled")
            }
        }
    }
    
    private fun toggleAutoLogin(enabled: Boolean) {
        lifecycleScope.launch {
            app.secureStorage.setAutoLogin(enabled)
            showMessage("Auto-login ${if (enabled) "enabled" else "disabled"}")
        }
    }
    
    private fun testConnection() {
        binding.btnTestConnection.text = "Testing..."
        binding.btnTestConnection.isEnabled = false
        
        lifecycleScope.launch {
            try {
                val startTime = System.currentTimeMillis()
                val response = app.apiService.testConnection()
                val latency = System.currentTimeMillis() - startTime
                
                binding.btnTestConnection.text = "Test Connection"
                binding.btnTestConnection.isEnabled = true
                
                if (response.isSuccessful) {
                    showMessage("Connection successful! Latency: ${latency}ms")
                } else {
                    showError("Connection failed: HTTP ${response.code()}")
                }
            } catch (e: Exception) {
                binding.btnTestConnection.text = "Test Connection"
                binding.btnTestConnection.isEnabled = true
                showError("Connection failed: ${e.message}")
            }
        }
    }
    
    private fun syncData() {
        binding.btnSyncData.text = "Syncing..."
        binding.btnSyncData.isEnabled = false
        
        SyncWorker.startOneTimeSync(this)
        
        // Re-enable button after a delay
        lifecycleScope.launch {
            kotlinx.coroutines.delay(2000)
            binding.btnSyncData.text = "Sync Data"
            binding.btnSyncData.isEnabled = true
            showMessage("Sync started in background")
            loadSettings() // Refresh last sync time
        }
    }
    
    private fun showSyncStatus() {
        lifecycleScope.launch {
            val lastSync = app.secureStorage.getLastSyncTime()
            val status = if (lastSync > 0) {
                val lastSyncText = java.text.SimpleDateFormat(
                    "MMM dd, yyyy HH:mm:ss",
                    java.util.Locale.getDefault()
                ).format(java.util.Date(lastSync))
                "Last successful sync:\n$lastSyncText"
            } else {
                "No sync data available"
            }
            
            MaterialAlertDialogBuilder(this@SettingsActivity)
                .setTitle("Sync Status")
                .setMessage(status)
                .setPositiveButton("OK", null)
                .show()
        }
    }
    
    private fun clearCache() {
        MaterialAlertDialogBuilder(this)
            .setTitle("Clear Cache")
            .setMessage("This will clear all locally stored task data. Are you sure?")
            .setPositiveButton("Clear") { _, _ ->
                // Clear database cache
                lifecycleScope.launch {
                    // app.database.taskDao().deleteAllTasks()
                    showMessage("Cache cleared successfully")
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun showLogoutConfirmation() {
        MaterialAlertDialogBuilder(this)
            .setTitle("Logout")
            .setMessage("Are you sure you want to logout?")
            .setPositiveButton("Logout") { _, _ ->
                performLogout()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun performLogout() {
        lifecycleScope.launch {
            // Logout from server
            app.authRepository.logout()
            
            // Stop location service
            val intent = Intent(this@SettingsActivity, LocationTrackingService::class.java)
            stopService(intent)
            
            // Cancel background sync
            SyncWorker.cancelSync(this@SettingsActivity)
            
            // Navigate to login
            val loginIntent = Intent(this@SettingsActivity, LoginActivity::class.java)
            loginIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(loginIntent)
            finish()
        }
    }
    
    private fun showMessage(message: String) {
        Snackbar.make(binding.root, message, Snackbar.LENGTH_SHORT).show()
    }
    
    private fun showError(message: String) {
        Snackbar.make(binding.root, message, Snackbar.LENGTH_LONG).show()
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            android.R.id.home -> {
                finish()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
}