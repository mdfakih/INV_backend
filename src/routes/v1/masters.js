const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { supabase } = require('../../db/supabase');
const { requireAuth, requireRole } = require('../../middleware/auth');

const router = Router();

router.get('/users', requireAuth, requireRole(['admin']), async (_req, res) => {
  const { data, error } = await supabase.from('users').select('id, email, role, name, status, created_at, updated_at').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  return res.json({ success: true, data });
});

router.post('/users', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const b = req.body || {};
    const { data: existing } = await supabase.from('users').select('id').eq('email', b.email).maybeSingle();
    if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });
    const password_hash = await bcrypt.hash(b.password, 10);
    const { data, error } = await supabase.from('users').insert({ email: b.email, password_hash, role: b.role || 'employee', name: b.name, status: 'active' }).select('id, email, role, name, status').single();
    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.status(201).json({ success: true, data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/users/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const b = req.body || {};
    const update = { role: b.role, name: b.name, status: b.status };
    const { data, error } = await supabase.from('users').update(update).eq('id', id).select('id, email, role, name, status').single();
    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;


