const { Router } = require('express');
const { supabase } = require('../../db/supabase');
const { requireAuth, requireRole } = require('../../middleware/auth');

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  try {
    const { data, error } = await supabase.from('designs').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ success: false, message: 'Failed to fetch designs' });
    return res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const b = req.body || {};
    const payload = { name: b.name, number: b.number, image_url: b.imageUrl || '', prices: b.prices || [], default_stones: b.defaultStones || [], created_by: req.user.userId, updated_by: null, update_history: [] };
    const { data, error } = await supabase.from('designs').insert(payload).select('*').single();
    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.status(201).json({ success: true, data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const b = req.body || {};
    const update = { name: b.name, number: b.number, image_url: b.imageUrl, prices: b.prices, default_stones: b.defaultStones, updated_by: req.user.userId };
    const { data, error } = await supabase.from('designs').update(update).eq('id', id).select('*').single();
    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/bulk-delete', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const ids = req.body?.ids || [];
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'ids required' });
    const { error } = await supabase.from('designs').delete().in('id', ids);
    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.json({ success: true, message: 'Designs deleted' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;


