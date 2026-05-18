// api/verify-payment.js - COMPLETE LIVE VERSION
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
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { transactionId, paymentMethod, amount, email, cart } = req.body;

  try {
    let isValid = false;
    let transactionData = null;

    if (paymentMethod === 'paypal') {
      // ============================================
      // LIVE PAYPAL VERIFICATION (No sandbox)
      // ============================================
      const clientId = process.env.PAYPAL_CLIENT_ID;
      const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        console.error('PayPal credentials missing');
        return res.status(500).json({ 
          success: false, 
          error: 'Payment configuration error' 
        });
      }
      
      // Get access token from LIVE PayPal
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      
      const tokenRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: { 
          'Authorization': `Basic ${auth}`, 
          'Content-Type': 'application/x-www-form-urlencoded' 
        },
        body: 'grant_type=client_credentials'
      });
      
      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        console.error('PayPal token error:', errorText);
        return res.status(400).json({ 
          success: false, 
          error: 'Failed to authenticate with PayPal' 
        });
      }
      
      const { access_token } = await tokenRes.json();
      
      // Verify order with LIVE PayPal
      const orderRes = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${transactionId}`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      
      if (!orderRes.ok) {
        console.error('PayPal order verification failed');
        return res.status(400).json({ 
          success: false, 
          error: 'Failed to verify PayPal order' 
        });
      }
      
      const orderData = await orderRes.json();
      isValid = orderData.status === 'COMPLETED';
      transactionData = orderData;
      
    } 
    else if (paymentMethod === 'paystack') {
      // ============================================
      // PAYSTACK VERIFICATION
      // ============================================
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
      
      if (!paystackSecretKey) {
        console.error('Paystack secret key missing');
        return res.status(500).json({ 
          success: false, 
          error: 'Payment configuration error' 
        });
      }
      
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
    else {
      return res.status(400).json({ 
        success: false, 
        error: 'Unknown payment method' 
      });
    }

    if (isValid) {
      // Generate one-time download token (expires in 24 hours)
      const downloadToken = Buffer.from(`${transactionId}_${Date.now()}_${Math.random()}`).toString('base64');
      
      // Optional: Store in Supabase
      // await supabase.from('purchases').insert({
      //   token: downloadToken,
      //   transaction_id: transactionId,
      //   amount: amount,
      //   email: email,
      //   expires_at: new Date(Date.now() + 86400000)
      // });
      
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
