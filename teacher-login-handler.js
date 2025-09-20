// Login form handlers and utilities
(function(){
    // Constants
    const REMEMBER_ME_KEY = 'teacherRememberMe';
    const REMEMBERED_USERNAME_KEY = 'teacherRememberedUsername';
    const REMEMBERED_INSTITUTION_KEY = 'teacherRememberedInstitution';

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
                if (savedUsername) document.getElementById('tname').value = savedUsername;
                if (savedInstitution) document.getElementById('tinstitution').value = savedInstitution;
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
                    name: 'Guest Teacher',
                    institution: 'Guest Institution',
                    email: 'guest@example.com',
                    isGuest: true,
                    role: 'teacher'
                };
                saveTeacherProfile(guestProfile);
                goToDashboard();
            });
        }
    }

    // Forgot password handler
    function initForgotPassword() {
        const forgotPasswordBtn = document.getElementById('forgot-password');
        if (forgotPasswordBtn) {
            forgotPasswordBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                const email = document.getElementById('email').value.trim();
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
                    if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
                        var projectId = (window && window.AURRAA && window.AURRAA.firebaseApp && 
                                        window.AURRAA.firebaseApp.options && 
                                        window.AURRAA.firebaseApp.options.projectId) ? 
                                        window.AURRAA.firebaseApp.options.projectId : null;
                        var consoleLink = projectId ? 
                            ('https://console.firebase.google.com/project/' + projectId + '/authentication/providers') : 
                            'https://console.firebase.google.com/';
                        var friendly = 'Firebase permission denied. This usually means the Firebase security rules are too restrictive.\n' +
                            'Please update your Firebase security rules to allow read/write access.\n' +
                            'Open: ' + consoleLink;
                        showError(friendly);
                    } else {
                        showError('Error: ' + (error.message || 'Could not send reset email'));
                    }
                } finally {
                    hideLoading();
                }
            });
        }
    }

    // Main login form handler
    function initLoginForm() {
        const loginForm = document.querySelector('#teacher-login-form');
        if (!loginForm) return;

        loginForm.addEventListener('submit', async function(ev){
            ev.preventDefault();
            hideError();

            const name = (loginForm.querySelector('#tname').value || '').trim();
            const institution = (loginForm.querySelector('#tinstitution').value || '').trim();
            const email = (loginForm.querySelector('#email').value || '').trim();
            const password = loginForm.querySelector('#password').value || '';

            if (!name || !institution || !email || !password) {
                showError('Please fill in all fields');
                return;
            }

            showLoading();

            try {
                if (window.AURRAA && window.AURRAA.signIn) {
                    // Determine if username is an email
                    const emailToUse = email.includes('@') ? email : null;
                    
                    if (!emailToUse) {
                        // Try to find email for username
                        if (window.AURRAA.getAllUsers) {
                            try {
                                const users = await window.AURRAA.getAllUsers();
                                const matchingUser = users.find(u => 
                                    u.username && u.username.toLowerCase() === email.toLowerCase() &&
                                    u.institution && u.institution.toLowerCase() === institution.toLowerCase()
                                );
                                if (matchingUser && matchingUser.email) {
                                    await window.AURRAA.signIn(matchingUser.email, password);
                                    saveRememberMe(name, institution);
                                    goToDashboard();
                                    return;
                                }
                            } catch (usersError) {
                                console.error('Error getting users:', usersError);
                            }
                        }
                        throw new Error('Username not found. Please use your email address or sign up.');
                    }

                    // Try direct signin with email
                    const result = await window.AURRAA.signIn(emailToUse, password);
                    
                    // Get user data from Firestore
                    let userData = null;
                    if (window.AURRAA.getUserData) {
                        try {
                            userData = await window.AURRAA.getUserData(result.user.uid);
                        } catch (userDataError) {
                            console.error('Error getting user data from Firestore:', userDataError);
                            // If we can't get user data from Firestore, we'll create a minimal profile
                            userData = {
                                name: name,
                                institution: institution,
                                email: email,
                                role: 'teacher'
                            };
                        }
                    }
                    
                    // Verify name and institution match
                    if (userData && 
                        userData.name === name && 
                        userData.institution === institution &&
                        userData.role === 'teacher') {
                        
                        // Save profile with UID
                        saveTeacherProfile({
                            ...userData,
                            uid: result.user.uid
                        });
                        
                        saveRememberMe(name, institution);
                        goToDashboard();
                        return;
                    } else {
                        // Sign out if profile doesn't match
                        if (window.AURRAA.signOut) {
                            await window.AURRAA.signOut();
                        }
                        
                        var msg = 'Invalid credentials. The name or institution does not match our records.';
                        showError(msg);
                        return;
                    }
                } else {
                    // Fallback to local storage
                    const profile = getTeacherProfile();
                    if (!profile) {
                        throw new Error('No account found. Please sign up first.');
                    }

                    const instMatch = (profile.institution || '').toLowerCase() === institution.toLowerCase();
                    const usernameMatch = (profile.username || '').toLowerCase() === email.toLowerCase() ||
                                        (profile.email || '').toLowerCase() === email.toLowerCase();
                    const pwMatch = profile.password === password;

                    if (instMatch && usernameMatch && pwMatch) {
                        saveRememberMe(name, institution);
                        goToDashboard();
                    } else {
                        throw new Error('Invalid credentials');
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                
                if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
                    var projectId = (window && window.AURRAA && window.AURRAA.firebaseApp && 
                                    window.AURRAA.firebaseApp.options && 
                                    window.AURRAA.firebaseApp.options.projectId) ? 
                                    window.AURRAA.firebaseApp.options.projectId : null;
                    var consoleLink = projectId ? 
                        ('https://console.firebase.google.com/project/' + projectId + '/firestore/rules') : 
                        'https://console.firebase.google.com/';
                    var friendly = 'Firebase permission denied. This usually means the Firestore security rules are too restrictive.\n' +
                        'Please update your Firestore security rules to allow read/write access.\n' +
                        'Open: ' + consoleLink;
                    showError(friendly);
                } else {
                    showError(error.message || 'Login failed. Please check your credentials.');
                }
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