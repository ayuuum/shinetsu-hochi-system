-- 不足テーブル追加: alert_logs, construction_records, health_checks, alcohol_checks
-- TypeScript型定義(supabase.ts)と同期させるためのマイグレーション

-- 1. アラートログ
CREATE TABLE IF NOT EXISTS alert_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,                    -- 資格/車検/健康診断 等
    alert_level TEXT,                          -- info/warning/urgent/danger
    target_id UUID NOT NULL,                   -- 対象レコードID
    target_name TEXT,                          -- 表示用名称
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    expiry_date DATE,                          -- 期限日
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alert_logs_level_resolved ON alert_logs(alert_level, is_resolved);
CREATE INDEX idx_alert_logs_employee ON alert_logs(employee_id);

-- 2. 施工実績
CREATE TABLE IF NOT EXISTS construction_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    construction_name TEXT NOT NULL,            -- 物件名
    construction_date DATE NOT NULL,            -- 施工日
    category TEXT,                              -- 設備種別（消防/セキュリティ/通信）
    role TEXT,                                  -- 担当役割
    location TEXT,                              -- 物件所在地
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_construction_employee ON construction_records(employee_id);

-- 3. 健康診断記録
CREATE TABLE IF NOT EXISTS health_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    check_date DATE NOT NULL,                   -- 受診日
    check_type TEXT,                            -- 定期/特殊/雇入時
    hospital_name TEXT,                         -- 健診機関名
    is_normal BOOLEAN DEFAULT true,             -- 異常なし/要再検査
    height DECIMAL,                             -- 身長
    weight DECIMAL,                             -- 体重
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_health_checks_employee ON health_checks(employee_id);

-- 4. アルコールチェック記録
CREATE TABLE IF NOT EXISTS alcohol_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    check_type TEXT,                            -- 出勤時/退勤時
    check_datetime TIMESTAMP WITH TIME ZONE,    -- 検査日時
    checker_id UUID REFERENCES employees(id),   -- 確認者（安全運転管理者）
    measured_value DECIMAL,                     -- 検知器の値 (mg/L)
    is_abnormal BOOLEAN DEFAULT false,          -- 不適正フラグ
    location TEXT,                              -- 検査場所
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alcohol_checks_employee ON alcohol_checks(employee_id);
CREATE INDEX idx_alcohol_checks_datetime ON alcohol_checks(check_datetime);

-- 5. 既存テーブルの不足インデックス追加
CREATE INDEX IF NOT EXISTS idx_eq_expiry ON employee_qualifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_eq_employee_qual ON employee_qualifications(employee_id, qualification_id);
CREATE INDEX IF NOT EXISTS idx_employees_branch ON employees(branch);
