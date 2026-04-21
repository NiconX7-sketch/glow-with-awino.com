// ============================================
// ADMIN PANEL - PROTECTED WITH SUPABASE
// Only accessible after admin login
// ============================================

let currentEditingBlog = null;
let currentEditingProduct = null;

// Check authentication on page load
async function initAdmin() {
    await initSupabase();
    
    // Verify admin is logged in
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) return;
    
    // Load all admin data
    await loadAllAdminData();
    setupAdminTabs();
    setupAdminForms();
}

// Load all data for admin panel
async function loadAllAdminData() {
    showLoading(true);
    
    // Load site settings
    await loadAdminSettings();
    
    // Load blogs, products, categories
    await loadBlogsAdmin();
    await loadProductsAdmin();
    await loadCategoriesAdmin();
    await loadStatistics();
    
    showLoading(false);
}

// Load site settings into admin form
async function loadAdminSettings() {
    const settings = await getSiteSettings();
    if (!settings) return;
    
    // General settings
    document.getElementById('site-title-input').value = settings.site_title || '';
    document.getElementById('site-description').value = settings.site_description || '';
    document.getElementById('admin-email').value = settings.admin_email || '';
    document.getElementById('contact-email').value = settings.contact_email || '';
    document.getElementById('whatsapp-number').value = settings.whatsapp_number || '';
    document.getElementById('phone-number').value = settings.phone_number || '';
    
    // SEO settings
    if (settings.seo) {
        document.getElementById('meta-keywords').value = settings.seo.meta_keywords || '';
        document.getElementById('meta-description').value = settings.seo.meta_description || '';
    }
    
    // Currency settings
    document.getElementById('default-currency').value = settings.default_currency || 'USD';
    document.getElementById('exchange-rate').value = settings.exchange_rate || 130;
    
    // Social links
    if (settings.social_links) {
        document.getElementById('twitter-link').value = settings.social_links.twitter || '';
        document.getElementById('youtube-link').value = settings.social_links.youtube || '';
        document.getElementById('facebook-link').value = settings.social_links.facebook || '';
        document.getElementById('tiktok-link').value = settings.social_links.tiktok || '';
        document.getElementById('instagram-link').value = settings.social_links.instagram || '';
    }
    
    // Payment settings
    if (settings.payment_settings) {
        document.getElementById('paypal-client-id').value = settings.payment_settings.paypal_client_id || '';
        document.getElementById('paypal-secret').value = settings.payment_settings.paypal_secret || '';
        document.getElementById('paypal-mode').value = settings.payment_settings.paypal_mode || 'sandbox';
        
        document.getElementById('flutterwave-public-key').value = settings.payment_settings.flutterwave_public_key || '';
        document.getElementById('flutterwave-secret-key').value = settings.payment_settings.flutterwave_secret_key || '';
        document.getElementById('flutterwave-encryption-key').value = settings.payment_settings.flutterwave_encryption_key || '';
        
        document.getElementById('mpesa-consumer-key').value = settings.payment_settings.mpesa_consumer_key || '';
        document.getElementById('mpesa-consumer-secret').value = settings.payment_settings.mpesa_consumer_secret || '';
        document.getElementById('mpesa-shortcode').value = settings.payment_settings.mpesa_shortcode || '';
        document.getElementById('mpesa-passkey').value = settings.payment_settings.mpesa_passkey || '';
        document.getElementById('mpesa-environment').value = settings.payment_settings.mpesa_environment || 'sandbox';
    }
    
    // Affiliate settings
    if (settings.affiliate_settings) {
        document.getElementById('amazon-affiliate-id').value = settings.affiliate_settings.amazon || '';
        document.getElementById('jumia-affiliate-id').value = settings.affiliate_settings.jumia || '';
        document.getElementById('alibaba-affiliate-id').value = settings.affiliate_settings.alibaba || '';
        document.getElementById('coursera-affiliate-id').value = settings.affiliate_settings.coursera || '';
        document.getElementById('udemy-affiliate-id').value = settings.affiliate_settings.udemy || '';
    }
    
    // Analytics settings
    if (settings.analytics) {
        document.getElementById('ga-tracking-id').value = settings.analytics.google_analytics || '';
        document.getElementById('fb-pixel-id').value = settings.analytics.facebook_pixel || '';
    }
    
    // Logo preview
    if (settings.logo_url) {
        const logoPreview = document.getElementById('logo-preview');
        if (logoPreview) {
            logoPreview.innerHTML = `<img src="${settings.logo_url}" style="max-width: 150px; margin-top: 10px; border-radius: 10px;">`;
        }
    }
    
    // Profile preview
    if (settings.profile_image_url) {
        const profilePreview = document.getElementById('profile-preview');
        if (profilePreview) {
            profilePreview.innerHTML = `<img src="${settings.profile_image_url}" style="max-width: 150px; border-radius: 50%; margin-top: 10px;">`;
        }
    }
}

// Load blogs for admin
async function loadBlogsAdmin() {
    const blogsList = document.getElementById('blogs-list');
    if (!blogsList) return;
    
    const blogPosts = await getAllBlogPostsAdmin();
    
    if (blogPosts.length === 0) {
        blogsList.innerHTML = '<p>No blog posts yet. Click "Add New Blog Post" to get started.</p>';
        return;
    }
    
    blogsList.innerHTML = blogPosts.map(blog => `
        <div class="admin-item">
            <div>
                <h4>${escapeHtml(blog.title)}</h4>
                <p>Category: ${escapeHtml(blog.category)} | Created: ${new Date(blog.created_at).toLocaleDateString()}</p>
            </div>
            <div class="admin-item-actions">
                <button onclick="editBlog(${blog.id})" class="edit-btn">Edit</button>
                <button onclick="deleteBlog(${blog.id})" class="delete-btn">Delete</button>
            </div>
        </div>
    `).join('');
}

// Load products for admin
async function loadProductsAdmin() {
    const productsList = document.getElementById('products-list');
    if (!productsList) return;
    
    const productsData = await getProducts();
    
    if (productsData.length === 0) {
        productsList.innerHTML = '<p>No ebooks yet. Click "Add New Ebook" to get started.</p>';
        return;
    }
    
    productsList.innerHTML = productsData.map(product => `
        <div class="admin-item">
            <div>
                <h4>${escapeHtml(product.title)}</h4>
                <p>Price: $${product.price_usd} / KES ${product.price_kes}</p>
            </div>
            <div class="admin-item-actions">
                <button onclick="editProduct(${product.id})" class="edit-btn">Edit</button>
                <button onclick="deleteProduct(${product.id})" class="delete-btn">Delete</button>
            </div>
        </div>
    `).join('');
}

// Load categories for admin
async function loadCategoriesAdmin() {
    const categoriesList = document.getElementById('categories-list-admin');
    if (!categoriesList) return;
    
    const categoriesData = await getCategories();
    
    if (categoriesData.length === 0) {
        categoriesList.innerHTML = '<p>No categories yet. Click "Add New Category" to get started.</p>';
        return;
    }
    
    categoriesList.innerHTML = categoriesData.map(cat => `
        <div class="admin-item">
            <span>${escapeHtml(cat.name)}</span>
            <button onclick="deleteCategory(${cat.id})" class="delete-btn">Delete</button>
        </div>
    `).join('');
}

// Load statistics
async function loadStatistics() {
    const blogPosts = await getAllBlogPostsAdmin();
    const productsData = await getProducts();
    const categoriesData = await getCategories();
    
    document.getElementById('total-posts').textContent = blogPosts.length;
    document.getElementById('total-ebooks').textContent = productsData.length;
    document.getElementById('total-categories').textContent = categoriesData.length;
}

// Blog management
async function editBlog(id) {
    const blogPosts = await getAllBlogPostsAdmin();
    const blog = blogPosts.find(b => b.id === id);
    
    if (blog) {
        currentEditingBlog = blog;
        document.getElementById('blog-modal-title').textContent = 'Edit Blog Post';
        document.getElementById('blog-id').value = blog.id;
        document.getElementById('blog-title').value = blog.title;
        document.getElementById('blog-content').value = blog.content;
        document.getElementById('blog-excerpt').value = blog.excerpt || '';
        
        const categories = await getCategories();
        const categorySelect = document.getElementById('blog-category');
        categorySelect.innerHTML = categories.map(cat => 
            `<option value="${escapeHtml(cat.name)}" ${cat.name === blog.category ? 'selected' : ''}>${escapeHtml(cat.name)}</option>`
        ).join('');
        
        document.getElementById('blog-modal').style.display = 'block';
    }
}

async function deleteBlog(id) {
    if (confirm('Are you sure you want to delete this blog post?')) {
        showLoading(true);
        const result = await deleteBlogPost(id);
        showLoading(false);
        
        if (result.error) {
            showNotification('Error: ' + result.error);
        } else {
            showNotification('Blog post deleted successfully!');
            await loadBlogsAdmin();
            await loadStatistics();
        }
    }
}

// Product management
async function editProduct(id) {
    const product = await getProductById(id);
    
    if (product) {
        currentEditingProduct = product;
        document.getElementById('product-modal-title').textContent = 'Edit Ebook';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-title').value = product.title;
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-price-usd').value = product.price_usd;
        document.getElementById('product-price-kes').value = product.price_kes;
        document.getElementById('product-download-link').value = product.download_link || '';
        
        document.getElementById('product-modal').style.display = 'block';
    }
}

async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this ebook?')) {
        showLoading(true);
        const result = await deleteProduct(id);
        showLoading(false);
        
        if (result.error) {
            showNotification('Error: ' + result.error);
        } else {
            showNotification('Ebook deleted successfully!');
            await loadProductsAdmin();
            await loadStatistics();
        }
    }
}

// Category management
function showAddCategoryForm() {
    document.getElementById('category-modal-admin').style.display = 'block';
}

async function addCategoryFromAdmin() {
    const categoryName = document.getElementById('new-category-name-admin').value.trim();
    if (!categoryName) {
        showNotification('Please enter a category name');
        return;
    }
    
    showLoading(true);
    const result = await createCategory(categoryName);
    showLoading(false);
    
    if (result.error) {
        showNotification('Error: ' + result.error);
    } else {
        showNotification('Category added successfully!');
        document.getElementById('new-category-name-admin').value = '';
        document.getElementById('category-modal-admin').style.display = 'none';
        await loadCategoriesAdmin();
        await loadStatistics();
    }
}

async function deleteCategory(id) {
    if (confirm('Are you sure you want to delete this category?')) {
        showLoading(true);
        const result = await deleteCategory(id);
        showLoading(false);
        
        if (result.error) {
            showNotification('Error: ' + result.error);
        } else {
            showNotification('Category deleted successfully!');
            await loadCategoriesAdmin();
            await loadStatistics();
        }
    }
}

// Site settings update functions
async function updateSiteTitle() {
    const title = document.getElementById('site-title-input').value;
    if (title) {
        const settings = await getSiteSettings();
        settings.site_title = title;
        await updateSiteSettings(settings);
        showNotification('Site title updated successfully!');
    }
}

async function updateSiteDescription() {
    const description = document.getElementById('site-description').value;
    const settings = await getSiteSettings();
    settings.site_description = description;
    await updateSiteSettings(settings);
    showNotification('Site description updated successfully!');
}

async function updateAdminEmail() {
    const email = document.getElementById('admin-email').value;
    const settings = await getSiteSettings();
    settings.admin_email = email;
    await updateSiteSettings(settings);
    showNotification('Admin email updated successfully!');
}

async function updateSocialLinks() {
    const settings = await getSiteSettings();
    if (!settings.social_links) settings.social_links = {};
    
    settings.social_links.twitter = document.getElementById('twitter-link').value;
    settings.social_links.youtube = document.getElementById('youtube-link').value;
    settings.social_links.facebook = document.getElementById('facebook-link').value;
    settings.social_links.tiktok = document.getElementById('tiktok-link').value;
    settings.social_links.instagram = document.getElementById('instagram-link').value;
    
    await updateSiteSettings(settings);
    showNotification('Social links updated successfully!');
}

async function updateContactInfo() {
    const settings = await getSiteSettings();
    settings.contact_email = document.getElementById('contact-email').value;
    settings.whatsapp_number = document.getElementById('whatsapp-number').value;
    settings.phone_number = document.getElementById('phone-number').value;
    
    await updateSiteSettings(settings);
    showNotification('Contact information updated successfully!');
}

async function updateSEOSettings() {
    const settings = await getSiteSettings();
    if (!settings.seo) settings.seo = {};
    
    settings.seo.meta_keywords = document.getElementById('meta-keywords').value;
    settings.seo.meta_description = document.getElementById('meta-description').value;
    
    await updateSiteSettings(settings);
    showNotification('SEO settings updated successfully!');
}

async function updateCurrencySettings() {
    const settings = await getSiteSettings();
    settings.default_currency = document.getElementById('default-currency').value;
    settings.exchange_rate = parseFloat(document.getElementById('exchange-rate').value);
    
    await updateSiteSettings(settings);
    showNotification('Currency settings updated successfully!');
}

async function savePaymentSettings() {
    const settings = await getSiteSettings();
    if (!settings.payment_settings) settings.payment_settings = {};
    
    settings.payment_settings.paypal_client_id = document.getElementById('paypal-client-id').value;
    settings.payment_settings.paypal_secret = document.getElementById('paypal-secret').value;
    settings.payment_settings.paypal_mode = document.getElementById('paypal-mode').value;
    
    settings.payment_settings.flutterwave_public_key = document.getElementById('flutterwave-public-key').value;
    settings.payment_settings.flutterwave_secret_key = document.getElementById('flutterwave-secret-key').value;
    settings.payment_settings.flutterwave_encryption_key = document.getElementById('flutterwave-encryption-key').value;
    
    settings.payment_settings.mpesa_consumer_key = document.getElementById('mpesa-consumer-key').value;
    settings.payment_settings.mpesa_consumer_secret = document.getElementById('mpesa-consumer-secret').value;
    settings.payment_settings.mpesa_shortcode = document.getElementById('mpesa-shortcode').value;
    settings.payment_settings.mpesa_passkey = document.getElementById('mpesa-passkey').value;
    settings.payment_settings.mpesa_environment = document.getElementById('mpesa-environment').value;
    
    await updateSiteSettings(settings);
    showNotification('Payment settings saved successfully!');
}

async function saveAffiliateSettings() {
    const settings = await getSiteSettings();
    if (!settings.affiliate_settings) settings.affiliate_settings = {};
    
    settings.affiliate_settings.amazon = document.getElementById('amazon-affiliate-id').value;
    settings.affiliate_settings.jumia = document.getElementById('jumia-affiliate-id').value;
    settings.affiliate_settings.alibaba = document.getElementById('alibaba-affiliate-id').value;
    settings.affiliate_settings.coursera = document.getElementById('coursera-affiliate-id').value;
    settings.affiliate_settings.udemy = document.getElementById('udemy-affiliate-id').value;
    
    await updateSiteSettings(settings);
    showNotification('Affiliate settings saved successfully!');
}

async function saveAnalyticsSettings() {
    const settings = await getSiteSettings();
    if (!settings.analytics) settings.analytics = {};
    
    settings.analytics.google_analytics = document.getElementById('ga-tracking-id').value;
    
    await updateSiteSettings(settings);
    showNotification('Analytics settings saved successfully!');
}

async function saveFacebookPixel() {
    const settings = await getSiteSettings();
    if (!settings.analytics) settings.analytics = {};
    
    settings.analytics.facebook_pixel = document.getElementById('fb-pixel-id').value;
    
    await updateSiteSettings(settings);
    showNotification('Facebook Pixel saved successfully!');
}

// Image uploads
async function uploadLogo() {
    const fileInput = document.getElementById('logo-upload');
    const file = fileInput.files[0];
    
    if (file) {
        showLoading(true);
        const result = await uploadImage(file, 'logos');
        showLoading(false);
        
        if (result.error) {
            showNotification('Error: ' + result.error);
        } else {
            const settings = await getSiteSettings();
            settings.logo_url = result.url;
            await updateSiteSettings(settings);
            
            const logoPreview = document.getElementById('logo-preview');
            if (logoPreview) {
                logoPreview.innerHTML = `<img src="${result.url}" style="max-width: 150px; margin-top: 10px; border-radius: 10px;">`;
            }
            
            showNotification('Logo uploaded successfully!');
        }
    }
}

async function uploadProfile() {
    const fileInput = document.getElementById('profile-upload');
    const file = fileInput.files[0];
    
    if (file) {
        showLoading(true);
        const result = await uploadImage(file, 'profiles');
        showLoading(false);
        
        if (result.error) {
            showNotification('Error: ' + result.error);
        } else {
            const settings = await getSiteSettings();
            settings.profile_image_url = result.url;
            await updateSiteSettings(settings);
            
            const profilePreview = document.getElementById('profile-preview');
            if (profilePreview) {
                profilePreview.innerHTML = `<img src="${result.url}" style="max-width: 150px; border-radius: 50%; margin-top: 10px;">`;
            }
            
            showNotification('Profile picture uploaded successfully!');
        }
    }
}

// Blog form submission
function setupAdminForms() {
    const blogForm = document.getElementById('blog-form');
    if (blogForm) {
        blogForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const blogId = document.getElementById('blog-id').value;
            const title = document.getElementById('blog-title').value;
            const category = document.getElementById('blog-category').value;
            const content = document.getElementById('blog-content').value;
            const excerpt = document.getElementById('blog-excerpt').value;
            const imageInput = document.getElementById('blog-image');
            
            let imageUrl = null;
            
            if (imageInput && imageInput.files[0]) {
                showLoading(true);
                const result = await uploadImage(imageInput.files[0], 'blog-images');
                showLoading(false);
                if (!result.error) {
                    imageUrl = result.url;
                }
            }
            
            showLoading(true);
            
            const postData = {
                title,
                category,
                content,
                excerpt: excerpt || content.substring(0, 150),
                image_url: imageUrl
            };
            
            let result;
            if (blogId) {
                result = await updateBlogPost(parseInt(blogId), postData);
            } else {
                result = await createBlogPost(postData);
            }
            
            showLoading(false);
            
            if (result.error) {
                showNotification('Error: ' + result.error);
            } else {
                showNotification(blogId ? 'Blog post updated!' : 'Blog post created!');
                document.getElementById('blog-modal').style.display = 'none';
                await loadBlogsAdmin();
                await loadStatistics();
                blogForm.reset();
            }
        });
    }
    
    // Product form submission
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const productId = document.getElementById('product-id').value;
            const title = document.getElementById('product-title').value;
            const description = document.getElementById('product-description').value;
            const priceUSD = parseFloat(document.getElementById('product-price-usd').value);
            const priceKES = parseFloat(document.getElementById('product-price-kes').value);
            const downloadLink = document.getElementById('product-download-link').value;
            const imageInput = document.getElementById('product-image');
            
            let imageUrl = null;
            
            if (imageInput && imageInput.files[0]) {
                showLoading(true);
                const result = await uploadImage(imageInput.files[0], 'product-images');
                showLoading(false);
                if (!result.error) {
                    imageUrl = result.url;
                }
            }
            
            showLoading(true);
            
            const productData = {
                title,
                description,
                price_usd: priceUSD,
                price_kes: priceKES,
                download_link: downloadLink,
                image_url: imageUrl
            };
            
            let result;
            if (productId) {
                result = await updateProduct(parseInt(productId), productData);
            } else {
                result = await createProduct(productData);
            }
            
            showLoading(false);
            
            if (result.error) {
                showNotification('Error: ' + result.error);
            } else {
                showNotification(productId ? 'Ebook updated!' : 'Ebook created!');
                document.getElementById('product-modal').style.display = 'none';
                await loadProductsAdmin();
                await loadStatistics();
                productForm.reset();
            }
        });
    }
}

// Tab switching
function setupAdminTabs() {
    const menuBtns = document.querySelectorAll('.admin-menu-btn');
    menuBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            menuBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.admin-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Refresh data when switching tabs
            if (tabId === 'blogs') loadBlogsAdmin();
            if (tabId === 'products') loadProductsAdmin();
            if (tabId === 'categories') loadCategoriesAdmin();
            if (tabId === 'analytics') loadStatistics();
        });
    });
}

// Show add forms
function showAddBlogForm() {
    currentEditingBlog = null;
    document.getElementById('blog-modal-title').textContent = 'Add New Blog Post';
    document.getElementById('blog-form').reset();
    document.getElementById('blog-id').value = '';
    
    loadCategoriesForSelect();
    document.getElementById('blog-modal').style.display = 'block';
}

async function loadCategoriesForSelect() {
    const categories = await getCategories();
    const categorySelect = document.getElementById('blog-category');
    categorySelect.innerHTML = categories.map(cat => 
        `<option value="${escapeHtml(cat.name)}">${escapeHtml(cat.name)}</option>`
    ).join('');
}

function showAddProductForm() {
    currentEditingProduct = null;
    document.getElementById('product-modal-title').textContent = 'Add New Ebook';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('product-modal').style.display = 'block';
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showLoading(show) {
    let loader = document.getElementById('admin-loader');
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'admin-loader';
            loader.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 10000;
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            `;
            loader.innerHTML = '<div class="loading"></div>';
            document.body.appendChild(loader);
        }
        loader.style.display = 'block';
    } else if (loader) {
        loader.style.display = 'none';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', initAdmin);