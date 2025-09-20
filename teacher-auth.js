// Lightweight localStorage-based teacher auth and routing with Firebase integration
// Keys
var TEACHER_PROFILE_KEY = 'teacherProfile';

function getTeacherProfile() {
    try {
        var raw = localStorage.getItem(TEACHER_PROFILE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function saveTeacherProfile(profile) {
    localStorage.setItem(TEACHER_PROFILE_KEY, JSON.stringify(profile));
}

function isTeacherSignedIn() {
    return !!getTeacherProfile();
}

function goToDashboard() {
    window.location.href = 'teacher-dashboard.html';
}

function goToTeacherLogin() {
    window.location.href = 'teacher-login.html';
}

// Attach to signup form (supports Firebase via window.AURRAA.signUp when available)
(function(){
    var signupForm = document.querySelector('#teacher-signup-form');
    if (!signupForm) return;

    signupForm.addEventListener('submit', async function(ev){
        ev.preventDefault();
        var name = signupForm.querySelector('[name="name"]').value.trim();
        var institution = signupForm.querySelector('[name="institution"]').value.trim();
        var email = signupForm.querySelector('[name="email"]').value.trim();
        var password = signupForm.querySelector('[name="password"]').value;
        if (!name || !institution || !email || !password) return;

        var profile = { 
            name: name, 
            institution: institution, 
            email: email,
            role: 'teacher' // Explicitly set role
        };

        // If Firebase is available, create account there and save profile in Firestore
        if (window.AURRAA && typeof window.AURRAA.signUp === 'function') {
            try {
                var res = await window.AURRAA.signUp(email, password, profile);
                // signUp helper should have created user and saved profile in DB
                saveTeacherProfile(Object.assign({}, profile, { uid: res.user && res.user.uid ? res.user.uid : null }));
                goToDashboard();
            } catch (err) {
                console.error('SignUp error', err);
                var rawMessage = err && (err.code || err.message) ? (err.code || err.message) : 'Sign up failed';

                // Special-case CONFIGURATION_NOT_FOUND to give actionable guidance
                var isConfigMissing = false;
                try { 
                    isConfigMissing = (String(err && err.message || '').indexOf('CONFIGURATION_NOT_FOUND') !== -1) || 
                                    (String(err && err.code || '').indexOf('CONFIGURATION_NOT_FOUND') !== -1); 
                } catch (e) { 
                    isConfigMissing = false; 
                }
                
                if (isConfigMissing) {
                    var projectId = (window && window.AURRAA && window.AURRAA.firebaseApp && 
                                    window.AURRAA.firebaseApp.options && 
                                    window.AURRAA.firebaseApp.options.projectId) ? 
                                    window.AURRAA.firebaseApp.options.projectId : null;
                    var consoleLink = projectId ? 
                        ('https://console.firebase.google.com/project/' + projectId + '/authentication/providers') : 
                        'https://console.firebase.google.com/';
                    var help = 'Firebase configuration not found (CONFIGURATION_NOT_FOUND).\n' +
                        'Please verify the web app configuration in Firebase Console and enable Email/Password sign-in.\n' +
                        'Open: ' + consoleLink;
                    alert(help);
                } else if (err.code === 'permission-denied' || err.message.includes('Missing or insufficient permissions')) {
                    var projectId = (window && window.AURRAA && window.AURRAA.firebaseApp && 
                                    window.AURRAA.firebaseApp.options && 
                                    window.AURRAA.firebaseApp.options.projectId) ? 
                                    window.AURRAA.firebaseApp.options.projectId : null;
                    var consoleLink = projectId ? 
                        ('https://console.firebase.google.com/project/' + projectId + '/firestore/rules') : 
                        'https://console.firebase.google.com/';
                    var help = 'Firebase permission denied. This usually means the Firestore security rules are too restrictive.\n' +
                        'Please update your Firestore security rules to allow read/write access.\n' +
                        'Open: ' + consoleLink;
                    alert(help);
                } else {
                    var msg = rawMessage;
                    alert(msg);
                }
            }
        } else {
            // Fallback to localStorage-only signup
            profile.password = password;
            saveTeacherProfile(profile);
            goToDashboard();
        }
    });
})();

// Attach to login form (supports Firebase via window.AURRAA.signIn when available)
(function(){
    var loginForm = document.querySelector('#teacher-login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function(ev){
        ev.preventDefault();
        var name = loginForm.querySelector('[name="name"]').value.trim();
        var institution = loginForm.querySelector('[name="institution"]').value.trim();
        var email = loginForm.querySelector('[name="email"]').value.trim();
        var password = loginForm.querySelector('[name="password"]').value;
        var errorDiv = loginForm.querySelector('.error-message');

        // Hide any existing error messages
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }

        // If Firebase is available, use it
        if (window.AURRAA && typeof window.AURRAA.signIn === 'function') {
            try {
                // Sign in with Firebase
                const result = await window.AURRAA.signIn(email, password);
                
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
                    
                    goToDashboard();
                    return;
                } else {
                    // Sign out if profile doesn't match
                    if (window.AURRAA.signOut) {
                        await window.AURRAA.signOut();
                    }
                    
                    var msg = 'Invalid credentials. The name or institution does not match our records.';
                    if (errorDiv) {
                        errorDiv.textContent = msg;
                        errorDiv.style.display = 'block';
                    } else {
                        alert(msg);
                    }
                    return;
                }
            } catch (err) {
                console.error('SignIn error', err);
                var code = err && err.code ? err.code : null;
                var message = err && err.message ? err.message : 'Invalid credentials.';

                var isConfigMissing = false;
                try { 
                    isConfigMissing = (String(err && err.message || '').indexOf('CONFIGURATION_NOT_FOUND') !== -1) || 
                                    (String(err && err.code || '').indexOf('CONFIGURATION_NOT_FOUND') !== -1); 
                } catch (e) { 
                    isConfigMissing = false; 
                }

                if (isConfigMissing) {
                    var projectId2 = (window && window.AURRAA && window.AURRAA.firebaseApp && 
                                    window.AURRAA.firebaseApp.options && 
                                    window.AURRAA.firebaseApp.options.projectId) ? 
                                    window.AURRAA.firebaseApp.options.projectId : null;
                    var consoleLink2 = projectId2 ? 
                        ('https://console.firebase.google.com/project/' + projectId2 + '/authentication/providers') : 
                        'https://console.firebase.google.com/';
                    var friendly = 'Firebase configuration not found (CONFIGURATION_NOT_FOUND).\n' +
                        'Please verify the web app configuration in Firebase Console and enable Email/Password sign-in.\n' +
                        'Open: ' + consoleLink2;
                    if (errorDiv) {
                        errorDiv.textContent = friendly;
                        errorDiv.style.display = 'block';
                    } else alert(friendly);
                } else if (err.code === 'permission-denied' || err.message.includes('Missing or insufficient permissions')) {
                    var projectId2 = (window && window.AURRAA && window.AURRAA.firebaseApp && 
                                    window.AURRAA.firebaseApp.options && 
                                    window.AURRAA.firebaseApp.options.projectId) ? 
                                    window.AURRAA.firebaseApp.options.projectId : null;
                    var consoleLink2 = projectId2 ? 
                        ('https://console.firebase.google.com/project/' + projectId2 + '/firestore/rules') : 
                        'https://console.firebase.google.com/';
                    var friendly = 'Firebase permission denied. This usually means the Firestore security rules are too restrictive.\n' +
                        'Please update your Firestore security rules to allow read/write access.\n' +
                        'Open: ' + consoleLink2;
                    if (errorDiv) {
                        errorDiv.textContent = friendly;
                        errorDiv.style.display = 'block';
                    } else alert(friendly);
                } else {
                    var combined = code ? (code + ': ' + message) : message;
                    if (errorDiv) {
                        errorDiv.textContent = combined;
                        errorDiv.style.display = 'block';
                    } else {
                        alert(combined);
                    }
                }
                return;
            }
        }

        // Fallback: localStorage-based check
        var profile = getTeacherProfile();
        if (profile && profile.email === email && profile.password === password && 
            profile.name === name && profile.institution === institution) {
            goToDashboard();
        } else {
            var msg = 'Invalid credentials. Please check your details.';
            if (errorDiv) { 
                errorDiv.textContent = msg; 
                errorDiv.style.display = 'block'; 
            } else { 
                alert(msg); 
            }
        }
    });
})();

// Hook Teacher View buttons where present
// Hook Teacher View buttons where present and sync via Firebase if available
(function(){
    var teacherButtons = document.querySelectorAll('.teacher-view, #go-teacher, [data-nav="teacher"]');
    if (teacherButtons.length) {
        teacherButtons.forEach(function(btn){
            btn.addEventListener('click', function(){
                if (isTeacherSignedIn()) { goToDashboard(); } else { goToTeacherLogin(); }
            });
        });
    }

    // Sync teacher profile from Firebase if available
    if (window.AURRAA && typeof window.AURRAA.onAuthChange === 'function' && typeof window.AURRAA.getUserData === 'function') {
        window.AURRAA.onAuthChange(async function(user) {
            if (user) {
                try {
                    var doc = await window.AURRAA.getUserData(user.uid);
                    if (doc && doc.role === 'teacher') {
                        saveTeacherProfile(Object.assign({}, doc, { uid: user.uid }));
                    } else if (doc && doc.role !== 'teacher') {
                        // If user exists but isn't a teacher, sign them out
                        if (window.AURRAA.signOut) {
                            await window.AURRAA.signOut();
                        }
                        localStorage.removeItem(TEACHER_PROFILE_KEY);
                    }
                } catch (e) {
                    // ignore sync errors, keep local state as-is
                    console.error('Error syncing teacher profile:', e);
                }
            } else {
                // signed out: remove local profile
                try { localStorage.removeItem(TEACHER_PROFILE_KEY); } catch (e) {}
            }
        });
    }
})();