-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- Profiles (1:1 with auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('seller','admin','superadmin')),
  whatsapp TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- Seller codes (passwordless)
CREATE TABLE public.seller_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','claimed','revoked')),
  issued_to_profile_id UUID REFERENCES public.profiles(id),
  claimed_by_profile_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

-- Admins (for Admins tab)
CREATE TABLE public.admin_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.5,
  deals INTEGER NOT NULL DEFAULT 0,
  whatsapp TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_profiles_active ON public.admin_profiles (active);
CREATE INDEX idx_admin_profiles_rating ON public.admin_profiles (rating DESC);

-- Deal type enum
CREATE TYPE deal_type AS ENUM ('instant','7day');

-- Listings (accounts for sale)
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Google Play Account',
  country TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 2016 AND EXTRACT(year FROM NOW())::INTEGER),
  price_usd INTEGER NOT NULL CHECK (price_usd >= 0),
  verified_with_id BOOLEAN NOT NULL DEFAULT FALSE,
  deal_type deal_type NOT NULL DEFAULT 'instant',
  apps INTEGER NOT NULL DEFAULT 0 CHECK (apps >= 0),
  live INTEGER NOT NULL DEFAULT 0 CHECK (live >= 0),
  suspended INTEGER NOT NULL DEFAULT 0 CHECK (suspended >= 0),
  play_url TEXT,
  whatsapp TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','sold','removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT apps_sum CHECK (live + suspended <= apps),
  CONSTRAINT play_url_google_chk CHECK (play_url IS NULL OR play_url LIKE 'https://play.google.com/%')
);

CREATE INDEX idx_listings_status ON public.listings (status);
CREATE INDEX idx_listings_country ON public.listings (country);
CREATE INDEX idx_listings_year ON public.listings (year);
CREATE INDEX idx_listings_price_usd ON public.listings (price_usd);
CREATE INDEX idx_listings_verified_with_id ON public.listings (verified_with_id);
CREATE INDEX idx_listings_deal_type ON public.listings (deal_type);

CREATE TRIGGER set_listings_updated_at 
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- Listing images
CREATE TABLE public.listing_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(listing_id, position)
);

CREATE INDEX idx_listing_images_listing_position ON public.listing_images (listing_id, position);

-- Report types
CREATE TYPE report_target AS ENUM ('admin','listing');

-- Reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type report_target NOT NULL,
  target_id UUID NOT NULL,
  message TEXT,
  from_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: escrow deal scaffold
CREATE TABLE public.escrow_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.admin_profiles(id),
  buyer_whatsapp TEXT,
  deal_type deal_type NOT NULL,
  price_usd INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'initiated'
    CHECK (status IN ('initiated','funded','delivered','released','cancelled','dispute')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_escrow_deals_updated_at 
  BEFORE UPDATE ON public.escrow_deals
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- View to serve "card" shape fast (joins + aggregated images)
CREATE VIEW public.listing_cards AS
SELECT
  l.id,
  l.title,
  l.country,
  l.year,
  l.price_usd,
  l.verified_with_id,
  l.deal_type,
  l.apps, 
  l.live, 
  l.suspended,
  l.play_url,
  l.whatsapp,
  json_build_object('id', l.seller_id) as seller,
  COALESCE(
    (SELECT json_agg(li.url ORDER BY li.position)
     FROM public.listing_images li
     WHERE li.listing_id = l.id),
    '[]'::json
  ) as images,
  l.created_at
FROM public.listings l
WHERE l.status = 'active';

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_deals ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- PROFILES
CREATE POLICY "read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ADMIN_PROFILES
CREATE POLICY "public read active admins" ON public.admin_profiles
  FOR SELECT USING (active = TRUE);

-- LISTINGS (public read active; sellers manage their own)
CREATE POLICY "public read active listings" ON public.listings
  FOR SELECT USING (status = 'active');

CREATE POLICY "seller insert own listing" ON public.listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "seller update own listing" ON public.listings
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "seller delete own listing" ON public.listings
  FOR DELETE USING (auth.uid() = seller_id);

-- LISTING_IMAGES
CREATE POLICY "public can read listing images of active listings"
  ON public.listing_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.listings l 
      WHERE l.id = listing_id AND l.status = 'active'
    )
  );

CREATE POLICY "seller can write images of own listing"
  ON public.listing_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.listings l 
      WHERE l.id = listing_id AND l.seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l 
      WHERE l.id = listing_id AND l.seller_id = auth.uid()
    )
  );

-- REPORTS
CREATE POLICY "anyone can create a report" ON public.reports
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "only admins can read reports" ON public.reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')
    )
  );

-- SELLER_CODES (only service role via Edge Functions)
CREATE POLICY "no direct access to seller_codes" ON public.seller_codes
  FOR ALL USING (FALSE) WITH CHECK (FALSE);

-- ESCROW_DEALS
CREATE POLICY "admins can read all escrow deals" ON public.escrow_deals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')
    )
  );

-- Storage bucket for listing images
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', TRUE);

-- Storage policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'listing-images');

CREATE POLICY "Authenticated users can upload listing images" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own listing images" ON storage.objects 
  FOR UPDATE USING (bucket_id = 'listing-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own listing images" ON storage.objects 
  FOR DELETE USING (bucket_id = 'listing-images' AND auth.role() = 'authenticated');