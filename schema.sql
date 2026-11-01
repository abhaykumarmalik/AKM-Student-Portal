-- Supabase → SQL Editor में चलाएँ।
-- पहले Authentication → Users → Add user से admin का email + password वाला user बनाएँ (Auto-confirm चालू),
-- फिर नीचे आख़िरी लाइन में YOUR_ADMIN_EMAIL बदलकर पूरा script चलाएँ।
create table if not exists public.portal_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.portal_data enable row level security;
alter table public.admins enable row level security;  -- बिना policy: API से कोई नहीं पढ़ सकता

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

drop policy if exists "everyone reads" on public.portal_data;
drop policy if exists "admin inserts" on public.portal_data;
drop policy if exists "admin updates" on public.portal_data;
drop policy if exists "admin deletes" on public.portal_data;
create policy "everyone reads" on public.portal_data for select using (true);
create policy "admin inserts" on public.portal_data for insert to authenticated with check (public.is_admin());
create policy "admin updates" on public.portal_data for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin deletes" on public.portal_data for delete to authenticated using (public.is_admin());

insert into public.admins (user_id) select id from auth.users where lower(email) = lower('YOUR_ADMIN_EMAIL@example.com') on conflict do nothing;
