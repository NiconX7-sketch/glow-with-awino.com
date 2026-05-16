// api/create-payment.js - MINIMAL WORKING VERSION
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    
    // Log the request
    console.log('Request method:', req.method);
    console.log('Request body:', req.body);
    
    // ALWAYS return a success response
    return res.status(200).json({
        success: true,
        message: 'API is working',
        timestamp: new Date().toISOString(),
        approvalUrl: 'https://www.paypal.com',
        authorizationUrl: 'https://paystack.com/pay/test'
    });
}
