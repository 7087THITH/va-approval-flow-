/**
 * ─────────────────────────────────────────────────
 * VA Proposal Workflow — Node.js/Express Backend
 * ─────────────────────────────────────────────────
 * 
 * File: server/src/routes/index.ts
 * Host: 192.168.213.207:3001
 * Database: PostgreSQL (192.168.213.207:5432, schema: pud, prefix: va_)
 * 
 * SETUP INSTRUCTIONS:
 * ─────────────────
 * 1. mkdir va-backend && cd va-backend
 * 2. npm init -y
 * 3. npm install express cors helmet morgan jsonwebtoken bcryptjs pg dotenv multer
 * 4. npm install -D typescript @types/express @types/node @types/cors @types/jsonwebtoken @types/bcryptjs @types/pg ts-node nodemon
 * 5. Copy this file structure
 * 6. Create .env (see below)
 * 7. Run migrations: psql -h 192.168.213.207 -U va_admin -d va_proposal -f docs/database/001_create_tables.sql
 * 8. npm run dev
 * 
 * .env file:
 * ─────────
 * PORT=3001
 * DB_HOST=192.168.213.207
 * DB_PORT=5432
 * DB_NAME=va_proposal
 * DB_USER=va_admin
 * DB_PASSWORD=your_password
 * DB_SCHEMA=pud
 * JWT_SECRET=your-jwt-secret-key-min-32-chars
 * JWT_EXPIRES_IN=8h
 * CORS_ORIGIN=http://192.168.213.207:5173
 * 
 * Directory Structure:
 * ────────────────────
 * va-backend/
 * ├── .env
 * ├── package.json
 * ├── tsconfig.json
 * ├── src/
 * │   ├── index.ts          (app entry)
 * │   ├── config/
 * │   │   └── database.ts   (pg pool)
 * │   ├── middleware/
 * │   │   ├── auth.ts       (JWT verify)
 * │   │   └── validate.ts   (request validation)
 * │   ├── routes/
 * │   │   ├── auth.ts
 * │   │   ├── proposals.ts
 * │   │   ├── users.ts
 * │   │   ├── departments.ts
 * │   │   ├── vaCalculate.ts
 * │   │   └── permissions.ts
 * │   ├── services/
 * │   │   ├── authService.ts
 * │   │   ├── proposalService.ts
 * │   │   └── notificationService.ts
 * │   └── types/
 * │       └── index.ts
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// src/index.ts — App Entry Point
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/*
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth';
import { proposalRoutes } from './routes/proposals';
import { userRoutes } from './routes/users';
import { departmentRoutes } from './routes/departments';
import { vaCalculateRoutes } from './routes/vaCalculate';
import { permissionRoutes } from './routes/permissions';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/va-calculate', vaCalculateRoutes);
app.use('/api/permissions', permissionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`VA Backend API running on port ${PORT}`);
});
*/

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// src/config/database.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/*
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Set schema search path
pool.on('connect', (client) => {
  client.query(`SET search_path TO ${process.env.DB_SCHEMA || 'pud'}, public`);
});

export async function query(text: string, params?: any[]) {
  const result = await pool.query(text, params);
  return result;
}
*/

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// src/middleware/auth.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/*
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
*/

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// src/routes/auth.ts — Authentication
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/*
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

export const authRoutes = Router();

// POST /api/auth/login
authRoutes.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query(
      'SELECT id, email, name, name_th, role, department, department_th, plant, password_hash FROM va_users WHERE email = $1 AND is_active = true',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // Store session
    await query(
      'INSERT INTO va_sessions (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'8 hours\')',
      [user.id, token]
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nameTh: user.name_th,
        role: user.role,
        department: user.department,
        departmentTh: user.department_th,
        plant: user.plant,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
authRoutes.post('/logout', authenticate, async (req: AuthRequest, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  await query('DELETE FROM va_sessions WHERE token = $1', [token]);
  res.json({ success: true });
});

// GET /api/auth/profile
authRoutes.get('/profile', authenticate, async (req: AuthRequest, res) => {
  const result = await query(
    'SELECT id, email, name, name_th, role, department, department_th, plant FROM va_users WHERE id = $1',
    [req.user!.id]
  );
  res.json(result.rows[0]);
});
*/

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// src/routes/proposals.ts — Proposals CRUD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/*
import { Router } from 'express';
import { query } from '../config/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

export const proposalRoutes = Router();
proposalRoutes.use(authenticate);

// GET /api/proposals
proposalRoutes.get('/', async (req: AuthRequest, res) => {
  const { status, search } = req.query;
  let sql = 'SELECT * FROM va_proposals WHERE 1=1';
  const params: any[] = [];

  if (status) {
    params.push(status);
    sql += ` AND status = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (proposal_no ILIKE $${params.length} OR part_name ILIKE $${params.length})`;
  }
  sql += ' ORDER BY created_at DESC';

  const result = await query(sql, params);
  res.json(result.rows);
});

// GET /api/proposals/:id
proposalRoutes.get('/:id', async (req, res) => {
  const result = await query(
    `SELECT p.*, 
      json_agg(DISTINCT jsonb_build_object(
        'id', s.id, 'order', s.step_order, 'approverId', s.approver_id, 
        'approverName', u.name, 'status', s.status, 'judgement', s.judgement,
        'comment', s.comment, 'actionAt', s.action_at
      )) AS steps,
      json_agg(DISTINCT jsonb_build_object(
        'id', a.id, 'name', a.file_name, 'url', a.file_url, 
        'size', a.file_size, 'type', a.file_type
      )) FILTER (WHERE a.id IS NOT NULL) AS attachments
    FROM va_proposals p
    LEFT JOIN va_approval_steps s ON s.proposal_id = p.id
    LEFT JOIN va_users u ON u.id = s.approver_id
    LEFT JOIN va_attachments a ON a.proposal_id = p.id
    WHERE p.id = $1
    GROUP BY p.id`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Proposal not found' });
  }
  res.json(result.rows[0]);
});

// POST /api/proposals
proposalRoutes.post('/', async (req: AuthRequest, res) => {
  const { 
    confidentiality, partName, partModel, relatedDrawingNo,
    supplierManufacturer, changeType, initialProductionDate,
    beforeCost, afterCost, volumePerYear, currency,
    requestContents, distributionList, notes, status,
    approvalRouteType, approvers 
  } = req.body;

  const costDiff = afterCost - beforeCost;
  const annualContribution = (volumePerYear * costDiff) / 1000;
  const proposalNo = status === 'pending' 
    ? await generateProposalNo() 
    : null;

  const result = await query(
    `INSERT INTO va_proposals (
      proposal_no, confidentiality, requester_id, department, plant,
      part_name, part_model, related_drawing_no, supplier_manufacturer,
      change_type, initial_production_date,
      before_cost, after_cost, cost_difference, volume_per_year, 
      annual_contribution, currency,
      request_contents, distribution_list, notes, status,
      approval_route_type
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) 
    RETURNING *`,
    [
      proposalNo, confidentiality, req.user!.id, 
      req.body.department, req.body.plant,
      partName, partModel, relatedDrawingNo, supplierManufacturer,
      JSON.stringify(changeType), initialProductionDate,
      beforeCost, afterCost, costDiff, volumePerYear,
      annualContribution, currency,
      JSON.stringify(requestContents), JSON.stringify(distributionList),
      notes, status, approvalRouteType
    ]
  );

  const proposal = result.rows[0];

  // Create approval steps
  if (approvers && approvers.length > 0) {
    for (let i = 0; i < approvers.length; i++) {
      await query(
        `INSERT INTO va_approval_steps (proposal_id, approver_id, step_order, status)
         VALUES ($1, $2, $3, 'pending')`,
        [proposal.id, approvers[i], i + 1]
      );
    }
  }

  // Audit log
  await query(
    `INSERT INTO va_audit_log (proposal_id, user_id, action, details)
     VALUES ($1, $2, $3, $4)`,
    [proposal.id, req.user!.id, 'created', `Proposal created with status: ${status}`]
  );

  res.status(201).json(proposal);
});

// POST /api/proposals/batch
proposalRoutes.post('/batch', async (req: AuthRequest, res) => {
  const { items, approvers, approvalRouteType, status } = req.body;
  const created = [];

  for (const item of items) {
    // Same logic as single create but in a loop
    const costDiff = item.afterCost - item.beforeCost;
    const proposalNo = status === 'pending' ? await generateProposalNo() : null;

    const result = await query(
      `INSERT INTO va_proposals (
        proposal_no, confidentiality, requester_id, department, plant,
        part_name, part_model, supplier_manufacturer, change_type,
        before_cost, after_cost, cost_difference, volume_per_year,
        annual_contribution, currency, request_contents, notes, status,
        approval_route_type
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING *`,
      [
        proposalNo, item.confidentiality, req.user!.id,
        req.body.department, req.body.plant,
        item.partName, item.partModel, item.supplierManufacturer,
        JSON.stringify(item.changeType),
        item.beforeCost, item.afterCost, costDiff, item.volumePerYear,
        (item.volumePerYear * costDiff) / 1000, item.currency,
        JSON.stringify(item.requestContents), item.notes, status,
        approvalRouteType
      ]
    );

    // Create steps for each proposal
    for (let i = 0; i < (approvers || []).length; i++) {
      await query(
        `INSERT INTO va_approval_steps (proposal_id, approver_id, step_order, status)
         VALUES ($1, $2, $3, 'pending')`,
        [result.rows[0].id, approvers[i], i + 1]
      );
    }
    created.push(result.rows[0]);
  }

  res.status(201).json({ count: created.length, proposals: created });
});

// PUT /api/proposals/:id
proposalRoutes.put('/:id', async (req: AuthRequest, res) => {
  // Full update logic — same fields as create
  res.json({ message: 'Updated' });
});

// DELETE /api/proposals/:id
proposalRoutes.delete('/:id', async (req: AuthRequest, res) => {
  await query('DELETE FROM va_proposals WHERE id = $1 AND requester_id = $2 AND status = \'draft\'',
    [req.params.id, req.user!.id]);
  res.json({ success: true });
});

// POST /api/proposals/:id/approve
proposalRoutes.post('/:id/approve', async (req: AuthRequest, res) => {
  const { judgement, comment } = req.body;
  
  // Update the current step
  await query(
    `UPDATE va_approval_steps SET status = $1, judgement = $2, comment = $3, action_at = NOW()
     WHERE proposal_id = $4 AND approver_id = $5 AND status = 'pending'`,
    [
      judgement === 'approve' ? 'approved' : judgement === 'reject' ? 'rejected' : 'pending',
      judgement, comment, req.params.id, req.user!.id
    ]
  );

  // Check if all steps are approved
  const pendingSteps = await query(
    `SELECT COUNT(*) FROM va_approval_steps WHERE proposal_id = $1 AND status = 'pending'`,
    [req.params.id]
  );

  if (Number(pendingSteps.rows[0].count) === 0 && judgement === 'approve') {
    await query('UPDATE va_proposals SET status = \'approved\' WHERE id = $1', [req.params.id]);
  } else if (judgement === 'reject') {
    await query('UPDATE va_proposals SET status = \'rejected\' WHERE id = $1', [req.params.id]);
  } else if (judgement === 'return' || judgement === 'return_update') {
    await query('UPDATE va_proposals SET status = \'returned\' WHERE id = $1', [req.params.id]);
    // Reset all steps
    await query(
      `UPDATE va_approval_steps SET status = 'pending', judgement = NULL, comment = NULL, action_at = NULL
       WHERE proposal_id = $1`,
      [req.params.id]
    );
  }

  res.json({ success: true });
});

// POST /api/proposals/:id/dispatch (R&D Center)
proposalRoutes.post('/:id/dispatch', requireRole('admin', 'approver'), async (req: AuthRequest, res) => {
  const { assignedTeams, assignedMembers, notes } = req.body;

  await query(
    `INSERT INTO va_rd_assignments (proposal_id, assigned_by, teams, members, notes)
     VALUES ($1, $2, $3, $4, $5)`,
    [req.params.id, req.user!.id, JSON.stringify(assignedTeams), JSON.stringify(assignedMembers), notes]
  );

  // Create notifications for requester and route members
  // ... notification logic

  res.json({ success: true });
});

async function generateProposalNo(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await query(
    `SELECT COUNT(*) + 1 as next_num FROM va_proposals WHERE EXTRACT(YEAR FROM created_at) = $1 AND proposal_no IS NOT NULL`,
    [year]
  );
  const num = String(result.rows[0].next_num).padStart(3, '0');
  return `VA-${year}-${num}`;
}
*/

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// src/routes/users.ts — User Management
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/*
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

export const userRoutes = Router();
userRoutes.use(authenticate);
userRoutes.use(requireRole('admin'));

// GET /api/users
userRoutes.get('/', async (req, res) => {
  const result = await query(
    'SELECT id, email, name, name_th, role, department, department_th, plant, is_active, created_at FROM va_users ORDER BY name'
  );
  res.json(result.rows);
});

// POST /api/users
userRoutes.post('/', async (req, res) => {
  const { email, name, nameTh, role, department, departmentTh, plant, password } = req.body;
  const hash = await bcrypt.hash(password, 12);
  const result = await query(
    `INSERT INTO va_users (email, name, name_th, role, department, department_th, plant, password_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, email, name, role, department`,
    [email, name, nameTh, role, department, departmentTh, plant, hash]
  );
  res.status(201).json(result.rows[0]);
});

// POST /api/users/bulk
userRoutes.post('/bulk', async (req, res) => {
  const { users } = req.body;
  const created = [];
  for (const u of users) {
    const hash = await bcrypt.hash(u.password || 'changeme123', 12);
    const result = await query(
      `INSERT INTO va_users (email, name, name_th, role, department, department_th, plant, password_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, name`,
      [u.email, u.name, u.nameTh, u.role || 'requester', u.department, u.departmentTh, u.plant, hash]
    );
    if (result.rows.length > 0) created.push(result.rows[0]);
  }
  res.json({ imported: created.length, users: created });
});

// PUT /api/users/:id
userRoutes.put('/:id', async (req, res) => {
  const { name, nameTh, role, department, departmentTh, plant } = req.body;
  await query(
    `UPDATE va_users SET name=$1, name_th=$2, role=$3, department=$4, department_th=$5, plant=$6, updated_at=NOW()
     WHERE id = $7`,
    [name, nameTh, role, department, departmentTh, plant, req.params.id]
  );
  res.json({ success: true });
});

// PUT /api/users/:id/password
userRoutes.put('/:id/password', async (req, res) => {
  const hash = await bcrypt.hash(req.body.newPassword, 12);
  await query('UPDATE va_users SET password_hash = $1 WHERE id = $2', [hash, req.params.id]);
  res.json({ success: true });
});

// DELETE /api/users/:id
userRoutes.delete('/:id', async (req, res) => {
  await query('UPDATE va_users SET is_active = false WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});
*/

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// src/routes/permissions.ts — Permission Control
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/*
import { Router } from 'express';
import { query } from '../config/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

export const permissionRoutes = Router();
permissionRoutes.use(authenticate);

// GET /api/permissions/roles
permissionRoutes.get('/roles', async (req, res) => {
  const result = await query('SELECT * FROM va_role_permissions ORDER BY role');
  res.json(result.rows);
});

// PUT /api/permissions/roles
permissionRoutes.put('/roles', requireRole('admin'), async (req, res) => {
  const { roleAccess } = req.body;
  // Update all role permissions
  for (const [role, pages] of Object.entries(roleAccess)) {
    await query(
      `INSERT INTO va_role_permissions (role, allowed_pages)
       VALUES ($1, $2)
       ON CONFLICT (role) DO UPDATE SET allowed_pages = $2`,
      [role, JSON.stringify(pages)]
    );
  }
  res.json({ success: true });
});

// GET /api/permissions/users/:id
permissionRoutes.get('/users/:id', async (req, res) => {
  const result = await query(
    'SELECT * FROM va_user_permissions WHERE user_id = $1',
    [req.params.id]
  );
  res.json(result.rows[0] || null);
});

// PUT /api/permissions/users/:id
permissionRoutes.put('/users/:id', requireRole('admin'), async (req, res) => {
  const { allowedPages } = req.body;
  await query(
    `INSERT INTO va_user_permissions (user_id, allowed_pages)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET allowed_pages = $2`,
    [req.params.id, JSON.stringify(allowedPages)]
  );
  res.json({ success: true });
});

// DELETE /api/permissions/users/:id (remove override)
permissionRoutes.delete('/users/:id', requireRole('admin'), async (req, res) => {
  await query('DELETE FROM va_user_permissions WHERE user_id = $1', [req.params.id]);
  res.json({ success: true });
});

// GET /api/permissions/check  (check current user access)
permissionRoutes.get('/check', async (req: AuthRequest, res) => {
  // First check user override
  const userPerm = await query(
    'SELECT allowed_pages FROM va_user_permissions WHERE user_id = $1',
    [req.user!.id]
  );
  if (userPerm.rows.length > 0) {
    return res.json({ pages: JSON.parse(userPerm.rows[0].allowed_pages) });
  }
  // Then check role
  const rolePerm = await query(
    'SELECT allowed_pages FROM va_role_permissions WHERE role = $1',
    [req.user!.role]
  );
  if (rolePerm.rows.length > 0) {
    return res.json({ pages: JSON.parse(rolePerm.rows[0].allowed_pages) });
  }
  res.json({ pages: [] });
});
*/

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FRONTEND: How to switch from Demo to Real API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/*
In src/lib/api.ts:

1. Change: const USE_API = true;
2. Change: const API_BASE_URL = 'http://192.168.213.207:3001/api';

In src/context/AppContext.tsx:

1. Remove demoUsers and demoProposals
2. Replace login() to call authApi.login()
3. Replace proposals with React Query + proposalsApi
4. Replace users with React Query + usersApi

Example:
─────────
import { authApi, setAuthToken } from '@/lib/api';

const login = async (email: string, password: string) => {
  const response = await authApi.login(email, password);
  if (response.success && response.data) {
    setAuthToken(response.data.token);
    setCurrentUser(response.data.user as User);
    return true;
  }
  return false;
};
*/

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DATABASE: Additional tables for permissions & R&D
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/*
-- Add to your PostgreSQL migrations:

CREATE TABLE IF NOT EXISTS pud.va_role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role VARCHAR(50) UNIQUE NOT NULL,
  allowed_pages JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pud.va_user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES pud.va_users(id) ON DELETE CASCADE,
  allowed_pages JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS pud.va_rd_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES pud.va_proposals(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES pud.va_users(id),
  teams JSONB DEFAULT '[]',
  members JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default role permissions
INSERT INTO pud.va_role_permissions (role, allowed_pages) VALUES
  ('requester', '["dashboard","create_proposal","batch_create","view_proposals","export","history"]'),
  ('approver', '["dashboard","view_proposals","approve","export","history"]'),
  ('admin', '["dashboard","create_proposal","batch_create","view_proposals","approve","admin","export","reports","projects","history"]'),
  ('procurement', '["dashboard","view_proposals","approve","export","reports","history"]')
ON CONFLICT (role) DO NOTHING;
*/

export {};
