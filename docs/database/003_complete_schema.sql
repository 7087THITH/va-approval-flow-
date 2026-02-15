-- =====================================================
-- VA Proposal System — Complete Database Schema Summary
-- =====================================================
-- Database: PostgreSQL 15+
-- Schema: pud
-- Table Prefix: va_
-- Author: VA Workflow System
-- Last Updated: 2026-02-13
-- =====================================================
--
-- รันตามลำดับ:
--   1. docs/database/001_create_tables.sql     (ตารางหลัก)
--   2. docs/database/002_va_calculate_tables.sql (ตาราง VA Calculate)
--   3. docs/database/003_complete_schema.sql    (ตาราง Permission, R&D, Notifications)
--
-- =====================================================

SET search_path TO pud, public;

-- =====================================================
-- 1. ตาราง va_role_permissions — สิทธิ์ตาม Role
-- =====================================================
CREATE TABLE IF NOT EXISTS pud.va_role_permissions (
    id              SERIAL PRIMARY KEY,
    role            VARCHAR(50) UNIQUE NOT NULL
                    CHECK (role IN ('requester', 'approver', 'admin', 'procurement')),
    allowed_pages   JSONB NOT NULL DEFAULT '[]',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pud.va_role_permissions IS 'สิทธิ์การเข้าถึงหน้าต่างๆ ตาม Role';

-- Default permissions
INSERT INTO pud.va_role_permissions (role, allowed_pages) VALUES
    ('requester',   '["dashboard","create_proposal","batch_create","view_proposals","export","history"]'),
    ('approver',    '["dashboard","view_proposals","approve","export","history"]'),
    ('admin',       '["dashboard","create_proposal","batch_create","view_proposals","approve","admin","export","reports","projects","history"]'),
    ('procurement', '["dashboard","view_proposals","approve","export","reports","history"]')
ON CONFLICT (role) DO NOTHING;

-- =====================================================
-- 2. ตาราง va_user_permissions — สิทธิ์เฉพาะ User (Override)
-- =====================================================
CREATE TABLE IF NOT EXISTS pud.va_user_permissions (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES pud.va_users(id) ON DELETE CASCADE,
    allowed_pages   JSONB NOT NULL DEFAULT '[]',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

COMMENT ON TABLE pud.va_user_permissions IS 'สิทธิ์เฉพาะรายบุคคล (override จาก role)';

-- =====================================================
-- 3. ตาราง va_rd_assignments — R&D Center Dispatch
-- =====================================================
CREATE TABLE IF NOT EXISTS pud.va_rd_assignments (
    id              SERIAL PRIMARY KEY,
    proposal_id     INT NOT NULL REFERENCES pud.va_proposals(id) ON DELETE CASCADE,
    assigned_by     INT NOT NULL REFERENCES pud.va_users(id),
    teams           JSONB DEFAULT '[]',
    members         JSONB DEFAULT '[]',
    notes           TEXT,
    status          VARCHAR(20) DEFAULT 'assigned'
                    CHECK (status IN ('assigned', 'in_progress', 'completed')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pud.va_rd_assignments IS 'การมอบหมายงานจาก R&D Center ไปยังทีม R&D';

CREATE INDEX IF NOT EXISTS idx_va_rd_assignments_proposal ON pud.va_rd_assignments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_va_rd_assignments_by ON pud.va_rd_assignments(assigned_by);

-- =====================================================
-- 4. ตาราง va_notifications — การแจ้งเตือน
-- =====================================================
CREATE TABLE IF NOT EXISTS pud.va_notifications (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES pud.va_users(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL
                    CHECK (type IN ('approval_pending','approved','rejected','returned',
                                    'dispatched','revision','system')),
    title           VARCHAR(300) NOT NULL,
    title_th        VARCHAR(300),
    message         TEXT NOT NULL,
    message_th      TEXT,
    proposal_id     INT REFERENCES pud.va_proposals(id) ON DELETE SET NULL,
    proposal_no     VARCHAR(50),
    from_user_id    INT REFERENCES pud.va_users(id),
    from_user_name  VARCHAR(200),
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pud.va_notifications IS 'การแจ้งเตือนในระบบ';

CREATE INDEX IF NOT EXISTS idx_va_notifications_user ON pud.va_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_va_notifications_read ON pud.va_notifications(user_id, is_read);

-- =====================================================
-- 5. TRIGGER: อัพเดท updated_at อัตโนมัติ
-- =====================================================
CREATE TRIGGER trg_va_role_perms_updated
    BEFORE UPDATE ON pud.va_role_permissions
    FOR EACH ROW EXECUTE FUNCTION pud.update_updated_at();

CREATE TRIGGER trg_va_user_perms_updated
    BEFORE UPDATE ON pud.va_user_permissions
    FOR EACH ROW EXECUTE FUNCTION pud.update_updated_at();

CREATE TRIGGER trg_va_rd_assignments_updated
    BEFORE UPDATE ON pud.va_rd_assignments
    FOR EACH ROW EXECUTE FUNCTION pud.update_updated_at();

-- =====================================================
-- GRANT สิทธิ์
-- =====================================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA pud TO pud;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA pud TO pud;

-- =====================================================
-- สรุปตารางทั้งหมดในระบบ
-- =====================================================
-- รันคำสั่งนี้เพื่อตรวจสอบ:
-- SELECT table_name, table_type 
-- FROM information_schema.tables 
-- WHERE table_schema = 'pud' AND table_name LIKE 'va_%'
-- ORDER BY table_name;
--
-- ต้องเห็นตารางทั้งหมด 18 รายการ:
-- ─────────────────────────────────────
-- 001_create_tables.sql:
--   1.  va_departments
--   2.  va_users
--   3.  va_proposals
--   4.  va_attachments
--   5.  va_approval_routes
--   6.  va_approval_steps
--   7.  va_audit_log
--   8.  va_sessions
--
-- 002_va_calculate_tables.sql:
--   9.  va_calculate_settings
--   10. va_monthly_targets
--   11. va_monthly_results
--   12. va_credit_notes
--   13. va_calculation_items
--
-- 003_complete_schema.sql (ไฟล์นี้):
--   14. va_role_permissions
--   15. va_user_permissions
--   16. va_rd_assignments
--   17. va_notifications
--
-- Views:
--   V1. va_proposals_view
--   V2. va_pending_approvals_view
--   V3. va_monthly_summary_view
--   V4. va_credit_notes_view
--
-- Functions:
--   F1. generate_proposal_no()
--   F2. update_updated_at()
--   F3. recalculate_monthly_results(INT)
-- =====================================================
