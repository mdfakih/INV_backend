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
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error)
      return res
        .status(500)
        .json({ success: false, message: 'Failed to fetch orders' });
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
      type: b.type,
      customer_name: b.customerName,
      phone: b.phone,
      customer_id: b.customerId || null,
      gst_number: b.gstNumber || null,
      design_orders: b.designOrders || [],
      mode_of_payment: b.modeOfPayment || 'cash',
      payment_status: b.paymentStatus || 'pending',
      discount_type: b.discountType || 'percentage',
      discount_value: b.discountValue || 0,
      discounted_amount: b.discountedAmount || 0,
      final_amount: b.finalAmount || 0,
      notes: b.notes || null,
      created_by: req.user.userId,
    };
    const { data, error } = await supabase
      .from('orders')
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

// Get an order by id (used by invoice view)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data)
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    return res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
