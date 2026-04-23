-- Tire records per vehicle (タイヤ情報)
CREATE TABLE IF NOT EXISTS public.vehicle_tires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    purchase_date DATE,
    manufacture_year INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.vehicle_tires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicle_tires_select" ON public.vehicle_tires
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "vehicle_tires_write" ON public.vehicle_tires FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role IN ('admin','hr')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role IN ('admin','hr')));

-- Repair history per vehicle (修理履歴)
CREATE TABLE IF NOT EXISTS public.vehicle_repairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    repair_date DATE NOT NULL,
    description TEXT NOT NULL,
    cost NUMERIC(10,0),
    repaired_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_repairs_vehicle_id
    ON public.vehicle_repairs (vehicle_id, repair_date DESC);

ALTER TABLE public.vehicle_repairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicle_repairs_select" ON public.vehicle_repairs
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "vehicle_repairs_write" ON public.vehicle_repairs FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role IN ('admin','hr')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role IN ('admin','hr')));

-- Accident records per vehicle (事故記録)
CREATE TABLE IF NOT EXISTS public.vehicle_accidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    accident_date DATE NOT NULL,
    driver_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_accidents_vehicle_id
    ON public.vehicle_accidents (vehicle_id, accident_date DESC);

ALTER TABLE public.vehicle_accidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicle_accidents_select" ON public.vehicle_accidents
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "vehicle_accidents_write" ON public.vehicle_accidents FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role IN ('admin','hr')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role IN ('admin','hr')));
