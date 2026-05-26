// api/pesapal-ipn.js - COMPLETE WORKING VERSION

export default async function handler(req, res) {
    // Log everything for debugging
    console.log('=== IPN RECEIVED ===');
    console.log('Method:', req.method);
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    
    // Extract order tracking ID from request
    let orderTrackingId = null;
    let merchantReference = null;
    
    if (req.method === 'GET') {
        orderTrackingId = req.query.OrderTrackingId;
        merchantReference = req.query.OrderMerchantReference;
    } else if (req.method === 'POST') {
        orderTrackingId = req.body?.OrderTrackingId;
        merchantReference = req.body?.OrderMerchantReference;
    }
    
    console.log('OrderTrackingId:', orderTrackingId);
    console.log('MerchantReference:', merchantReference);
    
    // Respond immediately to acknowledge receipt (prevents retries)
    res.status(200).json({
        orderNotificationType: req.query.OrderNotificationType || req.body?.OrderNotificationType || 'IPNCHANGE',
        orderTrackingId: orderTrackingId,
        orderMerchantReference: merchantReference,
        status: 200
    });
    
    // Process payment asynchronously
    if (orderTrackingId) {
        try {
            const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
            const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
            
            // Get token
            const authRes = await fetch('https://pay.pesapal.com/v3/api/Auth/RequestToken', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret })
            });
            const authData = await authRes.json();
            
            if (authData.token) {
                // Get transaction status
                const statusRes = await fetch(`https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
                    headers: { 'Authorization': `Bearer ${authData.token}` }
                });
                const statusData = await statusRes.json();
                
                console.log('Payment Status:', statusData.payment_status_description);
                console.log('Amount:', statusData.amount);
                console.log('Payment Method:', statusData.payment_method);
                
                if (statusData.payment_status_description === 'COMPLETED') {
                    console.log(`✅ PAYMENT COMPLETED: ${orderTrackingId}`);
                    // Update your database here
                }
            }
        } catch (error) {
            console.error('IPN processing error:', error.message);
        }
    }
}
