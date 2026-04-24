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
            total += item.price_usd || item.price;
        } else {
            total += item.price_kes || item.price * 130;
        }
    });
    
    const userEmail = prompt('Enter your email for receipt:', 'customer@example.com');
    if (!userEmail && method !== 'mpesa') {
        alert('Email is required');
        return;
    }
    
    // Simulate payment processing
    alert(`Processing ${method.toUpperCase()} payment of ${currency === 'USD' ? '$' + total : 'KES ' + total}...`);
    
    // Clear cart and redirect
    localStorage.removeItem('cart');
    sessionStorage.removeItem('checkoutCart');
    window.location.href = 'success.html';
}

function setCurrency(currency) {
    localStorage.setItem('currency', currency);
    // Update active state on buttons
    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.currency === currency) {
            btn.classList.add('active');
        }
    });
    // Refresh page to update prices
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
