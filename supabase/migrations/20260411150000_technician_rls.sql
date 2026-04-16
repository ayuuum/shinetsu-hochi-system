-- 技術者ロール: 本人に紐づくデータのみ参照可能にし、車両・備品・業務ログ等は管理者/人事のみ。
-- get_auth_employee_id: RLS 内で安全に参照（SECURITY DEFINER・自ユーザ行のみ）

CREATE OR REPLACE FUNCTION public.get_auth_employee_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT employee_id
    FROM public.user_roles
    WHERE id = auth.uid();
$$;

-- employees
DROP POLICY IF EXISTS "auth_select_employees" ON public.employees;
CREATE POLICY "auth_select_employees" ON public.employees
    FOR SELECT TO authenticated
    USING (
        public.get_user_role() IN ('admin', 'hr')
        OR (
            public.get_user_role() = 'technician'
            AND public.get_auth_employee_id() IS NOT NULL
            AND id = public.get_auth_employee_id()
        )
    );

-- employee_qualifications
DROP POLICY IF EXISTS "auth_select_eq" ON public.employee_qualifications;
CREATE POLICY "auth_select_eq" ON public.employee_qualifications
    FOR SELECT TO authenticated
    USING (
        public.get_user_role() IN ('admin', 'hr')
        OR (
            public.get_user_role() = 'technician'
            AND public.get_auth_employee_id() IS NOT NULL
            AND employee_id = public.get_auth_employee_id()
        )
    );

-- vehicles
DROP POLICY IF EXISTS "auth_select_vehicles" ON public.vehicles;
CREATE POLICY "auth_select_vehicles" ON public.vehicles
    FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('admin', 'hr'));

-- employee_family（本人の家族行のみ）
DROP POLICY IF EXISTS "auth_select_ef" ON public.employee_family;
CREATE POLICY "auth_select_ef" ON public.employee_family
    FOR SELECT TO authenticated
    USING (
        public.get_user_role() IN ('admin', 'hr')
        OR (
            public.get_user_role() = 'technician'
            AND public.get_auth_employee_id() IS NOT NULL
            AND employee_id = public.get_auth_employee_id()
        )
    );

-- alert_logs
DROP POLICY IF EXISTS "auth_select_al" ON public.alert_logs;
CREATE POLICY "auth_select_al" ON public.alert_logs
    FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('admin', 'hr'));

-- construction_records
DROP POLICY IF EXISTS "auth_select_cr" ON public.construction_records;
CREATE POLICY "auth_select_cr" ON public.construction_records
    FOR SELECT TO authenticated
    USING (
        public.get_user_role() IN ('admin', 'hr')
        OR (
            public.get_user_role() = 'technician'
            AND public.get_auth_employee_id() IS NOT NULL
            AND employee_id = public.get_auth_employee_id()
        )
    );

-- health_checks
DROP POLICY IF EXISTS "auth_select_hc" ON public.health_checks;
CREATE POLICY "auth_select_hc" ON public.health_checks
    FOR SELECT TO authenticated
    USING (
        public.get_user_role() IN ('admin', 'hr')
        OR (
            public.get_user_role() = 'technician'
            AND public.get_auth_employee_id() IS NOT NULL
            AND employee_id = public.get_auth_employee_id()
        )
    );

-- alcohol_checks: 参照は本人が対象の記録のみ（管理者・人事は全件）
DROP POLICY IF EXISTS "auth_select_ac" ON public.alcohol_checks;
CREATE POLICY "auth_select_ac" ON public.alcohol_checks
    FOR SELECT TO authenticated
    USING (
        public.get_user_role() IN ('admin', 'hr')
        OR (
            public.get_user_role() = 'technician'
            AND public.get_auth_employee_id() IS NOT NULL
            AND employee_id = public.get_auth_employee_id()
        )
    );

-- 技術者: 本人を対象・確認者とする記録のみ INSERT（申込は Server Action でも二重チェック）
DROP POLICY IF EXISTS "technician_insert_own_alcohol" ON public.alcohol_checks;
CREATE POLICY "technician_insert_own_alcohol" ON public.alcohol_checks
    FOR INSERT TO authenticated
    WITH CHECK (
        public.get_user_role() = 'technician'
        AND public.get_auth_employee_id() IS NOT NULL
        AND employee_id = public.get_auth_employee_id()
        AND checker_id = public.get_auth_employee_id()
    );

-- inspection_schedules（20260402120000 でテーブル削除済みの環境ではスキップ）
DO $inspection_schedules_policy$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'inspection_schedules'
    ) THEN
        DROP POLICY IF EXISTS "auth_select_is" ON public.inspection_schedules;
        CREATE POLICY "auth_select_is" ON public.inspection_schedules
            FOR SELECT TO authenticated
            USING (public.get_user_role() IN ('admin', 'hr'));
    END IF;
END
$inspection_schedules_policy$;

-- user_roles: 自分の行または管理者・人事が全件（列挙防止）
DROP POLICY IF EXISTS "auth_select_ur" ON public.user_roles;
CREATE POLICY "auth_select_ur" ON public.user_roles
    FOR SELECT TO authenticated
    USING (
        id = auth.uid()
        OR public.get_user_role() IN ('admin', 'hr')
    );

-- 個人保険テーブル: 技術者は参照不可
DROP POLICY IF EXISTS "auth_select_eli" ON public.employee_life_insurances;
CREATE POLICY "auth_select_eli" ON public.employee_life_insurances
    FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('admin', 'hr'));

DROP POLICY IF EXISTS "auth_select_edi" ON public.employee_damage_insurances;
CREATE POLICY "auth_select_edi" ON public.employee_damage_insurances
    FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('admin', 'hr'));

-- import_runs / job_runs
DROP POLICY IF EXISTS "auth_select_import_runs" ON public.import_runs;
CREATE POLICY "auth_select_import_runs" ON public.import_runs
    FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('admin', 'hr'));

DROP POLICY IF EXISTS "auth_select_job_runs" ON public.job_runs;
CREATE POLICY "auth_select_job_runs" ON public.job_runs
    FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('admin', 'hr'));

-- equipment_items
DROP POLICY IF EXISTS "auth_select_equipment_items" ON public.equipment_items;
CREATE POLICY "auth_select_equipment_items" ON public.equipment_items
    FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('admin', 'hr'));
