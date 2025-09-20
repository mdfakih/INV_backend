const { Router } = require('express');
const { supabase } = require('../../db/supabase');
const { requireAuth, requireRole } = require('../../middleware/auth');

const router = Router();

// Generate report summary (basic implementation)
router.get(
  '/generate',
  requireAuth,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const type = (req.query.type || 'all').toString();

      if (type === 'inventory') {
        const [stones, paper, plastic, tape] = await Promise.all([
          supabase.from('stones').select('*'),
          supabase.from('paper').select('*'),
          supabase.from('plastic').select('*'),
          supabase.from('tape').select('*'),
        ]);
        if (stones.error || paper.error || plastic.error || tape.error)
          return res
            .status(500)
            .json({
              success: false,
              message: 'Failed to generate inventory report',
            });
        return res.json({
          success: true,
          data: {
            stones: stones.data,
            papers: paper.data,
            plastics: plastic.data,
            tapes: tape.data,
          },
        });
      }

      if (type === 'users') {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, role, name, status, created_at')
          .order('created_at', { ascending: false });
        if (error)
          return res
            .status(500)
            .json({ success: false, message: 'Failed to fetch users' });
        return res.json({ success: true, data: { users: data } });
      }

      // default: orders
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error)
        return res
          .status(500)
          .json({ success: false, message: 'Failed to fetch orders' });
      return res.json({ success: true, data: { orders: data } });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  },
);

// Export report (CSV) basic
router.get('/export', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const type = (req.query.type || 'all').toString();
    const toCSV = (rows) => {
      if (!rows || rows.length === 0) return '';
      const headers = Object.keys(rows[0]);
      const lines = [headers.join(',')];
      for (const row of rows) {
        lines.push(
          headers
            .map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`)
            .join(','),
        );
      }
      return lines.join('\n');
    };

    let rows = [];
    if (type === 'users') {
      const { data } = await supabase
        .from('users')
        .select('name: name, email: email, role: role, created_at: created_at');
      rows = (data || []).map((u) => ({
        name: u.name,
        email: u.email,
        role: u.role,
        created_at: u.created_at,
      }));
    } else if (type === 'inventory') {
      const [stones, papers, plastics, tapes] = await Promise.all([
        supabase
          .from('stones')
          .select('name, number, color, size, quantity, unit'),
        supabase.from('paper').select('width, quantity, pieces_per_roll'),
        supabase.from('plastic').select('name, width, quantity'),
        supabase.from('tape').select('name, quantity'),
      ]);
      rows = [
        ...(stones.data || []).map((s) => ({ category: 'stone', ...s })),
        ...(papers.data || []).map((p) => ({ category: 'paper', ...p })),
        ...(plastics.data || []).map((p) => ({ category: 'plastic', ...p })),
        ...(tapes.data || []).map((t) => ({ category: 'tape', ...t })),
      ];
    } else {
      const { data } = await supabase
        .from('orders')
        .select('id, type, customer_name, phone, final_amount, created_at');
      rows = data || [];
    }

    const csv = toCSV(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=report-${type}.csv`,
    );
    return res.send(csv);
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to export report' });
  }
});

module.exports = router;
