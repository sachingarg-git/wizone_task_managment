package com.wizone.mobile;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.AsyncTask;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class WizoneNativeActivityEnhanced extends WizoneNativeActivity {

    private static final String TAG = "WizoneNativeActivityEnhanced";

    /**
     * Enhanced update dialog that combines both status change dropdown and notes input
     * 
     * @param task The task to update
     */
    @Override
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
            new UpdateTaskTask().execute(task.id, "notes", notes);
            Toast.makeText(this, "🔄 Updating task notes...", Toast.LENGTH_SHORT).show();
        });
        
        builder.setNegativeButton("❌ Cancel", null);
        builder.show();
    }
}