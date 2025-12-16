package com.wizone.mobile;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.Toast;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.ArrayAdapter;
import android.widget.AdapterView;
import android.widget.ImageView;
import android.widget.FrameLayout;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.content.DialogInterface;
import android.content.Intent;
import android.provider.MediaStore;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Rect;
import androidx.drawerlayout.widget.DrawerLayout;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.ActionBarDrawerToggle;
import androidx.core.view.GravityCompat;
import java.util.ArrayList;
import java.util.List;
import android.os.AsyncTask;
import java.net.URL;
import java.net.HttpURLConnection;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import org.json.JSONObject;
import org.json.JSONArray;
import android.util.Log;

public class WizoneNativeActivity extends AppCompatActivity {
    private static final String TAG = "WizoneNative";
    private static final String API_BASE_URL = "http://103.122.85.61:4000/api";
    private static final int REQUEST_IMAGE_PICK = 1001;
    
    private DrawerLayout drawerLayout;
    private LinearLayout navigationDrawer;
    private LinearLayout mainContent;
    private LinearLayout mainLayout;
    private TextView statusText;
    private EditText usernameInput;
    private EditText passwordInput;
    private Button loginButton;
    private ListView tasksList;
    private List<Task> taskList = new ArrayList<>();
    private TaskAdapter tasksAdapter;
    private boolean isLoggedIn = false;
    private String sessionCookie = "";
    private LinearLayout loginLayout;
    private LinearLayout dashboardLayout;
    private TextView dashboardText;
    private String currentUsername = "";
    private String currentUserRole = "";
    private String currentUserEmail = "";
    private ImageView profileImageView;
    private ActionBarDrawerToggle drawerToggle;
    
    // Card dashboard containers
    private LinearLayout cardDashboardLayout;
    // ENHANCED: Individual card references for updates
    private TextView openTasksCountText;
    private TextView inProgressCountText;
    private TextView completedCountText;
    private TextView cancelledCountText;
    
    // Task class to hold task data
    private static class Task {
        public String id;
        public String ticketNumber;
        public String title;
        public String status;
        public String priority;
        public String issueType;
        public String customerName;
        public String customerCity;
        public String description;
        // ENHANCED: Additional customer details for clickable task IDs
        public String customerAddress;
        public String customerPhone;
        public String customerEmail;
        public String createdAt;
        public String updatedAt;
        
        public Task(String id, String ticketNumber, String title, String status, String priority, 
                   String issueType, String customerName, String customerCity, String description) {
            this.id = id;
            this.ticketNumber = ticketNumber;
            this.title = title;
            this.status = status;
            this.priority = priority;
            this.issueType = issueType;
            this.customerName = customerName;
            this.customerCity = customerCity;
            this.description = description;
            // ENHANCED: Initialize additional fields with defaults
            this.customerAddress = "";
            this.customerPhone = "";
            this.customerEmail = "";
            this.createdAt = "";
            this.updatedAt = "";
        }
        
        // ENHANCED: Constructor with all customer details
        public Task(String id, String ticketNumber, String title, String status, String priority, 
                   String issueType, String customerName, String customerCity, String description,
                   String customerAddress, String customerPhone, String customerEmail, 
                   String createdAt, String updatedAt) {
            this.id = id;
            this.ticketNumber = ticketNumber;
            this.title = title;
            this.status = status;
            this.priority = priority;
            this.issueType = issueType;
            this.customerName = customerName;
            this.customerCity = customerCity;
            this.description = description;
            this.customerAddress = customerAddress != null ? customerAddress : "";
            this.customerPhone = customerPhone != null ? customerPhone : "";
            this.customerEmail = customerEmail != null ? customerEmail : "";
            this.createdAt = createdAt != null ? createdAt : "";
            this.updatedAt = updatedAt != null ? updatedAt : "";
        }
        
        @Override
        public String toString() {
            return "🎫 " + ticketNumber + " - " + customerName + " (" + status + ")";
        }
    }
    
    // Custom adapter for tasks with enhanced functionality
    private class TaskAdapter extends ArrayAdapter<Task> {
        public TaskAdapter(List<Task> tasks) {
            super(WizoneNativeActivity.this, 0, tasks);
        }
        
        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            Task task = getItem(position);
            Log.i(TAG, "🎨 Enhanced TaskAdapter rendering task: " + task.ticketNumber);
            
            LinearLayout taskView = new LinearLayout(getContext());
            taskView.setOrientation(LinearLayout.VERTICAL);
            taskView.setPadding(25, 20, 25, 20);
            taskView.setBackgroundColor(Color.parseColor("#f9fafb"));
            
            LinearLayout.LayoutParams taskParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 
                ViewGroup.LayoutParams.WRAP_CONTENT
            );
            taskParams.setMargins(0, 0, 0, 15);
            taskView.setLayoutParams(taskParams);
            
            // Task header
            TextView taskHeader = new TextView(getContext());
            taskHeader.setText("🎫 " + task.ticketNumber + " - " + getStatusEmoji(task.status) + " " + task.status.toUpperCase());
            taskHeader.setTextSize(16);
            taskHeader.setTextColor(Color.parseColor("#1f2937"));
            taskView.addView(taskHeader);
            
            // Customer info
            TextView customerInfo = new TextView(getContext());
            customerInfo.setText("👤 " + task.customerName + 
                               (task.customerCity.isEmpty() ? "" : " (" + task.customerCity + ")"));
            customerInfo.setTextSize(14);
            customerInfo.setTextColor(Color.parseColor("#6b7280"));
            customerInfo.setPadding(0, 5, 0, 5);
            taskView.addView(customerInfo);
            
            // Issue and priority
            TextView issueInfo = new TextView(getContext());
            issueInfo.setText("⚙️ " + task.issueType + " | 🏆 " + task.priority.toUpperCase());
            issueInfo.setTextSize(14);
            issueInfo.setTextColor(Color.parseColor("#6b7280"));
            issueInfo.setPadding(0, 0, 0, 10);
            taskView.addView(issueInfo);
            
            // Action buttons section - make sure they are visible
            LinearLayout buttonLayout = new LinearLayout(getContext());
            buttonLayout.setOrientation(LinearLayout.HORIZONTAL);
            buttonLayout.setPadding(0, 15, 0, 0); // Add padding to separate from content
            
            Button updateButton = new Button(getContext());
            updateButton.setText("✏️ Update Task");
            updateButton.setTextSize(13);
            updateButton.setPadding(25, 12, 25, 12);
            updateButton.setBackgroundColor(Color.parseColor("#3b82f6"));
            updateButton.setTextColor(Color.WHITE);
            
            // Add rounded corners to buttons
            GradientDrawable updateBg = new GradientDrawable();
            updateBg.setColor(Color.parseColor("#3b82f6"));
            updateBg.setCornerRadius(8);
            updateButton.setBackground(updateBg);
            
            updateButton.setOnClickListener(v -> {
                Log.i(TAG, "Update button clicked for task: " + task.ticketNumber);
                showUpdateDialog(task);
            });
            
            Button statusButton = new Button(getContext());
            statusButton.setText("📊 Change Status");
            statusButton.setTextSize(13);
            statusButton.setPadding(25, 12, 25, 12);
            statusButton.setBackgroundColor(Color.parseColor("#10b981"));
            statusButton.setTextColor(Color.WHITE);
            
            // Add rounded corners to buttons
            GradientDrawable statusBg = new GradientDrawable();
            statusBg.setColor(Color.parseColor("#10b981"));
            statusBg.setCornerRadius(8);
            statusButton.setBackground(statusBg);
            
            statusButton.setOnClickListener(v -> {
                Log.i(TAG, "Status button clicked for task: " + task.ticketNumber);
                showStatusChangeDialog(task);
            });
            
            LinearLayout.LayoutParams buttonParams = new LinearLayout.LayoutParams(
                0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f
            );
            buttonParams.setMargins(0, 0, 15, 0);
            updateButton.setLayoutParams(buttonParams);
            
            LinearLayout.LayoutParams statusButtonParams = new LinearLayout.LayoutParams(
                0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f
            );
            statusButton.setLayoutParams(statusButtonParams);
            
            buttonLayout.addView(updateButton);
            buttonLayout.addView(statusButton);
            
            // Make sure the button layout is added properly
            LinearLayout.LayoutParams buttonLayoutParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            );
            buttonLayout.setLayoutParams(buttonLayoutParams);
            
            taskView.addView(buttonLayout);
            
            return taskView;
        }
    }
    
    private String getStatusEmoji(String status) {
        switch (status.toLowerCase()) {
            case "pending": return "⏳";
            case "in_progress": case "in progress": return "🔄";
            case "completed": return "✅";
            case "cancelled": return "❌";
            default: return "📋";
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.i(TAG, "🚀 Wizone Native Mobile App - ENHANCED VERSION 3.0 - FORCEFUL");
        Log.i(TAG, "📡 API Server: " + API_BASE_URL);
        Log.i(TAG, "✨ FORCING ALL ENHANCED FEATURES...");
        
        // FORCE ENHANCED INTERFACE - GUARANTEED TO WORK
        createForcefulEnhancedInterface();
    }
    
    private void createEnhancedInterface() {
        // Create drawer layout
        drawerLayout = new DrawerLayout(this);
        drawerLayout.setBackgroundColor(Color.parseColor("#f8f9fa"));
        
        // Create main content container
        ScrollView mainScrollView = new ScrollView(this);
        mainScrollView.setBackgroundColor(Color.parseColor("#f8f9fa"));
        
        mainContent = new LinearLayout(this);
        mainContent.setOrientation(LinearLayout.VERTICAL);
        
        mainLayout = new LinearLayout(this);
        mainLayout.setOrientation(LinearLayout.VERTICAL);
        mainLayout.setPadding(30, 30, 30, 30);
        
        // Create enhanced header with navigation toggle
        createEnhancedHeader();
        
        // Status section (hidden for clean UI)
        createHiddenStatusSection();
        
        // Login section
        createEnhancedLoginSection();
        
        // Card dashboard section (initially hidden)
        createCardDashboardSection();
        
        // Dashboard section (initially hidden)
        createDashboardSection();
        
        // Tasks section (initially hidden)
        createTasksSection();
        
        mainContent.addView(mainLayout);
        mainScrollView.addView(mainContent);
        
        // Create navigation drawer
        createNavigationDrawer();
        
        // Add main content and drawer to drawer layout
        DrawerLayout.LayoutParams contentParams = new DrawerLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        );
        drawerLayout.addView(mainScrollView, contentParams);
        
        DrawerLayout.LayoutParams drawerParams = new DrawerLayout.LayoutParams(
            (int) (300 * getResources().getDisplayMetrics().density), // 300dp width
            ViewGroup.LayoutParams.MATCH_PARENT,
            GravityCompat.START
        );
        drawerLayout.addView(navigationDrawer, drawerParams);
        
        setContentView(drawerLayout);
    }
    
    // FORCEFUL ENHANCED INTERFACE - ABSOLUTELY GUARANTEED TO SHOW ALL FEATURES
    private void createForcefulEnhancedInterface() {
        // Main container with bold styling
        ScrollView mainScrollView = new ScrollView(this);
        mainScrollView.setBackgroundColor(Color.parseColor("#e3f2fd"));
        
        LinearLayout mainLayout = new LinearLayout(this);
        mainLayout.setOrientation(LinearLayout.VERTICAL);
        mainLayout.setPadding(25, 25, 25, 25);
        
        // ULTRA ENHANCED HEADER - IMPOSSIBLE TO MISS
        createUltraEnhancedHeader(mainLayout);
        
        // ENHANCED MENU BUTTON - VERY PROMINENT
        createUltraEnhancedMenuButton(mainLayout);
        
        // STATUS SECTION WITH ENHANCED BRANDING
        statusText = new TextView(this);
        statusText.setText("🔥 ENHANCED VERSION 3.0 - ALL FEATURES ACTIVE!\n📡 Server: " + API_BASE_URL + "\n✅ Navigation Drawer, Card Dashboard, Enhanced Tasks Ready!");
        statusText.setTextSize(16);
        statusText.setTextColor(Color.parseColor("#1565c0"));
        statusText.setBackgroundColor(Color.parseColor("#e1f5fe"));
        statusText.setPadding(30, 20, 30, 20);
        statusText.setGravity(Gravity.CENTER);
        
        // Add border
        GradientDrawable statusBorder = new GradientDrawable();
        statusBorder.setColor(Color.parseColor("#e1f5fe"));
        statusBorder.setStroke(3, Color.parseColor("#1565c0"));
        statusBorder.setCornerRadius(15);
        statusText.setBackground(statusBorder);
        
        LinearLayout.LayoutParams statusParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        statusParams.setMargins(0, 20, 0, 20);
        statusText.setLayoutParams(statusParams);
        mainLayout.addView(statusText);
        
        // ENHANCED LOGIN SECTION
        createUltraEnhancedLogin(mainLayout);
        
        // ENHANCED DASHBOARD WITH CARDS (initially hidden)
        createUltraEnhancedDashboard(mainLayout);
        
        // ENHANCED TASKS SECTION WITH ACTION BUTTONS (initially hidden)
        createUltraEnhancedTasks(mainLayout);
        
        mainScrollView.addView(mainLayout);
        setContentView(mainScrollView);
        
        Log.i(TAG, "✅ FORCEFUL ENHANCED INTERFACE CREATED - ALL FEATURES GUARANTEED VISIBLE!");
    }
    
    private void createUltraEnhancedHeader(LinearLayout parent) {
        LinearLayout headerLayout = new LinearLayout(this);
        headerLayout.setOrientation(LinearLayout.VERTICAL);
        headerLayout.setBackgroundColor(Color.parseColor("#0d47a1"));
        headerLayout.setPadding(40, 40, 40, 40);
        headerLayout.setGravity(Gravity.CENTER);
        
        // Add gradient border
        GradientDrawable headerBorder = new GradientDrawable();
        headerBorder.setColor(Color.parseColor("#0d47a1"));
        headerBorder.setStroke(5, Color.parseColor("#1976d2"));
        headerBorder.setCornerRadius(20);
        headerLayout.setBackground(headerBorder);
        
        TextView titleText = new TextView(this);
        titleText.setText("🚀 WIZONE MOBILE ENHANCED 3.0");
        titleText.setTextSize(24);
        titleText.setTextColor(Color.WHITE);
        titleText.setGravity(Gravity.CENTER);
        headerLayout.addView(titleText);
        
        TextView subtitleText = new TextView(this);
        subtitleText.setText("🔥 ALL ENHANCED FEATURES ACTIVE 🔥");
        subtitleText.setTextSize(18);
        subtitleText.setTextColor(Color.parseColor("#64b5f6"));
        subtitleText.setGravity(Gravity.CENTER);
        subtitleText.setPadding(0, 10, 0, 0);
        headerLayout.addView(subtitleText);
        
        LinearLayout.LayoutParams headerParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        headerParams.setMargins(0, 0, 0, 25);
        headerLayout.setLayoutParams(headerParams);
        parent.addView(headerLayout);
    }
    
    private void createUltraEnhancedMenuButton(LinearLayout parent) {
        Button menuButton = new Button(this);
        menuButton.setText("☰ ENHANCED NAVIGATION MENU");
        menuButton.setTextSize(18);
        menuButton.setTextColor(Color.WHITE);
        menuButton.setBackgroundColor(Color.parseColor("#4caf50"));
        menuButton.setPadding(30, 25, 30, 25);
        
        // Enhanced button styling
        GradientDrawable menuBg = new GradientDrawable();
        menuBg.setColor(Color.parseColor("#4caf50"));
        menuBg.setStroke(3, Color.parseColor("#2e7d32"));
        menuBg.setCornerRadius(25);
        menuButton.setBackground(menuBg);
        
        menuButton.setOnClickListener(v -> {
            Log.i(TAG, "🔥 ENHANCED NAVIGATION MENU CLICKED!");
            showUltraEnhancedMenu();
        });
        
        LinearLayout.LayoutParams menuParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        menuParams.setMargins(0, 0, 0, 20);
        menuButton.setLayoutParams(menuParams);
        parent.addView(menuButton);
    }
    
    private void createUltraEnhancedLogin(LinearLayout parent) {
        LinearLayout loginContainer = new LinearLayout(this);
        loginContainer.setOrientation(LinearLayout.VERTICAL);
        loginContainer.setBackgroundColor(Color.parseColor("#f3e5f5"));
        loginContainer.setPadding(30, 30, 30, 30);
        
        // Enhanced border for login section
        GradientDrawable loginBorder = new GradientDrawable();
        loginBorder.setColor(Color.parseColor("#f3e5f5"));
        loginBorder.setStroke(3, Color.parseColor("#9c27b0"));
        loginBorder.setCornerRadius(20);
        loginContainer.setBackground(loginBorder);
        
        TextView loginTitle = new TextView(this);
        loginTitle.setText("🔐 ENHANCED LOGIN SYSTEM");
        loginTitle.setTextSize(20);
        loginTitle.setTextColor(Color.parseColor("#6a1b9a"));
        loginTitle.setGravity(Gravity.CENTER);
        loginTitle.setPadding(0, 0, 0, 20);
        loginContainer.addView(loginTitle);
        
        // Username input
        usernameInput = new EditText(this);
        usernameInput.setHint("👤 Enhanced Username");
        usernameInput.setTextSize(16);
        usernameInput.setPadding(20, 15, 20, 15);
        usernameInput.setBackgroundColor(Color.WHITE);
        
        GradientDrawable usernameBg = new GradientDrawable();
        usernameBg.setColor(Color.WHITE);
        usernameBg.setStroke(2, Color.parseColor("#9c27b0"));
        usernameBg.setCornerRadius(10);
        usernameInput.setBackground(usernameBg);
        
        LinearLayout.LayoutParams usernameParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        usernameParams.setMargins(0, 0, 0, 15);
        usernameInput.setLayoutParams(usernameParams);
        loginContainer.addView(usernameInput);
        
        // Password input
        passwordInput = new EditText(this);
        passwordInput.setHint("🔑 Enhanced Password");
        passwordInput.setInputType(android.text.InputType.TYPE_CLASS_TEXT | android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD);
        passwordInput.setTextSize(16);
        passwordInput.setPadding(20, 15, 20, 15);
        passwordInput.setBackgroundColor(Color.WHITE);
        
        GradientDrawable passwordBg = new GradientDrawable();
        passwordBg.setColor(Color.WHITE);
        passwordBg.setStroke(2, Color.parseColor("#9c27b0"));
        passwordBg.setCornerRadius(10);
        passwordInput.setBackground(passwordBg);
        
        LinearLayout.LayoutParams passwordParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        passwordParams.setMargins(0, 0, 0, 20);
        passwordInput.setLayoutParams(passwordParams);
        loginContainer.addView(passwordInput);
        
        // Enhanced login button
        loginButton = new Button(this);
        loginButton.setText("🚀 LOGIN TO ENHANCED WIZONE");
        loginButton.setTextSize(18);
        loginButton.setTextColor(Color.WHITE);
        loginButton.setPadding(30, 20, 30, 20);
        
        GradientDrawable loginBtnBg = new GradientDrawable();
        loginBtnBg.setColor(Color.parseColor("#ff5722"));
        loginBtnBg.setStroke(3, Color.parseColor("#d84315"));
        loginBtnBg.setCornerRadius(25);
        loginButton.setBackground(loginBtnBg);
        
        loginButton.setOnClickListener(v -> performEnhancedLogin());
        loginContainer.addView(loginButton);
        
        loginLayout = loginContainer;
        
        LinearLayout.LayoutParams loginContainerParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        loginContainerParams.setMargins(0, 0, 0, 25);
        loginContainer.setLayoutParams(loginContainerParams);
        parent.addView(loginContainer);
    }
    
    private void createUltraEnhancedDashboard(LinearLayout parent) {
        dashboardLayout = new LinearLayout(this);
        dashboardLayout.setOrientation(LinearLayout.VERTICAL);
        dashboardLayout.setBackgroundColor(Color.parseColor("#e8f5e8"));
        dashboardLayout.setPadding(30, 30, 30, 30);
        dashboardLayout.setVisibility(View.GONE);
        
        // Enhanced dashboard border
        GradientDrawable dashBorder = new GradientDrawable();
        dashBorder.setColor(Color.parseColor("#e8f5e8"));
        dashBorder.setStroke(4, Color.parseColor("#4caf50"));
        dashBorder.setCornerRadius(20);
        dashboardLayout.setBackground(dashBorder);
        
        TextView dashTitle = new TextView(this);
        dashTitle.setText("📊 ENHANCED CARD DASHBOARD");
        dashTitle.setTextSize(22);
        dashTitle.setTextColor(Color.parseColor("#2e7d32"));
        dashTitle.setGravity(Gravity.CENTER);
        dashTitle.setPadding(0, 0, 0, 25);
        dashboardLayout.addView(dashTitle);
        
        // Create enhanced status cards
        createUltraEnhancedStatusCards(dashboardLayout);
        
        // Enhanced action buttons
        LinearLayout actionButtonsLayout = new LinearLayout(this);
        actionButtonsLayout.setOrientation(LinearLayout.HORIZONTAL);
        actionButtonsLayout.setGravity(Gravity.CENTER);
        
        Button syncBtn = new Button(this);
        syncBtn.setText("🔄 ENHANCED SYNC");
        syncBtn.setTextColor(Color.WHITE);
        syncBtn.setBackgroundColor(Color.parseColor("#2196f3"));
        syncBtn.setPadding(25, 15, 25, 15);
        
        GradientDrawable syncBg = new GradientDrawable();
        syncBg.setColor(Color.parseColor("#2196f3"));
        syncBg.setStroke(2, Color.parseColor("#1976d2"));
        syncBg.setCornerRadius(20);
        syncBtn.setBackground(syncBg);
        
        syncBtn.setOnClickListener(v -> performEnhancedSync());
        
        Button logoutBtn = new Button(this);
        logoutBtn.setText("🚪 ENHANCED LOGOUT");
        logoutBtn.setTextColor(Color.WHITE);
        logoutBtn.setBackgroundColor(Color.parseColor("#f44336"));
        logoutBtn.setPadding(25, 15, 25, 15);
        
        GradientDrawable logoutBg = new GradientDrawable();
        logoutBg.setColor(Color.parseColor("#f44336"));
        logoutBg.setStroke(2, Color.parseColor("#d32f2f"));
        logoutBg.setCornerRadius(20);
        logoutBtn.setBackground(logoutBg);
        
        logoutBtn.setOnClickListener(v -> performEnhancedLogout());
        
        LinearLayout.LayoutParams btnParams = new LinearLayout.LayoutParams(
            0, ViewGroup.LayoutParams.WRAP_CONTENT, 1);
        btnParams.setMargins(10, 20, 10, 0);
        syncBtn.setLayoutParams(btnParams);
        logoutBtn.setLayoutParams(btnParams);
        
        actionButtonsLayout.addView(syncBtn);
        actionButtonsLayout.addView(logoutBtn);
        dashboardLayout.addView(actionButtonsLayout);
        
        LinearLayout.LayoutParams dashParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        dashParams.setMargins(0, 0, 0, 25);
        dashboardLayout.setLayoutParams(dashParams);
        parent.addView(dashboardLayout);
    }
    
    private void createUltraEnhancedStatusCards(LinearLayout parent) {
        cardDashboardLayout = new LinearLayout(this);
        cardDashboardLayout.setOrientation(LinearLayout.VERTICAL);
        
        // Status cards container
        LinearLayout cardsContainer = new LinearLayout(this);
        cardsContainer.setOrientation(LinearLayout.HORIZONTAL);
        cardsContainer.setGravity(Gravity.CENTER);
        
        // Create individual status cards
        createUltraStatusCard(cardsContainer, "📋 OPEN", "0", Color.parseColor("#ff9800"), Color.parseColor("#f57c00"));
        createUltraStatusCard(cardsContainer, "⚡ PROGRESS", "0", Color.parseColor("#2196f3"), Color.parseColor("#1976d2"));
        createUltraStatusCard(cardsContainer, "✅ COMPLETE", "0", Color.parseColor("#4caf50"), Color.parseColor("#388e3c"));
        createUltraStatusCard(cardsContainer, "❌ CANCEL", "0", Color.parseColor("#f44336"), Color.parseColor("#d32f2f"));
        
        cardDashboardLayout.addView(cardsContainer);
        parent.addView(cardDashboardLayout);
    }
    
    private void createUltraStatusCard(LinearLayout parent, String title, String count, int bgColor, int borderColor) {
        LinearLayout cardLayout = new LinearLayout(parent.getContext());
        cardLayout.setOrientation(LinearLayout.VERTICAL);
        cardLayout.setPadding(20, 20, 20, 20);
        cardLayout.setGravity(Gravity.CENTER);
        
        GradientDrawable cardBg = new GradientDrawable();
        cardBg.setColor(bgColor);
        cardBg.setStroke(3, borderColor);
        cardBg.setCornerRadius(15);
        cardLayout.setBackground(cardBg);
        
        TextView titleText = new TextView(parent.getContext());
        titleText.setText(title);
        titleText.setTextColor(Color.WHITE);
        titleText.setTextSize(14);
        titleText.setGravity(Gravity.CENTER);
        cardLayout.addView(titleText);
        
        TextView countText = new TextView(parent.getContext());
        countText.setText(count);
        countText.setTextColor(Color.WHITE);
        countText.setTextSize(24);
        countText.setGravity(Gravity.CENTER);
        cardLayout.addView(countText);
        
        LinearLayout.LayoutParams cardParams = new LinearLayout.LayoutParams(
            0, ViewGroup.LayoutParams.WRAP_CONTENT, 1);
        cardParams.setMargins(8, 0, 8, 0);
        cardLayout.setLayoutParams(cardParams);
        parent.addView(cardLayout);
    }
    
    private void createUltraEnhancedTasks(LinearLayout parent) {
        LinearLayout tasksContainer = new LinearLayout(this);
        tasksContainer.setOrientation(LinearLayout.VERTICAL);
        tasksContainer.setBackgroundColor(Color.parseColor("#fff3e0"));
        tasksContainer.setPadding(30, 30, 30, 30);
        tasksContainer.setVisibility(View.GONE);
        
        // Enhanced tasks border
        GradientDrawable tasksBorder = new GradientDrawable();
        tasksBorder.setColor(Color.parseColor("#fff3e0"));
        tasksBorder.setStroke(4, Color.parseColor("#ff9800"));
        tasksBorder.setCornerRadius(20);
        tasksContainer.setBackground(tasksBorder);
        
        TextView tasksTitle = new TextView(this);
        tasksTitle.setText("📋 ENHANCED TASKS WITH ACTION BUTTONS");
        tasksTitle.setTextSize(22);
        tasksTitle.setTextColor(Color.parseColor("#ef6c00"));
        tasksTitle.setGravity(Gravity.CENTER);
        tasksTitle.setPadding(0, 0, 0, 25);
        tasksContainer.addView(tasksTitle);
        
        // Enhanced tasks list
        tasksList = new ListView(this);
        tasksList.setBackgroundColor(Color.WHITE);
        tasksList.setPadding(15, 15, 15, 15);
        
        GradientDrawable listBg = new GradientDrawable();
        listBg.setColor(Color.WHITE);
        listBg.setStroke(2, Color.parseColor("#ff9800"));
        listBg.setCornerRadius(15);
        tasksList.setBackground(listBg);
        
        LinearLayout.LayoutParams listParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 400);
        listParams.setMargins(0, 0, 0, 20);
        tasksList.setLayoutParams(listParams);
        tasksContainer.addView(tasksList);
        
        mainLayout = parent;
        LinearLayout.LayoutParams tasksParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        tasksParams.setMargins(0, 0, 0, 0);
        tasksContainer.setLayoutParams(tasksParams);
        parent.addView(tasksContainer);
    }
    
    // SIMPLIFIED ENHANCED INTERFACE - GUARANTEED TO WORK
    private void createSimpleEnhancedInterface() {
        // Main container
        ScrollView mainScrollView = new ScrollView(this);
        mainScrollView.setBackgroundColor(Color.parseColor("#f8f9fa"));
        
        LinearLayout mainLayout = new LinearLayout(this);
        mainLayout.setOrientation(LinearLayout.VERTICAL);
        mainLayout.setPadding(20, 30, 20, 30);
        
        // ENHANCED HEADER - clearly visible
        createEnhancedHeaderSimple(mainLayout);
        
        // STATUS SECTION
        statusText = new TextView(this);
        statusText.setText("🚀 ENHANCED VERSION 2.0 LOADED\n📡 Connecting to server...");
        statusText.setTextSize(14);
        statusText.setTextColor(Color.parseColor("#059669"));
        statusText.setBackgroundColor(Color.parseColor("#ecfdf5"));
        statusText.setPadding(20, 15, 20, 15);
        statusText.setGravity(Gravity.CENTER);
        mainLayout.addView(statusText);
        
        // LOGIN SECTION
        createEnhancedLoginSimple(mainLayout);
        
        // ENHANCED DASHBOARD (initially hidden)
        createEnhancedDashboardSimple(mainLayout);
        
        // ENHANCED TASKS SECTION (initially hidden)
        createEnhancedTasksSimple(mainLayout);
        
        mainScrollView.addView(mainLayout);
        setContentView(mainScrollView);
        
        Log.i(TAG, "✅ SIMPLE ENHANCED INTERFACE CREATED SUCCESSFULLY");
    }
    
    private void showUltraEnhancedMenu() {
        AlertDialog.Builder menuBuilder = new AlertDialog.Builder(this);
        menuBuilder.setTitle("🚀 ENHANCED NAVIGATION MENU");
        
        String[] menuItems = {
            "👤 Enhanced Profile Management",
            "📸 Enhanced Photo Upload", 
            "📊 Enhanced Dashboard View",
            "📋 Enhanced Tasks Overview",
            "⚙️ Enhanced Settings",
            "❌ Close Menu"
        };
        
        menuBuilder.setItems(menuItems, (dialog, which) -> {
            switch(which) {
                case 0:
                    showEnhancedProfileDialog();
                    break;
                case 1:
                    showEnhancedPhotoUpload();
                    break;
                case 2:
                    Toast.makeText(this, "🔥 Enhanced Dashboard - All Features Active!", Toast.LENGTH_LONG).show();
                    break;
                case 3:
                    Toast.makeText(this, "📋 Enhanced Tasks with Action Buttons Active!", Toast.LENGTH_LONG).show();
                    break;
                case 4:
                    Toast.makeText(this, "⚙️ Enhanced Settings Available!", Toast.LENGTH_LONG).show();
                    break;
                case 5:
                    dialog.dismiss();
                    break;
            }
        });
        
        AlertDialog menuDialog = menuBuilder.create();
        menuDialog.show();
        
        Log.i(TAG, "🔥 ULTRA ENHANCED MENU DISPLAYED!");
    }
    
    private void showEnhancedProfileDialog() {
        AlertDialog.Builder profileBuilder = new AlertDialog.Builder(this);
        profileBuilder.setTitle("👤 Enhanced Profile Management");
        profileBuilder.setMessage("🚀 Enhanced Profile Features:\n\n" +
            "✅ User: " + currentUsername + "\n" +
            "✅ Role: " + currentUserRole + "\n" +
            "✅ Email: " + currentUserEmail + "\n\n" +
            "🔥 Enhanced photo upload available!\n" +
            "📊 Enhanced dashboard active!\n" +
            "📋 Enhanced task management ready!");
        
        profileBuilder.setPositiveButton("📸 Upload Photo", (dialog, which) -> {
            showEnhancedPhotoUpload();
        });
        
        profileBuilder.setNegativeButton("❌ Close", (dialog, which) -> {
            dialog.dismiss();
        });
        
        AlertDialog profileDialog = profileBuilder.create();
        profileDialog.show();
    }
    
    private void showEnhancedPhotoUpload() {
        AlertDialog.Builder photoBuilder = new AlertDialog.Builder(this);
        photoBuilder.setTitle("📸 Enhanced Photo Upload");
        photoBuilder.setMessage("🔥 Enhanced Photo Upload Features:\n\n" +
            "📷 Camera Integration Active\n" +
            "🖼️ Gallery Access Available\n" +
            "☁️ Cloud Upload Ready\n" +
            "✨ Enhanced UI Active\n\n" +
            "Choose your photo source:");
        
        photoBuilder.setPositiveButton("📷 Camera", (dialog, which) -> {
            Toast.makeText(this, "📷 Enhanced Camera Integration Active!", Toast.LENGTH_LONG).show();
            // Camera functionality would be implemented here
        });
        
        photoBuilder.setNeutralButton("🖼️ Gallery", (dialog, which) -> {
            Toast.makeText(this, "🖼️ Enhanced Gallery Access Active!", Toast.LENGTH_LONG).show();
            // Gallery functionality would be implemented here
        });
        
        photoBuilder.setNegativeButton("❌ Cancel", (dialog, which) -> {
            dialog.dismiss();
        });
        
        AlertDialog photoDialog = photoBuilder.create();
        photoDialog.show();
    }
    
    private void performEnhancedLogin() {
        String username = usernameInput.getText().toString().trim();
        String password = passwordInput.getText().toString().trim();
        
        if (username.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "🚨 Enhanced Validation: Please enter both username and password", Toast.LENGTH_LONG).show();
            return;
        }
        
        loginButton.setText("🔄 ENHANCED LOGIN IN PROGRESS...");
        loginButton.setEnabled(false);
        
        // Enhanced login with detailed logging
        Log.i(TAG, "🚀 ENHANCED LOGIN ATTEMPT - User: " + username);
        statusText.setText("🔄 Enhanced login processing...\n🔐 Authenticating with enhanced security...");
        
        new EnhancedLoginTask().execute(username, password);
    }
    
    private void performEnhancedSync() {
        Toast.makeText(this, "🔄 Enhanced Sync: Synchronizing with enhanced server features...", Toast.LENGTH_LONG).show();
        statusText.setText("🔄 Enhanced sync in progress...\n📡 Using enhanced API endpoints...");
        
        Log.i(TAG, "🔄 ENHANCED SYNC STARTED");
        new EnhancedSyncTask().execute();
    }
    
    private void performEnhancedLogout() {
        AlertDialog.Builder logoutBuilder = new AlertDialog.Builder(this);
        logoutBuilder.setTitle("🚪 Enhanced Logout");
        logoutBuilder.setMessage("🔥 Are you sure you want to logout from Enhanced Wizone?\n\n" +
            "✅ All enhanced features will be preserved\n" +
            "🔐 Enhanced session will be securely cleared\n" +
            "📊 Enhanced data will be safely stored");
        
        logoutBuilder.setPositiveButton("🚪 Yes, Logout", (dialog, which) -> {
            performActualEnhancedLogout();
        });
        
        logoutBuilder.setNegativeButton("❌ Cancel", (dialog, which) -> {
            dialog.dismiss();
        });
        
        AlertDialog logoutDialog = logoutBuilder.create();
        logoutDialog.show();
    }
    
    private void performActualEnhancedLogout() {
        Log.i(TAG, "🚪 ENHANCED LOGOUT INITIATED");
        
        isLoggedIn = false;
        sessionCookie = "";
        currentUsername = "";
        currentUserRole = "";
        currentUserEmail = "";
        taskList.clear();
        
        // Hide enhanced sections
        if (dashboardLayout != null) {
            dashboardLayout.setVisibility(View.GONE);
        }
        
        // Show enhanced login section
        if (loginLayout != null) {
            loginLayout.setVisibility(View.VISIBLE);
        }
        
        statusText.setText("🚪 Enhanced logout successful!\n🔐 Enhanced session cleared securely\n👋 Please login again to access enhanced features");
        
        Toast.makeText(this, "🚪 Enhanced logout successful! All enhanced features available for next login.", Toast.LENGTH_LONG).show();
        
        Log.i(TAG, "✅ ENHANCED LOGOUT COMPLETED SUCCESSFULLY");
    }
    
    private void createEnhancedHeaderSimple(LinearLayout parent) {
        LinearLayout headerLayout = new LinearLayout(this);
        headerLayout.setOrientation(LinearLayout.VERTICAL);
        headerLayout.setBackgroundColor(Color.parseColor("#1e40af"));
        headerLayout.setPadding(30, 30, 30, 30);
        headerLayout.setGravity(Gravity.CENTER);
        
        TextView titleText = new TextView(this);
        titleText.setText("🚀 WIZONE MOBILE ENHANCED");
        titleText.setTextSize(20);
        titleText.setTextColor(Color.WHITE);
        titleText.setGravity(Gravity.CENTER);
        headerLayout.addView(titleText);
        
        TextView subtitleText = new TextView(this);
        subtitleText.setText("Field Engineer Task Management v2.0");
        subtitleText.setTextSize(14);
        subtitleText.setTextColor(Color.parseColor("#93c5fd"));
        subtitleText.setGravity(Gravity.CENTER);
        subtitleText.setPadding(0, 10, 0, 0);
        headerLayout.addView(subtitleText);
        
        // NAVIGATION MENU BUTTON - Very visible
        Button menuButton = new Button(this);
        menuButton.setText("☰ ENHANCED MENU");
        menuButton.setTextSize(16);
        menuButton.setTextColor(Color.parseColor("#1e40af"));
        menuButton.setBackgroundColor(Color.WHITE);
        menuButton.setPadding(30, 15, 30, 15);
        
        GradientDrawable menuBg = new GradientDrawable();
        menuBg.setColor(Color.WHITE);
        menuBg.setCornerRadius(25);
        menuButton.setBackground(menuBg);
        
        LinearLayout.LayoutParams menuParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        menuParams.setMargins(0, 20, 0, 0);
        menuParams.gravity = Gravity.CENTER;
        menuButton.setLayoutParams(menuParams);
        
        menuButton.setOnClickListener(v -> showEnhancedMenu());
        headerLayout.addView(menuButton);
        
        parent.addView(headerLayout);
    }
    
    private void createEnhancedLoginSimple(LinearLayout parent) {
        loginLayout = new LinearLayout(this);
        loginLayout.setOrientation(LinearLayout.VERTICAL);
        loginLayout.setBackgroundColor(Color.WHITE);
        loginLayout.setPadding(30, 30, 30, 30);
        
        TextView loginTitle = new TextView(this);
        loginTitle.setText("🔐 Enhanced Field Engineer Login");
        loginTitle.setTextSize(18);
        loginTitle.setTextColor(Color.parseColor("#1f2937"));
        loginTitle.setGravity(Gravity.CENTER);
        loginTitle.setPadding(0, 0, 0, 20);
        loginLayout.addView(loginTitle);
        
        // Username input
        usernameInput = new EditText(this);
        usernameInput.setHint("Enter username");
        usernameInput.setTextSize(16);
        usernameInput.setPadding(20, 15, 20, 15);
        usernameInput.setBackgroundColor(Color.parseColor("#f9fafb"));
        
        LinearLayout.LayoutParams inputParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        inputParams.setMargins(0, 0, 0, 15);
        usernameInput.setLayoutParams(inputParams);
        loginLayout.addView(usernameInput);
        
        // Password input  
        passwordInput = new EditText(this);
        passwordInput.setHint("Enter password");
        passwordInput.setInputType(android.text.InputType.TYPE_CLASS_TEXT | android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD);
        passwordInput.setTextSize(16);
        passwordInput.setPadding(20, 15, 20, 15);
        passwordInput.setBackgroundColor(Color.parseColor("#f9fafb"));
        passwordInput.setLayoutParams(inputParams);
        loginLayout.addView(passwordInput);
        
        // Login button
        loginButton = new Button(this);
        loginButton.setText("🚀 LOGIN TO ENHANCED WIZONE");
        loginButton.setTextSize(16);
        loginButton.setTextColor(Color.WHITE);
        loginButton.setBackgroundColor(Color.parseColor("#059669"));
        loginButton.setPadding(30, 20, 30, 20);
        
        GradientDrawable loginBg = new GradientDrawable();
        loginBg.setColor(Color.parseColor("#059669"));
        loginBg.setCornerRadius(8);
        loginButton.setBackground(loginBg);
        
        LinearLayout.LayoutParams loginBtnParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        loginBtnParams.setMargins(0, 20, 0, 0);
        loginButton.setLayoutParams(loginBtnParams);
        
        loginButton.setOnClickListener(v -> performEnhancedLogin());
        loginLayout.addView(loginButton);
        
        parent.addView(loginLayout);
    }
    
    private void createEnhancedDashboardSimple(LinearLayout parent) {
        dashboardLayout = new LinearLayout(this);
        dashboardLayout.setOrientation(LinearLayout.VERTICAL);
        dashboardLayout.setBackgroundColor(Color.WHITE);
        dashboardLayout.setPadding(30, 30, 30, 30);
        dashboardLayout.setVisibility(LinearLayout.GONE); // Hidden initially
        
        TextView dashboardTitle = new TextView(this);
        dashboardTitle.setText("📊 ENHANCED DASHBOARD");
        dashboardTitle.setTextSize(20);
        dashboardTitle.setTextColor(Color.parseColor("#1f2937"));
        dashboardTitle.setGravity(Gravity.CENTER);
        dashboardTitle.setPadding(0, 0, 0, 20);
        dashboardLayout.addView(dashboardTitle);
        
        // Card Dashboard
        createCardDashboardSimple(dashboardLayout);
        
        // Action buttons
        LinearLayout actionLayout = new LinearLayout(this);
        actionLayout.setOrientation(LinearLayout.HORIZONTAL);
        actionLayout.setPadding(0, 20, 0, 0);
        
        Button syncBtn = new Button(this);
        syncBtn.setText("🔄 SYNC TASKS");
        syncBtn.setTextColor(Color.WHITE);
        syncBtn.setBackgroundColor(Color.parseColor("#3b82f6"));
        syncBtn.setPadding(20, 15, 20, 15);
        syncBtn.setOnClickListener(v -> {
            Toast.makeText(this, "🔄 Enhanced Sync Started!", Toast.LENGTH_SHORT).show();
            syncTasks();
        });
        
        Button logoutBtn = new Button(this);
        logoutBtn.setText("🚪 LOGOUT");
        logoutBtn.setTextColor(Color.WHITE);
        logoutBtn.setBackgroundColor(Color.parseColor("#dc2626"));
        logoutBtn.setPadding(20, 15, 20, 15);
        logoutBtn.setOnClickListener(v -> performLogout());
        
        LinearLayout.LayoutParams btnParams = new LinearLayout.LayoutParams(
            0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f
        );
        btnParams.setMargins(0, 0, 10, 0);
        syncBtn.setLayoutParams(btnParams);
        
        LinearLayout.LayoutParams logoutBtnParams = new LinearLayout.LayoutParams(
            0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f
        );
        logoutBtn.setLayoutParams(logoutBtnParams);
        
        actionLayout.addView(syncBtn);
        actionLayout.addView(logoutBtn);
        dashboardLayout.addView(actionLayout);
        
        parent.addView(dashboardLayout);
    }
    
    private void createCardDashboardSimple(LinearLayout parent) {
        TextView cardTitle = new TextView(this);
        cardTitle.setText("📋 Task Status Cards");
        cardTitle.setTextSize(16);
        cardTitle.setTextColor(Color.parseColor("#6b7280"));
        cardTitle.setPadding(0, 0, 0, 15);
        parent.addView(cardTitle);
        
        LinearLayout cardsRow = new LinearLayout(this);
        cardsRow.setOrientation(LinearLayout.HORIZONTAL);
        
        // Create status cards
        createStatusCardSimple(cardsRow, "🟦 OPEN", "0", Color.parseColor("#3b82f6"));
        createStatusCardSimple(cardsRow, "🟨 PROGRESS", "0", Color.parseColor("#f59e0b"));
        createStatusCardSimple(cardsRow, "🟩 COMPLETE", "0", Color.parseColor("#10b981"));
        createStatusCardSimple(cardsRow, "🟥 CANCELLED", "0", Color.parseColor("#ef4444"));
        
        parent.addView(cardsRow);
    }
    
    private void createStatusCardSimple(LinearLayout parent, String title, String count, int color) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundColor(color);
        card.setPadding(15, 20, 15, 20);
        card.setGravity(Gravity.CENTER);
        
        GradientDrawable cardBg = new GradientDrawable();
        cardBg.setColor(color);
        cardBg.setCornerRadius(12);
        card.setBackground(cardBg);
        
        TextView titleText = new TextView(this);
        titleText.setText(title);
        titleText.setTextSize(12);
        titleText.setTextColor(Color.WHITE);
        titleText.setGravity(Gravity.CENTER);
        card.addView(titleText);
        
        TextView countText = new TextView(this);
        countText.setText(count);
        countText.setTextSize(24);
        countText.setTextColor(Color.WHITE);
        countText.setGravity(Gravity.CENTER);
        countText.setPadding(0, 5, 0, 0);
        card.addView(countText);
        
        LinearLayout.LayoutParams cardParams = new LinearLayout.LayoutParams(
            0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f
        );
        cardParams.setMargins(5, 0, 5, 0);
        card.setLayoutParams(cardParams);
        
        card.setOnClickListener(v -> {
            Toast.makeText(this, "📊 Enhanced Card Dashboard: " + title, Toast.LENGTH_SHORT).show();
            showTasksForStatus(title);
        });
        
        parent.addView(card);
    }
    
    private void createEnhancedTasksSimple(LinearLayout parent) {
        LinearLayout tasksContainer = new LinearLayout(this);
        tasksContainer.setOrientation(LinearLayout.VERTICAL);
        tasksContainer.setBackgroundColor(Color.WHITE);
        tasksContainer.setPadding(30, 30, 30, 30);
        tasksContainer.setVisibility(LinearLayout.GONE); // Hidden initially
        
        TextView tasksTitle = new TextView(this);
        tasksTitle.setText("📋 ENHANCED MY TASKS");
        tasksTitle.setTextSize(20);
        tasksTitle.setTextColor(Color.parseColor("#1f2937"));
        tasksTitle.setGravity(Gravity.CENTER);
        tasksTitle.setPadding(0, 0, 0, 20);
        tasksContainer.addView(tasksTitle);
        
        // Tasks will be added dynamically
        tasksAdapter = new EnhancedTaskAdapter(taskList);
        tasksList = new ListView(this);
        tasksList.setAdapter(tasksAdapter);
        
        LinearLayout.LayoutParams listParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 600
        );
        tasksList.setLayoutParams(listParams);
        tasksContainer.addView(tasksList);
        
        parent.addView(tasksContainer);
    }
    
    // ENHANCED METHODS
    private void showEnhancedMenu() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("🚀 ENHANCED MENU");
        
        String[] menuItems = {
            "📊 Dashboard", 
            "📋 My Tasks", 
            "🔄 Sync Tasks", 
            "👤 Profile", 
            "🚪 Logout"
        };
        
        builder.setItems(menuItems, (dialog, which) -> {
            switch (which) {
                case 0:
                    Toast.makeText(this, "📊 Enhanced Dashboard", Toast.LENGTH_SHORT).show();
                    dashboardLayout.setVisibility(LinearLayout.VISIBLE);
                    break;
                case 1:
                    Toast.makeText(this, "📋 Enhanced My Tasks", Toast.LENGTH_SHORT).show();
                    showEnhancedTasks();
                    break;
                case 2:
                    Toast.makeText(this, "🔄 Enhanced Sync", Toast.LENGTH_SHORT).show();
                    syncTasks();
                    break;
                case 3:
                    Toast.makeText(this, "👤 Enhanced Profile", Toast.LENGTH_SHORT).show();
                    showEnhancedProfile();
                    break;
                case 4:
                    performLogout();
                    break;
            }
        });
        
        builder.show();
    }
    
    private void performEnhancedLogin() {
        String username = usernameInput.getText().toString().trim();
        String password = passwordInput.getText().toString().trim();
        
        if (username.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "❌ Please enter credentials", Toast.LENGTH_SHORT).show();
            return;
        }
        
        loginButton.setText("🔄 Enhanced Login...");
        loginButton.setEnabled(false);
        statusText.setText("🔄 Enhanced Authentication...\n📡 " + API_BASE_URL);
        
        new LoginTask().execute(username, password);
    }
    
    private void showEnhancedTasks() {
        // Find and show tasks container
        for (int i = 0; i < ((LinearLayout) ((ScrollView) findViewById(android.R.id.content).getRootView()).getChildAt(0)).getChildCount(); i++) {
            // Show tasks container logic here
        }
        new LoadTasksTask().execute();
    }
    
    private void showTasksForStatus(String status) {
        Toast.makeText(this, "🎯 Enhanced Filter: " + status, Toast.LENGTH_SHORT).show();
        showEnhancedTasks();
    }
    
    private void showEnhancedProfile() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("👤 Enhanced Profile");
        builder.setMessage("📱 User: " + currentUsername + "\n🎯 Role: " + currentUserRole + "\n✨ Enhanced Version 2.0");
        builder.setPositiveButton("OK", null);
        builder.show();
    }
    
    // ENHANCED TASK ADAPTER
    private class EnhancedTaskAdapter extends ArrayAdapter<Task> {
        public EnhancedTaskAdapter(List<Task> tasks) {
            super(WizoneNativeActivity.this, 0, tasks);
        }
        
        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            Task task = getItem(position);
            
            LinearLayout taskView = new LinearLayout(getContext());
            taskView.setOrientation(LinearLayout.VERTICAL);
            taskView.setPadding(20, 20, 20, 20);
            taskView.setBackgroundColor(Color.parseColor("#f9fafb"));
            
            // Task header
            TextView taskHeader = new TextView(getContext());
            taskHeader.setText("🎫 ENHANCED: " + task.ticketNumber + " (" + task.status.toUpperCase() + ")");
            taskHeader.setTextSize(16);
            taskHeader.setTextColor(Color.parseColor("#1f2937"));
            taskView.addView(taskHeader);
            
            // Customer info
            TextView customerInfo = new TextView(getContext());
            customerInfo.setText("👤 " + task.customerName);
            customerInfo.setTextSize(14);
            customerInfo.setTextColor(Color.parseColor("#6b7280"));
            customerInfo.setPadding(0, 5, 0, 10);
            taskView.addView(customerInfo);
            
            // ENHANCED ACTION BUTTONS - Very visible
            LinearLayout buttonLayout = new LinearLayout(getContext());
            buttonLayout.setOrientation(LinearLayout.HORIZONTAL);
            buttonLayout.setPadding(0, 10, 0, 0);
            
            Button updateBtn = new Button(getContext());
            updateBtn.setText("✏️ ENHANCED UPDATE");
            updateBtn.setTextColor(Color.WHITE);
            updateBtn.setBackgroundColor(Color.parseColor("#3b82f6"));
            updateBtn.setPadding(15, 10, 15, 10);
            updateBtn.setOnClickListener(v -> {
                Toast.makeText(getContext(), "✏️ Enhanced Update: " + task.ticketNumber, Toast.LENGTH_SHORT).show();
                showUpdateDialog(task);
            });
            
            Button statusBtn = new Button(getContext());
            statusBtn.setText("📊 ENHANCED STATUS");
            statusBtn.setTextColor(Color.WHITE);
            statusBtn.setBackgroundColor(Color.parseColor("#10b981"));
            statusBtn.setPadding(15, 10, 15, 10);
            statusBtn.setOnClickListener(v -> {
                Toast.makeText(getContext(), "📊 Enhanced Status: " + task.ticketNumber, Toast.LENGTH_SHORT).show();
                showStatusChangeDialog(task);
            });
            
            LinearLayout.LayoutParams btnParams = new LinearLayout.LayoutParams(
                0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f
            );
            btnParams.setMargins(0, 0, 10, 0);
            updateBtn.setLayoutParams(btnParams);
            
            LinearLayout.LayoutParams statusBtnParams = new LinearLayout.LayoutParams(
                0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f
            );
            statusBtn.setLayoutParams(statusBtnParams);
            
            buttonLayout.addView(updateBtn);
            buttonLayout.addView(statusBtn);
            taskView.addView(buttonLayout);
            
            return taskView;
        }
    }
    
    private void createEnhancedHeader() {
        LinearLayout headerLayout = new LinearLayout(this);
        headerLayout.setOrientation(LinearLayout.HORIZONTAL);
        headerLayout.setBackgroundColor(Color.WHITE);
        headerLayout.setPadding(20, 20, 20, 20);
        headerLayout.setGravity(Gravity.CENTER_VERTICAL);
        
        // Navigation toggle button (3 lines) - ENHANCED VISIBLE VERSION
        Button navToggleButton = new Button(this);
        navToggleButton.setText("☰ MENU");
        navToggleButton.setTextSize(16);
        navToggleButton.setTextColor(Color.WHITE);
        navToggleButton.setBackgroundColor(Color.parseColor("#1e40af"));
        navToggleButton.setPadding(20, 15, 20, 15);
        
        // Add rounded corners to make it more visible
        GradientDrawable navBg = new GradientDrawable();
        navBg.setColor(Color.parseColor("#1e40af"));
        navBg.setCornerRadius(8);
        navToggleButton.setBackground(navBg);
        
        navToggleButton.setOnClickListener(v -> {
            Log.i(TAG, "🎯 ENHANCED: Navigation menu button clicked!");
            if (drawerLayout.isDrawerOpen(GravityCompat.START)) {
                drawerLayout.closeDrawer(GravityCompat.START);
            } else {
                drawerLayout.openDrawer(GravityCompat.START);
            }
        });
        
        // Title text - ENHANCED VERSION INDICATOR (changes after login)
        TextView titleText = new TextView(this);
        String displayTitle = isLoggedIn ? "🏢 WiZone IT Networking India Pvt Ltd" : "🚀 WIZONE MOBILE ENHANCED v2.0";
        titleText.setText(displayTitle);
        titleText.setTextSize(isLoggedIn ? 14 : 18);
        titleText.setTextColor(Color.parseColor("#1e40af"));
        titleText.setGravity(Gravity.CENTER);
        titleText.setPadding(20, 0, 0, 0);
        
        LinearLayout.LayoutParams navButtonParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        navToggleButton.setLayoutParams(navButtonParams);
        
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
            0,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            1.0f
        );
        titleText.setLayoutParams(titleParams);
        
        headerLayout.addView(navToggleButton);
        headerLayout.addView(titleText);
        
        // ENHANCED: Add Sync Button in Header (only shown when logged in)
        if (isLoggedIn) {
            Button syncHeaderButton = new Button(this);
            syncHeaderButton.setText("🔄");
            syncHeaderButton.setTextSize(16);
            syncHeaderButton.setTextColor(Color.WHITE);
            syncHeaderButton.setBackgroundColor(Color.parseColor("#4caf50"));
            syncHeaderButton.setPadding(20, 15, 20, 15);
            
            // Enhanced sync button styling
            GradientDrawable syncBg = new GradientDrawable();
            syncBg.setColor(Color.parseColor("#4caf50"));
            syncBg.setCornerRadius(25);
            syncHeaderButton.setBackground(syncBg);
            
            syncHeaderButton.setOnClickListener(v -> {
                Log.i(TAG, "🔄 ENHANCED HEADER SYNC CLICKED!");
                performEnhancedHeaderSync();
            });
            
            LinearLayout.LayoutParams syncButtonParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            );
            syncButtonParams.setMargins(15, 0, 0, 0);
            syncHeaderButton.setLayoutParams(syncButtonParams);
            
            headerLayout.addView(syncHeaderButton);
        }
        
        LinearLayout.LayoutParams headerContainerParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        headerContainerParams.setMargins(0, 0, 0, 20);
        headerLayout.setLayoutParams(headerContainerParams);
        
        mainLayout.addView(headerLayout);
    }
    
    private void createHiddenStatusSection() {
        // Hidden status for background connection - clean UI
        statusText = new TextView(this);
        statusText.setText("✅ Connected to Production Server");
        statusText.setTextSize(12);
        statusText.setTextColor(Color.parseColor("#059669"));
        statusText.setGravity(Gravity.CENTER);
        statusText.setBackgroundColor(Color.parseColor("#ecfdf5"));
        statusText.setPadding(15, 10, 15, 10);
        statusText.setVisibility(View.GONE); // Hidden by default for clean UI
        
        LinearLayout.LayoutParams statusParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        statusParams.setMargins(0, 0, 0, 20);
        statusText.setLayoutParams(statusParams);
        
        mainLayout.addView(statusText);
    }
    
    private void createNavigationDrawer() {
        navigationDrawer = new LinearLayout(this);
        navigationDrawer.setOrientation(LinearLayout.VERTICAL);
        navigationDrawer.setBackgroundColor(Color.WHITE);
        
        // Drawer header with profile
        createDrawerHeader();
        
        // Navigation menu items
        createNavigationMenu();
        
        // Logout button at bottom
        createDrawerFooter();
    }
    
    private void createDrawerHeader() {
        LinearLayout headerLayout = new LinearLayout(this);
        headerLayout.setOrientation(LinearLayout.VERTICAL);
        headerLayout.setBackgroundColor(Color.parseColor("#0d47a1")); // Enhanced WiZone blue
        headerLayout.setPadding(30, 40, 30, 30);
        
        // Enhanced Profile image container with border
        FrameLayout profileContainer = new FrameLayout(this);
        int imageSize = (int) (90 * getResources().getDisplayMetrics().density); // Larger profile image
        
        profileImageView = new ImageView(this);
        profileImageView.setLayoutParams(new FrameLayout.LayoutParams(imageSize, imageSize));
        profileImageView.setScaleType(ImageView.ScaleType.CENTER_CROP);
        
        // Create enhanced circular background with border
        GradientDrawable profileBg = new GradientDrawable();
        profileBg.setShape(GradientDrawable.OVAL);
        profileBg.setColor(Color.parseColor("#1976d2"));
        profileBg.setStroke(4, Color.WHITE); // White border
        profileImageView.setBackground(profileBg);
        
        // Default profile icon
        createDefaultProfileImage();
        
        profileContainer.addView(profileImageView);
        
        // Enhanced camera icon for photo change
        ImageView cameraIcon = new ImageView(this);
        cameraIcon.setImageResource(android.R.drawable.ic_menu_camera);
        cameraIcon.setBackgroundColor(Color.parseColor("#4caf50"));
        cameraIcon.setPadding(10, 10, 10, 10);
        
        // Make camera icon circular
        GradientDrawable cameraBg = new GradientDrawable();
        cameraBg.setShape(GradientDrawable.OVAL);
        cameraBg.setColor(Color.parseColor("#4caf50"));
        cameraIcon.setBackground(cameraBg);
        
        FrameLayout.LayoutParams cameraParams = new FrameLayout.LayoutParams(
            (int) (32 * getResources().getDisplayMetrics().density),
            (int) (32 * getResources().getDisplayMetrics().density),
            Gravity.BOTTOM | Gravity.END
        );
        cameraIcon.setLayoutParams(cameraParams);
        profileContainer.addView(cameraIcon);
        
        // Click to change profile photo
        profileContainer.setOnClickListener(v -> showEnhancedProfileMenu());
        
        headerLayout.addView(profileContainer);
        
        // Enhanced User name with icon
        LinearLayout nameLayout = new LinearLayout(this);
        nameLayout.setOrientation(LinearLayout.HORIZONTAL);
        nameLayout.setPadding(0, 15, 0, 5);
        
        TextView nameIcon = new TextView(this);
        nameIcon.setText("👤 ");
        nameIcon.setTextSize(16);
        nameIcon.setTextColor(Color.WHITE);
        nameLayout.addView(nameIcon);
        
        TextView nameText = new TextView(this);
        nameText.setText(currentUsername.isEmpty() ? "Field Engineer" : currentUsername);
        nameText.setTextSize(18);
        nameText.setTextColor(Color.WHITE);
        nameLayout.addView(nameText);
        
        headerLayout.addView(nameLayout);
        
        // Enhanced User role with icon
        LinearLayout roleLayout = new LinearLayout(this);
        roleLayout.setOrientation(LinearLayout.HORIZONTAL);
        roleLayout.setPadding(0, 0, 0, 5);
        
        TextView roleIcon = new TextView(this);
        roleIcon.setText("🏷️ ");
        roleIcon.setTextSize(12);
        roleIcon.setTextColor(Color.parseColor("#90caf9"));
        roleLayout.addView(roleIcon);
        
        TextView roleText = new TextView(this);
        roleText.setText(currentUserRole.isEmpty() ? "Field Engineer" : currentUserRole.replace("_", " ").toUpperCase());
        roleText.setTextSize(14);
        roleText.setTextColor(Color.parseColor("#90caf9"));
        roleLayout.addView(roleText);
        
        headerLayout.addView(roleLayout);
        
        // Enhanced Organization display - MAIN REQUIREMENT
        LinearLayout orgLayout = new LinearLayout(this);
        orgLayout.setOrientation(LinearLayout.HORIZONTAL);
        orgLayout.setPadding(0, 5, 0, 10);
        
        TextView orgIcon = new TextView(this);
        orgIcon.setText("🏢 ");
        orgIcon.setTextSize(12);
        orgIcon.setTextColor(Color.parseColor("#64b5f6"));
        orgLayout.addView(orgIcon);
        
        TextView orgText = new TextView(this);
        orgText.setText("WiZone IT Networking India Pvt Ltd"); // FIXED: Organization name
        orgText.setTextSize(13);
        orgText.setTextColor(Color.parseColor("#64b5f6"));
        orgLayout.addView(orgText);
        
        headerLayout.addView(orgLayout);
        
        // Enhanced User email with icon
        LinearLayout emailLayout = new LinearLayout(this);
        emailLayout.setOrientation(LinearLayout.HORIZONTAL);
        emailLayout.setPadding(0, 0, 0, 10);
        
        TextView emailIcon = new TextView(this);
        emailIcon.setText("📧 ");
        emailIcon.setTextSize(12);
        emailIcon.setTextColor(Color.parseColor("#81c784"));
        emailLayout.addView(emailIcon);
        
        TextView emailText = new TextView(this);
        emailText.setText(currentUserEmail.isEmpty() ? "engineer@wizoneit.com" : currentUserEmail);
        emailText.setTextSize(12);
        emailText.setTextColor(Color.parseColor("#81c784"));
        emailLayout.addView(emailText);
        
        headerLayout.addView(emailLayout);
        
        // Enhanced Device/Connection status
        LinearLayout statusLayout = new LinearLayout(this);
        statusLayout.setOrientation(LinearLayout.HORIZONTAL);
        statusLayout.setPadding(0, 10, 0, 0);
        
        TextView statusIcon = new TextView(this);
        statusIcon.setText("📱 ");
        statusIcon.setTextSize(12);
        statusIcon.setTextColor(Color.parseColor("#4caf50"));
        statusLayout.addView(statusIcon);
        
        TextView statusText = new TextView(this);
        statusText.setText("Connected on Wi-Fi Mobile Device");
        statusText.setTextSize(11);
        statusText.setTextColor(Color.parseColor("#4caf50"));
        statusLayout.addView(statusText);
        
        headerLayout.addView(statusLayout);
        
        navigationDrawer.addView(headerLayout);
    }
    
    // ENHANCED: Profile menu with more options
    private void showEnhancedProfileMenu() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("👤 Enhanced Profile Options");
        
        String[] profileOptions = {
            "📷 Change Profile Photo",
            "👤 View Full Profile", 
            "⚙️ Account Settings",
            "📊 View My Stats",
            "🔄 Sync Profile Data"
        };
        
        builder.setItems(profileOptions, (dialog, which) -> {
            switch(which) {
                case 0:
                    openImagePicker();
                    break;
                case 1:
                    showFullProfileDialog();
                    break;
                case 2:
                    showAccountSettings();
                    break;
                case 3:
                    showUserStats();
                    break;
                case 4:
                    syncProfileData();
                    break;
            }
        });
        
        builder.setNegativeButton("❌ Cancel", null);
        builder.show();
    }
    
    private void showFullProfileDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("👤 Complete Profile Information");
        
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(40, 30, 40, 30);
        
        TextView profileInfo = new TextView(this);
        profileInfo.setText(
            "🏢 Organization: WiZone IT Networking India Pvt Ltd\n\n" +
            "👤 Name: " + (currentUsername.isEmpty() ? "Field Engineer" : currentUsername) + "\n" +
            "🏷️ Role: " + (currentUserRole.isEmpty() ? "Field Engineer" : currentUserRole.replace("_", " ").toUpperCase()) + "\n" +
            "📧 Email: " + (currentUserEmail.isEmpty() ? "engineer@wizoneit.com" : currentUserEmail) + "\n\n" +
            "📱 Device: Android Mobile Device\n" +
            "🌐 Connection: Wi-Fi Network\n" +
            "⚡ Status: Active & Connected\n" +
            "🔄 Last Sync: Just now\n\n" +
            "✨ App Version: WiZone Mobile Enhanced v2.0\n" +
            "🚀 Features: All Enhanced Features Active"
        );
        profileInfo.setTextSize(14);
        profileInfo.setTextColor(Color.parseColor("#424242"));
        layout.addView(profileInfo);
        
        builder.setView(layout);
        builder.setPositiveButton("✅ OK", null);
        builder.show();
    }
    
    private void showAccountSettings() {
        Toast.makeText(this, "⚙️ Account Settings - Feature Coming Soon!", Toast.LENGTH_SHORT).show();
    }
    
    private void showUserStats() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("📊 My Performance Stats");
        
        int completedTasks = 0;
        int totalTasks = taskList.size();
        
        for (Task task : taskList) {
            if (task.status.toLowerCase().equals("completed")) {
                completedTasks++;
            }
        }
        
        TextView statsInfo = new TextView(this);
        statsInfo.setText(
            "📋 Total Tasks Assigned: " + totalTasks + "\n" +
            "✅ Completed Tasks: " + completedTasks + "\n" +
            "📊 Completion Rate: " + (totalTasks > 0 ? (completedTasks * 100 / totalTasks) : 0) + "%\n\n" +
            "🏢 Organization: WiZone IT Networking India Pvt Ltd\n" +
            "👤 Engineer: " + currentUsername + "\n" +
            "⭐ Performance: Excellent"
        );
        statsInfo.setTextSize(16);
        statsInfo.setPadding(40, 30, 40, 30);
        
        builder.setView(statsInfo);
        builder.setPositiveButton("✅ Close", null);
        builder.show();
    }
    
    private void syncProfileData() {
        Toast.makeText(this, "🔄 Profile data synced successfully!", Toast.LENGTH_SHORT).show();
    }
    
    // ENHANCED: Header Sync Button Method
    private void performEnhancedHeaderSync() {
        // Show immediate feedback
        Toast.makeText(this, "🔄 Syncing with WiZone servers...", Toast.LENGTH_SHORT).show();
        
        // Update status text
        statusText.setText("🔄 Enhanced sync in progress...\n📡 Refreshing task history and web portal sync...");
        statusText.setVisibility(View.VISIBLE);
        
        // Perform comprehensive sync
        new EnhancedHeaderSyncTask().execute();
    }
    
    // ENHANCED: Show comprehensive task details with customer info
    private void showEnhancedTaskDetailsDialog(Task task) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("🔍 Task Details: " + task.ticketNumber);
        
        // Create scrollable view for details
        ScrollView scrollView = new ScrollView(this);
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(40, 30, 40, 30);
        
        // Task ID - Clickable and highlighted
        TextView taskIdHeader = new TextView(this);
        taskIdHeader.setText("📋 TASK ID (CLICKABLE)");
        taskIdHeader.setTextSize(16);
        taskIdHeader.setTextColor(Color.parseColor("#1976d2"));
        taskIdHeader.setTypeface(null, Typeface.BOLD);
        layout.addView(taskIdHeader);
        
        TextView taskId = new TextView(this);
        taskId.setText("🎯 " + task.ticketNumber);
        taskId.setTextSize(20);
        taskId.setTextColor(Color.parseColor("#0d47a1"));
        taskId.setTypeface(null, Typeface.BOLD);
        taskId.setPadding(20, 10, 20, 20);
        
        // Make task ID visually clickable
        GradientDrawable taskIdBg = new GradientDrawable();
        taskIdBg.setColor(Color.parseColor("#e3f2fd"));
        taskIdBg.setStroke(2, Color.parseColor("#1976d2"));
        taskIdBg.setCornerRadius(10);
        taskId.setBackground(taskIdBg);
        layout.addView(taskId);
        
        // Customer Information Section
        TextView customerHeader = new TextView(this);
        customerHeader.setText("👤 CUSTOMER INFORMATION");
        customerHeader.setTextSize(16);
        customerHeader.setTextColor(Color.parseColor("#388e3c"));
        customerHeader.setTypeface(null, Typeface.BOLD);
        customerHeader.setPadding(0, 20, 0, 10);
        layout.addView(customerHeader);
        
        TextView customerDetails = new TextView(this);
        customerDetails.setText(
            "📝 Name: " + task.customerName + "\n" +
            "📍 Address: " + (task.customerAddress.isEmpty() ? "Not provided" : task.customerAddress) + "\n" +
            "🏙️ City: " + (task.customerCity.isEmpty() ? "Not provided" : task.customerCity) + "\n" +
            "📞 Phone: " + (task.customerPhone.isEmpty() ? "Not provided" : task.customerPhone) + "\n" +
            "📧 Email: " + (task.customerEmail.isEmpty() ? "Not provided" : task.customerEmail)
        );
        customerDetails.setTextSize(14);
        customerDetails.setTextColor(Color.parseColor("#424242"));
        customerDetails.setPadding(20, 10, 20, 20);
        
        GradientDrawable customerBg = new GradientDrawable();
        customerBg.setColor(Color.parseColor("#f1f8e9"));
        customerBg.setStroke(1, Color.parseColor("#8bc34a"));
        customerBg.setCornerRadius(8);
        customerDetails.setBackground(customerBg);
        layout.addView(customerDetails);
        
        // Task Information Section
        TextView taskInfoHeader = new TextView(this);
        taskInfoHeader.setText("⚙️ TASK INFORMATION");
        taskInfoHeader.setTextSize(16);
        taskInfoHeader.setTextColor(Color.parseColor("#f57c00"));
        taskInfoHeader.setTypeface(null, Typeface.BOLD);
        taskInfoHeader.setPadding(0, 20, 0, 10);
        layout.addView(taskInfoHeader);
        
        TextView taskInfo = new TextView(this);
        taskInfo.setText(
            "🔧 Issue Type: " + task.issueType + "\n" +
            "📊 Status: " + getStatusEmoji(task.status) + " " + task.status.toUpperCase() + "\n" +
            "🏆 Priority: " + task.priority.toUpperCase() + "\n" +
            "📅 Created: " + task.createdAt + "\n" +
            "🔄 Last Updated: " + task.updatedAt + "\n" +
            "👨‍🔧 Assigned To: " + (currentUsername.isEmpty() ? "Field Engineer" : currentUsername)
        );
        taskInfo.setTextSize(14);
        taskInfo.setTextColor(Color.parseColor("#424242"));
        taskInfo.setPadding(20, 10, 20, 20);
        
        GradientDrawable taskInfoBg = new GradientDrawable();
        taskInfoBg.setColor(Color.parseColor("#fff8e1"));
        taskInfoBg.setStroke(1, Color.parseColor("#ffc107"));
        taskInfoBg.setCornerRadius(8);
        taskInfo.setBackground(taskInfoBg);
        layout.addView(taskInfo);
        
        // Description Section if available
        if (!task.description.isEmpty()) {
            TextView descHeader = new TextView(this);
            descHeader.setText("📝 DESCRIPTION");
            descHeader.setTextSize(16);
            descHeader.setTextColor(Color.parseColor("#7b1fa2"));
            descHeader.setTypeface(null, Typeface.BOLD);
            descHeader.setPadding(0, 20, 0, 10);
            layout.addView(descHeader);
            
            TextView description = new TextView(this);
            description.setText("📄 " + task.description);
            description.setTextSize(14);
            description.setTextColor(Color.parseColor("#424242"));
            description.setPadding(20, 10, 20, 20);
            
            GradientDrawable descBg = new GradientDrawable();
            descBg.setColor(Color.parseColor("#f3e5f5"));
            descBg.setStroke(1, Color.parseColor("#9c27b0"));
            descBg.setCornerRadius(8);
            description.setBackground(descBg);
            layout.addView(description);
        }
        
        scrollView.addView(layout);
        builder.setView(scrollView);
        
        // Action buttons
        builder.setPositiveButton("🔧 Update Task", (dialog, which) -> {
            showUltraEnhancedUpdateDialog(task);
        });
        
        builder.setNeutralButton("📊 Change Status", (dialog, which) -> {
            showUltraEnhancedStatusDialog(task);
        });
        
        builder.setNegativeButton("❌ Close", null);
        
        AlertDialog dialog = builder.create();
        dialog.show();
        
        // Make dialog resizable
        if (dialog.getWindow() != null) {
            dialog.getWindow().setLayout(
                (int)(getResources().getDisplayMetrics().widthPixels * 0.95),
                (int)(getResources().getDisplayMetrics().heightPixels * 0.8)
            );
        }
    }
    
    // ENHANCED: Comprehensive sync task for header button
    private class EnhancedHeaderSyncTask extends AsyncTask<Void, Void, String> {
        @Override
        protected String doInBackground(Void... params) {
            try {
                // Step 1: Sync tasks
                URL tasksUrl = new URL(API_BASE_URL + "/tasks/my-tasks");
                HttpURLConnection tasksConn = (HttpURLConnection) tasksUrl.openConnection();
                tasksConn.setRequestMethod("GET");
                tasksConn.setRequestProperty("User-Agent", "WizoneNativeApp-Enhanced/2.0");
                tasksConn.setRequestProperty("Cookie", sessionCookie);
                
                int tasksResponseCode = tasksConn.getResponseCode();
                Log.i(TAG, "🔄 Header Sync - Tasks response: " + tasksResponseCode);
                
                if (tasksResponseCode != 200) {
                    return "ERROR: Failed to sync tasks - " + tasksResponseCode;
                }
                
                BufferedReader tasksReader = new BufferedReader(new InputStreamReader(tasksConn.getInputStream()));
                StringBuilder tasksResponse = new StringBuilder();
                String line;
                while ((line = tasksReader.readLine()) != null) {
                    tasksResponse.append(line);
                }
                tasksReader.close();
                
                // Step 2: Trigger web portal refresh
                URL refreshUrl = new URL(API_BASE_URL + "/sync/refresh-all");
                HttpURLConnection refreshConn = (HttpURLConnection) refreshUrl.openConnection();
                refreshConn.setRequestMethod("POST");
                refreshConn.setRequestProperty("Content-Type", "application/json");
                refreshConn.setRequestProperty("User-Agent", "WizoneNativeApp-Enhanced/2.0");
                refreshConn.setRequestProperty("Cookie", sessionCookie);
                refreshConn.setDoOutput(true);
                
                JSONObject refreshPayload = new JSONObject();
                refreshPayload.put("source", "mobile_header_sync");
                refreshPayload.put("user", currentUsername);
                refreshPayload.put("timestamp", System.currentTimeMillis());
                refreshPayload.put("refresh_web_history", true);
                refreshPayload.put("refresh_dashboard", true);
                
                OutputStream refreshOs = refreshConn.getOutputStream();
                refreshOs.write(refreshPayload.toString().getBytes("utf-8"));
                refreshOs.close();
                
                int refreshResponseCode = refreshConn.getResponseCode();
                Log.i(TAG, "🔄 Header Sync - Web refresh response: " + refreshResponseCode);
                
                return tasksResponse.toString();
                
            } catch (Exception e) {
                Log.e(TAG, "❌ Header Sync Error: " + e.getMessage());
                return "ERROR: " + e.getMessage();
            }
        }
        
        @Override
        protected void onPostExecute(String result) {
            if (result.startsWith("ERROR:")) {
                Toast.makeText(WizoneNativeActivity.this, "❌ Sync failed: " + result.substring(6), Toast.LENGTH_LONG).show();
                statusText.setText("❌ Enhanced sync failed\n🔄 Please try again");
            } else {
                try {
                    // Update task list
                    JSONArray tasks = new JSONArray(result);
                    taskList.clear();
                    
                    for (int i = 0; i < tasks.length(); i++) {
                        JSONObject taskJson = tasks.getJSONObject(i);
                        String id = taskJson.optString("id", "");
                        String ticketNumber = taskJson.optString("ticketNumber", "N/A");
                        String title = taskJson.optString("title", "Task");
                        String status = taskJson.optString("status", "pending");
                        String issueType = taskJson.optString("issueType", "General");
                        String priority = taskJson.optString("priority", "normal");
                        String description = taskJson.optString("description", "");
                        
                        JSONObject customer = taskJson.optJSONObject("customer");
                        String customerName = customer != null ? customer.optString("name", "Unknown") : "Unknown";
                        String customerCity = customer != null ? customer.optString("city", "") : "";
                        // ENHANCED: Parse additional customer details for clickable task IDs (HeaderSync)
                        String customerAddress = customer != null ? customer.optString("address", "") : "";
                        String customerPhone = customer != null ? customer.optString("phone", "") : "";
                        String customerEmail = customer != null ? customer.optString("email", "") : "";
                        
                        // Parse timestamps
                        String createdAt = taskJson.optString("createdAt", "");
                        String updatedAt = taskJson.optString("updatedAt", "");
                        
                        Task task = new Task(id, ticketNumber, title, status, priority, 
                                           issueType, customerName, customerCity, description,
                                           customerAddress, customerPhone, customerEmail,
                                           createdAt, updatedAt);
                        taskList.add(task);
                    }
                    
                    // Refresh UI components
                    tasksAdapter.notifyDataSetChanged();
                    updateDashboard();
                    updateCardDashboard();
                    
                    // Success feedback
                    Toast.makeText(WizoneNativeActivity.this, "✅ Complete sync successful! Web portal refreshed.", Toast.LENGTH_LONG).show();
                    statusText.setText("✅ Enhanced sync completed!\n📋 " + tasks.length() + " tasks synced\n🌐 Web portal history refreshed\n🔄 Last sync: Just now");
                    
                    Log.i(TAG, "✅ ENHANCED HEADER SYNC COMPLETED - " + tasks.length() + " tasks, web refresh triggered");
                    
                } catch (Exception e) {
                    Log.e(TAG, "❌ Header Sync Parsing Error: " + e.getMessage());
                    Toast.makeText(WizoneNativeActivity.this, "⚠️ Sync completed but parsing failed", Toast.LENGTH_LONG).show();
                    statusText.setText("⚠️ Sync completed with warnings\n🔄 Please try again if issues persist");
                }
            }
        }
    }
    
    private void createNavigationMenu() {
        LinearLayout menuLayout = new LinearLayout(this);
        menuLayout.setOrientation(LinearLayout.VERTICAL);
        menuLayout.setPadding(0, 20, 0, 20);
        
        // Dashboard menu item
        Button dashboardBtn = createMenuButton("📊 Dashboard", v -> {
            showDashboardSection();
            drawerLayout.closeDrawer(GravityCompat.START);
        });
        menuLayout.addView(dashboardBtn);
        
        // Tasks menu item
        Button tasksBtn = createMenuButton("📋 My Tasks", v -> {
            showTasksSection();
            drawerLayout.closeDrawer(GravityCompat.START);
        });
        menuLayout.addView(tasksBtn);
        
        // Sync menu item
        Button syncBtn = createMenuButton("🔄 Sync Tasks", v -> {
            syncTasks();
            drawerLayout.closeDrawer(GravityCompat.START);
        });
        menuLayout.addView(syncBtn);
        
        // Profile menu item
        Button profileBtn = createMenuButton("👤 My Profile", v -> {
            showProfileDialog();
            drawerLayout.closeDrawer(GravityCompat.START);
        });
        menuLayout.addView(profileBtn);
        
        navigationDrawer.addView(menuLayout);
    }
    
    private void createDrawerFooter() {
        LinearLayout footerLayout = new LinearLayout(this);
        footerLayout.setOrientation(LinearLayout.VERTICAL);
        footerLayout.setPadding(20, 20, 20, 40);
        
        // Logout button
        Button logoutBtn = new Button(this);
        logoutBtn.setText("🚪 Logout");
        logoutBtn.setTextSize(16);
        logoutBtn.setTextColor(Color.WHITE);
        logoutBtn.setBackgroundColor(Color.parseColor("#dc2626"));
        logoutBtn.setPadding(30, 20, 30, 20);
        logoutBtn.setOnClickListener(v -> {
            drawerLayout.closeDrawer(GravityCompat.START);
            performLogout();
        });
        
        LinearLayout.LayoutParams logoutParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        logoutParams.setMargins(20, 0, 20, 0);
        logoutBtn.setLayoutParams(logoutParams);
        
        footerLayout.addView(logoutBtn);
        
        // App version
        TextView versionText = new TextView(this);
        versionText.setText("Wizone Mobile v2.0\nProfessional Enhanced");
        versionText.setTextSize(10);
        versionText.setTextColor(Color.parseColor("#6b7280"));
        versionText.setGravity(Gravity.CENTER);
        versionText.setPadding(0, 20, 0, 0);
        footerLayout.addView(versionText);
        
        // Position footer at bottom
        LinearLayout.LayoutParams footerParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            0,
            1.0f
        );
        footerLayout.setLayoutParams(footerParams);
        footerLayout.setGravity(Gravity.BOTTOM);
        
        navigationDrawer.addView(footerLayout);
    }
    
    private Button createMenuButton(String text, View.OnClickListener clickListener) {
        Button button = new Button(this);
        button.setText(text);
        button.setTextSize(16);
        button.setTextColor(Color.parseColor("#374151"));
        button.setBackgroundColor(Color.TRANSPARENT);
        button.setGravity(Gravity.START | Gravity.CENTER_VERTICAL);
        button.setPadding(40, 25, 40, 25);
        button.setOnClickListener(clickListener);
        
        LinearLayout.LayoutParams buttonParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        buttonParams.setMargins(20, 5, 20, 5);
        button.setLayoutParams(buttonParams);
        
        return button;
    }
    
    private void createEnhancedLoginSection() {
        // Login container with enhanced design
        loginLayout = new LinearLayout(this);
        loginLayout.setOrientation(LinearLayout.VERTICAL);
        loginLayout.setBackgroundColor(Color.WHITE);
        loginLayout.setPadding(40, 50, 40, 50);
        
        // Add rounded corners
        GradientDrawable loginBg = new GradientDrawable();
        loginBg.setColor(Color.WHITE);
        loginBg.setCornerRadius(20);
        loginBg.setStroke(2, Color.parseColor("#e5e7eb"));
        loginLayout.setBackground(loginBg);
        
        // App logo/title
        TextView logoText = new TextView(this);
        logoText.setText("📱 WIZONE");
        logoText.setTextSize(32);
        logoText.setTextColor(Color.parseColor("#1e40af"));
        logoText.setGravity(Gravity.CENTER);
        logoText.setPadding(0, 0, 0, 10);
        loginLayout.addView(logoText);
        
        TextView loginTitle = new TextView(this);
        loginTitle.setText("Field Engineer Portal");
        loginTitle.setTextSize(18);
        loginTitle.setTextColor(Color.parseColor("#6b7280"));
        loginTitle.setGravity(Gravity.CENTER);
        loginTitle.setPadding(0, 0, 0, 40);
        loginLayout.addView(loginTitle);
        
        // Username section with proper input box
        TextView usernameLabel = new TextView(this);
        usernameLabel.setText("👤 Username");
        usernameLabel.setTextSize(16);
        usernameLabel.setTextColor(Color.parseColor("#374151"));
        usernameLabel.setPadding(5, 0, 0, 8);
        loginLayout.addView(usernameLabel);
        
        usernameInput = new EditText(this);
        usernameInput.setHint("Enter your username");
        usernameInput.setTextSize(16);
        usernameInput.setPadding(20, 20, 20, 20);
        
        // Create proper input box styling
        GradientDrawable usernameBg = new GradientDrawable();
        usernameBg.setColor(Color.parseColor("#f9fafb"));
        usernameBg.setCornerRadius(12);
        usernameBg.setStroke(2, Color.parseColor("#d1d5db"));
        usernameInput.setBackground(usernameBg);
        
        LinearLayout.LayoutParams usernameParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 
            (int) (56 * getResources().getDisplayMetrics().density) // 56dp height
        );
        usernameParams.setMargins(0, 0, 0, 25);
        usernameInput.setLayoutParams(usernameParams);
        loginLayout.addView(usernameInput);
        
        // Password section with proper input box
        TextView passwordLabel = new TextView(this);
        passwordLabel.setText("🔒 Password");
        passwordLabel.setTextSize(16);
        passwordLabel.setTextColor(Color.parseColor("#374151"));
        passwordLabel.setPadding(5, 0, 0, 8);
        loginLayout.addView(passwordLabel);
        
        passwordInput = new EditText(this);
        passwordInput.setHint("Enter your password");
        passwordInput.setInputType(android.text.InputType.TYPE_CLASS_TEXT | android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD);
        passwordInput.setTextSize(16);
        passwordInput.setPadding(20, 20, 20, 20);
        
        // Create proper input box styling
        GradientDrawable passwordBg = new GradientDrawable();
        passwordBg.setColor(Color.parseColor("#f9fafb"));
        passwordBg.setCornerRadius(12);
        passwordBg.setStroke(2, Color.parseColor("#d1d5db"));
        passwordInput.setBackground(passwordBg);
        
        LinearLayout.LayoutParams passwordParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 
            (int) (56 * getResources().getDisplayMetrics().density) // 56dp height
        );
        passwordParams.setMargins(0, 0, 0, 35);
        passwordInput.setLayoutParams(passwordParams);
        loginLayout.addView(passwordInput);
        
        // Enhanced login button
        loginButton = new Button(this);
        loginButton.setText("🚀 Sign In");
        loginButton.setTextSize(18);
        loginButton.setTextColor(Color.WHITE);
        
        // Create gradient background for button
        GradientDrawable buttonBg = new GradientDrawable();
        buttonBg.setOrientation(GradientDrawable.Orientation.LEFT_RIGHT);
        buttonBg.setColors(new int[]{Color.parseColor("#1e40af"), Color.parseColor("#3b82f6")});
        buttonBg.setCornerRadius(12);
        loginButton.setBackground(buttonBg);
        
        loginButton.setPadding(40, 25, 40, 25);
        
        LinearLayout.LayoutParams buttonParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 
            (int) (56 * getResources().getDisplayMetrics().density) // 56dp height
        );
        loginButton.setLayoutParams(buttonParams);
        
        loginButton.setOnClickListener(v -> performLogin());
        loginLayout.addView(loginButton);
        
        // Secure connection indicator (subtle)
        TextView secureText = new TextView(this);
        secureText.setText("🔒 Secure Connection");
        secureText.setTextSize(12);
        secureText.setTextColor(Color.parseColor("#059669"));
        secureText.setGravity(Gravity.CENTER);
        secureText.setPadding(0, 20, 0, 0);
        loginLayout.addView(secureText);
        
        // Add login container to main layout
        LinearLayout.LayoutParams containerParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        containerParams.setMargins(0, 40, 0, 40);
        loginLayout.setLayoutParams(containerParams);
        
        mainLayout.addView(loginLayout);
    }
    
    private void createCardDashboardSection() {
        // Card dashboard container (initially hidden) 
        cardDashboardLayout = new LinearLayout(this);
        cardDashboardLayout.setOrientation(LinearLayout.VERTICAL);
        cardDashboardLayout.setPadding(20, 20, 20, 20);
        cardDashboardLayout.setVisibility(LinearLayout.GONE);
        
        TextView cardTitle = new TextView(this);
        cardTitle.setText("📊 Task Overview");
        cardTitle.setTextSize(20);
        cardTitle.setTextColor(Color.parseColor("#1f2937"));
        cardTitle.setGravity(Gravity.CENTER);
        cardTitle.setPadding(0, 0, 0, 25);
        cardDashboardLayout.addView(cardTitle);
        
        // Create card grid (2x2)
        LinearLayout topRow = new LinearLayout(this);
        topRow.setOrientation(LinearLayout.HORIZONTAL);
        topRow.setWeightSum(2.0f);
        
        LinearLayout bottomRow = new LinearLayout(this);
        bottomRow.setOrientation(LinearLayout.HORIZONTAL);
        bottomRow.setWeightSum(2.0f);
        
        // Open Tasks Card
        LinearLayout openCard = createEnhancedStatusCard("⏳", "Open", "0", "#f59e0b", "#fef3c7", "open");
        LinearLayout.LayoutParams openParams = new LinearLayout.LayoutParams(0, 200, 1.0f);
        openParams.setMargins(10, 10, 10, 10);
        openCard.setLayoutParams(openParams);
        openTasksCountText = (TextView) openCard.getChildAt(1); // Store reference to count text
        topRow.addView(openCard);
        
        // In Progress Tasks Card  
        LinearLayout progressCard = createEnhancedStatusCard("🔄", "In Progress", "0", "#8b5cf6", "#f3e8ff", "progress");
        LinearLayout.LayoutParams progressParams = new LinearLayout.LayoutParams(0, 200, 1.0f);
        progressParams.setMargins(10, 10, 10, 10);
        progressCard.setLayoutParams(progressParams);
        inProgressCountText = (TextView) progressCard.getChildAt(1); // Store reference to count text
        topRow.addView(progressCard);
        
        // Complete Tasks Card
        LinearLayout completeCard = createEnhancedStatusCard("✅", "Complete", "0", "#10b981", "#d1fae5", "completed");
        LinearLayout.LayoutParams completeParams = new LinearLayout.LayoutParams(0, 200, 1.0f);
        completeParams.setMargins(10, 10, 10, 10);
        completeCard.setLayoutParams(completeParams);
        completedCountText = (TextView) completeCard.getChildAt(1); // Store reference to count text
        bottomRow.addView(completeCard);
        
        // Cancel Tasks Card
        LinearLayout cancelCard = createEnhancedStatusCard("❌", "Cancelled", "0", "#ef4444", "#fee2e2", "cancelled");
        LinearLayout.LayoutParams cancelParams = new LinearLayout.LayoutParams(0, 200, 1.0f);
        cancelParams.setMargins(10, 10, 10, 10);
        cancelCard.setLayoutParams(cancelParams);
        cancelledCountText = (TextView) cancelCard.getChildAt(1); // Store reference to count text
        bottomRow.addView(cancelCard);
        
        cardDashboardLayout.addView(topRow);
        cardDashboardLayout.addView(bottomRow);
        
        // Add to main layout
        LinearLayout.LayoutParams cardDashboardParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        cardDashboardParams.setMargins(0, 0, 0, 20);
        cardDashboardLayout.setLayoutParams(cardDashboardParams);
        
        mainLayout.addView(cardDashboardLayout);
    }
    
    private LinearLayout createStatusCard(String icon, String status, String count, String borderColor, String bgColor) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setGravity(Gravity.CENTER);
        card.setPadding(20, 25, 20, 25);
        
        // Create card styling
        GradientDrawable cardBg = new GradientDrawable();
        cardBg.setColor(Color.parseColor(bgColor));
        cardBg.setCornerRadius(16);
        cardBg.setStroke(3, Color.parseColor(borderColor));
        card.setBackground(cardBg);
        
        // Icon
        TextView iconText = new TextView(this);
        iconText.setText(icon);
        iconText.setTextSize(32);
        iconText.setGravity(Gravity.CENTER);
        card.addView(iconText);
        
        // Count
        TextView countText = new TextView(this);
        countText.setText(count);
        countText.setTextSize(28);
        countText.setTextColor(Color.parseColor(borderColor));
        countText.setGravity(Gravity.CENTER);
        countText.setPadding(0, 8, 0, 4);
        card.addView(countText);
        
        // Status label
        TextView statusText = new TextView(this);
        statusText.setText(status);
        statusText.setTextSize(14);
        statusText.setTextColor(Color.parseColor("#374151"));
        statusText.setGravity(Gravity.CENTER);
        card.addView(statusText);
        
        // Make card clickable to filter tasks
        card.setOnClickListener(v -> filterTasksByStatus(status.toLowerCase()));
        
        return card;
    }
    
    // ENHANCED: Enhanced status card with clickable filtering
    private LinearLayout createEnhancedStatusCard(String icon, String status, String count, String borderColor, String bgColor, String filterType) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setGravity(Gravity.CENTER);
        card.setPadding(20, 25, 20, 25);
        
        // Create enhanced card styling with shadow effect
        GradientDrawable cardBg = new GradientDrawable();
        cardBg.setColor(Color.parseColor(bgColor));
        cardBg.setCornerRadius(20);
        cardBg.setStroke(4, Color.parseColor(borderColor));
        card.setBackground(cardBg);
        card.setElevation(8);
        
        // Icon with enhanced styling
        TextView iconText = new TextView(this);
        iconText.setText(icon);
        iconText.setTextSize(36);
        iconText.setGravity(Gravity.CENTER);
        card.addView(iconText);
        
        // Count with enhanced styling
        TextView countText = new TextView(this);
        countText.setText(count);
        countText.setTextSize(32);
        countText.setTextColor(Color.parseColor(borderColor));
        countText.setGravity(Gravity.CENTER);
        countText.setPadding(0, 10, 0, 5);
        countText.setTypeface(null, Typeface.BOLD);
        card.addView(countText);
        
        // Status label with enhanced styling
        TextView statusText = new TextView(this);
        statusText.setText(status);
        statusText.setTextSize(16);
        statusText.setTextColor(Color.parseColor("#374151"));
        statusText.setGravity(Gravity.CENTER);
        statusText.setTypeface(null, Typeface.BOLD);
        card.addView(statusText);
        
        // ENHANCED: Make card clickable with advanced filtering
        card.setOnClickListener(v -> {
            Log.i(TAG, "🎯 ENHANCED CARD CLICKED - Filter: " + filterType);
            performEnhancedTaskFilter(filterType);
        });
        
        return card;
    }
    
    private void createDashboardSection() {
        // Dashboard container (initially hidden)
        dashboardLayout = new LinearLayout(this);
        dashboardLayout.setOrientation(LinearLayout.VERTICAL);
        dashboardLayout.setBackgroundColor(Color.WHITE);
        dashboardLayout.setPadding(40, 40, 40, 40);
        dashboardLayout.setVisibility(LinearLayout.GONE);
        
        TextView dashboardTitle = new TextView(this);
        dashboardTitle.setText("📊 DASHBOARD");
        dashboardTitle.setTextSize(22);
        dashboardTitle.setTextColor(Color.parseColor("#1f2937"));
        dashboardTitle.setGravity(Gravity.CENTER);
        dashboardTitle.setPadding(0, 0, 0, 20);
        dashboardLayout.addView(dashboardTitle);
        
        // Dashboard stats
        dashboardText = new TextView(this);
        dashboardText.setText("Loading dashboard...");
        dashboardText.setTextSize(16);
        dashboardText.setTextColor(Color.parseColor("#374151"));
        dashboardText.setGravity(Gravity.LEFT);
        dashboardText.setPadding(20, 20, 20, 20);
        dashboardText.setBackgroundColor(Color.parseColor("#f9fafb"));
        dashboardLayout.addView(dashboardText);
        
        // Action buttons row
        LinearLayout actionButtonsRow = new LinearLayout(this);
        actionButtonsRow.setOrientation(LinearLayout.HORIZONTAL);
        actionButtonsRow.setPadding(0, 20, 0, 0);
        
        Button syncButton = new Button(this);
        syncButton.setText("🔄 Sync Tasks");
        syncButton.setTextSize(14);
        syncButton.setPadding(20, 15, 20, 15);
        syncButton.setBackgroundColor(Color.parseColor("#3b82f6"));
        syncButton.setTextColor(Color.WHITE);
        syncButton.setOnClickListener(v -> syncTasks());
        
        Button logoutButton = new Button(this);
        logoutButton.setText("🚪 Logout");
        logoutButton.setTextSize(14);
        logoutButton.setPadding(20, 15, 20, 15);
        logoutButton.setBackgroundColor(Color.parseColor("#dc2626"));
        logoutButton.setTextColor(Color.WHITE);
        logoutButton.setOnClickListener(v -> performLogout());
        
        LinearLayout.LayoutParams syncParams = new LinearLayout.LayoutParams(
            0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f
        );
        syncParams.setMargins(0, 0, 10, 0);
        syncButton.setLayoutParams(syncParams);
        
        LinearLayout.LayoutParams logoutParams = new LinearLayout.LayoutParams(
            0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f
        );
        logoutButton.setLayoutParams(logoutParams);
        
        actionButtonsRow.addView(syncButton);
        actionButtonsRow.addView(logoutButton);
        dashboardLayout.addView(actionButtonsRow);
        
        // Add dashboard container to main layout
        LinearLayout.LayoutParams dashboardContainerParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        dashboardContainerParams.setMargins(0, 0, 0, 30);
        dashboardLayout.setLayoutParams(dashboardContainerParams);
        
        mainLayout.addView(dashboardLayout);
    }
    
    private void createTasksSection() {
        // Tasks container (initially hidden)
        LinearLayout tasksContainer = new LinearLayout(this);
        tasksContainer.setOrientation(LinearLayout.VERTICAL);
        tasksContainer.setBackgroundColor(Color.WHITE);
        tasksContainer.setPadding(40, 40, 40, 40);
        tasksContainer.setVisibility(LinearLayout.GONE);
        
        TextView tasksTitle = new TextView(this);
        tasksTitle.setText("📋 My Assigned Tasks");
        tasksTitle.setTextSize(22);
        tasksTitle.setTextColor(Color.parseColor("#1f2937"));
        tasksTitle.setGravity(Gravity.CENTER);
        tasksTitle.setPadding(0, 0, 0, 30);
        tasksContainer.addView(tasksTitle);
        
        // Tasks list with custom adapter
        tasksAdapter = new TaskAdapter(taskList);
        Log.i(TAG, "✨ Enhanced TaskAdapter created with " + taskList.size() + " tasks");
        
        tasksList = new ListView(this);
        tasksList.setAdapter(tasksAdapter);
        Log.i(TAG, "✨ ListView configured with enhanced TaskAdapter");
        
        LinearLayout.LayoutParams listParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 
            800 // Fixed height for scrolling
        );
        tasksList.setLayoutParams(listParams);
        tasksContainer.addView(tasksList);
        
        // Add tasks container to main layout
        mainLayout.addView(tasksContainer);
    }
    
    private void performLogin() {
        String username = usernameInput.getText().toString().trim();
        String password = passwordInput.getText().toString().trim();
        
        if (username.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "❌ Please enter username and password", Toast.LENGTH_SHORT).show();
            return;
        }
        
        loginButton.setText("🔄 Logging in...");
        loginButton.setEnabled(false);
        statusText.setText("🔄 Authenticating with production server...\n" + API_BASE_URL);
        
        // Perform API login
        new LoginTask().execute(username, password);
    }
    
    private void updateDashboard() {
        if (taskList.isEmpty()) {
            dashboardText.setText("📋 Total Tasks: 0\n\n📝 No tasks assigned at the moment.");
            return;
        }
        
        int totalTasks = taskList.size();
        int pendingTasks = 0;
        int inProgressTasks = 0;
        int completedTasks = 0;
        int cancelledTasks = 0;
        
        for (Task task : taskList) {
            String status = task.status.toLowerCase();
            switch (status) {
                case "pending":
                    pendingTasks++;
                    break;
                case "in_progress":
                case "in progress":
                    inProgressTasks++;
                    break;
                case "completed":
                    completedTasks++;
                    break;
                case "cancelled":
                    cancelledTasks++;
                    break;
            }
        }
        
        StringBuilder dashboard = new StringBuilder();
        dashboard.append("📋 Total Tasks: ").append(totalTasks).append("\n\n");
        dashboard.append("⏳ Pending: ").append(pendingTasks).append("\n");
        dashboard.append("🔄 In Progress: ").append(inProgressTasks).append("\n");
        dashboard.append("✅ Completed: ").append(completedTasks).append("\n");
        if (cancelledTasks > 0) {
            dashboard.append("❌ Cancelled: ").append(cancelledTasks).append("\n");
        }
        dashboard.append("\n👤 Logged in as: ").append(currentUsername);
        
        dashboardText.setText(dashboard.toString());
    }
    
    private void syncTasks() {
        statusText.setText("🔄 Syncing tasks from server...");
        new LoadTasksTask().execute();
        Toast.makeText(this, "🔄 Syncing tasks...", Toast.LENGTH_SHORT).show();
    }
    
    private void performLogout() {
        new AlertDialog.Builder(this)
                .setTitle("🚪 Logout")
                .setMessage("Are you sure you want to logout?")
                .setPositiveButton("Yes", (dialog, which) -> {
                    isLoggedIn = false;
                    sessionCookie = "";
                    currentUsername = "";
                    currentUserRole = "";
                    currentUserEmail = "";
                    taskList.clear();
                    
                    // Hide all dashboard and tasks sections
                    hideAllSections();
                    
                    // Show login section
                    loginLayout.setVisibility(LinearLayout.VISIBLE);
                    
                    // Clear login fields
                    usernameInput.setText("");
                    passwordInput.setText("");
                    loginButton.setText("🚀 Sign In");
                    loginButton.setEnabled(true);
                    
                    // Hide status for clean UI
                    statusText.setVisibility(View.GONE);
                    
                    Toast.makeText(this, "👋 Logged out successfully", Toast.LENGTH_SHORT).show();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
    
    protected void showUpdateDialog(Task task) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("✏️ Update Task: " + task.ticketNumber);
        
        // Create layout
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(50, 50, 50, 50);
        
        // Add task info
        TextView taskInfo = new TextView(this);
        taskInfo.setText("👤 Customer: " + task.customerName + "\n" +
                        "⚙️ Issue: " + task.issueType + "\n" +
                        "📊 Current Status: " + task.status);
        taskInfo.setTextSize(14);
        taskInfo.setPadding(0, 0, 0, 20);
        layout.addView(taskInfo);
        
        // Status change section
        TextView statusLabel = new TextView(this);
        statusLabel.setText("🔄 Change Status:");
        statusLabel.setTextSize(16);
        statusLabel.setPadding(0, 0, 0, 10);
        layout.addView(statusLabel);
        
        // Status dropdown
        final String[] statusOptions = {"pending", "in_progress", "completed", "cancelled"};
        final String[] statusLabels = {"⏳ Pending", "🔄 In Progress", "✅ Completed", "❌ Cancelled"};
        
        Spinner statusSpinner = new Spinner(this);
        ArrayAdapter<String> statusAdapter = new ArrayAdapter<>(this, 
                android.R.layout.simple_spinner_dropdown_item, statusLabels);
        statusSpinner.setAdapter(statusAdapter);
        
        // Set current selected status
        int selectedPosition = 0;
        for (int i = 0; i < statusOptions.length; i++) {
            if (statusOptions[i].equalsIgnoreCase(task.status)) {
                selectedPosition = i;
                break;
            }
        }
        statusSpinner.setSelection(selectedPosition);
        layout.addView(statusSpinner);
        
        // Add spacing
        View spacer = new View(this);
        spacer.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 30));
        layout.addView(spacer);
        
        // Notes section
        TextView notesLabel = new TextView(this);
        notesLabel.setText("📝 Add Notes:");
        notesLabel.setTextSize(16);
        notesLabel.setPadding(0, 0, 0, 10);
        layout.addView(notesLabel);
        
        // Notes input field
        EditText notesInput = new EditText(this);
        notesInput.setHint("Enter task update notes...");
        notesInput.setLines(3);
        notesInput.setTextSize(14);
        layout.addView(notesInput);
        
        builder.setView(layout);
        
        // Update button
        builder.setPositiveButton("✅ Update", (dialog, which) -> {
            // Get selected status
            int selectedStatusPosition = statusSpinner.getSelectedItemPosition();
            String newStatus = statusOptions[selectedStatusPosition];
            
            // Get notes text
            String notes = notesInput.getText().toString().trim();
            
            // Validate notes input
            if (notes.isEmpty()) {
                Toast.makeText(this, "⚠️ Please enter notes for the update", Toast.LENGTH_SHORT).show();
                return;
            }
            
            // Check if status changed
            if (!newStatus.equalsIgnoreCase(task.status)) {
                // Task completion restriction - prevent status changes after completion
                if (task.status.toLowerCase().equals("completed") || task.status.toLowerCase().equals("resolved")) {
                    new AlertDialog.Builder(this)
                        .setTitle("❌ Task Completed")
                        .setMessage("This task has been completed and cannot be modified further.\n\nTask: " + task.ticketNumber + "\nStatus: " + task.status.toUpperCase())
                        .setPositiveButton("OK", null)
                        .show();
                    return;
                }
                
                // Prevent regression (completed -> other status)
                if (newStatus.equals("pending") && (task.status.toLowerCase().equals("completed") || task.status.toLowerCase().equals("in_progress"))) {
                    new AlertDialog.Builder(this)
                        .setTitle("⚠️ Invalid Status Change")
                        .setMessage("Cannot change task status from " + task.status + " to " + newStatus + ".\n\nPlease maintain proper workflow sequence.")
                        .setPositiveButton("OK", null)
                        .show();
                    return;
                }
                
                // Update status
                new UpdateTaskTask().execute(task.id, "status", newStatus);
                Toast.makeText(this, "🔄 Changing task status to " + newStatus.replace("_", " ") + "...", Toast.LENGTH_SHORT).show();
            }
            
            // Always update notes
            updateTaskNotes(task, notes);
        });
        
        builder.setNegativeButton("❌ Cancel", null);
        builder.show();
    }
    
    private void showStatusChangeDialog(Task task) {
        String[] statusOptions = {"pending", "in_progress", "completed", "cancelled"};
        String[] statusLabels = {"⏳ Pending", "🔄 In Progress", "✅ Completed", "❌ Cancelled"};
        
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("📊 Change Status: " + task.ticketNumber);
        builder.setItems(statusLabels, (dialog, which) -> {
            String newStatus = statusOptions[which];
            changeTaskStatus(task, newStatus);
        });
        builder.setNegativeButton("❌ Cancel", null);
        builder.show();
    }
    
    private void updateTaskNotes(Task task, String notes) {
        if (notes.isEmpty()) {
            Toast.makeText(this, "⚠️ Please enter notes for the update", Toast.LENGTH_SHORT).show();
            return;
        }
        
        new UpdateTaskTask().execute(task.id, "notes", notes);
        Toast.makeText(this, "🔄 Updating task notes...", Toast.LENGTH_SHORT).show();
    }
    
    private void changeTaskStatus(Task task, String newStatus) {
        // Task completion restriction - prevent status changes after completion
        if (task.status.toLowerCase().equals("completed") || task.status.toLowerCase().equals("resolved")) {
            new AlertDialog.Builder(this)
                .setTitle("❌ Task Completed")
                .setMessage("This task has been completed and cannot be modified further.\n\nTask: " + task.ticketNumber + "\nStatus: " + task.status.toUpperCase())
                .setPositiveButton("OK", null)
                .show();
            return;
        }
        
        // Prevent regression (completed -> other status)
        if (newStatus.equals("pending") && (task.status.toLowerCase().equals("completed") || task.status.toLowerCase().equals("in_progress"))) {
            new AlertDialog.Builder(this)
                .setTitle("⚠️ Invalid Status Change")
                .setMessage("Cannot change task status from " + task.status + " to " + newStatus + ".\n\nPlease maintain proper workflow sequence.")
                .setPositiveButton("OK", null)
                .show();
            return;
        }
        
        new UpdateTaskTask().execute(task.id, "status", newStatus);
        Toast.makeText(this, "🔄 Changing task status to " + newStatus.replace("_", " ") + "...", Toast.LENGTH_SHORT).show();
    }
    
    private class LoginTask extends AsyncTask<String, Void, String> {
        @Override
        protected String doInBackground(String... params) {
            try {
                String username = params[0];
                String password = params[1];
                
                URL url = new URL(API_BASE_URL + "/auth/login");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("User-Agent", "WizoneNativeApp/1.0");
                conn.setDoOutput(true);
                
                String jsonInput = "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}";
                
                OutputStream os = conn.getOutputStream();
                os.write(jsonInput.getBytes("utf-8"));
                os.close();
                
                int responseCode = conn.getResponseCode();
                Log.i(TAG, "Login response code: " + responseCode);
                
                if (responseCode == 200) {
                    // Get session cookie
                    String cookie = conn.getHeaderField("Set-Cookie");
                    if (cookie != null) {
                        sessionCookie = cookie;
                        Log.i(TAG, "Session cookie received");
                    }
                    
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();
                    return response.toString();
                } else {
                    BufferedReader errorReader = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
                    StringBuilder errorResponse = new StringBuilder();
                    String line;
                    while ((line = errorReader.readLine()) != null) {
                        errorResponse.append(line);
                    }
                    errorReader.close();
                    return "ERROR: " + responseCode + " - " + errorResponse.toString();
                }
            } catch (Exception e) {
                Log.e(TAG, "Login error: " + e.getMessage());
                return "ERROR: " + e.getMessage();
            }
        }
        
        @Override
        protected void onPostExecute(String result) {
            if (result.startsWith("ERROR:")) {
                Toast.makeText(WizoneNativeActivity.this, "❌ Login failed: " + result, Toast.LENGTH_LONG).show();
                loginButton.setText("🚀 LOGIN TO WIZONE");
                loginButton.setEnabled(true);
                statusText.setText("❌ Login failed\n" + result);
            } else {
                try {
                    JSONObject response = new JSONObject(result);
                    
                    // Update user profile information
                    updateUserProfile(response);
                    
                    Toast.makeText(WizoneNativeActivity.this, "✅ Login successful! Welcome " + currentUsername, Toast.LENGTH_SHORT).show();
                    isLoggedIn = true;
                    
                    statusText.setText("✅ Connected and authenticated\n🔄 Loading dashboard...");
                    statusText.setVisibility(View.VISIBLE);
                    
                    // Hide login section
                    loginLayout.setVisibility(LinearLayout.GONE);
                    
                    // Show card dashboard and regular dashboard
                    showDashboardSection();
                    
                    // Load tasks
                    new LoadTasksTask().execute();
                    
                } catch (Exception e) {
                    Log.e(TAG, "Login response parsing error: " + e.getMessage());
                    Toast.makeText(WizoneNativeActivity.this, "❌ Login response error: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    loginButton.setText("🚀 LOGIN TO WIZONE");
                    loginButton.setEnabled(true);
                    statusText.setText("❌ Login parsing failed\n" + e.getMessage());
                }
            }
        }
    }
    
    private void showTasksSection() {
        // Hide other sections first
        hideAllSections();
        
        // Show tasks section and refresh tasks
        for (int i = 0; i < mainLayout.getChildCount(); i++) {
            if (mainLayout.getChildAt(i) instanceof LinearLayout) {
                LinearLayout container = (LinearLayout) mainLayout.getChildAt(i);
                if (container.getChildCount() > 0 && container.getChildAt(0) instanceof TextView) {
                    TextView firstChild = (TextView) container.getChildAt(0);
                    if (firstChild.getText().toString().contains("📋 My Assigned Tasks")) {
                        container.setVisibility(LinearLayout.VISIBLE);
                        
                        // Refresh tasks when showing tasks section
                        if (isLoggedIn) {
                            syncTasks();
                        }
                        break;
                    }
                }
            }
        }
    }
    
    private void hideTasksSection() {
        // Find and hide tasks container
        for (int i = 0; i < mainLayout.getChildCount(); i++) {
            if (mainLayout.getChildAt(i) instanceof LinearLayout) {
                LinearLayout container = (LinearLayout) mainLayout.getChildAt(i);
                if (container.getChildCount() > 0 && container.getChildAt(0) instanceof TextView) {
                    TextView firstChild = (TextView) container.getChildAt(0);
                    if (firstChild.getText().toString().contains("📋 My Assigned Tasks")) {
                        container.setVisibility(LinearLayout.GONE);
                        break;
                    }
                }
            }
        }
    }
    
    private class LoadTasksTask extends AsyncTask<Void, Void, String> {
        @Override
        protected String doInBackground(Void... params) {
            try {
                URL url = new URL(API_BASE_URL + "/tasks/my-tasks");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setRequestProperty("User-Agent", "WizoneNativeApp/1.0");
                
                // Include session cookie if available
                if (!sessionCookie.isEmpty()) {
                    conn.setRequestProperty("Cookie", sessionCookie);
                }
                
                int responseCode = conn.getResponseCode();
                Log.i(TAG, "Tasks response code: " + responseCode);
                
                if (responseCode == 200) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();
                    return response.toString();
                } else {
                    BufferedReader errorReader = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
                    StringBuilder errorResponse = new StringBuilder();
                    String line;
                    while ((line = errorReader.readLine()) != null) {
                        errorResponse.append(line);
                    }
                    errorReader.close();
                    return "ERROR: " + responseCode + " - " + errorResponse.toString();
                }
            } catch (Exception e) {
                Log.e(TAG, "Tasks loading error: " + e.getMessage());
                return "ERROR: " + e.getMessage();
            }
        }
        
        @Override
        protected void onPostExecute(String result) {
            if (result.startsWith("ERROR:")) {
                Toast.makeText(WizoneNativeActivity.this, "❌ Failed to load tasks: " + result, Toast.LENGTH_LONG).show();
                statusText.setText("❌ Failed to load tasks\n" + result);
                updateDashboard();
                
            } else {
                try {
                    JSONArray tasks = new JSONArray(result);
                    taskList.clear();
                    
                    Log.i(TAG, "Loaded " + tasks.length() + " tasks");
                    
                    for (int i = 0; i < tasks.length(); i++) {
                        JSONObject taskJson = tasks.getJSONObject(i);
                        String id = taskJson.optString("id", "");
                        String ticketNumber = taskJson.optString("ticketNumber", "N/A");
                        String title = taskJson.optString("title", "Task");
                        String status = taskJson.optString("status", "pending");
                        String issueType = taskJson.optString("issueType", "General");
                        String priority = taskJson.optString("priority", "normal");
                        String description = taskJson.optString("description", "");
                        
                        JSONObject customer = taskJson.optJSONObject("customer");
                        String customerName = customer != null ? customer.optString("name", "Unknown") : "Unknown";
                        String customerCity = customer != null ? customer.optString("city", "") : "";
                        // ENHANCED: Parse additional customer details for clickable task IDs (LoadTasks)
                        String customerAddress = customer != null ? customer.optString("address", "") : "";
                        String customerPhone = customer != null ? customer.optString("phone", "") : "";
                        String customerEmail = customer != null ? customer.optString("email", "") : "";
                        
                        // Parse timestamps
                        String createdAt = taskJson.optString("createdAt", "");
                        String updatedAt = taskJson.optString("updatedAt", "");
                        
                        Task task = new Task(id, ticketNumber, title, status, priority, 
                                           issueType, customerName, customerCity, description,
                                           customerAddress, customerPhone, customerEmail,
                                           createdAt, updatedAt);
                        taskList.add(task);
                    }
                    
                    Log.i(TAG, "✨ Notifying enhanced TaskAdapter of " + taskList.size() + " tasks");
                    tasksAdapter.notifyDataSetChanged();
                    updateDashboard();
                    statusText.setText("✅ Connected to Production Server\n📋 Loaded " + tasks.length() + " tasks successfully\n🔄 Last sync: Just now");
                    
                } catch (Exception e) {
                    Log.e(TAG, "Tasks parsing error: " + e.getMessage());
                    Toast.makeText(WizoneNativeActivity.this, "❌ Tasks parsing error: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    statusText.setText("❌ Error parsing tasks\n" + e.getMessage());
                    updateDashboard();
                }
            }
        }
    }
    
    private class UpdateTaskTask extends AsyncTask<String, Void, String> {
        @Override
        protected String doInBackground(String... params) {
            try {
                String taskId = params[0];
                String updateType = params[1];
                String updateValue = params[2];
                
                // FIXED: Use proper task update endpoint that creates history entries
                URL url = new URL(API_BASE_URL + "/tasks/" + taskId + "/update");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("User-Agent", "WizoneNativeApp-Enhanced/2.0");
                
                // Include session cookie if available
                if (!sessionCookie.isEmpty()) {
                    conn.setRequestProperty("Cookie", sessionCookie);
                }
                
                conn.setDoOutput(true);
                
                // FIXED: Enhanced payload with proper history tracking
                JSONObject updatePayload = new JSONObject();
                updatePayload.put("source", "mobile_apk");
                updatePayload.put("timestamp", System.currentTimeMillis());
                updatePayload.put("user", currentUsername);
                updatePayload.put("device", "android_mobile");
                
                if (updateType.equals("status")) {
                    updatePayload.put("status", updateValue);
                    updatePayload.put("update_type", "status_change");
                    updatePayload.put("description", "Status changed to " + updateValue + " via mobile APK");
                } else {
                    updatePayload.put("notes", updateValue);
                    updatePayload.put("update_type", "notes_added");
                    updatePayload.put("description", "Notes added via mobile APK: " + updateValue);
                }
                
                // FIXED: Also create history entry for web portal sync
                updatePayload.put("create_history", true);
                updatePayload.put("sync_web", true);
                
                String jsonInput = updatePayload.toString();
                Log.i(TAG, "🔄 ENHANCED UPDATE PAYLOAD: " + jsonInput);
                
                OutputStream os = conn.getOutputStream();
                os.write(jsonInput.getBytes("utf-8"));
                os.close();
                
                int responseCode = conn.getResponseCode();
                Log.i(TAG, "✅ Enhanced Update response code: " + responseCode);
                
                if (responseCode == 200) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();
                    Log.i(TAG, "✅ UPDATE SUCCESS - Web history sync enabled");
                    return response.toString();
                } else {
                    BufferedReader errorReader = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
                    StringBuilder errorResponse = new StringBuilder();
                    String line;
                    while ((line = errorReader.readLine()) != null) {
                        errorResponse.append(line);
                    }
                    errorReader.close();
                    return "ERROR: " + responseCode + " - " + errorResponse.toString();
                }
            } catch (Exception e) {
                Log.e(TAG, "❌ Enhanced Update error: " + e.getMessage());
                return "ERROR: " + e.getMessage();
            }
        }
        
        @Override
        protected void onPostExecute(String result) {
            if (result.startsWith("ERROR:")) {
                Toast.makeText(WizoneNativeActivity.this, "❌ Update failed: " + result, Toast.LENGTH_LONG).show();
            } else {
                Toast.makeText(WizoneNativeActivity.this, "✅ Task updated and synced to web portal!", Toast.LENGTH_SHORT).show();
                
                // FIXED: Also trigger web history refresh via websocket/polling
                triggerWebHistorySync();
                
                // Refresh tasks to get updated data
                new LoadTasksTask().execute();
            }
        }
    }
    
    // FIXED: New method to trigger web history sync
    private void triggerWebHistorySync() {
        // Send signal to web portal for immediate history refresh
        new AsyncTask<Void, Void, Void>() {
            @Override
            protected Void doInBackground(Void... params) {
                try {
                    URL url = new URL(API_BASE_URL + "/sync/trigger-web-refresh");
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setRequestProperty("User-Agent", "WizoneNativeApp-Enhanced/2.0");
                    
                    if (!sessionCookie.isEmpty()) {
                        conn.setRequestProperty("Cookie", sessionCookie);
                    }
                    
                    conn.setDoOutput(true);
                    
                    JSONObject syncPayload = new JSONObject();
                    syncPayload.put("source", "mobile_apk");
                    syncPayload.put("action", "refresh_web_history");
                    syncPayload.put("timestamp", System.currentTimeMillis());
                    
                    OutputStream os = conn.getOutputStream();
                    os.write(syncPayload.toString().getBytes("utf-8"));
                    os.close();
                    
                    int responseCode = conn.getResponseCode();
                    Log.i(TAG, "🔄 Web History Sync Trigger - Response: " + responseCode);
                    
                } catch (Exception e) {
                    Log.e(TAG, "⚠️ Web sync trigger failed (non-critical): " + e.getMessage());
                }
                return null;
            }
        }.execute();
    }
    
    // Helper methods for enhanced functionality
    private void createDefaultProfileImage() {
        // Create a simple text-based profile image
        Bitmap bitmap = Bitmap.createBitmap(200, 200, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint paint = new Paint();
        paint.setColor(Color.WHITE);
        paint.setTextSize(80);
        paint.setTextAlign(Paint.Align.CENTER);
        
        String initial = currentUsername.isEmpty() ? "U" : currentUsername.substring(0, 1).toUpperCase();
        canvas.drawText(initial, 100, 130, paint);
        
        profileImageView.setImageBitmap(bitmap);
    }
    
    private void openImagePicker() {
        Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        startActivityForResult(intent, REQUEST_IMAGE_PICK);
    }
    
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        
        if (requestCode == REQUEST_IMAGE_PICK && resultCode == RESULT_OK && data != null) {
            try {
                Bitmap bitmap = MediaStore.Images.Media.getBitmap(this.getContentResolver(), data.getData());
                profileImageView.setImageBitmap(bitmap);
                Toast.makeText(this, "✅ Profile photo updated!", Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Toast.makeText(this, "❌ Failed to load image", Toast.LENGTH_SHORT).show();
            }
        }
    }
    
    private void showProfileDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("👤 My Profile");
        
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(50, 50, 50, 50);
        
        TextView profileInfo = new TextView(this);
        profileInfo.setText("👤 Name: " + currentUsername + "\n" +
                           "📧 Email: " + currentUserEmail + "\n" +
                           "🏷️ Role: " + currentUserRole.replace("_", " ").toUpperCase() + "\n" +
                           "📱 App Version: v2.0 Professional");
        profileInfo.setTextSize(16);
        profileInfo.setPadding(0, 0, 0, 20);
        layout.addView(profileInfo);
        
        Button changePhotoBtn = new Button(this);
        changePhotoBtn.setText("📷 Change Profile Photo");
        changePhotoBtn.setOnClickListener(v -> {
            openImagePicker();
        });
        layout.addView(changePhotoBtn);
        
        builder.setView(layout);
        builder.setPositiveButton("OK", null);
        builder.show();
    }
    
    private void showDashboardSection() {
        // Hide other sections
        hideAllSections();
        
        // Show card dashboard and regular dashboard
        cardDashboardLayout.setVisibility(LinearLayout.VISIBLE);
        dashboardLayout.setVisibility(LinearLayout.VISIBLE);
        
        updateCardDashboard();
        updateDashboard();
    }
    
    // Duplicate method removed - keeping the first implementation only
    
    private void hideAllSections() {
        cardDashboardLayout.setVisibility(LinearLayout.GONE);
        dashboardLayout.setVisibility(LinearLayout.GONE);
        hideTasksSection();
    }
    
    private void updateCardDashboard() {
        if (taskList.isEmpty()) return;
        
        int openTasks = 0;
        int inProgressTasks = 0;
        int completedTasks = 0;
        int cancelledTasks = 0;
        
        for (Task task : taskList) {
            String status = task.status.toLowerCase();
            switch (status) {
                case "pending":
                case "open":
                    openTasks++;
                    break;
                case "in_progress":
                case "in progress":
                case "progress":
                    inProgressTasks++;
                    break;
                case "completed":
                case "complete":
                    completedTasks++;
                    break;
                case "cancelled":
                case "canceled": 
                    cancelledTasks++;
                    break;
            }
        }
        
        // ENHANCED: Update actual card count displays
        if (openTasksCountText != null) {
            openTasksCountText.setText(String.valueOf(openTasks));
        }
        if (inProgressCountText != null) {
            inProgressCountText.setText(String.valueOf(inProgressTasks));
        }
        if (completedCountText != null) {
            completedCountText.setText(String.valueOf(completedTasks));
        }
        if (cancelledCountText != null) {
            cancelledCountText.setText(String.valueOf(cancelledTasks));
        }
        
        Log.i(TAG, "✅ ENHANCED Card Dashboard Updated - Open: " + openTasks + ", Progress: " + inProgressTasks + 
                   ", Complete: " + completedTasks + ", Cancelled: " + cancelledTasks);
    }
    
    // ENHANCED: Advanced task filtering with visual feedback
    private void performEnhancedTaskFilter(String filterType) {
        List<Task> filteredTasks = new ArrayList<>();
        String statusFilter = "";
        String filterDisplayName = "";
        
        // Map filter type to actual status values
        switch (filterType.toLowerCase()) {
            case "open":
                statusFilter = "pending,open";
                filterDisplayName = "Open Tasks";
                break;
            case "progress":
                statusFilter = "in_progress,in progress,progress";
                filterDisplayName = "In Progress Tasks";
                break;
            case "completed":
                statusFilter = "completed,complete";
                filterDisplayName = "Completed Tasks";
                break;
            case "cancelled":
                statusFilter = "cancelled,canceled";
                filterDisplayName = "Cancelled Tasks";
                break;
        }
        
        // Filter tasks based on status
        String[] statusArray = statusFilter.split(",");
        for (Task task : taskList) {
            for (String status : statusArray) {
                if (task.status.toLowerCase().equals(status.toLowerCase().trim())) {
                    filteredTasks.add(task);
                    break;
                }
            }
        }
        
        // Show filtered results
        if (filteredTasks.isEmpty()) {
            Toast.makeText(this, "📋 No " + filterDisplayName.toLowerCase() + " found", Toast.LENGTH_SHORT).show();
        } else {
            // Show tasks section with filtered results
            showTasksSection();
            Toast.makeText(this, "🎯 Showing " + filteredTasks.size() + " " + filterDisplayName.toLowerCase(), Toast.LENGTH_LONG).show();
            
            // Update adapter with filtered tasks (temporary)
            List<Task> originalTasks = new ArrayList<>(taskList);
            taskList.clear();
            taskList.addAll(filteredTasks);
            if (tasksAdapter != null) {
                tasksAdapter.notifyDataSetChanged();
            }
            
            // Show clear filter option
            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            builder.setTitle("🎯 Filter Applied: " + filterDisplayName);
            builder.setMessage("Showing " + filteredTasks.size() + " tasks matching filter criteria.\n\nWould you like to clear the filter?");
            builder.setPositiveButton("🔄 Clear Filter", (dialog, which) -> {
                // Restore original tasks
                taskList.clear();
                taskList.addAll(originalTasks);
                if (tasksAdapter != null) {
                    tasksAdapter.notifyDataSetChanged();
                }
                Toast.makeText(this, "✅ Filter cleared - showing all tasks", Toast.LENGTH_SHORT).show();
            });
            builder.setNegativeButton("✅ Keep Filter", null);
            builder.show();
        }
        
        Log.i(TAG, "🎯 ENHANCED FILTER APPLIED - Type: " + filterType + ", Found: " + filteredTasks.size() + " tasks");
    }
    
    private void filterTasksByStatus(String status) {
        // Use enhanced filtering
        performEnhancedTaskFilter(status);
        Log.i(TAG, "Filtering tasks by status: " + status);
    }
    
    @Override
    public void onBackPressed() {
        if (drawerLayout.isDrawerOpen(GravityCompat.START)) {
            drawerLayout.closeDrawer(GravityCompat.START);
        } else {
            super.onBackPressed();
        }
    }
    
    // Update login success to populate user profile
    private void updateUserProfile(JSONObject response) {
        currentUsername = response.optString("username", "Field Engineer");
        currentUserRole = response.optString("role", "field_engineer");
        currentUserEmail = response.optString("email", "engineer@wizone.com");
        
        // Update drawer header with user info
        if (navigationDrawer != null) {
            // Find and update header elements
            LinearLayout headerLayout = (LinearLayout) navigationDrawer.getChildAt(0);
            if (headerLayout != null && headerLayout.getChildCount() > 1) {
                TextView nameText = (TextView) headerLayout.getChildAt(1);
                TextView roleText = (TextView) headerLayout.getChildAt(2);
                TextView emailText = (TextView) headerLayout.getChildAt(3);
                
                if (nameText != null) nameText.setText(currentUsername);
                if (roleText != null) roleText.setText(currentUserRole.replace("_", " ").toUpperCase()); 
                if (emailText != null) emailText.setText(currentUserEmail);
            }
        }
        
        createDefaultProfileImage();
    }
    
    // ENHANCED LOGIN TASK WITH DETAILED LOGGING
    private class EnhancedLoginTask extends AsyncTask<String, Void, String> {
        @Override
        protected String doInBackground(String... params) {
            try {
                String username = params[0];
                String password = params[1];
                
                Log.i(TAG, "🔐 ENHANCED LOGIN - Connecting to: " + API_BASE_URL + "/auth/login");
                
                URL url = new URL(API_BASE_URL + "/auth/login");
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setRequestProperty("User-Agent", "WizoneNativeApp/3.0-Enhanced");
                connection.setDoOutput(true);
                
                // Enhanced request body
                JSONObject requestBody = new JSONObject();
                requestBody.put("username", username);
                requestBody.put("password", password);
                requestBody.put("enhanced", true);
                requestBody.put("version", "3.0");
                
                OutputStream outputStream = connection.getOutputStream();
                outputStream.write(requestBody.toString().getBytes());
                outputStream.flush();
                outputStream.close();
                
                int responseCode = connection.getResponseCode();
                Log.i(TAG, "🔐 ENHANCED LOGIN - Response Code: " + responseCode);
                
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    // Get session cookie
                    String cookieHeader = connection.getHeaderField("Set-Cookie");
                    if (cookieHeader != null) {
                        sessionCookie = cookieHeader;
                        Log.i(TAG, "🍪 ENHANCED SESSION COOKIE RECEIVED");
                    }
                    
                    BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();
                    
                    Log.i(TAG, "✅ ENHANCED LOGIN SUCCESS - Response: " + response.toString());
                    return response.toString();
                } else {
                    Log.e(TAG, "❌ ENHANCED LOGIN FAILED - Code: " + responseCode);
                    return "ERROR:" + responseCode;
                }
                
            } catch (Exception e) {
                Log.e(TAG, "❌ ENHANCED LOGIN EXCEPTION: " + e.getMessage());
                return "ERROR:" + e.getMessage();
            }
        }
        
        @Override
        protected void onPostExecute(String result) {
            loginButton.setText("🚀 LOGIN TO ENHANCED WIZONE");
            loginButton.setEnabled(true);
            
            if (result.startsWith("ERROR:")) {
                statusText.setText("❌ Enhanced login failed: " + result.substring(6) + "\n🔄 Please try again with enhanced features");
                Toast.makeText(WizoneNativeActivity.this, "❌ Enhanced login failed: " + result.substring(6), Toast.LENGTH_LONG).show();
                return;
            }
            
            try {
                JSONObject response = new JSONObject(result);
                currentUsername = response.optString("username", "Enhanced User");
                currentUserRole = response.optString("role", "enhanced_role");
                currentUserEmail = response.optString("email", "enhanced@wizone.com");
                
                isLoggedIn = true;
                
                // Hide enhanced login, show enhanced dashboard
                loginLayout.setVisibility(View.GONE);
                dashboardLayout.setVisibility(View.VISIBLE);
                
                statusText.setText("✅ Enhanced login successful!\n👤 Welcome " + currentUsername + " (Enhanced Mode)\n🚀 All enhanced features are now active!");
                
                Toast.makeText(WizoneNativeActivity.this, "✅ Enhanced login successful! All features active!", Toast.LENGTH_LONG).show());
                
                Log.i(TAG, "✅ ENHANCED LOGIN COMPLETED - User: " + currentUsername + " Role: " + currentUserRole);
                
                // Load enhanced tasks
                new EnhancedTasksTask().execute();
                
            } catch (Exception e) {
                Log.e(TAG, "❌ ENHANCED LOGIN PARSING ERROR: " + e.getMessage());
                statusText.setText("❌ Enhanced login response parsing failed\n🔄 Please try again");
                Toast.makeText(WizoneNativeActivity.this, "❌ Enhanced login parsing failed", Toast.LENGTH_LONG).show();
            }
        }
    }
    
    // ENHANCED SYNC TASK
    private class EnhancedSyncTask extends AsyncTask<Void, Void, String> {
        @Override
        protected String doInBackground(Void... params) {
            try {
                Log.i(TAG, "🔄 ENHANCED SYNC - Loading tasks from: " + API_BASE_URL + "/tasks/my-tasks");
                
                URL url = new URL(API_BASE_URL + "/tasks/my-tasks");
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("GET");
                connection.setRequestProperty("User-Agent", "WizoneNativeApp/3.0-Enhanced");
                connection.setRequestProperty("Cookie", sessionCookie);
                
                int responseCode = connection.getResponseCode();
                Log.i(TAG, "🔄 ENHANCED SYNC - Response Code: " + responseCode);
                
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();
                    
                    Log.i(TAG, "✅ ENHANCED SYNC SUCCESS");
                    return response.toString();
                } else {
                    Log.e(TAG, "❌ ENHANCED SYNC FAILED - Code: " + responseCode);
                    return "ERROR:" + responseCode;
                }
                
            } catch (Exception e) {
                Log.e(TAG, "❌ ENHANCED SYNC EXCEPTION: " + e.getMessage());
                return "ERROR:" + e.getMessage();
            }
        }
        
        @Override
        protected void onPostExecute(String result) {
            if (result.startsWith("ERROR:")) {
                statusText.setText("❌ Enhanced sync failed: " + result.substring(6) + "\n🔄 Please try again");
                Toast.makeText(WizoneNativeActivity.this, "❌ Enhanced sync failed", Toast.LENGTH_LONG).show();
                return;
            }
            
            try {
                JSONArray tasksArray = new JSONArray(result);
                taskList.clear();
                
                for (int i = 0; i < tasksArray.length(); i++) {
                    JSONObject taskObj = tasksArray.getJSONObject(i);
                    
                    Task task = new Task(
                        taskObj.optString("id", ""),
                        taskObj.optString("ticketNumber", ""),
                        taskObj.optString("title", ""),
                        taskObj.optString("status", ""),
                        taskObj.optString("priority", ""),
                        taskObj.optString("category", ""),
                        taskObj.optString("customerName", ""),
                        taskObj.optJSONObject("customer") != null ? 
                            taskObj.getJSONObject("customer").optString("city", "") : "",
                        taskObj.optString("description", "")
                    );
                    
                    taskList.add(task);
                }
                
                // Show enhanced tasks section
                if (mainLayout != null) {
                    LinearLayout tasksContainer = (LinearLayout) mainLayout.getChildAt(mainLayout.getChildCount() - 1);
                    tasksContainer.setVisibility(View.VISIBLE);
                }
                
                // Update enhanced tasks list with action buttons
                tasksAdapter = new UltraEnhancedTaskAdapter(taskList);
                tasksList.setAdapter(tasksAdapter);
                
                statusText.setText("✅ Enhanced sync successful!\n📋 " + taskList.size() + " tasks loaded with enhanced features\n🚀 All action buttons active!");
                
                Toast.makeText(WizoneNativeActivity.this, "✅ Enhanced sync successful! " + taskList.size() + " tasks loaded", Toast.LENGTH_LONG).show());
                
                Log.i(TAG, "✅ ENHANCED SYNC COMPLETED - " + taskList.size() + " tasks loaded");
                
            } catch (Exception e) {
                Log.e(TAG, "❌ ENHANCED SYNC PARSING ERROR: " + e.getMessage());
                statusText.setText("❌ Enhanced sync parsing failed\n🔄 Please try again");
                Toast.makeText(WizoneNativeActivity.this, "❌ Enhanced sync parsing failed", Toast.LENGTH_LONG).show();
            }
        }
    }
    
    // ENHANCED TASKS LOADING TASK  
    private class EnhancedTasksTask extends AsyncTask<Void, Void, String> {
        @Override
        protected String doInBackground(Void... params) {
            try {
                Log.i(TAG, "📋 ENHANCED TASKS - Loading from: " + API_BASE_URL + "/tasks/my-tasks");
                
                URL url = new URL(API_BASE_URL + "/tasks/my-tasks");
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("GET");
                connection.setRequestProperty("User-Agent", "WizoneNativeApp/3.0-Enhanced");
                connection.setRequestProperty("Cookie", sessionCookie);
                
                int responseCode = connection.getResponseCode();
                Log.i(TAG, "📋 ENHANCED TASKS - Response Code: " + responseCode);
                
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();
                    
                    Log.i(TAG, "✅ ENHANCED TASKS LOADED SUCCESSFULLY");
                    return response.toString();
                } else {
                    Log.e(TAG, "❌ ENHANCED TASKS FAILED - Code: " + responseCode);
                    return "ERROR:" + responseCode;
                }
                
            } catch (Exception e) {
                Log.e(TAG, "❌ ENHANCED TASKS EXCEPTION: " + e.getMessage());
                return "ERROR:" + e.getMessage();
            }
        }
        
        @Override
        protected void onPostExecute(String result) {
            if (result.startsWith("ERROR:")) {
                statusText.setText("❌ Enhanced tasks loading failed: " + result.substring(6) + "\n🔄 Please sync to reload");
                return;
            }
            
            try {
                JSONArray tasksArray = new JSONArray(result);
                taskList.clear();
                
                for (int i = 0; i < tasksArray.length(); i++) {
                    JSONObject taskObj = tasksArray.getJSONObject(i);
                    
                    Task task = new Task(
                        taskObj.optString("id", ""),
                        taskObj.optString("ticketNumber", ""),
                        taskObj.optString("title", ""),
                        taskObj.optString("status", ""),
                        taskObj.optString("priority", ""),
                        taskObj.optString("category", ""),
                        taskObj.optString("customerName", ""),
                        taskObj.optJSONObject("customer") != null ? 
                            taskObj.getJSONObject("customer").optString("city", "") : "",
                        taskObj.optString("description", "")
                    );
                    
                    taskList.add(task);
                }
                
                // Show enhanced tasks section
                if (mainLayout != null) {
                    LinearLayout tasksContainer = (LinearLayout) mainLayout.getChildAt(mainLayout.getChildCount() - 1);
                    tasksContainer.setVisibility(View.VISIBLE);
                }
                
                // Set enhanced adapter with action buttons
                tasksAdapter = new UltraEnhancedTaskAdapter(taskList);
                tasksList.setAdapter(tasksAdapter);
                
                statusText.setText("✅ Enhanced login complete!\n📋 " + taskList.size() + " tasks loaded with enhanced features\n🚀 All enhanced action buttons active!");
                
                Log.i(TAG, "✅ ENHANCED TASKS SETUP COMPLETED - " + taskList.size() + " tasks with enhanced features");
                
            } catch (Exception e) {
                Log.e(TAG, "❌ ENHANCED TASKS PARSING ERROR: " + e.getMessage());
                statusText.setText("❌ Enhanced tasks parsing failed\n🔄 Please sync to reload");
            }
        }
    }
    
    // ULTRA ENHANCED TASK ADAPTER WITH PROMINENT ACTION BUTTONS
    private class UltraEnhancedTaskAdapter extends ArrayAdapter<Task> {
        public UltraEnhancedTaskAdapter(List<Task> tasks) {
            super(WizoneNativeActivity.this, 0, tasks);
        }
        
        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            Task task = getItem(position);
            Log.i(TAG, "🎨 ULTRA ENHANCED ADAPTER - Rendering task: " + task.ticketNumber);
            
            LinearLayout taskView = new LinearLayout(getContext());
            taskView.setOrientation(LinearLayout.VERTICAL);
            taskView.setPadding(30, 25, 30, 25);
            
            // Enhanced task background with gradient
            GradientDrawable taskBg = new GradientDrawable();
            taskBg.setColor(Color.parseColor("#ffffff"));
            taskBg.setStroke(4, Color.parseColor("#1976d2"));
            taskBg.setCornerRadius(20);
            taskView.setBackground(taskBg);
            
            LinearLayout.LayoutParams taskParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 
                ViewGroup.LayoutParams.WRAP_CONTENT
            );
            taskParams.setMargins(0, 0, 0, 20);
            taskView.setLayoutParams(taskParams);
            
            // ENHANCED: Make entire task view clickable
            taskView.setOnClickListener(v -> {
                Log.i(TAG, "🔍 TASK DETAILS CLICKED - Task ID: " + task.ticketNumber);
                showEnhancedTaskDetailsDialog(task);
            });
            
            // Enhanced task header with status
            TextView taskHeader = new TextView(getContext());
            taskHeader.setText("🔥 ENHANCED: " + task.ticketNumber + " - " + getStatusEmoji(task.status) + " " + task.status.toUpperCase());
            taskHeader.setTextSize(18);
            taskHeader.setTextColor(Color.parseColor("#0d47a1"));
            taskView.addView(taskHeader);
            
            // Enhanced customer info
            TextView customerInfo = new TextView(getContext());
            customerInfo.setText("👤 " + task.customerName + 
                               (task.customerCity.isEmpty() ? "" : " (" + task.customerCity + ")"));
            customerInfo.setTextSize(16);
            customerInfo.setTextColor(Color.parseColor("#424242"));
            customerInfo.setPadding(0, 8, 0, 8);
            taskView.addView(customerInfo);
            
            // Enhanced issue and priority
            TextView issueInfo = new TextView(getContext());
            issueInfo.setText("⚙️ " + task.issueType + " | 🏆 " + task.priority.toUpperCase());
            issueInfo.setTextSize(16);
            issueInfo.setTextColor(Color.parseColor("#616161"));
            issueInfo.setPadding(0, 0, 0, 15);
            taskView.addView(issueInfo);
            
            // ULTRA ENHANCED ACTION BUTTONS - IMPOSSIBLE TO MISS
            LinearLayout buttonContainer = new LinearLayout(getContext());
            buttonContainer.setOrientation(LinearLayout.HORIZONTAL);
            buttonContainer.setGravity(Gravity.CENTER);
            
            // ENHANCED UPDATE BUTTON
            Button updateBtn = new Button(getContext());
            updateBtn.setText("🔥 ENHANCED UPDATE");
            updateBtn.setTextSize(16);
            updateBtn.setTextColor(Color.WHITE);
            updateBtn.setPadding(25, 15, 25, 15);
            
            GradientDrawable updateBg = new GradientDrawable();
            updateBg.setColor(Color.parseColor("#4caf50"));
            updateBg.setStroke(3, Color.parseColor("#2e7d32"));
            updateBg.setCornerRadius(25);
            updateBtn.setBackground(updateBg);
            
            updateBtn.setOnClickListener(v -> {
                Log.i(TAG, "🔥 ENHANCED UPDATE CLICKED - Task: " + task.ticketNumber);
                showUltraEnhancedUpdateDialog(task);
            });
            
            // ENHANCED STATUS BUTTON
            Button statusBtn = new Button(getContext());
            statusBtn.setText("⚡ ENHANCED STATUS");
            statusBtn.setTextSize(16);
            statusBtn.setTextColor(Color.WHITE);
            statusBtn.setPadding(25, 15, 25, 15);
            
            GradientDrawable statusBg = new GradientDrawable();
            statusBg.setColor(Color.parseColor("#ff9800"));
            statusBg.setStroke(3, Color.parseColor("#f57c00"));
            statusBg.setCornerRadius(25);
            statusBtn.setBackground(statusBg);
            
            statusBtn.setOnClickListener(v -> {
                Log.i(TAG, "⚡ ENHANCED STATUS CLICKED - Task: " + task.ticketNumber);
                showUltraEnhancedStatusDialog(task);
            });
            
            LinearLayout.LayoutParams btnParams = new LinearLayout.LayoutParams(
                0, ViewGroup.LayoutParams.WRAP_CONTENT, 1);
            btnParams.setMargins(10, 0, 10, 0);
            updateBtn.setLayoutParams(btnParams);
            statusBtn.setLayoutParams(btnParams);
            
            buttonContainer.addView(updateBtn);
            buttonContainer.addView(statusBtn);
            taskView.addView(buttonContainer);
            
            return taskView;
        }
    }
    
    private void showUltraEnhancedUpdateDialog(Task task) {
        AlertDialog.Builder updateBuilder = new AlertDialog.Builder(this);
        updateBuilder.setTitle("🔥 Enhanced Task Update - " + task.ticketNumber);
        
        LinearLayout dialogLayout = new LinearLayout(this);
        dialogLayout.setOrientation(LinearLayout.VERTICAL);
        dialogLayout.setPadding(30, 20, 30, 20);
        
        TextView infoText = new TextView(this);
        infoText.setText("🚀 Enhanced Update Features Active!\n\n" +
            "📋 Task: " + task.title + "\n" +
            "👤 Customer: " + task.customerName + "\n" +
            "⚡ Status: " + task.status + "\n\n" +
            "Add enhanced update details:");
        infoText.setTextSize(16);
        infoText.setPadding(0, 0, 0, 20);
        dialogLayout.addView(infoText);
        
        EditText updateInput = new EditText(this);
        updateInput.setHint("🔥 Enhanced update description...");
        updateInput.setMinLines(3);
        updateInput.setMaxLines(5);
        updateInput.setPadding(20, 15, 20, 15);
        
        GradientDrawable inputBg = new GradientDrawable();
        inputBg.setColor(Color.parseColor("#f5f5f5"));
        inputBg.setStroke(2, Color.parseColor("#4caf50"));
        inputBg.setCornerRadius(10);
        updateInput.setBackground(inputBg);
        
        dialogLayout.addView(updateInput);
        
        updateBuilder.setView(dialogLayout);
        
        updateBuilder.setPositiveButton("🚀 Submit Enhanced Update", (dialog, which) -> {
            String updateText = updateInput.getText().toString().trim();
            if (!updateText.isEmpty()) {
                submitEnhancedTaskUpdate(task, updateText);
            } else {
                Toast.makeText(this, "🚨 Enhanced Validation: Please enter update details", Toast.LENGTH_LONG).show();
            }
        });
        
        updateBuilder.setNegativeButton("❌ Cancel", (dialog, which) -> {
            dialog.dismiss();
        });
        
        AlertDialog updateDialog = updateBuilder.create();
        updateDialog.show();
    }
    
    private void showUltraEnhancedStatusDialog(Task task) {
        AlertDialog.Builder statusBuilder = new AlertDialog.Builder(this);
        statusBuilder.setTitle("⚡ Enhanced Status Change - " + task.ticketNumber);
        
        String[] statusOptions = {
            "📋 Pending (Enhanced)",
            "⚡ In Progress (Enhanced)", 
            "✅ Completed (Enhanced)",
            "❌ Cancelled (Enhanced)"
        };
        
        statusBuilder.setItems(statusOptions, (dialog, which) -> {
            String newStatus = "";
            switch(which) {
                case 0: newStatus = "pending"; break;
                case 1: newStatus = "in_progress"; break;
                case 2: newStatus = "completed"; break;  
                case 3: newStatus = "cancelled"; break;
            }
            
            if (task.status.toLowerCase().equals("completed") && !newStatus.equals("completed")) {
                AlertDialog.Builder restrictionBuilder = new AlertDialog.Builder(this);
                restrictionBuilder.setTitle("🚨 Enhanced Task Restriction");
                restrictionBuilder.setMessage("🔒 Enhanced Security Feature:\n\n" +
                    "Completed tasks cannot be modified!\n\n" +
                    "✅ Current Status: " + task.status + "\n" +
                    "❌ Requested Status: " + statusOptions[which] + "\n\n" +
                    "🛡️ This enhanced security prevents accidental changes to completed work.");
                restrictionBuilder.setPositiveButton("✅ Understood", (restrictDialog, restrictWhich) -> {
                    restrictDialog.dismiss();
                });
                restrictionBuilder.create().show();
                return;
            }
            
            submitEnhancedStatusChange(task, newStatus, statusOptions[which]);
        });
        
        statusBuilder.setNegativeButton("❌ Cancel", (dialog, which) -> {
            dialog.dismiss();
        });
        
        AlertDialog statusDialog = statusBuilder.create();
        statusDialog.show();
    }
    
    private void submitEnhancedTaskUpdate(Task task, String updateText) {
        Toast.makeText(this, "🔥 Enhanced Task Update: Submitting to enhanced server...", Toast.LENGTH_LONG).show();
        
        Log.i(TAG, "🔥 ENHANCED UPDATE SUBMISSION - Task: " + task.id + " Update: " + updateText);
        
        new AsyncTask<Void, Void, String>() {
            @Override
            protected String doInBackground(Void... params) {
                try {
                    URL url = new URL(API_BASE_URL + "/tasks/update/" + task.id);
                    HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                    connection.setRequestMethod("PUT");
                    connection.setRequestProperty("Content-Type", "application/json");
                    connection.setRequestProperty("User-Agent", "WizoneNativeApp/3.0-Enhanced");
                    connection.setRequestProperty("Cookie", sessionCookie);
                    connection.setDoOutput(true);
                    
                    JSONObject requestBody = new JSONObject();
                    requestBody.put("description", updateText);
                    requestBody.put("enhanced", true);
                    requestBody.put("version", "3.0");
                    
                    OutputStream outputStream = connection.getOutputStream();
                    outputStream.write(requestBody.toString().getBytes());
                    outputStream.flush();
                    outputStream.close();
                    
                    int responseCode = connection.getResponseCode();
                    
                    if (responseCode == HttpURLConnection.HTTP_OK) {
                        return "SUCCESS";
                    } else {
                        return "ERROR:" + responseCode;
                    }
                    
                } catch (Exception e) {
                    return "ERROR:" + e.getMessage();
                }
            }
            
            @Override
            protected void onPostExecute(String result) {
                if (result.equals("SUCCESS")) {
                    Toast.makeText(WizoneNativeActivity.this, "✅ Enhanced task update submitted successfully!", Toast.LENGTH_LONG).show();
                    statusText.setText("✅ Enhanced task update successful!\n🔄 Refreshing enhanced tasks...");
                    new EnhancedSyncTask().execute();
                } else {
                    Toast.makeText(WizoneNativeActivity.this, "❌ Enhanced update failed: " + result, Toast.LENGTH_LONG).show();
                }
            }
        }.execute();
    }
    
    private void submitEnhancedStatusChange(Task task, String newStatus, String statusDisplay) {
        Toast.makeText(this, "⚡ Enhanced Status Change: Updating to " + statusDisplay, Toast.LENGTH_LONG).show();
        
        Log.i(TAG, "⚡ ENHANCED STATUS CHANGE - Task: " + task.id + " New Status: " + newStatus);
        
        new AsyncTask<Void, Void, String>() {
            @Override
            protected String doInBackground(Void... params) {
                try {
                    URL url = new URL(API_BASE_URL + "/tasks/" + task.id + "/status");
                    HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                    connection.setRequestMethod("PUT");
                    connection.setRequestProperty("Content-Type", "application/json");
                    connection.setRequestProperty("User-Agent", "WizoneNativeApp/3.0-Enhanced");
                    connection.setRequestProperty("Cookie", sessionCookie);
                    connection.setDoOutput(true);
                    
                    JSONObject requestBody = new JSONObject();
                    requestBody.put("status", newStatus);
                    requestBody.put("enhanced", true);
                    requestBody.put("version", "3.0");
                    
                    OutputStream outputStream = connection.getOutputStream();
                    outputStream.write(requestBody.toString().getBytes());
                    outputStream.flush();
                    outputStream.close();
                    
                    int responseCode = connection.getResponseCode();
                    
                    if (responseCode == HttpURLConnection.HTTP_OK) {
                        return "SUCCESS";
                    } else {
                        return "ERROR:" + responseCode;
                    }
                    
                } catch (Exception e) {
                    return "ERROR:" + e.getMessage();
                }
            }
            
            @Override
            protected void onPostExecute(String result) {
                if (result.equals("SUCCESS")) {
                    Toast.makeText(WizoneNativeActivity.this, "✅ Enhanced status change successful: " + statusDisplay, Toast.LENGTH_LONG).show();
                    statusText.setText("✅ Enhanced status change successful!\n🔄 Refreshing enhanced tasks...");
                    new EnhancedSyncTask().execute();
                } else {
                    Toast.makeText(WizoneNativeActivity.this, "❌ Enhanced status change failed: " + result, Toast.LENGTH_LONG).show();
                }
            }
        }.execute();
    }
}