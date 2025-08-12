package com.wizoneit.fieldapp

import android.content.Intent
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import androidx.appcompat.app.AppCompatActivity
import com.wizoneit.fieldapp.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Enable WebView debugging and cookie management
        WebView.setWebContentsDebuggingEnabled(true)
        CookieManager.getInstance().setAcceptCookie(true)
        
        try {
            binding = ActivityMainBinding.inflate(layoutInflater)
            setContentView(binding.root)
            
            setupWebView()
            
        } catch (e: Exception) {
            // Fallback - create simple WebView programmatically
            createSimpleWebView()
        }
    }
    
    private fun setupWebView() {
        binding.webView.apply {
            // Setup cookie manager for session persistence
            CookieManager.getInstance().setAcceptCookie(true)
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
            
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    // Hide loading indicator if present
                    binding.progressBar.visibility = android.view.View.GONE
                    
                    // Sync cookies to ensure session persistence
                    CookieManager.getInstance().flush()
                }
                
                override fun onReceivedError(view: WebView?, errorCode: Int, description: String?, failingUrl: String?) {
                    super.onReceivedError(view, errorCode, description, failingUrl)
                    binding.progressBar.visibility = android.view.View.GONE
                    // Don't show hardcoded error - let React app handle errors
                    android.util.Log.d("WebView", "Error loading: $description for URL: $failingUrl")
                }
                
                override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                    super.onPageStarted(view, url, favicon)
                    binding.progressBar.visibility = android.view.View.VISIBLE
                }
            }
            
            webChromeClient = WebChromeClient()
            
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowContentAccess = true
                allowFileAccess = true
                allowUniversalAccessFromFileURLs = true
                allowFileAccessFromFileURLs = true
                setSupportZoom(true)
                builtInZoomControls = true
                displayZoomControls = false
                loadWithOverviewMode = true
                useWideViewPort = true
                cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
                mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                userAgentString = "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36 WizoneFieldApp/1.0"
            }
            
            // Load the local Capacitor app - use file:// scheme for local assets
            loadUrl("file:///android_asset/public/index.html")
        }
    }
    
    private fun createSimpleWebView() {
        val webView = WebView(this)
        
        // Enable cookies for session management
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)
        
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                CookieManager.getInstance().flush()
            }
        }
        
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowContentAccess = true
            allowFileAccess = true
            cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
            mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            userAgentString = "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36 WizoneFieldApp/1.0"
        }
        
        webView.loadUrl("file:///android_asset/public/index.html")
        setContentView(webView)
    }
    
    override fun onBackPressed() {
        if (::binding.isInitialized && binding.webView.canGoBack()) {
            binding.webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}