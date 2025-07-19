package com.wizoneit.supportportal;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import android.content.Intent;
import android.net.Uri;

public class MainActivity extends Activity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        TextView titleText = findViewById(R.id.titleText);
        TextView subtitleText = findViewById(R.id.subtitleText);
        Button taskBtn = findViewById(R.id.taskBtn);
        Button customerBtn = findViewById(R.id.customerBtn);
        Button analyticsBtn = findViewById(R.id.analyticsBtn);
        Button webBtn = findViewById(R.id.webBtn);
        
        titleText.setText("Wizone IT Support Portal");
        subtitleText.setText("विज़ोन आईटी सपोर्ट पोर्टल");
        
        taskBtn.setOnClickListener(v -> showTaskInfo());
        customerBtn.setOnClickListener(v -> showCustomerInfo());
        analyticsBtn.setOnClickListener(v -> showAnalytics());
        webBtn.setOnClickListener(v -> openWebPortal());
    }
    
    private void showTaskInfo() {
        Toast.makeText(this, "📋 Task Management\n\n🔧 सर्वर रखरखाव - उच्च प्राथमिकता\n💻 सॉफ्टवेयर अपडेट - प्रगति में\n📞 ग्राहक सहायता - पूर्ण", Toast.LENGTH_LONG).show();
    }
    
    private void showCustomerInfo() {
        Toast.makeText(this, "👥 Customer Portal\n\n🏢 ABC Corporation - Enterprise\n🏪 XYZ Business - Professional\n💼 Tech Solutions - Basic", Toast.LENGTH_LONG).show();
    }
    
    private void showAnalytics() {
        Toast.makeText(this, "📊 Analytics Dashboard\n\n📈 कार्य पूर्णता दर: 85%\n⭐ ग्राहक संतुष्टि: 4.2/5\n⏱️ प्रतिक्रिया समय: 2.3 घंटे", Toast.LENGTH_LONG).show();
    }
    
    private void openWebPortal() {
        String url = "https://299f0612-89c3-4a4f-9a65-3dd9be12e804-00-3u4fqy7m2q8tl.picard.replit.dev";
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setData(Uri.parse(url));
        startActivity(intent);
    }
}