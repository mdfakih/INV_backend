require('dotenv').config();
const { Client } = require('pg');

const dbUrl = process.env.SUPABASE_DB_URL;
console.log(dbUrl);
if (!dbUrl) {
  console.error(
    'Missing SUPABASE_DB_URL. Get it from Supabase -> Project Settings -> Database.',
  );
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false,
    require: true,
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});
const sql = String.raw;

const schemaSql = sql`
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('admin','manager','employee')) default 'employee',
  name text not null,
  status text not null check (status in ('active','blocked')) default 'active',
  password_reset_request jsonb default '{"requested":false}'::jsonb,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  email text,
  address jsonb,
  company text,
  gst_number text,
  customer_type text not null check (customer_type in ('retail','wholesale','corporate')) default 'retail',
  credit_limit numeric not null default 0,
  payment_terms text not null check (payment_terms in ('immediate','7days','15days','30days','45days')) default 'immediate',
  is_active boolean not null default true,
  notes text,
  tags text[] not null default '{}',
  created_by uuid not null references public.users(id) on delete restrict,
  updated_by uuid references public.users(id) on delete set null,
  update_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_customers_name_phone on public.customers (name, phone);
create index if not exists idx_customers_created_by on public.customers (created_by);
create index if not exists idx_customers_updated_by on public.customers (updated_by);

create table if not exists public.stones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  number text not null,
  color text not null,
  size text not null,
  quantity numeric not null default 0,
  unit text not null check (unit in ('g','kg')),
  inventory_type text not null check (inventory_type in ('internal','out')) default 'internal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(number, inventory_type)
);

create table if not exists public.paper (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  width numeric not null check (width > 0),
  quantity numeric not null default 0,
  total_pieces numeric not null default 0,
  unit text not null default 'pcs',
  pieces_per_roll numeric not null,
  weight_per_piece numeric not null default 0,
  inventory_type text not null check (inventory_type in ('internal','out')) default 'internal',
  updated_by uuid references public.users(id) on delete set null,
  update_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(name, inventory_type)
);
create index if not exists idx_paper_updated_by on public.paper (updated_by);

create table if not exists public.plastic (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  width numeric not null check (width > 0),
  quantity numeric not null default 0,
  unit text not null default 'pcs',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(name)
);

create table if not exists public.tape (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Cello Tape',
  quantity numeric not null default 0,
  unit text not null default 'pcs',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  number text not null unique,
  image_url text default '',
  prices jsonb not null default '[]'::jsonb,
  default_stones jsonb not null default '[]'::jsonb,
  created_by uuid not null references public.users(id) on delete restrict,
  updated_by uuid references public.users(id) on delete set null,
  update_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_designs_created_by on public.designs (created_by);
create index if not exists idx_designs_updated_by on public.designs (updated_by);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('internal','out')),
  customer_name text not null,
  phone text not null,
  customer_id uuid references public.customers(id) on delete set null,
  gst_number text,
  design_orders jsonb not null default '[]'::jsonb,
  mode_of_payment text not null check (mode_of_payment in ('cash','UPI','card')) default 'cash',
  payment_status text not null check (payment_status in ('pending','partial','completed','overdue')) default 'pending',
  discount_type text not null check (discount_type in ('percentage','flat')) default 'percentage',
  discount_value numeric not null default 0,
  discounted_amount numeric not null default 0,
  final_amount numeric not null default 0,
  notes text,
  final_total_weight numeric,
  calculated_weight numeric,
  weight_discrepancy numeric,
  discrepancy_percentage numeric,
  status text not null default 'pending',
  is_finalized boolean default false,
  finalized_at timestamptz,
  created_by uuid not null references public.users(id) on delete restrict,
  updated_by uuid references public.users(id) on delete set null,
  update_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_customer_id on public.orders (customer_id);
create index if not exists idx_orders_created_by on public.orders (created_by);
create index if not exists idx_orders_updated_by on public.orders (updated_by);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_type on public.orders (type);

create table if not exists public.inventory_entries (
  id uuid primary key default gen_random_uuid(),
  inventory_type text not null check (inventory_type in ('paper','plastic','stones','tape','mixed')),
  items jsonb not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  bill_number text,
  bill_date date,
  entered_by uuid not null references public.users(id) on delete restrict,
  approved_by uuid references public.users(id) on delete set null,
  source_order_id uuid references public.orders(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_inventory_entries_entered_by on public.inventory_entries (entered_by);
create index if not exists idx_inventory_entries_approved_by on public.inventory_entries (approved_by);
create index if not exists idx_inventory_entries_supplier_id on public.inventory_entries (supplier_id);
create index if not exists idx_inventory_entries_source_order_id on public.inventory_entries (source_order_id);
create index if not exists idx_inventory_entries_status on public.inventory_entries (status);
create index if not exists idx_inventory_entries_type on public.inventory_entries (inventory_type);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  phone text,
  email text,
  address jsonb,
  notes text,
  contact_person text,
  status text not null default 'active' check (status in ('active','inactive','blocked')),
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_suppliers_created_by on public.suppliers (created_by);
create index if not exists idx_suppliers_updated_by on public.suppliers (updated_by);

-- Backfill/ensure columns for existing installations
alter table public.suppliers add column if not exists contact_person text;
alter table public.suppliers add column if not exists status text not null default 'active';
alter table public.suppliers add column if not exists created_by uuid references public.users(id) on delete set null;
alter table public.suppliers add column if not exists updated_by uuid references public.users(id) on delete set null;

-- Helpful indexes
create index if not exists idx_suppliers_name on public.suppliers (name);
create index if not exists idx_suppliers_status on public.suppliers (status);

-- Add missing indexes for performance
create index if not exists idx_users_email on public.users (email);
create index if not exists idx_users_role on public.users (role);
create index if not exists idx_users_status on public.users (status);
create index if not exists idx_customers_phone on public.customers (phone);
create index if not exists idx_customers_email on public.customers (email);
create index if not exists idx_customers_customer_type on public.customers (customer_type);
create index if not exists idx_customers_is_active on public.customers (is_active);
create index if not exists idx_stones_inventory_type on public.stones (inventory_type);
create index if not exists idx_paper_inventory_type on public.paper (inventory_type);
create index if not exists idx_designs_number on public.designs (number);
create index if not exists idx_orders_phone on public.orders (phone);
create index if not exists idx_orders_payment_status on public.orders (payment_status);
create index if not exists idx_orders_created_at on public.orders (created_at);
`;

async function run() {
  try {
    console.log('Attempting to connect to Supabase database...');
    await client.connect();
    console.log('Connected successfully!');

    console.log('Running schema setup...');
    await client.query(schemaSql);
    console.log('Schema setup complete!');

    await client.end();
    console.log('Supabase schema setup complete.');
  } catch (error) {
    console.error('Setup failed:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.error(
        'DNS resolution failed. Check your internet connection and Supabase project status.',
      );
    } else if (error.code === 'ECONNREFUSED') {
      console.error(
        'Connection refused. Check if your Supabase project is paused or the connection string is correct.',
      );
    } else if (error.code === 'ETIMEDOUT') {
      console.error('Connection timed out. Check your network connection.');
    }
    throw error;
  }
}

run().catch(async (e) => {
  console.error(e);
  try {
    await client.end();
  } catch {}
  process.exit(1);
});
