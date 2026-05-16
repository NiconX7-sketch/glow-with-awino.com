// api/create-payment.js - SIMPLIFIED TEST VERSION (ALWAYS WORKS)
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
        // PAYPAL - ALWAYS returns a URL
        // ============================================
        if (method === 'paypal') {
            // Always return a PayPal test URL
            const paypalUrl = 'https://www.sandbox.paypal.com/checkoutnow?token=test_' + Date.now();
            
            console.log('Returning PayPal URL:', paypalUrl);
            
            return res.status(200).json({ 
                approvalUrl: paypalUrl,
                method: 'paypal',
                message: 'PayPal test mode'
            });
        }
        
        // ============================================
        // PAYSTACK - ALWAYS returns a URL
        // ============================================
        if (method === 'paystack') {
            // Always return a Paystack test URL
            const paystackUrl = 'https://paystack.com/pay/test_' + Date.now();
            
            console.log('Returning Paystack URL:', paystackUrl);
            
            return res.status(200).json({ 
                authorizationUrl: paystackUrl,
                method: 'paystack',
                message: 'Paystack test mode'
            });
        }
        
        // ============================================
        // M-PESA
        // ============================================
        if (method === 'mpesa') {
            return res.status(200).json({
                success: true,
                message: 'M-Pesa coming soon',
                method: 'mpesa'
            });
        }
        
        return res.status(400).json({ error: 'Unknown payment method' });
        
    } catch (error) {
        console.error('Payment error:', error);
        return res.status(500).json({ error: error.message });
    }
}
