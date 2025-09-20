require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const name = process.env.ADMIN_NAME || 'Admin';
  const password_hash = await bcrypt.hash(password, 10);
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existing) {
    console.log('Admin already exists');
    return;
  }
  const { error } = await supabase
    .from('users')
    .insert({ email, password_hash, role: 'admin', name, status: 'active' });
  if (error) throw error;
  console.log('Admin user created:', email);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
