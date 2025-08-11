package com.wizoneit.fieldapp.ui.main

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.google.android.material.snackbar.Snackbar
import com.wizoneit.fieldapp.R
import com.wizoneit.fieldapp.WizoneApplication
import com.wizoneit.fieldapp.databinding.ActivityMainDashboardBinding
import com.wizoneit.fieldapp.service.LocationTrackingService
import com.wizoneit.fieldapp.ui.login.LoginActivity
import com.wizoneit.fieldapp.ui.settings.SettingsActivity
import com.wizoneit.fieldapp.ui.tasks.TaskListFragment
import com.wizoneit.fieldapp.worker.SyncWorker
import kotlinx.coroutines.launch

class MainDashboardActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainDashboardBinding
    private lateinit var app: WizoneApplication
    
    private val locationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true) {
            startLocationTracking()
        } else {
            showPermissionRationale()
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        app = application as WizoneApplication
        
        setupToolbar()
        setupBottomNavigation()
        requestLocationPermissions()
        
        // Start with task list fragment
        if (savedInstanceState == null) {
            replaceFragment(TaskListFragment())
        }
        
        // Start background sync
        SyncWorker.startPeriodicSync(this)
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Field Engineer"
        
        lifecycleScope.launch {
            val userName = app.secureStorage.getUserName()
            supportActionBar?.subtitle = "Welcome, ${userName ?: "Engineer"}"
        }
    }
    
    private fun setupBottomNavigation() {
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_tasks -> {
                    replaceFragment(TaskListFragment())
                    true
                }
                R.id.nav_upload_status -> {
                    replaceFragment(UploadStatusFragment())
                    true
                }
                R.id.nav_activity -> {
                    replaceFragment(ActivityFragment())
                    true
                }
                else -> false
            }
        }
    }
    
    private fun replaceFragment(fragment: Fragment) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragmentContainer, fragment)
            .commit()
    }
    
    private fun requestLocationPermissions() {
        val permissions = mutableListOf<String>()
        
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) 
            != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.ACCESS_FINE_LOCATION)
        }
        
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) 
            != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.ACCESS_COARSE_LOCATION)
        }
        
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_BACKGROUND_LOCATION) 
                != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
            }
        }
        
        if (permissions.isNotEmpty()) {
            locationPermissionLauncher.launch(permissions.toTypedArray())
        } else {
            startLocationTracking()
        }
    }
    
    private fun startLocationTracking() {
        lifecycleScope.launch {
            if (app.secureStorage.isTrackingEnabled()) {
                val intent = Intent(this@MainDashboardActivity, LocationTrackingService::class.java)
                startForegroundService(intent)
            }
        }
    }
    
    private fun showPermissionRationale() {
        Snackbar.make(
            binding.root,
            "Location permission is required for field tracking",
            Snackbar.LENGTH_LONG
        ).setAction("Grant") {
            requestLocationPermissions()
        }.show()
    }
    
    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        return true
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_settings -> {
                startActivity(Intent(this, SettingsActivity::class.java))
                true
            }
            R.id.action_sync -> {
                SyncWorker.startOneTimeSync(this)
                Snackbar.make(binding.root, "Syncing data...", Snackbar.LENGTH_SHORT).show()
                true
            }
            R.id.action_logout -> {
                performLogout()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
    
    private fun performLogout() {
        lifecycleScope.launch {
            app.authRepository.logout()
            
            // Stop location service
            val intent = Intent(this@MainDashboardActivity, LocationTrackingService::class.java)
            stopService(intent)
            
            // Navigate to login
            startActivity(Intent(this@MainDashboardActivity, LoginActivity::class.java))
            finish()
        }
    }
}