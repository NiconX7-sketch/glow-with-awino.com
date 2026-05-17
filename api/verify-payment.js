// api/verify-payment.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { transactionId, paymentMethod, amount, email, cart } = req.body;

  try {
    let isValid = false;
    let transactionData = null;

    if (paymentMethod === 'paypal') {
      // Get PayPal access token
      const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
      const tokenRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials'
      });
      const { access_token } = await tokenRes.json();
      
      // Verify order
      const orderRes = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${transactionId}`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      const orderData = await orderRes.json();
      isValid = orderData.status === 'COMPLETED';
      transactionData = orderData;
    } 
    else if (paymentMethod === 'paystack') {
      const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${transactionId}`, {
        headers: { 'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
      });
      const paystackData = await paystackRes.json();
      isValid = paystackData.data?.status === 'success';
      transactionData = paystackData.data;
    }

    if (isValid) {
      // Generate one-time download token (expires in 24 hours)
      const downloadToken = Buffer.from(`${transactionId}_${Date.now()}_${Math.random()}`).toString('base64');
      
      // Store in your database (Supabase) - optional but recommended
      // await supabase.from('purchases').insert({ token: downloadToken, transaction_id: transactionId, expires_at: new Date(Date.now() + 86400000) });
      
      return res.status(200).json({
        success: true,
        downloadToken: downloadToken,
        message: 'Payment verified successfully'
      });
    } else {
      return res.status(400).json({ success: false, error: 'Payment not verified' });
    }
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
}
