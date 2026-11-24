-- Safe/idempotent importer for the 300 playground products.
-- Existing products are preserved. Existing playground images are not duplicated.
with defs(kind,cnt,prefix_ar,prefix_en,group_key,sort_base) as (
  values
    ('halls',126,'تجهيز صالة ألعاب - تصميم ','Play centre setup - design ','center_halls',1000),
    ('mazes',70,'متاهة أطفال - تصميم ','Kids maze - design ','home_school',2000),
    ('trampoline',34,'ترامبولين - تصميم ','Trampoline - design ','home_school',3000),
    ('balls',19,'حوض كور - تصميم ','Ball pit - design ','home_school',4000),
    ('slides',16,'زحليقة - تصميم ','Slide - design ','home_school',5000),
    ('rooms',35,'تجهيز غرفة ألعاب - تصميم ','Playroom setup - design ','home_school',6000)
),
items as (
  select
    md5('sm-300:'||d.kind||':'||g.n)::uuid as id,
    d.prefix_ar||lpad(g.n::text,3,'0') as name_ar,
    d.prefix_en||lpad(g.n::text,3,'0') as name_en,
    'games'::text as category,
    0::numeric as price,
    ''::text as unit_ar,
    ''::text as unit_en,
    'https://vhvhbhvh7-lgtm.github.io/Yellow-zone-Basic/assets/playgrounds-300/'||d.kind||'-'||lpad(g.n::text,3,'0')||'.jpg' as image,
    'تصميم قابل للتخصيص؛ السعر والمقاسات عند الطلب.'::text as description_ar,
    'Customisable design; price and dimensions on request.'::text as description_en,
    'sm-row:'||d.kind||' تجهيزات ألعاب أطفال' as aliases,
    false as featured,
    true as published,
    false as price_visible,
    0::numeric as discount_percent,
    d.group_key,
    d.sort_base + g.n as sort_order
  from defs d
  cross join lateral generate_series(1,d.cnt) as g(n)
)
insert into public.sm_products
(id,name_ar,name_en,category,price,unit_ar,unit_en,image,description_ar,description_en,aliases,featured,published,price_visible,discount_percent,group_key,sort_order)
select id,name_ar,name_en,category,price,unit_ar,unit_en,image,description_ar,description_en,aliases,featured,published,price_visible,discount_percent,group_key,sort_order
from items i
where not exists (select 1 from public.sm_products p where p.image=i.image)
on conflict (id) do nothing;
