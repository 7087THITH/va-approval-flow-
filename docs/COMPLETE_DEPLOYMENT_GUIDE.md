# 📘 VA Workflow — Complete Deployment Guide

> ฉบับสมบูรณ์: Database, Backend, Frontend, Docker, Public API — อัพเดท 2026-02-14

---

## 📋 สถาปัตยกรรมระบบ

```
┌─────────────────┐    HTTP/JSON    ┌──────────────────┐    SQL    ┌───────────────┐
│  React Frontend  │ ◄────────────► │  Express Backend  │ ◄──────► │  PostgreSQL   │
│  (Lovable)       │   JWT Token    │  Port 3001        │          │  Schema: pud  │
│                  │                │  /api/*           │          │  Port 5432    │
└─────────────────┘                └──────────────────┘          └───────────────┘
```

### User Roles
| Role | คำอธิบาย |
|------|----------|
| `admin` | จัดการระบบทั้งหมด |
| `requester` | สร้างและส่ง VA Proposal |
| `approver` | อนุมัติ/ปฏิเสธเอกสาร |
| `procurement` | ฝ่ายจัดซื้อ |
| `va_team` | VA Team คัดกรองเอกสารด่านแรก |

---

## ขั้นตอนที่ 1: สร้าง PostgreSQL Database

### 1.1 ติดตั้ง PostgreSQL 15+

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y postgresql-15 postgresql-client-15

# macOS (Homebrew)
brew install postgresql@15

# Windows — ดาวน์โหลดจาก https://www.postgresql.org/download/windows/
```

### 1.2 สร้าง Database และ User

```bash
sudo -u postgres psql

CREATE DATABASE va_system;
CREATE USER pud WITH PASSWORD 'puddata';
GRANT ALL PRIVILEGES ON DATABASE va_system TO pud;
\c va_system
CREATE SCHEMA pud AUTHORIZATION pud;
GRANT ALL ON SCHEMA pud TO pud;
\q
```

### 1.3 รัน Migration Scripts (ตามลำดับ!)

```bash
# Step 1: ตารางหลัก (8 tables + 2 views + 2 functions)
psql -h localhost -U pud -d va_system -f docs/database/001_create_tables.sql

# Step 2: ตาราง VA Calculate (5 tables + 2 views + 1 function)
psql -h localhost -U pud -d va_system -f docs/database/002_va_calculate_tables.sql

# Step 3: ตาราง Permission, R&D, Notifications (4 tables)
psql -h localhost -U pud -d va_system -f docs/database/003_complete_schema.sql
```

### 1.4 เพิ่มคอลัมน์ VA Check Sheet

```sql
ALTER TABLE pud.va_proposals
  ADD COLUMN IF NOT EXISTS va_check_sheet JSONB DEFAULT NULL;

COMMENT ON COLUMN pud.va_proposals.va_check_sheet IS 'VA Team Information Check Sheet (8 items)';
```

### 1.5 ตรวจสอบตาราง (ต้องเห็น 17 tables)

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'pud' AND table_name LIKE 'va_%'
ORDER BY table_name;
```

### 1.6 สร้าง Admin User คนแรก

```bash
# สร้าง hash ด้วย bcrypt
npx -y bcryptjs-cli hash "075727"
```

```sql
INSERT INTO pud.va_users (emp_code, email, first_name, last_name, password_hash, role, department_id, position)
VALUES ('ADMIN001', 'thitichot@dit.daikin.co.jp', 'Thitichot', '',
  '$2b$10$YOUR_BCRYPT_HASH_HERE', 'admin', 'PROCUREMENT STRATEGY SUB-GROUP', 'EN');
```

### 1.7 สร้าง VA Team Member

```sql
INSERT INTO pud.va_users (emp_code, email, first_name, last_name, password_hash, role, department_id)
VALUES ('VA001', 'vateam@daikin.com', 'VA', 'Screener',
  '$2b$10$YOUR_HASH', 'va_team', 'VA TEAM');
```

---

## ขั้นตอนที่ 2: สร้าง Backend (Node.js + Express)

### 2.1 สร้างโปรเจค

```bash
mkdir va-workflow-api && cd va-workflow-api
npm init -y
npm install express cors pg dotenv jsonwebtoken bcryptjs helmet morgan multer
npm install -D typescript @types/express @types/cors @types/pg \
  @types/jsonwebtoken @types/bcryptjs @types/node ts-node nodemon
npx tsc --init
```

### 2.2 สร้างไฟล์ `.env`

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=va_system
DB_USER=pud
DB_PASSWORD=puddata
DB_SCHEMA=pud
JWT_SECRET=your-jwt-secret-key-min-32-chars-change-in-production
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### 2.3 โครงสร้างไฟล์

```
va-workflow-api/
├── .env
├── .env.production
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              ← Main entry + Express setup
│   ├── db.ts                 ← PostgreSQL pool connection
│   ├── middleware/
│   │   ├── auth.ts           ← JWT verify + role check
│   │   └── validate.ts       ← Request validation
│   └── routes/
│       ├── auth.ts           ← POST login/logout, GET profile
│       ├── proposals.ts      ← CRUD + approve + dispatch + va-check
│       ├── users.ts          ← CRUD + bulk import
│       ├── departments.ts    ← GET tree structure
│       ├── vaCalculate.ts    ← Settings, monthly, credit notes
│       ├── permissions.ts    ← Role & user permission CRUD
│       └── notifications.ts  ← GET/PUT notifications
```

### 2.4 โค้ดอ้างอิง

ดูไฟล์ `docs/backend/README.md` และ `docs/backend/api-routes.ts` สำหรับโค้ด Backend ทั้งหมด

### 2.5 package.json scripts

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit"
  }
}
```

### 2.6 รัน Backend (Development)

```bash
npm run dev
# → http://localhost:3001/api/health → { "status": "ok" }
```

---

## ขั้นตอนที่ 3: เชื่อม Frontend กับ Backend

### 3.1 เปลี่ยนค่าใน `src/lib/api.ts`

```typescript
// เปลี่ยน:
const API_BASE_URL = 'http://YOUR_SERVER_IP:3001/api';
const USE_API = true;
```

### 3.2 ตรวจสอบ CORS

Backend `.env` → `CORS_ORIGIN` ต้องตรงกับ URL ของ Frontend:
- Development: `http://localhost:5173`
- Production: `https://your-project.lovable.app`

---

## ขั้นตอนที่ 4: API Endpoints ทั้งหมด

### Auth
| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| `POST` | `/api/auth/login` | เข้าสู่ระบบ → JWT token |
| `POST` | `/api/auth/logout` | ออกจากระบบ |
| `GET` | `/api/auth/profile` | ข้อมูล user ปัจจุบัน |

### Proposals
| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| `GET` | `/api/proposals` | รายการเอกสาร (?status=, ?search=) |
| `GET` | `/api/proposals/:id` | รายละเอียด + steps + attachments |
| `POST` | `/api/proposals` | สร้างเอกสาร (draft/pending) |
| `POST` | `/api/proposals/batch` | สร้างหลายฉบับพร้อมกัน |
| `PUT` | `/api/proposals/:id` | แก้ไขเอกสาร |
| `DELETE` | `/api/proposals/:id` | ลบเอกสาร (draft only) |
| `POST` | `/api/proposals/:id/approve` | อนุมัติ/ปฏิเสธ/คืน/ส่งประเมิน |
| `POST` | `/api/proposals/:id/dispatch` | R&D Center มอบหมายทีม |
| `PUT` | `/api/proposals/:id/va-check` | VA Team อัพเดท Check Sheet |

### Users
| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| `GET` | `/api/users` | รายชื่อ user ทั้งหมด |
| `POST` | `/api/users` | สร้าง user |
| `POST` | `/api/users/bulk` | อัพโหลดหลายคน (Excel/CSV) |
| `PUT` | `/api/users/:id` | แก้ไข user |
| `DELETE` | `/api/users/:id` | ลบ user |
| `PUT` | `/api/users/:id/password` | เปลี่ยนรหัสผ่าน |

### Departments
| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| `GET` | `/api/departments` | รายชื่อแผนก |
| `GET` | `/api/departments/tree` | โครงสร้างแผนกแบบ tree |

### VA Calculate
| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| `GET` | `/api/va-calculate/settings` | ตั้งค่า FY |
| `POST` | `/api/va-calculate/settings` | สร้างตั้งค่า FY ใหม่ |
| `PUT` | `/api/va-calculate/settings/:id` | แก้ไขตั้งค่า |
| `GET` | `/api/va-calculate/monthly?fy=` | สรุปรายเดือน |
| `GET` | `/api/va-calculate/credit-notes` | รายการ Credit Note |
| `POST` | `/api/va-calculate/credit-notes` | สร้าง Credit Note |
| `POST` | `/api/va-calculate/recalculate/:id` | คำนวณผลใหม่ |

### Permissions
| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| `GET` | `/api/permissions/roles` | สิทธิ์ตาม Role |
| `PUT` | `/api/permissions/roles/:role` | อัพเดทสิทธิ์ Role |
| `GET` | `/api/permissions/users/:id` | สิทธิ์เฉพาะ user |
| `PUT` | `/api/permissions/users/:id` | อัพเดทสิทธิ์ user |

### Notifications
| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| `GET` | `/api/notifications` | แจ้งเตือนของ user |
| `PUT` | `/api/notifications/:id/read` | อ่านแล้ว |
| `PUT` | `/api/notifications/read-all` | อ่านทั้งหมด |

---

## ขั้นตอนที่ 5: Docker Deployment

### 5.1 Dockerfile (Backend)

```dockerfile
# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built output
COPY --from=builder /app/dist ./dist

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

EXPOSE 3001
USER node
CMD ["node", "dist/index.js"]
```

### 5.2 docker-compose.yml (Full Stack)

```yaml
version: '3.8'

services:
  # ─── PostgreSQL Database ───
  db:
    image: postgres:15-alpine
    container_name: va-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: va_system
      POSTGRES_USER: pud
      POSTGRES_PASSWORD: puddata
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./docs/database/001_create_tables.sql:/docker-entrypoint-initdb.d/01.sql
      - ./docs/database/002_va_calculate_tables.sql:/docker-entrypoint-initdb.d/02.sql
      - ./docs/database/003_complete_schema.sql:/docker-entrypoint-initdb.d/03.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pud -d va_system"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ─── Backend API ───
  api:
    build:
      context: ./va-workflow-api
      dockerfile: Dockerfile
    container_name: va-api
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      PORT: 3001
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: va_system
      DB_USER: pud
      DB_PASSWORD: puddata
      DB_SCHEMA: pud
      JWT_SECRET: ${JWT_SECRET:-change-me-in-production-min-32-chars}
      JWT_EXPIRES_IN: 8h
      CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost:5173}
      NODE_ENV: production
    ports:
      - "3001:3001"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3

volumes:
  pgdata:
```

### 5.3 .env.production (สำหรับ Docker)

```env
JWT_SECRET=your-production-secret-key-at-least-32-characters-long
CORS_ORIGIN=https://your-project.lovable.app
```

### 5.4 รัน Docker

```bash
# สร้างและรัน
docker compose --env-file .env.production up -d --build

# ตรวจสอบสถานะ
docker compose ps
docker compose logs -f api

# หยุด
docker compose down

# หยุดพร้อมลบ volume (⚠️ ลบข้อมูล DB!)
docker compose down -v
```

### 5.5 สร้าง Admin User หลัง Docker เริ่มต้น

```bash
# เข้า PostgreSQL container
docker compose exec db psql -U pud -d va_system

# สร้าง Admin
INSERT INTO pud.va_users (emp_code, email, first_name, last_name, password_hash, role, department_id, position)
VALUES ('ADMIN001', 'thitichot@dit.daikin.co.jp', 'Thitichot', '',
  '$2b$10$YOUR_BCRYPT_HASH', 'admin', 'PROCUREMENT STRATEGY SUB-GROUP', 'EN');
```

---

## ขั้นตอนที่ 6: Deploy to Production

### Option A: Azure App Service

```bash
# 1. สร้าง Resources
az group create --name va-workflow-rg --location southeastasia
az appservice plan create --name va-plan --resource-group va-workflow-rg --sku B1 --is-linux
az webapp create --name va-workflow-api --resource-group va-workflow-rg --plan va-plan --runtime "NODE:20-lts"

# 2. ตั้งค่า Environment
az webapp config appsettings set --name va-workflow-api --resource-group va-workflow-rg --settings \
  DB_HOST="your-db.postgres.database.azure.com" \
  DB_PORT="5432" DB_NAME="va_system" DB_USER="pud" DB_PASSWORD="puddata" \
  DB_SCHEMA="pud" JWT_SECRET="production-secret-min-32-chars" \
  JWT_EXPIRES_IN="8h" CORS_ORIGIN="https://your-project.lovable.app" \
  NODE_ENV="production"

# 3. Build & Deploy
cd va-workflow-api
npm run build
zip -r deploy.zip dist/ package.json package-lock.json node_modules/
az webapp deploy --name va-workflow-api --resource-group va-workflow-rg --src-path deploy.zip --type zip
```

### Option B: VPS / On-Premise (PM2)

```bash
# 1. Clone & Build
git clone <repo-url> va-workflow-api && cd va-workflow-api
npm install && npm run build

# 2. ติดตั้ง PM2
npm install -g pm2

# 3. สร้าง ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'va-api',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    max_memory_restart: '500M',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    merge_logs: true,
  }]
};
EOF

# 4. รันด้วย PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# 5. เปิด Firewall
sudo ufw allow 3001
```

### Option C: Docker (Production)

```bash
# 1. สร้าง .env.production
cat > .env.production << EOF
JWT_SECRET=$(openssl rand -hex 32)
CORS_ORIGIN=https://your-project.lovable.app
EOF

# 2. Build & Run
docker compose --env-file .env.production up -d --build

# 3. ตั้งค่า Nginx Reverse Proxy (แนะนำ)
# ดูไฟล์ nginx.conf ด้านล่าง
```

### Nginx Reverse Proxy (แนะนำสำหรับ Production)

```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# ติดตั้ง Nginx + SSL
sudo apt install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx -d api.your-domain.com
```

---

## ขั้นตอนที่ 7: Frontend Publish (Lovable)

1. แก้ `src/lib/api.ts`:
   ```typescript
   const API_BASE_URL = 'https://api.your-domain.com/api';
   const USE_API = true;
   ```
2. กดปุ่ม **Publish** บน Lovable
3. ตรวจสอบ `CORS_ORIGIN` ใน Backend ให้ตรงกับ Frontend URL

---

## ✅ Checklist สุดท้ายก่อน Go-Live

### Database
- [ ] รัน SQL 001 + 002 + 003 ครบ (17 tables)
- [ ] `ALTER TABLE` เพิ่ม `va_check_sheet JSONB`
- [ ] Admin user สร้างด้วย bcrypt hash จริง
- [ ] VA Team member สร้างแล้ว (role = 'va_team')
- [ ] โครงสร้างแผนก (va_departments) มีข้อมูลครบ
- [ ] Backup database ก่อน deploy

### Backend
- [ ] `.env` ใช้ค่า production
- [ ] JWT_SECRET ≥ 32 characters (ใช้ `openssl rand -hex 32`)
- [ ] CORS_ORIGIN ตรงกับ Frontend URL
- [ ] `GET /api/health` → `{ "status": "ok" }`
- [ ] Login ได้ JWT token
- [ ] Endpoint `PUT /api/proposals/:id/va-check` พร้อมใช้
- [ ] PM2 / Docker / Azure รันอยู่
- [ ] Nginx reverse proxy + SSL (production)

### Frontend
- [ ] `USE_API = true` ใน `src/lib/api.ts`
- [ ] `API_BASE_URL` ชี้ไป production backend
- [ ] ทดสอบ Login → Dashboard → สร้างเอกสาร → VA Team Check → อนุมัติ
- [ ] ทดสอบ Profile page → เปลี่ยนรูป → เปลี่ยนรหัสผ่าน
- [ ] Publish บน Lovable

### Security
- [ ] HTTPS ทั้ง Frontend + Backend
- [ ] Password ใช้ bcrypt hash (salt 12)
- [ ] SQL Injection ป้องกันด้วย parameterized queries
- [ ] Rate limiting เปิดใช้
- [ ] Helmet middleware เปิดใช้
- [ ] JWT_SECRET ไม่ commit ลง Git

---

> 📌 **โค้ด Backend:** `docs/backend/README.md` + `docs/backend/api-routes.ts`
> 📌 **SQL Scripts:** `docs/database/001` → `003`
> 📌 **Frontend API:** `src/lib/api.ts`
