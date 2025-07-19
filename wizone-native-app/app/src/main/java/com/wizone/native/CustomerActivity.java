package com.wizone.native;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.graphics.Color;

public class CustomerActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        ScrollView scrollView = new ScrollView(this);
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setBackgroundColor(Color.parseColor("#f8fafc"));
        layout.setPadding(40, 60, 40, 40);
        
        TextView title = new TextView(this);
        title.setText("👥 Customer Portal");
        title.setTextSize(24);
        title.setTextColor(Color.parseColor("#059669"));
        title.setPadding(0, 0, 0, 40);
        
        TextView customers = new TextView(this);
        customers.setText(
            "Customer List:\n\n" +
            "🏢 ABC Corporation\n" +
            "Plan: Enterprise\n" +
            "Status: Active\n" +
            "Last Contact: 2 days ago\n\n" +
            
            "🏪 XYZ Business\n" +
            "Plan: Professional\n" +
            "Status: Active\n" +
            "Last Contact: 1 week ago\n\n" +
            
            "🏭 Tech Solutions Ltd\n" +
            "Plan: Basic\n" +
            "Status: Pending\n" +
            "Last Contact: 3 days ago\n\n" +
            
            "🌟 Digital Services\n" +
            "Plan: Premium\n" +
            "Status: Active\n" +
            "Last Contact: Today"
        );
        customers.setTextSize(14);
        customers.setTextColor(Color.parseColor("#374151"));
        customers.setLineSpacing(8, 1);
        
        layout.addView(title);
        layout.addView(customers);
        scrollView.addView(layout);
        setContentView(scrollView);
    }
}