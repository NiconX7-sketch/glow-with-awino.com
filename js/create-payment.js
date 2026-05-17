// js/payment.js - Frontend payment logic
// This works with your api/verify-payment.js backend

let currentCart = [];
let totalAmount = 0;
let currentCurrency = 'USD';

async function initializePayment(cart, total, currency) {
    currentCart = cart;
    totalAmount = total;
    currentCurrency = currency;
    
    // Set up payment method selectors
    setupPaymentMethodListeners();
}

function setupPaymentMethodListeners() {
    const paypalBtn = document.getElementById('paypal-btn');
    const paystackBtn = document.getElementById('paystack-btn');
    const mpesaBtn = document.getElementById('mpesa-btn');
    
    if (paypalBtn) paypalBtn.addEventListener('click', () => processPayPal());
    if (paystackBtn) paystackBtn.addEventListener('click', () => processPayStack());
    if (mpesaBtn) mpesaBtn.addEventListener('click', () => processMpesa());
}

async function processPayPal() {
    const paypalAmount = currentCurrency === 'USD' ? totalAmount : totalAmount / 130;
    
    showStatus('Creating PayPal order...', 'info');
    
    try {
        // PayPal will call your backend via onApprove
        // The actual PayPal button is rendered separately
        console.log('PayPal processing...');
    } catch (error) {
        showStatus('PayPal error: ' + error.message, 'error');
    }
}

async function processPayStack() {
    const email = prompt('Enter your email address for receipt:');
    if (!email) {
        showStatus('Email is required', 'error');
        return;
    }
    
    showStatus('Preparing Paystack payment...', 'info');
    
    const handler = PaystackPop.setup({
        key: 'pk_live_YOUR_PUBLIC_KEY', // Should come from env
        email: email,
        amount: Math.round(totalAmount * 100),
        currency: currentCurrency,
        ref: 'order_' + Date.now(),
        callback: async (response) => {
            await verifyPayment(response.reference, 'paystack', email);
        },
        onClose: () => showStatus('Payment window closed', 'error')
    });
    handler.openIframe();
}

async function processMpesa() {
    const phone = document.getElementById('mpesa-phone')?.value;
    const email = document.getElementById('mpesa-email')?.value;
    
    if (!phone || !email) {
        showStatus('Phone number and email required for M-Pesa', 'error');
        return;
    }
    
    showStatus('Initiating M-Pesa STK push...', 'info');
    
    try {
        const response = await fetch('/api/create-mpesa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: totalAmount,
                phoneNumber: phone,
                email: email,
                cart: currentCart
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showStatus('STK push sent! Check your phone and enter PIN', 'success');
            
            // Poll for payment confirmation
            pollMpesaStatus(data.reference);
        } else {
            showStatus('M-Pesa failed: ' + (data.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        showStatus('M-Pesa error: ' + error.message, 'error');
    }
}

async function verifyPayment(transactionId, method, email) {
    showStatus('Verifying payment...', 'info');
    
    try {
        const response = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transactionId: transactionId,
                paymentMethod: method,
                amount: totalAmount,
                email: email,
                cart: currentCart
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store download token
            sessionStorage.setItem('downloadToken', data.downloadToken);
            sessionStorage.setItem('purchasedCart', JSON.stringify(currentCart));
            
            showStatus('Payment successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'success.html';
            }, 1500);
        } else {
            showStatus('Payment verification failed: ' + (data.error || 'Try again'), 'error');
        }
    } catch (error) {
        showStatus('Verification error: ' + error.message, 'error');
    }
}

function pollMpesaStatus(reference) {
    let attempts = 0;
    const maxAttempts = 30; // 60 seconds total
    
    const interval = setInterval(async () => {
        attempts++;
        
        try {
            // Check with your backend if payment completed
            const response = await fetch(`/api/check-mpesa-status?reference=${reference}`);
            const data = await response.json();
            
            if (data.status === 'completed') {
                clearInterval(interval);
                await verifyPayment(reference, 'mpesa', sessionStorage.getItem('paymentEmail'));
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                showStatus('Payment timeout. Check your M-Pesa statement.', 'error');
            }
        } catch (error) {
            console.log('Status check failed:', error);
        }
    }, 2000);
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('payment-status');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = `status-message status-${type}`;
        statusDiv.style.display = 'block';
    }
    console.log(`[${type}] ${message}`);
}

// Export functions for use in checkout.html
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializePayment, verifyPayment };
}
