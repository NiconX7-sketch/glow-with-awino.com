// ============================================
// ADMIN AUTHENTICATION
// Only for admin access to admin panel
// Website remains public
// ============================================

// Check if admin is logged in
async function checkAdminAuth() {
    const supabase = getSupabase();
    if (!supabase) {
        console.error('Supabase not initialized');
        return false;
    }
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
        // Not logged in, redirect to login
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('signup.html')) {
            window.location.href = 'login.html';
        }
        return false;
    }
    
    // Verify this is the admin email
    const settings = await getSiteSettings();
    if (settings && settings.admin_email !== user.email) {
        await supabase.auth.signOut();
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
        return false;
    }
    
    return true;
}

// Login form handler
async function handleAdminLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    
    if (!email || !password) {
        showNotification('Please enter both email and password');
        return;
    }
    
    showLoading(true);
    
    const result = await adminLogin(email, password);
    
    showLoading(false);
    
    if (result.error) {
        showNotification(result.error);
    } else {
        showNotification('Login successful! Redirecting...');
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1500);
    }
}

// Signup form handler (only for initial admin setup)
async function handleAdminSignup(event) {
    event.preventDefault();
    
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirm-password')?.value;
    
    if (!email || !password) {
        showNotification('Please fill all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters');
        return;
    }
    
    showLoading(true);
    
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
    });
    
    showLoading(false);
    
    if (error) {
        showNotification(error.message);
    } else {
        // Update site settings with admin email
        const settings = await getSiteSettings();
        if (settings) {
            await updateSiteSettings({ admin_email: email });
        }
        
        showNotification('Signup successful! You can now login.');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }
}

// Logout handler
async function handleAdminLogout() {
    await adminLogout();
}

// Change password handler
async function handleChangePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('current-password')?.value;
    const newPassword = document.getElementById('new-password')?.value;
    const confirmNewPassword = document.getElementById('confirm-new-password')?.value;
    
    if (!currentPassword || !newPassword) {
        showNotification('Please fill all fields');
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        showNotification('New passwords do not match');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters');
        return;
    }
    
    showLoading(true);
    
    const result = await changePassword(currentPassword, newPassword);
    
    showLoading(false);
    
    if (result.error) {
        showNotification(result.error);
    } else {
        showNotification('Password changed successfully!');
        document.getElementById('password-form')?.reset();
    }
}

// Loading spinner
function showLoading(show) {
    const loader = document.getElementById('loading-spinner');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// Initialize auth page
async function initAuthPage() {
    await initSupabase();
    
    // Check if already logged in, redirect to admin
    const supabase = getSupabase();
    if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const settings = await getSiteSettings();
            if (settings && settings.admin_email === user.email) {
                window.location.href = 'admin.html';
                return;
            }
        }
    }
    
    // Setup form handlers
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }
    
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleAdminSignup);
    }
    
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handleChangePassword);
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleAdminLogout);
    }
}

// Run auth initialization
document.addEventListener('DOMContentLoaded', initAuthPage);