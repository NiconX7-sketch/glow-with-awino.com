// js/visitor-stats.js - Visitor tracking for dashboard

const STATS_SUPABASE_URL = 'https://orxrpwncwyrkmubqywhw.supabase.co';
const STATS_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yeHJwd25jd3lya211YnF5d2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjYwMjYsImV4cCI6MjA5MTY0MjAyNn0.I2eYzCfOnRf9F2h9f1sfcUTHNaU6rfdjVdKAti0KR4c';

async function trackVisitor() {
    const today = new Date().toISOString().split('T')[0];
    const lastVisit = localStorage.getItem('lastVisitDate');
    
    if (lastVisit !== today) {
        try {
            // Track daily visitor
            await fetch('/api/track-visitor', { method: 'POST' });
            localStorage.setItem('lastVisitDate', today);
            console.log('Visitor tracked for:', today);
        } catch (err) {
            console.log('Track error:', err);
        }
    }
}

// Run tracking on all pages
trackVisitor();