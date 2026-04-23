// js/payments.js - Payment processing (PayPal, Paystack, M-Pesa)

let currentOrderId = null;

async function processPayment(method) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
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
    
    const userEmail = localStorage.getItem('user_email') || prompt('Enter your email address:', 'customer@example.com');
    
    if (!userEmail && (method === 'paystack')) {
        alert('Email is required for payment');
        return;
    }
    
    // Create order in database
    const SUPABASE_URL = 'https://orxrpwncwyrkmubqywhw.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yeHJwd25jd3lya211YnF5d2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjYwMjYsImV4cCI6MjA5MTY0MjAyNn0.I2eYzCfOnRf9F2h9f1sfcUTHNaU6rfdjVdKAti0KR4c';
    const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: order } = await supabase
        .from('orders')
        .insert([{
            user_email: userEmail,
            product_ids: cart.map(item => item.id),
            total_amount: total,
            currency: currency,
            payment_method: method,
            status: 'pending'
        }])
        .select();
    
    currentOrderId = order?.[0]?.id;
    
    switch(method) {
        case 'paypal':
            await processPayPal(total, currency);
            break;
        case 'paystack':
            await processPaystack(total, currency, userEmail);
            break;
        case 'mpesa':
            await processMpesa(total);
            break;
    }
}

async function processPayPal(amount, currency) {
    showNotification('Redirecting to PayPal...', 'info');
    
    try {
        const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        } else {
            showNotification('Payment failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('PayPal error:', error);
        showNotification('Payment processing failed. Please try again.', 'error');
    }
}

async function processPaystack(amount, currency, email) {
    showNotification('Preparing Paystack payment...', 'info');
    
    try {
        const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                method: 'paystack',
                amount: amount,
                currency: currency,
                email: email,
                orderId: currentOrderId
            })
        });
        
        const data = await response.json();
        
        if (data.authorizationUrl) {
            window.location.href = data.authorizationUrl;
        } else {
            showNotification('Payment failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Paystack error:', error);
        showNotification('Payment processing failed. Please try again.', 'error');
    }
}

async function processMpesa(amount) {
    const phone = prompt('Enter your M-Pesa phone number (e.g., 2547XXXXXXXX):', '2547');
    
    if (!phone) {
        showNotification('Phone number is required for M-Pesa payment', 'error');
        return;
    }
    
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+')) {
        formattedPhone = formattedPhone.substring(1);
    }
    
    showNotification('Initiating M-Pesa payment... Check your phone.', 'info');
    
    try {
        const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                method: 'mpesa',
                amount: Math.round(amount),
                phoneNumber: formattedPhone,
                orderId: currentOrderId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('STK push sent! Check your phone and enter PIN.', 'success');
            
            // Poll for payment status
            let attempts = 0;
            const interval = setInterval(async () => {
                attempts++;
                const statusResponse = await fetch(`/api/verify-payment?checkoutRequestID=${data.checkoutRequestID}`);
                const statusData = await statusResponse.json();
                
                if (statusData.status === 'completed') {
                    clearInterval(interval);
                    handleSuccessfulPayment();
                } else if (statusData.status === 'failed' || attempts > 30) {
                    clearInterval(interval);
                    showNotification('Payment timeout. Please check your M-Pesa statement.', 'error');
                }
            }, 2000);
        } else {
            showNotification('Payment initiation failed: ' + (data.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('M-Pesa error:', error);
        showNotification('Payment processing failed. Please try again.', 'error');
    }
}

function handleSuccessfulPayment() {
    showNotification('Payment successful! Redirecting...', 'success');
    localStorage.removeItem('cart');
    sessionStorage.removeItem('checkoutCart');
    setTimeout(() => {
        window.location.href = 'success.html';
    }, 2000);
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'info' ? '#3b82f6' : '#22c55e'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 50px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Initialize checkout page
if (document.getElementById('checkout-container')) {
    document.addEventListener('DOMContentLoaded', () => {
        const cart = JSON.parse(sessionStorage.getItem('checkoutCart') || '[]');
        const currency = localStorage.getItem('currency') || 'USD';
        
        if (cart.length === 0) {
            window.location.href = 'shop.html';
        }
        
        let total = 0;
        const orderItems = document.getElementById('order-items');
        if (orderItems) {
            orderItems.innerHTML = cart.map(item => {
                const price = currency === 'USD' ? item.price_usd : item.price_kes;
                total += price;
                return `<div style="display:flex; justify-content:space-between; padding:0.5rem 0;">
                    <span>${escapeHtml(item.title)}</span>
                    <span>${currency === 'USD' ? '$' + price : 'KES ' + price}</span>
                </div>`;
            }).join('');
            document.getElementById('order-total').innerHTML = `<strong>Total: ${currency === 'USD' ? '$' + total.toFixed(2) : 'KES ' + total}</strong>`;
        }
        
        document.getElementById('paypal-btn')?.addEventListener('click', () => processPayment('paypal'));
        document.getElementById('paystack-btn')?.addEventListener('click', () => processPayment('paystack'));
        document.getElementById('mpesa-btn')?.addEventListener('click', () => processPayment('mpesa'));
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
