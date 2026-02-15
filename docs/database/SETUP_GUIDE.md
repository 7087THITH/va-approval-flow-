# 📘 คู่มือการสร้าง Database และเชื่อมต่อ VSCode

## 📋 ข้อมูลการเชื่อมต่อ

| รายการ | ค่า |
|--------|-----|
| Database | PostgreSQL |
| Host | 192.168.213.207 |
| Port | 5432 |
| Username | pud |
| Password | puddata |
| Schema | pud |
| Table Prefix | va_ |

---

## 🏗️ ขั้นตอนที่ 1: ติดตั้ง PostgreSQL Tools

### 1.1 ติดตั้ง psql (Command Line)
```bash
# Windows - ดาวน์โหลด PostgreSQL จาก
# https://www.postgresql.org/download/windows/
# ติ๊กเลือก "Command Line Tools" ระหว่างติดตั้ง

# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client
```

### 1.2 ทดสอบเชื่อมต่อผ่าน Command Line
```bash
psql -h 192.168.213.207 -p 5432 -U pud -d postgres
# ใส่ password: puddata
```

ถ้าเชื่อมต่อสำเร็จจะเห็น:
```
postgres=>
```

---

## 🗄️ ขั้นตอนที่ 2: สร้าง Database และ Tables

### 2.1 สร้าง Database (ถ้ายังไม่มี)
```bash
# เชื่อมต่อก่อน
psql -h 192.168.213.207 -p 5432 -U pud -d postgres

# สร้าง database (ถ้ายังไม่มี)
CREATE DATABASE va_system OWNER pud;

# ออกจาก psql
\q
```

### 2.2 รัน SQL Script สร้างตาราง
```bash
# เชื่อมต่อเข้า database ที่สร้าง แล้วรัน script
psql -h 192.168.213.207 -p 5432 -U pud -d va_system -f docs/database/001_create_tables.sql
```

หรือถ้าใช้ database ที่มีอยู่แล้ว:
```bash
psql -h 192.168.213.207 -p 5432 -U pud -d <ชื่อ_database> -f docs/database/001_create_tables.sql
```

### 2.3 ตรวจสอบว่าตารางสร้างสำเร็จ
```sql
-- เชื่อมต่อแล้วรันคำสั่งนี้
SET search_path TO pud;

-- ดูตารางทั้งหมด
\dt pud.va_*

-- ดูโครงสร้างตาราง
\d pud.va_proposals
\d pud.va_users
```

ผลลัพธ์ที่ควรเห็น:
```
           List of relations
 Schema |        Name         | Type  | Owner
--------+---------------------+-------+-------
 pud    | va_approval_routes  | table | pud
 pud    | va_approval_steps   | table | pud
 pud    | va_attachments      | table | pud
 pud    | va_audit_log        | table | pud
 pud    | va_departments      | table | pud
 pud    | va_proposals        | table | pud
 pud    | va_sessions         | table | pud
 pud    | va_users            | table | pud
```

---

## 💻 ขั้นตอนที่ 3: ตั้งค่า VSCode เชื่อมต่อ Database

### 3.1 ติดตั้ง Extension

เปิด VSCode แล้วติดตั้ง Extension ต่อไปนี้ (เลือกอย่างน้อย 1 ตัว):

#### ✅ แนะนำ: **Database Client** (by Weijan Chen)
1. เปิด VSCode
2. กด `Ctrl+Shift+X` (Extensions)
3. ค้นหา **"Database Client"** โดย Weijan Chen
4. กด **Install**

#### ทางเลือก: **PostgreSQL** (by Chris Kolkman)
1. ค้นหา **"PostgreSQL"** ใน Extensions
2. กด **Install**

#### ทางเลือก: **SQLTools** + **SQLTools PostgreSQL Driver**
1. ค้นหา **"SQLTools"** ใน Extensions → Install
2. ค้นหา **"SQLTools PostgreSQL/Cockroach Driver"** → Install

---

### 3.2 ตั้งค่า Database Client (แนะนำ)

#### วิธีเชื่อมต่อ:
1. คลิกไอคอน **Database** ที่ sidebar ซ้าย (รูปถัง)
2. คลิก **"+"** (Create Connection)
3. เลือก **PostgreSQL**
4. กรอกข้อมูล:

| ช่อง | ค่า |
|------|-----|
| Host | `192.168.213.207` |
| Port | `5432` |
| Username | `pud` |
| Password | `puddata` |
| Database | `va_system` (หรือชื่อ DB ที่ใช้) |
| Schema | `pud` |

5. คลิก **"Test Connection"** → ต้องขึ้น ✅ Success
6. คลิก **"Save"**

#### การใช้งาน:
- **ดูตาราง**: ขยาย connection → Schemas → pud → Tables
- **รัน SQL**: คลิกขวาที่ connection → "New Query"
- **ดูข้อมูล**: คลิกขวาที่ตาราง → "Select Top 1000"

---

### 3.3 ตั้งค่า SQLTools (ทางเลือก)

#### สร้างไฟล์ตั้งค่า `.vscode/settings.json`:
```json
{
  "sqltools.connections": [
    {
      "name": "VA System - PostgreSQL",
      "driver": "PostgreSQL",
      "server": "192.168.213.207",
      "port": 5432,
      "database": "va_system",
      "username": "pud",
      "password": "puddata",
      "previewLimit": 50,
      "pgOptions": {
        "search_path": "pud"
      }
    }
  ]
}
```

#### วิธีเชื่อมต่อ:
1. คลิกไอคอน **SQLTools** ที่ sidebar ซ้าย
2. คลิก connection **"VA System - PostgreSQL"**
3. คลิก **Connect**
4. เมื่อเชื่อมต่อสำเร็จจะเห็น ✅ สีเขียว

#### การรัน SQL:
1. กด `Ctrl+Shift+P` → พิมพ์ "SQLTools: New SQL File"
2. เขียน SQL query
3. กด `Ctrl+E` เพื่อรัน หรือคลิก **"Run on active connection"**

---

## 🔗 ขั้นตอนที่ 4: เชื่อมต่อ Frontend กับ Database

### ⚠️ สำคัญ: Frontend ไม่สามารถเชื่อมต่อ DB โดยตรงได้

เนื่องจาก React รันบน Browser จึง **ไม่สามารถเชื่อมต่อ PostgreSQL โดยตรง** ได้
ต้องมี **Backend API** เป็นตัวกลาง

### สถาปัตยกรรมที่แนะนำ:

```
┌──────────────┐     HTTP/REST      ┌──────────────┐      SQL       ┌──────────────┐
│              │  ←──────────────→  │              │  ←──────────→  │              │
│   React App  │    JSON API        │  Backend API │    Query       │  PostgreSQL  │
│  (Frontend)  │                    │  (Node.js)   │                │  192.168.x   │
│              │                    │              │                │              │
└──────────────┘                    └──────────────┘                └──────────────┘
```

### วิธีที่ 1: ใช้ Node.js + Express (แนะนำ)

#### ติดตั้ง dependencies:
```bash
# สร้างโฟลเดอร์ backend
mkdir backend && cd backend
npm init -y

# ติดตั้ง packages
npm install express pg cors dotenv bcryptjs jsonwebtoken
npm install -D typescript @types/express @types/pg @types/cors @types/bcryptjs @types/jsonwebtoken ts-node nodemon
```

#### สร้างไฟล์ `backend/.env`:
```env
# ⚠️ อย่า commit ไฟล์นี้ขึ้น git!
DB_HOST=192.168.213.207
DB_PORT=5432
DB_USER=pud
DB_PASSWORD=puddata
DB_NAME=va_system
DB_SCHEMA=pud
JWT_SECRET=your_jwt_secret_key_change_this
PORT=3001
```

#### สร้างไฟล์ `backend/src/db.ts`:
```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // ตั้ง search_path ให้ใช้ schema pud
  options: `-c search_path=${process.env.DB_SCHEMA || 'pud'}`,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// ทดสอบ connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err);
});

export default pool;
```

#### สร้างไฟล์ `backend/src/server.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' })); // Vite dev server
app.use(express.json());

// ===== Health Check =====
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: (err as Error).message });
  }
});

// ===== Proposals API =====
app.get('/api/proposals', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pud.va_proposals_view ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/proposals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM pud.va_proposals WHERE id = $1', [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/proposals', async (req, res) => {
  try {
    const proposalNo = await pool.query("SELECT pud.generate_proposal_no() AS no");
    const no = proposalNo.rows[0].no;
    
    const { requester_id, part_name, confidentiality, ...rest } = req.body;
    
    const result = await pool.query(
      `INSERT INTO pud.va_proposals (proposal_no, requester_id, part_name, confidentiality)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [no, requester_id, part_name, confidentiality || 'internal']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ===== Users API =====
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.emp_code, u.email, u.first_name, u.last_name, 
              u.role, u.position, u.telephone, u.job_duty, u.is_active,
              d.name_en AS department_name, d.code AS department_code
       FROM pud.va_users u
       LEFT JOIN pud.va_departments d ON u.department_id = d.id
       WHERE u.is_active = true
       ORDER BY u.first_name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ===== Departments API =====
app.get('/api/departments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM pud.va_departments WHERE is_active = true ORDER BY sort_order`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`🚀 VA API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
```

#### รัน Backend:
```bash
cd backend
npx ts-node src/server.ts

# หรือใช้ nodemon สำหรับ dev
npx nodemon --exec ts-node src/server.ts
```

### วิธีที่ 2: ใช้ pgAdmin (สำหรับจัดการ DB)

1. ดาวน์โหลด pgAdmin จาก https://www.pgadmin.org/download/
2. เปิด pgAdmin → Add New Server
3. กรอก:
   - Name: `VA System`
   - Host: `192.168.213.207`
   - Port: `5432`
   - Username: `pud`
   - Password: `puddata`
4. เปิด Schemas → pud → Tables → จะเห็นตาราง va_* ทั้งหมด

---

## 📊 ER Diagram (Entity Relationship)

```
va_departments (โครงสร้างองค์กร)
    ├── id (PK)
    ├── code (UNIQUE)
    ├── name_en / name_th
    ├── parent_id (FK → self) ← Hierarchical
    └── level (function/division/group/subgroup)
        │
        ├──→ va_users (ผู้ใช้งาน)
        │       ├── id (PK)
        │       ├── emp_code (UNIQUE)
        │       ├── email (UNIQUE)
        │       ├── first_name / last_name
        │       ├── password_hash
        │       ├── role
        │       └── department_id (FK)
        │           │
        │           ├──→ va_proposals (เอกสาร VA)
        │           │       ├── id (PK)
        │           │       ├── proposal_no (UNIQUE, auto)
        │           │       ├── status
        │           │       ├── requester_id (FK)
        │           │       ├── part_name / part_model
        │           │       ├── cost fields (auto-calc)
        │           │       └── change_types (JSONB)
        │           │           │
        │           │           ├──→ va_attachments (ไฟล์แนบ)
        │           │           ├──→ va_approval_routes → va_approval_steps
        │           │           └──→ va_audit_log (ประวัติ)
        │           │
        │           └──→ va_sessions (session login)
        │
        └── (self-referencing for hierarchy)
```

---

## 🔒 หมายเหตุด้านความปลอดภัย

1. **อย่าเก็บ password ใน code** - ใช้ `.env` file เสมอ
2. **เพิ่ม `.env` ใน `.gitignore`** - ป้องกันข้อมูลรั่วไหล
3. **ใช้ bcrypt สำหรับ password** - อย่าเก็บ plain text
4. **ใช้ JWT สำหรับ authentication** - ไม่ส่ง password ทุก request
5. **Network**: ตรวจสอบว่า IP `192.168.213.207` เข้าถึงได้จากเครื่องที่รัน Backend

---

## 📝 คำสั่ง SQL ที่ใช้บ่อย

```sql
-- ตั้ง schema
SET search_path TO pud;

-- ดูตารางทั้งหมด
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'pud' AND table_name LIKE 'va_%';

-- ดู users ทั้งหมด
SELECT * FROM pud.va_users;

-- ดู proposals ทั้งหมด (view)
SELECT * FROM pud.va_proposals_view;

-- ดู pending approvals
SELECT * FROM pud.va_pending_approvals_view;

-- ดูโครงสร้างองค์กร (tree)
WITH RECURSIVE dept_tree AS (
    SELECT id, code, name_en, level, parent_id, 0 AS depth,
           name_en AS path
    FROM pud.va_departments WHERE parent_id IS NULL
    UNION ALL
    SELECT d.id, d.code, d.name_en, d.level, d.parent_id, dt.depth + 1,
           dt.path || ' > ' || d.name_en
    FROM pud.va_departments d
    JOIN dept_tree dt ON d.parent_id = dt.id
)
SELECT REPEAT('  ', depth) || name_en AS structure, level, code
FROM dept_tree ORDER BY path;

-- สร้างเลขเอกสารอัตโนมัติ
SELECT pud.generate_proposal_no();
```
