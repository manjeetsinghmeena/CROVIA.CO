-- schema.sql
-- Run this script in your Supabase SQL Editor to set up the database tables

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY, -- p1, p2, etc.
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- bags, amigurumi, wearables
    description TEXT,
    price NUMERIC NOT NULL,
    tag TEXT,
    gradient TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to products
CREATE POLICY "Allow public read access to products" ON public.products
    FOR SELECT USING (true);

-- 2. Populate Products Table with Initial Data
INSERT INTO public.products (id, name, category, description, price, tag, gradient, icon)
VALUES
  ('p1', 'Starfish Keychain', 'amigurumi', 'A chunky hand-crocheted starfish with googly eyes — clip it to your bag or keys for a daily dose of cozy.', 99, NULL, 'linear-gradient(135deg,#2C2C2C,#1a1a1a)', 'starfish'),
  ('p2', 'Hidden Love Pot', 'amigurumi', 'A pair of hand-crocheted tulip pots in blush pink & cream — a sweet, silent way to say "you matter."', 349, NULL, 'linear-gradient(135deg,#f9c6d0,#a8d5a2)', 'bear'),
  ('p3', 'Turtle Keychain', 'amigurumi', 'Adorable hand-crocheted turtle buddies to clip onto your backpack, keys, or purse.', 199, NULL, 'linear-gradient(135deg,#93C5FD,#3B82F6)', 'turtle'),
  ('p4', 'Wavy Scarf', 'wearables', 'Long, drapey scarf with a soft wave texture stitch.', 999, NULL, 'linear-gradient(135deg,#E8C4A0,#8A9A5B)', 'scarf'),
  ('p5', 'Mini Pouch Duo', 'bags', 'Set of two coin pouches — perfect for cards, keys, or lip balm.', 549, NULL, 'linear-gradient(135deg,#707D49,#3D2B1F)', 'pouch'),
  ('p6', 'Tiny Fox Keychain', 'amigurumi', 'A pocket-sized fox friend to clip onto your bag or keys.', 399, NULL, 'linear-gradient(135deg,#C16E4A,#E8C4A0)', 'fox')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  tag = EXCLUDED.tag,
  gradient = EXCLUDED.gradient,
  icon = EXCLUDED.icon;

-- 3. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- CRV-XXXX style ID or UUID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    payment_status TEXT DEFAULT 'pending' NOT NULL, -- pending, paid, failed
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    items JSONB NOT NULL -- Array of { product_id, name, price, qty }
);

-- Enable RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create an order
CREATE POLICY "Allow public insert of orders" ON public.orders
    FOR INSERT WITH CHECK (true);

-- Allow public read access to orders by ID (for success page verification)
CREATE POLICY "Allow public select of orders by id" ON public.orders
    FOR SELECT USING (true);

-- 4. Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    rating INTEGER DEFAULT 5 NOT NULL,
    text TEXT NOT NULL
);

-- Enable RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access to reviews
CREATE POLICY "Allow public select of reviews" ON public.reviews
    FOR SELECT USING (true);

-- Allow public insert of reviews
CREATE POLICY "Allow public insert of reviews" ON public.reviews
    FOR INSERT WITH CHECK (true);

-- Populate Reviews Table with Initial Data (if table is empty)
INSERT INTO public.reviews (name, location, rating, text)
SELECT 'Priya M.', 'Jaipur', 5, 'The tote is even softer than it looked in photos. You can tell so much care went into it.'
WHERE NOT EXISTS (SELECT 1 FROM public.reviews WHERE name = 'Priya M.');

INSERT INTO public.reviews (name, location, rating, text)
SELECT 'Ananya S.', 'Delhi', 5, 'Ordered a custom bear for my niece and the detail on the little paws was adorable.'
WHERE NOT EXISTS (SELECT 1 FROM public.reviews WHERE name = 'Ananya S.');

INSERT INTO public.reviews (name, location, rating, text)
SELECT 'Riya K.', 'Mumbai', 5, 'Checkout was so smooth, and the packaging made it feel like a gift to myself.'
WHERE NOT EXISTS (SELECT 1 FROM public.reviews WHERE name = 'Riya K.');

