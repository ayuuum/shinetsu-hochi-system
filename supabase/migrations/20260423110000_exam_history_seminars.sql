-- Exam attempt history (受験履歴 — includes failures)
CREATE TABLE IF NOT EXISTS public.qualification_exam_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    qualification_id UUID REFERENCES public.qualification_master(id) ON DELETE SET NULL,
    qualification_name TEXT,
    exam_date DATE NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('合格', '不合格')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_qual_exam_history_employee_id
    ON public.qualification_exam_history (employee_id, exam_date DESC);

ALTER TABLE public.qualification_exam_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qual_exam_history_select" ON public.qualification_exam_history
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "qual_exam_history_write" ON public.qualification_exam_history
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role IN ('admin','hr'))
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role IN ('admin','hr'))
    );

-- Seminar attendance records (セミナー受講履歴 — separate from qualifications)
CREATE TABLE IF NOT EXISTS public.seminar_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    seminar_name TEXT NOT NULL,
    held_date DATE NOT NULL,
    hours NUMERIC(5,1),
    organizer TEXT,
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_seminar_records_employee_id
    ON public.seminar_records (employee_id, held_date DESC);

ALTER TABLE public.seminar_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seminar_records_select" ON public.seminar_records
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "seminar_records_write" ON public.seminar_records
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role IN ('admin','hr'))
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role IN ('admin','hr'))
    );
