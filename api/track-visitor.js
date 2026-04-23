// api/track-visitor.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
    // Allow only POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
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
        
        // Update total visitors count
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
        }
        
        return res.status(200).json({ success: true });
        
    } catch (error) {
        console.error('Tracking error:', error);
        return res.status(500).json({ error: 'Failed to track visitor' });
    }
}
