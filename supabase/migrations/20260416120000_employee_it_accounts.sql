-- IT・ソフトウェア利用情報（Microsoft 365 / Canon ImageWARE 等）
-- 総務・管理者のみ参照・編集可（technician は RLS で行自体が見えない）

CREATE TABLE public.employee_it_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  login_id TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_employee_it_accounts_employee_id ON public.employee_it_accounts(employee_id);

COMMENT ON TABLE public.employee_it_accounts IS '社員のITサービス利用メモ（ログインID・契約情報等）。パスワードは保存しない運用を推奨。';

ALTER TABLE public.employee_it_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_hr_select_employee_it_accounts" ON public.employee_it_accounts
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('admin', 'hr'));

CREATE POLICY "admin_hr_insert_employee_it_accounts" ON public.employee_it_accounts
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'hr'));

CREATE POLICY "admin_hr_update_employee_it_accounts" ON public.employee_it_accounts
  FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'hr'));

CREATE POLICY "admin_hr_delete_employee_it_accounts" ON public.employee_it_accounts
  FOR DELETE TO authenticated
  USING (public.get_user_role() IN ('admin', 'hr'));
