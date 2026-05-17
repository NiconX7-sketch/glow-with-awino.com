// api/create-mpesa.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { amount, phoneNumber, email, cart } = req.body;

  try {
    // Clean phone number to international format
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.substring(1);
    if (!cleanPhone.startsWith('254')) cleanPhone = '254' + cleanPhone;
    if (cleanPhone.startsWith('254') && cleanPhone.length === 12) cleanPhone = '254' + cleanPhone.substring(3);

    // Initiate Paystack M-Pesa charge
    const response = await fetch('https://api.paystack.co/charge', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        amount: Math.round(amount * 100),
        currency: 'KES',
        mobile_money: {
          phone: cleanPhone,
          provider: 'mpesa'
        },
        metadata: {
          cart: JSON.stringify(cart),
          payment_for: 'ebooks'
        }
      })
    });

    const data = await response.json();
    
    if (data.status && data.data) {
      return res.status(200).json({
        success: true,
        reference: data.data.reference,
        message: 'STK push sent to ' + cleanPhone
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        error: data.message || 'M-Pesa charge failed',
        details: data 
      });
    }
  } catch (error) {
    console.error('M-Pesa error:', error);
    return res.status(500).json({ success: false, error: 'Payment initiation failed: ' + error.message });
  }
}
