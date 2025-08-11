package com.wizoneit.fieldapp.data.model

data class ActivityRequest(
    val type: String,
    val data: Map<String, Any>,
    val timestamp: Long
)