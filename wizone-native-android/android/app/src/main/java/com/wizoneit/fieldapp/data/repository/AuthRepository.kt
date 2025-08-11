package com.wizoneit.fieldapp.data.repository

import com.wizoneit.fieldapp.data.api.ApiService
import com.wizoneit.fieldapp.data.api.RetrofitClient
import com.wizoneit.fieldapp.data.model.LoginRequest
import com.wizoneit.fieldapp.data.model.LoginResponse
import com.wizoneit.fieldapp.data.model.RefreshTokenRequest
import com.wizoneit.fieldapp.data.model.User
import com.wizoneit.fieldapp.data.storage.SecureStorage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.Response

class AuthRepository(
    private val apiService: ApiService,
    private val secureStorage: SecureStorage
) {
    
    suspend fun login(username: String, password: String): Result<LoginResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.login(LoginRequest(username, password))
            
            if (response.isSuccessful && response.body() != null) {
                val loginResponse = response.body()!!
                
                // Save user info and tokens
                secureStorage.saveUserInfo(
                    loginResponse.id,
                    loginResponse.username,
                    loginResponse.role,
                    "${loginResponse.firstName ?: ""} ${loginResponse.lastName ?: ""}".trim()
                )
                
                // Save auth token if provided, otherwise use session-based auth
                loginResponse.token?.let { token ->
                    secureStorage.saveAuthToken(token)
                    RetrofitClient.setAuthToken(token)
                }
                
                Result.success(loginResponse)
            } else {
                Result.failure(Exception("Login failed: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun logout(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            apiService.logout()
            
            // Clear all auth data
            secureStorage.clearAuthData()
            RetrofitClient.setAuthToken(null)
            
            Result.success(Unit)
        } catch (e: Exception) {
            // Even if logout fails on server, clear local data
            secureStorage.clearAuthData()
            RetrofitClient.setAuthToken(null)
            Result.success(Unit)
        }
    }
    
    suspend fun getCurrentUser(): Result<User> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getCurrentUser()
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to get user info: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun refreshToken(): Result<LoginResponse> = withContext(Dispatchers.IO) {
        try {
            val refreshToken = secureStorage.getRefreshToken()
            if (refreshToken.isNullOrEmpty()) {
                return@withContext Result.failure(Exception("No refresh token available"))
            }
            
            val response = apiService.refreshToken(RefreshTokenRequest(refreshToken))
            
            if (response.isSuccessful && response.body() != null) {
                val loginResponse = response.body()!!
                
                // Update tokens
                loginResponse.token?.let { token ->
                    secureStorage.saveAuthToken(token)
                    RetrofitClient.setAuthToken(token)
                }
                
                Result.success(loginResponse)
            } else {
                Result.failure(Exception("Token refresh failed: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun isLoggedIn(): Boolean {
        val token = secureStorage.getAuthToken()
        val userId = secureStorage.getUserId()
        return !token.isNullOrEmpty() || !userId.isNullOrEmpty()
    }
    
    suspend fun initializeAuth() {
        val token = secureStorage.getAuthToken()
        if (!token.isNullOrEmpty()) {
            RetrofitClient.setAuthToken(token)
        }
    }
}