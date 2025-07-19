package com.wizone.native;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.graphics.Color;

public class TaskActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        ScrollView scrollView = new ScrollView(this);
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setBackgroundColor(Color.parseColor("#f8fafc"));
        layout.setPadding(40, 60, 40, 40);
        
        TextView title = new TextView(this);
        title.setText("📋 Task Management");
        title.setTextSize(24);
        title.setTextColor(Color.parseColor("#1e40af"));
        title.setPadding(0, 0, 0, 40);
        
        TextView tasks = new TextView(this);
        tasks.setText(
            "Active Tasks:\n\n" +
            "🔧 Server Maintenance - Priority: High\n" +
            "Status: In Progress\n" +
            "Assigned: Field Engineer\n\n" +
            
            "💻 Software Update - Priority: Medium\n" +
            "Status: Pending\n" +
            "Assigned: Backend Engineer\n\n" +
            
            "📞 Customer Support Call - Priority: Low\n" +
            "Status: Completed\n" +
            "Assigned: Support Team\n\n" +
            
            "🌐 Website Optimization - Priority: High\n" +
            "Status: In Review\n" +
            "Assigned: Web Developer"
        );
        tasks.setTextSize(14);
        tasks.setTextColor(Color.parseColor("#374151"));
        tasks.setLineSpacing(8, 1);
        
        layout.addView(title);
        layout.addView(tasks);
        scrollView.addView(layout);
        setContentView(scrollView);
    }
}