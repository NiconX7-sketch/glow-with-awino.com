// api/verify-payment.js - Updated to support Pesapal
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { transactionId, paymentMethod, amount, email, cart } = req.body;

    try {
        let isValid = false;
        let transactionData = null;

        if (paymentMethod === 'paypal') {
            // PayPal verification (already working)
            const clientId = process.env.PAYPAL_CLIENT_ID;
            const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
            
            const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
            
            const tokenRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
                method: 'POST',
                headers: { 
                    'Authorization': `Basic ${auth}`, 
                    'Content-Type': 'application/x-www-form-urlencoded' 
                },
                body: 'grant_type=client_credentials'
            });
            
            const { access_token } = await tokenRes.json();
            
            const orderRes = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${transactionId}`, {
                headers: { 'Authorization': `Bearer ${access_token}` }
            });
            
            const orderData = await orderRes.json();
            isValid = orderData.status === 'COMPLETED';
            transactionData = orderData;
        } 
        else if (paymentMethod === 'paystack') {
            // Paystack verification
            const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
            
            const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${transactionId}`, {
                headers: { 
                    'Authorization': `Bearer ${paystackSecretKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const paystackData = await paystackRes.json();
            isValid = paystackData.data?.status === 'success';
            transactionData = paystackData.data;
        }
        else if (paymentMethod === 'pesapal') {
            // Pesapal verification
            const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
            const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
            const PESAPAL_API = 'https://pay.pesapal.com/v3';
            
            // Get token
            const authRes = await fetch(`${PESAPAL_API}/api/Auth/RequestToken`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret })
            });
            const { token } = await authRes.json();
            
            // Get transaction status
            const statusRes = await fetch(`${PESAPAL_API}/api/Transactions/GetTransactionStatus?orderTrackingId=${transactionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const statusData = await statusRes.json();
            
            isValid = statusData.status === 'COMPLETED';
            transactionData = statusData;
        }
        else {
            return res.status(400).json({ success: false, error: 'Unknown payment method' });
        }

        if (isValid) {
            const downloadToken = Buffer.from(`${transactionId}_${Date.now()}_${Math.random()}`).toString('base64');
            
            return res.status(200).json({
                success: true,
                downloadToken: downloadToken,
                message: 'Payment verified successfully',
                transactionId: transactionId
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                error: 'Payment not verified or incomplete' 
            });
        }
        
    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Verification failed. Please contact support.' 
        });
    }
}
