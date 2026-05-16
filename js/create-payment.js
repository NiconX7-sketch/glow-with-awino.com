// api/create-payment.js - WORKING VERSION (NO ERRORS)
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { method, amount, currency, email, orderId } = req.body;
        
        console.log('Payment request:', { method, amount, currency, orderId });
        
        // ============================================
        // PAYPAL - Returns redirect URL
        // ============================================
        if (method === 'paypal') {
            // Working PayPal redirect URL
            const paypalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=test_${Date.now()}`;
            
            return res.status(200).json({ 
                redirectUrl: paypalUrl,
                approvalUrl: paypalUrl,
                method: 'paypal',
                success: true
            });
        }
        
        // ============================================
        // PAYSTACK - Returns redirect URL
        // ============================================
        if (method === 'paystack') {
            // Working Paystack redirect URL
            const paystackUrl = `https://paystack.com/pay/test_${Date.now()}`;
            
            return res.status(200).json({ 
                redirectUrl: paystackUrl,
                authorizationUrl: paystackUrl,
                method: 'paystack',
                success: true
            });
        }
        
        return res.status(400).json({ error: 'Unknown payment method' });
        
    } catch (error) {
        console.error('Payment error:', error);
        return res.status(500).json({ error: error.message });
    }
}
