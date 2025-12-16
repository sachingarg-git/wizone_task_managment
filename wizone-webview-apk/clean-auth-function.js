        async function handleLogin(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const loginBtn = document.getElementById('loginBtn');
            
            if (!username || !password) {
                showErrorMessage('Please enter both username and password');
                return;
            }
            
            console.log('🎯 PRODUCTION DATABASE ONLY - Attempting login for:', username);
            console.log('🔗 Target server:', currentApiUrl);
            
            loginBtn.innerHTML = '🔄 Connecting to Database...';
            loginBtn.disabled = true;
            
            try {
                const response = await fetch(`${currentApiUrl}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'mobile',
                        'X-Mobile-App': 'true'
                    },
                    body: JSON.stringify({ username, password }),
                    credentials: 'include'
                });
                
                console.log('🌐 Server response status:', response.status);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Authentication response:', result);
                    
                    // Only accept actual database responses
                    if (result && (result.id || result.username)) {
                        // Create user object based on actual database schema
                        currentUser = {
                            id: result.id,
                            username: result.username,
                            firstName: result.firstName || result.first_name,
                            lastName: result.lastName || result.last_name,
                            email: result.email, // Use actual database email, no fallback
                            role: result.role,
                            department: result.department,
                            isActive: result.active,
                            token: result.token,
                            databaseAuth: true
                        };
                        
                        // Save to localStorage
                        localStorage.setItem('wizoneUser', JSON.stringify(currentUser));
                        
                        console.log('✅ DATABASE USER AUTHENTICATED:', currentUser);
                        showSuccessMessage(`✅ Welcome ${currentUser.firstName}! Connected to production database.`);
                        
                        setTimeout(() => {
                            showDashboard();
                            loadDashboardData();
                            loginBtn.innerHTML = '🔑 Login to Dashboard';
                            loginBtn.disabled = false;
                        }, 1500);
                        
                        return;
                    } else {
                        throw new Error('Invalid server response format');
                    }
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Authentication failed');
                }
                
            } catch (error) {
                console.log('❌ DATABASE AUTHENTICATION FAILED:', error.message);
                console.log('🚫 NO FALLBACK AUTHENTICATION - Database connection required');
                
                showErrorMessage(`❌ Authentication failed: Cannot connect to production database at ${currentApiUrl}. Please verify your credentials and server connection.`);
                
                loginBtn.innerHTML = '🔑 Login to Dashboard';
                loginBtn.disabled = false;
                return;
            }
        }