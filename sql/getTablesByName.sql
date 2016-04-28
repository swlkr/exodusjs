select *
from information_schema.tables
where table_name = $1
