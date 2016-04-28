create table exodus_migrations (
  id serial primary key,
  name text,
  ran_at timestamp without time zone default now()
);
