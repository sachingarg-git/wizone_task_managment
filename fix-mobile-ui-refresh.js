// Fix mobile APK UI refresh after task status updates

const fixMobileUIRefresh = () => {
  console.log('🔧 Fixing mobile UI refresh for task status updates...');
  
  // Add JavaScript to mobile-app.html to handle UI refresh
  const mobileRefreshScript = `
    <script>
    // Mobile APK UI Refresh Handler
    window.mobileTaskRefresh = {
      // Force refresh task list after status update
      refreshTaskList: function() {
        console.log('🔄 Refreshing mobile task list...');
        
        // Try to refresh iframe content
        const iframe = document.getElementById('webviewFrame');
        if (iframe && iframe.contentWindow) {
          try {
            // Trigger task list refresh in iframe
            iframe.contentWindow.postMessage({
              type: 'REFRESH_TASKS',
              timestamp: Date.now()
            }, '*');
            
            // Also try to reload specific elements
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (iframeDoc) {
              // Refresh task cards/list
              const taskElements = iframeDoc.querySelectorAll('.task-card, .task-item, [data-task-id]');
              taskElements.forEach(el => {
                el.style.opacity = '0.5';
                setTimeout(() => {
                  el.style.opacity = '1';
                  // Trigger re-render
                  el.dispatchEvent(new Event('refresh'));
                }, 200);
              });
              
              // Force page refresh if needed
              setTimeout(() => {
                iframe.contentWindow.location.reload();
              }, 1000);
            }
          } catch (error) {
            console.log('Cross-origin refresh fallback - full reload');
            iframe.src = iframe.src;
          }
        }
      },
      
      // Show success message after update
      showUpdateSuccess: function(taskId, newStatus) {
        console.log(\`✅ Task \${taskId} updated to \${newStatus}\`);
        
        // Create success notification
        const notification = document.createElement('div');
        notification.innerHTML = \`
          <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 9999;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
          ">
            ✅ Task status updated to \${newStatus}
          </div>
          <style>
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          </style>
        \`;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
          notification.remove();
        }, 3000);
        
        // Refresh task list
        this.refreshTaskList();
      },
      
      // Handle task update from mobile UI
      updateTaskStatus: async function(taskId, newStatus, note = '') {
        console.log(\`📱 Updating task \${taskId} to \${newStatus}...\`);
        
        try {
          const response = await fetch(\`/api/tasks/\${taskId}/field-status\`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'WizoneFieldEngineerApp/1.0 (Mobile)',
              'X-Requested-With': 'mobile'
            },
            body: JSON.stringify({
              status: newStatus,
              note: note
            })
          });
          
          if (response.ok) {
            const updatedTask = await response.json();
            console.log(\`✅ Task update successful:\`, updatedTask);
            
            // Show success and refresh UI
            this.showUpdateSuccess(taskId, newStatus);
            
            return updatedTask;
          } else {
            throw new Error(\`Failed to update task: \${response.status}\`);
          }
        } catch (error) {
          console.error('❌ Task update failed:', error);
          
          // Show error notification
          const errorNotification = document.createElement('div');
          errorNotification.innerHTML = \`
            <div style="
              position: fixed;
              top: 20px;
              right: 20px;
              background: #ef4444;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              z-index: 9999;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 14px;
            ">
              ❌ Failed to update task status
            </div>
          \`;
          
          document.body.appendChild(errorNotification);
          setTimeout(() => errorNotification.remove(), 3000);
          
          throw error;
        }
      }
    };
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
      console.log('🔄 Auto-refreshing mobile task list...');
      window.mobileTaskRefresh.refreshTaskList();
    }, 30000);
    
    // Listen for messages from iframe
    window.addEventListener('message', function(event) {
      if (event.data.type === 'TASK_UPDATE') {
        console.log('📱 Received task update message:', event.data);
        window.mobileTaskRefresh.refreshTaskList();
      }
    });
    
    console.log('✅ Mobile UI refresh handler initialized');
    </script>
  `;
  
  return mobileRefreshScript;
};

console.log('Mobile UI refresh fix prepared');
console.log('This script will be injected into mobile-app.html');