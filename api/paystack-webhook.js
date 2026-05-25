// api/paystack-webhook.js
import crypto from 'crypto';

export default async function handler(req, res) {
    // Always respond with 200 to acknowledge receipt to Paystack
    if (req.method !== 'POST') {
        return res.status(200).send('Method not allowed');
    }

    try {
        // Get the raw request body for signature verification
        let rawBody = '';
        req.on('data', chunk => { rawBody += chunk; });
        
        await new Promise((resolve) => {
            req.on('end', () => resolve());
        });
        
        // Verify Paystack signature (security best practice)
        const signature = req.headers['x-paystack-signature'];
        const secret = process.env.PAYSTACK_SECRET_KEY;
        
        const hash = crypto.createHmac('sha512', secret)
            .update(rawBody)
            .digest('hex');
        
        if (signature !== hash) {
            console.error('Invalid Paystack signature');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const event = JSON.parse(rawBody);
        
        if (event.event === 'charge.success') {
            const transaction = event.data;
            const reference = transaction.reference;
            const amount = transaction.amount / 100;
            const email = transaction.customer.email;
            
            console.log(`✅ Paystack webhook: Payment successful`, {
                reference,
                amount,
                email,
                channel: transaction.channel
            });
            
            // Update your database here
            // await supabase.from('orders').update({ 
            //     status: 'completed', 
            //     transaction_id: reference,
            //     paid_at: new Date().toISOString()
            // }).eq('reference', reference);
        }
        
        // Always return 200 to prevent Paystack from resending [citation:2]
        res.status(200).json({ received: true });
        
    } catch (error) {
        console.error('Paystack webhook error:', error);
        res.status(200).json({ received: true });
    }
}
