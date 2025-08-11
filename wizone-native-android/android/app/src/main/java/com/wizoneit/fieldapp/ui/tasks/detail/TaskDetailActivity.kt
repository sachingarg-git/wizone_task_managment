package com.wizoneit.fieldapp.ui.tasks.detail

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.widget.ArrayAdapter
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.lifecycle.lifecycleScope
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import com.wizoneit.fieldapp.R
import com.wizoneit.fieldapp.WizoneApplication
import com.wizoneit.fieldapp.databinding.ActivityTaskDetailBinding
import com.wizoneit.fieldapp.ui.camera.CameraActivity
import kotlinx.coroutines.launch
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

class TaskDetailActivity : AppCompatActivity() {
    
    companion object {
        const val EXTRA_TASK_ID = "task_id"
    }
    
    private lateinit var binding: ActivityTaskDetailBinding
    private lateinit var viewModel: TaskDetailViewModel
    private lateinit var attachmentAdapter: AttachmentAdapter
    
    private var currentPhotoFile: File? = null
    
    private val takePictureLauncher = registerForActivityResult(
        ActivityResultContracts.TakePicture()
    ) { success ->
        if (success) {
            currentPhotoFile?.let { file ->
                uploadAttachment(file)
            }
        }
    }
    
    private val pickImageLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let { 
            // Copy file to app directory and upload
            copyAndUploadFile(it)
        }
    }
    
    private val cameraActivityLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            val filePath = result.data?.getStringExtra(CameraActivity.EXTRA_IMAGE_PATH)
            filePath?.let { path ->
                uploadAttachment(File(path))
            }
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityTaskDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        val taskId = intent.getIntExtra(EXTRA_TASK_ID, -1)
        if (taskId == -1) {
            finish()
            return
        }
        
        val app = application as WizoneApplication
        viewModel = TaskDetailViewModel(app.taskRepository, taskId)
        
        setupToolbar()
        setupUI()
        setupAttachments()
        observeViewModel()
        
        viewModel.loadTaskDetail()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Task Detail"
    }
    
    private fun setupUI() {
        // Status spinner setup
        val statusOptions = listOf("pending", "in_progress", "completed", "resolved")
        val statusAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, statusOptions)
        statusAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerStatus.adapter = statusAdapter
        
        // Save button click
        binding.btnSaveUpdate.setOnClickListener {
            saveTaskUpdate()
        }
        
        // Add attachment button
        binding.btnAddAttachment.setOnClickListener {
            showAttachmentOptions()
        }
        
        // Capture photo button
        binding.btnCapturePhoto.setOnClickListener {
            launchCamera()
        }
    }
    
    private fun setupAttachments() {
        attachmentAdapter = AttachmentAdapter { attachment ->
            // Handle attachment click - could open file viewer
        }
        binding.recyclerViewAttachments.adapter = attachmentAdapter
    }
    
    private fun observeViewModel() {
        lifecycleScope.launch {
            viewModel.task.collect { task ->
                task?.let { 
                    populateTaskData(it)
                }
            }
        }
        
        lifecycleScope.launch {
            viewModel.isLoading.collect { isLoading ->
                binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
            }
        }
        
        lifecycleScope.launch {
            viewModel.error.collect { error ->
                error?.let {
                    Snackbar.make(binding.root, it, Snackbar.LENGTH_LONG).show()
                }
            }
        }
        
        lifecycleScope.launch {
            viewModel.updateSuccess.collect { success ->
                if (success) {
                    Snackbar.make(binding.root, "Task updated successfully", Snackbar.LENGTH_SHORT).show()
                    // Clear the notes field
                    binding.etNotes.setText("")
                }
            }
        }
    }
    
    private fun populateTaskData(task: com.wizoneit.fieldapp.data.model.TaskDetail) {
        val dateFormat = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
        
        binding.apply {
            // Basic info
            tvTaskId.text = task.ticketNumber
            tvTaskTitle.text = task.title
            tvCustomerName.text = task.customerName ?: "No Customer"
            tvDescription.text = task.description ?: ""
            tvIssueType.text = task.issueType ?: "General"
            tvPriority.text = task.priority.uppercase()
            
            // Assigned engineer
            val assignedName = if (task.assignedUser != null) {
                "${task.assignedUser.firstName ?: ""} ${task.assignedUser.lastName ?: ""}".trim()
            } else {
                "Unassigned"
            }
            tvAssignedTo.text = assignedName
            
            // Dates
            tvCreatedAt.text = "Created: ${dateFormat.format(task.createdAt)}"
            tvUpdatedAt.text = "Updated: ${dateFormat.format(task.updatedAt)}"
            
            // Set current status in spinner
            val statusPosition = (spinnerStatus.adapter as ArrayAdapter<String>).getPosition(task.status)
            spinnerStatus.setSelection(statusPosition)
            
            // Check if task is locked (completed or resolved)
            val isLocked = task.status in listOf("completed", "resolved")
            spinnerStatus.isEnabled = !isLocked
            etNotes.isEnabled = !isLocked
            btnSaveUpdate.isEnabled = !isLocked
            btnAddAttachment.isEnabled = !isLocked
            btnCapturePhoto.isEnabled = !isLocked
            
            if (isLocked) {
                tvStatusLocked.visibility = View.VISIBLE
                tvStatusLocked.text = "Task is ${task.status} - updates are locked"
            } else {
                tvStatusLocked.visibility = View.GONE
            }
            
            // Show attachments if any
            task.attachments?.let { attachments ->
                if (attachments.isNotEmpty()) {
                    attachmentAdapter.submitList(attachments)
                    binding.recyclerViewAttachments.visibility = View.VISIBLE
                    binding.tvNoAttachments.visibility = View.GONE
                } else {
                    binding.recyclerViewAttachments.visibility = View.GONE
                    binding.tvNoAttachments.visibility = View.VISIBLE
                }
            }
        }
    }
    
    private fun saveTaskUpdate() {
        val selectedStatus = binding.spinnerStatus.selectedItem.toString()
        val notes = binding.etNotes.text.toString().trim()
        
        if (notes.isEmpty()) {
            binding.etNotes.error = "Please add update notes"
            return
        }
        
        viewModel.updateTask(selectedStatus, notes)
    }
    
    private fun showAttachmentOptions() {
        MaterialAlertDialogBuilder(this)
            .setTitle("Add Attachment")
            .setItems(arrayOf("Take Photo", "Choose from Gallery", "Camera Activity")) { _, which ->
                when (which) {
                    0 -> takePicture()
                    1 -> pickImageLauncher.launch("image/*")
                    2 -> openCameraActivity()
                }
            }
            .show()
    }
    
    private fun takePicture() {
        currentPhotoFile = createImageFile()
        currentPhotoFile?.let { file ->
            val photoUri = FileProvider.getUriForFile(
                this,
                "${packageName}.fileprovider",
                file
            )
            takePictureLauncher.launch(photoUri)
        }
    }
    
    private fun launchCamera() {
        currentPhotoFile = createImageFile()
        currentPhotoFile?.let { file ->
            val photoUri = FileProvider.getUriForFile(
                this,
                "${packageName}.fileprovider",
                file
            )
            takePictureLauncher.launch(photoUri)
        }
    }
    
    private fun openCameraActivity() {
        val intent = Intent(this, CameraActivity::class.java)
        cameraActivityLauncher.launch(intent)
    }
    
    private fun createImageFile(): File {
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val imageFileName = "JPEG_${timeStamp}_"
        val storageDir = getExternalFilesDir("Pictures")
        return File.createTempFile(imageFileName, ".jpg", storageDir)
    }
    
    private fun copyAndUploadFile(uri: Uri) {
        // In a real implementation, you'd copy the file to app directory
        // and then upload it. For now, this is simplified.
        
        try {
            val inputStream = contentResolver.openInputStream(uri)
            val file = createImageFile()
            
            inputStream?.use { input ->
                file.outputStream().use { output ->
                    input.copyTo(output)
                }
            }
            
            uploadAttachment(file)
        } catch (e: Exception) {
            Snackbar.make(binding.root, "Failed to process file: ${e.message}", Snackbar.LENGTH_LONG).show()
        }
    }
    
    private fun uploadAttachment(file: File) {
        val notes = binding.etNotes.text.toString().ifEmpty { "Photo attachment" }
        viewModel.uploadAttachment(file, notes)
    }
    
    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.task_detail_menu, menu)
        return true
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            android.R.id.home -> {
                finish()
                true
            }
            R.id.action_refresh -> {
                viewModel.loadTaskDetail()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
}