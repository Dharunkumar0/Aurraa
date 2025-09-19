// Lightweight localStorage-based student auth and routing
// Keys
var STUDENT_PROFILE_KEY = 'studentProfile';

function getStudentProfile() {
    try {
        var raw = localStorage.getItem(STUDENT_PROFILE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function saveStudentProfile(profile) {
    localStorage.setItem(STUDENT_PROFILE_KEY, JSON.stringify(profile));
}

function isStudentSignedIn() {
    return !!getStudentProfile();
}

function goToGradeSelection() {
    window.location.href = 'ncret-grade.html';
}

function goToStudentLogin() {
    window.location.href = 'login.html';
}

function goToStudentSignup() {
    window.location.href = 'signup.html';
}

function showSyllabusSelection() {
    // Try multiple page structures: prefer an element with id 'syllabusSelection'
    var syllabusById = document.getElementById('syllabusSelection');
    if (syllabusById) {
        syllabusById.classList.remove('hidden');
        syllabusById.style.display = '';
        // hide the signup form card if present
        var signupCard = document.querySelector('.signup-card') || document.getElementById('signupForm');
        if (signupCard) signupCard.style.display = 'none';
        return;
    }

    var signupCard = document.querySelector('.signup-card');
    var syllabusSection = document.querySelector('.syllabus-selection');
    if (signupCard && syllabusSection) {
        signupCard.style.display = 'none';
        syllabusSection.style.display = 'block';
    }
}

// Attach to signup form (supports Firebase via window.AURRAA.signUp when available)
(function(){
    var signupForm = document.querySelector('.signup-form') || document.getElementById('signupForm');
    if (!signupForm) return;

    signupForm.addEventListener('submit', async function(ev){
        ev.preventDefault();
        var fullName = signupForm.querySelector('#full-name').value.trim();
        var institution = signupForm.querySelector('#institution').value.trim();
        var teacherName = signupForm.querySelector('#teacher-name').value.trim();
        var username = signupForm.querySelector('#username').value.trim();
        var email = signupForm.querySelector('#email').value.trim();
        var password = signupForm.querySelector('#password').value;
        var confirmPassword = signupForm.querySelector('#confirm-password').value;

        if (!fullName || !institution || !teacherName || !username || !email || !password || !confirmPassword) {
            alert('Please fill in all fields.');
            return;
        }

        if (password.length < 8) {
            alert('Password must be at least 8 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        var profile = {
            fullName: fullName,
            institution: institution,
            teacherName: teacherName,
            username: username,
            email: email
        };

        // If Firebase is available, create account there and save profile in Firestore (via signUp helper)
        if (window.AURRAA && typeof window.AURRAA.signUp === 'function') {
            try {
                var res = await window.AURRAA.signUp(email, password, profile);
                // signUp helper should have created user and saved profile in DB
                // Optionally keep a lightweight copy in localStorage for backwards compatibility
                saveStudentProfile(Object.assign({}, profile, { uid: res.user && res.user.uid ? res.user.uid : null }));
                // show syllabus selection and disable submit
                showSyllabusSelection();
                try {
                    var btn = signupForm.querySelector('button[type="submit"]');
                    if (btn) { btn.textContent = 'Signed up ✓'; btn.disabled = true; }
                } catch (e) {}
            } catch (err) {
                // Log full error for debugging (network response from identitytoolkit will be visible here)
                console.error('SignUp error', err);
                var rawMessage = err && (err.code || err.message) ? (err.code || err.message) : 'Sign up failed';

                // Special-case CONFIGURATION_NOT_FOUND to give actionable guidance
                var isConfigMissing = false;
                try { isConfigMissing = (String(err && err.message || '').indexOf('CONFIGURATION_NOT_FOUND') !== -1) || (String(err && err.code || '').indexOf('CONFIGURATION_NOT_FOUND') !== -1); } catch (e) { isConfigMissing = false; }
                if (isConfigMissing) {
                    var projectId = (window && window.AURRAA && window.AURRAA.firebaseApp && window.AURRAA.firebaseApp.options && window.AURRAA.firebaseApp.options.projectId) ? window.AURRAA.firebaseApp.options.projectId : null;
                    var consoleLink = projectId ? ('https://console.firebase.google.com/project/' + projectId + '/authentication/providers') : 'https://console.firebase.google.com/';
                    var help = 'Firebase configuration not found (CONFIGURATION_NOT_FOUND).\n' +
                        'Please verify the web app configuration in Firebase Console and enable Email/Password sign-in.\n' +
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
            saveStudentProfile(profile);
            showSyllabusSelection();
            try {
                var btn2 = signupForm.querySelector('button[type="submit"]');
                if (btn2) { btn2.textContent = 'Signed up ✓'; btn2.disabled = true; }
            } catch (e) {}
        }
    });
})();

// Attach to login form (supports Firebase via window.AURRAA.signIn when available)
(function(){
    var loginForm = document.querySelector('.login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function(ev){
        ev.preventDefault();
        var username = (loginForm.querySelector('#username').value || '').trim();
        var institution = (loginForm.querySelector('#institution').value || '').trim();
        var password = loginForm.querySelector('#password').value || '';
        var errorDiv = loginForm.querySelector('.error-message');

        // Hide any existing error messages
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }

        // Show loading state
        try {
            var spinner = loginForm.querySelector('.loading-spinner');
            if (spinner) spinner.classList.remove('hidden');
        } catch (e) {}

        // If Firebase is available, use it. Accept username or email.
        if (window.AURRAA && typeof window.AURRAA.signIn === 'function') {
            try {
                // Pass the username/email directly to signIn function which will handle resolution
                const result = await window.AURRAA.signIn(username, password);
                
                // After successful login, update local profile if needed
                try {
                    if (window.AURRAA.getUserData) {
                        const userData = await window.AURRAA.getUserData(result.user.uid);
                        if (userData) {
                            saveStudentProfile({
                                ...userData,
                                uid: result.user.uid
                            });
                        }
                    }
                } catch (profileError) {
                    console.warn('Error updating local profile:', profileError);
                }
                
                goToGradeSelection();
                return;
            } catch (err) {
                // Log full error for debugging
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
                } else {
                    var combined = code ? (code + ': ' + message) : message;
                    if (errorDiv) {
                        errorDiv.textContent = combined;
                        errorDiv.style.display = 'block';
                    } else {
                        alert(combined);
                    }
                }

                // Hide loading state
                try {
                    var spinner = loginForm.querySelector('.loading-spinner');
                    if (spinner) spinner.classList.add('hidden');
                } catch (e) {}
            }
        }

        // Fallback: localStorage-based check
        var profile = getStudentProfile();

        if (!profile) {
            var msg = 'No account found on this device. Please sign up first.';
            if (errorDiv) { 
                errorDiv.textContent = msg; 
                errorDiv.style.display = 'block'; 
            } else {
                if (confirm(msg + '\n\nOpen Sign Up page now?')) goToStudentSignup();
            }

            // Hide loading state
            try {
                var spinner = loginForm.querySelector('.loading-spinner');
                if (spinner) spinner.classList.add('hidden');
            } catch (e) {}
            return;
        }

        // Case-insensitive matching for institution and username/email
        var instMatch = (profile.institution || '').toLowerCase() === institution.toLowerCase();
        var id = username.toLowerCase();
        var profileUsername = (profile.username || '').toLowerCase();
        var profileEmail = (profile.email || '').toLowerCase();
        var idMatch = (profileUsername && profileUsername === id) || (profileEmail && profileEmail === id);

        // Password stored locally (fallback). If missing, instruct to use signup or Firebase.
        var pwStored = profile.password || null;
        var pwMatch = pwStored ? (pwStored === password) : false;

        if (instMatch && idMatch && pwMatch) {
            goToGradeSelection();
            return;
        }

        // If some parts matched but password didn't
        if (instMatch && idMatch && !pwMatch) {
            var msg = 'Incorrect password. If you forgot it, please sign up again or use password reset (not implemented).';
            if (errorDiv) { 
                errorDiv.textContent = msg; 
                errorDiv.style.display = 'block'; 
            } else { 
                alert(msg); 
            }

            // Hide loading state
            try {
                var spinner = loginForm.querySelector('.loading-spinner');
                if (spinner) spinner.classList.add('hidden');
            } catch (e) {}
            return;
        }

        // Generic fallback message
        var msg = 'Invalid credentials. Please check your institution, username (or email), and password.';
        if (errorDiv) { 
            errorDiv.textContent = msg; 
            errorDiv.style.display = 'block'; 
        } else { 
            alert(msg); 
        }

        // Hide loading state
        try {
            var spinner = loginForm.querySelector('.loading-spinner');
            if (spinner) spinner.classList.add('hidden');
        } catch (e) {}
    });
})();

// Hook Start Learning buttons where present
// Hook Start Learning buttons where present. Also listen for Firebase auth state to keep local profile in sync.
(function(){
    var studentButtons = document.querySelectorAll('.start-learning, #go-student, [data-nav="student"]');
    if (studentButtons.length) {
        studentButtons.forEach(function(btn){
            btn.addEventListener('click', function(){
                if (isStudentSignedIn()) {
                    goToGradeSelection();
                } else {
                    goToStudentLogin();
                }
            });
        });
    }

    // If Firebase auth is present, sync local profile when auth state changes
    if (window.AURRAA && typeof window.AURRAA.onAuthChange === 'function' && typeof window.AURRAA.getUserData === 'function') {
        window.AURRAA.onAuthChange(async function(user) {
            if (user) {
                try {
                    var doc = await window.AURRAA.getUserData(user.uid);
                    if (doc) {
                        // Persist a lightweight profile locally for compatibility
                        var profileFromDb = Object.assign({}, doc, { uid: user.uid });
                        saveStudentProfile(profileFromDb);
                    }
                } catch (e) {
                    // ignore sync errors, keep local state as-is
                }
            } else {
                // signed out: remove local profile
                try { localStorage.removeItem(STUDENT_PROFILE_KEY); } catch (e) {}
            }
        });
    }
})();
