// api/create-payment.js - Complete with PayPal, Paystack, M-Pesa
// Reads ALL keys from Vercel Environment Variables (SECURE)

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    
    const { method, amount, currency, email, phoneNumber, orderId, items } = req.body;
    
    try {
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

// ============================================
// PAYPAL - Reads from Vercel Environment Variables
// ============================================
async function handlePayPal(amount, currency, orderId, res) {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET;
    const mode = process.env.PAYPAL_MODE || 'sandbox';
    
    if (!clientId || !clientSecret) {
        console.error('PayPal: Missing credentials in environment variables');
        return res.status(400).json({ error: 'PayPal payment not configured. Please contact support.' });
    }
    
    const baseUrl = mode === 'live' 
        ? 'https://api.paypal.com' 
        : 'https://api.sandbox.paypal.com';
    
    // Get PayPal access token
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
    
    // Create PayPal order
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: currency,
                    value: amount.toString()
                },
                reference_id: orderId,
                description: 'Ebook Purchase - Grow With Awino'
            }],
            application_context: {
                brand_name: 'Grow With Awino',
                landing_page: 'NO_PREFERENCE',
                user_action: 'PAY_NOW',
                return_url: `${process.env.URL || 'https://growwithawinoo.com'}/success.html`,
                cancel_url: `${process.env.URL || 'https://growwithawinoo.com'}/failure.html`
            }
        })
    });
    
    const orderData = await orderResponse.json();
    
    const approvalUrl = orderData.links?.find(link => link.rel === 'approve')?.href;
    
    if (!approvalUrl) {
        console.error('PayPal order error:', orderData);
        return res.status(400).json({ error: 'Failed to create PayPal order' });
    }
    
    return res.status(200).json({ approvalUrl });
}

// ============================================
// PAYSTACK - Reads from Vercel Environment Variables
// ============================================
async function handlePaystack(amount, currency, email, orderId, res) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!secretKey) {
        console.error('Paystack: Missing secret key in environment variables');
        return res.status(400).json({ error: 'Paystack payment not configured. Please contact support.' });
    }
    
    // Paystack expects amount in kobo/cent (multiply by 100)
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
            callback_url: `${process.env.URL || 'https://growwithawinoo.com'}/success.html`,
            metadata: {
                order_id: orderId,
                cancel_action: `${process.env.URL || 'https://growwithawinoo.com'}/failure.html`
            }
        })
    });
    
    const data = await response.json();
    
    if (data.status) {
        return res.status(200).json({ authorizationUrl: data.data.authorization_url });
    } else {
        console.error('Paystack error:', data);
        return res.status(400).json({ error: data.message || 'Paystack payment initialization failed' });
    }
}

// ============================================
// M-PESA - Reads from Vercel Environment Variables
// ============================================
async function handleMpesa(amount, phoneNumber, orderId, res) {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
    
    if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
        console.error('M-Pesa: Missing credentials in environment variables');
        return res.status(400).json({ error: 'M-Pesa payment not configured. Please contact support.' });
    }
    
    const baseUrl = environment === 'live'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';
    
    // Get M-Pesa access token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${auth}`
        }
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
        console.error('M-Pesa token error:', tokenData);
        return res.status(400).json({ error: 'Failed to authenticate with M-Pesa' });
    }
    
    const accessToken = tokenData.access_token;
    
    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    
    // Format phone number
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+')) {
        formattedPhone = formattedPhone.substring(1);
    }
    
    // Initiate STK push
    const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerBuyGoodsOnline',
            Amount: Math.round(amount),
            PartyA: formattedPhone,
            PartyB: shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: `${process.env.URL || 'https://growwithawinoo.com'}/api/mpesa-callback`,
            AccountReference: `ORDER${orderId}`,
            TransactionDesc: 'Ebook Purchase'
        })
    });
    
    const stkData = await stkResponse.json();
    
    if (stkData.ResponseCode === '0') {
        return res.status(200).json({ 
            success: true, 
            checkoutRequestID: stkData.CheckoutRequestID 
        });
    } else {
        console.error('M-Pesa STK error:', stkData);
        return res.status(400).json({ 
            success: false, 
            error: stkData.ResponseDescription || 'M-Pesa STK push failed' 
        });
    }
}
