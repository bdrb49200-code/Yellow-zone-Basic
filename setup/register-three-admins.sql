-- Run this AFTER creating the three users in Supabase Authentication > Users.
-- It grants admin access only to the three listed Auth users.

insert into public.sm_admins (user_id)
select id
from auth.users
where lower(email) in (
  't23782275@gmail.com',
  'vhvhbhvh7@gmail.com',
  'ncjvunfbycjvg@gmail.com'
)
on conflict (user_id) do nothing;

-- Optional verification:
select u.id, u.email, a.user_id is not null as is_admin
from auth.users u
left join public.sm_admins a on a.user_id = u.id
where lower(u.email) in (
  't23782275@gmail.com',
  'vhvhbhvh7@gmail.com',
  'ncjvunfbycjvg@gmail.com'
)
order by u.email;
