// api/create-payment.js - VERCEL VERSION
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    
    try {
        const { method, amount, currency, email, phoneNumber } = req.body;
        
        let response = {};
        
        switch(method) {
            case 'paypal':
                response = {
                    success: true,
                    message: 'PayPal payment initiated',
                    approvalUrl: null
                };
                break;
                
            case 'flutterwave':
                response = {
                    success: true,
                    message: 'Flutterwave payment initiated',
                    paymentLink: null
                };
                break;
                
            case 'paystack':
                response = {
                    success: true,
                    message: 'Paystack payment initiated',
                    authorizationUrl: null
                };
                break;
                
            case 'mpesa':
                response = {
                    success: true,
                    message: 'M-Pesa STK push sent',
                    checkoutRequestID: 'TEST_' + Date.now()
                };
                break;
                
            default:
                throw new Error('Unknown payment method');
        }
        
        return res.status(200).json(response);
        
    } catch (error) {
        console.error('Payment error:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}