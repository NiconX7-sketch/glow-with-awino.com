// api/create-mpesa.js
// Complete M-Pesa STK Push integration with Paystack

export default async function handler(req, res) {
  // ============================================
  // CORS HEADERS (Required for cross-origin requests)
  // ============================================
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Please use POST.' 
    });
  }

  try {
    // ============================================
    // EXTRACT AND VALIDATE INPUT DATA
    // ============================================
    const { amount, phoneNumber, email, cart, orderId } = req.body;
    
    // Validate required fields
    if (!amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount is required' 
      });
    }
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number is required' 
      });
    }
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email address is required' 
      });
    }
    
    // ============================================
    // FORMAT PHONE NUMBER FOR PAYSTACK
    // ============================================
    // Paystack expects format: 2547XXXXXXXX (no spaces, no leading zero)
    let formattedPhone = phoneNumber.replace(/\D/g, ''); // Remove all non-digits
    
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }
    
    if (formattedPhone.startsWith('254') && formattedPhone.length === 12) {
      // Already correct format (2547XXXXXXXX)
    } else if (formattedPhone.startsWith('254') && formattedPhone.length === 13) {
      // Remove extra digit
      formattedPhone = formattedPhone.substring(0, 3) + formattedPhone.substring(4);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }
    
    // Final validation - should be 12 digits starting with 254
    if (!formattedPhone.match(/^254[17]\d{8}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Kenyan phone number format. Use 07XX XXX XXX or 2547XXXXXXXX'
      });
    }
    
    // ============================================
    // GET PAYSTACK SECRET KEY FROM ENVIRONMENT
    // ============================================
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not found in environment variables');
      return res.status(500).json({
        success: false,
        error: 'Payment configuration error. Please contact support.'
      });
    }
    
    // ============================================
    // INITIALIZE PAYSTACK M-PESA CHARGE
    // ============================================
    console.log(`Initiating M-Pesa charge for ${formattedPhone}, amount: KES ${amount}`);
    
    const paystackResponse = await fetch('https://api.paystack.co/charge', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        amount: Math.round(amount * 100), // Convert to cents/ko bo
        currency: 'KES',
        mobile_money: {
          phone: formattedPhone,
          provider: 'mpesa'
        },
        metadata: {
          cart: cart ? JSON.stringify(cart) : null,
          orderId: orderId || null,
          phone: formattedPhone,
          payment_for: 'ebooks',
          timestamp: new Date().toISOString()
        }
      })
    });
    
    const responseData = await paystackResponse.json();
    
    // ============================================
    // HANDLE PAYSTACK RESPONSE
    // ============================================
    console.log('Paystack response:', JSON.stringify(responseData, null, 2));
    
    if (responseData.status && responseData.data) {
      // Successful initialization
      return res.status(200).json({
        success: true,
        reference: responseData.data.reference,
        message: 'STK push sent successfully',
        phone: formattedPhone,
        amount: amount,
        status: responseData.data.status
      });
    } else {
      // Failed initialization
      let errorMessage = 'M-Pesa payment initiation failed';
      
      if (responseData.message) {
        errorMessage = responseData.message;
      }
      
      if (responseData.data && responseData.data.message) {
        errorMessage = responseData.data.message;
      }
      
      // Common error messages
      if (errorMessage.includes('insufficient balance')) {
        errorMessage = 'Insufficient balance in Paystack account';
      } else if (errorMessage.includes('invalid phone')) {
        errorMessage = 'Invalid phone number format. Please check and try again.';
      }
      
      return res.status(400).json({
        success: false,
        error: errorMessage,
        code: responseData.data?.code || 'PAYSTACK_ERROR'
      });
    }
    
  } catch (error) {
    // ============================================
    // HANDLE UNEXPECTED ERRORS
    // ============================================
    console.error('M-Pesa API Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
