// api/create-mpesa.js - Complete M-Pesa integration
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
    const { amount, phoneNumber, email, cart } = req.body;
    
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
    
    // Format phone number for Paystack
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }
    
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }
    
    // Validate Kenyan phone number format
    if (!formattedPhone.match(/^254[17]\d{8}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Kenyan phone number. Use format: 0743XXXXXX or 2547XXXXXXXX'
      });
    }
    
    // Get Paystack secret key from environment
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not found');
      return res.status(500).json({
        success: false,
        error: 'Payment configuration error. Please contact support.'
      });
    }
    
    // Calculate amount in cents/kobo
    const amountInCents = Math.round(amount * 100);
    
    console.log(`Initiating M-Pesa charge: KES ${amount} for ${formattedPhone} (${email})`);
    
    // Initiate Paystack M-Pesa charge
    const paystackResponse = await fetch('https://api.paystack.co/charge', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        amount: amountInCents,
        currency: 'KES',
        mobile_money: {
          phone: formattedPhone,
          provider: 'mpesa'
        },
        metadata: {
          payment_for: 'ebooks',
          customer_email: email,
          customer_phone: formattedPhone,
          cart_items: cart ? cart.length : 0,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    const responseData = await paystackResponse.json();
    
    console.log('Paystack response:', JSON.stringify(responseData, null, 2));
    
    if (responseData.status && responseData.data) {
      return res.status(200).json({
        success: true,
        reference: responseData.data.reference,
        message: 'STK push sent successfully',
        phone: formattedPhone,
        amount: amount
      });
    } else {
      let errorMessage = responseData.message || 'M-Pesa payment initiation failed';
      
      // Provide user-friendly error messages
      if (errorMessage.includes('currency')) {
        errorMessage = 'Currency not supported. Please contact support or use Card/Bank payment.';
      } else if (errorMessage.includes('phone')) {
        errorMessage = 'Invalid phone number. Please check and try again.';
      } else if (errorMessage.includes('balance')) {
        errorMessage = 'Service temporarily unavailable. Please try another payment method.';
      }
      
      return res.status(400).json({
        success: false,
        error: errorMessage,
        code: responseData.data?.code || 'PAYSTACK_ERROR'
      });
    }
    
  } catch (error) {
    console.error('M-Pesa API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Payment initiation failed. Please try again or use another payment method.'
    });
  }
}
