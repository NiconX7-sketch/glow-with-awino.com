// js/payments.js - Payment processing functions

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
    
    const userEmail = prompt('Enter your email for receipt:', 'customer@example.com');
    
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
    alert('Redirecting to PayPal... (Demo mode)');
    localStorage.removeItem('cart');
    window.location.href = 'success.html';
}

async function processPaystack(amount, currency, email) {
    if (!email) {
        alert('Email is required');
        return;
    }
    alert('Processing Paystack payment... (Demo mode)');
    localStorage.removeItem('cart');
    window.location.href = 'success.html';
}

async function processMpesa(amount) {
    const phone = prompt('Enter your M-Pesa phone number (e.g., 2547XXXXXXXX):', '2547');
    if (!phone) return;
    alert(`STK push sent to ${phone}. Complete payment on your phone.`);
    setTimeout(() => {
        localStorage.removeItem('cart');
        window.location.href = 'success.html';
    }, 5000);
}

function setCurrency(currency) {
    localStorage.setItem('currency', currency);
    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.currency === currency) {
            btn.classList.add('active');
        }
    });
    // Refresh prices on page
    if (typeof renderProducts === 'function') {
        renderProducts();
    } else {
        location.reload();
    }
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
