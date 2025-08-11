package com.wizoneit.fieldapp.ui.main

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.wizoneit.fieldapp.WizoneApplication
import com.wizoneit.fieldapp.databinding.FragmentUploadStatusBinding
import kotlinx.coroutines.launch

class UploadStatusFragment : Fragment() {
    
    private var _binding: FragmentUploadStatusBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var app: WizoneApplication
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentUploadStatusBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        app = requireActivity().application as WizoneApplication
        
        setupUI()
        loadUploadStatus()
    }
    
    private fun setupUI() {
        binding.recyclerViewUploads.layoutManager = LinearLayoutManager(requireContext())
        
        binding.btnRetryAll.setOnClickListener {
            retryFailedUploads()
        }
        
        binding.btnClearCompleted.setOnClickListener {
            clearCompletedUploads()
        }
        
        binding.swipeRefreshLayout.setOnRefreshListener {
            loadUploadStatus()
        }
    }
    
    private fun loadUploadStatus() {
        binding.swipeRefreshLayout.isRefreshing = true
        
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                // Get pending uploads count
                val pendingCount = app.database.pendingUploadDao().getPendingUploadCount()
                
                // Get last sync time
                val lastSync = app.secureStorage.getLastSyncTime()
                
                // Update UI
                binding.tvPendingCount.text = "Pending uploads: $pendingCount"
                
                if (lastSync > 0) {
                    val lastSyncText = java.text.SimpleDateFormat(
                        "MMM dd, yyyy HH:mm",
                        java.util.Locale.getDefault()
                    ).format(java.util.Date(lastSync))
                    binding.tvLastSync.text = "Last sync: $lastSyncText"
                } else {
                    binding.tvLastSync.text = "Never synced"
                }
                
                // Show/hide retry button based on pending uploads
                binding.btnRetryAll.visibility = if (pendingCount > 0) View.VISIBLE else View.GONE
                
                // Load upload list (if you implement a detailed list)
                // loadUploadList()
                
            } catch (e: Exception) {
                // Handle error
                binding.tvPendingCount.text = "Error loading upload status"
            } finally {
                binding.swipeRefreshLayout.isRefreshing = false
            }
        }
    }
    
    private fun retryFailedUploads() {
        viewLifecycleOwner.lifecycleScope.launch {
            // Trigger sync worker to retry pending uploads
            com.wizoneit.fieldapp.worker.SyncWorker.startOneTimeSync(requireContext())
            
            com.google.android.material.snackbar.Snackbar.make(
                binding.root,
                "Retrying failed uploads...",
                com.google.android.material.snackbar.Snackbar.LENGTH_SHORT
            ).show()
            
            // Refresh status after a delay
            kotlinx.coroutines.delay(2000)
            loadUploadStatus()
        }
    }
    
    private fun clearCompletedUploads() {
        viewLifecycleOwner.lifecycleScope.launch {
            // Clear completed uploads from database
            // This would require a method in your DAO to delete successful uploads
            
            com.google.android.material.snackbar.Snackbar.make(
                binding.root,
                "Completed uploads cleared",
                com.google.android.material.snackbar.Snackbar.LENGTH_SHORT
            ).show()
            
            loadUploadStatus()
        }
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}