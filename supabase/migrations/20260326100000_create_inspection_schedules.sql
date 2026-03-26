-- 点検スケジュール管理テーブル
-- 顧客物件の消防設備点検スケジュール（年2回の義務点検）

CREATE TABLE IF NOT EXISTS inspection_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_name TEXT NOT NULL,                -- 顧客名
    building_name TEXT NOT NULL,              -- 物件名
    address TEXT,                             -- 所在地
    inspection_type TEXT NOT NULL DEFAULT '総合点検', -- 総合点検 / 機器点検
    scheduled_date DATE NOT NULL,             -- 点検予定日
    completed_date DATE,                      -- 点検完了日
    assigned_employee_id UUID REFERENCES employees(id), -- 担当技術者
    status TEXT NOT NULL DEFAULT '未実施',     -- 未実施 / 実施済み / 延期
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_inspection_schedules_date ON inspection_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_inspection_schedules_employee ON inspection_schedules(assigned_employee_id);
