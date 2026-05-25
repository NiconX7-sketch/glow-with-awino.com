// api/create-pesapal-order.js - FULLY FIXED FOR PRODUCTION

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

        // ✅ LIVE PRODUCTION URL
        const PESAPAL_API = 'https://pay.pesapal.com/v3';
        
        console.log('1. Authenticating with Pesapal Live...');
        
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
        console.log('2. Authentication successful');

        // Step 2: Register IPN (or use existing)
        let ipnId = process.env.PESAPAL_IPN_ID;
        
        if (!ipnId) {
            console.log('3. Registering new IPN...');
            
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
            console.log('4. IPN registered:', ipnId);
        }

        // ✅ STEP 3: Generate UNIQUE Merchant Reference
        // Format: GWA + Timestamp + Random Number (no underscores, always unique)
        const uniqueId = Date.now().toString(); // e.g., "1748172774292"
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // e.g., "0372"
        const merchantReference = `GWA${uniqueId}${randomSuffix}`;
        
        console.log('5. Generated Merchant Reference:', merchantReference);
        
        // Format amount to 2 decimal places
        const formattedAmount = Number(amount).toFixed(2);
        
        // Format cart items for description
        let description = 'Ebook purchase';
        if (cart && cart.length > 0) {
            const titles = cart.map(item => item.title).join(', ');
            description = titles.substring(0, 200);
        }
        
        // ✅ STEP 4: Build order request
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

        console.log('6. Submitting order with data:', JSON.stringify({
            merchant_reference: orderData.merchant_reference,
            amount: orderData.amount,
            currency: orderData.currency,
            description: orderData.description.substring(0, 50) + '...'
        }, null, 2));

        // Step 5: Submit order to Pesapal
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
            console.log('7. ✅ Order created successfully!');
            console.log('8. Redirect URL:', orderResult.redirect_url);
            
            return res.status(200).json({// api/create-pesapal-order.js - FULLY FIXED FOR PRODUCTION

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

        // ✅ LIVE PRODUCTION URL
        const PESAPAL_API = 'https://pay.pesapal.com/v3';
        
        console.log('1. Authenticating with Pesapal Live...');
        
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
        console.log('2. Authentication successful');

        // Step 2: Register IPN (or use existing)
        let ipnId = process.env.PESAPAL_IPN_ID;
        
        if (!ipnId) {
            console.log('3. Registering new IPN...');
            
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
            console.log('4. IPN registered:', ipnId);
        }

        // ✅ STEP 3: Generate UNIQUE Merchant Reference
        // Format: GWA + Timestamp + Random Number (no underscores, always unique)
        const uniqueId = Date.now().toString(); // e.g., "1748172774292"
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // e.g., "0372"
        const merchantReference = `GWA${uniqueId}${randomSuffix}`;
        
        console.log('5. Generated Merchant Reference:', merchantReference);
        
        // Format amount to 2 decimal places
        const formattedAmount = Number(amount).toFixed(2);
        
        // Format cart items for description
        let description = 'Ebook purchase';
        if (cart && cart.length > 0) {
            const titles = cart.map(item => item.title).join(', ');
            description = titles.substring(0, 200);
        }
        
        // ✅ STEP 4: Build order request
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

        console.log('6. Submitting order with data:', JSON.stringify({
            merchant_reference: orderData.merchant_reference,
            amount: orderData.amount,
            currency: orderData.currency,
            description: orderData.description.substring(0, 50) + '...'
        }, null, 2));

        // Step 5: Submit order to Pesapal
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
            console.log('7. ✅ Order created successfully!');
            console.log('8. Redirect URL:', orderResult.redirect_url);
            
            return res.status(200).json({
                success: true,
                redirect_url: orderResult.redirect_url,
                order_tracking_id: orderResult.order_tracking_id,
                merchant_reference: merchantReference
            });
        } else {
            console.error('❌ Order creation failed:', JSON.stringify(orderResult, null, 2));
            return res.status(400).json({
                success: false,
                error: orderResult.error?.message || 'Failed to create Pesapal order. Please try again.'
            });
        }

    } catch (error) {
        console.error('❌ Pesapal error:', error.message);
        console.error('Stack:', error.stack);
        return res.status(500).json({
            success: false,
            error: 'Payment initiation failed: ' + error.message
        });
    }
}
                success: true,
                redirect_url: orderResult.redirect_url,
                order_tracking_id: orderResult.order_tracking_id,
                merchant_reference: merchantReference
            });
        } else {
            console.error('❌ Order creation failed:', JSON.stringify(orderResult, null, 2));
            return res.status(400).json({
                success: false,
                error: orderResult.error?.message || 'Failed to create Pesapal order. Please try again.'
            });
        }

    } catch (error) {
        console.error('❌ Pesapal error:', error.message);
        console.error('Stack:', error.stack);
        return res.status(500).json({
            success: false,
            error: 'Payment initiation failed: ' + error.message
        });
    }
}
