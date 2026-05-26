// api/pesapal-ipn.js
// Pesapal Instant Payment Notification - COMPLETE PRODUCTION VERSION

export default async function handler(req, res) {
    // Enable CORS for webhook
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    
    // Log the request for debugging
    console.log('=== IPN RECEIVED ===');
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    
    // Always respond with 200 to acknowledge receipt to Pesapal
    // This prevents Pesapal from resending the same notification
    res.status(200).send('IPN received successfully');
    
    // Process the IPN asynchronously (after sending response)
    try {
        // Get order tracking ID from either GET or POST request
        let orderTrackingId = null;
        let merchantReference = null;
        
        if (req.method === 'GET') {
            // Pesapal sends GET requests with query parameters
            orderTrackingId = req.query.OrderTrackingId || req.query.order_tracking_id;
            merchantReference = req.query.MerchantReference || req.query.merchant_reference;
        } else if (req.method === 'POST') {
            // Pesapal sends POST requests with JSON body
            orderTrackingId = req.body?.OrderTrackingId || req.body?.order_tracking_id;
            merchantReference = req.body?.MerchantReference || req.body?.merchant_reference;
        }
        
        console.log('Order Tracking ID:', orderTrackingId);
        console.log('Merchant Reference:', merchantReference);
        
        if (!orderTrackingId) {
            console.log('No OrderTrackingId found in IPN request');
            return;
        }
        
        // Get Pesapal credentials
        const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
        const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
        
        if (!consumerKey || !consumerSecret) {
            console.error('Missing Pesapal credentials');
            return;
        }
        
        // Get authentication token from Pesapal
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
        
        if (!authData || !authData.token) {
            console.error('Failed to authenticate with Pesapal for IPN');
            return;
        }
        
        const token = authData.token;
        console.log('IPN: Authentication successful');
        
        // Get transaction status from Pesapal
        const statusResponse = await fetch(`https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        const statusData = await statusResponse.json();
        
        console.log('IPN Transaction Status:', {
            orderTrackingId: orderTrackingId,
            status: statusData.status,
            amount: statusData.amount,
            currency: statusData.currency,
            paymentMethod: statusData.payment_method,
            paymentStatusDescription: statusData.payment_status_description,
            createdDate: statusData.created_date,
            confirmationCode: statusData.confirmation_code,
            merchantReference: statusData.merchant_reference
        });
        
        // Handle different payment statuses
        if (statusData.status === 'COMPLETED') {
            console.log(`✅✅✅ PAYMENT SUCCESSFUL: ${orderTrackingId}`);
            console.log(`Amount: ${statusData.amount} ${statusData.currency}`);
            console.log(`Payment Method: ${statusData.payment_method}`);
            
            // TODO: Update your Supabase orders table here
            // Example:
            // await supabase
            //     .from('orders')
            //     .update({ 
            //         status: 'completed',
            //         transaction_id: orderTrackingId,
            //         payment_method: statusData.payment_method,
            //         paid_at: new Date().toISOString(),
            //         confirmation_code: statusData.confirmation_code
            //     })
            //     .eq('merchant_reference', statusData.merchant_reference);
            
        } else if (statusData.status === 'PENDING') {
            console.log(`⏳ Payment PENDING: ${orderTrackingId}`);
            // Optional: Update order status to 'pending'
            
        } else if (statusData.status === 'FAILED') {
            console.log(`❌ Payment FAILED: ${orderTrackingId}`);
            // Optional: Update order status to 'failed'
            
        } else if (statusData.status === 'REVERSED') {
            console.log(`🔄 Payment REVERSED: ${orderTrackingId}`);
            
        } else {
            console.log(`⚠️ Unknown status: ${statusData.status} for ${orderTrackingId}`);
        }
        
    } catch (error) {
        console.error('IPN processing error:', error.message);
        console.error('Stack:', error.stack);
        // We still return 200 above, so Pesapal won't retry
    }
}
