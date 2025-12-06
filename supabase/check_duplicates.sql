select phone, count(*)
from profiles
group by phone
having count(*) > 1;
