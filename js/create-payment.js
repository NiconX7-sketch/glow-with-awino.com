// api/create-payment.js - ABSOLUTE MINIMAL VERSION
export default function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    
    // Always return success - no async, no fetch, no dependencies
    return res.status(200).json({
        success: true,
        redirectUrl: 'https://www.sandbox.paypal.com/checkoutnow',
        approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow',
        authorizationUrl: 'https://paystack.com/pay',
        message: 'API is working - test mode'
    });
}
