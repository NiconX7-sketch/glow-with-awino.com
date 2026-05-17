// api/paystack-webhook.js
// Receive automatic payment confirmations from Paystack

export default async function handler(req, res) {
  // Only accept POST from Paystack
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Verify webhook signature (optional but recommended)
  const signature = req.headers['x-paystack-signature'];
  const secret = process.env.PAYSTACK_SECRET_KEY;
  
  // Simple signature verification
  const crypto = require('crypto');
  const hash = crypto.createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (signature !== hash) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const event = req.body;
  
  // Handle successful charge event
  if (event.event === 'charge.success') {
    const transaction = event.data;
    const reference = transaction.reference;
    const amount = transaction.amount / 100;
    const email = transaction.customer.email;
    const metadata = transaction.metadata;
    
    console.log(`✅ Payment confirmed: ${reference} - KES ${amount} - ${email}`);
    
    // TODO: Update your database
    // await supabase.from('orders').update({ 
    //   status: 'completed', 
    //   transaction_id: reference 
    // }).eq('reference', reference);
    
    // TODO: Send email with download links
    // await sendDownloadEmail(email, metadata);
    
    return res.status(200).json({ received: true });
  }
  
  // Handle other events
  console.log('Webhook event:', event.event);
  return res.status(200).json({ received: true });
}
