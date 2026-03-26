-- Auth roles and RLS migration
-- Creates user_roles table, get_user_role function, and enables RLS on all tables

-- 1. user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'hr', 'technician')),
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Role lookup function
CREATE OR REPLACE FUNCTION public.get_user_role() RETURNS text AS $$
  SELECT role FROM public.user_roles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Enable RLS on all tables

-- employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_hr_modify_employees" ON public.employees FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_update_employees" ON public.employees FOR UPDATE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_delete_employees" ON public.employees FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));

-- employee_qualifications
ALTER TABLE public.employee_qualifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_eq" ON public.employee_qualifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_hr_modify_eq" ON public.employee_qualifications FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_update_eq" ON public.employee_qualifications FOR UPDATE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_delete_eq" ON public.employee_qualifications FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));

-- qualification_master
ALTER TABLE public.qualification_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_qm" ON public.qualification_master FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_hr_modify_qm" ON public.qualification_master FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_update_qm" ON public.qualification_master FOR UPDATE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_delete_qm" ON public.qualification_master FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));

-- vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_hr_modify_vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_update_vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_delete_vehicles" ON public.vehicles FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));

-- employee_family
ALTER TABLE public.employee_family ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_ef" ON public.employee_family FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_hr_modify_ef" ON public.employee_family FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_update_ef" ON public.employee_family FOR UPDATE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_delete_ef" ON public.employee_family FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));

-- alert_logs
ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_al" ON public.alert_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_hr_modify_al" ON public.alert_logs FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_update_al" ON public.alert_logs FOR UPDATE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_delete_al" ON public.alert_logs FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));

-- construction_records
ALTER TABLE public.construction_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_cr" ON public.construction_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_hr_modify_cr" ON public.construction_records FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_update_cr" ON public.construction_records FOR UPDATE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_delete_cr" ON public.construction_records FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));

-- health_checks
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_hc" ON public.health_checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_hr_modify_hc" ON public.health_checks FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_update_hc" ON public.health_checks FOR UPDATE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_delete_hc" ON public.health_checks FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));

-- alcohol_checks
ALTER TABLE public.alcohol_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_ac" ON public.alcohol_checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_hr_modify_ac" ON public.alcohol_checks FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_update_ac" ON public.alcohol_checks FOR UPDATE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_delete_ac" ON public.alcohol_checks FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));

-- inspection_schedules
ALTER TABLE public.inspection_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_is" ON public.inspection_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_hr_modify_is" ON public.inspection_schedules FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_update_is" ON public.inspection_schedules FOR UPDATE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));
CREATE POLICY "admin_hr_delete_is" ON public.inspection_schedules FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'hr'));

-- user_roles table itself
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_ur" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_modify_ur" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "admin_update_ur" ON public.user_roles FOR UPDATE TO authenticated USING (public.get_user_role() = 'admin');
CREATE POLICY "admin_delete_ur" ON public.user_roles FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');
