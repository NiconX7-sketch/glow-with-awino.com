// api/create-pesapal-order.js
// Simplified working version

async function handler(req, res) {
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
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed. Use POST.' 
        });
    }

    try {
        const { amount, email, phone, cart } = req.body;

        // Validate required fields
        if (!amount) {
            return res.status(400).json({ 
                success: false, 
                error: 'Amount is required' 
            });
        }
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email address is required' 
            });
        }

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

        // LIVE PRODUCTION URL
        const PESAPAL_API = 'https://pay.pesapal.com/v3';
        
        console.log('Authenticating with Pesapal Live...');
        
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
        
        if (!authData || !authData.token) {
            console.error('Auth failed:', authData);
            return res.status(400).json({
                success: false,
                error: 'Failed to authenticate with Pesapal. Please check your API credentials.'
            });
        }

        const token = authData.token;
        console.log('Authentication successful');

        // Use existing IPN ID from environment or register new one
        let ipnId = process.env.PESAPAL_IPN_ID;
        
        if (!ipnId) {
            console.log('Registering new IPN...');
            
            const ipnResponse = await fetch(`${PESAPAL_API}/api/URLSetup/RegisterIPN`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://growwithawinoo.com'}/api/pesapal-ipn`,
                    ipn_notification_type: 'POST'
                })
            });
            
            const ipnData = await ipnResponse.json();
            ipnId = ipnData.ipn_id;
            console.log('IPN registered:', ipnId);
        }

        // Generate UNIQUE Merchant Reference
        const uniqueId = Date.now().toString();
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const merchantReference = `GWA${uniqueId}${randomSuffix}`;
        
        console.log('Merchant Reference:', merchantReference);
        
        // Format amount
        const formattedAmount = Number(amount).toFixed(2);
        
        // Format description
        let description = 'Ebook purchase';
        if (cart && cart.length > 0) {
            const titles = cart.map(item => item.title).join(', ');
            description = titles.substring(0, 200);
        }
        
        // Build order request
        const orderData = {
            merchant_reference: merchantReference,
            amount: formattedAmount,
            currency: 'KES',
            description: description,
            callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://growwithawinoo.com'}/success.html`,
            cancellation_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://growwithawinoo.com'}/failure.html`,
            notification_id: ipnId || '',
            billing_address: {
                email_address: email,
                phone_number: phone || '',
                country_code: 'KE',
                first_name: 'Customer',
                last_name: 'Purchase'
            }
        };

        console.log('Submitting order...');

        // Submit order to Pesapal
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
            console.log('Order created successfully!');
            return res.status(200).json({
                success: true,
                redirect_url: orderResult.redirect_url,
                order_tracking_id: orderResult.order_tracking_id,
                merchant_reference: merchantReference
            });
        } else {
            console.error('Order creation failed:', orderResult);
            return res.status(400).json({
                success: false,
                error: orderResult.error?.message || 'Failed to create Pesapal order.'
            });
        }

    } catch (error) {
        console.error('Pesapal error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Payment initiation failed: ' + error.message
        });
    }
}

// Export the handler (THIS IS THE CORRECT SYNTAX)
module.exports = handler;
