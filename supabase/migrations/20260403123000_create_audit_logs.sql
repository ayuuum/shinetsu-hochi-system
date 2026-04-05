create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid,
    actor_email text,
    entity_type text not null,
    entity_id uuid not null,
    action text not null,
    summary text,
    metadata jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id, created_at desc);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id, created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "auth_select_audit_logs" on public.audit_logs;
create policy "auth_select_audit_logs"
on public.audit_logs
for select
to authenticated
using (public.get_user_role() in ('admin', 'hr'));

drop policy if exists "admin_hr_insert_audit_logs" on public.audit_logs;
create policy "admin_hr_insert_audit_logs"
on public.audit_logs
for insert
to authenticated
with check (public.get_user_role() in ('admin', 'hr'));
