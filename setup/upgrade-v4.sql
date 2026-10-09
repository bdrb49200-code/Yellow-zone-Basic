-- Run after schema.sql for a new installation, or once on an existing sm_* installation.
begin;
alter table public.sm_centers add column if not exists logo text not null default '';
alter table public.sm_centers add column if not exists gallery jsonb not null default '[]'::jsonb check(jsonb_typeof(gallery)='array');
alter table public.sm_settings add column if not exists phone text not null default '';
alter table public.sm_settings add column if not exists logo text not null default '';
alter table public.sm_settings add column if not exists facebook text not null default '';
alter table public.sm_settings add column if not exists tiktok text not null default '';
alter table public.sm_settings add column if not exists youtube text not null default '';
alter table public.sm_settings add column if not exists catalog text not null default '';
alter table public.sm_settings add column if not exists website text not null default '';
commit;
