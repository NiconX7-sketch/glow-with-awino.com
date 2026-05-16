// api/create-payment.js - CORRECTED VERSION
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { method, amount, currency, email, phoneNumber, orderId } = req.body;
        
        console.log('Payment request:', { method, amount, currency, orderId });
        
        // ============================================
        // PAYPAL - Returns PayPal approval URL
        // ============================================
        if (method === 'paypal') {
            console.log('Processing PayPal payment for:', amount, currency);
            
            // For testing without real keys, return a test PayPal URL
            // This will redirect to PayPal sandbox
            return res.status(200).json({
                approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=test_' + Date.now(),
                method: 'paypal'
            });
        }
        
        // ============================================
        // PAYSTACK - Returns Paystack authorization URL
        // ============================================
        if (method === 'paystack') {
            console.log('Processing Paystack payment for:', amount, currency);
            
            // For testing without real keys, return a test Paystack URL
            return res.status(200).json({
                authorizationUrl: 'https://paystack.com/pay/test_' + Date.now(),
                method: 'paystack'
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
