# VA Workflow Backend API

## สถาปัตยกรรม (Architecture)

```
React Frontend (Lovable)
       ↓ HTTP/REST
Node.js + Express API (Port 3001)
       ↓ pg driver
PostgreSQL Database (192.168.213.207:5432)
```

## 🚀 Quick Start

### 1. สร้างโปรเจค Backend

```bash
mkdir va-workflow-api
cd va-workflow-api
npm init -y
npm install express cors pg dotenv jsonwebtoken bcryptjs helmet morgan
npm install -D typescript @types/express @types/cors @types/pg @types/jsonwebtoken @types/bcryptjs ts-node nodemon
npx tsc --init
```

### 2. สร้างไฟล์ `.env`

```env
# Database
DB_HOST=192.168.213.207
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=pud
DB_PASSWORD=puddata
DB_SCHEMA=pud

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=8h

# Server
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### 3. สร้าง Database Tables

เปิด pgAdmin หรือ DBeaver เชื่อมต่อ PostgreSQL แล้วรัน SQL จากไฟล์:
```
docs/database/001_create_tables.sql
```

### 4. สร้างไฟล์ `tsconfig.json`

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
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

### 5. สร้างไฟล์ Backend

#### `src/db.ts` - Database Connection Pool

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
});

// Set schema search path
pool.on('connect', (client) => {
  client.query(`SET search_path TO ${process.env.DB_SCHEMA || 'pud'}, public`);
});

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}
```

#### `src/middleware/auth.ts` - JWT Authentication

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

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

#### `src/routes/auth.ts` - Authentication Routes

```typescript
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await query(
      'SELECT * FROM pud.va_users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // Save session
    await query(
      `INSERT INTO pud.va_sessions (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '8 hours')`,
      [user.id, token]
    );

    // Update last login
    await query(
      'UPDATE pud.va_users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.first_name + ' ' + user.last_name,
        nameTh: user.first_name_th ? user.first_name_th + ' ' + (user.last_name_th || '') : undefined,
        role: user.role,
        department: user.department_id,
        plant: user.plant,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (token) {
      await query('DELETE FROM pud.va_sessions WHERE token = $1', [token]);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT id, emp_code, email, first_name, last_name, role, department_id, plant FROM pud.va_users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

#### `src/routes/proposals.ts` - Proposal CRUD

```typescript
import { Router } from 'express';
import { query } from '../db';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/proposals
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status, search } = req.query;
    let sql = 'SELECT * FROM pud.va_proposals_view WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (part_name ILIKE $${params.length} OR proposal_no ILIKE $${params.length} OR requester_name ILIKE $${params.length})`;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get proposals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/proposals/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM pud.va_proposals_view WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Get approval steps
    const steps = await query(
      `SELECT s.*, u.first_name || ' ' || u.last_name as approver_name
       FROM pud.va_approval_steps s
       JOIN pud.va_approval_routes r ON r.id = s.route_id
       LEFT JOIN pud.va_users u ON u.id = s.approver_id
       WHERE r.proposal_id = $1
       ORDER BY s.step_order`,
      [req.params.id]
    );

    // Get attachments
    const attachments = await query(
      'SELECT * FROM pud.va_attachments WHERE proposal_id = $1',
      [req.params.id]
    );

    // Get audit log
    const auditLog = await query(
      `SELECT a.*, u.first_name || ' ' || u.last_name as user_name
       FROM pud.va_audit_log a
       LEFT JOIN pud.va_users u ON u.id = a.user_id
       WHERE a.proposal_id = $1
       ORDER BY a.created_at DESC`,
      [req.params.id]
    );

    res.json({
      ...result.rows[0],
      approvalSteps: steps.rows,
      attachments: attachments.rows,
      auditLog: auditLog.rows,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/proposals
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      confidentiality, partName, partModel, relatedDrawingNo,
      supplierManufacturer, changeType, initialProductionDate,
      beforeCost, afterCost, volumePerYear, currency,
      requestContents, distributionList, notes, status,
      approvalRouteType, approvers,
    } = req.body;

    // Generate proposal number if submitting
    let proposalNo = null;
    if (status === 'pending') {
      const noResult = await query('SELECT pud.generate_proposal_no() as proposal_no');
      proposalNo = noResult.rows[0].proposal_no;
    }

    const result = await query(
      `INSERT INTO pud.va_proposals (
        proposal_no, confidentiality, requester_id, part_name, part_model,
        related_drawing_no, supplier_manufacturer, change_type,
        initial_production_date, before_cost, after_cost, volume_per_year,
        currency, request_contents, distribution_list, notes, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *`,
      [proposalNo, confidentiality, req.userId, partName, partModel,
       relatedDrawingNo, supplierManufacturer, JSON.stringify(changeType),
       initialProductionDate, beforeCost, afterCost, volumePerYear,
       currency, JSON.stringify(requestContents), JSON.stringify(distributionList),
       notes, status || 'draft']
    );

    const proposalId = result.rows[0].id;

    // Create approval route
    if (approvers && approvers.length > 0) {
      const routeResult = await query(
        `INSERT INTO pud.va_approval_routes (proposal_id, route_type)
         VALUES ($1, $2) RETURNING id`,
        [proposalId, approvalRouteType || 'sequential']
      );

      const routeId = routeResult.rows[0].id;

      for (let i = 0; i < approvers.length; i++) {
        await query(
          `INSERT INTO pud.va_approval_steps (route_id, approver_id, step_order)
           VALUES ($1, $2, $3)`,
          [routeId, approvers[i], i + 1]
        );
      }
    }

    // Audit log
    await query(
      `INSERT INTO pud.va_audit_log (proposal_id, user_id, action)
       VALUES ($1, $2, $3)`,
      [proposalId, req.userId, status === 'pending' ? 'Submitted for approval' : 'Created draft']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create proposal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/proposals/:id
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { partName, partModel, relatedDrawingNo, supplierManufacturer,
      changeType, beforeCost, afterCost, volumePerYear, currency,
      requestContents, distributionList, notes, status } = req.body;

    // Generate proposal number if submitting from draft
    let proposalNoUpdate = '';
    const params: any[] = [];

    if (status === 'pending') {
      const current = await query('SELECT proposal_no FROM pud.va_proposals WHERE id = $1', [req.params.id]);
      if (!current.rows[0]?.proposal_no) {
        const noResult = await query('SELECT pud.generate_proposal_no() as proposal_no');
        params.push(noResult.rows[0].proposal_no);
        proposalNoUpdate = `, proposal_no = $${params.length}`;
      }
    }

    const result = await query(
      `UPDATE pud.va_proposals SET
        part_name = $1, part_model = $2, related_drawing_no = $3,
        supplier_manufacturer = $4, change_type = $5,
        before_cost = $6, after_cost = $7, volume_per_year = $8,
        currency = $9, request_contents = $10, distribution_list = $11,
        notes = $12, status = $13, updated_at = NOW() ${proposalNoUpdate}
       WHERE id = $${14 + params.length}
       RETURNING *`,
      [partName, partModel, relatedDrawingNo, supplierManufacturer,
       JSON.stringify(changeType), beforeCost, afterCost, volumePerYear,
       currency, JSON.stringify(requestContents), JSON.stringify(distributionList),
       notes, status, ...params, req.params.id]
    );

    // Audit log
    await query(
      `INSERT INTO pud.va_audit_log (proposal_id, user_id, action)
       VALUES ($1, $2, $3)`,
      [req.params.id, req.userId, 'Updated proposal']
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update proposal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/proposals/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM pud.va_proposals WHERE id = $1 AND requester_id = $2', [req.params.id, req.userId]);
    res.json({ message: 'Proposal deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/proposals/:id/approve
router.post('/:id/approve', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { judgement, comment } = req.body;

    // Update the approval step
    await query(
      `UPDATE pud.va_approval_steps SET
        status = $1, judgement = $2, comment = $3, action_at = NOW()
       WHERE approver_id = $4 AND status = 'pending'
       AND route_id IN (SELECT id FROM pud.va_approval_routes WHERE proposal_id = $5)`,
      [judgement === 'approve' ? 'approved' : judgement === 'reject' ? 'rejected' : 'pending',
       judgement, comment, req.userId, req.params.id]
    );

    // Handle return actions - reset all steps
    if (judgement === 'return' || judgement === 'return_update') {
      await query(
        `UPDATE pud.va_approval_steps SET status = 'pending', judgement = NULL, comment = NULL, action_at = NULL
         WHERE route_id IN (SELECT id FROM pud.va_approval_routes WHERE proposal_id = $1)`,
        [req.params.id]
      );
      await query(
        `UPDATE pud.va_proposals SET status = 'returned', current_step_index = 0, updated_at = NOW() WHERE id = $1`,
        [req.params.id]
      );
    } else if (judgement === 'reject') {
      await query(
        `UPDATE pud.va_proposals SET status = 'rejected', judgement = $1, judgement_reason = $2, updated_at = NOW() WHERE id = $3`,
        [judgement, comment, req.params.id]
      );
    } else if (judgement === 'approve') {
      // Check if all steps are approved
      const pending = await query(
        `SELECT COUNT(*) as cnt FROM pud.va_approval_steps
         WHERE route_id IN (SELECT id FROM pud.va_approval_routes WHERE proposal_id = $1)
         AND status = 'pending'`,
        [req.params.id]
      );

      if (parseInt(pending.rows[0].cnt) === 0) {
        await query(
          `UPDATE pud.va_proposals SET status = 'approved', updated_at = NOW() WHERE id = $1`,
          [req.params.id]
        );
      } else {
        await query(
          `UPDATE pud.va_proposals SET current_step_index = current_step_index + 1, updated_at = NOW() WHERE id = $1`,
          [req.params.id]
        );
      }
    }

    // Audit log
    const actionLabel = judgement === 'approve' ? 'Approved' :
      judgement === 'reject' ? 'Rejected' :
      judgement === 'return' ? 'Returned to requester' :
      judgement === 'return_update' ? 'Returned for update' : 'Action taken';

    await query(
      `INSERT INTO pud.va_audit_log (proposal_id, user_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [req.params.id, req.userId, actionLabel, comment]
    );

    res.json({ message: 'Action recorded successfully' });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

#### `src/routes/users.ts` - User Management

```typescript
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/users
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT id, emp_code, email, first_name, last_name,
              first_name_th, last_name_th, role, department_id,
              plant, position, phone, is_active, created_at
       FROM pud.va_users ORDER BY first_name`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users
router.post('/', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { empCode, email, firstName, lastName, firstNameTh, lastNameTh,
      role, departmentId, plant, position, phone, password } = req.body;

    const passwordHash = await bcrypt.hash(password || 'default123', 10);

    const result = await query(
      `INSERT INTO pud.va_users (
        emp_code, email, first_name, last_name, first_name_th, last_name_th,
        role, department_id, plant, position, phone, password_hash
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id, emp_code, email, first_name, last_name, role`,
      [empCode, email, firstName, lastName, firstNameTh, lastNameTh,
       role, departmentId, plant, position, phone, passwordHash]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:id
router.put('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { empCode, email, firstName, lastName, firstNameTh, lastNameTh,
      role, departmentId, plant, position, phone } = req.body;

    const result = await query(
      `UPDATE pud.va_users SET
        emp_code = $1, email = $2, first_name = $3, last_name = $4,
        first_name_th = $5, last_name_th = $6, role = $7,
        department_id = $8, plant = $9, position = $10, phone = $11,
        updated_at = NOW()
       WHERE id = $12
       RETURNING id, emp_code, email, first_name, last_name, role`,
      [empCode, email, firstName, lastName, firstNameTh, lastNameTh,
       role, departmentId, plant, position, phone, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    await query('UPDATE pud.va_users SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:id/password - Change password (Admin)
router.put('/:id/password', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await query(
      'UPDATE pud.va_users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, req.params.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/bulk
router.post('/bulk', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { users } = req.body;
    const results = [];

    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password || 'default123', 10);
      try {
        const result = await query(
          `INSERT INTO pud.va_users (
            emp_code, email, first_name, last_name, role,
            department_id, plant, position, phone, password_hash, job_duty
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
          ON CONFLICT (email) DO NOTHING
          RETURNING id, email`,
          [user.empCode, user.email, user.firstName, user.lastName,
           user.role || 'requester', user.departmentId, user.plant,
           user.position, user.phone, passwordHash, user.jobDuty]
        );
        results.push({ email: user.email, success: result.rows.length > 0 });
      } catch {
        results.push({ email: user.email, success: false });
      }
    }

    res.json({ imported: results.filter(r => r.success).length, total: users.length, results });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

#### `src/routes/departments.ts` - Department API

```typescript
import { Router } from 'express';
import { query } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/departments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM pud.va_departments ORDER BY level, name'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/departments/tree
router.get('/tree', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      WITH RECURSIVE dept_tree AS (
        SELECT id, name, name_th, parent_id, level, 0 as depth
        FROM pud.va_departments WHERE parent_id IS NULL
        UNION ALL
        SELECT d.id, d.name, d.name_th, d.parent_id, d.level, dt.depth + 1
        FROM pud.va_departments d
        INNER JOIN dept_tree dt ON d.parent_id = dt.id
      )
      SELECT * FROM dept_tree ORDER BY depth, name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

#### `src/index.ts` - Main Server

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

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/va-calculate', vaCalculateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 VA Workflow API running on port ${PORT}`);
  console.log(`📦 Database: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
});
```

### 6. เพิ่ม scripts ใน `package.json`

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### 7. รัน Backend

```bash
# Development mode
npm run dev

# Production
npm run build
npm start
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login (email+password) | No |
| POST | `/api/auth/logout` | Logout | Yes |
| GET | `/api/auth/profile` | Get current user | Yes |
| GET | `/api/proposals` | List proposals | Yes |
| GET | `/api/proposals/:id` | Get proposal detail | Yes |
| POST | `/api/proposals` | Create proposal | Yes |
| PUT | `/api/proposals/:id` | Update proposal | Yes |
| DELETE | `/api/proposals/:id` | Delete proposal | Yes |
| POST | `/api/proposals/:id/approve` | Approve/Reject/Return | Yes |
| GET | `/api/users` | List users | Yes |
| POST | `/api/users` | Create user | Admin |
| PUT | `/api/users/:id` | Update user | Admin |
| DELETE | `/api/users/:id` | Deactivate user | Admin |
| POST | `/api/users/bulk` | Bulk import users | Admin |
| GET | `/api/departments` | List departments | Yes |
| GET | `/api/departments/tree` | Department tree | Yes |
| GET | `/api/va-calculate/settings` | List VA FY settings | Yes |
| GET | `/api/va-calculate/settings/:id` | Get setting by ID | Yes |
| POST | `/api/va-calculate/settings` | Create FY setting | Admin |
| PUT | `/api/va-calculate/settings/:id` | Update FY setting | Admin |
| DELETE | `/api/va-calculate/settings/:id` | Delete FY setting | Admin |
| GET | `/api/va-calculate/monthly?fy=` | Monthly summary | Yes |
| PUT | `/api/va-calculate/monthly-targets/:settingId/:monthIndex` | Update monthly target | Admin |
| GET | `/api/va-calculate/credit-notes` | List credit notes | Yes |
| POST | `/api/va-calculate/credit-notes` | Create credit note | Yes |
| PUT | `/api/va-calculate/credit-notes/:id` | Update credit note | Yes |
| GET | `/api/va-calculate/items` | List calculation items | Yes |
| POST | `/api/va-calculate/items` | Create calculation item | Yes |
| PUT | `/api/va-calculate/items/:id` | Update calculation item | Yes |
| DELETE | `/api/va-calculate/items/:id` | Delete calculation item | Admin |
| POST | `/api/va-calculate/recalculate/:settingId` | Recalculate monthly results | Admin |
| PUT | `/api/users/:id/password` | Change user password | Admin |

---

## 🔗 เชื่อมต่อ Frontend

ใน Frontend ไฟล์ `src/lib/api.ts`:
1. เปลี่ยน `API_BASE_URL` เป็น URL ของ Backend API
2. เปลี่ยน `USE_API = true`

```typescript
const API_BASE_URL = 'http://192.168.213.207:3001/api';
const USE_API = true;
```

---

## 🔧 VSCode Extensions ที่แนะนำ

1. **Database Client** - weijan.vscode-database-client2
2. **SQLTools** - mtxr.sqltools + PostgreSQL driver
3. **Thunder Client** - rangav.vscode-thunder-client (API testing)
4. **REST Client** - humao.rest-client

### การเชื่อมต่อ DB ใน VSCode

1. ติดตั้ง Extension "Database Client"
2. คลิก Database icon ที่ sidebar
3. กด "+" สร้าง connection:
   - Type: PostgreSQL
   - Host: 192.168.213.207
   - Port: 5432
   - Username: pud
   - Password: puddata
   - Database: (ชื่อ database ของคุณ)
   - Schema: pud
4. คลิก Connect

---

## 🧪 ทดสอบ API (Thunder Client / curl)

```bash
# Login
curl -X POST http://192.168.213.207:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@daikin.com","password":"demo123"}'

# Get proposals (ใช้ token จาก login)
curl http://192.168.213.207:3001/api/proposals \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create proposal
curl -X POST http://192.168.213.207:3001/api/proposals \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"partName":"Test Part","status":"draft","beforeCost":100,"afterCost":80,"volumePerYear":1000,"currency":"JPY"}'
```
