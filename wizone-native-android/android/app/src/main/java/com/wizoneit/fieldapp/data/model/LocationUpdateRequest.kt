package com.wizoneit.fieldapp.data.model

data class LocationUpdateRequest(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val timestamp: Long
)