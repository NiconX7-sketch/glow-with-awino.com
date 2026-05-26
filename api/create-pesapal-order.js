// api/create-pesapal-order.js - CORRECTED VERSION
// Based on official Pesapal API 3.0 documentation

module.exports = async function handler(req, res) {
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
        const { amount, email, phone, cart } = req.body;
        
        console.log('=== PESAPAL ORDER CREATION ===');
        console.log('Amount:', amount);
        console.log('Email:', email);
        
        // Get credentials from environment variables
        const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
        const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
        
        if (!consumerKey || !consumerSecret) {
            console.error('Missing Pesapal credentials');
            return res.status(500).json({
                success: false,
                error: 'Payment configuration error. Please contact support.'
            });
        }
        
        // STEP 1: Get Access Token
        console.log('Getting access token...');
        const authResponse = await fetch('https://pay.pesapal.com/v3/api/Auth/RequestToken', {
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
        console.log('Auth response status:', authResponse.status);
        
        if (!authData.token) {
            console.error('Auth failed:', authData);
            return res.status(400).json({
                success: false,
                error: 'Authentication failed: ' + (authData.error?.message || 'Invalid credentials')
            });
        }
        
        const token = authData.token;
        console.log('Access token obtained successfully');
        
        // STEP 2: Register IPN or use existing
        let ipnId = process.env.PESAPAL_IPN_ID;
        
        if (!ipnId) {
            console.log('Registering IPN URL...');
            const ipnResponse = await fetch('https://pay.pesapal.com/v3/api/URLSetup/RegisterIPN', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    url: `https://growwithawinoo.com/api/pesapal-ipn`,
                    ipn_notification_type: 'POST'
                })
            });
            
            const ipnData = await ipnResponse.json();
            ipnId = ipnData.ipn_id;
            console.log('IPN registered:', ipnId);
        }
        
        // STEP 3: Generate unique merchant reference (this will be sent as "id")
        // Format: Only alphanumeric, dashes, underscores, dots, colons - max 50 chars
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 10000);
        const merchantId = `GWA${timestamp}${randomNum}`.substring(0, 50);
        console.log('Merchant ID (id field):', merchantId);
        
        // Format description - max 100 characters as per docs
        let description = 'Ebook Purchase';
        if (cart && cart.length > 0) {
            description = cart.map(item => item.title).join(', ').substring(0, 100);
        }
        
        // STEP 4: Submit Order Request - USING CORRECT FIELD NAMES
        // According to Pesapal docs: "id" is the merchant reference, NOT "merchant_reference"
        const orderData = {
            id: merchantId,                    // ✅ CORRECT field name (not merchant_reference)
            currency: 'KES',
            amount: Number(amount).toFixed(2),
            description: description,
            callback_url: 'https://growwithawinoo.com/success.html',
            cancellation_url: 'https://growwithawinoo.com/failure.html',
            notification_id: ipnId,
            branch: 'Grow With Awino',
            billing_address: {
                email_address: email,
                phone_number: phone || '254700000000',
                country_code: 'KE',
                first_name: 'Customer',
                last_name: 'Purchase'
            }
        };
        
        console.log('Order data being sent:', JSON.stringify(orderData, null, 2));
        
        const orderResponse = await fetch('https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const orderResult = await orderResponse.json();
        console.log('Order response:', JSON.stringify(orderResult, null, 2));
        
        // Check for successful response
        if (orderResult.redirect_url) {
            console.log('✅ Order created successfully!');
            console.log('Redirect URL:', orderResult.redirect_url);
            
            return res.status(200).json({
                success: true,
                redirect_url: orderResult.redirect_url,
                order_tracking_id: orderResult.order_tracking_id,
                merchant_reference: orderResult.merchant_reference
            });
        } else {
            console.error('❌ Order creation failed:', orderResult);
            return res.status(400).json({
                success: false,
                error: orderResult.error?.message || 'Failed to create order',
                details: orderResult
            });
        }
        
    } catch (error) {
        console.error('Fatal error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Server error: ' + error.message
        });
    }
};
