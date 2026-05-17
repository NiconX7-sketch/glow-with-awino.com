// api/verify-mpesa.js
// Verify M-Pesa payment status using Paystack reference

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // Allow both GET and POST
  const reference = req.method === 'GET' ? req.query.reference : req.body.reference;
  
  if (!reference) {
    return res.status(400).json({ 
      success: false, 
      error: 'Transaction reference is required' 
    });
  }
  
  try {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!paystackSecretKey) {
      return res.status(500).json({
        success: false,
        error: 'Payment configuration error'
      });
    }
    
    // Verify transaction with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await verifyResponse.json();
    
    if (data.status && data.data) {
      const transaction = data.data;
      
      if (transaction.status === 'success') {
        return res.status(200).json({
          success: true,
          status: 'completed',
          amount: transaction.amount / 100,
          reference: transaction.reference,
          paidAt: transaction.paid_at,
          customer: transaction.customer
        });
      } else if (transaction.status === 'pending') {
        return res.status(200).json({
          success: false,
          status: 'pending',
          message: 'Payment pending. Check your phone for STK push.'
        });
      } else {
        return res.status(200).json({
          success: false,
          status: 'failed',
          message: 'Payment failed. Please try again.'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: data.message || 'Verification failed'
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
