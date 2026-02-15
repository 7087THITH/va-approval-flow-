-- =====================================================
-- VA Proposal System - Database Schema
-- Database: PostgreSQL
-- Schema: pud
-- Table Prefix: va_
-- =====================================================

-- ตรวจสอบว่า Schema pud มีอยู่แล้ว (ถ้าไม่มีจะสร้างให้)
CREATE SCHEMA IF NOT EXISTS pud;

-- ตั้ง search_path ให้ใช้ schema pud
SET search_path TO pud, public;

-- =====================================================
-- 1. ตาราง va_departments - แผนก/ฝ่าย
-- =====================================================
CREATE TABLE IF NOT EXISTS pud.va_departments (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(50) UNIQUE NOT NULL,
    name_en         VARCHAR(200) NOT NULL,
    name_th         VARCHAR(200),
    parent_id       INT REFERENCES pud.va_departments(id) ON DELETE SET NULL,
    level           VARCHAR(20) NOT NULL DEFAULT 'function'
                    CHECK (level IN ('function', 'division', 'group', 'subgroup')),
    sort_order      INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pud.va_departments IS 'โครงสร้างองค์กร - แผนก/ฝ่าย/กลุ่ม แบบ hierarchical';
COMMENT ON COLUMN pud.va_departments.level IS 'ระดับ: function > division > group > subgroup';

-- =====================================================
-- 2. ตาราง va_users - ผู้ใช้งาน
-- =====================================================
CREATE TABLE IF NOT EXISTS pud.va_users (
    id              SERIAL PRIMARY KEY,
    emp_code        VARCHAR(20) UNIQUE NOT NULL,
    email           VARCHAR(200) UNIQUE NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    first_name_th   VARCHAR(100),
    last_name_th    VARCHAR(100),
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'requester'
                    CHECK (role IN ('requester', 'approver', 'admin', 'procurement')),
    department_id   INT REFERENCES pud.va_departments(id) ON DELETE SET NULL,
    position        VARCHAR(200),
    telephone       VARCHAR(50),
    job_duty        VARCHAR(500),
    avatar_url      VARCHAR(500),
    is_active       BOOLEAN DEFAULT TRUE,
    last_login_at   TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pud.va_users IS 'ตารางผู้ใช้งานระบบ VA Proposal';

-- Index สำหรับค้นหาเร็วขึ้น
CREATE INDEX IF NOT EXISTS idx_va_users_email ON pud.va_users(email);
CREATE INDEX IF NOT EXISTS idx_va_users_emp_code ON pud.va_users(emp_code);
CREATE INDEX IF NOT EXISTS idx_va_users_department ON pud.va_users(department_id);

-- =====================================================
-- 3. ตาราง va_proposals - เอกสาร VA Proposal หลัก
-- =====================================================
CREATE TABLE IF NOT EXISTS pud.va_proposals (
    id              SERIAL PRIMARY KEY,
    proposal_no     VARCHAR(50) UNIQUE NOT NULL,
    confidentiality VARCHAR(20) NOT NULL DEFAULT 'internal'
                    CHECK (confidentiality IN ('secret', 'confidential', 'internal')),
    status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'revision', 'returned')),
    version         INT NOT NULL DEFAULT 1,
    previous_version_id INT REFERENCES pud.va_proposals(id) ON DELETE SET NULL,
    
    -- ข้อมูลผู้สร้าง
    requester_id    INT NOT NULL REFERENCES pud.va_users(id),
    department_id   INT REFERENCES pud.va_departments(id),
    plant           VARCHAR(200),
    division        VARCHAR(200),
    
    -- ข้อมูลชิ้นส่วน (Part Info)
    part_name       VARCHAR(300) NOT NULL,
    part_model      VARCHAR(200),
    related_drawing_no VARCHAR(200),
    supplier_manufacturer VARCHAR(300),
    
    -- ประเภทการเปลี่ยนแปลง (เก็บเป็น JSON array)
    change_types    JSONB DEFAULT '[]',
    
    -- กำหนดการ
    initial_production_date DATE,
    
    -- ต้นทุน
    before_cost     DECIMAL(15,2) DEFAULT 0,
    after_cost      DECIMAL(15,2) DEFAULT 0,
    cost_difference DECIMAL(15,2) GENERATED ALWAYS AS (after_cost - before_cost) STORED,
    volume_per_year INT DEFAULT 0,
    annual_contribution DECIMAL(15,2) GENERATED ALWAYS AS (
        CASE WHEN volume_per_year > 0 
             THEN (after_cost - before_cost) * volume_per_year / 1000 
             ELSE 0 
        END
    ) STORED,
    currency        VARCHAR(10) DEFAULT 'THB',
    
    -- รายการคำขอ (เก็บเป็น JSON array)
    request_contents JSONB DEFAULT '[]',
    
    -- การตัดสินใจ (Judgement)
    judgement        VARCHAR(30)
                     CHECK (judgement IN ('approve', 'go_to_evaluation', 'reject', 
                                          'request_to_dil', 'return', 'return_update')),
    judgement_reason  TEXT,
    
    -- รายชื่อผู้รับเอกสาร (Distribution)
    distribution_list JSONB DEFAULT '[]',
    distribution_notes TEXT,
    
    -- จัดซื้อ
    procurement_notes TEXT,
    procurement_confirmed BOOLEAN DEFAULT FALSE,
    procurement_confirmed_by INT REFERENCES pud.va_users(id),
    procurement_confirmed_at TIMESTAMP,
    
    -- หมายเหตุ
    notes           TEXT,
    
    -- Workflow
    current_step_index INT DEFAULT 0,
    
    -- Timestamp
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at    TIMESTAMP,
    completed_at    TIMESTAMP
);

COMMENT ON TABLE pud.va_proposals IS 'เอกสาร VA Proposal หลัก';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_va_proposals_status ON pud.va_proposals(status);
CREATE INDEX IF NOT EXISTS idx_va_proposals_requester ON pud.va_proposals(requester_id);
CREATE INDEX IF NOT EXISTS idx_va_proposals_proposal_no ON pud.va_proposals(proposal_no);
CREATE INDEX IF NOT EXISTS idx_va_proposals_created_at ON pud.va_proposals(created_at DESC);

-- =====================================================
-- 4. ตาราง va_proposal_no_seq - ลำดับเลขเอกสาร
-- =====================================================
CREATE SEQUENCE IF NOT EXISTS pud.va_proposal_no_seq START WITH 1 INCREMENT BY 1;

-- ฟังก์ชันสร้างเลขเอกสารอัตโนมัติ
CREATE OR REPLACE FUNCTION pud.generate_proposal_no()
RETURNS VARCHAR(50) AS $$
DECLARE
    v_year INT;
    v_seq INT;
    v_proposal_no VARCHAR(50);
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE);
    v_seq := nextval('pud.va_proposal_no_seq');
    v_proposal_no := 'VA-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
    RETURN v_proposal_no;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION pud.generate_proposal_no() IS 'สร้างเลขเอกสาร VA อัตโนมัติ เช่น VA-2026-0001';

-- =====================================================
-- 5. ตาราง va_attachments - ไฟล์แนบ
-- =====================================================
CREATE TABLE IF NOT EXISTS pud.va_attachments (
    id              SERIAL PRIMARY KEY,
    proposal_id     INT NOT NULL REFERENCES pud.va_proposals(id) ON DELETE CASCADE,
    file_name       VARCHAR(500) NOT NULL,
    file_type       VARCHAR(100),
    file_size       BIGINT DEFAULT 0,
    file_path       VARCHAR(1000) NOT NULL,
    file_category   VARCHAR(50) DEFAULT 'attachment'
                    CHECK (file_category IN ('attachment', 'part_image_current', 'part_image_improved')),
    uploaded_by     INT REFERENCES pud.va_users(id),
    uploaded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pud.va_attachments IS 'ไฟล์แนบของเอกสาร VA - รวมรูป Part ปัจจุบันและ Improved';

CREATE INDEX IF NOT EXISTS idx_va_attachments_proposal ON pud.va_attachments(proposal_id);

-- =====================================================
-- 6. ตาราง va_approval_routes - เส้นทางการอนุมัติ
-- =====================================================
CREATE TABLE IF NOT EXISTS pud.va_approval_routes (
    id              SERIAL PRIMARY KEY,
    proposal_id     INT NOT NULL REFERENCES pud.va_proposals(id) ON DELETE CASCADE,
    route_type      VARCHAR(20) NOT NULL DEFAULT 'sequential'
                    CHECK (route_type IN ('sequential', 'parallel')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pud.va_approval_routes IS 'เส้นทางการอนุมัติของเอกสาร VA';

CREATE INDEX IF NOT EXISTS idx_va_approval_routes_proposal ON pud.va_approval_routes(proposal_id);

-- =====================================================
-- 7. ตาราง va_approval_steps - ขั้นตอนการอนุมัติ
-- =====================================================
CREATE TABLE IF NOT EXISTS pud.va_approval_steps (
    id              SERIAL PRIMARY KEY,
    route_id        INT NOT NULL REFERENCES pud.va_approval_routes(id) ON DELETE CASCADE,
    step_order      INT NOT NULL,
    approver_id     INT NOT NULL REFERENCES pud.va_users(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
    judgement       VARCHAR(30)
                    CHECK (judgement IN ('approve', 'go_to_evaluation', 'reject', 
                                        'request_to_dil', 'return', 'return_update')),
    comment         TEXT,
    action_at       TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pud.va_approval_steps IS 'ขั้นตอนการอนุมัติแต่ละ step';

CREATE INDEX IF NOT EXISTS idx_va_approval_steps_route ON pud.va_approval_steps(route_id);
CREATE INDEX IF NOT EXISTS idx_va_approval_steps_approver ON pud.va_approval_steps(approver_id);

-- =====================================================
-- 8. ตาราง va_audit_log - ประวัติการดำเนินการ
-- =====================================================
CREATE TABLE IF NOT EXISTS pud.va_audit_log (
    id              SERIAL PRIMARY KEY,
    proposal_id     INT NOT NULL REFERENCES pud.va_proposals(id) ON DELETE CASCADE,
    user_id         INT REFERENCES pud.va_users(id),
    action          VARCHAR(200) NOT NULL,
    details         TEXT,
    previous_value  TEXT,
    new_value       TEXT,
    ip_address      VARCHAR(50),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pud.va_audit_log IS 'ประวัติการดำเนินการทั้งหมดของเอกสาร VA';

CREATE INDEX IF NOT EXISTS idx_va_audit_log_proposal ON pud.va_audit_log(proposal_id);
CREATE INDEX IF NOT EXISTS idx_va_audit_log_user ON pud.va_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_va_audit_log_created ON pud.va_audit_log(created_at DESC);

-- =====================================================
-- 9. ตาราง va_sessions - จัดการ session login
-- =====================================================
CREATE TABLE IF NOT EXISTS pud.va_sessions (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES pud.va_users(id) ON DELETE CASCADE,
    token           VARCHAR(500) UNIQUE NOT NULL,
    expires_at      TIMESTAMP NOT NULL,
    ip_address      VARCHAR(50),
    user_agent      TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pud.va_sessions IS 'จัดการ session การ login ของผู้ใช้';

CREATE INDEX IF NOT EXISTS idx_va_sessions_token ON pud.va_sessions(token);
CREATE INDEX IF NOT EXISTS idx_va_sessions_user ON pud.va_sessions(user_id);

-- =====================================================
-- 10. TRIGGER: อัพเดท updated_at อัตโนมัติ
-- =====================================================
CREATE OR REPLACE FUNCTION pud.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER trg_va_users_updated
    BEFORE UPDATE ON pud.va_users
    FOR EACH ROW EXECUTE FUNCTION pud.update_updated_at();

CREATE TRIGGER trg_va_proposals_updated
    BEFORE UPDATE ON pud.va_proposals
    FOR EACH ROW EXECUTE FUNCTION pud.update_updated_at();

CREATE TRIGGER trg_va_departments_updated
    BEFORE UPDATE ON pud.va_departments
    FOR EACH ROW EXECUTE FUNCTION pud.update_updated_at();

-- =====================================================
-- 11. INSERT ข้อมูลโครงสร้างองค์กรเริ่มต้น
-- =====================================================

-- Level 1: Functions
INSERT INTO pud.va_departments (code, name_en, level, sort_order) VALUES
('SCM', 'SUPPLY CHAIN MANAGEMENT FUNCTION', 'function', 1),
('RRD', 'REGIONAL RESEARCH & DEVELOPMENT FUNCTION', 'function', 2)
ON CONFLICT (code) DO NOTHING;

-- Level 2: Divisions under SCM
INSERT INTO pud.va_departments (code, name_en, level, parent_id, sort_order) VALUES
('PPD', 'PARTS PROCUREMENT DIVISION', 'division', 
    (SELECT id FROM pud.va_departments WHERE code = 'SCM'), 1)
ON CONFLICT (code) DO NOTHING;

-- Level 2: Divisions under RRD
INSERT INTO pud.va_departments (code, name_en, level, parent_id, sort_order) VALUES
('QCD', 'QUALITY CONTROL DIVISION', 'division', 
    (SELECT id FROM pud.va_departments WHERE code = 'RRD'), 1),
('RDD', 'RESEARCH & DEVELOPMENT DIVISION', 'division', 
    (SELECT id FROM pud.va_departments WHERE code = 'RRD'), 2)
ON CONFLICT (code) DO NOTHING;

-- Level 3: Groups under PARTS PROCUREMENT DIVISION
INSERT INTO pud.va_departments (code, name_en, level, parent_id, sort_order) VALUES
('NMG', 'NEW MODEL GROUP', 'group', 
    (SELECT id FROM pud.va_departments WHERE code = 'PPD'), 1),
('PP1G', 'PARTS PROCUREMENT 1 GROUP', 'group', 
    (SELECT id FROM pud.va_departments WHERE code = 'PPD'), 2),
('PP2G', 'PARTS PROCUREMENT 2 GROUP', 'group', 
    (SELECT id FROM pud.va_departments WHERE code = 'PPD'), 3),
('PP3G', 'PARTS PROCUREMENT 3 GROUP', 'group', 
    (SELECT id FROM pud.va_departments WHERE code = 'PPD'), 4),
('PSG', 'PROCUREMENT STRATEGY GROUP', 'group', 
    (SELECT id FROM pud.va_departments WHERE code = 'PPD'), 5),
('SPCG', 'SUSTAINABLE PROCUREMENT CONTROL GROUP', 'group', 
    (SELECT id FROM pud.va_departments WHERE code = 'PPD'), 6)
ON CONFLICT (code) DO NOTHING;

-- Level 3: Groups under R&D DIVISION
INSERT INTO pud.va_departments (code, name_en, level, parent_id, sort_order) VALUES
('DCG', 'DEVELOPMENT CENTER GROUP', 'group', 
    (SELECT id FROM pud.va_departments WHERE code = 'RDD'), 1),
('DCIP', 'DEVELOPMENT COMPLIANCE & INTELLECTUAL PROPERTY CONTROL GROUP', 'group', 
    (SELECT id FROM pud.va_departments WHERE code = 'RDD'), 2),
('DCPG', 'DEVELOPMENT OF COMMERCIAL PRODUCT GROUP', 'group', 
    (SELECT id FROM pud.va_departments WHERE code = 'RDD'), 3),
('DCEG', 'DEVELOPMENT OF COMPREHENSIVE ENGINEERING GROUP', 'group', 
    (SELECT id FROM pud.va_departments WHERE code = 'RDD'), 4),
('DDG', 'DEVELOPMENT OF DEVICE GROUP', 'group', 
    (SELECT id FROM pud.va_departments WHERE code = 'RDD'), 5),
('DNTG', 'DEVELOPMENT OF NEW TECHNOLOGY GROUP', 'group', 
    (SELECT id FROM pud.va_departments WHERE code = 'RDD'), 6),
('DPRG', 'DEVELOPMENT OF PRODUCT RELIABILITY GROUP', 'group', 
    (SELECT id FROM pud.va_departments WHERE code = 'RDD'), 7),
('DRPG', 'DEVELOPMENT OF RESIDENTIAL PRODUCT GROUP', 'group', 
    (SELECT id FROM pud.va_departments WHERE code = 'RDD'), 8),
('DPPG', 'DEVELOPMENT PRODUCT PLANNING GROUP', 'group', 
    (SELECT id FROM pud.va_departments WHERE code = 'RDD'), 9)
ON CONFLICT (code) DO NOTHING;

-- Level 4: Sub-groups
INSERT INTO pud.va_departments (code, name_en, level, parent_id, sort_order) VALUES
('NMSG', 'NEW MODEL SUB-GROUP', 'subgroup', 
    (SELECT id FROM pud.va_departments WHERE code = 'NMG'), 1),
('PP1SG', 'PARTS PROCUREMENT 1 SUB-GROUP', 'subgroup', 
    (SELECT id FROM pud.va_departments WHERE code = 'PP1G'), 1),
('PP2SG', 'PARTS PROCUREMENT 2 SUB-GROUP', 'subgroup', 
    (SELECT id FROM pud.va_departments WHERE code = 'PP2G'), 1),
('PP3SG', 'PARTS PROCUREMENT 3 SUB-GROUP', 'subgroup', 
    (SELECT id FROM pud.va_departments WHERE code = 'PP3G'), 1),
('PSSG', 'PROCUREMENT STRATEGY SUB-GROUP', 'subgroup', 
    (SELECT id FROM pud.va_departments WHERE code = 'PSG'), 1),
('PCSG', 'PROCUREMENT COLLABORATION SUB-GROUP', 'subgroup', 
    (SELECT id FROM pud.va_departments WHERE code = 'SPCG'), 1),
('SPC1SG', 'SUSTAINABLE PROCUREMENT CONTROL 1 SUB-GROUP', 'subgroup', 
    (SELECT id FROM pud.va_departments WHERE code = 'SPCG'), 2),
('SPC2G', 'SUSTAINABLE PROCUREMENT CONTROL 2 GROUP', 'subgroup', 
    (SELECT id FROM pud.va_departments WHERE code = 'SPCG'), 3)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 12. VIEW: สรุปข้อมูล Proposal พร้อมผู้สร้าง
-- =====================================================
CREATE OR REPLACE VIEW pud.va_proposals_view AS
SELECT 
    p.id,
    p.proposal_no,
    p.confidentiality,
    p.status,
    p.part_name,
    p.part_model,
    p.before_cost,
    p.after_cost,
    p.cost_difference,
    p.volume_per_year,
    p.annual_contribution,
    p.currency,
    p.current_step_index,
    p.version,
    p.created_at,
    p.updated_at,
    p.submitted_at,
    u.emp_code AS requester_emp_code,
    u.first_name || ' ' || u.last_name AS requester_name,
    u.email AS requester_email,
    d.name_en AS department_name,
    p.plant
FROM pud.va_proposals p
LEFT JOIN pud.va_users u ON p.requester_id = u.id
LEFT JOIN pud.va_departments d ON p.department_id = d.id;

-- =====================================================
-- 13. VIEW: สรุป Pending Approvals ของแต่ละคน
-- =====================================================
CREATE OR REPLACE VIEW pud.va_pending_approvals_view AS
SELECT 
    s.approver_id,
    au.first_name || ' ' || au.last_name AS approver_name,
    p.id AS proposal_id,
    p.proposal_no,
    p.part_name,
    p.status AS proposal_status,
    s.step_order,
    s.status AS step_status,
    p.created_at AS proposal_created_at,
    ru.first_name || ' ' || ru.last_name AS requester_name
FROM pud.va_approval_steps s
JOIN pud.va_approval_routes r ON s.route_id = r.id
JOIN pud.va_proposals p ON r.proposal_id = p.id
LEFT JOIN pud.va_users au ON s.approver_id = au.id
LEFT JOIN pud.va_users ru ON p.requester_id = ru.id
WHERE s.status = 'pending' AND p.status = 'pending';

-- =====================================================
-- สร้าง Admin User เริ่มต้น (password: admin123)
-- =====================================================
-- หมายเหตุ: ในระบบจริงต้องใช้ bcrypt hash
INSERT INTO pud.va_users (emp_code, email, first_name, last_name, password_hash, role) VALUES
('ADMIN001', 'admin@daikin.com', 'System', 'Admin', 
 '$2b$10$placeholder_hash_replace_with_real_bcrypt', 'admin')
ON CONFLICT (emp_code) DO NOTHING;

-- =====================================================
-- GRANT สิทธิ์ให้ user pud
-- =====================================================
GRANT USAGE ON SCHEMA pud TO pud;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA pud TO pud;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA pud TO pud;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pud TO pud;

-- =====================================================
-- เสร็จสิ้น! ตรวจสอบตารางที่สร้าง
-- =====================================================
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'pud' AND table_name LIKE 'va_%'
ORDER BY table_name;
