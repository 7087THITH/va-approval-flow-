# 📘 VA Workflow — Frontend API / Backend API / Publish API Guide

> ครอบคลุมทุกขั้นตอน: Frontend API Layer → Backend Express API → Database Queries → Publish & Deploy

---

## 📋 สารบัญ

1. [Frontend API Service Layer](#1-frontend-api-service-layer)
2. [Backend API Routes (Node.js + Express)](#2-backend-api-routes)
3. [Database SQL Queries ที่ใช้จริง](#3-database-sql-queries)
4. [วิธี Publish / Deploy](#4-publish-deploy)
5. [Checklist ก่อน Go-Live](#5-checklist)

---

## 1. Frontend API Service Layer

### ตำแหน่งไฟล์: `src/lib/api.ts`

### วิธีเปิดใช้งาน API จริง (ลบ Mock Data)

```typescript
// เปลี่ยนค่าใน src/lib/api.ts

// ❌ ก่อน (Demo Mode)
const API_BASE_URL = 'http://192.168.213.207:3001/api';
const USE_API = false;

// ✅ หลัง (Production Mode)  
const API_BASE_URL = 'http://YOUR_SERVER_IP:3001/api';
const USE_API = true;
```

### เปลี่ยน Login ใน AppContext

```typescript
// src/context/AppContext.tsx — แก้ไข login function

const login = async (email: string, password: string): Promise<boolean> => {
  if (!USE_API) {
    // Demo mode fallback
    const user = demoUsers.find(u => u.email === email);
    if (user && password === 'demo123') { setCurrentUser(user); return true; }
    return false;
  }

  // Production: call backend
  const response = await authApi.login(email, password);
  if (response.success && response.data) {
    setAuthToken(response.data.token);
    setCurrentUser(response.data.user as User);
    return true;
  }
  return false;
};
```

### API Endpoints ที่ Frontend เรียกใช้

| Method | Endpoint | ใช้ในหน้า | คำอธิบาย |
|--------|----------|-----------|----------|
| `POST` | `/api/auth/login` | LoginPage | เข้าสู่ระบบ |
| `POST` | `/api/auth/logout` | Sidebar | ออกจากระบบ |
| `GET` | `/api/auth/profile` | AppContext | ดึงข้อมูล user ปัจจุบัน |
| `GET` | `/api/proposals` | DashboardPage | รายการเอกสาร |
| `GET` | `/api/proposals/:id` | ProposalDetailPage | รายละเอียดเอกสาร |
| `POST` | `/api/proposals` | ProposalWizardPage | สร้างเอกสาร |
| `POST` | `/api/proposals/batch` | BatchCreatePage | สร้างหลายฉบับ |
| `PUT` | `/api/proposals/:id` | ProposalWizardPage | แก้ไขเอกสาร |
| `DELETE` | `/api/proposals/:id` | ProposalDetailPage | ลบเอกสาร (draft) |
| `POST` | `/api/proposals/:id/approve` | ProposalDetailPage | อนุมัติ/ปฏิเสธ/คืน |
| `POST` | `/api/proposals/:id/dispatch` | ProposalDetailPage | R&D Center มอบหมาย |
| `GET` | `/api/users` | AdminPage | รายชื่อ user |
| `POST` | `/api/users` | AdminPage | สร้าง user |
| `POST` | `/api/users/bulk` | AdminPage | อัพโหลดหลายคน |
| `PUT` | `/api/users/:id` | AdminPage | แก้ไข user |
| `DELETE` | `/api/users/:id` | AdminPage | ลบ user |
| `GET` | `/api/departments/tree` | ApproverSelector | โครงสร้างแผนก |
| `GET` | `/api/va-calculate/settings` | VACalculatePage | ตั้งค่า FY |
| `POST` | `/api/va-calculate/settings` | VACalculateSettings | สร้างตั้งค่า FY |
| `GET` | `/api/va-calculate/monthly` | VACalculatePage | สรุปรายเดือน |
| `GET` | `/api/va-calculate/credit-notes` | CreditNoteTable | รายการ Credit Note |
| `GET` | `/api/permissions/roles` | PermissionManager | สิทธิ์ตาม Role |
| `PUT` | `/api/permissions/roles/:role` | PermissionManager | อัพเดทสิทธิ์ |
| `GET` | `/api/permissions/users/:id` | PermissionManager | สิทธิ์เฉพาะ user |

---

## 2. Backend API Routes (Node.js + Express)

### ไฟล์โค้ดอ้างอิง: `docs/backend/api-routes.ts`

### ขั้นตอนสร้าง Backend

```bash
# 1. สร้างโฟลเดอร์
mkdir va-workflow-api && cd va-workflow-api

# 2. Initialize
npm init -y

# 3. ติดตั้ง packages
npm install express cors pg dotenv jsonwebtoken bcryptjs helmet morgan
npm install -D typescript @types/express @types/cors @types/pg @types/jsonwebtoken @types/bcryptjs @types/node ts-node nodemon

# 4. สร้าง tsconfig.json
npx tsc --init
```

### โครงสร้างไฟล์

```
va-workflow-api/
├── .env                          ← ค่า config (DB, JWT, CORS)
├── .gitignore
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                  ← Main entry + express setup
│   ├── db.ts                     ← PostgreSQL pool connection
│   ├── middleware/
│   │   └── auth.ts               ← JWT verify + role check
│   └── routes/
│       ├── auth.ts               ← POST login, logout, GET profile
│       ├── proposals.ts          ← CRUD + approve + dispatch
│       ├── users.ts              ← CRUD + bulk import
│       ├── departments.ts        ← GET tree structure
│       ├── va-calculate.ts       ← Settings, monthly, credit notes
│       └── permissions.ts        ← Role & user permission CRUD
```

### ไฟล์ .env

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=va_system
DB_USER=pud
DB_PASSWORD=puddata
DB_SCHEMA=pud
JWT_SECRET=va-workflow-secret-key-min-32-chars-2024
JWT_EXPIRES_IN=8h
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### package.json scripts

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

---

## 3. Database SQL Queries ที่ใช้จริง

### ไฟล์ SQL Migrations

| ไฟล์ | คำอธิบาย |
|------|----------|
| `docs/database/001_create_tables.sql` | ตารางหลัก: users, proposals, approval_steps, audit_log |
| `docs/database/002_va_calculate_tables.sql` | ตาราง VA Calculate: settings, monthly, credit_notes |

### วิธีรัน SQL

```bash
# ผ่าน psql
psql -h localhost -U pud -d va_system -f docs/database/001_create_tables.sql
psql -h localhost -U pud -d va_system -f docs/database/002_va_calculate_tables.sql

# หรือเปิดไฟล์ใน DBeaver → Execute All (Ctrl+Enter)
```

### สร้าง Admin User คนแรก

```bash
# สร้าง bcrypt hash
npx -y bcryptjs-cli hash "admin123"
# ได้ hash → ใส่ใน SQL
```

```sql
INSERT INTO pud.va_users (emp_code, email, first_name, last_name, password_hash, role, department)
VALUES ('ADMIN001', 'admin@daikin.com', 'System', 'Admin',
  '$2a$10$YOUR_HASH_HERE', 'admin', 'Administration');
```

### ตรวจสอบว่าตารางสร้างครบ

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'pud' AND table_name LIKE 'va_%'
ORDER BY table_name;

-- ต้องเห็น 13+ tables/views
```

---

## 4. Publish / Deploy

### Option A: Deploy Backend บน Azure App Service

```bash
# 1. สร้าง Azure Resources
az group create --name va-workflow-rg --location southeastasia
az appservice plan create --name va-plan --resource-group va-workflow-rg --sku B1 --is-linux
az webapp create --name va-workflow-api --resource-group va-workflow-rg --plan va-plan --runtime "NODE:18-lts"

# 2. ตั้งค่า Environment Variables
az webapp config appsettings set --name va-workflow-api --resource-group va-workflow-rg --settings \
  DB_HOST="your-db-host.postgres.database.azure.com" \
  DB_PORT="5432" \
  DB_NAME="va_system" \
  DB_USER="pud" \
  DB_PASSWORD="puddata" \
  DB_SCHEMA="pud" \
  JWT_SECRET="your-production-secret-key" \
  JWT_EXPIRES_IN="8h" \
  CORS_ORIGIN="https://your-frontend-url.lovable.app"

# 3. Deploy
cd va-workflow-api
npm run build
az webapp deploy --name va-workflow-api --resource-group va-workflow-rg --src-path dist/ --type zip
```

### Option B: Deploy บน VPS / On-Premise

```bash
# 1. Clone โค้ด
git clone <repo-url> va-workflow-api
cd va-workflow-api

# 2. ติดตั้ง
npm install
npm run build

# 3. ใช้ PM2 รัน
npm install -g pm2
pm2 start dist/index.js --name va-api

# 4. เปิด Firewall port 3001
sudo ufw allow 3001
```

### เชื่อม Frontend กับ Backend จริง

```typescript
// src/lib/api.ts — เปลี่ยน 2 บรรทัดนี้

const API_BASE_URL = 'https://va-workflow-api.azurewebsites.net/api';
// หรือ 'http://YOUR_VPS_IP:3001/api'

const USE_API = true;  // ← เปิดใช้งาน API จริง
```

### Publish Frontend (Lovable)

1. กดปุ่ม **Publish** บน Lovable
2. ระบบจะ deploy ไปที่ URL: `https://your-project.lovable.app`
3. ตรวจสอบ CORS_ORIGIN ใน Backend ให้ตรงกับ Frontend URL

---

## 5. Checklist ก่อน Go-Live

### Database
- [ ] ตาราง 001 + 002 สร้างครบ
- [ ] Admin user สร้างด้วย bcrypt hash จริง
- [ ] โครงสร้างแผนก (va_departments) มีข้อมูล
- [ ] Backup database ก่อน deploy

### Backend
- [ ] .env ใช้ค่า production (JWT_SECRET แข็งแรง)
- [ ] CORS_ORIGIN ตรงกับ Frontend URL
- [ ] ทดสอบ `/api/health` ได้ `{ status: "ok" }`
- [ ] ทดสอบ Login ได้ token กลับมา
- [ ] PM2 / Azure App Service รันอยู่

### Frontend
- [ ] `USE_API = true` ใน `src/lib/api.ts`
- [ ] `API_BASE_URL` ชี้ไป production backend
- [ ] ทดสอบ Login → Dashboard → สร้างเอกสาร → อนุมัติ
- [ ] Publish บน Lovable

### Security
- [ ] JWT_SECRET ≥ 32 characters
- [ ] Password ใช้ bcrypt hash
- [ ] HTTPS ทั้ง Frontend + Backend (production)
- [ ] Rate limiting เปิดใช้
- [ ] SQL injection ป้องกันด้วย parameterized queries

---

> 📌 **ดูโค้ด Backend ทั้งหมด:** `docs/backend/api-routes.ts`  
> 📌 **ดู SQL Scripts:** `docs/database/001_create_tables.sql` + `002_va_calculate_tables.sql`  
> 📌 **ดูคู่มือฉบับสมบูรณ์:** `docs/FULL_SETUP_GUIDE.md`
