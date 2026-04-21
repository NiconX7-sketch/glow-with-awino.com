// ============================================
// MAIN.JS - COMPLETE WORKING VERSION
// ============================================

// Supabase Configuration
const SUPABASE_URL = 'https://orxrpwncwyrkmubqywhw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yeHJwd25jd3lya211YnF5d2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjYwMjYsImV4cCI6MjA5MTY0MjAyNn0.I2eYzCfOnRf9F2h9f1sfcUTHNaU6rfdjVdKAti0KR4c';

let supabaseClient = null;
let blogPosts = [];
let products = [];
let categories = [];
let cart = [];
let currentCurrency = 'USD';

// Initialize Supabase
async function initSupabase() {
    if (typeof supabase === 'undefined') {
        setTimeout(initSupabase, 500);
        return;
    }
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase initialized');
    return supabaseClient;
}

// Initialize main
async function initMain() {
    await initSupabase();
    await loadAllData();
    setupEventListeners();
    updateCartCount();
    setupCurrencyToggle();
    loadAffiliateSidebar();
}

// Load all data
async function loadAllData() {
    await loadBlogPosts();
    await loadProducts();
    await loadCategories();
    loadSiteSettings();
}

// Load blog posts
async function loadBlogPosts() {
    if (!supabaseClient) return;
    
    const { data, error } = await supabaseClient
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error loading blogs:', error);
        return;
    }
    
    blogPosts = data || [];
    renderLatestPosts();
    renderBlogPosts();
    renderRecentPosts();
}

// Load products
async function loadProducts() {
    if (!supabaseClient) return;
    
    const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error loading products:', error);
        return;
    }
    
    products = data || [];
    renderProducts();
}

// Load categories
async function loadCategories() {
    if (!supabaseClient) return;
    
    const { data, error } = await supabaseClient
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
    
    if (error) {
        console.error('Error loading categories:', error);
        return;
    }
    
    categories = data || [];
    renderCategories();
}

// Load affiliate sidebar
async function loadAffiliateSidebar() {
    if (!supabaseClient) return;
    
    const { data: settings } = await supabaseClient.from('site_settings').select('affiliate_settings').single();
    const ids = settings?.affiliate_settings || {};
    
    const container = document.getElementById('affiliate-sidebar');
    if (!container) return;
    
    let html = '';
    if (ids.amazon) html += `<li><a href="https://www.amazon.com/?tag=${ids.amazon}" target="_blank">Amazon</a></li>`;
    if (ids.jumia) html += `<li><a href="https://www.jumia.co.ke/?utm_source=${ids.jumia}" target="_blank">Jumia</a></li>`;
    if (ids.udemy) html += `<li><a href="https://www.udemy.com/?affcode=${ids.udemy}" target="_blank">Udemy</a></li>`;
    if (ids.coursera) html += `<li><a href="https://www.coursera.org/?affiliate=${ids.coursera}" target="_blank">Coursera</a></li>`;
    
    container.innerHTML = html || '<li>Coming soon</li>';
}

// Render latest posts on homepage
function renderLatestPosts() {
    const container = document.getElementById('latest-posts');
    if (!container) return;
    
    const latestPosts = blogPosts.slice(0, 3);
    
    if (latestPosts.length === 0) {
        container.innerHTML = '<p style="text-align:center;">No blog posts yet. Check back soon!</p>';
        return;
    }
    
    container.innerHTML = latestPosts.map(post => `
        <div class="post-card">
            <img src="${post.image_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22350%22 height=%22200%22 viewBox=%220 0 350 200%22%3E%3Crect width=%22350%22 height=%22200%22 fill=%22%231e3a8a%22/%3E%3Ctext x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22%3ENo Image%3C/text%3E%3C/svg%3E'}" class="post-image">
            <div class="post-content">
                <span class="post-category">${escapeHtml(post.category)}</span>
                <h3 class="post-title">${escapeHtml(post.title)}</h3>
                <p class="post-excerpt">${escapeHtml(post.excerpt || (post.content ? post.content.substring(0, 100).replace(/<[^>]*>/g, '') : ''))}...</p>
                <a href="blog.html" class="read-more">Read More →</a>
            </div>
        </div>
    `).join('');
}

// Render blog posts on blog page
function renderBlogPosts() {
    const container = document.getElementById('blog-posts-grid');
    if (!container) return;
    
    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('search-posts');
    
    let filteredPosts = [...blogPosts];
    
    if (categoryFilter && categoryFilter.value !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.category === categoryFilter.value);
    }
    
    if (searchInput && searchInput.value) {
        const searchTerm = searchInput.value.toLowerCase();
        filteredPosts = filteredPosts.filter(post => 
            post.title.toLowerCase().includes(searchTerm) || 
            (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm)) ||
            (post.content && post.content.toLowerCase().includes(searchTerm))
        );
    }
    
    if (filteredPosts.length === 0) {
        container.innerHTML = '<p class="no-results">No blog posts found. Try a different search or category.</p>';
        return;
    }
    
    container.innerHTML = filteredPosts.map(post => `
        <div class="post-card">
            <img src="${post.image_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22350%22 height=%22200%22 viewBox=%220 0 350 200%22%3E%3Crect width=%22350%22 height=%22200%22 fill=%22%231e3a8a%22/%3E%3Ctext x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22%3ENo Image%3C/text%3E%3C/svg%3E'}" class="post-image">
            <div class="post-content">
                <span class="post-category">${escapeHtml(post.category)}</span>
                <h3 class="post-title">${escapeHtml(post.title)}</h3>
                <p class="post-excerpt">${escapeHtml(post.excerpt || (post.content ? post.content.substring(0, 150).replace(/<[^>]*>/g, '') : ''))}...</p>
                <a href="#" onclick="viewFullPost('${post.id}'); return false;" class="read-more">Read More →</a>
            </div>
        </div>
    `).join('');
}

// Render categories in sidebar
function renderCategories() {
    const categoriesList = document.getElementById('categories-list');
    const categoryFilter = document.getElementById('category-filter');
    
    if (categoriesList) {
        if (categories.length === 0) {
            categoriesList.innerHTML = '<li>No categories yet</li>';
        } else {
            categoriesList.innerHTML = categories.map(cat => 
                `<li><a href="#" onclick="filterByCategory('${escapeHtml(cat.name)}'); return false;">${escapeHtml(cat.name)}</a></li>`
            ).join('');
        }
    }
    
    if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="all">All Categories</option>' +
            categories.map(cat => `<option value="${escapeHtml(cat.name)}">${escapeHtml(cat.name)}</option>`).join('');
    }
}

// Render recent posts
function renderRecentPosts() {
    const container = document.getElementById('recent-posts');
    if (!container) return;
    
    const recentPosts = blogPosts.slice(0, 5);
    
    if (recentPosts.length === 0) {
        container.innerHTML = '<li>No posts yet</li>';
        return;
    }
    
    container.innerHTML = recentPosts.map(post => 
        `<li><a href="#" onclick="viewFullPost('${post.id}'); return false;">${escapeHtml(post.title)}</a></li>`
    ).join('');
}

// Render products on shop page
function renderProducts() {
    const container = document.getElementById('products-grid');
    if (!container) return;
    
    const currency = localStorage.getItem('currency') || 'USD';
    
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:2rem;">No ebooks available yet. Check back soon!</p>';
        return;
    }
    
    container.innerHTML = products.map(product => {
        const price = currency === 'USD' ? `$${product.price_usd}` : `KES ${product.price_kes}`;
        return `
            <div class="product-card">
                <img src="${product.image_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22280%22 height=%22200%22 viewBox=%220 0 280 200%22%3E%3Crect width=%22280%22 height=%22200%22 fill=%22%231e3a8a%22/%3E%3Ctext x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22%3ENo Cover%3C/text%3E%3C/svg%3E'}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title">${escapeHtml(product.title)}</h3>
                    <p class="product-description">${escapeHtml(product.description.substring(0, 100))}...</p>
                    <p class="product-price">${price}</p>
                    <button onclick="addToCart(${product.id})" class="add-to-cart">Add to Cart</button>
                </div>
            </div>
        `;
    }).join('');
}

// Add to cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        cart.push(product);
        localStorage.setItem('cart', JSON.stringify(cart));
        showNotification('Product added to cart!');
        updateCartCount();
    }
}

// View full post
async function viewFullPost(postId) {
    if (!supabaseClient) return;
    
    const { data: post, error } = await supabaseClient
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single();
    
    if (error || !post) {
        alert('Post not found');
        return;
    }
    
    const modal = document.getElementById('post-modal');
    const content = document.getElementById('full-post-content');
    
    if (modal && content) {
        content.innerHTML = `
            <h2>${escapeHtml(post.title)}</h2>
            <p><strong>Category:</strong> ${escapeHtml(post.category)}</p>
            <img src="${post.image_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22400%22 viewBox=%220 0 800 400%22%3E%3Crect width=%22800%22 height=%22400%22 fill=%22%231e3a8a%22/%3E%3Ctext x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22%3ENo Image%3C/text%3E%3C/svg%3E'}" style="width:100%; margin:1rem 0; border-radius:12px;">
            <div style="line-height:1.8;">${post.content}</div>
        `;
        modal.style.display = 'block';
    }
}

// Filter by category
function filterByCategory(category) {
    const filterSelect = document.getElementById('category-filter');
    if (filterSelect) {
        filterSelect.value = category;
        renderBlogPosts();
    }
}

// Load site settings
async function loadSiteSettings() {
    if (!supabaseClient) return;
    
    const { data } = await supabaseClient.from('site_settings').select('*').single();
    if (data) {
        if (data.logo_url) {
            const logo = document.getElementById('site-logo');
            if (logo) logo.src = data.logo_url;
        }
        if (data.profile_image_url) {
            const profile = document.getElementById('profile-image');
            if (profile) profile.src = data.profile_image_url;
        }
        if (data.site_title) {
            document.title = data.site_title;
            const titleElements = document.querySelectorAll('.site-title');
            titleElements.forEach(el => el.textContent = data.site_title);
        }
    }
}

// Cart functions
function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = cart.length;
    }
}

function viewCart() {
    const modal = document.getElementById('cart-modal');
    const itemsContainer = document.getElementById('cart-items');
    const totalContainer = document.getElementById('cart-total');
    const currency = localStorage.getItem('currency') || 'USD';
    
    let total = 0;
    
    if (cart.length === 0) {
        itemsContainer.innerHTML = '<p style="text-align:center;padding:2rem;">Your cart is empty.</p>';
        totalContainer.innerHTML = '';
    } else {
        itemsContainer.innerHTML = cart.map((item, index) => {
            const price = currency === 'USD' ? item.price_usd : item.price_kes;
            total += price;
            return `
                <div style="display:flex; justify-content:space-between; padding:1rem; border-bottom:1px solid #ddd;">
                    <div>
                        <h4>${escapeHtml(item.title)}</h4>
                        <p>${currency === 'USD' ? '$' + price : 'KES ' + price}</p>
                    </div>
                    <button onclick="removeFromCart(${index})" style="background:#dc2626; color:white; border:none; padding:0.5rem 1rem; border-radius:8px; cursor:pointer;">Remove</button>
                </div>
            `;
        }).join('');
        totalContainer.innerHTML = `<div style="text-align:right; padding:1rem;"><strong>Total: ${currency === 'USD' ? '$' + total.toFixed(2) : 'KES ' + total}</strong></div>`;
    }
    
    if (modal) modal.style.display = 'block';
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    viewCart();
}

function proceedToCheckout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    sessionStorage.setItem('checkoutCart', JSON.stringify(cart));
    window.location.href = 'checkout.html';
}

function closeCartModal() { document.getElementById('cart-modal').style.display = 'none'; }
function closeModal() { document.getElementById('modal').style.display = 'none'; }
function closePostModal() { document.getElementById('post-modal').style.display = 'none'; }

// Setup currency toggle
function setupCurrencyToggle() {
    const savedCurrency = localStorage.getItem('currency');
    if (savedCurrency) currentCurrency = savedCurrency;
    
    const btns = document.querySelectorAll('.currency-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const currency = btn.dataset.currency;
            localStorage.setItem('currency', currency);
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderProducts();
        });
    });
    
    const activeBtn = document.querySelector(`.currency-btn[data-currency="${currentCurrency}"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

// Setup event listeners
function setupEventListeners() {
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletter-email').value;
            const messageDiv = document.getElementById('newsletter-message');
            
            try {
                const { error } = await supabaseClient.from('newsletter_subscribers').insert([{ email: email }]);
                if (error && error.code === '23505') {
                    messageDiv.textContent = 'This email is already subscribed!';
                    messageDiv.style.color = '#eab308';
                } else if (error) {
                    messageDiv.textContent = 'Error: ' + error.message;
                    messageDiv.style.color = '#dc2626';
                } else {
                    messageDiv.textContent = 'Thank you for subscribing! Check your email for updates.';
                    messageDiv.style.color = '#22c55e';
                    newsletterForm.reset();
                }
            } catch (err) {
                messageDiv.textContent = 'An error occurred. Please try again.';
                messageDiv.style.color = '#dc2626';
            }
            messageDiv.style.display = 'block';
            setTimeout(() => messageDiv.style.display = 'none', 5000);
        });
    }
    
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const successDiv = document.getElementById('success-message');
            const errorDiv = document.getElementById('error-message');
            
            successDiv.style.display = 'none';
            errorDiv.style.display = 'none';
            
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const subject = document.getElementById('contact-subject').value;
            const message = document.getElementById('contact-message').value;
            
            try {
                const { error } = await supabaseClient.from('contact_messages').insert([{ name, email, subject, message }]);
                if (error) {
                    errorDiv.style.display = 'block';
                } else {
                    successDiv.style.display = 'block';
                    contactForm.reset();
                }
            } catch (err) {
                errorDiv.style.display = 'block';
            }
            setTimeout(() => {
                successDiv.style.display = 'none';
                errorDiv.style.display = 'none';
            }, 5000);
        });
    }
    
    const searchInput = document.getElementById('search-posts');
    if (searchInput) {
        searchInput.addEventListener('input', renderBlogPosts);
    }
    
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', renderBlogPosts);
    }
    
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Show notification
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
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Legal modals
function showPrivacyPolicy() { showModalContent('<h2>Privacy Policy</h2><p>Your privacy is important to us. We collect only necessary information to provide our services.</p>'); }
function showDisclaimer() { showModalContent('<h2>Disclaimer</h2><p>Information provided is for educational purposes only.</p>'); }
function showTerms() { showModalContent('<h2>Terms & Conditions</h2><p>By using this site you agree to our terms.</p>'); }
function showModalContent(content) { const modal = document.getElementById('modal'); const body = document.getElementById('modal-body'); if (modal && body) { body.innerHTML = content; modal.style.display = 'block'; } }

// WhatsApp
function openWhatsApp() { window.open('https://wa.me/254704817504', '_blank'); }

// Mobile menu
function toggleMobileMenu() { document.getElementById('navLinks').classList.toggle('active'); }

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load cart from localStorage
const savedCart = localStorage.getItem('cart');
if (savedCart) {
    cart = JSON.parse(savedCart);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initMain);
