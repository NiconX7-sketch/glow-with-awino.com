// api/verify-payment.js - VERCEL VERSION
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    try {
        const checkoutRequestID = req.query.checkoutRequestID;
        
        // For testing, return pending status
        // In production, check actual payment status from database
        
        return res.status(200).json({ 
            checkoutRequestID,
            status: 'pending',  // or 'completed' or 'failed'
            message: 'Payment status checked'
        });
        
    } catch (error) {
        console.error('Verify payment error:', error);
        return res.status(500).json({ 
            status: 'error', 
            error: error.message 
        });
    }
}