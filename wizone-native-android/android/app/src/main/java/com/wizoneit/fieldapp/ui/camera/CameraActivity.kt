package com.wizoneit.fieldapp.ui.camera

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import com.wizoneit.fieldapp.databinding.ActivityCameraBinding
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.*

class CameraActivity : AppCompatActivity() {
    
    companion object {
        const val EXTRA_IMAGE_PATH = "image_path"
        private const val TAG = "CameraActivity"
        private const val CAMERA_REQUEST_CODE = 1001
    }
    
    private lateinit var binding: ActivityCameraBinding
    private var currentPhotoPath: String? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCameraBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupUI()
        // Start camera intent immediately
        openCamera()
    }
    
    private fun setupUI() {
        binding.btnCapture.setOnClickListener {
            openCamera()
        }
        
        binding.btnClose.setOnClickListener {
            finish()
        }
        
        // Hide camera preview view since we're using Intent
        binding.previewView.visibility = android.view.View.GONE
    }
    
    private fun openCamera() {
        try {
            val cameraIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
            startActivityForResult(cameraIntent, CAMERA_REQUEST_CODE)
        } catch (e: Exception) {
            Log.e(TAG, "Error opening camera", e)
            Toast.makeText(this, "Error opening camera: ${e.message}", Toast.LENGTH_SHORT).show()
            finish()
        }
    }
    
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        if (requestCode == CAMERA_REQUEST_CODE) {
            if (resultCode == Activity.RESULT_OK && data != null) {
                val imageBitmap = data.extras?.get("data") as? Bitmap
                if (imageBitmap != null) {
                    saveImageAndReturn(imageBitmap)
                } else {
                    Toast.makeText(this, "Failed to capture image", Toast.LENGTH_SHORT).show()
                    finish()
                }
            } else {
                // User cancelled or error occurred
                finish()
            }
        }
    }
    
    private fun saveImageAndReturn(bitmap: Bitmap) {
        try {
            // Create file in app's private directory
            val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
            val imageFile = File(filesDir, "JPEG_${timeStamp}.jpg")
            
            // Save bitmap to file
            FileOutputStream(imageFile).use { out ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
            }
            
            currentPhotoPath = imageFile.absolutePath
            
            // Return result
            val resultIntent = Intent().apply {
                putExtra(EXTRA_IMAGE_PATH, currentPhotoPath)
            }
            setResult(Activity.RESULT_OK, resultIntent)
            finish()
            
        } catch (e: Exception) {
            Log.e(TAG, "Error saving image", e)
            Toast.makeText(this, "Error saving image: ${e.message}", Toast.LENGTH_SHORT).show()
            finish()
        }
    }
}