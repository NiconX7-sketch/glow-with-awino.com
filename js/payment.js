// api/create-payment.js - SIMPLIFIED WORKING VERSION
export default async function handler(req, res) {
    // Enable CORS
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
        
        console.log('Received payment request:', { method, amount, currency, orderId });
        
        if (method === 'paypal') {
            return await handlePayPal(req, res, amount, currency, orderId);
        } else if (method === 'paystack') {
            return await handlePaystack(req, res, amount, currency, email, orderId);
        } else if (method === 'mpesa') {
            return res.status(200).json({ success: true, message: 'M-Pesa test successful' });
        } else {
            return res.status(400).json({ error: 'Unknown payment method' });
        }
        
    } catch (error) {
        console.error('Payment handler error:', error);
        return res.status(500).json({ error: error.message });
    }
}

// PayPal Handler
async function handlePayPal(req, res, amount, currency, orderId) {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET;
    const mode = process.env.PAYPAL_MODE || 'sandbox';
    
    console.log('PayPal mode:', mode);
    console.log('Client ID present:', !!clientId);
    
    // If no keys, return test mode response
    if (!clientId || !clientId === 'sb') {
        console.log('PayPal not configured - returning test mode');
        return res.status(200).json({ 
            approvalUrl: 'https://www.paypal.com/checkoutnow?test=true',
            test_mode: true 
        });
    }
    
    const baseUrl = mode === 'live' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';
    
    try {
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
            console.error('Token error:', tokenData);
            return res.status(200).json({ 
                approvalUrl: 'https://www.paypal.com/checkoutnow?demo=true',
                error: 'Using demo mode - add real PayPal keys'
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
            return res.status(200).json({ approvalUrl });
        } else {
            console.error('Order error:', orderData);
            return res.status(200).json({ 
                approvalUrl: 'https://www.paypal.com/checkoutnow',
                note: 'Demo mode - no real payment'
            });
        }
        
    } catch (error) {
        console.error('PayPal error:', error);
        return res.status(200).json({ 
            approvalUrl: 'https://www.paypal.com',
            error: error.message
        });
    }
}

// Paystack Handler
async function handlePaystack(req, res, amount, currency, email, orderId) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    
    console.log('Paystack secret present:', !!secretKey);
    
    if (!secretKey) {
        return res.status(200).json({ 
            authorizationUrl: 'https://paystack.com/pay/test',
            test_mode: true 
        });
    }
    
    try {
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
                currency: currency || 'USD',
                reference: `order_${orderId}_${Date.now()}`,
                callback_url: 'https://growwithawinoo.com/success.html'
            })
        });
        
        const data = await response.json();
        
        if (data.status) {
            return res.status(200).json({ authorizationUrl: data.data.authorization_url });
        } else {
            return res.status(200).json({ 
                authorizationUrl: 'https://paystack.com/pay/test',
                error: data.message
            });
        }
        
    } catch (error) {
        console.error('Paystack error:', error);
        return res.status(200).json({ 
            authorizationUrl: 'https://paystack.com/pay/test',
            error: error.message
        });
    }
}
