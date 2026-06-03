-- 協力会社台帳の追加項目:
--   ① 経験年数（基準日時点の値を保存し、表示時に4月1日基準で自動加算）
--   ② 健康診断の血圧（最高/最低）
--   ③ 社会保険の加入状況・名称
-- 既存の未使用カラム health_insurance_type / pension_type を
-- 「加入している健康保険/年金の名称」として利用する。

-- ① 経験年数
alter table public.employees
    add column if not exists experience_years integer,
    add column if not exists experience_months integer,
    add column if not exists experience_base_date date;

comment on column public.employees.experience_years is '経験年数（基準日時点の年数）';
comment on column public.employees.experience_months is '経験年数（基準日時点の月数 0-11）';
comment on column public.employees.experience_base_date is '経験年数の基準日（通常は年度開始の4月1日）';

-- ③ 社会保険の加入状況・名称
alter table public.employees
    add column if not exists pension_enrolled boolean,
    add column if not exists emp_insurance_enrolled boolean;

comment on column public.employees.pension_enrolled is '年金 加入の有無';
comment on column public.employees.emp_insurance_enrolled is '雇用保険 加入の有無';
comment on column public.employees.health_insurance_type is '加入している健康保険の名称';
comment on column public.employees.pension_type is '加入している年金の名称';

-- ② 健康診断の血圧（最高/最低）
alter table public.health_checks
    add column if not exists blood_pressure_systolic integer,
    add column if not exists blood_pressure_diastolic integer;

comment on column public.health_checks.blood_pressure_systolic is '最高血圧 (収縮期, mmHg)';
comment on column public.health_checks.blood_pressure_diastolic is '最低血圧 (拡張期, mmHg)';
