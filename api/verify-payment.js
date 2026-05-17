// api/create-mpesa-payment.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { amount, phoneNumber, email } = req.body;

  try {
    // Format phone number to international format (2547XXXXXXXX)
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
    if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone;

    // Paystack M-Pesa STK Push
    const response = await fetch('https://api.paystack.co/charge', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        amount: Math.round(amount * 100),
        mobile_money: {
          phone: formattedPhone,
          provider: 'mpesa'
        }
      })
    });

    const data = await response.json();
    
    if (data.status) {
      return res.status(200).json({
        success: true,
        reference: data.data.reference,
        message: 'STK push sent to your phone'
      });
    } else {
      return res.status(400).json({ success: false, error: data.message });
    }
  } catch (error) {
    console.error('M-Pesa error:', error);
    return res.status(500).json({ success: false, error: 'Payment initiation failed' });
  }
}
