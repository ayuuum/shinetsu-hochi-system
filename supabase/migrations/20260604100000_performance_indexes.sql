-- パフォーマンス改善用インデックス
-- 頻出クエリ（資格カウント集計・ダッシュボード・社員一覧・最新免状判定）の実行計画を改善する。

-- ① 社員一覧（キャッシュ用クエリ: deleted_at IS NULL, ORDER BY branch, name）
CREATE INDEX IF NOT EXISTS idx_employees_active_branch_name
    ON public.employees (branch, name)
    WHERE deleted_at IS NULL;

-- ② 資格カウント集計 / 社員別資格数（deleted_at IS NULL, SELECT employee_id, expiry_date）
CREATE INDEX IF NOT EXISTS idx_emp_qual_active_employee_expiry
    ON public.employee_qualifications (employee_id, expiry_date)
    WHERE deleted_at IS NULL;

-- ③ ダッシュボード資格アラート（deleted_at IS NULL, expiry_date IS NOT NULL, ORDER BY expiry_date）
CREATE INDEX IF NOT EXISTS idx_emp_qual_active_expiry_nonnull
    ON public.employee_qualifications (expiry_date ASC)
    WHERE deleted_at IS NULL AND expiry_date IS NOT NULL;

-- ④ 最新免状判定クエリ（certificate_number IS NOT NULL, deleted_at IS NULL）
CREATE INDEX IF NOT EXISTS idx_emp_qual_active_cert_number
    ON public.employee_qualifications (employee_id, certificate_number, acquired_date DESC, created_at DESC)
    WHERE deleted_at IS NULL AND certificate_number IS NOT NULL;
