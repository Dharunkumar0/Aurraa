// Enhanced login functionality with better error handling
(function() {
    // Helper functions for UI
    function showError(message, details = '') {
        console.error('Login error:', { message, details });
        const errorContainer = document.querySelector('.error-message');
        const errorText = errorContainer?.querySelector('.error-text');
        const errorDetails = errorContainer?.querySelector('.error-details');
        
        if (errorContainer && errorText) {
            errorText.textContent = message;
            errorContainer.style.display = 'block';
            
            if (errorDetails && details) {
                errorDetails.textContent = details;
                errorDetails.style.display = 'block';
            }
        } else {
            alert(message + (details ? '\n\n' + details : ''));
        }
    }

    function hideError() {
        const errorContainer = document.querySelector('.error-message');
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }

    function showLoading() {
        const btn = document.querySelector('button[type="submit"]');
        const spinner = btn?.querySelector('.loading-spinner');
        const text = btn?.querySelector('.button-text');
        
        if (btn) btn.disabled = true;
        if (spinner) spinner.classList.remove('hidden');
        if (text) text.textContent = 'Logging in...';
    }

    function hideLoading() {
        const btn = document.querySelector('button[type="submit"]');
        const spinner = btn?.querySelector('.loading-spinner');
        const text = btn?.querySelector('.button-text');
        
        if (btn) btn.disabled = false;
        if (spinner) spinner.classList.add('hidden');
        if (text) text.textContent = 'Login — Let\'s go!';
    }

    // Enhanced error handler
    function handleLoginError(error) {
        console.error('Login error:', {
            code: error.code,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        let userMessage = 'Login failed. Please check your credentials.';
        let details = '';

        if (error.code) {
            switch (error.code) {
                case 'auth/invalid-email':
                    userMessage = 'Please enter a valid email address.';
                    details = 'Example format: user@example.com';
                    break;
                case 'auth/user-not-found':
                    userMessage = 'No account found with these credentials.';
                    details = 'Please check your email/username or sign up for a new account.';
                    break;
                case 'auth/wrong-password':
                    userMessage = 'Incorrect password.';
                    details = 'Please try again or use the forgot password link.';
                    break;
                case 'auth/too-many-requests':
                    userMessage = 'Too many failed attempts.';
                    details = 'Please try again later or reset your password.';
                    break;
                case 'auth/network-request-failed':
                    userMessage = 'Network error.';
                    details = 'Please check your internet connection and try again.';
                    break;
                case 'auth/configuration-not-found':
                    userMessage = 'Authentication service unavailable.';
                    details = 'Please try again later or contact support.';
                    break;
                default:
                    if (error.message.includes('username')) {
                        userMessage = 'Username not found.';
                        details = 'Please use your email address or check if the username is correct.';
                    }
            }
        }

        showError(userMessage, details);
    }

    // Attach to login form
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(ev) {
            ev.preventDefault();
            hideError();
            showLoading();

            try {
                const username = loginForm.querySelector('#username').value.trim();
                const password = loginForm.querySelector('#password').value;

                if (!username || !password) {
                    throw new Error('Please fill in all fields');
                }

                // Log login attempt (without sensitive data)
                console.log('Login attempt:', {
                    username: username,
                    hasPassword: !!password,
                    timestamp: new Date().toISOString(),
                    firebaseAvailable: !!(window.AURRAA && window.AURRAA.signIn)
                });

                if (window.AURRAA && window.AURRAA.signIn) {
                    try {
                        const result = await window.AURRAA.signIn(username, password);
                        console.log('Login successful:', {
                            uid: result.user.uid,
                            email: result.user.email,
                            emailVerified: result.user.emailVerified
                        });
                        
                        // Update local profile if needed
                        if (window.AURRAA.getUserData) {
                            const userData = await window.AURRAA.getUserData(result.user.uid);
                            if (userData) {
                                localStorage.setItem('studentProfile', JSON.stringify({
                                    ...userData,
                                    uid: result.user.uid
                                }));
                            }
                        }

                        // Redirect on success
                        window.location.href = 'ncret-grade.html';
                    } catch (error) {
                        handleLoginError(error);
                    }
                } else {
                    // Fallback to local storage auth
                    const profile = JSON.parse(localStorage.getItem('studentProfile') || 'null');
                    if (!profile) {
                        throw new Error('No account found. Please sign up first.');
                    }

                    const usernameMatch = (profile.username || '').toLowerCase() === username.toLowerCase() ||
                                        (profile.email || '').toLowerCase() === username.toLowerCase();
                    const pwMatch = profile.password === password;

                    if (usernameMatch && pwMatch) {
                        window.location.href = 'ncret-grade.html';
                    } else {
                        throw new Error('Invalid credentials');
                    }
                }
            } catch (error) {
                handleLoginError(error);
            } finally {
                hideLoading();
            }
        });
    }
})();