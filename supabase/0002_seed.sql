-- ============================================================================
-- DES — demo listings.
--
-- Paste into Supabase → SQL Editor → New query → Run.
-- Idempotent: keyed on slug, does nothing if the row already exists.
--
-- Coordinates are real London locations so the map is genuinely useful rather
-- than decorative. Every photograph was reviewed as an image, not merely
-- checked for a 200 response — a third of the candidates were American houses
-- with swimming pools and one was a log cabin, none of which belong on a
-- London lettings site.
-- ============================================================================

insert into public.listings
  (slug, title, description, rent_pcm, bedrooms, bathrooms, property_type, furnishing,
   area, postcode, latitude, longitude, available_from, images, features)
values
  ('e8-wilton-way-two-bed',
   'Two-bedroom flat on Wilton Way',
   'A first-floor flat in a Victorian conversion, with the original cornicing and sash windows kept. Quiet side of the street, two minutes from London Fields.',
   215000, 2, 1, 'flat', 'furnished', 'Hackney', 'E8 3EG', 51.5453, -0.0561, '2026-09-01',
   array['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80',
         'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80'],
   array['Victorian conversion','Sash windows','Two minutes from London Fields','Gas central heating']),

  ('se15-bellenden-one-bed',
   'One-bedroom garden flat, Bellenden Road',
   'Ground floor with sole use of a small walled garden. Recently rewired, and the kitchen was replaced last year.',
   162000, 1, 1, 'flat', 'part-furnished', 'Peckham', 'SE15 4RF', 51.4694, -0.0703, '2026-08-15',
   array['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80',
         'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1400&q=80'],
   array['Private garden','Recently rewired','New kitchen','Council tax band C']),

  ('n1-barnsbury-studio',
   'Studio flat off Barnsbury Square',
   'A well-proportioned studio with a separate kitchen rather than a kitchenette in the corner. Suits one person who wants Islington without the Islington rent.',
   138000, 0, 1, 'studio', 'furnished', 'Islington', 'N1 1QU', 51.5372, -0.1064, '2026-08-01',
   array['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1400&q=80'],
   array['Separate kitchen','High ceilings','Bills not included','No agency fees']),

  ('sw2-brixton-hill-three-bed',
   'Three-bedroom house, Brixton Hill',
   'A whole house over two floors with a proper dining room. Three double bedrooms, which is rarer than the listings suggest.',
   295000, 3, 2, 'house', 'unfurnished', 'Brixton', 'SW2 1QS', 51.4608, -0.1163, '2026-09-15',
   array['https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1400&q=80',
         'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80'],
   array['Three double bedrooms','Separate dining room','Two bathrooms','Garden']),

  ('e1-redchurch-two-bed',
   'Two-bedroom warehouse conversion, Redchurch Street',
   'Open-plan with the original steel columns left exposed. Bright, but it is Shoreditch — the street is lively at weekends.',
   268000, 2, 1, 'flat', 'furnished', 'Shoreditch', 'E1 6JJ', 51.5242, -0.0757, '2026-08-20',
   array['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80',
         'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1400&q=80'],
   array['Warehouse conversion','Exposed steel','Open plan','Lift access']),

  ('nw1-royal-college-one-bed',
   'One-bedroom flat, Royal College Street',
   'Second floor, no lift. South-facing so it holds the light all afternoon. Camden Road overground is a five-minute walk.',
   178000, 1, 1, 'flat', 'furnished', 'Camden', 'NW1 0SP', 51.5385, -0.1401, '2026-10-01',
   array['https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=80'],
   array['South facing','Five minutes to Camden Road','Second floor, no lift','Bike storage']),

  ('sw4-abbeville-two-bed',
   'Two-bedroom period flat, Abbeville Road',
   'A wide Victorian flat with the rooms left as they were rather than knocked through. Fireplaces in both bedrooms.',
   232000, 2, 1, 'flat', 'part-furnished', 'Clapham', 'SW4 9NG', 51.4614, -0.1372, '2026-09-01',
   array['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1400&q=80'],
   array['Period features','Original fireplaces','Wide reception','Close to Clapham Common']),

  ('e17-orford-road-three-bed',
   'Three-bedroom house, Orford Road',
   'In the village end of Walthamstow, which is the part people mean when they say Walthamstow has changed. Small garden, off-street parking.',
   256000, 3, 1, 'house', 'unfurnished', 'Walthamstow', 'E17 9NJ', 51.5847, -0.0193, '2026-08-25',
   array['https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?auto=format&fit=crop&w=1400&q=80'],
   array['Off-street parking','Garden','Walthamstow Village','Victoria line nearby']),

  ('se1-bermondsey-street-one-bed',
   'One-bedroom apartment, Bermondsey Street',
   'A modern block behind the street itself, so it is quieter than the address suggests. Concierge and a shared roof terrace.',
   205000, 1, 1, 'flat', 'furnished', 'Bermondsey', 'SE1 3UW', 51.4986, -0.0808, '2026-08-10',
   array['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80'],
   array['Concierge','Shared roof terrace','Lift access','London Bridge in ten minutes']),

  ('nw6-kilburn-lane-room',
   'Double room in a shared house, Kilburn Lane',
   'One double room in a four-bedroom house with three professional sharers already in place. Bills and cleaner included.',
   98000, 1, 2, 'room', 'furnished', 'Kilburn', 'NW6 5TE', 51.5361, -0.2001, '2026-08-01',
   array['https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1400&q=80'],
   array['Bills included','Cleaner fortnightly','Professional sharers','Double bed']),

  ('se8-deptford-high-street-two-bed',
   'Two-bedroom flat above the high street',
   'Directly above a shopfront, so it is not quiet, but it is a lot of space for the money and the second bedroom is a genuine double.',
   169000, 2, 1, 'flat', 'unfurnished', 'Deptford', 'SE8 4RT', 51.4787, -0.0264, '2026-09-01',
   array['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80'],
   array['Two double bedrooms','Large reception','Deptford station five minutes','Not quiet']),

  ('n16-church-street-two-bed',
   'Two-bedroom flat, Stoke Newington Church Street',
   'Top floor of a converted terrace, looking over the churchyard at the back. Steep stairs and no lift.',
   221000, 2, 1, 'flat', 'furnished', 'Stoke Newington', 'N16 0AR', 51.5623, -0.0798, '2026-09-20',
   array['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80',
         'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1400&q=80'],
   array['Top floor','Overlooks churchyard','Steep stairs, no lift','Clissold Park nearby'])
on conflict (slug) do nothing;
