-- Security fixes:
-- 1. soft_delete_employee: add role check (was SECURITY DEFINER with no authorization)
-- 2. RLS: restrict qual_exam_history / seminar_records to admin/hr + self
-- 3. RLS: restrict vehicle sub-tables (tires/repairs/accidents) to admin/hr only (matches parent vehicles)
-- 4. RLS: restrict certificate_images to admin/hr + qualification owner
-- 5. soft_delete_employee: cascade to employee_qualifications (was missing)

-- ----------------------------------------------------------------
-- 1. Fix soft_delete_employee
-- ----------------------------------------------------------------
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
    -- Require admin or hr role
    if public.get_user_role() not in ('admin', 'hr') then
        raise exception 'permission denied: admin or hr role required';
    end if;

    update public.vehicles
    set primary_user_id = null
    where primary_user_id = p_employee_id;

    update public.construction_records
    set deleted_at = soft_deleted_at,
        deleted_by = auth.uid()
    where employee_id = p_employee_id
      and deleted_at is null;

    update public.health_checks
    set deleted_at = soft_deleted_at,
        deleted_by = auth.uid()
    where employee_id = p_employee_id
      and deleted_at is null;

    update public.alcohol_checks
    set deleted_at = soft_deleted_at,
        deleted_by = auth.uid()
    where employee_id = p_employee_id
      and deleted_at is null;

    -- Also cascade to qualifications (was missing before)
    update public.employee_qualifications
    set deleted_at = soft_deleted_at,
        deleted_by = auth.uid()
    where employee_id = p_employee_id
      and deleted_at is null;

    update public.employees
    set deleted_at = soft_deleted_at,
        deleted_by = auth.uid(),
        updated_at = soft_deleted_at
    where id = p_employee_id
      and deleted_at is null;

    return found;
end;
$$;

revoke all on function public.soft_delete_employee(uuid, uuid) from public;
grant execute on function public.soft_delete_employee(uuid, uuid) to authenticated;

-- ----------------------------------------------------------------
-- 2. Fix qualification_exam_history SELECT: admin/hr全件 + technician自分のみ
-- ----------------------------------------------------------------
drop policy if exists "qual_exam_history_select" on public.qualification_exam_history;

create policy "qual_exam_history_select" on public.qualification_exam_history
    for select using (
        (select public.get_user_role()) in ('admin', 'hr')
        or (
            public.get_auth_employee_id() is not null
            and employee_id = public.get_auth_employee_id()
        )
    );

-- ----------------------------------------------------------------
-- 3. Fix seminar_records SELECT: admin/hr全件 + technician自分のみ
-- ----------------------------------------------------------------
drop policy if exists "seminar_records_select" on public.seminar_records;

create policy "seminar_records_select" on public.seminar_records
    for select using (
        (select public.get_user_role()) in ('admin', 'hr')
        or (
            public.get_auth_employee_id() is not null
            and employee_id = public.get_auth_employee_id()
        )
    );

-- ----------------------------------------------------------------
-- 4. Fix vehicle sub-tables SELECT: admin/hr only (matches parent vehicles table)
-- ----------------------------------------------------------------
drop policy if exists "vehicle_tires_select" on public.vehicle_tires;
create policy "vehicle_tires_select" on public.vehicle_tires
    for select using (
        (select public.get_user_role()) in ('admin', 'hr')
    );

drop policy if exists "vehicle_repairs_select" on public.vehicle_repairs;
create policy "vehicle_repairs_select" on public.vehicle_repairs
    for select using (
        (select public.get_user_role()) in ('admin', 'hr')
    );

drop policy if exists "vehicle_accidents_select" on public.vehicle_accidents;
create policy "vehicle_accidents_select" on public.vehicle_accidents
    for select using (
        (select public.get_user_role()) in ('admin', 'hr')
    );

-- ----------------------------------------------------------------
-- 5. Fix certificate_images SELECT: admin/hr全件 + 免状の本人のみ
-- ----------------------------------------------------------------
drop policy if exists "certificate_images_select" on public.certificate_images;

create policy "certificate_images_select" on public.certificate_images
    for select using (
        (select public.get_user_role()) in ('admin', 'hr')
        or exists (
            select 1 from public.employee_qualifications eq
            where eq.id = certificate_images.qualification_id
              and eq.employee_id = public.get_auth_employee_id()
        )
    );

-- ----------------------------------------------------------------
-- 6. Fix annual_schedules: allow hr to write (was admin-only, inconsistent with design)
-- ----------------------------------------------------------------
drop policy if exists "annual_schedules_write" on public.annual_schedules;

create policy "annual_schedules_write" on public.annual_schedules
    for all using (
        (select public.get_user_role()) in ('admin', 'hr')
    ) with check (
        (select public.get_user_role()) in ('admin', 'hr')
    );
