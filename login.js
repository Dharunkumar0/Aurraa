document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('.login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('.login-btn');
    
    // Add focus effects to inputs
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
    });
    
    // Handle form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Basic validation
        if (!usernameInput.value || !passwordInput.value) {
            showError('Please fill in all fields');
            return;
        }
        
        // Show loading state
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span>Logging in...</span>';
        
        try {
            // If Firebase helpers are available, use them
            if (window.AURRAA && typeof window.AURRAA.signIn === 'function') {
                try {
                    const res = await window.AURRAA.signIn(usernameInput.value, passwordInput.value);
                    // on success redirect
                    window.location.href = 'ncret-grade.html';
                } catch (fbErr) {
                    // show firebase error message if present
                    const msg = fbErr && fbErr.message ? fbErr.message : 'Login failed';
                    showError(msg);
                }
            } else {
                // fallback to simulated login
                const success = await simulateLogin(usernameInput.value, passwordInput.value);
                if (success) window.location.href = 'ncert-grade.html';
                else showError('Invalid username or password');
            }
        } catch (error) {
            showError('An error occurred. Please try again.');
        } finally {
            // Reset button state
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span>Login</span><div class="btn-shine"></div>';
        }
    });
    
    // Social login buttons
    const googleBtn = document.querySelector('.google-btn');
    const appleBtn = document.querySelector('.apple-btn');
    
    googleBtn?.addEventListener('click', () => {
        // Implement Google login
        alert('Google login will be implemented here');
    });
    
    appleBtn?.addEventListener('click', () => {
        // Implement Apple login
        alert('Apple login will be implemented here');
    });
});

// Function to show error messages
function showError(message) {
    // Remove any existing error message
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Create and show new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const form = document.querySelector('.login-form');
    form.insertBefore(errorDiv, form.firstChild);
    
    // Remove error after 3 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Simulate login (replace with actual API call)
function simulateLogin(username, password) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // For testing: accept any username/password combination
            // In production, this would be an actual API call
            resolve(true);
        }, 1000);
    });
}
