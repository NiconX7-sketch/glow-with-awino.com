// api/create-payment.js - SIMPLEST WORKING VERSION
export default async function handler(req, res) {
    // Always return success - no matter what
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // For testing - always return a PayPal URL
    return res.status(200).json({
        success: true,
        redirectUrl: 'https://www.sandbox.paypal.com/checkoutnow',
        approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow',
        authorizationUrl: 'https://paystack.com/pay',
        message: 'API is working'
    });
}
