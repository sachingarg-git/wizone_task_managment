package com.wizoneit.fieldapp

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.wizoneit.fieldapp.data.storage.SecureStorage
import com.wizoneit.fieldapp.ui.login.LoginActivity
import com.wizoneit.fieldapp.ui.main.MainDashboardActivity
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    
    private lateinit var secureStorage: SecureStorage
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        secureStorage = (application as WizoneApplication).secureStorage
        
        // Check if user is already logged in
        lifecycleScope.launch {
            val token = secureStorage.getAuthToken()
            val targetActivity = if (token.isNullOrEmpty()) {
                LoginActivity::class.java
            } else {
                MainDashboardActivity::class.java
            }
            
            startActivity(Intent(this@MainActivity, targetActivity))
            finish()
        }
    }
}