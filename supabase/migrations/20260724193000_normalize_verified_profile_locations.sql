-- Normalize only location values explicitly supplied by these members.
update public.profiles p set city='Vienna', country='Austria', region='State of Vienna', latitude=48.20849, longitude=16.37208, location_label='Vienna, Austria', location_place_id=2761369
from auth.users u where p.id=u.id and lower(u.email) in ('kdvalmonte@gmail.com','brody@brody.org');

update public.profiles p set city='Berlin', country='Germany', region='Berlin', latitude=52.520008, longitude=13.404954, location_label='Berlin, Germany', location_place_id=null
from auth.users u where p.id=u.id and lower(u.email)='marcel.flemming@outlook.com';

update public.profiles p set city=null, country='Belgium', region=null, latitude=null, longitude=null, location_label='Belgium', location_place_id=null
from auth.users u where p.id=u.id and lower(u.email)='theniceplayer@gmail.com';
