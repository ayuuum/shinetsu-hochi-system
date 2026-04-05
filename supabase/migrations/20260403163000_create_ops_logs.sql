create extension if not exists "pgcrypto";

create table if not exists public.import_runs (
    id uuid primary key default gen_random_uuid(),
    import_kind text not null check (import_kind in ('employees')),
    source_file_name text,
    status text not null check (status in ('running', 'completed', 'failed')),
    total_rows integer not null default 0,
    valid_rows integer not null default 0,
    inserted_rows integer not null default 0,
    failed_rows integer not null default 0,
    skipped_rows integer not null default 0,
    initiated_by uuid references public.user_roles(id) on delete set null,
    initiated_email text,
    summary text,
    error_rows jsonb not null default '[]'::jsonb,
    created_at timestamp with time zone not null default now(),
    finished_at timestamp with time zone
);

create index if not exists idx_import_runs_created_at
    on public.import_runs (created_at desc);

create index if not exists idx_import_runs_kind_status
    on public.import_runs (import_kind, status);

alter table public.import_runs enable row level security;

drop policy if exists "auth_select_import_runs" on public.import_runs;
create policy "auth_select_import_runs"
    on public.import_runs
    for select
    to authenticated
    using (true);

drop policy if exists "admin_hr_insert_import_runs" on public.import_runs;
create policy "admin_hr_insert_import_runs"
    on public.import_runs
    for insert
    to authenticated
    with check (public.get_user_role() in ('admin', 'hr'));

drop policy if exists "admin_hr_update_import_runs" on public.import_runs;
create policy "admin_hr_update_import_runs"
    on public.import_runs
    for update
    to authenticated
    using (public.get_user_role() in ('admin', 'hr'))
    with check (public.get_user_role() in ('admin', 'hr'));

create table if not exists public.job_runs (
    id uuid primary key default gen_random_uuid(),
    job_key text not null,
    job_label text not null,
    trigger_type text not null check (trigger_type in ('cron', 'manual')),
    triggered_by uuid references public.user_roles(id) on delete set null,
    triggered_email text,
    status text not null check (status in ('running', 'completed', 'failed')),
    total_items integer not null default 0,
    processed_items integer not null default 0,
    error_message text,
    metrics jsonb not null default '{}'::jsonb,
    started_at timestamp with time zone not null default now(),
    finished_at timestamp with time zone
);

create index if not exists idx_job_runs_started_at
    on public.job_runs (started_at desc);

create index if not exists idx_job_runs_key_status
    on public.job_runs (job_key, status);

alter table public.job_runs enable row level security;

drop policy if exists "auth_select_job_runs" on public.job_runs;
create policy "auth_select_job_runs"
    on public.job_runs
    for select
    to authenticated
    using (true);

drop policy if exists "admin_hr_insert_job_runs" on public.job_runs;
create policy "admin_hr_insert_job_runs"
    on public.job_runs
    for insert
    to authenticated
    with check (public.get_user_role() in ('admin', 'hr'));

drop policy if exists "admin_hr_update_job_runs" on public.job_runs;
create policy "admin_hr_update_job_runs"
    on public.job_runs
    for update
    to authenticated
    using (public.get_user_role() in ('admin', 'hr'))
    with check (public.get_user_role() in ('admin', 'hr'));
