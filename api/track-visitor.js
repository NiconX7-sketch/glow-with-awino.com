// api/track-visitor.js
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const SUPABASE_URL = 'https://orxrpwncwyrkmubqywhw.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yeHJwd25jd3lya211YnF5d2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjYwMjYsImV4cCI6MjA5MTY0MjAyNn0.I2eYzCfOnRf9F2h9f1sfcUTHNaU6rfdjVdKAti0KR4c';
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
        // Check if today's record exists
        const { data: existing } = await supabase
            .from('daily_visitors')
            .select('count')
            .eq('visit_date', today)
            .single();
        
        if (existing) {
            // Update existing record
            await supabase
                .from('daily_visitors')
                .update({ count: existing.count + 1 })
                .eq('visit_date', today);
        } else {
            // Create new record
            await supabase
                .from('daily_visitors')
                .insert([{ visit_date: today, count: 1 }]);
        }
        
        // Update total visitors
        const { data: total } = await supabase
            .from('total_visitors')
            .select('total_count')
            .eq('id', 1)
            .single();
        
        if (total) {
            await supabase
                .from('total_visitors')
                .update({ total_count: total.total_count + 1 })
                .eq('id', 1);
        } else {
            await supabase
                .from('total_visitors')
                .insert([{ id: 1, total_count: 1 }]);
        }
        
        return res.status(200).json({ success: true });
        
    } catch (error) {
        console.error('Tracking error:', error);
        return res.status(500).json({ error: error.message });
    }
}
