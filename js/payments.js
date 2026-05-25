// js/payments.js
// Payment and cart helper functions for Grow With Awino

// ============================================
// CART FUNCTIONS
// ============================================

let cart = JSON.parse(localStorage.getItem('cart') || '[]');

function updateCartCount() {
    const el = document.getElementById('cart-count');
    if (el) el.textContent = cart.length;
}

function viewCart() {
    const modal = document.getElementById('cart-modal');
    const items = document.getElementById('cart-items');
    const totalDiv = document.getElementById('cart-total');
    const currency = localStorage.getItem('currency') || 'USD';
    
    if (!modal) return;
    
    if (cart.length === 0) {
        items.innerHTML = '<p style="text-align:center;padding:2rem;">Your cart is empty.</p>';
        totalDiv.innerHTML = '';
    } else {
        let total = 0;
        items.innerHTML = cart.map((item, i) => {
            let price = currency === 'USD' ? (item.price_usd || 29.99) : (item.price_kes || 2500);
            total += price;
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;border-bottom:1px solid #eee;">
                <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    <div style="color:#C66B3D;">${currency === 'USD' ? '$' + price.toFixed(2) : 'KES ' + price.toLocaleString()}</div>
                </div>
                <button onclick="removeFromCart(${i})" style="background:#dc2626;color:white;border:none;padding:0.3rem 0.8rem;border-radius:5px;cursor:pointer;font-size:0.8rem;">Remove</button>
            </div>`;
        }).join('');
        totalDiv.innerHTML = `<div style="text-align:center; font-size:1.2rem; padding-top:0.5rem;"><strong>Total: ${currency === 'USD' ? '$' + total.toFixed(2) : 'KES ' + total.toLocaleString()}</strong></div>`;
    }
    modal.style.display = 'flex';
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    viewCart();
}

function proceedToCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty. Add some ebooks first!');
        return;
    }
    sessionStorage.setItem('checkoutCart', JSON.stringify(cart));
    window.location.href = 'checkout.html';
}

function closeCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) modal.style.display = 'none';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// TRACKING FUNCTIONS
// ============================================

async function trackVisitor() {
    const today = new Date().toISOString().split('T')[0];
    const lastVisit = localStorage.getItem('lastVisitDate');
    if (lastVisit !== today) {
        try {
            await fetch('/api/track-visitor', { method: 'POST' });
            localStorage.setItem('lastVisitDate', today);
        } catch(err) {
            console.log('Track error:', err);
        }
    }
}

// ============================================
// CURRENCY FUNCTIONS (for shop page)
// ============================================

function setCurrency(currency) {
    localStorage.setItem('currency', currency);
    // Update active button styling
    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.currency === currency) btn.classList.add('active');
    });
    // Re-render products if function exists
    if (typeof renderProducts === 'function') {
        renderProducts();
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Update cart count when page loads
document.addEventListener('DOMContentLoaded', function() {
    cart = JSON.parse(localStorage.getItem('cart') || '[]');
    updateCartCount();
    
    // Set up currency buttons if they exist
    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setCurrency(this.dataset.currency);
        });
    });
});

// Close modal when clicking outside
window.onclick = function(e) {
    const modal = document.getElementById('cart-modal');
    if (e.target === modal) closeCartModal();
}
