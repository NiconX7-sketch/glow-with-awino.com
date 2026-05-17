// api/webhook.js - Receives automatic payment confirmations
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const event = req.body;
  
  // Handle Paystack webhook
  if (event.event === 'charge.success') {
    const transactionRef = event.data.reference;
    const email = event.data.customer.email;
    const amount = event.data.amount / 100;
    const metadata = event.data.metadata;
    
    console.log(`Payment confirmed via webhook: ${transactionRef} for ${email}`);
    
    // Here you can automatically:
    // 1. Send email with download links
    // 2. Update your database
    // 3. Trigger any automation
    
    return res.status(200).json({ received: true });
  }
  
  // Handle PayPal webhook
  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    console.log('PayPal payment completed:', event.resource.id);
    return res.status(200).json({ received: true });
  }
  
  return res.status(200).json({ received: true });
}
