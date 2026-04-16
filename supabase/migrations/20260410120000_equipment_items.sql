-- 備品台帳（管理番号・購入情報）

create table public.equipment_items (
    id uuid primary key default gen_random_uuid(),
    management_number text not null,
    name text not null,
    category text,
    purchase_date date,
    purchase_amount numeric(14, 2),
    branch text,
    notes text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    deleted_at timestamp with time zone,
    deleted_by uuid
);

create unique index equipment_items_management_number_active_key
    on public.equipment_items (management_number)
    where deleted_at is null;

create index idx_equipment_items_deleted_at
    on public.equipment_items (deleted_at);

create index idx_equipment_items_branch
    on public.equipment_items (branch);

alter table public.equipment_items enable row level security;

create policy "auth_select_equipment_items"
    on public.equipment_items
    for select
    to authenticated
    using (true);

create policy "admin_hr_insert_equipment_items"
    on public.equipment_items
    for insert
    to authenticated
    with check (public.get_user_role() in ('admin', 'hr'));

create policy "admin_hr_update_equipment_items"
    on public.equipment_items
    for update
    to authenticated
    using (public.get_user_role() in ('admin', 'hr'));
