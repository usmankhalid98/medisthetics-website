-- medisthetics shop backend — run once in Supabase Dashboard → SQL Editor
-- Creates: products table, Row Level Security, public image bucket, seed stock.

-- 1. Table ------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  price       numeric not null default 0,
  badge       text not null default 'Refurbished',
  description text not null default '',
  image_url   text not null default '',
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

-- 2. Row Level Security: everyone can read, only logged-in admin can write --
alter table public.products enable row level security;

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products for select using (true);

drop policy if exists "Admin can write products" on public.products;
create policy "Admin can write products"
  on public.products for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 3. Public bucket for product photos ----------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
  on storage.objects for select using (bucket_id = 'product-images');

drop policy if exists "Admin can upload product images" on storage.objects;
create policy "Admin can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "Admin can replace product images" on storage.objects;
create policy "Admin can replace product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "Admin can delete product images" on storage.objects;
create policy "Admin can delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- 4. Seed with the current shop stock (safe to re-run: skips if not empty) ---
insert into public.products (title, price, badge, description, image_url, position)
select * from (values
  ('Lynton Lasers Excelight', 15000, 'Refurbished',
   'IPL system, MK2 2021–present style. Fully serviced, consumables replaced, touched up. 3-mo parts warranty.',
   'https://medisthetics.co.uk/wp-content/uploads/2023/08/359752396_1348862642333833_5605400565994651627_n.jpg', 0),
  ('Lynton Lasers Initia Diode', 24500, 'Refurbished',
   'Diode laser for hair removal. Manufacturer-standard refurb, full service before delivery.',
   'https://medisthetics.co.uk/wp-content/uploads/2023/08/360036607_1311013256158118_4040038408890133275_n.jpg', 1),
  ('Lynton Lasers Luminette Q', 8000, 'Refurbished',
   'Q-switch system ideal for tattoo removal & pigmentation. Serviced + calibrated.',
   'https://medisthetics.co.uk/wp-content/uploads/2023/08/LUMINETTE-Q.png', 2),
  ('Lynton Lasers Luminette Advance', 6000, 'Refurbished',
   'Compact workhorse. Consumables replaced in machine + handpiece.',
   'https://medisthetics.co.uk/wp-content/uploads/2023/08/360044391_654632126548283_4934307316790470406_n.jpg', 3),
  ('Zimmer Cryo 5 Cooler', 2500, 'Refurbished',
   'Cold-air cooling for laser comfort. Tested, serviced, delivery included.',
   'https://medisthetics.co.uk/wp-content/uploads/2023/08/363885656_274215708560216_2065974859361690547_n.jpg', 4),
  ('Lynton Lasers Lumina IPL & Tattoo Removal', 18000, 'Refurbished',
   'Dual IPL + Nd:YAG platform. Full refurb to maker standard.',
   'https://medisthetics.co.uk/wp-content/uploads/2024/04/Lumina-Side-Image.jpg', 5),
  ('Deka Motus AY', 53000, 'Premium',
   'Alexandrite + Nd:YAG with Moveo technology. Premium refurbished system.',
   'https://medisthetics.co.uk/wp-content/uploads/2024/04/Deka-motus-ay.png', 6)
) as seed(title, price, badge, description, image_url, position)
where not exists (select 1 from public.products);
