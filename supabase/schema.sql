-- ============================================
-- GROW WITH AWINO - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create tables

-- Site Settings table
CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    site_title TEXT DEFAULT 'Grow With Awino',
    site_description TEXT,
    admin_email TEXT,
    contact_email TEXT,
    whatsapp_number TEXT,
    phone_number TEXT,
    logo_url TEXT,
    profile_image_url TEXT,
    default_currency TEXT DEFAULT 'USD',
    exchange_rate DECIMAL(10,2) DEFAULT 130.00,
    social_links JSONB DEFAULT '{}',
    seo JSONB DEFAULT '{}',
    payment_settings JSONB DEFAULT '{}',
    affiliate_settings JSONB DEFAULT '{}',
    analytics JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    image_url TEXT,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Products/Ebooks table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    price_kes DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    download_link TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_email TEXT NOT NULL,
    product_ids JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT,
    transaction_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMP DEFAULT NOW()
);

-- Contact messages
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 3. Insert default site settings
INSERT INTO site_settings (id, site_title, site_description, admin_email, default_currency, exchange_rate)
VALUES (1, 'Grow With Awino', 'Empowering beginners to learn digital skills, master graphic design, and earn online', 'admin@growwithawino.com', 'USD', 130.00)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert default categories
INSERT INTO categories (name, slug) VALUES
    ('Freelancing', 'freelancing'),
    ('Digital Skills', 'digital-skills'),
    ('Online Income', 'online-income'),
    ('Personal Growth', 'personal-growth'),
    ('Tutorials', 'tutorials'),
    ('Graphic Design', 'graphic-design')
ON CONFLICT (name) DO NOTHING;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for public read access
CREATE POLICY "Public can read site_settings" ON site_settings
    FOR SELECT USING (true);

CREATE POLICY "Public can read categories" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Public can read published blog posts" ON blog_posts
    FOR SELECT USING (published = true);

CREATE POLICY "Public can read products" ON products
    FOR SELECT USING (true);

-- 7. Create policies for admin write access (authenticated users only)
CREATE POLICY "Authenticated users can manage site_settings" ON site_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage categories" ON categories
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage blog_posts" ON blog_posts
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage products" ON products
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view orders" ON orders
    FOR SELECT USING (auth.role() = 'authenticated');

-- 8. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create triggers for updated_at
CREATE TRIGGER update_site_settings_updated_at 
    BEFORE UPDATE ON site_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();