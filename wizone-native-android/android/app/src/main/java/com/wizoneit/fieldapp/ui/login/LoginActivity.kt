package com.wizoneit.fieldapp.ui.login

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.snackbar.Snackbar
import com.wizoneit.fieldapp.WizoneApplication
import com.wizoneit.fieldapp.databinding.ActivityLoginBinding
import com.wizoneit.fieldapp.ui.main.MainDashboardActivity
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityLoginBinding
    private lateinit var viewModel: LoginViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        val app = application as WizoneApplication
        viewModel = LoginViewModel(app.authRepository)
        
        setupUI()
        observeViewModel()
        
        // Check for auto-login
        lifecycleScope.launch {
            if (app.secureStorage.isAutoLoginEnabled()) {
                val username = app.secureStorage.getUsername()
                if (!username.isNullOrEmpty()) {
                    binding.etUsername.setText(username)
                    binding.cbRememberMe.isChecked = true
                }
            }
        }
    }
    
    private fun setupUI() {
        binding.btnLogin.setOnClickListener {
            val username = binding.etUsername.text.toString().trim()
            val password = binding.etPassword.text.toString()
            
            if (validateInput(username, password)) {
                performLogin(username, password)
            }
        }
        
        binding.btnTestConnection.setOnClickListener {
            testServerConnection()
        }
    }
    
    private fun observeViewModel() {
        lifecycleScope.launch {
            viewModel.loginState.collect { state ->
                when (state) {
                    is LoginState.Loading -> {
                        binding.progressBar.visibility = View.VISIBLE
                        binding.btnLogin.isEnabled = false
                    }
                    is LoginState.Success -> {
                        binding.progressBar.visibility = View.GONE
                        
                        // Save auto-login preference
                        if (binding.cbRememberMe.isChecked) {
                            val app = application as WizoneApplication
                            lifecycleScope.launch {
                                app.secureStorage.setAutoLogin(true)
                            }
                        }
                        
                        // Navigate to main dashboard
                        startActivity(Intent(this@LoginActivity, MainDashboardActivity::class.java))
                        finish()
                    }
                    is LoginState.Error -> {
                        binding.progressBar.visibility = View.GONE
                        binding.btnLogin.isEnabled = true
                        showError(state.message)
                    }
                    is LoginState.Idle -> {
                        binding.progressBar.visibility = View.GONE
                        binding.btnLogin.isEnabled = true
                    }
                }
            }
        }
        
        lifecycleScope.launch {
            viewModel.connectionState.collect { state ->
                when (state) {
                    is ConnectionState.Testing -> {
                        binding.btnTestConnection.text = "Testing..."
                        binding.btnTestConnection.isEnabled = false
                    }
                    is ConnectionState.Success -> {
                        binding.btnTestConnection.text = "Test Connection"
                        binding.btnTestConnection.isEnabled = true
                        showMessage("Connection successful! Latency: ${state.latency}ms")
                    }
                    is ConnectionState.Error -> {
                        binding.btnTestConnection.text = "Test Connection"
                        binding.btnTestConnection.isEnabled = true
                        showError("Connection failed: ${state.message}")
                    }
                    is ConnectionState.Idle -> {
                        binding.btnTestConnection.text = "Test Connection"
                        binding.btnTestConnection.isEnabled = true
                    }
                }
            }
        }
    }
    
    private fun validateInput(username: String, password: String): Boolean {
        if (username.isEmpty()) {
            binding.etUsername.error = "Username is required"
            return false
        }
        
        if (password.isEmpty()) {
            binding.etPassword.error = "Password is required"
            return false
        }
        
        return true
    }
    
    private fun performLogin(username: String, password: String) {
        lifecycleScope.launch {
            viewModel.login(username, password)
        }
    }
    
    private fun testServerConnection() {
        lifecycleScope.launch {
            viewModel.testConnection()
        }
    }
    
    private fun showError(message: String) {
        Snackbar.make(binding.root, message, Snackbar.LENGTH_LONG).show()
    }
    
    private fun showMessage(message: String) {
        Snackbar.make(binding.root, message, Snackbar.LENGTH_SHORT).show()
    }
}