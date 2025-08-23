-- Seed data for admin_profiles
INSERT INTO public.admin_profiles (name, avatar_url, verified, rating, deals, whatsapp, active) VALUES
  ('Qousain Khan', 'https://i.imgur.com/Xk9OqdY.png', TRUE, 4.9, 412, '+923001234567', TRUE),
  ('Nauman Chaudhary', 'https://i.imgur.com/AaFiZhE.jpeg', TRUE, 4.8, 523, '+923007654321', TRUE),
  ('Ad Khan', 'https://i.imgur.com/CYTG6Oa.jpeg', TRUE, 4.7, 434, '+923009876543', TRUE),
  ('Sara Kettani', NULL, FALSE, 4.6, 389, '+212612345678', TRUE),
  ('Hamza Ramzi', NULL, FALSE, 4.5, 276, '+212612987654', TRUE),
  ('Ahmed Zouani', NULL, TRUE, 4.3, 198, '+212613456789', TRUE);

-- Create some sample profiles and listings for demo
-- First create sample seller profiles (these would normally be created via Edge Function)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, instance_id, aud, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'seller1@escrow.local', NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'seller2@escrow.local', NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'seller3@escrow.local', NOW(), NOW(), NOW(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

INSERT INTO public.profiles (id, role, whatsapp) VALUES
  ('11111111-1111-1111-1111-111111111111', 'seller', '+212612345000'),
  ('22222222-2222-2222-2222-222222222222', 'seller', '+34612345000'),
  ('33333333-3333-3333-3333-333333333333', 'seller', '+91987654321');

-- Sample listings
INSERT INTO public.listings (seller_id, title, country, year, price_usd, verified_with_id, deal_type, apps, live, suspended, play_url, whatsapp) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Google Play Account', 'Morocco', 2020, 1700, TRUE, 'instant', 5, 5, 2, 'https://play.google.com/store/apps/dev?id=5258410538530331508', '+212612345000'),
  ('11111111-1111-1111-1111-111111111111', 'Google Play Account', 'Morocco', 2019, 1200, FALSE, '7day', 3, 2, 1, 'https://play.google.com/store/apps/dev?id=8532907581042995001', '+212612345000'),
  ('22222222-2222-2222-2222-222222222222', 'Google Play Account', 'Spain', 2021, 2100, TRUE, 'instant', 8, 7, 0, 'https://play.google.com/store/apps/developer?id=Masarat+App', '+34612345000'),
  ('22222222-2222-2222-2222-222222222222', 'Google Play Account', 'Spain', 2020, 1850, TRUE, 'instant', 6, 5, 1, 'https://play.google.com/store/apps/dev?id=5700313618786177705', '+34612345000'),
  ('33333333-3333-3333-3333-333333333333', 'Google Play Account', 'India', 2019, 950, FALSE, '7day', 4, 3, 2, 'https://play.google.com/store/apps/dev?id=6091752745250081031', '+91987654321'),
  ('33333333-3333-3333-3333-333333333333', 'Google Play Account', 'India', 2022, 1450, TRUE, 'instant', 7, 6, 0, 'https://play.google.com/store/apps/dev?id=5258410538530331508', '+91987654321'),
  ('11111111-1111-1111-1111-111111111111', 'Google Play Account', 'Morocco', 2021, 1380, TRUE, 'instant', 4, 4, 0, 'https://play.google.com/store/apps/developer?id=Masarat+App', '+212612345000'),
  ('22222222-2222-2222-2222-222222222222', 'Google Play Account', 'Spain', 2018, 800, FALSE, '7day', 2, 1, 1, 'https://play.google.com/store/apps/dev?id=8532907581042995001', '+34612345000'),
  ('33333333-3333-3333-3333-333333333333', 'Google Play Account', 'India', 2020, 1600, TRUE, 'instant', 9, 8, 1, 'https://play.google.com/store/apps/dev?id=5700313618786177705', '+91987654321'),
  ('11111111-1111-1111-1111-111111111111', 'Google Play Account', 'Morocco', 2023, 2400, TRUE, 'instant', 12, 11, 0, 'https://play.google.com/store/apps/dev?id=6091752745250081031', '+212612345000');

-- Sample listing images for each listing
INSERT INTO public.listing_images (listing_id, url, position)
SELECT 
  l.id,
  CASE 
    WHEN position_num = 0 THEN 'https://i.imgur.com/r07ZSeC.png'
    WHEN position_num = 1 THEN 'https://i.imgur.com/44XpjH0.png'
    ELSE 'https://i.imgur.com/PSIboCX.png'
  END as url,
  position_num as position
FROM public.listings l
CROSS JOIN generate_series(0, 2) as position_num;