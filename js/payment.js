// ============================================
// PAYMENT PROCESSING - CORRECTED FUNCTION NAMES
// ============================================

let currentOrderId = null;

async function processPayment(method) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    
    const currency = localStorage.getItem('currency') || 'USD';
    let total = 0;
    cart.forEach(item => {
        if (currency === 'USD') {
            total += item.price_usd;
        } else {
            total += item.price_kes;
        }
    });
    
    const userEmail = localStorage.getItem('user_email') || 'customer@example.com';
    
    switch(method) {
        case 'paypal':
            await processPayPal(total, currency);
            break;
        case 'flutterwave':
            await processFlutterwave(total, currency, userEmail);
            break;
        case 'mpesa':
            await processMpesa(total, userEmail);
            break;
    }
}

async function processPayPal(amount, currency) {
    showNotification('Redirecting to PayPal...');
    
    try {
        // CORRECTED: using hyphen instead of space
        const response = await fetch('/.netlify/functions/create-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                method: 'paypal',
                amount: amount,
                currency: currency,
                orderId: currentOrderId
            })
        });
        
        const data = await response.json();
        
        if (data.approvalUrl) {
            window.location.href = data.approvalUrl;
        } else if (data.error) {
            showNotification('Payment error: ' + data.error);
        }
    } catch (error) {
        console.error('PayPal error:', error);
        showNotification('Payment processing failed. Please try again.');
    }
}

async function processFlutterwave(amount, currency, email) {
    showNotification('Preparing Flutterwave payment...');
    
    try {
        // CORRECTED: using hyphen instead of space
        const response = await fetch('/.netlify/functions/create-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                method: 'flutterwave',
                amount: amount,
                currency: currency,
                email: email,
                orderId: currentOrderId
            })
        });
        
        const data = await response.json();
        
        if (data.paymentLink) {
            window.location.href = data.paymentLink;
        } else if (data.error) {
            showNotification('Payment error: ' + data.error);
        }
    } catch (error) {
        console.error('Flutterwave error:', error);
        showNotification('Payment processing failed. Please try again.');
    }
}

async function processMpesa(amount, phoneNumber = null) {
    if (!phoneNumber) {
        phoneNumber = prompt('Enter your M-Pesa phone number (e.g., 2547XXXXXXXX):');
        if (!phoneNumber) {
            showNotification('Phone number is required for M-Pesa payment');
            return;
        }
    }
    
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+')) {
        formattedPhone = formattedPhone.substring(1);
    }
    
    showNotification('Initiating M-Pesa payment... Check your phone for the STK push.');
    
    try {
        // CORRECTED: using hyphen instead of space
        const response = await fetch('/.netlify/functions/create-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                method: 'mpesa',
                amount: Math.round(amount),
                phoneNumber: formattedPhone,
                orderId: currentOrderId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('STK push sent! Please check your phone and enter your PIN.');
            await pollPaymentStatus(data.checkoutRequestID);
        } else if (data.error) {
            showNotification('M-Pesa error: ' + data.error);
        }
    } catch (error) {
        console.error('M-Pesa error:', error);
        showNotification('Payment processing failed. Please try again.');
    }
}

async function pollPaymentStatus(checkoutRequestID) {
    let attempts = 0;
    const maxAttempts = 30;
    
    const interval = setInterval(async () => {
        attempts++;
        
        try {
            // CORRECTED: using hyphen instead of space
            const response = await fetch(`/.netlify/functions/verify-payment?checkoutRequestID=${checkoutRequestID}`);
            const data = await response.json();
            
            if (data.status === 'completed') {
                clearInterval(interval);
                handleSuccessfulPayment(data.orderId);
            } else if (data.status === 'failed') {
                clearInterval(interval);
                showNotification('Payment failed. Please try again.');
                window.location.href = 'failure.html';
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                showNotification('Payment timeout. Please check your M-Pesa statement.');
            }
        } catch (error) {
            console.error('Status check error:', error);
        }
    }, 1000);
}

async function handleSuccessfulPayment(orderId) {
    localStorage.removeItem('cart');
    const cart = JSON.parse(sessionStorage.getItem('checkoutCart') || '[]');
    const downloadLinks = cart.map(item => item.download_link).filter(link => link);
    sessionStorage.setItem('downloadLinks', JSON.stringify(downloadLinks));
    window.location.href = 'success.html';
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1e3a8a;
        color: white;
        padding: 1rem 2rem;
        border-radius: 50px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

if (document.getElementById('checkout-container')) {
    document.addEventListener('DOMContentLoaded', initCheckout);
}

if (document.getElementById('success-container')) {
    document.addEventListener('DOMContentLoaded', initSuccess);
}