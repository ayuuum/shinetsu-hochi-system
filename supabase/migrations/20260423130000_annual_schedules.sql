-- Annual schedule / goals management (年間スケジュール・目標管理)
CREATE TABLE IF NOT EXISTS public.annual_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_year INTEGER NOT NULL,
    title TEXT NOT NULL,
    scheduled_date DATE,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_annual_schedules_fiscal_year
    ON public.annual_schedules (fiscal_year, scheduled_date);

ALTER TABLE public.annual_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "annual_schedules_select" ON public.annual_schedules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "annual_schedules_write" ON public.annual_schedules
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role = 'admin')
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role = 'admin')
    );
