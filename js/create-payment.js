// api/create-payment.js - COMPLETE CORRECTED VERSION
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { method, amount, currency, email, phoneNumber, orderId } = req.body;
        
        console.log('Payment request received:', { method, amount, currency, orderId });
        
        // ============================================
        // PAYPAL - Returns approvalUrl
        // ============================================
        if (method === 'paypal') {
            console.log('Processing PayPal payment');
            
            // Get PayPal keys from environment variables
            const clientId = process.env.PAYPAL_CLIENT_ID;
            const clientSecret = process.env.PAYPAL_SECRET;
            const mode = process.env.PAYPAL_MODE || 'sandbox';
            
            // If no keys, return test URL
            if (!clientId || !clientSecret) {
                console.log('PayPal: Using test mode (no keys)');
                const testUrl = mode === 'sandbox' 
                    ? 'https://www.sandbox.paypal.com/checkoutnow?token=test_' + Date.now()
                    : 'https://www.paypal.com/checkoutnow?token=test_' + Date.now();
                
                return res.status(200).json({ 
                    approvalUrl: testUrl,
                    method: 'paypal',
                    test_mode: true
                });
            }
            
            const baseUrl = mode === 'live' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';
            const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
            
            // Get access token
            const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials'
            });
            
            const tokenData = await tokenResponse.json();
            
            if (!tokenData.access_token) {
                return res.status(200).json({ 
                    approvalUrl: `${baseUrl === 'https://api.sandbox.paypal.com' ? 'https://www.sandbox.paypal.com' : 'https://www.paypal.com'}/checkoutnow`,
                    error: 'Could not authenticate with PayPal',
                    method: 'paypal'
                });
            }
            
            // Create order
            const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    intent: 'CAPTURE',
                    purchase_units: [{
                        amount: { currency_code: currency || 'USD', value: amount.toString() },
                        reference_id: orderId,
                        description: 'Grow With Awino Purchase'
                    }],
                    application_context: {
                        return_url: 'https://growwithawinoo.com/success.html',
                        cancel_url: 'https://growwithawinoo.com/failure.html'
                    }
                })
            });
            
            const orderData = await orderResponse.json();
            const approvalUrl = orderData.links?.find(link => link.rel === 'approve')?.href;
            
            if (approvalUrl) {
                return res.status(200).json({ 
                    approvalUrl: approvalUrl,
                    method: 'paypal'
                });
            } else {
                return res.status(200).json({ 
                    approvalUrl: `${baseUrl === 'https://api.sandbox.paypal.com' ? 'https://www.sandbox.paypal.com' : 'https://www.paypal.com'}/checkoutnow`,
                    error: orderData.message || 'Failed to create order',
                    method: 'paypal'
                });
            }
        }
        
        // ============================================
        // PAYSTACK - Returns authorizationUrl
        // ============================================
        if (method === 'paystack') {
            console.log('Processing Paystack payment');
            
            const secretKey = process.env.PAYSTACK_SECRET_KEY;
            
            if (!secretKey) {
                console.log('Paystack: Using test mode (no keys)');
                return res.status(200).json({ 
                    authorizationUrl: 'https://paystack.com/pay/test_' + Date.now(),
                    method: 'paystack',
                    test_mode: true
                });
            }
            
            const amountInKobo = Math.round(amount * 100);
            
            const response = await fetch('https://api.paystack.co/transaction/initialize', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${secretKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email || 'customer@example.com',
                    amount: amountInKobo,
                    currency: currency || 'KES',
                    reference: `order_${orderId}_${Date.now()}`,
                    callback_url: 'https://growwithawinoo.com/success.html',
                    metadata: {
                        order_id: orderId,
                        cancel_action: 'https://growwithawinoo.com/failure.html'
                    }
                })
            });
            
            const data = await response.json();
            
            if (data.status && data.data?.authorization_url) {
                return res.status(200).json({ 
                    authorizationUrl: data.data.authorization_url,
                    method: 'paystack'
                });
            } else {
                return res.status(200).json({ 
                    authorizationUrl: 'https://paystack.com/pay/test',
                    error: data.message || 'Paystack initialization failed',
                    method: 'paystack'
                });
            }
        }
        
        // ============================================
        // M-PESA - Placeholder
        // ============================================
        if (method === 'mpesa') {
            return res.status(200).json({
                success: true,
                message: 'M-Pesa coming soon',
                method: 'mpesa',
                checkoutRequestID: 'TEST_' + Date.now()
            });
        }
        
        return res.status(400).json({ error: 'Unknown payment method' });
        
    } catch (error) {
        console.error('Payment error:', error);
        return res.status(500).json({ error: error.message });
    }
}
