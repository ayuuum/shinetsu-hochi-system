create extension if not exists pg_trgm;

create index if not exists idx_employees_active_branch_employee_number
on public.employees (branch, employee_number)
where deleted_at is null;

create index if not exists idx_employees_active_name_trgm
on public.employees using gin (name gin_trgm_ops)
where deleted_at is null;

create index if not exists idx_employees_active_name_kana_trgm
on public.employees using gin (name_kana gin_trgm_ops)
where deleted_at is null;

create index if not exists idx_employees_active_employee_number_trgm
on public.employees using gin (employee_number gin_trgm_ops)
where deleted_at is null;

create index if not exists idx_qualification_master_category_name
on public.qualification_master (category, name);

create index if not exists idx_qualification_master_name_trgm
on public.qualification_master using gin (name gin_trgm_ops);

create index if not exists idx_employee_qualifications_active_employee_expiry
on public.employee_qualifications (employee_id, expiry_date asc)
where deleted_at is null;

create index if not exists idx_employee_qualifications_active_qualification_expiry
on public.employee_qualifications (qualification_id, expiry_date asc)
where deleted_at is null;

create index if not exists idx_employee_qualifications_deleted_employee_deleted_at
on public.employee_qualifications (employee_id, deleted_at desc)
where deleted_at is not null;

create index if not exists idx_construction_records_active_date
on public.construction_records (construction_date desc)
where deleted_at is null;

create index if not exists idx_construction_records_active_category_date
on public.construction_records (category, construction_date desc)
where deleted_at is null;

create index if not exists idx_construction_records_active_employee_date
on public.construction_records (employee_id, construction_date desc)
where deleted_at is null;

create index if not exists idx_construction_records_active_name_trgm
on public.construction_records using gin (construction_name gin_trgm_ops)
where deleted_at is null;

create index if not exists idx_construction_records_active_location_trgm
on public.construction_records using gin (location gin_trgm_ops)
where deleted_at is null;

create index if not exists idx_health_checks_active_date
on public.health_checks (check_date desc)
where deleted_at is null;

create index if not exists idx_health_checks_active_employee_date
on public.health_checks (employee_id, check_date desc)
where deleted_at is null;

create index if not exists idx_health_checks_active_type_date
on public.health_checks (check_type, check_date desc)
where deleted_at is null;

create index if not exists idx_health_checks_active_hospital_name_trgm
on public.health_checks using gin (hospital_name gin_trgm_ops)
where deleted_at is null;

create index if not exists idx_alcohol_checks_active_datetime
on public.alcohol_checks (check_datetime desc)
where deleted_at is null;

create index if not exists idx_alcohol_checks_active_employee_datetime
on public.alcohol_checks (employee_id, check_datetime desc)
where deleted_at is null;

create index if not exists idx_alcohol_checks_active_location_datetime
on public.alcohol_checks (location, check_datetime desc)
where deleted_at is null;

create index if not exists idx_alcohol_checks_active_abnormal_datetime
on public.alcohol_checks (is_abnormal, check_datetime desc)
where deleted_at is null;

create index if not exists idx_vehicles_active_primary_user
on public.vehicles (primary_user_id)
where deleted_at is null;

create index if not exists idx_vehicles_active_inspection_expiry
on public.vehicles (inspection_expiry asc)
where deleted_at is null;

create index if not exists idx_vehicles_active_liability_expiry
on public.vehicles (liability_insurance_expiry asc)
where deleted_at is null;

create index if not exists idx_vehicles_active_voluntary_expiry
on public.vehicles (voluntary_insurance_expiry asc)
where deleted_at is null;

create index if not exists idx_vehicles_active_vehicle_name_trgm
on public.vehicles using gin (vehicle_name gin_trgm_ops)
where deleted_at is null;

create index if not exists idx_vehicles_active_plate_number_trgm
on public.vehicles using gin (plate_number gin_trgm_ops)
where deleted_at is null;

create index if not exists idx_equipment_items_active_name_trgm
on public.equipment_items using gin (name gin_trgm_ops)
where deleted_at is null;

create index if not exists idx_equipment_items_active_category_trgm
on public.equipment_items using gin (category gin_trgm_ops)
where deleted_at is null;

create index if not exists idx_equipment_items_active_notes_trgm
on public.equipment_items using gin (notes gin_trgm_ops)
where deleted_at is null;

create index if not exists idx_vehicle_tires_vehicle_created_at
on public.vehicle_tires (vehicle_id, created_at desc);

create index if not exists idx_vehicle_repairs_vehicle_repair_date
on public.vehicle_repairs (vehicle_id, repair_date desc);

create index if not exists idx_vehicle_accidents_vehicle_accident_date
on public.vehicle_accidents (vehicle_id, accident_date desc);

create index if not exists idx_employee_it_accounts_employee_sort_order
on public.employee_it_accounts (employee_id, sort_order asc, created_at asc);

create index if not exists idx_qualification_exam_history_employee_exam_date
on public.qualification_exam_history (employee_id, exam_date desc);

create index if not exists idx_seminar_records_employee_held_date
on public.seminar_records (employee_id, held_date desc);
