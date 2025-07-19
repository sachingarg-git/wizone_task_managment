package com.wizone.native;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.LinearLayout;
import android.graphics.Color;
import android.view.ViewGroup.LayoutParams;

public class MainActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Create main layout
        LinearLayout mainLayout = new LinearLayout(this);
        mainLayout.setOrientation(LinearLayout.VERTICAL);
        mainLayout.setBackgroundColor(Color.parseColor("#f8fafc"));
        mainLayout.setPadding(40, 60, 40, 40);
        
        // Title
        TextView title = new TextView(this);
        title.setText("Wizone IT Support Portal");
        title.setTextSize(24);
        title.setTextColor(Color.parseColor("#1e40af"));
        title.setPadding(0, 0, 0, 40);
        
        // Welcome message
        TextView welcome = new TextView(this);
        welcome.setText("Welcome to Wizone IT Support\nComplete Task Management System");
        welcome.setTextSize(16);
        welcome.setTextColor(Color.parseColor("#374151"));
        welcome.setPadding(0, 0, 0, 60);
        
        // Task Management Button
        Button taskBtn = createButton("📋 Task Management", "#2563eb");
        taskBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                startActivity(new Intent(MainActivity.this, TaskActivity.class));
            }
        });
        
        // Customer Portal Button  
        Button customerBtn = createButton("👥 Customer Portal", "#059669");
        customerBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                startActivity(new Intent(MainActivity.this, CustomerActivity.class));
            }
        });
        
        // Analytics Button
        Button analyticsBtn = createButton("📊 Analytics Dashboard", "#7c3aed");
        
        // Settings Button
        Button settingsBtn = createButton("⚙️ Settings", "#6b7280");
        settingsBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                startActivity(new Intent(MainActivity.this, SettingsActivity.class));
            }
        });
        
        // Web Version Button
        Button webBtn = createButton("🌐 Open Web Version", "#dc2626");
        
        // Add views to layout
        mainLayout.addView(title);
        mainLayout.addView(welcome);
        mainLayout.addView(taskBtn);
        mainLayout.addView(customerBtn);
        mainLayout.addView(analyticsBtn);
        mainLayout.addView(settingsBtn);
        mainLayout.addView(webBtn);
        
        setContentView(mainLayout);
    }
    
    private Button createButton(String text, String color) {
        Button btn = new Button(this);
        btn.setText(text);
        btn.setTextColor(Color.WHITE);
        btn.setBackgroundColor(Color.parseColor(color));
        btn.setPadding(30, 25, 30, 25);
        btn.setTextSize(16);
        
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
            LayoutParams.MATCH_PARENT, 
            LayoutParams.WRAP_CONTENT
        );
        params.setMargins(0, 0, 0, 20);
        btn.setLayoutParams(params);
        
        return btn;
    }
}