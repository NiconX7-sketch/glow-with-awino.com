// api/create-payment.js - With better error handling
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
    
    try {
        const { method, amount, currency, email, phoneNumber, orderId } = req.body;
        
        console.log('Payment request received:', { method, amount, currency, orderId });
        
        if (method === 'paypal') {
            return await handlePayPal(amount, currency, orderId, res);
        } else if (method === 'paystack') {
            return await handlePaystack(amount, currency, email, orderId, res);
        } else if (method === 'mpesa') {
            return await handleMpesa(amount, phoneNumber, orderId, res);
        } else {
            return res.status(400).json({ error: 'Invalid payment method' });
        }
    } catch (error) {
        console.error('Payment error:', error);
        return res.status(500).json({ error: error.message });
    }
}

async function handlePayPal(amount, currency, orderId, res) {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET;
    const mode = process.env.PAYPAL_MODE || 'sandbox';
    
    console.log('PayPal mode:', mode);
    console.log('PayPal client ID exists:', !!clientId);
    
    if (!clientId || !clientSecret) {
        console.error('PayPal: Missing credentials');
        return res.status(400).json({ error: 'PayPal not configured. Please add API keys.' });
    }
    
    const baseUrl = mode === 'live' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';
    
    try {
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        
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
            console.error('PayPal token error:', tokenData);
            return res.status(400).json({ error: 'Failed to authenticate with PayPal' });
        }
        
        const accessToken = tokenData.access_token;
        
        const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: { currency_code: currency, value: amount.toString() },
                    reference_id: orderId,
                    description: 'Ebook Purchase - Grow With Awino'
                }],
                application_context: {
                    brand_name: 'Grow With Awino',
                    return_url: `https://growwithawinoo.com/success.html`,
                    cancel_url: `https://growwithawinoo.com/failure.html`
                }
            })
        });
        
        const orderData = await orderResponse.json();
        const approvalUrl = orderData.links?.find(link => link.rel === 'approve')?.href;
        
        if (!approvalUrl) {
            console.error('PayPal order error:', orderData);
            return res.status(400).json({ error: orderData.message || 'Failed to create PayPal order' });
        }
        
        return res.status(200).json({ approvalUrl });
        
    } catch (error) {
        console.error('PayPal handler error:', error);
        return res.status(500).json({ error: error.message });
    }
}

async function handlePaystack(amount, currency, email, orderId, res) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    
    console.log('Paystack secret key exists:', !!secretKey);
    
    if (!secretKey) {
        return res.status(400).json({ error: 'Paystack not configured. Please add API keys.' });
    }
    
    try {
        const amountInSmallestUnit = Math.round(amount * 100);
        
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${secretKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                amount: amountInSmallestUnit,
                currency: currency,
                reference: `order_${orderId}_${Date.now()}`,
                callback_url: `https://growwithawinoo.com/success.html`,
                metadata: { order_id: orderId }
            })
        });
        
        const data = await response.json();
        
        if (data.status) {
            return res.status(200).json({ authorizationUrl: data.data.authorization_url });
        } else {
            console.error('Paystack error:', data);
            return res.status(400).json({ error: data.message || 'Paystack initialization failed' });
        }
    } catch (error) {
        console.error('Paystack handler error:', error);
        return res.status(500).json({ error: error.message });
    }
}

async function handleMpesa(amount, phoneNumber, orderId, res) {
    // M-Pesa handler (simplified for now)
    return res.status(400).json({ error: 'M-Pesa not configured yet' });
}
