package com.wizoneit.taskmanager;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    private static final String TAG = "WizoneMainActivity";
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.d(TAG, "Starting Wizone IT Support Portal");
        
        // Enhanced WebView configuration for asset loading
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            
            // Basic WebView settings
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            
            // File access settings
            settings.setAllowFileAccess(true);
            settings.setAllowFileAccessFromFileURLs(true);
            settings.setAllowUniversalAccessFromFileURLs(true);
            
            // Display settings
            settings.setLoadWithOverviewMode(true);
            settings.setUseWideViewPort(true);
            settings.setSupportZoom(false);
            settings.setBuiltInZoomControls(false);
            settings.setDisplayZoomControls(false);
            
            // Cache settings (removed deprecated setAppCacheEnabled)
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            
            Log.d(TAG, "WebView settings configured successfully");
        } else {
            Log.e(TAG, "WebView is null - configuration failed");
        }
        
        Log.d(TAG, "MainActivity onCreate completed");
    }
}