-- Upgrading construction_records to meet PRD requirements
ALTER TABLE public.construction_records
ADD COLUMN client_name text,
ADD COLUMN equipment_types text[],
ADD COLUMN work_type text,
ADD COLUMN contract_amount numeric(12, 2),
ADD COLUMN end_date date;
