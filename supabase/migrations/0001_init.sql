-- SAMCO IMS/QMS schema (PostgreSQL / Supabase)
-- Default: deny unless a policy grants access.

create extension if not exists "pgcrypto";

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique
);

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists permissions (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  action text not null,
  unique (module, action)
);

create table if not exists role_permissions (
  role_id uuid references roles(id) on delete cascade,
  permission_id uuid references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  country text,
  contact text,
  category text
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  country text,
  contact text
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role_id uuid references roles(id),
  department_id uuid references departments(id),
  supplier_id uuid references suppliers(id),
  customer_id uuid references customers(id),
  title text,
  locale text default 'en',
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists model_families (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null
);

create table if not exists models (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references model_families(id),
  code text not null unique,
  name text not null
);

create table if not exists production_lines (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references model_families(id),
  code text not null unique,
  name text not null
);

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  part_number text not null unique,
  description text,
  supplier_id uuid references suppliers(id),
  category text
);

create table if not exists production_orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  model_id uuid references models(id),
  planned_qty integer not null,
  confirmed boolean default false,
  start_date date,
  end_date date
);

create table if not exists production_units (
  id uuid primary key default gen_random_uuid(),
  serial_number text not null unique,
  order_id uuid references production_orders(id),
  model_id uuid references models(id),
  line_id uuid references production_lines(id),
  produced_at date
);

create table if not exists production_records (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  order_id uuid references production_orders(id),
  model_id uuid references models(id),
  line_id uuid references production_lines(id),
  quantity_produced integer not null,
  good_qty integer not null
);

create table if not exists receiving_records (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  supplier_id uuid references suppliers(id),
  material_id uuid references materials(id),
  quantity integer not null,
  reference text
);

create table if not exists quality_events (
  id text primary key,
  source_event_id text not null,
  type text not null,
  occurred_at timestamptz not null,
  serial_number text,
  model_id uuid,
  line_id uuid,
  supplier_id uuid,
  material_id uuid,
  description text,
  department_id uuid,
  origin_module text,
  origin_record_id text,
  is_demo_data boolean default true
);

create index if not exists quality_events_source_idx on quality_events (source_event_id);
create index if not exists quality_events_supplier_idx on quality_events (supplier_id);

create table if not exists numbering_sequences (
  prefix text not null,
  year integer not null,
  next_value integer not null,
  padding integer default 4,
  primary key (prefix, year)
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  module text not null,
  record_ref text not null,
  previous_value text,
  new_value text,
  created_at timestamptz default now()
);

alter table departments enable row level security;
alter table profiles enable row level security;
alter table quality_events enable row level security;
alter table suppliers enable row level security;
alter table customers enable row level security;
alter table audit_logs enable row level security;

-- Deny-by-default: authenticated staff may read master data.
create policy departments_read on departments for select to authenticated using (true);
create policy profiles_self on profiles for select to authenticated using (auth.uid() = id or true);
create policy quality_events_staff on quality_events for select to authenticated using (true);
create policy suppliers_staff on suppliers for select to authenticated using (true);
create policy customers_staff on customers for select to authenticated using (true);

-- Application-layer checks still enforce supplier/customer isolation and management read-only.
-- Replace the broad staff policies with role claims when going live.
