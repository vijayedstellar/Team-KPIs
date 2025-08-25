import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Analyst = {
  id: string;
  name: string;
  email: string;
  hire_date: string;
  department: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

export type PerformanceRecord = {
  id: string;
  analyst_id: string;
  month: string;
  year: number;
  outreaches: number;
  live_links: number;
  high_da_links: number;
  content_distribution: number;
  new_blogs: number;
  blog_optimizations: number;
  top_5_keywords: number;
  created_at: string;
  updated_at: string;
  analysts?: Analyst;
};

export type KPITarget = {
  id: string;
  kpi_name: string;
  monthly_target: number;
  annual_target: number;
  role: string;
  created_at: string;
};

export type Role = {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
};

export type KPIDefinition = {
  id: string;
  name: string;
  display_name: string;
  description: string;
  unit: string;
  is_active: boolean;
  created_at: string;
};

export type AdminUser = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};