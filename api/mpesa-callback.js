// api/mpesa-callback.js - VERCEL VERSION
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    try {
        // Parse the callback data
        const callbackData = req.body;
        
        console.log('M-Pesa Callback received:', JSON.stringify(callbackData));
        
        // Process the callback (you can add database update here)
        
        return res.status(200).json({ 
            status: 'success',
            message: 'Callback received successfully'
        });
        
    } catch (error) {
        console.error('M-Pesa callback error:', error);
        return res.status(500).json({ 
            status: 'error', 
            error: error.message 
        });
    }
}