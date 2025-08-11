package com.wizoneit.fieldapp.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wizoneit.fieldapp.data.api.RetrofitClient
import com.wizoneit.fieldapp.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import retrofit2.HttpException
import java.io.IOException

class LoginViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {
    
    private val _loginState = MutableStateFlow<LoginState>(LoginState.Idle)
    val loginState: StateFlow<LoginState> = _loginState.asStateFlow()
    
    private val _connectionState = MutableStateFlow<ConnectionState>(ConnectionState.Idle)
    val connectionState: StateFlow<ConnectionState> = _connectionState.asStateFlow()
    
    fun login(username: String, password: String) {
        viewModelScope.launch {
            _loginState.value = LoginState.Loading
            
            authRepository.login(username, password)
                .onSuccess { response ->
                    _loginState.value = LoginState.Success(response)
                }
                .onFailure { throwable ->
                    val errorMessage = when (throwable) {
                        is HttpException -> {
                            when (throwable.code()) {
                                401 -> "Invalid username or password"
                                403 -> "Access denied"
                                404 -> "Server not found"
                                500 -> "Server error. Please try again later"
                                else -> "Login failed: ${throwable.message()}"
                            }
                        }
                        is IOException -> "Network error. Check your connection"
                        else -> throwable.message ?: "Login failed"
                    }
                    _loginState.value = LoginState.Error(errorMessage)
                }
        }
    }
    
    fun testConnection() {
        viewModelScope.launch {
            _connectionState.value = ConnectionState.Testing
            
            try {
                val startTime = System.currentTimeMillis()
                val response = RetrofitClient.apiService.testConnection()
                val latency = System.currentTimeMillis() - startTime
                
                if (response.isSuccessful) {
                    _connectionState.value = ConnectionState.Success(latency)
                } else {
                    _connectionState.value = ConnectionState.Error("HTTP ${response.code()}: ${response.message()}")
                }
            } catch (e: Exception) {
                val errorMessage = when (e) {
                    is IOException -> "Network error: ${e.message}"
                    is HttpException -> "HTTP error: ${e.code()} - ${e.message()}"
                    else -> "Connection failed: ${e.message}"
                }
                _connectionState.value = ConnectionState.Error(errorMessage)
            }
        }
    }
}

sealed class LoginState {
    object Idle : LoginState()
    object Loading : LoginState()
    data class Success(val response: com.wizoneit.fieldapp.data.model.LoginResponse) : LoginState()
    data class Error(val message: String) : LoginState()
}

sealed class ConnectionState {
    object Idle : ConnectionState()
    object Testing : ConnectionState()
    data class Success(val latency: Long) : ConnectionState()
    data class Error(val message: String) : ConnectionState()
}