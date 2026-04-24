// js/payments.js - Payment processing functions

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
    
    alert(`Processing ${method.toUpperCase()} payment of ${currency === 'USD' ? '$' + total.toFixed(2) : 'KES ' + total}\n\nThis is a demo. In production, real payment would process here.`);
    
    // Clear cart and redirect
    localStorage.removeItem('cart');
    sessionStorage.removeItem('checkoutCart');
    window.location.href = 'success.html';
}

function setCurrency(currency) {
    localStorage.setItem('currency', currency);
    document.querySelectorAll('.currency-btn').forEach(btn => {
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
