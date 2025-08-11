package com.wizoneit.fieldapp.ui.main

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.wizoneit.fieldapp.WizoneApplication
import com.wizoneit.fieldapp.databinding.FragmentActivityBinding
import kotlinx.coroutines.launch

class ActivityFragment : Fragment() {
    
    private var _binding: FragmentActivityBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var app: WizoneApplication
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentActivityBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        app = requireActivity().application as WizoneApplication
        
        setupUI()
        loadActivityData()
    }
    
    private fun setupUI() {
        binding.swipeRefreshLayout.setOnRefreshListener {
            loadActivityData()
        }
        
        binding.btnPublishLocation.setOnClickListener {
            publishCurrentLocation()
        }
    }
    
    private fun loadActivityData() {
        binding.swipeRefreshLayout.isRefreshing = true
        
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                // Load user info
                val userName = app.secureStorage.getUserName()
                val userId = app.secureStorage.getUserId()
                val role = app.secureStorage.getUserRole()
                
                binding.tvUserInfo.text = """
                    Name: $userName
                    ID: $userId
                    Role: $role
                """.trimIndent()
                
                // Load last sync time
                val lastSync = app.secureStorage.getLastSyncTime()
                if (lastSync > 0) {
                    val lastSyncText = java.text.SimpleDateFormat(
                        "MMM dd, yyyy HH:mm:ss",
                        java.util.Locale.getDefault()
                    ).format(java.util.Date(lastSync))
                    binding.tvLastActivity.text = "Last sync: $lastSyncText"
                } else {
                    binding.tvLastActivity.text = "No recent activity"
                }
                
                // Check tracking status
                val trackingEnabled = app.secureStorage.isTrackingEnabled()
                binding.tvTrackingStatus.text = "Location tracking: ${if (trackingEnabled) "ON" else "OFF"}"
                
                // Show connection status
                updateConnectionStatus()
                
            } catch (e: Exception) {
                binding.tvUserInfo.text = "Error loading activity data"
            } finally {
                binding.swipeRefreshLayout.isRefreshing = false
            }
        }
    }
    
    private fun updateConnectionStatus() {
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = app.apiService.testConnection()
                if (response.isSuccessful) {
                    binding.tvConnectionStatus.text = "Server connection: CONNECTED"
                    binding.tvConnectionStatus.setTextColor(
                        androidx.core.content.ContextCompat.getColor(requireContext(), android.R.color.holo_green_dark)
                    )
                } else {
                    binding.tvConnectionStatus.text = "Server connection: ERROR (${response.code()})"
                    binding.tvConnectionStatus.setTextColor(
                        androidx.core.content.ContextCompat.getColor(requireContext(), android.R.color.holo_red_dark)
                    )
                }
            } catch (e: Exception) {
                binding.tvConnectionStatus.text = "Server connection: OFFLINE"
                binding.tvConnectionStatus.setTextColor(
                    androidx.core.content.ContextCompat.getColor(requireContext(), android.R.color.holo_red_dark)
                )
            }
        }
    }
    
    private fun publishCurrentLocation() {
        binding.btnPublishLocation.text = "Publishing..."
        binding.btnPublishLocation.isEnabled = false
        
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                // Get current location (simplified - in real app you'd use FusedLocationProvider)
                val mockLocation = com.wizoneit.fieldapp.data.model.LocationUpdateRequest(
                    latitude = 0.0,
                    longitude = 0.0,
                    accuracy = 0f,
                    timestamp = System.currentTimeMillis()
                )
                
                val userId = app.secureStorage.getUserId()
                if (userId != null) {
                    app.apiService.updateLocation(userId, mockLocation)
                    
                    com.google.android.material.snackbar.Snackbar.make(
                        binding.root,
                        "Location published successfully",
                        com.google.android.material.snackbar.Snackbar.LENGTH_SHORT
                    ).show()
                    
                    // Update last sync time
                    app.secureStorage.saveLastSyncTime(System.currentTimeMillis())
                    loadActivityData()
                }
            } catch (e: Exception) {
                com.google.android.material.snackbar.Snackbar.make(
                    binding.root,
                    "Failed to publish location: ${e.message}",
                    com.google.android.material.snackbar.Snackbar.LENGTH_LONG
                ).show()
            } finally {
                binding.btnPublishLocation.text = "Publish Location"
                binding.btnPublishLocation.isEnabled = true
            }
        }
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}