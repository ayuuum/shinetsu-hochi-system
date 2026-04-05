-- Create life insurance table
CREATE TABLE IF NOT EXISTS public.employee_life_insurances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    insurance_name TEXT NOT NULL,
    insurance_company TEXT NOT NULL,
    agency TEXT,
    start_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    peak_date DATE,
    payout_ratio DECIMAL(5, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create damage insurance table
CREATE TABLE IF NOT EXISTS public.employee_damage_insurances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    insurance_type TEXT NOT NULL,
    insurance_name TEXT NOT NULL,
    insurance_company TEXT NOT NULL,
    agency TEXT,
    renewal_date DATE NOT NULL,
    coverage_details TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS for life insurances
ALTER TABLE public.employee_life_insurances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_eli" ON public.employee_life_insurances FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_hr_modify_eli" ON public.employee_life_insurances FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_update_eli" ON public.employee_life_insurances FOR UPDATE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_delete_eli" ON public.employee_life_insurances FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));

-- Add RLS for damage insurances
ALTER TABLE public.employee_damage_insurances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_edi" ON public.employee_damage_insurances FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_hr_modify_edi" ON public.employee_damage_insurances FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_update_edi" ON public.employee_damage_insurances FOR UPDATE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_delete_edi" ON public.employee_damage_insurances FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));
