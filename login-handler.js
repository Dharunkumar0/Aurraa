// Login form handlers and utilities
(function(){
    // Constants
    const REMEMBER_ME_KEY = 'rememberMe';
    const REMEMBERED_USERNAME_KEY = 'rememberedUsername';
    const REMEMBERED_INSTITUTION_KEY = 'rememberedInstitution';

    // Helper functions
    function showError(message) {
        const errorDiv = document.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        } else {
            alert(message);
        }
    }

    function hideError() {
        const errorDiv = document.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    function showLoading() {
        const submitBtn = document.querySelector('.login-form button[type="submit"]');
        const loadingSpinner = submitBtn.querySelector('.loading-spinner');
        if (submitBtn) submitBtn.disabled = true;
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    }

    function hideLoading() {
        const submitBtn = document.querySelector('.login-form button[type="submit"]');
        const loadingSpinner = submitBtn.querySelector('.loading-spinner');
        if (submitBtn) submitBtn.disabled = false;
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
    }

    // Remember me functionality
    function initRememberMe() {
        const rememberMe = document.getElementById('remember-me');
        if (rememberMe) {
            const remembered = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
            rememberMe.checked = remembered;
            if (remembered) {
                const savedUsername = localStorage.getItem(REMEMBERED_USERNAME_KEY);
                const savedInstitution = localStorage.getItem(REMEMBERED_INSTITUTION_KEY);
                if (savedUsername) document.getElementById('username').value = savedUsername;
                if (savedInstitution) document.getElementById('institution').value = savedInstitution;
            }
        }
    }

    function saveRememberMe(username, institution) {
        const rememberMe = document.getElementById('remember-me');
        if (rememberMe && rememberMe.checked) {
            localStorage.setItem(REMEMBER_ME_KEY, 'true');
            localStorage.setItem(REMEMBERED_USERNAME_KEY, username);
            localStorage.setItem(REMEMBERED_INSTITUTION_KEY, institution);
        } else {
            localStorage.removeItem(REMEMBER_ME_KEY);
            localStorage.removeItem(REMEMBERED_USERNAME_KEY);
            localStorage.removeItem(REMEMBERED_INSTITUTION_KEY);
        }
    }

    // Guest login handler
    function initGuestLogin() {
        const guestLoginBtn = document.getElementById('guest-login');
        if (guestLoginBtn) {
            guestLoginBtn.addEventListener('click', function() {
                const guestProfile = {
                    fullName: 'Guest User',
                    institution: 'Guest',
                    username: 'guest_' + Math.random().toString(36).substring(2, 8),
                    email: null,
                    isGuest: true
                };
                saveStudentProfile(guestProfile);
                goToGradeSelection();
            });
        }
    }

    // Forgot password handler
    function initForgotPassword() {
        const forgotPasswordBtn = document.getElementById('forgot-password');
        if (forgotPasswordBtn) {
            forgotPasswordBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                const email = document.getElementById('username').value.trim();
                if (!email || email.indexOf('@') === -1) {
                    showError('Please enter your email address to reset your password');
                    return;
                }
                
                try {
                    showLoading();
                    if (window.AURRAA && window.AURRAA.auth && window.AURRAA.auth.sendPasswordResetEmail) {
                        await window.AURRAA.auth.sendPasswordResetEmail(email);
                        alert('Password reset email sent! Please check your inbox.');
                    } else {
                        throw new Error('Password reset not available');
                    }
                } catch (error) {
                    showError('Error: ' + (error.message || 'Could not send reset email'));
                } finally {
                    hideLoading();
                }
            });
        }
    }

    // Main login form handler
    function initLoginForm() {
        const loginForm = document.querySelector('.login-form');
        if (!loginForm) return;

        loginForm.addEventListener('submit', async function(ev) {
            ev.preventDefault();
            hideError();

            const institution = (loginForm.querySelector('#institution').value || '').trim();
            const username = (loginForm.querySelector('#username').value || '').trim();
            const password = loginForm.querySelector('#password').value || '';

            if (!institution || !username || !password) {
                showError('Please fill in all fields');
                return;
            }

            showLoading();

            try {
                if (window.AURRAA && window.AURRAA.signIn) {
                    // Determine if username is an email
                    const emailToUse = username.includes('@') ? username : null;
                    
                    if (!emailToUse) {
                        // Try to find email for username
                        if (window.AURRAA.getAllUsers) {
                            const users = await window.AURRAA.getAllUsers();
                            const matchingUser = users.find(u => 
                                u.username && u.username.toLowerCase() === username.toLowerCase() &&
                                u.institution && u.institution.toLowerCase() === institution.toLowerCase()
                            );
                            if (matchingUser && matchingUser.email) {
                                await window.AURRAA.signIn(matchingUser.email, password);
                                saveRememberMe(username, institution);
                                goToGradeSelection();
                                return;
                            }
                        }
                        throw new Error('Username not found. Please use your email address or sign up.');
                    }

                    // Try direct signin with email
                    await window.AURRAA.signIn(emailToUse, password);
                    saveRememberMe(username, institution);
                    goToGradeSelection();
                } else {
                    // Fallback to local storage
                    const profile = getStudentProfile();
                    if (!profile) {
                        throw new Error('No account found. Please sign up first.');
                    }

                    const instMatch = (profile.institution || '').toLowerCase() === institution.toLowerCase();
                    const usernameMatch = (profile.username || '').toLowerCase() === username.toLowerCase() ||
                                        (profile.email || '').toLowerCase() === username.toLowerCase();
                    const pwMatch = profile.password === password;

                    if (instMatch && usernameMatch && pwMatch) {
                        saveRememberMe(username, institution);
                        goToGradeSelection();
                    } else {
                        throw new Error('Invalid credentials');
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                showError(error.message || 'Login failed. Please check your credentials.');
            } finally {
                hideLoading();
            }
        });
    }

    // Initialize all functionality
    function init() {
        initRememberMe();
        initGuestLogin();
        initForgotPassword();
        initLoginForm();
    }

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();