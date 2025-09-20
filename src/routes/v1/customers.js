const { Router } = require('express');
const { supabase } = require('../../db/supabase');
const { requireAuth } = require('../../middleware/auth');

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const search = (req.query.search || '').toString();
    const page = parseInt((req.query.page || '1').toString(), 10);
    const limit = parseInt((req.query.limit || '10').toString(), 10);
    const customerType = req.query.customerType || null;
    const isActive =
      req.query.isActive === 'true'
        ? true
        : req.query.isActive === 'false'
        ? false
        : null;

    let query = supabase.from('customers').select('*', { count: 'exact' });
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`,
      );
    }
    if (customerType) query = query.eq('customer_type', customerType);
    if (isActive !== null) query = query.eq('is_active', isActive);

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch customers',
        error: error.message,
      });

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
      .json({ success: false, message: 'Failed to fetch customers' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const userId = req.user.userId;

    const { data: existing, error: existingErr } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', body.phone)
      .maybeSingle();
    if (existingErr)
      return res
        .status(500)
        .json({ success: false, message: 'Failed to check existing customer' });
    if (existing)
      return res.status(400).json({
        success: false,
        message: 'Customer with this phone number already exists',
      });

    const payload = {
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      address: body.address || null,
      company: body.company || null,
      gst_number: body.gstNumber || null,
      customer_type: body.customerType || 'retail',
      credit_limit: body.creditLimit || 0,
      payment_terms: body.paymentTerms || 'immediate',
      is_active: body.isActive !== false,
      notes: body.notes || null,
      tags: body.tags || [],
      created_by: userId,
      updated_by: null,
      update_history: [],
    };

    const { data, error } = await supabase
      .from('customers')
      .insert(payload)
      .select('*')
      .single();
    if (error)
      return res.status(500).json({
        success: false,
        message: 'Failed to create customer',
        error: error.message,
      });
    return res
      .status(201)
      .json({ success: true, message: 'Customer created successfully', data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to create customer' });
  }
});

// Get a single customer by id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data)
      return res
        .status(404)
        .json({ success: false, message: 'Customer not found' });
    return res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch customer' });
  }
});

// Update a customer by id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    // If phone is changing, ensure unique
    if (body.phone) {
      const { data: existing, error: existErr } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', body.phone)
        .neq('id', id)
        .maybeSingle();
      if (existErr)
        return res
          .status(500)
          .json({ success: false, message: 'Failed to validate phone' });
      if (existing)
        return res
          .status(400)
          .json({ success: false, message: 'Phone already in use' });
    }

    const update = {
      name: body.name,
      phone: body.phone,
      email: body.email ?? null,
      address: body.address ?? null,
      company: body.company ?? null,
      gst_number: body.gstNumber ?? null,
      customer_type: body.customerType,
      credit_limit: body.creditLimit,
      payment_terms: body.paymentTerms,
      is_active: body.isActive,
      notes: body.notes ?? null,
      tags: body.tags ?? [],
      updated_by: req.user.userId,
    };

    const { data, error } = await supabase
      .from('customers')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();
    if (error)
      return res.status(400).json({ success: false, message: error.message });
    return res.json({
      success: true,
      message: 'Customer updated successfully',
      data,
    });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to update customer' });
  }
});

// Delete a customer by id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error)
      return res.status(400).json({ success: false, message: error.message });
    return res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to delete customer' });
  }
});

// Customers search endpoint similar to Next API /customers/search?q=
router.get('/search', requireAuth, async (req, res) => {
  try {
    const q = (req.query.q || '').toString();
    const limit = parseInt((req.query.limit || '10').toString(), 10);
    if (!q || q.trim().length < 2) return res.json({ success: true, data: [] });

    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone, email, company, customer_type')
      .eq('is_active', true)
      .or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
      .order('name', { ascending: true })
      .limit(limit);
    if (error)
      return res
        .status(500)
        .json({ success: false, message: 'Failed to search customers' });
    return res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to search customers' });
  }
});

// Find-or-create by phone similar to Next API
router.post('/find-or-create', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const phone = (body.phone || '').toString().trim();
    if (!phone)
      return res
        .status(400)
        .json({ success: false, message: 'Phone is required' });

    const { data: existing, error: existErr } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();
    if (existErr)
      return res
        .status(500)
        .json({ success: false, message: 'Failed to lookup customer' });
    if (existing) return res.json({ success: true, data: existing });

    const payload = {
      name: body.name || phone,
      phone,
      email: body.email || null,
      customer_type: body.customerType || 'retail',
      is_active: true,
      created_by: req.user.userId,
    };
    const { data, error } = await supabase
      .from('customers')
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
      .json({ success: false, message: 'Failed to find or create customer' });
  }
});

module.exports = router;
