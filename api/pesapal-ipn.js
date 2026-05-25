// api/pesapal-ipn.js
// Pesapal Instant Payment Notification - LIVE PRODUCTION

export default async function handler(req, res) {
    // Always respond with 200 to acknowledge receipt
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const orderTrackingId = req.method === 'GET' 
            ? req.query.OrderTrackingId 
            : req.body.OrderTrackingId || req.query.OrderTrackingId;

        if (!orderTrackingId) {
            console.log('IPN received without OrderTrackingId');
            return res.status(200).send('IPN received');
        }

        const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
        const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

        // LIVE PRODUCTION URL
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
        
        if (!authData.token) {
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

        console.log('IPN Transaction Status:', {
            orderTrackingId: orderTrackingId,
            status: statusData.status,
            amount: statusData.amount,
            paymentMethod: statusData.payment_method,
            createdAt: statusData.created_at
        });

        if (statusData.status === 'COMPLETED') {
            // Payment successful - Update your database here
            // await supabase.from('orders').update({ 
            //     status: 'completed', 
            //     transaction_id: orderTrackingId,
            //     payment_method: statusData.payment_method
            // }).eq('merchant_reference', statusData.merchant_reference);
            
            console.log(`✅ Payment completed: ${orderTrackingId}`);
        } else if (statusData.status === 'FAILED') {
            console.log(`❌ Payment failed: ${orderTrackingId}`);
        } else if (statusData.status === 'PENDING') {
            console.log(`⏳ Payment pending: ${orderTrackingId}`);
        }

        res.status(200).send('IPN received');

    } catch (error) {
        console.error('IPN error:', error);
        res.status(200).send('IPN received with error');
    }
}
