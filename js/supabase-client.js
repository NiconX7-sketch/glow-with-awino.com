// ============================================
// SUPABASE CLIENT - FIXED VERSION
// ============================================

// Your Supabase credentials
const SUPABASE_URL = 'https://orxrpwncwyrkmubqywhw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yeHJwd25jd3lya211YnF5d2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjYwMjYsImV4cCI6MjA5MTY0MjAyNn0.I2eYzCfOnRf9F2h9f1sfcUTHNaU6rfdjVdKAti0KR4c';

// Global supabase client
let supabaseClient = null;

// Initialize Supabase immediately
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not loaded yet');
        return null;
    }
    
    if (!supabaseClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized successfully');
    }
    return supabaseClient;
}

// Get Supabase client (call this in your pages)
function getSupabase() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}

// Wait for Supabase library to load
function waitForSupabase() {
    return new Promise((resolve) => {
        if (typeof supabase !== 'undefined') {
            resolve(initSupabase());
        } else {
            const checkInterval = setInterval(() => {
                if (typeof supabase !== 'undefined') {
                    clearInterval(checkInterval);
                    resolve(initSupabase());
                }
            }, 100);
        }
    });
}

// Initialize automatically
waitForSupabase().then(() => {
    console.log('Supabase ready!');
});