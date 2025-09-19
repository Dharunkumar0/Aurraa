// Lightweight localStorage-based teacher auth and routing
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
    window.location.href = 'teacher-dashboard-responsive.html';
}

function goToTeacherLogin() {
    window.location.href = 'teacher-login.html';
}

// Attach to signup form
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

        var profile = { name: name, institution: institution, email: email };

        if (window.AURRAA && typeof window.AURRAA.signUp === 'function') {
            try {
                var res = await window.AURRAA.signUp(email, password, profile);
                saveTeacherProfile(Object.assign({}, profile, { uid: res.user && res.user.uid ? res.user.uid : null }));
                goToDashboard();
            } catch (err) {
                alert(err && err.message ? err.message : 'Signup failed');
            }
        } else {
            saveTeacherProfile(Object.assign({}, profile, { password: password }));
            goToDashboard();
        }
    });
})();

// Attach to login form
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

        if (window.AURRAA && typeof window.AURRAA.signIn === 'function') {
            try {
                await window.AURRAA.signIn(email, password);
                goToDashboard();
            } catch (err) {
                var msg = err && err.message ? err.message : 'Invalid credentials.';
                var errDiv = loginForm.querySelector('.error-message');
                if (errDiv) { errDiv.textContent = msg; errDiv.style.display = 'block'; }
                else alert(msg);
            }
            return;
        }

        var profile = getTeacherProfile();
        if (profile && profile.email === email && profile.password === password && profile.name === name && profile.institution === institution) {
            goToDashboard();
        } else {
            var err2 = loginForm.querySelector('.error-message');
            if (err2) { err2.textContent = 'Invalid credentials. Please check your details.'; err2.style.display = 'block'; }
            else alert('Invalid credentials.');
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
                    if (doc) {
                        saveTeacherProfile(Object.assign({}, doc, { uid: user.uid }));
                    }
                } catch (e) {
                    // ignore
                }
            } else {
                try { localStorage.removeItem(TEACHER_PROFILE_KEY); } catch (e) {}
            }
        });
    }
})();

// Note: Student routing is now handled by student-auth.js


