package com.wizoneit.taskmanager;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.WebChromeClient;
import android.view.View;
import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Enable hardware acceleration
    getWindow().setFlags(
      android.view.WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
      android.view.WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
    );
    
    // Configure WebView settings for better performance
    this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
      // Optional: Add any Capacitor plugins
    }}, new CapacitorConfig() {{
      setBackgroundColor("#1e293b");
      setInitialFocus(false);
      setScrollEnabled(true);
      setKeyboardResizeMode("body");
    }});
    
    // Get WebView and configure for mobile app
    WebView webView = getBridge().getWebView();
    if (webView != null) {
      WebSettings webSettings = webView.getSettings();
      
      // Enable JavaScript and DOM storage
      webSettings.setJavaScriptEnabled(true);
      webSettings.setDomStorageEnabled(true);
      webSettings.setDatabaseEnabled(true);
      
      // Enable caching for better performance
      webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
      webSettings.setAppCacheEnabled(true);
      
      // Enable responsive design
      webSettings.setUseWideViewPort(true);
      webSettings.setLoadWithOverviewMode(true);
      
      // Enable zoom controls but hide zoom buttons
      webSettings.setSupportZoom(true);
      webSettings.setBuiltInZoomControls(true);
      webSettings.setDisplayZoomControls(false);
      
      // Allow mixed content for development
      webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
      
      // Enable file access
      webSettings.setAllowFileAccess(true);
      webSettings.setAllowContentAccess(true);
      webSettings.setAllowFileAccessFromFileURLs(true);
      webSettings.setAllowUniversalAccessFromFileURLs(true);
      
      // Set user agent to include mobile identifier
      String userAgent = webSettings.getUserAgentString();
      webSettings.setUserAgentString(userAgent + " WizoneMobile/1.0 (Android)");
      
      // Set WebView client to handle navigation
      webView.setWebViewClient(new WebViewClient() {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
          // Allow navigation within the same domain
          if (url.startsWith("http://localhost") || 
              url.startsWith("https://") || 
              url.startsWith("file:///android_asset/")) {
            return false; // Let WebView handle the URL
          }
          
          // Open external links in browser
          Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
          startActivity(intent);
          return true;
        }
        
        @Override
        public void onPageFinished(WebView view, String url) {
          super.onPageFinished(view, url);
          
          // Inject mobile-specific CSS and JavaScript
          String mobileOptimization = 
            "javascript:(function() {" +
            "  var meta = document.createElement('meta');" +
            "  meta.name = 'viewport';" +
            "  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';" +
            "  document.head.appendChild(meta);" +
            "  " +
            "  var style = document.createElement('style');" +
            "  style.innerHTML = '" +
            "    body { -webkit-touch-callout: none; -webkit-user-select: none; }" +
            "    * { -webkit-tap-highlight-color: transparent; }" +
            "    input, textarea, select { font-size: 16px !important; }" +
            "  ';" +
            "  document.head.appendChild(style);" +
            "})()";
          
          view.loadUrl(mobileOptimization);
        }
      });
      
      // Set WebChrome client for better JavaScript support
      webView.setWebChromeClient(new WebChromeClient() {
        @Override
        public void onPermissionRequest(final android.webkit.PermissionRequest request) {
          // Grant permissions for camera, microphone, location
          request.grant(request.getResources());
        }
      });
      
      // Disable scroll bouncing
      webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
    }
  }
  
  @Override
  public void onBackPressed() {
    WebView webView = getBridge().getWebView();
    if (webView != null && webView.canGoBack()) {
      webView.goBack();
    } else {
      super.onBackPressed();
    }
  }
}