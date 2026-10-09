-- Review and run once in the SELECTED Supabase project. Uses isolated sm_* names.
begin;
create table public.sm_admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.sm_admins enable row level security;
grant select on public.sm_admins to authenticated;
create policy self_admin on public.sm_admins for select to authenticated using(user_id=(select auth.uid()));
create table public.sm_products(id uuid primary key default gen_random_uuid(),name_ar text not null,name_en text not null,category text not null check(category in ('games','parts','safety')),price numeric(12,2) not null check(price>=0),unit_ar text not null default '',unit_en text not null default '',image text not null default '',description_ar text not null default '',description_en text not null default '',aliases text not null default '',featured boolean not null default false,published boolean not null default true);
create table public.sm_centers(id uuid primary key default gen_random_uuid(),name_ar text not null,name_en text not null,city_ar text not null default '',city_en text not null default '',image text not null default '',published boolean not null default true);
create table public.sm_pages(id uuid primary key default gen_random_uuid(),slug text unique not null check(slug ~ '^[a-z0-9-]+$'),title_ar text not null,title_en text not null,body_ar text not null default '',body_en text not null default '',image text not null default '',published boolean not null default true);
create table public.sm_settings(id text primary key check(id='global'),brand_ar text not null,brand_en text not null,whatsapp text not null default '',instagram text not null default '',payment_ar text not null default '',payment_en text not null default '',shipping_ar text not null default '',shipping_en text not null default '');
do $block$ declare tbl text; begin
 foreach tbl in array array['sm_products','sm_centers','sm_pages','sm_settings'] loop
 execute format('alter table public.%I enable row level security',tbl);
 execute format('grant select on public.%I to anon, authenticated',tbl);
 execute format('grant insert, update, delete on public.%I to authenticated',tbl);
 execute format('create policy admin_manage on public.%I for all to authenticated using(exists(select 1 from public.sm_admins where user_id=(select auth.uid()))) with check(exists(select 1 from public.sm_admins where user_id=(select auth.uid())))',tbl);
 if tbl='sm_settings' then execute format('create policy public_read on public.%I for select to anon, authenticated using(true)',tbl);
 else execute format('create policy public_read on public.%I for select to anon, authenticated using(published)',tbl);end if;
 end loop;
end $block$;
create table public.sm_orders(id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users(id),company text not null,contact_name text not null,email text not null,phone text not null,contact jsonb not null,items jsonb not null,estimated_subtotal numeric(14,2) not null default 0,status text not null default 'pending' check(status in ('pending','reviewing','quoted','completed','cancelled')),created_at timestamptz not null default now());
alter table public.sm_orders enable row level security;
grant select, insert on public.sm_orders to authenticated;
grant update(status) on public.sm_orders to authenticated;
create policy own_order_read on public.sm_orders for select to authenticated using(user_id=(select auth.uid()));
create policy own_order_create on public.sm_orders for insert to authenticated with check(user_id=(select auth.uid()) and status='pending');
create policy admin_order_read on public.sm_orders for select to authenticated using(exists(select 1 from public.sm_admins where user_id=(select auth.uid())));
create policy admin_order_update on public.sm_orders for update to authenticated using(exists(select 1 from public.sm_admins where user_id=(select auth.uid()))) with check(exists(select 1 from public.sm_admins where user_id=(select auth.uid())));
create index sm_orders_owner on public.sm_orders(user_id);
create index sm_orders_date on public.sm_orders(created_at desc);
create function public.sm_validate_order() returns trigger language plpgsql security invoker set search_path='' as $fn$
declare item jsonb;product public.sm_products;qty integer;clean jsonb='[]'::jsonb;subtotal numeric=0;k text;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if jsonb_typeof(new.contact)<>'object' or jsonb_typeof(new.items)<>'array' then raise exception 'Invalid request';end if;
 if jsonb_array_length(new.items)<1 or jsonb_array_length(new.items)>100 then raise exception 'Invalid number of items';end if;
 foreach k in array array['company','contact_name','email','phone','country','region','city','address','recipient_phone'] loop
 if length(trim(coalesce(new.contact->>k,'')))<1 or length(new.contact->>k)>500 then raise exception 'Missing or invalid field: %',k;end if;
 end loop;
 if length(coalesce(new.contact->>'notes',''))>5000 then raise exception 'Notes too long';end if;
 if (new.contact->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Invalid email';end if;
 if (new.contact->>'phone') !~ '^[+0-9 ()-]{9,20}$' or (new.contact->>'recipient_phone') !~ '^[+0-9 ()-]{9,20}$' then raise exception 'Invalid phone';end if;
 for item in select value from jsonb_array_elements(new.items) loop
 if (item->>'quantity') !~ '^[0-9]+$' then raise exception 'Invalid quantity';end if;
 qty=(item->>'quantity')::integer;if qty<1 or qty>100000 then raise exception 'Invalid quantity';end if;
 select * into product from public.sm_products where id=(item->>'product_id')::uuid and published;
 if not found then raise exception 'Product is no longer available';end if;
 subtotal=subtotal+product.price*qty;
 clean=clean||jsonb_build_array(jsonb_build_object('product_id',product.id,'name_ar',product.name_ar,'name_en',product.name_en,'quantity',qty,'unit_price',product.price));
 end loop;
 new.user_id=auth.uid();new.company=new.contact->>'company';new.contact_name=new.contact->>'contact_name';new.email=new.contact->>'email';new.phone=new.contact->>'phone';new.items=clean;new.estimated_subtotal=subtotal;new.created_at=now();new.status='pending';return new;
end $fn$;
revoke all on function public.sm_validate_order() from public, anon, authenticated;
create trigger sm_order_validate before insert on public.sm_orders for each row execute function public.sm_validate_order();
create function public.sm_submit_order(p_id uuid,p_contact jsonb,p_items jsonb) returns void language sql security invoker set search_path='' as $fn$
 insert into public.sm_orders(id,company,contact_name,email,phone,contact,items) values(p_id,p_contact->>'company',p_contact->>'contact_name',p_contact->>'email',p_contact->>'phone',p_contact,p_items);
$fn$;
revoke all on function public.sm_submit_order(uuid,jsonb,jsonb) from public,anon;
grant execute on function public.sm_submit_order(uuid,jsonb,jsonb) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('sm-media','sm-media',true,5242880,array['image/png','image/jpeg','image/webp']);
create policy sm_media_read on storage.objects for select to anon,authenticated using(bucket_id='sm-media');
create policy sm_media_admin on storage.objects for all to authenticated using(bucket_id='sm-media' and exists(select 1 from public.sm_admins where user_id=(select auth.uid()))) with check(bucket_id='sm-media' and exists(select 1 from public.sm_admins where user_id=(select auth.uid())));
commit;
-- After creating and confirming your administrator's Auth account:
-- insert into public.sm_admins(user_id) values ('YOUR-CONFIRMED-AUTH-USER-UUID');
