const { Router } = require('express');
const { supabase } = require('../../db/supabase');
const { requireAuth, requireRole } = require('../../middleware/auth');

const router = Router();

router.get('/stones', requireAuth, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('stones')
      .select('*')
      .order('created_at', { ascending: false });
    if (error)
      return res
        .status(500)
        .json({ success: false, message: 'Failed to fetch stones' });
    return res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
});

router.post(
  '/stones',
  requireAuth,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const b = req.body || {};
      const payload = {
        name: b.name,
        number: b.number,
        color: b.color,
        size: b.size,
        unit: b.unit,
        inventory_type: b.inventoryType,
        quantity: b.quantity ?? 0,
      };
      const { data, error } = await supabase
        .from('stones')
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
  },
);

router.put(
  '/stones/:id',
  requireAuth,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const b = req.body || {};
      const update = {
        name: b.name,
        number: b.number,
        color: b.color,
        size: b.size,
        unit: b.unit,
        inventory_type: b.inventoryType,
      };
      const { data, error } = await supabase
        .from('stones')
        .update(update)
        .eq('id', id)
        .select('*')
        .single();
      if (error)
        return res.status(400).json({ success: false, message: error.message });
      return res.json({ success: true, data });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  },
);

router.patch('/stones/:id/quantity', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body || {};
    if (quantity === undefined || quantity < 0)
      return res
        .status(400)
        .json({ success: false, message: 'Stone quantity cannot be negative' });
    const rounded = Math.round(quantity * 100) / 100;
    const { data, error } = await supabase
      .from('stones')
      .update({ quantity: rounded })
      .eq('id', id)
      .select('*')
      .single();
    if (error)
      return res.status(400).json({ success: false, message: error.message });
    return res.json({
      success: true,
      message: 'Stone quantity updated successfully',
      data,
    });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
});

router.delete(
  '/stones/:id',
  requireAuth,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('stones').delete().eq('id', id);
      if (error)
        return res.status(400).json({ success: false, message: error.message });
      return res.json({ success: true, message: 'Stone deleted' });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  },
);

router.get('/paper', requireAuth, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('paper')
      .select('*')
      .order('created_at', { ascending: false });
    if (error)
      return res
        .status(500)
        .json({ success: false, message: 'Failed to fetch paper' });
    return res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
});

router.post('/paper', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const b = req.body || {};
    const payload = {
      name: b.name,
      width: b.width,
      quantity: b.quantity ?? 0,
      total_pieces: b.totalPieces ?? 0,
      unit: b.unit || 'pcs',
      pieces_per_roll: b.piecesPerRoll,
      weight_per_piece: b.weightPerPiece ?? 0,
      inventory_type: b.inventoryType || 'internal',
      updated_by: null,
      update_history: [],
    };
    const { data, error } = await supabase
      .from('paper')
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

router.put(
  '/paper/:id',
  requireAuth,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const b = req.body || {};
      const update = {
        name: b.name,
        width: b.width,
        total_pieces: b.totalPieces,
        unit: b.unit,
        pieces_per_roll: b.piecesPerRoll,
        weight_per_piece: b.weightPerPiece,
        inventory_type: b.inventoryType,
      };
      const { data, error } = await supabase
        .from('paper')
        .update(update)
        .eq('id', id)
        .select('*')
        .single();
      if (error)
        return res.status(400).json({ success: false, message: error.message });
      return res.json({ success: true, data });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  },
);

router.get('/plastic', requireAuth, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('plastic')
      .select('*')
      .order('created_at', { ascending: false });
    if (error)
      return res
        .status(500)
        .json({ success: false, message: 'Failed to fetch plastic' });
    return res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
});

router.post(
  '/plastic',
  requireAuth,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const b = req.body || {};
      const payload = {
        name: b.name,
        width: b.width,
        quantity: b.quantity ?? 0,
        unit: b.unit || 'pcs',
      };
      const { data, error } = await supabase
        .from('plastic')
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
  },
);

router.put(
  '/plastic/:id',
  requireAuth,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const b = req.body || {};
      const update = { name: b.name, width: b.width, unit: b.unit };
      const { data, error } = await supabase
        .from('plastic')
        .update(update)
        .eq('id', id)
        .select('*')
        .single();
      if (error)
        return res.status(400).json({ success: false, message: error.message });
      return res.json({ success: true, data });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  },
);

// Bulk deletes under masters parity
router.post(
  '/paper/bulk-delete',
  requireAuth,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const ids = req.body?.ids || [];
      if (!Array.isArray(ids) || ids.length === 0)
        return res
          .status(400)
          .json({ success: false, message: 'ids required' });
      const { error } = await supabase.from('paper').delete().in('id', ids);
      if (error)
        return res.status(400).json({ success: false, message: error.message });
      return res.json({ success: true, message: 'Paper types deleted' });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  },
);

router.post(
  '/plastic/bulk-delete',
  requireAuth,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const ids = req.body?.ids || [];
      if (!Array.isArray(ids) || ids.length === 0)
        return res
          .status(400)
          .json({ success: false, message: 'ids required' });
      const { error } = await supabase.from('plastic').delete().in('id', ids);
      if (error)
        return res.status(400).json({ success: false, message: error.message });
      return res.json({ success: true, message: 'Plastic types deleted' });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  },
);

router.post(
  '/stones/bulk-delete',
  requireAuth,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const ids = req.body?.ids || [];
      if (!Array.isArray(ids) || ids.length === 0)
        return res
          .status(400)
          .json({ success: false, message: 'ids required' });
      const { error } = await supabase.from('stones').delete().in('id', ids);
      if (error)
        return res.status(400).json({ success: false, message: error.message });
      return res.json({ success: true, message: 'Stones deleted' });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  },
);

router.post(
  '/tape/bulk-delete',
  requireAuth,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const ids = req.body?.ids || [];
      if (!Array.isArray(ids) || ids.length === 0)
        return res
          .status(400)
          .json({ success: false, message: 'ids required' });
      const { error } = await supabase.from('tape').delete().in('id', ids);
      if (error)
        return res.status(400).json({ success: false, message: error.message });
      return res.json({ success: true, message: 'Tape deleted' });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  },
);

router.get('/tape', requireAuth, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('tape')
      .select('*')
      .order('created_at', { ascending: false });
    if (error)
      return res
        .status(500)
        .json({ success: false, message: 'Failed to fetch tape' });
    return res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
});

router.post('/tape', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const b = req.body || {};
    const payload = {
      name: b.name || 'Cello Tape',
      quantity: b.quantity ?? 0,
      unit: b.unit || 'pcs',
    };
    const { data, error } = await supabase
      .from('tape')
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

router.put(
  '/tape/:id',
  requireAuth,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const b = req.body || {};
      const update = { name: b.name, unit: b.unit };
      const { data, error } = await supabase
        .from('tape')
        .update(update)
        .eq('id', id)
        .select('*')
        .single();
      if (error)
        return res.status(400).json({ success: false, message: error.message });
      return res.json({ success: true, data });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  },
);

router.patch('/tape/:id/quantity', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body || {};
    if (quantity === undefined || quantity < 0)
      return res
        .status(400)
        .json({ success: false, message: 'Tape quantity cannot be negative' });
    const { data, error } = await supabase
      .from('tape')
      .update({ quantity })
      .eq('id', id)
      .select('*')
      .single();
    if (error)
      return res.status(400).json({ success: false, message: error.message });
    return res.json({ success: true, message: 'Tape quantity updated', data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
