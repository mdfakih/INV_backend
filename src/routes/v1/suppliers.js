const { Router } = require('express');
const { supabase } = require('../../db/supabase');
const { requireAuth } = require('../../middleware/auth');

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const search = (req.query.search || '').toString();
    const status = (req.query.status || '').toString();

    let query = supabase.from('suppliers').select('*');
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,contact_person.ilike.%${search}%`,
      );
    }
    if (status) query = query.eq('status', status);

    const { data, error } = await query.order('name', { ascending: true });
    if (error)
      return res
        .status(500)
        .json({ success: false, message: 'Failed to fetch suppliers' });
    return res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const b = req.body || {};
    const payload = {
      name: b.name,
      phone: b.phone,
      email: b.email,
      address: b.address || null,
      notes: b.notes || null,
      contact_person: b.contactPerson || null,
      status: b.status || 'active',
      created_by: req.user.userId,
    };
    const { data, error } = await supabase
      .from('suppliers')
      .insert(payload)
      .select('*')
      .single();
    if (error)
      return res.status(400).json({ success: false, message: error.message });
    return res.status(201).json({ success: true, data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
