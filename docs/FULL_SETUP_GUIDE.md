# 📘 คู่มือการติดตั้งและใช้งาน VA Workflow System ฉบับสมบูรณ์

> **ครอบคลุม**: Database Setup (DBeaver) → Backend API (Node.js) → Frontend เชื่อมต่อ → Deploy Public URL → ใช้งานจริง

---

## 📋 สารบัญ

1. [ภาพรวมระบบ](#1-ภาพรวมระบบ)
2. [สิ่งที่ต้องเตรียม (Prerequisites)](#2-สิ่งที่ต้องเตรียม)
3. [ขั้นตอนที่ 1: สร้าง Database บน DBeaver](#3-ขั้นตอนที่-1-สร้าง-database-บน-dbeaver)
4. [ขั้นตอนที่ 2: สร้าง Backend API (Node.js + Express)](#4-ขั้นตอนที่-2-สร้าง-backend-api)
5. [ขั้นตอนที่ 3: ตั้งค่า Frontend API](#5-ขั้นตอนที่-3-ตั้งค่า-frontend-api)
6. [ขั้นตอนที่ 4: Deploy ไปยัง Public Server (Azure)](#6-ขั้นตอนที่-4-deploy-azure)
7. [ขั้นตอนที่ 5: เชื่อมต่อ Frontend กับ Backend จริง](#7-ขั้นตอนที่-5-เชื่อมต่อจริง)
8. [ขั้นตอนที่ 6: ทดสอบระบบ End-to-End](#8-ขั้นตอนที่-6-ทดสอบ)
9. [การแก้ไขปัญหาที่พบบ่อย (Troubleshooting)](#9-troubleshooting)

---

## 1. ภาพรวมระบบ

```
┌────────────────────┐         ┌────────────────────┐         ┌────────────────────┐
│                    │  HTTP   │                    │   SQL   │                    │
│  React Frontend    │ ◄─────► │  Node.js + Express │ ◄─────► │  PostgreSQL        │
│  (Lovable/VSCode)  │  REST   │  Backend API       │  pg     │  Schema: pud       │
│                    │  JSON   │  Port: 3001        │  Pool   │  Port: 5432        │
│  Port: 5173 (dev)  │         │                    │         │                    │
└────────────────────┘         └────────────────────┘         └────────────────────┘
       │                              │                              │
       │ Lovable Preview              │ Azure App Service            │ Azure PostgreSQL
       │ หรือ localhost               │ หรือ VPS/ngrok              │ หรือ Local DB
       └──────────────────────────────┴──────────────────────────────┘
```

### เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี | หน้าที่ |
|------|-----------|---------|
| Frontend | React + TypeScript + Vite + Tailwind | UI/UX |
| Backend | Node.js + Express + TypeScript | REST API + JWT Auth |
| Database | PostgreSQL 14+ | Data Storage |
| DB Tool | DBeaver | จัดการ Database |
| IDE | VS Code | เขียนโค้ด |
| Deploy | Azure App Service + Azure PostgreSQL | Production |

---

## 2. สิ่งที่ต้องเตรียม

### ซอฟต์แวร์ที่ต้องติดตั้ง

| ซอฟต์แวร์ | เวอร์ชัน | ลิงก์ดาวน์โหลด |
|-----------|---------|----------------|
| **Node.js** | 18 LTS ขึ้นไป | https://nodejs.org/ |
| **VS Code** | ล่าสุด | https://code.visualstudio.com/ |
| **DBeaver** | Community Edition | https://dbeaver.io/download/ |
| **PostgreSQL** | 14+ (ถ้ารัน local) | https://www.postgresql.org/download/ |
| **Git** | ล่าสุด | https://git-scm.com/ |
| **Azure CLI** (ถ้า deploy Azure) | ล่าสุด | https://learn.microsoft.com/en-us/cli/azure/install-azure-cli |

### VS Code Extensions ที่แนะนำ

```
# ติดตั้งผ่าน Terminal
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension weijan.vscode-database-client2
code --install-extension rangav.vscode-thunder-client
code --install-extension ms-azuretools.vscode-azureappservice
```

---

## 3. ขั้นตอนที่ 1: สร้าง Database บน DBeaver

### 3.1 เปิด DBeaver → สร้าง Connection

1. เปิด **DBeaver**
2. คลิก **Database** → **New Database Connection** (หรือกด `Ctrl+Shift+N`)
3. เลือก **PostgreSQL** → คลิก **Next**

### 3.2 กรอกข้อมูลเชื่อมต่อ

```
┌─────────────────────────────────────────────┐
│        PostgreSQL Connection Settings        │
├─────────────────────────────────────────────┤
│  Host:     localhost (หรือ IP ของ DB Server) │
│  Port:     5432                              │
│  Database: postgres   ← เชื่อมต่อ default ก่อน│
│  Username: pud                               │
│  Password: puddata                           │
│                                              │
│  [x] Save password locally                   │
│                                              │
│  [ Test Connection ] ← ต้องขึ้น ✅ Connected  │
│  [ Finish ]                                  │
└─────────────────────────────────────────────┘
```

> **⚠️ สำคัญ**: ถ้าใช้ Azure PostgreSQL ให้ใส่ Host เป็น `<server-name>.postgres.database.azure.com` และเปิด SSL

### 3.3 สร้าง Database ใหม่

1. หลังเชื่อมต่อสำเร็จ → คลิกขวาที่ **Databases** → **Create New Database**
2. ชื่อ Database: `va_system`
3. Owner: `pud`
4. คลิก **OK**

หรือรัน SQL ใน SQL Editor:
```sql
CREATE DATABASE va_system OWNER pud;
```

### 3.4 สร้าง Schema `pud`

1. เชื่อมต่อเข้า database `va_system` (ดับเบิลคลิก)
2. เปิด **SQL Editor** (`Ctrl+]` หรือคลิกขวา → SQL Editor → New SQL Script)
3. รัน:

```sql
CREATE SCHEMA IF NOT EXISTS pud;
GRANT ALL ON SCHEMA pud TO pud;
```

### 3.5 รัน SQL Scripts สร้างตาราง

#### Script 1: ตารางหลัก (Core Tables)

1. เปิดไฟล์ `docs/database/001_create_tables.sql` ใน DBeaver
   - **File** → **Open File** → เลือกไฟล์
   - หรือ copy เนื้อหาทั้งหมดลงใน SQL Editor
2. **เลือกทั้งหมด** (`Ctrl+A`) → **Execute** (`Ctrl+Enter` หรือ `Alt+X`)
3. ตรวจสอบผลลัพธ์: ไม่มี ERROR

ตารางที่จะถูกสร้าง:
```
✅ pud.va_departments      - โครงสร้างองค์กร
✅ pud.va_users             - ผู้ใช้งาน
✅ pud.va_proposals         - เอกสาร VA
✅ pud.va_attachments       - ไฟล์แนบ
✅ pud.va_approval_routes   - เส้นทางอนุมัติ
✅ pud.va_approval_steps    - ขั้นตอนอนุมัติ
✅ pud.va_audit_log         - ประวัติการดำเนินการ
✅ pud.va_sessions          - Session login
✅ pud.va_proposals_view    - View สรุป Proposal
✅ pud.va_pending_approvals_view - View Pending
```

#### Script 2: ตาราง VA Calculate (เพิ่มเติม)

1. เปิดไฟล์ `docs/database/002_va_calculate_tables.sql`
2. รันเหมือนขั้นตอนเดียวกัน

ตารางเพิ่มเติม:
```
✅ pud.va_calculate_settings    - ตั้งค่า FY
✅ pud.va_monthly_targets       - เป้าหมายรายเดือน
✅ pud.va_monthly_results       - ผลจริงรายเดือน
✅ pud.va_credit_notes          - Credit Note
✅ pud.va_calculation_items     - รายการคำนวณ
✅ pud.va_monthly_summary_view  - View สรุปรายเดือน
✅ pud.va_credit_notes_view     - View Credit Note
```

### 3.6 ตรวจสอบผลลัพธ์ใน DBeaver

```sql
-- ตรวจสอบตารางทั้งหมดใน schema pud
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'pud' AND table_name LIKE 'va_%'
ORDER BY table_name;
```

ผลลัพธ์ที่ถูกต้อง: ต้องเห็นตาราง **13+ รายการ** (tables + views)

### 3.7 สร้าง Admin User (bcrypt hash)

> ⚠️ password_hash ใน SQL script เป็น placeholder ต้องสร้าง hash จริงก่อน

**วิธีสร้าง bcrypt hash:**

```bash
# ติดตั้ง bcryptjs ชั่วคราว
npx -y bcryptjs-cli hash "admin123"
# จะได้ hash เช่น: $2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

แล้วรัน SQL ใน DBeaver:
```sql
-- ลบ placeholder user ก่อน (ถ้ามี)
DELETE FROM pud.va_users WHERE emp_code = 'ADMIN001';

-- สร้าง Admin User ด้วย hash จริง
INSERT INTO pud.va_users (emp_code, email, first_name, last_name, password_hash, role) 
VALUES (
    'ADMIN001', 
    'admin@daikin.com', 
    'System', 
    'Admin', 
    '$2a$10$REPLACE_WITH_REAL_BCRYPT_HASH', -- ← ใส่ hash ที่ได้จากคำสั่งด้านบน
    'admin'
);

-- ตรวจสอบ
SELECT id, emp_code, email, first_name, last_name, role FROM pud.va_users;
```

---

## 4. ขั้นตอนที่ 2: สร้าง Backend API

### 4.1 สร้างโปรเจค Backend ใน VS Code

```bash
# เปิด Terminal ใน VS Code
# สร้างโฟลเดอร์ backend แยกจาก frontend

mkdir va-workflow-api
cd va-workflow-api

# สร้าง package.json
npm init -y

# ติดตั้ง Dependencies
npm install express cors pg dotenv jsonwebtoken bcryptjs helmet morgan

# ติดตั้ง Dev Dependencies
npm install -D typescript @types/express @types/cors @types/pg \
  @types/jsonwebtoken @types/bcryptjs @types/node \
  ts-node nodemon
```

### 4.2 สร้างไฟล์ tsconfig.json

```bash
# สร้างด้วยคำสั่ง
npx tsc --init
```

แก้ไขเป็น:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4.3 สร้างไฟล์ .env

```bash
# สร้างไฟล์ .env ใน root ของ va-workflow-api
```

```env
# ========================
# Database Configuration
# ========================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=va_system
DB_USER=pud
DB_PASSWORD=puddata
DB_SCHEMA=pud

# ========================
# JWT Configuration
# ========================
JWT_SECRET=va-workflow-super-secret-key-change-in-production-2024
JWT_EXPIRES_IN=8h

# ========================
# Server Configuration
# ========================
PORT=3001
NODE_ENV=development

# ========================
# CORS - Frontend URL
# ========================
# Development:
CORS_ORIGIN=http://localhost:5173

# Production (เปลี่ยนเป็น URL จริงของ Frontend):
# CORS_ORIGIN=https://your-app.lovable.app
```

> **⚠️ สร้างไฟล์ .gitignore**
```gitignore
node_modules/
dist/
.env
*.log
```

### 4.4 สร้างโครงสร้างไฟล์

```
va-workflow-api/
├── src/
│   ├── db.ts                    ← Database connection pool
│   ├── index.ts                 ← Main server entry
│   ├── middleware/
│   │   └── auth.ts              ← JWT authentication
│   └── routes/
│       ├── auth.ts              ← Login/Logout/Profile
│       ├── proposals.ts         ← CRUD Proposals
│       ├── users.ts             ← User Management
│       ├── departments.ts       ← Department Tree
│       └── va-calculate.ts      ← VA Calculate API
├── .env
├── .gitignore
├── tsconfig.json
└── package.json
```

### 4.5 สร้างไฟล์ `src/db.ts`

```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Set schema search path on every new connection
pool.on('connect', (client) => {
  client.query(`SET search_path TO ${process.env.DB_SCHEMA || 'pud'}, public`);
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL error:', err);
  process.exit(-1);
});

// Helper function
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 1000) {
    console.warn(`⚠️ Slow query (${duration}ms):`, text.substring(0, 100));
  }
  return result;
}
```

### 4.6 สร้างไฟล์ `src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
```

### 4.7 สร้างไฟล์ Routes (ทุก route)

> **ดูโค้ดแต่ละ route ได้ที่:** `docs/backend/README.md` Section 5

สร้างไฟล์ต่อไปนี้โดย **คัดลอกโค้ดจาก `docs/backend/README.md`**:

| ไฟล์ | Section ใน README |
|------|------------------|
| `src/routes/auth.ts` | `src/routes/auth.ts` - Authentication Routes |
| `src/routes/proposals.ts` | `src/routes/proposals.ts` - Proposal CRUD |
| `src/routes/users.ts` | `src/routes/users.ts` - User Management |
| `src/routes/departments.ts` | `src/routes/departments.ts` - Department API |

### 4.8 สร้างไฟล์ `src/routes/va-calculate.ts` (เพิ่มเติม)

```typescript
import { Router } from 'express';
import { query } from '../db';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/va-calculate/settings
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM pud.va_calculate_settings ORDER BY fiscal_year DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/va-calculate/settings/:id
router.get('/settings/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM pud.va_calculate_settings WHERE id = $1', [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/va-calculate/settings
router.post('/settings', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { fiscalYear, cdGoal, exchangeRate, cifPercent, fobPercent, currency, startDate, endDate } = req.body;
    
    const result = await query(
      `INSERT INTO pud.va_calculate_settings 
       (fiscal_year, cd_goal, exchange_rate, cif_percent, fob_percent, currency, start_date, end_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [fiscalYear, cdGoal, exchangeRate, cifPercent, fobPercent, currency, startDate, endDate, req.userId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Fiscal year already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/va-calculate/settings/:id
router.put('/settings/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { cdGoal, exchangeRate, cifPercent, fobPercent, currency, startDate, endDate, isActive } = req.body;
    
    // ถ้า set active ให้ deactivate อันอื่นก่อน
    if (isActive) {
      await query('UPDATE pud.va_calculate_settings SET is_active = false WHERE is_active = true');
    }
    
    const result = await query(
      `UPDATE pud.va_calculate_settings SET
        cd_goal = COALESCE($1, cd_goal),
        exchange_rate = COALESCE($2, exchange_rate),
        cif_percent = COALESCE($3, cif_percent),
        fob_percent = COALESCE($4, fob_percent),
        currency = COALESCE($5, currency),
        start_date = COALESCE($6, start_date),
        end_date = COALESCE($7, end_date),
        is_active = COALESCE($8, is_active)
       WHERE id = $9 RETURNING *`,
      [cdGoal, exchangeRate, cifPercent, fobPercent, currency, startDate, endDate, isActive, req.params.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/va-calculate/settings/:id
router.delete('/settings/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await query('DELETE FROM pud.va_calculate_settings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Setting deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/va-calculate/monthly?fy=OB2024
router.get('/monthly', authenticateToken, async (req, res) => {
  try {
    const { fy } = req.query;
    let sql = 'SELECT * FROM pud.va_monthly_summary_view';
    const params: any[] = [];
    
    if (fy) {
      params.push(fy);
      sql += ` WHERE fiscal_year = $1`;
    }
    sql += ' ORDER BY month_index';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/va-calculate/monthly-targets/:settingId/:monthIndex
router.put('/monthly-targets/:settingId/:monthIndex', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { estimateCdTarget, targetCd, includedNewIdea } = req.body;
    
    const result = await query(
      `INSERT INTO pud.va_monthly_targets (setting_id, month_index, month_year, estimate_cd_target, target_cd, included_new_idea)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (setting_id, month_index) 
       DO UPDATE SET 
         estimate_cd_target = COALESCE($4, pud.va_monthly_targets.estimate_cd_target),
         target_cd = COALESCE($5, pud.va_monthly_targets.target_cd),
         included_new_idea = COALESCE($6, pud.va_monthly_targets.included_new_idea)
       RETURNING *`,
      [req.params.settingId, req.params.monthIndex, req.body.monthYear, estimateCdTarget, targetCd, includedNewIdea]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/va-calculate/credit-notes
router.get('/credit-notes', authenticateToken, async (req, res) => {
  try {
    const { fy, status } = req.query;
    let sql = 'SELECT * FROM pud.va_credit_notes_view WHERE 1=1';
    const params: any[] = [];
    
    if (fy) {
      params.push(fy);
      sql += ` AND fiscal_year = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND cn_status = $${params.length}`;
    }
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/va-calculate/credit-notes
router.post('/credit-notes', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { proposalId, vaNo, vaTheme, rank, applyMonthTarget, costdownTarget,
            dcsNo, dcsClass, buyerName, vaType, createIdeaBy } = req.body;
    
    const result = await query(
      `INSERT INTO pud.va_credit_notes 
       (proposal_id, va_no, va_theme, rank, apply_month_target, costdown_target,
        dcs_no, dcs_class, buyer_name, va_type, create_idea_by, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [proposalId, vaNo, vaTheme, rank, applyMonthTarget, costdownTarget,
       dcsNo, dcsClass, buyerName, vaType, createIdeaBy, req.userId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/va-calculate/credit-notes/:id
router.put('/credit-notes/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { cnStatus, cnIssuedDate, cnNumber, costdownActual, costdownActualCds,
            costdownActualBuyer, applyMonthActual, notes } = req.body;
    
    const result = await query(
      `UPDATE pud.va_credit_notes SET
        cn_status = COALESCE($1, cn_status),
        cn_issued_date = COALESCE($2, cn_issued_date),
        cn_number = COALESCE($3, cn_number),
        costdown_actual = COALESCE($4, costdown_actual),
        costdown_actual_cds = COALESCE($5, costdown_actual_cds),
        costdown_actual_buyer = COALESCE($6, costdown_actual_buyer),
        apply_month_actual = COALESCE($7, apply_month_actual),
        notes = COALESCE($8, notes)
       WHERE id = $9 RETURNING *`,
      [cnStatus, cnIssuedDate, cnNumber, costdownActual, costdownActualCds,
       costdownActualBuyer, applyMonthActual, notes, req.params.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/va-calculate/items
router.get('/items', authenticateToken, async (req, res) => {
  try {
    const { fy, month } = req.query;
    let sql = 'SELECT ci.* FROM pud.va_calculation_items ci';
    const params: any[] = [];
    
    if (fy) {
      sql += ' JOIN pud.va_calculate_settings s ON ci.setting_id = s.id';
      params.push(fy);
      sql += ` WHERE s.fiscal_year = $${params.length}`;
    } else {
      sql += ' WHERE 1=1';
    }
    
    if (month) {
      params.push(month);
      sql += ` AND ci.apply_month = $${params.length}`;
    }
    
    sql += ' ORDER BY ci.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/va-calculate/recalculate/:settingId
router.post('/recalculate/:settingId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await query('SELECT pud.recalculate_monthly_results($1)', [req.params.settingId]);
    res.json({ message: 'Recalculation completed' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

### 4.9 สร้างไฟล์ `src/index.ts` (Main Server)

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import proposalRoutes from './routes/proposals';
import userRoutes from './routes/users';
import departmentRoutes from './routes/departments';
import vaCalculateRoutes from './routes/va-calculate';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ========================
// Middleware
// ========================
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// ========================
// Routes
// ========================
app.use('/api/auth', authRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/va-calculate', vaCalculateRoutes);

// ========================
// Health Check
// ========================
app.get('/api/health', async (req, res) => {
  try {
    const { query: dbQuery } = await import('./db');
    const result = await dbQuery('SELECT NOW() as time, current_database() as db');
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: (error as Error).message 
    });
  }
});

// ========================
// Error Handler
// ========================
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ========================
// Start Server
// ========================
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  🚀 VA Workflow API Server                  ║');
  console.log(`║  📡 Running on: http://localhost:${PORT}        ║`);
  console.log(`║  📦 Database: ${process.env.DB_HOST}:${process.env.DB_PORT}        ║`);
  console.log(`║  🌐 CORS: ${process.env.CORS_ORIGIN}       ║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});
```

### 4.10 เพิ่ม Scripts ใน package.json

```json
{
  "name": "va-workflow-api",
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "start:dev": "ts-node src/index.ts"
  }
}
```

### 4.11 รัน Backend Server

```bash
# Development mode (auto-reload เมื่อแก้ไขโค้ด)
npm run dev

# ผลลัพธ์ที่ต้องเห็น:
# ╔══════════════════════════════════════════════╗
# ║  🚀 VA Workflow API Server                  ║
# ║  📡 Running on: http://localhost:3001        ║
# ║  📦 Database: localhost:5432                 ║
# ║  🌐 CORS: http://localhost:5173              ║
# ╚══════════════════════════════════════════════╝
```

### 4.12 ทดสอบ API ด้วย Thunder Client / curl

```bash
# 1. Health Check
curl http://localhost:3001/api/health
# → {"status":"ok","timestamp":"...","database":{"time":"...","db":"va_system"}}

# 2. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@daikin.com","password":"admin123"}'
# → {"token":"eyJ...","user":{...}}

# 3. Get Proposals (ใช้ token จาก login)
curl http://localhost:3001/api/proposals \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 4. Get Departments
curl http://localhost:3001/api/departments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 5. ขั้นตอนที่ 3: ตั้งค่า Frontend API

ไฟล์ที่ต้องแก้ไข: `src/lib/api.ts` (ในโปรเจค Lovable/Frontend)

### สิ่งที่ต้องเปลี่ยน:

```typescript
// ===== เปลี่ยน 2 บรรทัดนี้ =====

// ก่อน (Demo Mode):
const API_BASE_URL = 'http://192.168.213.207:3001/api';
const USE_API = false;

// หลัง (เชื่อมต่อจริง):
const API_BASE_URL = 'https://YOUR-BACKEND-URL.azurewebsites.net/api';  // ← URL ของ Backend ที่ deploy แล้ว
const USE_API = true;
```

> ⚠️ **อย่าเปลี่ยนจนกว่า Backend จะ deploy เสร็จและมี Public URL**

### Flow การเชื่อมต่อ:

```
Frontend (USE_API = true)
    ↓ fetch('/api/auth/login', { email, password })
    ↓ 
Backend API (https://your-api.azurewebsites.net)
    ↓ query('SELECT * FROM pud.va_users WHERE email = $1')
    ↓
PostgreSQL Database
    ↓ return user data
    ↓
Backend → สร้าง JWT Token → ส่งกลับ Frontend
    ↓
Frontend → เก็บ Token ใน localStorage → ใช้ส่ง Header ทุก request
```

---

## 6. ขั้นตอนที่ 4: Deploy Azure

### Option A: Azure App Service + Azure PostgreSQL (แนะนำ)

#### A1. สร้าง Azure PostgreSQL

```bash
# Login Azure CLI
az login

# สร้าง Resource Group
az group create --name rg-va-workflow --location southeastasia

# สร้าง PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group rg-va-workflow \
  --name va-workflow-db \
  --location southeastasia \
  --admin-user pud \
  --admin-password "PudData@2024!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 14

# เปิด Firewall - อนุญาต Azure services
az postgres flexible-server firewall-rule create \
  --resource-group rg-va-workflow \
  --name va-workflow-db \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# เปิด Firewall - IP ของคุณ (สำหรับ DBeaver)
az postgres flexible-server firewall-rule create \
  --resource-group rg-va-workflow \
  --name va-workflow-db \
  --rule-name AllowMyIP \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP
```

#### A2. เชื่อมต่อ DBeaver กับ Azure PostgreSQL

```
Host:     va-workflow-db.postgres.database.azure.com
Port:     5432
Database: postgres  (สร้าง va_system ทีหลัง)
Username: pud
Password: PudData@2024!
SSL:      require  ← สำคัญ! Azure บังคับ SSL
```

ใน DBeaver → Connection Settings → **SSL** tab → เลือก **"Require"**

จากนั้น **รัน SQL scripts ทั้ง 2 ไฟล์** เหมือนขั้นตอนที่ 3

#### A3. Deploy Backend ไปยัง Azure App Service

```bash
# 1. Build backend
cd va-workflow-api
npm run build

# 2. สร้าง App Service Plan
az appservice plan create \
  --name plan-va-workflow \
  --resource-group rg-va-workflow \
  --location southeastasia \
  --sku B1 \
  --is-linux

# 3. สร้าง Web App
az webapp create \
  --resource-group rg-va-workflow \
  --plan plan-va-workflow \
  --name va-workflow-api \
  --runtime "NODE:18-lts"

# 4. ตั้ง Environment Variables
az webapp config appsettings set \
  --resource-group rg-va-workflow \
  --name va-workflow-api \
  --settings \
    DB_HOST="va-workflow-db.postgres.database.azure.com" \
    DB_PORT="5432" \
    DB_NAME="va_system" \
    DB_USER="pud" \
    DB_PASSWORD="PudData@2024!" \
    DB_SCHEMA="pud" \
    JWT_SECRET="your-production-jwt-secret-change-this" \
    JWT_EXPIRES_IN="8h" \
    PORT="8080" \
    NODE_ENV="production" \
    CORS_ORIGIN="https://id-preview--8fbcf990-0784-40c1-9492-fe70a088f58e.lovable.app"

# 5. Deploy ด้วย zip
cd dist
zip -r ../deploy.zip .
cd ..
az webapp deploy \
  --resource-group rg-va-workflow \
  --name va-workflow-api \
  --src-path deploy.zip \
  --type zip
```

#### A4. ดู Public URL

```bash
# URL ของ Backend API จะเป็น:
# https://va-workflow-api.azurewebsites.net

# ทดสอบ Health Check
curl https://va-workflow-api.azurewebsites.net/api/health
```

---

### Option B: Deploy ด้วย Railway / Render (ง่ายกว่า)

#### Railway (https://railway.app)

1. สร้างบัญชี Railway → New Project
2. เลือก **"Deploy from GitHub Repo"** (push code ขึ้น GitHub ก่อน)
3. Railway จะ detect Node.js อัตโนมัติ
4. เพิ่ม **PostgreSQL** service ใน project เดียวกัน
5. ตั้ง Environment Variables ใน Railway Dashboard
6. Railway จะให้ Public URL เช่น `https://va-workflow-api-production.up.railway.app`

#### Render (https://render.com)

1. สร้างบัญชี Render → New Web Service
2. เชื่อมต่อ GitHub repo
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. เพิ่ม PostgreSQL database
6. ตั้ง Environment Variables
7. Public URL เช่น `https://va-workflow-api.onrender.com`

---

### Option C: ใช้ ngrok (สำหรับทดสอบชั่วคราว)

```bash
# ติดตั้ง ngrok
# https://ngrok.com/download

# รัน Backend ที่ localhost:3001
cd va-workflow-api
npm run dev

# เปิด tunnel (Terminal อีกตัว)
ngrok http 3001

# จะได้ URL เช่น:
# https://abc123.ngrok-free.app  ← ใช้ URL นี้เป็น API_BASE_URL
```

> ⚠️ URL ของ ngrok จะเปลี่ยนทุกครั้งที่รันใหม่ (ยกเว้นแบบเสียเงิน)

---

## 7. ขั้นตอนที่ 5: เชื่อมต่อ Frontend กับ Backend จริง

### เมื่อได้ Public URL แล้ว ให้แจ้งกลับมาที่ Lovable Chat:

> "Backend deploy เสร็จแล้ว URL คือ https://va-workflow-api.azurewebsites.net"

### AI จะแก้ไขให้อัตโนมัติ:

ไฟล์ `src/lib/api.ts`:
```typescript
const API_BASE_URL = 'https://va-workflow-api.azurewebsites.net/api';
const USE_API = true;
```

### สิ่งที่ต้องตรวจสอบก่อนเปิด USE_API:

- [ ] Backend Health Check ผ่าน
- [ ] Database มีตารางทั้งหมดครบ (13+ ตาราง)
- [ ] มี Admin User ใน va_users (bcrypt hash จริง)
- [ ] CORS ตั้งค่าถูกต้อง (อนุญาต Frontend URL)
- [ ] JWT_SECRET ตั้งค่าแล้ว (ไม่ใช่ค่า default)
- [ ] SSL/HTTPS ใช้งานได้ (Azure ให้ HTTPS อัตโนมัติ)

---

## 8. ขั้นตอนที่ 6: ทดสอบ End-to-End

### Checklist ทดสอบ

| # | ทดสอบ | วิธี | ผลที่ต้องได้ |
|---|-------|------|------------|
| 1 | Health Check | `GET /api/health` | `{"status":"ok"}` |
| 2 | Login | Frontend → หน้า Login | เข้าสู่ระบบสำเร็จ, เห็น Dashboard |
| 3 | ดู Proposals | Frontend → หน้า Dashboard | เห็นรายการ (อาจว่างเปล่าถ้ายังไม่มีข้อมูล) |
| 4 | สร้าง Proposal | Frontend → New Proposal | สร้างสำเร็จ, เห็นใน list |
| 5 | ดู Departments | Frontend → Admin → Users | เห็น dropdown แผนก |
| 6 | VA Calculate | Frontend → VA Calculate | เห็นข้อมูล FY settings |
| 7 | อนุมัติ | Frontend → Proposal Detail | Approve/Reject ได้ |

### ทดสอบผ่าน Thunder Client (VS Code)

```http
### Login
POST https://YOUR-API-URL/api/auth/login
Content-Type: application/json

{
  "email": "admin@daikin.com",
  "password": "admin123"
}

### Get Proposals
GET https://YOUR-API-URL/api/proposals
Authorization: Bearer {{token}}

### Create Proposal
POST https://YOUR-API-URL/api/proposals
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "partName": "Compressor Unit A",
  "status": "draft",
  "confidentiality": "internal",
  "beforeCost": 1500,
  "afterCost": 1200,
  "volumePerYear": 10000,
  "currency": "JPY"
}
```

---

## 9. Troubleshooting

### ปัญหาที่พบบ่อย

| ปัญหา | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| `ECONNREFUSED` | Backend ไม่ได้รัน หรือ Port ผิด | ตรวจสอบว่า server รันอยู่, ตรวจ PORT ใน .env |
| `CORS error` | Frontend URL ไม่ตรงกับ CORS_ORIGIN | แก้ CORS_ORIGIN ใน .env ของ Backend |
| `401 Unauthorized` | Token หมดอายุ หรือไม่มี | Login ใหม่, ตรวจสอบ Authorization header |
| `relation does not exist` | ยังไม่ได้รัน SQL scripts | รัน 001 และ 002 ใน DBeaver |
| `password authentication failed` | Username/Password ผิด | ตรวจสอบ DB_USER, DB_PASSWORD ใน .env |
| `SSL required` (Azure) | Azure บังคับ SSL | เพิ่ม `ssl: { rejectUnauthorized: false }` ใน Pool config |
| `Network error` | Frontend เรียก Private IP | ใช้ Public URL (Azure/ngrok) แทน Private IP |

### แก้ปัญหา SSL สำหรับ Azure PostgreSQL

แก้ไข `src/db.ts`:
```typescript
export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
});
```

### ดู Logs บน Azure

```bash
# ดู real-time logs
az webapp log tail \
  --resource-group rg-va-workflow \
  --name va-workflow-api

# เปิด log stream
az webapp log config \
  --resource-group rg-va-workflow \
  --name va-workflow-api \
  --application-logging filesystem \
  --level verbose
```

---

## 📊 สรุป API Endpoints ทั้งหมด

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | ❌ | Health Check |
| `POST` | `/api/auth/login` | ❌ | Login |
| `POST` | `/api/auth/logout` | ✅ | Logout |
| `GET` | `/api/auth/profile` | ✅ | Current User |
| `GET` | `/api/proposals` | ✅ | List Proposals |
| `GET` | `/api/proposals/:id` | ✅ | Proposal Detail |
| `POST` | `/api/proposals` | ✅ | Create Proposal |
| `PUT` | `/api/proposals/:id` | ✅ | Update Proposal |
| `DELETE` | `/api/proposals/:id` | ✅ | Delete Proposal |
| `POST` | `/api/proposals/:id/approve` | ✅ | Approve/Reject |
| `GET` | `/api/users` | ✅ | List Users |
| `POST` | `/api/users` | 🔐 Admin | Create User |
| `PUT` | `/api/users/:id` | 🔐 Admin | Update User |
| `DELETE` | `/api/users/:id` | 🔐 Admin | Deactivate User |
| `POST` | `/api/users/bulk` | 🔐 Admin | Bulk Import |
| `GET` | `/api/departments` | ✅ | List Departments |
| `GET` | `/api/departments/tree` | ✅ | Department Tree |
| `GET` | `/api/va-calculate/settings` | ✅ | FY Settings |
| `POST` | `/api/va-calculate/settings` | 🔐 Admin | Create Setting |
| `PUT` | `/api/va-calculate/settings/:id` | 🔐 Admin | Update Setting |
| `DELETE` | `/api/va-calculate/settings/:id` | 🔐 Admin | Delete Setting |
| `GET` | `/api/va-calculate/monthly` | ✅ | Monthly Summary |
| `PUT` | `/api/va-calculate/monthly-targets/:sid/:mi` | 🔐 Admin | Update Target |
| `GET` | `/api/va-calculate/credit-notes` | ✅ | Credit Notes |
| `POST` | `/api/va-calculate/credit-notes` | ✅ | Create CN |
| `PUT` | `/api/va-calculate/credit-notes/:id` | ✅ | Update CN |
| `GET` | `/api/va-calculate/items` | ✅ | Calculation Items |
| `POST` | `/api/va-calculate/recalculate/:sid` | 🔐 Admin | Recalculate Monthly |

---

## ✅ สรุปลำดับการทำงาน

```
1️⃣  ติดตั้ง PostgreSQL + DBeaver + Node.js + VS Code
         ↓
2️⃣  สร้าง Database + Schema pud ใน DBeaver
         ↓
3️⃣  รัน SQL Scripts (001 + 002) ใน DBeaver
         ↓
4️⃣  สร้าง Admin User (bcrypt hash)
         ↓
5️⃣  สร้างโปรเจค va-workflow-api ใน VS Code
         ↓
6️⃣  สร้างไฟล์ Backend ทั้งหมด (db, routes, middleware)
         ↓
7️⃣  รัน Backend localhost → ทดสอบ Health Check + Login
         ↓
8️⃣  Deploy Backend → Azure / Railway / Render / ngrok
         ↓
9️⃣  ได้ Public URL → แจ้งกลับมาที่ Lovable
         ↓
🔟  AI จะแก้ Frontend (USE_API = true + URL) ให้อัตโนมัติ
         ↓
✅  ทดสอบ End-to-End → ใช้งานจริง!
```
