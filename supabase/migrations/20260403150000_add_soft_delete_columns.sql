-- soft delete support for core operational tables

alter table public.employees
    add column if not exists deleted_at timestamp with time zone,
    add column if not exists deleted_by uuid;

alter table public.vehicles
    add column if not exists deleted_at timestamp with time zone,
    add column if not exists deleted_by uuid;

alter table public.construction_records
    add column if not exists deleted_at timestamp with time zone,
    add column if not exists deleted_by uuid;

alter table public.health_checks
    add column if not exists deleted_at timestamp with time zone,
    add column if not exists deleted_by uuid;

alter table public.alcohol_checks
    add column if not exists deleted_at timestamp with time zone,
    add column if not exists deleted_by uuid;

create index if not exists idx_employees_deleted_at
    on public.employees (deleted_at);

create index if not exists idx_vehicles_deleted_at
    on public.vehicles (deleted_at);

create index if not exists idx_construction_records_deleted_at
    on public.construction_records (deleted_at);

create index if not exists idx_health_checks_deleted_at
    on public.health_checks (deleted_at);

create index if not exists idx_alcohol_checks_deleted_at
    on public.alcohol_checks (deleted_at);

alter table public.employees
    drop constraint if exists employees_employee_number_key;

create unique index if not exists employees_employee_number_active_key
    on public.employees (employee_number)
    where deleted_at is null;

alter table public.vehicles
    drop constraint if exists vehicles_plate_number_key;

create unique index if not exists vehicles_plate_number_active_key
    on public.vehicles (plate_number)
    where deleted_at is null;

drop function if exists public.soft_delete_employee(uuid, uuid);

create or replace function public.soft_delete_employee(
    p_employee_id uuid,
    p_deleted_by uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    soft_deleted_at timestamp with time zone := now();
begin
    update public.vehicles
    set primary_user_id = null
    where primary_user_id = p_employee_id;

    update public.construction_records
    set deleted_at = soft_deleted_at,
        deleted_by = p_deleted_by
    where employee_id = p_employee_id
      and deleted_at is null;

    update public.health_checks
    set deleted_at = soft_deleted_at,
        deleted_by = p_deleted_by
    where employee_id = p_employee_id
      and deleted_at is null;

    update public.alcohol_checks
    set deleted_at = soft_deleted_at,
        deleted_by = p_deleted_by
    where employee_id = p_employee_id
      and deleted_at is null;

    update public.employees
    set deleted_at = soft_deleted_at,
        deleted_by = p_deleted_by,
        updated_at = soft_deleted_at
    where id = p_employee_id
      and deleted_at is null;

    return found;
end;
$$;

revoke all on function public.soft_delete_employee(uuid, uuid) from public;
grant execute on function public.soft_delete_employee(uuid, uuid) to authenticated;
