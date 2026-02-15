# VA Calculate Backend Routes

## `src/routes/va-calculate.ts`

```typescript
import { Router } from 'express';
import { query } from '../db';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// ─────────────────────────────────────
// Settings (FY Configuration)
// ─────────────────────────────────────

// GET /api/va-calculate/settings
router.get('/settings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM pud.va_calculate_settings ORDER BY fiscal_year DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get VA settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/va-calculate/settings/:id
router.get('/settings/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM pud.va_calculate_settings WHERE id = $1',
      [req.params.id]
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
      `INSERT INTO pud.va_calculate_settings (
        fiscal_year, cd_goal, exchange_rate, cif_percent, fob_percent,
        currency, start_date, end_date, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [fiscalYear, cdGoal, exchangeRate, cifPercent, fobPercent, currency, startDate, endDate, req.userId]
    );

    const settingId = result.rows[0].id;

    // Auto-generate 12 monthly targets (Apr-Mar)
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const startYear = parseInt(startDate.substring(0, 4));

    for (let i = 0; i < 12; i++) {
      const year = i < 9 ? startYear : startYear + 1;
      const monthYear = `${months[i]}-${String(year).substring(2)}`;

      await query(
        `INSERT INTO pud.va_monthly_targets (setting_id, month_year, month_index)
         VALUES ($1, $2, $3)`,
        [settingId, monthYear, i + 1]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Fiscal year already exists' });
    }
    console.error('Create VA setting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/va-calculate/settings/:id
router.put('/settings/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { cdGoal, exchangeRate, cifPercent, fobPercent, currency, isActive } = req.body;

    // If setting is_active, deactivate all others
    if (isActive) {
      await query('UPDATE pud.va_calculate_settings SET is_active = false');
    }

    const result = await query(
      `UPDATE pud.va_calculate_settings SET
        cd_goal = COALESCE($1, cd_goal),
        exchange_rate = COALESCE($2, exchange_rate),
        cif_percent = COALESCE($3, cif_percent),
        fob_percent = COALESCE($4, fob_percent),
        currency = COALESCE($5, currency),
        is_active = COALESCE($6, is_active),
        updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [cdGoal, exchangeRate, cifPercent, fobPercent, currency, isActive, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update VA setting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/va-calculate/settings/:id
router.delete('/settings/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM pud.va_calculate_settings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Setting deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────
// Monthly Targets & Results
// ─────────────────────────────────────

// GET /api/va-calculate/monthly?fy=OB2024
router.get('/monthly', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { fy } = req.query;
    let sql = 'SELECT * FROM pud.va_monthly_summary_view';
    const params: any[] = [];

    if (fy) {
      params.push(fy);
      sql += ` WHERE fiscal_year = $${params.length}`;
    }

    sql += ' ORDER BY fiscal_year, month_index';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get monthly summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/va-calculate/monthly-targets/:settingId/:monthIndex
router.put('/monthly-targets/:settingId/:monthIndex', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { estimateCdTarget, targetCd, includedNewIdea } = req.body;

    const result = await query(
      `UPDATE pud.va_monthly_targets SET
        estimate_cd_target = COALESCE($1, estimate_cd_target),
        target_cd = COALESCE($2, target_cd),
        included_new_idea = COALESCE($3, included_new_idea),
        updated_at = NOW()
       WHERE setting_id = $4 AND month_index = $5
       RETURNING *`,
      [estimateCdTarget, targetCd, includedNewIdea, req.params.settingId, req.params.monthIndex]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Monthly target not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────
// Credit Notes
// ─────────────────────────────────────

// GET /api/va-calculate/credit-notes
router.get('/credit-notes', authenticateToken, async (req: AuthRequest, res) => {
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

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get credit notes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/va-calculate/credit-notes
router.post('/credit-notes', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      proposalId, vaNo, vaTheme, rank,
      applyMonthTarget, applyMonthActual,
      costdownTarget, costdownActual, costdownActualCds, costdownActualBuyer,
      dcsNo, dcsClass, buyerName, vaType, createIdeaBy,
      cnStatus, cnIssuedDate, cnNumber, notes
    } = req.body;

    const result = await query(
      `INSERT INTO pud.va_credit_notes (
        proposal_id, va_no, va_theme, rank,
        apply_month_target, apply_month_actual,
        costdown_target, costdown_actual, costdown_actual_cds, costdown_actual_buyer,
        dcs_no, dcs_class, buyer_name, va_type, create_idea_by,
        cn_status, cn_issued_date, cn_number, notes, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING *`,
      [proposalId, vaNo, vaTheme, rank,
       applyMonthTarget, applyMonthActual,
       costdownTarget, costdownActual, costdownActualCds, costdownActualBuyer,
       dcsNo, dcsClass, buyerName, vaType, createIdeaBy,
       cnStatus || 'pending', cnIssuedDate, cnNumber, notes, req.userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create credit note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/va-calculate/credit-notes/:id
router.put('/credit-notes/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      cnStatus, cnIssuedDate, cnNumber,
      costdownActual, costdownActualCds, costdownActualBuyer,
      applyMonthActual, notes
    } = req.body;

    const result = await query(
      `UPDATE pud.va_credit_notes SET
        cn_status = COALESCE($1, cn_status),
        cn_issued_date = COALESCE($2, cn_issued_date),
        cn_number = COALESCE($3, cn_number),
        costdown_actual = COALESCE($4, costdown_actual),
        costdown_actual_cds = COALESCE($5, costdown_actual_cds),
        costdown_actual_buyer = COALESCE($6, costdown_actual_buyer),
        apply_month_actual = COALESCE($7, apply_month_actual),
        notes = COALESCE($8, notes),
        updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [cnStatus, cnIssuedDate, cnNumber,
       costdownActual, costdownActualCds, costdownActualBuyer,
       applyMonthActual, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Credit note not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────
// Calculation Items
// ─────────────────────────────────────

// GET /api/va-calculate/items
router.get('/items', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { fy, month } = req.query;
    let sql = `
      SELECT ci.*, s.fiscal_year
      FROM pud.va_calculation_items ci
      JOIN pud.va_calculate_settings s ON s.id = ci.setting_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (fy) {
      params.push(fy);
      sql += ` AND s.fiscal_year = $${params.length}`;
    }
    if (month) {
      params.push(month);
      sql += ` AND ci.apply_month = $${params.length}`;
    }

    sql += ' ORDER BY ci.created_at DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get calculation items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/va-calculate/items
router.post('/items', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      proposalId, settingId, vaNo, partCategory, supplierName,
      drawingPart, buyerName, partName, vaTheme, exchangeRate,
      beforeCost, afterCost, volumePerYear,
      applyMonth, applyDate, rank, itemGroup
    } = req.body;

    const result = await query(
      `INSERT INTO pud.va_calculation_items (
        proposal_id, setting_id, va_no, part_category, supplier_name,
        drawing_part, buyer_name, part_name, va_theme, exchange_rate,
        before_cost, after_cost, volume_per_year,
        apply_month, apply_date, rank, item_group, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *`,
      [proposalId, settingId, vaNo, partCategory, supplierName,
       drawingPart, buyerName, partName, vaTheme, exchangeRate,
       beforeCost, afterCost, volumePerYear,
       applyMonth, applyDate, rank || 'C', itemGroup || 'General model', req.userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create calculation item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/va-calculate/items/:id
router.put('/items/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      partCategory, supplierName, drawingPart, buyerName, partName,
      vaTheme, exchangeRate, beforeCost, afterCost, volumePerYear,
      applyMonth, applyDate, rank, itemGroup
    } = req.body;

    const result = await query(
      `UPDATE pud.va_calculation_items SET
        part_category = COALESCE($1, part_category),
        supplier_name = COALESCE($2, supplier_name),
        drawing_part = COALESCE($3, drawing_part),
        buyer_name = COALESCE($4, buyer_name),
        part_name = COALESCE($5, part_name),
        va_theme = COALESCE($6, va_theme),
        exchange_rate = COALESCE($7, exchange_rate),
        before_cost = COALESCE($8, before_cost),
        after_cost = COALESCE($9, after_cost),
        volume_per_year = COALESCE($10, volume_per_year),
        apply_month = COALESCE($11, apply_month),
        apply_date = COALESCE($12, apply_date),
        rank = COALESCE($13, rank),
        item_group = COALESCE($14, item_group),
        updated_at = NOW()
       WHERE id = $15
       RETURNING *`,
      [partCategory, supplierName, drawingPart, buyerName, partName,
       vaTheme, exchangeRate, beforeCost, afterCost, volumePerYear,
       applyMonth, applyDate, rank, itemGroup, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Calculation item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/va-calculate/items/:id
router.delete('/items/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM pud.va_calculation_items WHERE id = $1', [req.params.id]);
    res.json({ message: 'Calculation item deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────
// Recalculate Monthly Results
// ─────────────────────────────────────

// POST /api/va-calculate/recalculate/:settingId
router.post('/recalculate/:settingId', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    // Verify setting exists
    const setting = await query(
      'SELECT id, fiscal_year FROM pud.va_calculate_settings WHERE id = $1',
      [req.params.settingId]
    );

    if (setting.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    // Call stored function to recalculate
    await query('SELECT pud.recalculate_monthly_results($1)', [req.params.settingId]);

    // Return updated results
    const results = await query(
      'SELECT * FROM pud.va_monthly_summary_view WHERE fiscal_year = $1 ORDER BY month_index',
      [setting.rows[0].fiscal_year]
    );

    res.json({
      message: 'Recalculation completed',
      fiscalYear: setting.rows[0].fiscal_year,
      data: results.rows,
    });
  } catch (error) {
    console.error('Recalculate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

## Frontend API Integration

ไฟล์ `src/lib/api.ts` มี `vaCalculateApi` พร้อมใช้งานแล้ว รองรับ:
- `getSettings()` / `getSettingById(id)` / `createSetting()` / `updateSetting()` / `deleteSetting()`
- `getMonthlySummary(fy)` / `updateMonthlyTarget()`
- `getCreditNotes()` / `createCreditNote()` / `updateCreditNote()`
- `getCalculationItems()` - รายการคำนวณ VA
- `recalculate(settingId)` - คำนวณ CD สะสมรายเดือนใหม่

## Database Tables ที่เกี่ยวข้อง

ดูที่ `docs/database/002_va_calculate_tables.sql`:
- `pud.va_calculate_settings` - ตั้งค่า FY
- `pud.va_monthly_targets` - เป้าหมายรายเดือน
- `pud.va_monthly_results` - ผลจริงรายเดือน
- `pud.va_credit_notes` - Credit Note tracking
- `pud.va_calculation_items` - รายการคำนวณ VA (costdown_per_unit + costdown_per_year auto-calculated)
- `pud.va_monthly_summary_view` - VIEW สรุป Target + Actual
- `pud.va_credit_notes_view` - VIEW Credit Note + Proposal data
- `pud.recalculate_monthly_results(setting_id)` - ฟังก์ชันคำนวณ CD สะสม
