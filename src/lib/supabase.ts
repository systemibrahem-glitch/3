import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Helper function to set store context for RLS
export async function setStoreContext(storeId: string) {
  const { error } = await supabase.rpc('set_config', {
    setting: 'app.current_store_id',
    value: storeId,
  });
  
  if (error) {
    console.error('Error setting store context:', error);
  }
}

// Types for database tables
export type Store = {
  id: string;
  name: string;
  owner_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  subscription_start_date: string;
  subscription_end_date: string;
  subscription_plan: 'trial' | 'monthly' | '6months' | 'yearly';
  is_active: boolean;
  settings: {
    locale: string;
    theme: string;
    default_currency: string;
  };
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  store_id: string;
  username: string;
  email: string | null;
  password_hash: string;
  full_name: string;
  role: 'owner' | 'manager' | 'accountant' | 'data_entry' | 'warehouse_keeper' | 'employee';
  permissions: Record<string, boolean>;
  is_active: boolean;
  locale: string;
  theme: string;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type Currency = {
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
};

export type Partner = {
  id: string;
  store_id: string;
  type: 'customer' | 'vendor' | 'both';
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_number: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type InvoiceIn = {
  id: string;
  store_id: string;
  invoice_number: string | null;
  amount: number;
  currency: string;
  description: string;
  date: string;
  vendor_id: string | null;
  category: string | null;
  attachments: string[];
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type InvoiceOut = {
  id: string;
  store_id: string;
  invoice_number: string | null;
  amount: number;
  currency: string;
  description: string;
  date: string;
  customer_id: string | null;
  category: string | null;
  attachments: string[];
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type InventoryItem = {
  id: string;
  store_id: string;
  sku: string | null;
  name: string;
  description: string | null;
  unit: string;
  min_stock: number;
  current_stock: number;
  price: number | null;
  currency: string | null;
  category: string | null;
  image_url: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type InventoryMovement = {
  id: string;
  store_id: string;
  item_id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  unit_price: number | null;
  currency: string | null;
  related_invoice_in_id: string | null;
  related_invoice_out_id: string | null;
  date: string;
  notes: string | null;
  created_at: string;
  created_by: string | null;
};

export type Employee = {
  id: string;
  store_id: string;
  name: string;
  employee_number: string | null;
  position: string | null;
  department: string | null;
  base_salary: number;
  currency: string;
  hire_date: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: 'active' | 'inactive' | 'terminated';
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type EmployeeTransaction = {
  id: string;
  store_id: string;
  employee_id: string;
  type: 'advance' | 'absence' | 'deduction' | 'bonus' | 'overtime';
  amount: number;
  currency: string;
  date: string;
  description: string | null;
  notes: string | null;
  is_paid: boolean;
  paid_date: string | null;
  created_at: string;
  created_by: string | null;
};

export type Payroll = {
  id: string;
  store_id: string;
  employee_id: string;
  period_month: number;
  period_year: number;
  gross_salary: number;
  total_advances: number;
  total_absences: number;
  total_deductions: number;
  total_bonuses: number;
  total_overtime: number;
  net_salary: number;
  currency: string;
  status: 'draft' | 'approved' | 'paid';
  approved_by: string | null;
  approved_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
};

export type Alert = {
  id: string;
  store_id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  read_by: string | null;
  created_at: string;
};

