// api/create-pesapal-order.js
// Pesapal API integration - LIVE PRODUCTION URLs

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { amount, email, phone, orderId, cart } = req.body;

        if (!amount || !email) {
            return res.status(400).json({ 
                success: false, 
                error: 'Amount and email are required' 
            });
        }

        const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
        const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
        
        if (!consumerKey || !consumerSecret) {
            console.error('Missing Pesapal credentials');
            return res.status(500).json({
                success: false,
                error: 'Payment configuration error. Please contact support.'
            });
        }

        // LIVE PRODUCTION URL - NOT sandbox
        const PESAPAL_API = 'https://pay.pesapal.com/v3';
        
        // Step 1: Get OAuth token
        const authResponse = await fetch(`${PESAPAL_API}/api/Auth/RequestToken`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                consumer_key: consumerKey,
                consumer_secret: consumerSecret
            })
        });

        const authData = await authResponse.json();
        
        if (!authData.token) {
            throw new Error('Failed to authenticate with Pesapal');
        }

        const token = authData.token;

        // Step 2: Register IPN (or use existing)
        let ipnId = process.env.PESAPAL_IPN_ID;
        
        if (!ipnId) {
            const ipnResponse = await fetch(`${PESAPAL_API}/api/URLSetup/RegisterIPN`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/pesapal-ipn`,
                    ipn_notification_type: 'POST'
                })
            });
            
            const ipnData = await ipnResponse.json();
            ipnId = ipnData.ipn_id;
            
            if (ipnId) {
                console.log('New IPN registered:', ipnId);
            }
        }

        // Step 3: Create order
        const merchantReference = `GWA_${Date.now()}_${orderId}`;
        
        const orderData = {
            merchant_reference: merchantReference,
            amount: amount,
            currency: 'KES',
            description: `Ebook purchase - ${cart.map(item => item.title).join(', ').substring(0, 200)}`,
            callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success.html`,
            cancellation_url: `${process.env.NEXT_PUBLIC_BASE_URL}/failure.html`,
            notification_id: ipnId,
            billing_address: {
                email_address: email,
                phone_number: phone || '',
                country_code: 'KE',
                first_name: 'Customer',
                last_name: 'Purchase'
            }
        };

        const orderResponse = await fetch(`${PESAPAL_API}/api/Transactions/SubmitOrderRequest`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const orderResult = await orderResponse.json();

        if (orderResult.redirect_url) {
            return res.status(200).json({
                success: true,
                redirect_url: orderResult.redirect_url,
                order_tracking_id: orderResult.order_tracking_id,
                merchant_reference: merchantReference
            });
        } else {
            return res.status(400).json({
                success: false,
                error: orderResult.error?.message || 'Failed to create Pesapal order'
            });
        }

    } catch (error) {
        console.error('Pesapal error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Payment initiation failed. Please try again.'
        });
    }
}
