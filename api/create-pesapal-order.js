// api/create-pesapal-order.js - SIMPLIFIED WORKING VERSION

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { amount, email, phone } = req.body;
        
        console.log('=== CREATE PESAPAL ORDER ===');
        console.log('Amount:', amount, 'Email:', email);
        
        // Get credentials
        const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
        const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
        
        if (!consumerKey || !consumerSecret) {
            return res.status(500).json({ success: false, error: 'Missing credentials' });
        }
        
        // Get auth token
        const authRes = await fetch('https://pay.pesapal.com/v3/api/Auth/RequestToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret })
        });
        
        const authData = await authRes.json();
        
        if (!authData.token) {
            return res.status(400).json({ success: false, error: 'Authentication failed' });
        }
        
        // Generate unique merchant reference
        const merchantReference = `ORD${Date.now()}${Math.floor(Math.random() * 10000)}`;
        console.log('Merchant Reference:', merchantReference);
        
        // Create order
        const orderRes = await fetch('https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authData.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                merchant_reference: merchantReference,
                amount: Number(amount).toFixed(2),
                currency: 'KES',
                description: 'Ebook Purchase',
                callback_url: 'https://growwithawinoo.com/success.html',
                cancellation_url: 'https://growwithawinoo.com/failure.html',
                billing_address: {
                    email_address: email,
                    phone_number: phone || '254700000000',
                    country_code: 'KE'
                }
            })
        });
        
        const orderData = await orderRes.json();
        console.log('Order Response:', orderData);
        
        if (orderData.redirect_url) {
            return res.status(200).json({
                success: true,
                redirect_url: orderData.redirect_url,
                order_tracking_id: orderData.order_tracking_id
            });
        } else {
            return res.status(400).json({
                success: false,
                error: orderData.error?.message || 'Order creation failed',
                details: orderData
            });
        }
        
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
