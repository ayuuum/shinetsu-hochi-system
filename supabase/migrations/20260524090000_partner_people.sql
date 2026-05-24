alter table public.employees
    add column if not exists person_type text not null default 'employee',
    add column if not exists partner_company text,
    add column if not exists partner_contact_name text,
    add column if not exists partner_notes text;

alter table public.employees
    drop constraint if exists employees_person_type_check;

alter table public.employees
    add constraint employees_person_type_check
    check (person_type in ('employee', 'partner'));

create index if not exists idx_employees_active_person_type
on public.employees (person_type, employee_number)
where deleted_at is null;

create index if not exists idx_employees_active_partner_company_trgm
on public.employees using gin (partner_company gin_trgm_ops)
where deleted_at is null and person_type = 'partner';
