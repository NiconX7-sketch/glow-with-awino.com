// api/create-pesapal-order.js - WORKING VERSION

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
        
        // Get credentials
        const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
        const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
        
        if (!consumerKey || !consumerSecret) {
            console.error('Missing credentials');
            return res.status(500).json({
                success: false,
                error: 'Payment configuration error'
            });
        }
        
        // Step 1: Get Token
        console.log('Getting auth token...');
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
        console.log('Auth response:', authData);
        
        if (!authData.token) {
            return res.status(400).json({
                success: false,
                error: 'Authentication failed: ' + JSON.stringify(authData)
            });
        }
        
        const token = authData.token;
        console.log('Token obtained successfully');
        
        // Step 2: Generate Merchant Reference (MUST be unique and alphanumeric)
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        const merchantReference = `GWA${timestamp}${random}`;
        console.log('Merchant Reference:', merchantReference);
        
        // Step 3: Prepare Order Data - EXACT format required by Pesapal
        const orderData = {
            merchant_reference: merchantReference,
            amount: Number(amount).toFixed(2),
            currency: "KES",
            description: "Ebook Purchase",
            callback_url: "https://growwithawinoo.com/success.html",
            cancellation_url: "https://growwithawinoo.com/failure.html",
            notification_id: "",
            branch: "Grow With Awino",
            billing_address: {
                email_address: email,
                phone_number: phone || "254700000000",
                country_code: "KE",
                first_name: "Customer",
                last_name: "Purchase"
            }
        };
        
        console.log('Order Data being sent:', JSON.stringify(orderData, null, 2));
        
        // Step 4: Submit Order
        const orderResponse = await fetch('https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const responseText = await orderResponse.text();
        console.log('Raw response:', responseText);
        
        let orderResult;
        try {
            orderResult = JSON.parse(responseText);
        } catch(e) {
            console.error('Failed to parse response:', responseText);
            return res.status(500).json({
                success: false,
                error: 'Invalid response from Pesapal'
            });
        }
        
        console.log('Parsed response:', orderResult);
        
        if (orderResult.redirect_url) {
            console.log('SUCCESS! Redirect URL:', orderResult.redirect_url);
            return res.status(200).json({
                success: true,
                redirect_url: orderResult.redirect_url,
                order_tracking_id: orderResult.order_tracking_id
            });
        } else {
            console.error('Order creation failed:', orderResult);
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
