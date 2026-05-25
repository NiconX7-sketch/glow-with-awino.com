// api/pesapal-ipn.js
// Pesapal Instant Payment Notification - LIVE PRODUCTION

export default async function handler(req, res) {
    // Always respond with 200 to acknowledge receipt to Pesapal
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).end();
    }
    
    // Always return 200 to prevent Pesapal from resending
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(200).send('IPN received');
    }

    try {
        // Get order tracking ID from query (GET) or body (POST)
        const orderTrackingId = req.method === 'GET' 
            ? req.query.OrderTrackingId 
            : req.body?.OrderTrackingId || req.query?.OrderTrackingId;

        if (!orderTrackingId) {
            console.log('IPN received without OrderTrackingId');
            return res.status(200).send('IPN received');
        }

        const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
        const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

        if (!consumerKey || !consumerSecret) {
            console.error('Missing Pesapal credentials for IPN');
            return res.status(200).send('IPN received');
        }

        // ✅ LIVE PRODUCTION URL
        const PESAPAL_API = 'https://pay.pesapal.com/v3';

        // Get OAuth token
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
            console.error('Failed to authenticate for IPN');
            return res.status(200).send('IPN received');
        }

        const token = authData.token;

        // Get transaction status
        const statusResponse = await fetch(`${PESAPAL_API}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const statusData = await statusResponse.json();

        console.log('💰 IPN Transaction Status:', {
            orderTrackingId: orderTrackingId,
            status: statusData.status,
            amount: statusData.amount,
            paymentMethod: statusData.payment_method,
            createdAt: statusData.created_at,
            merchantReference: statusData.merchant_reference
        });

        if (statusData.status === 'COMPLETED') {
            console.log(`✅✅✅ Payment COMPLETED: ${orderTrackingId}`);
            // TODO: Update your database here
            // Example: await supabase.from('orders').update({ status: 'completed' }).eq('merchant_reference', statusData.merchant_reference);
        } else if (statusData.status === 'FAILED') {
            console.log(`❌ Payment FAILED: ${orderTrackingId}`);
        } else if (statusData.status === 'PENDING') {
            console.log(`⏳ Payment PENDING: ${orderTrackingId}`);
        }

        res.status(200).send('IPN received');

    } catch (error) {
        console.error('IPN error:', error);
        // Still return 200 to prevent retries
        res.status(200).send('IPN received with error');
    }
}
