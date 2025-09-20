const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../../db/supabase');

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: 'Email and password are required' });
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, role, name, status')
      .eq('email', email)
      .single();
    if (error || !user)
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    if (user.status === 'blocked')
      return res
        .status(403)
        .json({
          success: false,
          message:
            'Your account has been blocked. Please contact administrator.',
        });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );
    return res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      token,
    });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
});

router.post('/logout', (_req, res) =>
  res.json({ success: true, message: 'Logged out' }),
);

router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth)
    return res
      .status(401)
      .json({ success: false, message: 'Not authenticated' });
  const token = auth.replace('Bearer ', '');
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, role, name')
    .eq('id', payload.userId)
    .single();
  if (error || !user)
    return res.status(404).json({ success: false, message: 'User not found' });
  return res.json({ success: true, user });
});

module.exports = router;
