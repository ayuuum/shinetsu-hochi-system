-- 信越報知 社員・資格管理システム 初期スキーマ
-- Excel雛形（従業員ごと名簿 2.xlsx）に基づく設計

-- 1. 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. テーブル定義: 社員基本・就業情報
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_number TEXT UNIQUE NOT NULL, -- 社員番号
    name TEXT NOT NULL,                  -- 名前
    name_kana TEXT NOT NULL,             -- フリガナ
    birth_date DATE NOT NULL,            -- 生年月日
    blood_type TEXT,                     -- 血液型
    address TEXT,                        -- 住所
    phone_number TEXT,                   -- 電話番号
    gender TEXT,                         -- 性別
    photo_url TEXT,                      -- 顔写真パス
    
    -- 雇用・経歴
    hire_date DATE,                      -- 入社日
    termination_date DATE,               -- 退職日
    employment_type TEXT,                -- 雇用形態（正社員/パート等）
    branch TEXT,                         -- 所属（本社/塩尻/白馬）
    job_title TEXT,                      -- 職種
    position TEXT,                       -- 役職
    
    -- 保険番号
    emp_insurance_no TEXT,               -- 雇用保険番号
    health_insurance_no TEXT,            -- 保険証番号
    pension_no TEXT,                     -- 厚生年金番号
    mutual_aid_no TEXT,                  -- 共済会会員番号
    
    -- 就業・賃金
    work_time_detail TEXT,               -- 就業時間
    wage_type TEXT,                      -- 賃金形態
    salary_increase_notes TEXT,          -- 昇給
    allowances TEXT,                     -- 手当
    
    -- 通勤
    commute_distance DECIMAL,            -- 通勤距離 (km)
    commute_time INTEGER,                 -- 通勤時間 (分)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 家族・緊急連絡先
CREATE TABLE employee_family (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                  -- 名前
    relationship TEXT,                   -- 続柄
    birth_date DATE,                     -- 生年月日
    is_dependent BOOLEAN DEFAULT false,  -- 扶養
    has_disability BOOLEAN DEFAULT false, -- 障がい
    is_emergency_contact BOOLEAN DEFAULT false, -- 緊急連絡先フラグ
    address TEXT,                        -- 住所
    phone_number TEXT,                   -- 電話番号
    blood_type TEXT,                     -- 血液型
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 資格種別マスタ
CREATE TABLE qualification_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,           -- 資格名
    category TEXT,                       -- カテゴリ（消防設備/電気/等）
    renewal_rule TEXT,                   -- 更新ルール説明
    has_expiry BOOLEAN DEFAULT true,     -- 期限ありか
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 社員保有資格
CREATE TABLE employee_qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    qualification_id UUID REFERENCES qualification_master(id),
    acquired_date DATE,                  -- 取得日
    expiry_date DATE,                    -- 有効期限（次回講習期限）
    photo_renewal_date DATE,             -- 免状写真更新期限（10年）
    certificate_number TEXT,             -- 証書番号
    issuing_authority TEXT,              -- 交付者
    image_url TEXT,                      -- 証書画像パス
    status TEXT DEFAULT '未着手',         -- 申込・受講ステータス
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 車両管理
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number TEXT UNIQUE NOT NULL,   -- ナンバー
    vehicle_name TEXT,                   -- 車名
    primary_user_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    inspection_expiry DATE,              -- 車検満了日
    liability_insurance_expiry DATE,     -- 自賠責満期
    voluntary_insurance_expiry DATE,     -- 任意保険満期
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
