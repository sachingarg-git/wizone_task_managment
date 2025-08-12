package com.wizoneit.fieldapp.ui.camera

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.github.dhaval2404.imagepicker.ImagePicker
import com.wizoneit.fieldapp.databinding.ActivityCameraBinding
import java.io.File

class CameraActivity : AppCompatActivity() {
    
    companion object {
        const val EXTRA_IMAGE_PATH = "image_path"
        private const val TAG = "CameraActivity"
    }
    
    private lateinit var binding: ActivityCameraBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCameraBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupUI()
        // Start file picker immediately
        openFilePicker()
    }
    
    private fun setupUI() {
        binding.btnCapture.setOnClickListener {
            openFilePicker()
        }
        
        binding.btnClose.setOnClickListener {
            finish()
        }
        
        // Hide camera preview view since we're using file picker
        binding.previewView.visibility = android.view.View.GONE
    }
    
    private fun openFilePicker() {
        ImagePicker.with(this)
            .galleryOnly() // Only gallery, no camera to avoid 16KB alignment issues
            .crop() // Optional: allow cropping
            .compress(1024) // Compress to max 1MB
            .maxResultSize(1080, 1080) // Max resolution
            .start()
    }
    
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        if (resultCode == Activity.RESULT_OK && data != null) {
            val fileUri = data.data
            if (fileUri != null) {
                try {
                    val filePath = getRealPathFromURI(fileUri)
                    if (filePath != null) {
                        // Return result
                        val resultIntent = Intent().apply {
                            putExtra(EXTRA_IMAGE_PATH, filePath)
                        }
                        setResult(Activity.RESULT_OK, resultIntent)
                        finish()
                    } else {
                        Toast.makeText(this, "Failed to get file path", Toast.LENGTH_SHORT).show()
                        finish()
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error processing selected file", e)
                    Toast.makeText(this, "Error processing file: ${e.message}", Toast.LENGTH_SHORT).show()
                    finish()
                }
            } else {
                Toast.makeText(this, "No file selected", Toast.LENGTH_SHORT).show()
                finish()
            }
        } else {
            // User cancelled or error occurred
            finish()
        }
    }
    
    private fun getRealPathFromURI(uri: Uri): String? {
        return try {
            val inputStream = contentResolver.openInputStream(uri)
            val timeStamp = System.currentTimeMillis()
            val fileName = "IMG_$timeStamp.jpg"
            val file = File(filesDir, fileName)
            
            inputStream?.use { input ->
                file.outputStream().use { output ->
                    input.copyTo(output)
                }
            }
            
            file.absolutePath
        } catch (e: Exception) {
            Log.e(TAG, "Error copying file", e)
            null
        }
    }
}