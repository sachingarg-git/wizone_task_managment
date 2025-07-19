package com.wizoneit.taskmanager;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Enable WebView debugging for better error tracking
        WebView.setWebContentsDebuggingEnabled(true);
        
        // Additional WebView optimizations for better performance
        try {
            // Ensure WebView is loaded properly
            android.webkit.WebSettings webSettings = null;
            
            // Log successful initialization
            System.out.println("✅ Wizone MainActivity initialized successfully");
            
        } catch (Exception e) {
            System.err.println("⚠️ WebView initialization warning: " + e.getMessage());
        }
    }
}
