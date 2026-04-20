-- P0 PRD compliance: acquisition_type, certificate_images, email backfill

-- 1) Backfill employees.email column (schema drift from earlier environments)
alter table public.employees
    add column if not exists email text;

-- 2) Add acquisition_type to employee_qualifications (試験 / 講習 / 実務経験)
alter table public.employee_qualifications
    add column if not exists acquisition_type text
    check (acquisition_type in ('試験', '講習', '実務経験'));

comment on column public.employee_qualifications.acquisition_type is
    '資格取得の区分: 試験 / 講習 / 実務経験';

-- 3) certificate_images table for multi-image support
create table if not exists public.certificate_images (
    id uuid primary key default gen_random_uuid(),
    qualification_id uuid not null references public.employee_qualifications(id) on delete cascade,
    storage_path text not null,
    mime_type text,
    caption text,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    created_by uuid references auth.users(id)
);

create index if not exists certificate_images_qualification_id_idx
    on public.certificate_images(qualification_id, sort_order);

alter table public.certificate_images enable row level security;

-- Read: all authenticated users can see certificate rows (RLS on parent governs access)
drop policy if exists certificate_images_select on public.certificate_images;
create policy certificate_images_select on public.certificate_images
    for select using (auth.role() = 'authenticated');

-- Write: admin / hr only (mirror employee_qualifications policies)
drop policy if exists certificate_images_write on public.certificate_images;
create policy certificate_images_write on public.certificate_images
    for all using (
        exists (
            select 1 from public.user_roles ur
            where ur.user_id = auth.uid()
              and ur.role in ('admin', 'hr')
        )
    ) with check (
        exists (
            select 1 from public.user_roles ur
            where ur.user_id = auth.uid()
              and ur.role in ('admin', 'hr')
        )
    );

-- 4) Backfill existing single-image references into certificate_images
-- (idempotent: only insert rows not already present)
insert into public.certificate_images (qualification_id, storage_path, sort_order)
select eq.id, eq.certificate_url, 0
from public.employee_qualifications eq
where eq.certificate_url is not null
  and not exists (
      select 1 from public.certificate_images ci
      where ci.qualification_id = eq.id
        and ci.storage_path = eq.certificate_url
  );

insert into public.certificate_images (qualification_id, storage_path, sort_order)
select eq.id, eq.image_url, 1
from public.employee_qualifications eq
where eq.image_url is not null
  and eq.image_url <> coalesce(eq.certificate_url, '')
  and not exists (
      select 1 from public.certificate_images ci
      where ci.qualification_id = eq.id
        and ci.storage_path = eq.image_url
  );
