package com.wizoneit.fieldapp.ui.camera

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import com.wizoneit.fieldapp.databinding.ActivityCameraBinding
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class CameraActivity : AppCompatActivity() {
    
    companion object {
        const val EXTRA_IMAGE_PATH = "image_path"
        private const val TAG = "CameraActivity"
    }
    
    private lateinit var binding: ActivityCameraBinding
    
    private var imageCapture: ImageCapture? = null
    private lateinit var cameraExecutor: ExecutorService
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCameraBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupUI()
        startCamera()
        
        cameraExecutor = Executors.newSingleThreadExecutor()
    }
    
    private fun setupUI() {
        binding.btnCapture.setOnClickListener {
            takePhoto()
        }
        
        binding.btnClose.setOnClickListener {
            finish()
        }
        
        // Optional: Add flash toggle
        binding.btnFlash.setOnClickListener {
            toggleFlash()
        }
    }
    
    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()
            
            // Preview use case
            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(binding.previewView.surfaceProvider)
            }
            
            // Image capture use case
            imageCapture = ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                .build()
            
            // Image analysis use case (optional)
            val imageAnalyzer = ImageAnalysis.Builder().build().also {
                it.setAnalyzer(cameraExecutor, LuminosityAnalyzer { luma ->
                    // Optional: Use luminosity for UI feedback
                })
            }
            
            // Select back camera as default
            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
            
            try {
                // Unbind use cases before rebinding
                cameraProvider.unbindAll()
                
                // Bind use cases to camera
                val camera = cameraProvider.bindToLifecycle(
                    this,
                    cameraSelector,
                    preview,
                    imageCapture,
                    imageAnalyzer
                )
                
                // Optional: Set up camera controls
                setupCameraControls(camera)
                
            } catch (exc: Exception) {
                Log.e(TAG, "Use case binding failed", exc)
                Toast.makeText(this, "Camera initialization failed", Toast.LENGTH_SHORT).show()
                finish()
            }
            
        }, ContextCompat.getMainExecutor(this))
    }
    
    private fun setupCameraControls(camera: Camera) {
        val cameraControl = camera.cameraControl
        val cameraInfo = camera.cameraInfo
        
        // Set up tap to focus
        binding.previewView.setOnTouchListener { _, event ->
            val meteringPointFactory = binding.previewView.meteringPointFactory
            val meteringPoint = meteringPointFactory.createPoint(event.x, event.y)
            val action = FocusMeteringAction.Builder(meteringPoint).build()
            cameraControl.startFocusAndMetering(action)
            true
        }
    }
    
    private fun takePhoto() {
        val imageCapture = imageCapture ?: return
        
        // Create output file
        val photoFile = File(
            getExternalFilesDir("Pictures"),
            SimpleDateFormat("yyyy-MM-dd-HH-mm-ss-SSS", Locale.getDefault()).format(Date()) + ".jpg"
        )
        
        val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()
        
        // Show capture progress
        binding.progressBar.visibility = View.VISIBLE
        binding.btnCapture.isEnabled = false
        
        imageCapture.takePicture(
            outputOptions,
            ContextCompat.getMainExecutor(this),
            object : ImageCapture.OnImageSavedCallback {
                override fun onError(exception: ImageCaptureException) {
                    binding.progressBar.visibility = View.GONE
                    binding.btnCapture.isEnabled = true
                    
                    Log.e(TAG, "Photo capture failed: ${exception.message}", exception)
                    Toast.makeText(
                        this@CameraActivity,
                        "Photo capture failed: ${exception.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
                
                override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                    binding.progressBar.visibility = View.GONE
                    binding.btnCapture.isEnabled = true
                    
                    // Return the file path to the calling activity
                    val resultIntent = Intent().apply {
                        putExtra(EXTRA_IMAGE_PATH, photoFile.absolutePath)
                    }
                    setResult(RESULT_OK, resultIntent)
                    finish()
                }
            }
        )
    }
    
    private fun toggleFlash() {
        val imageCapture = imageCapture ?: return
        
        when (imageCapture.flashMode) {
            ImageCapture.FLASH_MODE_OFF -> {
                imageCapture.flashMode = ImageCapture.FLASH_MODE_ON
                binding.btnFlash.text = "Flash: ON"
            }
            ImageCapture.FLASH_MODE_ON -> {
                imageCapture.flashMode = ImageCapture.FLASH_MODE_AUTO
                binding.btnFlash.text = "Flash: AUTO"
            }
            else -> {
                imageCapture.flashMode = ImageCapture.FLASH_MODE_OFF
                binding.btnFlash.text = "Flash: OFF"
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }
}

// Simple luminosity analyzer for camera feedback
private class LuminosityAnalyzer(private val listener: (Double) -> Unit) : ImageAnalysis.Analyzer {
    
    private fun ByteArray.toHexString() = joinToString("") { "%02x".format(it) }
    
    override fun analyze(image: ImageProxy) {
        val buffer = image.planes[0].buffer
        val data = buffer.toByteArray()
        val pixels = data.map { it.toInt() and 0xFF }
        val luma = pixels.average()
        
        listener(luma)
        
        image.close()
    }
}