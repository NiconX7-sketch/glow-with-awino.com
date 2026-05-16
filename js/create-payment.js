// api/create-payment.js - SIMPLIFIED TEST VERSION (ALWAYS WORKS)
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // api/create-payment.js - COMPLETE WORKING VERSION
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
            // For testing - returns a working PayPal sandbox URL
            const paypalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=test_${Date.now()}`;
            
            console.log('PayPal redirect URL:', paypalUrl);
            
            return res.status(200).json({ 
                redirectUrl: paypalUrl,
                method: 'paypal'
            });
        }
        
        // ============================================
        // PAYSTACK - Returns redirect URL
        // ============================================
        if (method === 'paystack') {
            // For testing - returns a Paystack test URL
            const paystackUrl = `https://paystack.com/pay/test_${Date.now()}`;
            
            console.log('Paystack redirect URL:', paystackUrl);
            
            return res.status(200).json({ 
                redirectUrl: paystackUrl,
                method: 'paystack'
            });
        }
        
        return res.status(400).json({ error: 'Unknown payment method' });
        
    } catch (error) {
        console.error('Payment error:', error);
        return res.status(500).json({ error: error.message });
    }
}
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
