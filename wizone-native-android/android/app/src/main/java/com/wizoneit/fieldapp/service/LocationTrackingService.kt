package com.wizoneit.fieldapp.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.location.Location
import android.os.Build
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*
import com.wizoneit.fieldapp.R
import com.wizoneit.fieldapp.WizoneApplication
import com.wizoneit.fieldapp.data.model.ActivityRequest
import com.wizoneit.fieldapp.data.model.LocationUpdateRequest
import com.wizoneit.fieldapp.ui.main.MainDashboardActivity
import kotlinx.coroutines.*

class LocationTrackingService : Service() {
    
    companion object {
        private const val CHANNEL_ID = "location_tracking_channel"
        private const val NOTIFICATION_ID = 1001
        private const val LOCATION_UPDATE_INTERVAL = 5 * 60 * 1000L // 5 minutes
        private const val LOCATION_UPDATE_FASTEST_INTERVAL = 2 * 60 * 1000L // 2 minutes
    }
    
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationRequest: LocationRequest
    private lateinit var locationCallback: LocationCallback
    private lateinit var app: WizoneApplication
    
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    override fun onCreate() {
        super.onCreate()
        app = application as WizoneApplication
        
        createNotificationChannel()
        setupLocationTracking()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, createNotification())
        startLocationUpdates()
        return START_STICKY
    }
    
    override fun onDestroy() {
        super.onDestroy()
        stopLocationUpdates()
        serviceScope.cancel()
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    private fun setupLocationTracking() {
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        
        locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            LOCATION_UPDATE_INTERVAL
        ).apply {
            setMinUpdateIntervalMillis(LOCATION_UPDATE_FASTEST_INTERVAL)
            setMaxUpdateDelayMillis(LOCATION_UPDATE_INTERVAL * 2)
        }.build()
        
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult.lastLocation?.let { location ->
                    handleLocationUpdate(location)
                }
            }
        }
    }
    
    @Suppress("MissingPermission")
    private fun startLocationUpdates() {
        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
            )
        } catch (e: SecurityException) {
            // Handle permission error
            stopSelf()
        }
    }
    
    private fun stopLocationUpdates() {
        fusedLocationClient.removeLocationUpdates(locationCallback)
    }
    
    private fun handleLocationUpdate(location: Location) {
        serviceScope.launch {
            try {
                val userId = app.secureStorage.getUserId()
                if (userId != null) {
                    // Send location update
                    val locationUpdate = LocationUpdateRequest(
                        latitude = location.latitude,
                        longitude = location.longitude,
                        accuracy = location.accuracy,
                        timestamp = location.time
                    )
                    
                    app.apiService.updateLocation(userId, locationUpdate)
                    
                    // Publish activity
                    val activityData = mapOf<String, Any>(
                        "latitude" to location.latitude,
                        "longitude" to location.longitude,
                        "accuracy" to location.accuracy,
                        "provider" to (location.provider ?: "unknown"),
                        "altitude" to location.altitude,
                        "speed" to location.speed,
                        "bearing" to location.bearing
                    )
                    
                    val activity = ActivityRequest(
                        type = "location",
                        data = activityData,
                        timestamp = location.time
                    )
                    
                    app.apiService.publishActivity(activity)
                    
                    // Update last sync time
                    app.secureStorage.saveLastSyncTime(System.currentTimeMillis())
                }
            } catch (e: Exception) {
                // Log error but continue tracking
                // In a real app, you might want to store failed updates for retry
            }
        }
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Location Tracking",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Tracks field engineer location for task management"
                setShowBadge(false)
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(): Notification {
        val intent = Intent(this, MainDashboardActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Wizone Field Tracking")
            .setContentText("Tracking your location for field operations")
            .setSmallIcon(R.drawable.ic_location)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setSilent(true)
            .build()
    }
}