// js/payments.js - Payment processing functions

// Process payment based on selected method
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
    
    const userEmail = localStorage.getItem('user_email') || prompt('Enter your email for receipt:', 'customer@example.com');
    
    switch(method) {
        case 'paypal':
            await processPayPal(total, currency);
            break;
        case 'flutterwave':
            await processFlutterwave(total, currency, userEmail);
            break;
        case 'mpesa':
            await processMpesa(total);
            break;
    }
}

async function processPayPal(amount, currency) {
    showNotification('Redirecting to PayPal...');
    try {
        const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method: 'paypal', amount: amount, currency: currency })
        });
        const data = await response.json();
        if (data.approvalUrl) {
            window.location.href = data.approvalUrl;
        } else {
            showNotification('Payment failed. Please try again.', 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

async function processFlutterwave(amount, currency, email) {
    showNotification('Preparing payment...');
    try {
        const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method: 'flutterwave', amount: amount, currency: currency, email: email })
        });
        const data = await response.json();
        if (data.paymentLink) {
            window.location.href = data.paymentLink;
        } else {
            showNotification('Payment failed. Please try again.', 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

async function processMpesa(amount) {
    const phone = prompt('Enter your M-Pesa phone number (e.g., 2547XXXXXXXX):', '2547');
    if (!phone) return;
    showNotification('Initiating M-Pesa payment... Check your phone.');
    try {
        const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method: 'mpesa', amount: Math.round(amount), phoneNumber: phone })
        });
        const data = await response.json();
        if (data.success) {
            showNotification('STK push sent! Check your phone.', 'success');
            setTimeout(() => {
                localStorage.removeItem('cart');
                window.location.href = 'success.html';
            }, 5000);
        } else {
            showNotification('Payment failed.', 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `position: fixed; bottom: 20px; right: 20px; background: ${type === 'error' ? '#dc2626' : '#22c55e'}; color: white; padding: 1rem 2rem; border-radius: 50px; z-index: 1000;`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}
