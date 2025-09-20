const { Router } = require('express');
const { supabase } = require('../../db/supabase');
const { requireAuth } = require('../../middleware/auth');

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const page = parseInt((req.query.page || '1').toString(), 10);
    const limit = parseInt((req.query.limit || '10').toString(), 10);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await supabase
      .from('inventory_entries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error)
      return res
        .status(500)
        .json({ success: false, message: 'Failed to fetch inventory entries' });
    return res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
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
      inventory_type: b.inventoryType,
      items: b.items || [],
      supplier_id: b.supplierId || null,
      bill_number: b.billNumber || null,
      bill_date: b.billDate || null,
      entered_by: req.user.userId,
      approved_by: b.approvedBy || null,
      source_order_id: b.sourceOrderId || null,
      status: b.status || 'pending',
      notes: b.notes || null,
    };
    const { data, error } = await supabase
      .from('inventory_entries')
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
