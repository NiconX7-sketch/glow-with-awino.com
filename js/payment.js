// js/payments.js - Payment processing (PayPal, Paystack, M-Pesa ONLY)

function processPayment(method) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const currency = localStorage.getItem('currency') || 'USD';
    let total = 0;
    cart.forEach(item => {
        if (currency === 'USD') {
            total += item.price_usd || item.price || 29.99;
        } else {
            total += item.price_kes || (item.price_usd || 29.99) * 130;
        }
    });
    
    // Redirect to checkout page with payment method
    sessionStorage.setItem('checkoutCart', JSON.stringify(cart));
    sessionStorage.setItem('selectedPaymentMethod', method);
    sessionStorage.setItem('paymentAmount', total);
    sessionStorage.setItem('paymentCurrency', currency);
    window.location.href = 'checkout.html';
}

function setCurrency(currency) {
    localStorage.setItem('currency', currency);
    const btns = document.querySelectorAll('.currency-btn');
    btns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.currency === currency) {
            btn.classList.add('active');
        }
    });
    location.reload();
}

function viewCart() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    sessionStorage.setItem('checkoutCart', JSON.stringify(cart));
    window.location.href = 'checkout.html';
}

function addToCart(productId, productTitle, productPriceUsd, productPriceKes) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const product = { 
        id: productId, 
        title: productTitle, 
        price_usd: productPriceUsd, 
        price_kes: productPriceKes || productPriceUsd * 130 
    };
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${productTitle} added to cart!`);
    
    const cartCount = document.getElementById('cart-count');
    if (cartCount) cartCount.textContent = cart.length;
}

// For checkout page
if (document.getElementById('paypal-btn')) {
    document.getElementById('paypal-btn').addEventListener('click', () => processPayPalPayment());
    document.getElementById('paystack-btn').addEventListener('click', () => processPaystackPayment());
    document.getElementById('mpesa-btn').addEventListener('click', () => processMpesaPayment());
}

async function processPayPalPayment() {
    const amount = parseFloat(sessionStorage.getItem('paymentAmount') || '0');
    const currency = sessionStorage.getItem('paymentCurrency') || 'USD';
    const cart = JSON.parse(sessionStorage.getItem('checkoutCart') || '[]');
    
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    showNotification('Redirecting to PayPal...', 'info');
    
    try {
        const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                method: 'paypal',
                amount: amount,
                currency: currency,
                items: cart
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

async function processPaystackPayment() {
    const amount = parseFloat(sessionStorage.getItem('paymentAmount') || '0');
    const currency = sessionStorage.getItem('paymentCurrency') || 'USD';
    const cart = JSON.parse(sessionStorage.getItem('checkoutCart') || '[]');
    
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    const email = prompt('Enter your email address for payment receipt:', 'customer@example.com');
    if (!email) {
        showNotification('Email is required for Paystack payment', 'error');
        return;
    }
    
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
                items: cart
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

async function processMpesaPayment() {
    const amount = Math.round(parseFloat(sessionStorage.getItem('paymentAmount') || '0'));
    const cart = JSON.parse(sessionStorage.getItem('checkoutCart') || '[]');
    
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
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
                amount: amount,
                phoneNumber: formattedPhone,
                items: cart
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('STK push sent! Check your phone and enter PIN.', 'success');
            
            // Poll for payment status
            let attempts = 0;
            const interval = setInterval(async () => {
                attempts++;
                try {
                    const statusResponse = await fetch(`/api/verify-payment?checkoutRequestID=${data.checkoutRequestID}`);
                    const statusData = await statusResponse.json();
                    
                    if (statusData.status === 'completed') {
                        clearInterval(interval);
                        handleSuccessfulPayment();
                    } else if (statusData.status === 'failed' || attempts > 30) {
                        clearInterval(interval);
                        showNotification('Payment timeout. Please check your M-Pesa statement.', 'error');
                    }
                } catch (err) {
                    console.log('Status check error:', err);
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
    sessionStorage.removeItem('selectedPaymentMethod');
    sessionStorage.removeItem('paymentAmount');
    sessionStorage.removeItem('paymentCurrency');
    setTimeout(() => {
        window.location.href = 'success.html';
    }, 2000);
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    const bgColor = type === 'error' ? '#ef4444' : type === 'info' ? '#3b82f6' : '#22c55e';
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${bgColor};
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

// Initialize checkout page if on checkout.html
if (window.location.pathname.includes('checkout.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        const cart = JSON.parse(sessionStorage.getItem('checkoutCart') || '[]');
        const currency = sessionStorage.getItem('paymentCurrency') || localStorage.getItem('currency') || 'USD';
        
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
                    <span>${currency === 'USD' ? '$' + price.toFixed(2) : 'KES ' + price}</span>
                </div>`;
            }).join('');
            document.getElementById('order-total').innerHTML = `<strong>Total: ${currency === 'USD' ? '$' + total.toFixed(2) : 'KES ' + total}</strong>`;
            sessionStorage.setItem('paymentAmount', total);
            sessionStorage.setItem('paymentCurrency', currency);
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        if (status === 'success') {
            handleSuccessfulPayment();
        } else if (status === 'cancelled') {
            showNotification('Payment was cancelled.', 'error');
        }
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
