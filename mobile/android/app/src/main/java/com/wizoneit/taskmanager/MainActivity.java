package com.wizoneit.taskmanager;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    private static final String TAG = "WizoneMainActivity";
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.d(TAG, "🚀 Wizone MainActivity starting...");
        
        // Enable WebView debugging
        WebView.setWebContentsDebuggingEnabled(true);
        
        try {
            // Get the bridge WebView and configure it
            configureBridgeWebView();
            
            Log.d(TAG, "✅ MainActivity initialized successfully");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ WebView initialization error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void configureBridgeWebView() {
        // Get the WebView from Capacitor Bridge
        WebView webView = getBridge().getWebView();
        
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            
            // Enable JavaScript
            settings.setJavaScriptEnabled(true);
            
            // Enable DOM storage
            settings.setDomStorageEnabled(true);
            
            // Enable local storage
            settings.setDatabaseEnabled(true);
            
            // Allow file access
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setAllowFileAccessFromFileURLs(true);
            settings.setAllowUniversalAccessFromFileURLs(true);
            
            // Enable zoom controls
            settings.setBuiltInZoomControls(false);
            settings.setSupportZoom(false);
            
            // Set user agent
            settings.setUserAgentString(settings.getUserAgentString() + " WizoneApp/1.0");
            
            // Enable mixed content
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            
            // Set cache mode
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            
            // Custom WebViewClient for better error handling
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    Log.d(TAG, "✅ Page loaded: " + url);
                }
                
                @Override
                public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                    super.onReceivedError(view, errorCode, description, failingUrl);
                    Log.e(TAG, "❌ WebView error: " + description + " for URL: " + failingUrl);
                    
                    // Load fallback HTML on error
                    loadFallbackContent(view);
                }
            });
            
            // Custom WebChromeClient for console logging
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                    Log.d(TAG, "🔧 Console: " + consoleMessage.message() + 
                          " at " + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber());
                    return true;
                }
            });
            
            Log.d(TAG, "✅ WebView configured successfully");
        } else {
            Log.e(TAG, "❌ WebView is null - cannot configure");
        }
    }
    
    private void loadFallbackContent(WebView webView) {
        Log.d(TAG, "🔄 Loading fallback content...");
        
        // Load the app.html file directly
        String fallbackUrl = "file:///android_asset/public/app.html";
        webView.loadUrl(fallbackUrl);
        
        Log.d(TAG, "✅ Fallback content loaded: " + fallbackUrl);
    }
    
    @Override
    public void onStart() {
        super.onStart();
        
        // Force load app.html directly on startup
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            Log.d(TAG, "🚀 Force loading app.html on startup");
            webView.loadUrl("file:///android_asset/public/app.html");
        }
    }
    
    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "📱 App resumed");
    }
    
    @Override
    public void onPause() {
        super.onPause();
        Log.d(TAG, "⏸️ App paused");
    }
}
