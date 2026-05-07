-- Soft delete support for employee_qualifications (保有履歴)
ALTER TABLE public.employee_qualifications
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_employee_qualifications_deleted_at
    ON public.employee_qualifications (deleted_at);

-- Photo attachment for training_history (講習写真)
ALTER TABLE public.training_history
    ADD COLUMN IF NOT EXISTS photo_url TEXT;
