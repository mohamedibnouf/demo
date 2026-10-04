-- File intelligence persistence + private storage policies

create table if not exists documents (
  id text primary key,
  document_number text not null unique,
  title text not null,
  original_filename text not null,
  stored_filename text not null,
  mime_type text not null,
  extension text not null,
  size_bytes bigint not null,
  storage_bucket text not null,
  storage_path text,
  checksum text not null,
  module text not null,
  record_type text,
  record_id text,
  status text not null,
  processing_status text not null,
  uploaded_by uuid,
  uploaded_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists document_versions (
  id text primary key,
  document_id text not null references documents(id),
  version integer not null,
  storage_path text not null,
  checksum text not null,
  uploaded_by uuid,
  uploaded_at timestamptz not null default now()
);

create table if not exists document_processing_jobs (
  id text primary key,
  document_id text not null references documents(id),
  stage text not null,
  status text not null,
  message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists document_extractions (
  id text primary key,
  document_id text not null references documents(id),
  kind text not null,
  page_count integer,
  sheet_names jsonb,
  text text,
  tables jsonb,
  metadata jsonb,
  ocr_enabled boolean default false,
  extractable boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists document_analysis_results (
  id text primary key,
  document_id text not null references documents(id),
  provider text not null,
  mode text not null,
  summary text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid
);

create table if not exists import_batches (
  id text primary key,
  document_id text not null references documents(id),
  file text not null,
  profile text not null,
  checksum text not null,
  uploaded_by uuid,
  uploaded_at timestamptz not null default now(),
  confirmed_at timestamptz,
  status text not null,
  processed integer default 0,
  valid integer default 0,
  warnings integer default 0,
  invalid integer default 0,
  added integer default 0,
  updated integer default 0,
  failed integer default 0,
  mapping jsonb,
  sheet_name text
);

create table if not exists import_rows (
  id text primary key,
  batch_id text not null references import_batches(id),
  row_number integer not null,
  status text not null,
  original jsonb,
  normalized jsonb,
  issues jsonb,
  imported_record_id text,
  imported_record_type text
);

create table if not exists import_errors (
  id text primary key,
  job_id text,
  row integer,
  error text,
  value text,
  recommendation text
);

alter table documents enable row level security;
alter table document_versions enable row level security;
alter table document_processing_jobs enable row level security;
alter table document_extractions enable row level security;
alter table document_analysis_results enable row level security;
alter table import_batches enable row level security;
alter table import_rows enable row level security;
alter table import_errors enable row level security;

create policy documents_staff_read on documents for select to authenticated using (true);
create policy document_versions_staff_read on document_versions for select to authenticated using (true);
create policy document_jobs_staff_read on document_processing_jobs for select to authenticated using (true);
create policy document_extractions_staff_read on document_extractions for select to authenticated using (true);
create policy document_analysis_staff_read on document_analysis_results for select to authenticated using (true);
create policy import_batches_staff_read on import_batches for select to authenticated using (true);
create policy import_rows_staff_read on import_rows for select to authenticated using (true);
create policy import_errors_staff_read on import_errors for select to authenticated using (true);

insert into storage.buckets (id, name, public)
values ('samco-documents', 'samco-documents', false)
on conflict (id) do update set public = false;

create policy samco_documents_read on storage.objects
  for select to authenticated
  using (bucket_id = 'samco-documents');

create policy samco_documents_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'samco-documents');
