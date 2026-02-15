-- =====================================================
-- VA Calculate System - Database Schema
-- เพิ่มตารางสำหรับระบบ VA Calculate
-- Database: PostgreSQL
-- Schema: pud
-- =====================================================

SET search_path TO pud, public;

-- =====================================================
-- 1. ตาราง va_calculate_settings - ตั้งค่า FY
-- =====================================================
CREATE TABLE IF NOT EXISTS pud.va_calculate_settings (
    id              SERIAL PRIMARY KEY,
    fiscal_year     VARCHAR(20) UNIQUE NOT NULL,
    cd_goal         DECIMAL(15,2) NOT NULL DEFAULT 0,
    exchange_rate   DECIMAL(10,4) NOT NULL DEFAULT 35.50,
    cif_percent     DECIMAL(5,2) NOT NULL DEFAULT 1.25,
    fob_percent     DECIMAL(5,2) NOT NULL DEFAULT 3.50,
    currency        VARCHAR(10) NOT NULL DEFAULT 'THB',
    start_date      DATE NOT NULL,                         -- ปีงบเริ่ม (e.g., 2024-04-01)
    end_date        DATE NOT NULL,                         -- ปีงบจบ (e.g., 2025-03-31)
    is_active       BOOLEAN DEFAULT FALSE,
    created_by      INT REFERENCES pud.va_users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pud.va_calculate_settings IS 'ตั้งค่า VA Calculate ประจำปีงบประมาณ (CD Goal, Exchange Rate, CIF/FOB)';

CREATE INDEX IF NOT EXISTS idx_va_calc_settings_fy ON pud.va_calculate_settings(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_va_calc_settings_active ON pud.va_calculate_settings(is_active);

-- =====================================================
-- 2. ตาราง va_monthly_targets - เป้าหมายรายเดือน
-- =====================================================
CREATE TABLE IF NOT EXISTS pud.va_monthly_targets (
    id              SERIAL PRIMARY KEY,
    setting_id      INT NOT NULL REFERENCES pud.va_calculate_settings(id) ON DELETE CASCADE,
    month_year      VARCHAR(10) NOT NULL,                  -- e.g., 'Apr-24'
    month_index     INT NOT NULL CHECK (month_index BETWEEN 1 AND 12),  -- 1=Apr, 12=Mar
    estimate_cd_target   DECIMAL(15,2) DEFAULT 0,
    target_cd            DECIMAL(15,2) DEFAULT 0,
    included_new_idea    DECIMAL(15,2) DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(setting_id, month_index)
);

COMMENT ON TABLE pud.va_monthly_targets IS 'เป้าหมาย CD Target รายเดือนของแต่ละปีงบประมาณ';

CREATE INDEX IF NOT EXISTS idx_va_monthly_targets_setting ON pud.va_monthly_targets(setting_id);

-- =====================================================
-- 3. ตาราง va_monthly_results - ผลจริงรายเดือน
-- =====================================================
CREATE TABLE IF NOT EXISTS pud.va_monthly_results (
    id              SERIAL PRIMARY KEY,
    setting_id      INT NOT NULL REFERENCES pud.va_calculate_settings(id) ON DELETE CASCADE,
    month_year      VARCHAR(10) NOT NULL,
    month_index     INT NOT NULL CHECK (month_index BETWEEN 1 AND 12),
    total_cd_by_month       DECIMAL(15,2) DEFAULT 0,       -- CD จริงของเดือนนั้น
    total_cd_accumulate     DECIMAL(15,2) DEFAULT 0,       -- CD สะสม
    estimate_accum_cd_result DECIMAL(15,2) DEFAULT 0,      -- ประมาณการ CD สะสม
    updated_by      INT REFERENCES pud.va_users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(setting_id, month_index)
);

COMMENT ON TABLE pud.va_monthly_results IS 'ผลลัพธ์ CD จริงรายเดือน (คำนวณจาก proposals ที่ approved)';

CREATE INDEX IF NOT EXISTS idx_va_monthly_results_setting ON pud.va_monthly_results(setting_id);

-- =====================================================
-- 4. ตาราง va_credit_notes - Credit Note (CN)
-- =====================================================
CREATE TABLE IF NOT EXISTS pud.va_credit_notes (
    id              SERIAL PRIMARY KEY,
    proposal_id     INT REFERENCES pud.va_proposals(id) ON DELETE SET NULL,
    va_no           VARCHAR(50) NOT NULL,
    va_theme        TEXT NOT NULL,
    rank            VARCHAR(1) NOT NULL CHECK (rank IN ('A', 'B', 'C')),
    apply_month_target    VARCHAR(10),
    apply_month_actual    VARCHAR(10),
    costdown_target       DECIMAL(15,2) DEFAULT 0,
    costdown_actual       DECIMAL(15,2) DEFAULT 0,
    costdown_actual_cds   DECIMAL(15,2) DEFAULT 0,
    costdown_actual_buyer DECIMAL(15,2) DEFAULT 0,
    dcs_no          VARCHAR(100),
    dcs_class       VARCHAR(50),
    buyer_name      VARCHAR(200),
    va_type         VARCHAR(100),
    create_idea_by  VARCHAR(100),
    cn_status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (cn_status IN ('issued', 'pending', 'cancelled')),
    cn_issued_date  DATE,
    cn_number       VARCHAR(100),
    notes           TEXT,
    created_by      INT REFERENCES pud.va_users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pud.va_credit_notes IS 'Credit Note (CN) tracking สำหรับ VA Calculate';

CREATE INDEX IF NOT EXISTS idx_va_credit_notes_proposal ON pud.va_credit_notes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_va_credit_notes_va_no ON pud.va_credit_notes(va_no);
CREATE INDEX IF NOT EXISTS idx_va_credit_notes_status ON pud.va_credit_notes(cn_status);

-- =====================================================
-- 5. ตาราง va_calculation_items - รายการคำนวณ VA
-- =====================================================
CREATE TABLE IF NOT EXISTS pud.va_calculation_items (
    id              SERIAL PRIMARY KEY,
    proposal_id     INT REFERENCES pud.va_proposals(id) ON DELETE SET NULL,
    setting_id      INT REFERENCES pud.va_calculate_settings(id) ON DELETE CASCADE,
    va_no           VARCHAR(50) NOT NULL,
    part_category   VARCHAR(100),
    supplier_name   VARCHAR(300),
    drawing_part    VARCHAR(200),
    buyer_name      VARCHAR(200),
    part_name       VARCHAR(300),
    va_theme        TEXT,
    exchange_rate   DECIMAL(10,4) DEFAULT 35.50,
    before_cost     DECIMAL(15,2) DEFAULT 0,
    after_cost      DECIMAL(15,2) DEFAULT 0,
    costdown_per_unit DECIMAL(15,2) GENERATED ALWAYS AS (before_cost - after_cost) STORED,
    volume_per_year   INT DEFAULT 0,
    costdown_per_year DECIMAL(15,2) GENERATED ALWAYS AS (
        (before_cost - after_cost) * volume_per_year
    ) STORED,
    apply_month     VARCHAR(10),
    apply_date      DATE,
    rank            VARCHAR(1) NOT NULL DEFAULT 'C' CHECK (rank IN ('A', 'B', 'C')),
    item_group      VARCHAR(100) DEFAULT 'General model',
    created_by      INT REFERENCES pud.va_users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pud.va_calculation_items IS 'รายการคำนวณ VA แต่ละรายการ (ดึงมาจาก proposals ที่ approved)';

CREATE INDEX IF NOT EXISTS idx_va_calc_items_proposal ON pud.va_calculation_items(proposal_id);
CREATE INDEX IF NOT EXISTS idx_va_calc_items_setting ON pud.va_calculation_items(setting_id);
CREATE INDEX IF NOT EXISTS idx_va_calc_items_apply ON pud.va_calculation_items(apply_month);

-- =====================================================
-- 6. TRIGGER: อัพเดท updated_at อัตโนมัติ
-- =====================================================
CREATE TRIGGER trg_va_calc_settings_updated
    BEFORE UPDATE ON pud.va_calculate_settings
    FOR EACH ROW EXECUTE FUNCTION pud.update_updated_at();

CREATE TRIGGER trg_va_monthly_targets_updated
    BEFORE UPDATE ON pud.va_monthly_targets
    FOR EACH ROW EXECUTE FUNCTION pud.update_updated_at();

CREATE TRIGGER trg_va_monthly_results_updated
    BEFORE UPDATE ON pud.va_monthly_results
    FOR EACH ROW EXECUTE FUNCTION pud.update_updated_at();

CREATE TRIGGER trg_va_credit_notes_updated
    BEFORE UPDATE ON pud.va_credit_notes
    FOR EACH ROW EXECUTE FUNCTION pud.update_updated_at();

CREATE TRIGGER trg_va_calc_items_updated
    BEFORE UPDATE ON pud.va_calculation_items
    FOR EACH ROW EXECUTE FUNCTION pud.update_updated_at();

-- =====================================================
-- 7. VIEW: สรุป Monthly CD (Target + Actual)
-- =====================================================
CREATE OR REPLACE VIEW pud.va_monthly_summary_view AS
SELECT 
    s.fiscal_year,
    s.cd_goal,
    t.month_year,
    t.month_index,
    t.estimate_cd_target,
    t.target_cd,
    t.included_new_idea,
    COALESCE(r.total_cd_by_month, 0) AS total_cd_by_month,
    COALESCE(r.total_cd_accumulate, 0) AS total_cd_accumulate,
    COALESCE(r.estimate_accum_cd_result, 0) AS estimate_accum_cd_result,
    CASE WHEN s.cd_goal > 0 
         THEN ROUND((COALESCE(r.total_cd_accumulate, 0) / s.cd_goal * 100)::numeric, 1)
         ELSE 0 
    END AS achievement_percent
FROM pud.va_monthly_targets t
JOIN pud.va_calculate_settings s ON s.id = t.setting_id
LEFT JOIN pud.va_monthly_results r ON r.setting_id = t.setting_id AND r.month_index = t.month_index
ORDER BY s.fiscal_year, t.month_index;

COMMENT ON VIEW pud.va_monthly_summary_view IS 'สรุปข้อมูล Monthly CD Target + Actual รวมกัน';

-- =====================================================
-- 8. VIEW: สรุป Credit Note
-- =====================================================
CREATE OR REPLACE VIEW pud.va_credit_notes_view AS
SELECT 
    cn.*,
    s.fiscal_year,
    p.proposal_no,
    p.part_name,
    p.supplier_manufacturer
FROM pud.va_credit_notes cn
LEFT JOIN pud.va_proposals p ON p.id = cn.proposal_id
LEFT JOIN pud.va_calculate_settings s ON s.is_active = TRUE
ORDER BY cn.created_at DESC;

COMMENT ON VIEW pud.va_credit_notes_view IS 'Credit Note พร้อมข้อมูล Proposal';

-- =====================================================
-- 9. ฟังก์ชัน: คำนวณ Monthly CD จาก VA Items ที่ approved
-- =====================================================
CREATE OR REPLACE FUNCTION pud.recalculate_monthly_results(p_setting_id INT)
RETURNS VOID AS $$
DECLARE
    v_month RECORD;
    v_cd_accumulate DECIMAL(15,2) := 0;
    v_month_total DECIMAL(15,2);
BEGIN
    -- วนลูปแต่ละเดือนของ FY
    FOR v_month IN 
        SELECT month_index, month_year 
        FROM pud.va_monthly_targets 
        WHERE setting_id = p_setting_id 
        ORDER BY month_index
    LOOP
        -- คำนวณ CD ของเดือนนั้นจาก va_calculation_items
        SELECT COALESCE(SUM(costdown_per_year), 0)
        INTO v_month_total
        FROM pud.va_calculation_items
        WHERE setting_id = p_setting_id 
        AND apply_month = v_month.month_year;
        
        v_cd_accumulate := v_cd_accumulate + v_month_total;
        
        -- Upsert ผลลัพธ์
        INSERT INTO pud.va_monthly_results (setting_id, month_year, month_index, total_cd_by_month, total_cd_accumulate)
        VALUES (p_setting_id, v_month.month_year, v_month.month_index, v_month_total, v_cd_accumulate)
        ON CONFLICT (setting_id, month_index) 
        DO UPDATE SET 
            total_cd_by_month = EXCLUDED.total_cd_by_month,
            total_cd_accumulate = EXCLUDED.total_cd_accumulate,
            updated_at = CURRENT_TIMESTAMP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION pud.recalculate_monthly_results(INT) IS 'คำนวณผลรวม CD รายเดือน จาก VA calculation items ทั้งหมด';

-- =====================================================
-- 10. INSERT ข้อมูลเริ่มต้น (Demo Data)
-- =====================================================

-- FY Settings
INSERT INTO pud.va_calculate_settings (fiscal_year, cd_goal, exchange_rate, cif_percent, fob_percent, currency, start_date, end_date, is_active) VALUES
('OB2024', 162000000, 35.50, 1.25, 3.50, 'THB', '2024-04-01', '2025-03-31', TRUE),
('RB2023', 220000000, 35.50, 1.25, 3.50, 'THB', '2023-04-01', '2024-03-31', FALSE)
ON CONFLICT (fiscal_year) DO NOTHING;
