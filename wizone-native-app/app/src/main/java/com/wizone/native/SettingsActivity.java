package com.wizone.native;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.LinearLayout;
import android.graphics.Color;

public class SettingsActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setBackgroundColor(Color.parseColor("#f8fafc"));
        layout.setPadding(40, 60, 40, 40);
        
        TextView title = new TextView(this);
        title.setText("⚙️ Settings");
        title.setTextSize(24);
        title.setTextColor(Color.parseColor("#6b7280"));
        title.setPadding(0, 0, 0, 40);
        
        TextView settings = new TextView(this);
        settings.setText(
            "App Settings:\n\n" +
            "📱 Version: 1.0.0\n" +
            "🔗 Server: Connected\n" +
            "👤 User: Admin\n" +
            "🌐 Language: Hindi/English\n" +
            "🔔 Notifications: Enabled\n" +
            "📊 Analytics: Active\n\n" +
            
            "About Wizone IT Support Portal:\n" +
            "Complete task management system\n" +
            "for IT support operations."
        );
        settings.setTextSize(14);
        settings.setTextColor(Color.parseColor("#374151"));
        settings.setLineSpacing(8, 1);
        
        layout.addView(title);
        layout.addView(settings);
        setContentView(layout);
    }
}