package com.wizone.taskmanager;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.WebChromeClient;
import android.view.WindowManager;
import android.graphics.Color;
import android.view.View;
import android.widget.Toast;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Handler;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AlertDialog;

public class MainActivity extends AppCompatActivity {
    
    private WebView webView;
    private static final String APP_URL = "https://window.299f0612-89c3-4a4f-9a65-3dd9be12e804-00-3u4fqy7m2q8tl.picard.replit.dev/";
    private static final String FALLBACK_URL = "https://task.wizoneit.com/";
    private boolean isLoading = false;
    
    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // Hide status bar and make fullscreen
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);
        
        // Hide navigation bar
        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
        decorView.setSystemUiVisibility(uiOptions);
        
        webView = findViewById(R.id.webview);
        
        // Check network connectivity first
        if (!isNetworkAvailable()) {
            showNetworkErrorDialog();
            return;
        }
        
        setupWebView();
        loadApplication();
    }
    
    private void setupWebView() {
        // Configure WebView settings
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);
        webSettings.setSupportZoom(true);
        webSettings.setDefaultTextEncodingName("utf-8");
        webSettings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        // Enhanced User Agent for better compatibility
        webSettings.setUserAgentString("Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36 WizoneApp/1.0");
        
        // Set WebView client with enhanced error handling
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("tel:") || url.startsWith("mailto:")) {
                    // Let the system handle phone calls and emails
                    return false;
                }
                view.loadUrl(url);
                return true;
            }
            
            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                isLoading = true;
                // Show loading indicator
                Toast.makeText(MainActivity.this, "Loading Wizone Portal...", Toast.LENGTH_SHORT).show();
            }
            
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                isLoading = false;
                
                // Inject CSS to optimize mobile display
                String css = "javascript:(function() {" +
                    "var meta = document.createElement('meta');" +
                    "meta.name = 'viewport';" +
                    "meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';" +
                    "document.getElementsByTagName('head')[0].appendChild(meta);" +
                    "var style = document.createElement('style');" +
                    "style.innerHTML = 'body { margin: 0 !important; padding: 0 !important; overflow-x: hidden !important; } " +
                    "html { margin: 0 !important; padding: 0 !important; }';" +
                    "document.head.appendChild(style);" +
                    "})()";
                view.loadUrl(css);
            }
            
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                isLoading = false;
                
                // Show retry dialog with options
                showErrorDialog(description, failingUrl);
            }
            
            @Override
            public void onReceivedHttpError(WebView view, android.webkit.WebResourceRequest request, android.webkit.WebResourceResponse errorResponse) {
                super.onReceivedHttpError(view, request, errorResponse);
                if (request.isForMainFrame()) {
                    isLoading = false;
                    showErrorDialog("HTTP Error: " + errorResponse.getStatusCode(), request.getUrl().toString());
                }
            }
        });
        
        // Set WebChrome client for better performance and permissions
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                super.onProgressChanged(view, newProgress);
                // Optional: Show progress bar
            }
            
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage consoleMessage) {
                // Log console messages for debugging
                android.util.Log.d("WebView", consoleMessage.message());
                return super.onConsoleMessage(consoleMessage);
            }
        });
        
        // Set background color
        webView.setBackgroundColor(Color.parseColor("#0891b2"));
    }
    
    private void loadApplication() {
        // Try primary URL first
        webView.loadUrl(APP_URL);
        
        // Set timeout for loading
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                if (isLoading) {
                    // Still loading after 10 seconds, show retry option
                    showTimeoutDialog();
                }
            }
        }, 10000);
    }
    
    private boolean isNetworkAvailable() {
        ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo activeNetworkInfo = connectivityManager.getActiveNetworkInfo();
        return activeNetworkInfo != null && activeNetworkInfo.isConnected();
    }
    
    private void showNetworkErrorDialog() {
        new AlertDialog.Builder(this)
            .setTitle("No Internet Connection")
            .setMessage("Please check your internet connection and try again.")
            .setIcon(android.R.drawable.ic_dialog_alert)
            .setPositiveButton("Retry", (dialog, which) -> {
                if (isNetworkAvailable()) {
                    setupWebView();
                    loadApplication();
                } else {
                    showNetworkErrorDialog();
                }
            })
            .setNegativeButton("Exit", (dialog, which) -> finish())
            .setCancelable(false)
            .show();
    }
    
    private void showErrorDialog(String error, String url) {
        new AlertDialog.Builder(this)
            .setTitle("Unable to Load Application")
            .setMessage("Error: " + error + "\n\nPlease check your internet connection or try again later.")
            .setIcon(android.R.drawable.ic_dialog_alert)
            .setPositiveButton("Retry", (dialog, which) -> {
                if (isNetworkAvailable()) {
                    webView.reload();
                } else {
                    showNetworkErrorDialog();
                }
            })
            .setNeutralButton("Try Backup", (dialog, which) -> {
                webView.loadUrl(FALLBACK_URL);
            })
            .setNegativeButton("Exit", (dialog, which) -> finish())
            .setCancelable(false)
            .show();
    }
    
    private void showTimeoutDialog() {
        new AlertDialog.Builder(this)
            .setTitle("Loading Timeout")
            .setMessage("The application is taking longer than expected to load. Would you like to retry?")
            .setIcon(android.R.drawable.ic_dialog_info)
            .setPositiveButton("Retry", (dialog, which) -> {
                webView.reload();
            })
            .setNeutralButton("Try Backup", (dialog, which) -> {
                webView.loadUrl(FALLBACK_URL);
            })
            .setNegativeButton("Exit", (dialog, which) -> finish())
            .setCancelable(false)
            .show();
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }
    
    @Override
    protected void onPause() {
        super.onPause();
        webView.onPause();
    }
    
    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}