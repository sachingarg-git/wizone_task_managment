package com.wizoneit.fieldapp.data.storage

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class SecureStorage(private val context: Context) {
    
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()
    
    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "wizone_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
    
    companion object {
        private const val KEY_AUTH_TOKEN = "auth_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USERNAME = "username"
        private const val KEY_USER_ROLE = "user_role"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_AUTO_LOGIN = "auto_login"
        private const val KEY_TRACKING_ENABLED = "tracking_enabled"
        private const val KEY_LAST_SYNC_TIME = "last_sync_time"
    }
    
    suspend fun saveAuthToken(token: String) = withContext(Dispatchers.IO) {
        sharedPreferences.edit()
            .putString(KEY_AUTH_TOKEN, token)
            .apply()
    }
    
    suspend fun getAuthToken(): String? = withContext(Dispatchers.IO) {
        sharedPreferences.getString(KEY_AUTH_TOKEN, null)
    }
    
    suspend fun saveRefreshToken(token: String) = withContext(Dispatchers.IO) {
        sharedPreferences.edit()
            .putString(KEY_REFRESH_TOKEN, token)
            .apply()
    }
    
    suspend fun getRefreshToken(): String? = withContext(Dispatchers.IO) {
        sharedPreferences.getString(KEY_REFRESH_TOKEN, null)
    }
    
    suspend fun saveUserInfo(userId: String, username: String, role: String, fullName: String?) = withContext(Dispatchers.IO) {
        sharedPreferences.edit()
            .putString(KEY_USER_ID, userId)
            .putString(KEY_USERNAME, username)
            .putString(KEY_USER_ROLE, role)
            .putString(KEY_USER_NAME, fullName)
            .apply()
    }
    
    suspend fun getUserId(): String? = withContext(Dispatchers.IO) {
        sharedPreferences.getString(KEY_USER_ID, null)
    }
    
    suspend fun getUsername(): String? = withContext(Dispatchers.IO) {
        sharedPreferences.getString(KEY_USERNAME, null)
    }
    
    suspend fun getUserRole(): String? = withContext(Dispatchers.IO) {
        sharedPreferences.getString(KEY_USER_ROLE, null)
    }
    
    suspend fun getUserName(): String? = withContext(Dispatchers.IO) {
        sharedPreferences.getString(KEY_USER_NAME, null)
    }
    
    suspend fun setAutoLogin(enabled: Boolean) = withContext(Dispatchers.IO) {
        sharedPreferences.edit()
            .putBoolean(KEY_AUTO_LOGIN, enabled)
            .apply()
    }
    
    suspend fun isAutoLoginEnabled(): Boolean = withContext(Dispatchers.IO) {
        sharedPreferences.getBoolean(KEY_AUTO_LOGIN, true)
    }
    
    suspend fun setTrackingEnabled(enabled: Boolean) = withContext(Dispatchers.IO) {
        sharedPreferences.edit()
            .putBoolean(KEY_TRACKING_ENABLED, enabled)
            .apply()
    }
    
    suspend fun isTrackingEnabled(): Boolean = withContext(Dispatchers.IO) {
        sharedPreferences.getBoolean(KEY_TRACKING_ENABLED, true)
    }
    
    suspend fun saveLastSyncTime(timestamp: Long) = withContext(Dispatchers.IO) {
        sharedPreferences.edit()
            .putLong(KEY_LAST_SYNC_TIME, timestamp)
            .apply()
    }
    
    suspend fun getLastSyncTime(): Long = withContext(Dispatchers.IO) {
        sharedPreferences.getLong(KEY_LAST_SYNC_TIME, 0L)
    }
    
    suspend fun clearAll() = withContext(Dispatchers.IO) {
        sharedPreferences.edit().clear().apply()
    }
    
    suspend fun clearAuthData() = withContext(Dispatchers.IO) {
        sharedPreferences.edit()
            .remove(KEY_AUTH_TOKEN)
            .remove(KEY_REFRESH_TOKEN)
            .remove(KEY_USER_ID)
            .remove(KEY_USERNAME)
            .remove(KEY_USER_ROLE)
            .remove(KEY_USER_NAME)
            .apply()
    }
}