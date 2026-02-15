# 📘 VA Workflow — Frontend ↔ Backend ↔ Database Connection Guide

> คู่มือเชื่อมต่อทุกหน้า Frontend กับ Backend API อย่างละเอียด

---

## 📋 สารบัญ

1. [Architecture Overview](#1-architecture-overview)
2. [Database Setup (PostgreSQL)](#2-database-setup)
3. [Backend Setup (Node.js + Express)](#3-backend-setup)
4. [Frontend API Connection](#4-frontend-api-connection)
5. [Page-by-Page API Mapping](#5-page-by-page-api-mapping)
6. [Login & Authentication Flow](#6-login-authentication)
7. [Deploy & Publish](#7-deploy-publish)
8. [Checklist ก่อน Go-Live](#8-checklist)

---

## 1. Architecture Overview

```
┌─────────────────┐    HTTP/JSON    ┌──────────────────┐    SQL    ┌───────────────┐
│   React Frontend │ ◄────────────► │  Express Backend  │ ◄──────► │  PostgreSQL   │
│   (Lovable)      │   JWT Token    │  Port 3001        │          │  Schema: pud  │
│   Port 5173      │                │  /api/*           │          │  Port 5432    │
└─────────────────┘                └──────────────────┘          └───────────────┘
```

**Frontend:** React + Vite + TailwindCSS (Lovable)  
**Backend:** Node.js + Express + JWT + bcrypt  
**Database:** PostgreSQL 15+ (schema: `pud`, prefix: `va_`)

---

## 2. Database Setup

### 2.1 สร้าง Database

```bash
# สร้าง database
psql -U postgres
CREATE DATABASE va_system;
CREATE USER pud WITH PASSWORD 'puddata';
GRANT ALL PRIVILEGES ON DATABASE va_system TO pud;
\q
```

### 2.2 รัน Migration Scripts (ตามลำดับ)

```bash
# Step 1: ตารางหลัก (8 tables + 2 views + 2 functions)
psql -h localhost -U pud -d va_system -f docs/database/001_create_tables.sql

# Step 2: ตาราง VA Calculate (5 tables + 2 views + 1 function)
psql -h localhost -U pud -d va_system -f docs/database/002_va_calculate_tables.sql

# Step 3: ตาราง Permission, R&D, Notifications (4 tables)
psql -h localhost -U pud -d va_system -f docs/database/003_complete_schema.sql
```

### 2.3 สร้าง Admin User คนแรก

```bash
# สร้าง bcrypt hash
npx -y bcryptjs-cli hash "admin123"
```

```sql
-- ใส่ hash ที่ได้จากด้านบน
INSERT INTO pud.va_users (emp_code, email, first_name, last_name, password_hash, role)
VALUES ('ADMIN001', 'admin@daikin.com', 'System', 'Admin',
  '$2b$10$YOUR_REAL_HASH_HERE', 'admin');
```

### 2.4 ตรวจสอบตาราง

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'pud' AND table_name LIKE 'va_%'
ORDER BY table_name;
-- ต้องเห็น 17 tables
```

---

## 3. Backend Setup

### 3.1 สร้างโปรเจค

```bash
mkdir va-backend && cd va-backend
npm init -y
npm install express cors helmet morgan jsonwebtoken bcryptjs pg dotenv multer
npm install -D typescript @types/express @types/node @types/cors \
  @types/jsonwebtoken @types/bcryptjs @types/pg ts-node nodemon
npx tsc --init
```

### 3.2 ไฟล์ .env

```env
PORT=3001
DB_HOST=192.168.213.207
DB_PORT=5432
DB_NAME=va_system
DB_USER=pud
DB_PASSWORD=puddata
DB_SCHEMA=pud
JWT_SECRET=your-jwt-secret-key-min-32-chars-2026
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173
```

### 3.3 โครงสร้างไฟล์

```
va-backend/
├── .env
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                  ← Main entry
│   ├── config/
│   │   └── database.ts           ← PostgreSQL pool
│   ├── middleware/
│   │   ├── auth.ts               ← JWT verify + role check
│   │   └── validate.ts           ← Request validation
│   ├── routes/
│   │   ├── auth.ts               ← POST login/logout, GET profile
│   │   ├── proposals.ts          ← CRUD + approve + dispatch + batch
│   │   ├── users.ts              ← CRUD + bulk import
│   │   ├── departments.ts        ← GET tree structure
│   │   ├── vaCalculate.ts        ← Settings, monthly, credit notes
│   │   ├── permissions.ts        ← Role & user permission CRUD
│   │   └── notifications.ts      ← GET/PUT notifications
│   ├── services/
│   │   ├── authService.ts
│   │   └── notificationService.ts
│   └── types/
│       └── index.ts
```

### 3.4 รันโปรเจค

```json
// package.json scripts
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

```bash
npm run dev    # Development
npm run build  # Build for production
npm start      # Production
```

---

## 4. Frontend API Connection

### 4.1 เปิดใช้งาน API จริง

```typescript
// src/lib/api.ts — เปลี่ยน 2 บรรทัดนี้

const API_BASE_URL = 'http://192.168.213.207:3001/api';  // ← IP Backend
const USE_API = true;  // ← เปลี่ยนเป็น true
```

### 4.2 เปลี่ยน Login ใน AppContext

```typescript
// src/context/AppContext.tsx

import { authApi, setAuthToken } from '@/lib/api';

// ลบ demoUsers, demoProposals ออก
// เปลี่ยน login function:

const login = async (email: string, password: string): Promise<boolean> => {
  const response = await authApi.login(email, password);
  if (response.success && response.data) {
    setAuthToken(response.data.token);
    setCurrentUser(response.data.user as User);
    return true;
  }
  return false;
};

// เปลี่ยน logout:
const logout = async () => {
  await authApi.logout();
  setCurrentUser(null);
};
```

### 4.3 เปลี่ยน Data Fetching ด้วย React Query

```typescript
// ตัวอย่าง: DashboardPage.tsx
import { useQuery } from '@tanstack/react-query';
import { proposalsApi } from '@/lib/api';

const { data: proposals, isLoading } = useQuery({
  queryKey: ['proposals'],
  queryFn: async () => {
    const res = await proposalsApi.getAll();
    return res.data;
  },
});
```

---

## 5. Page-by-Page API Mapping

### 5.1 LoginPage (`/`)

| Action | API Call | Endpoint |
|--------|----------|----------|
| Login | `authApi.login(email, password)` | `POST /api/auth/login` |
| Auto-login (token) | `authApi.getProfile()` | `GET /api/auth/profile` |

### 5.2 DashboardPage (`/dashboard`)

| Action | API Call | Endpoint |
|--------|----------|----------|
| Load proposals | `proposalsApi.getAll()` | `GET /api/proposals` |
| Filter by status | `proposalsApi.getAll({ status })` | `GET /api/proposals?status=pending` |
| Search | `proposalsApi.getAll({ search })` | `GET /api/proposals?search=keyword` |

### 5.3 ProposalWizardPage (`/proposal/new`, `/proposal/edit/:id`)

| Action | API Call | Endpoint |
|--------|----------|----------|
| Load users (approvers) | `usersApi.getAll()` | `GET /api/users` |
| Load departments | `departmentsApi.getTree()` | `GET /api/departments/tree` |
| Create proposal | `proposalsApi.create(data)` | `POST /api/proposals` |
| Update proposal | `proposalsApi.update(id, data)` | `PUT /api/proposals/:id` |

### 5.4 BatchCreatePage (`/proposal/batch`)

| Action | API Call | Endpoint |
|--------|----------|----------|
| Load users (approvers) | `usersApi.getAll()` | `GET /api/users` |
| Load existing proposals | `proposalsApi.getAll()` | `GET /api/proposals` |
| Batch submit | `proposalsApi.batchCreate(items)` | `POST /api/proposals/batch` |

### 5.5 ProposalDetailPage (`/proposal/:id`)

| Action | API Call | Endpoint |
|--------|----------|----------|
| Load proposal | `proposalsApi.getById(id)` | `GET /api/proposals/:id` |
| Approve/Reject/Return | `proposalsApi.approve(id, judgement)` | `POST /api/proposals/:id/approve` |
| R&D Dispatch | `proposalsApi.dispatch(id, data)` | `POST /api/proposals/:id/dispatch` |
| Delete (draft only) | `proposalsApi.delete(id)` | `DELETE /api/proposals/:id` |

### 5.6 AdminPage (`/admin`)

| Action | API Call | Endpoint |
|--------|----------|----------|
| Load users | `usersApi.getAll()` | `GET /api/users` |
| Create user | `usersApi.create(data)` | `POST /api/users` |
| Update user | `usersApi.update(id, data)` | `PUT /api/users/:id` |
| Delete user | `usersApi.delete(id)` | `DELETE /api/users/:id` |
| Bulk import | `usersApi.bulkImport(users)` | `POST /api/users/bulk` |
| Change password | `usersApi.changePassword(id, pw)` | `PUT /api/users/:id/password` |
| Load role permissions | `permissionsApi.getRoles()` | `GET /api/permissions/roles` |
| Update role permissions | `permissionsApi.updateRole(data)` | `PUT /api/permissions/roles` |
| Load user permissions | `permissionsApi.getUser(id)` | `GET /api/permissions/users/:id` |
| Update user permissions | `permissionsApi.updateUser(id, data)` | `PUT /api/permissions/users/:id` |

### 5.7 VACalculatePage (`/va-calculate`)

| Action | API Call | Endpoint |
|--------|----------|----------|
| Load settings | `vaCalculateApi.getSettings()` | `GET /api/va-calculate/settings` |
| Create setting | `vaCalculateApi.createSetting(data)` | `POST /api/va-calculate/settings` |
| Monthly summary | `vaCalculateApi.getMonthlySummary(fy)` | `GET /api/va-calculate/monthly?fy=OB2024` |
| Credit notes | `vaCalculateApi.getCreditNotes()` | `GET /api/va-calculate/credit-notes` |
| Recalculate | `vaCalculateApi.recalculate(id)` | `POST /api/va-calculate/recalculate/:id` |

### 5.8 HistoryPage (`/history`)

| Action | API Call | Endpoint |
|--------|----------|----------|
| Load history | `proposalsApi.getAll()` | `GET /api/proposals` |

### 5.9 Notifications (Header Bell)

| Action | API Call | Endpoint |
|--------|----------|----------|
| Load notifications | `notificationsApi.getAll()` | `GET /api/notifications` |
| Mark as read | `notificationsApi.markRead(id)` | `PUT /api/notifications/:id/read` |
| Mark all read | `notificationsApi.markAllRead()` | `PUT /api/notifications/read-all` |

---

## 6. Login & Authentication

### Flow Diagram

```
User → LoginPage → POST /api/auth/login
  ↓ success
  ← { token, user } 
  ↓
  Save token → localStorage('va_auth_token')
  Save user → AppContext.currentUser
  ↓
  Navigate → /dashboard
  ↓
  ทุก API call → Header: Authorization: Bearer <token>
```

### Token Refresh

```typescript
// ทุกครั้งที่เปิดแอพ ตรวจสอบ token ที่มีอยู่
useEffect(() => {
  const token = getAuthToken();
  if (token) {
    authApi.getProfile().then(res => {
      if (res.success) setCurrentUser(res.data);
      else { setAuthToken(null); navigate('/'); }
    });
  }
}, []);
```

---

## 7. Deploy & Publish

### 7.1 Backend → Azure App Service

```bash
az group create --name va-rg --location southeastasia
az appservice plan create --name va-plan --resource-group va-rg --sku B1 --is-linux
az webapp create --name va-api --resource-group va-rg --plan va-plan --runtime "NODE:18-lts"

# Set env vars
az webapp config appsettings set --name va-api --resource-group va-rg --settings \
  DB_HOST="db-host.postgres.database.azure.com" \
  DB_PORT="5432" DB_NAME="va_system" DB_USER="pud" DB_PASSWORD="puddata" \
  DB_SCHEMA="pud" JWT_SECRET="production-secret-key-min-32" \
  CORS_ORIGIN="https://your-project.lovable.app"

# Deploy
cd va-backend && npm run build
az webapp deploy --name va-api --resource-group va-rg --src-path dist/ --type zip
```

### 7.2 Backend → VPS / On-Premise

```bash
git clone <repo> va-backend && cd va-backend
npm install && npm run build
npm install -g pm2
pm2 start dist/index.js --name va-api
sudo ufw allow 3001
```

### 7.3 Frontend → Lovable Publish

1. เปลี่ยน `API_BASE_URL` ใน `src/lib/api.ts` ชี้ไป production backend
2. เปลี่ยน `USE_API = true`
3. กดปุ่ม **Publish** บน Lovable → URL: `https://your-project.lovable.app`
4. ตรวจสอบ CORS_ORIGIN ใน Backend ให้ตรงกับ Frontend URL

---

## 8. Checklist ก่อน Go-Live

### Database
- [ ] รัน SQL 001 + 002 + 003 ครบ (17 tables)
- [ ] Admin user สร้างด้วย bcrypt hash จริง
- [ ] โครงสร้างแผนก (va_departments) มีข้อมูลครบ
- [ ] Backup database ก่อน deploy

### Backend
- [ ] .env ใช้ค่า production
- [ ] JWT_SECRET ≥ 32 characters
- [ ] CORS_ORIGIN ตรงกับ Frontend URL
- [ ] ทดสอบ `GET /api/health` → `{ status: "ok" }`
- [ ] ทดสอบ Login ได้ token
- [ ] PM2 / Azure App Service รันอยู่

### Frontend
- [ ] `USE_API = true` ใน `src/lib/api.ts`
- [ ] `API_BASE_URL` ชี้ไป production backend
- [ ] ลบ demoUsers / demoProposals
- [ ] ทดสอบ Login → Dashboard → สร้างเอกสาร → อนุมัติ
- [ ] Publish บน Lovable

### Security
- [ ] HTTPS ทั้ง Frontend + Backend
- [ ] Password ใช้ bcrypt hash (salt 12)
- [ ] SQL Injection ป้องกันด้วย parameterized queries
- [ ] Rate limiting เปิดใช้
- [ ] Helmet middleware เปิดใช้

---

> 📌 **ดูโค้ด Backend:** `docs/backend/api-routes.ts`  
> 📌 **ดู SQL Scripts:** `docs/database/001_create_tables.sql` → `003_complete_schema.sql`  
> 📌 **ดู API Publish Guide:** `docs/API_PUBLISH_GUIDE.md`
