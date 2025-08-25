import { supabase } from '../lib/supabase';
import { mockPerformanceRecords, mockKPITargets, mockAnalyst } from '../data/mockData';
import type { PerformanceRecord, KPITarget, Role, KPIDefinition } from '../lib/supabase';

// Mock roles for fallback
const mockRoles: Role[] = [
  { id: 'role-1', name: 'SEO Analyst', description: 'Entry-level SEO professional', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'role-2', name: 'SEO Specialist', description: 'Mid-level SEO professional', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'role-3', name: 'Content Writer', description: 'Content creation specialist', is_active: true, created_at: '2024-01-01T00:00:00Z' }
];

// Mock KPI definitions for fallback
const mockKPIDefinitions: KPIDefinition[] = [
  { id: 'kpi-1', name: 'outreaches', display_name: 'Monthly Outreaches', description: 'Number of outreach emails sent', unit: 'emails', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'kpi-2', name: 'live_links', display_name: 'Live Links', description: 'Successfully acquired backlinks', unit: 'links', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'kpi-3', name: 'high_da_links', display_name: 'High DA Backlinks (90+)', description: 'High authority backlinks', unit: 'links', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'kpi-4', name: 'content_distribution', display_name: 'Content Distribution', description: 'Content pieces distributed', unit: 'pieces', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'kpi-5', name: 'new_blogs', display_name: 'New Blog Contributions', description: 'New blog posts created', unit: 'posts', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'kpi-6', name: 'blog_optimizations', display_name: 'Blog Optimizations', description: 'Blog posts optimized', unit: 'posts', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'kpi-7', name: 'top_5_keywords', display_name: 'Top 5 Ranking Keywords', description: 'Keywords in top 5 positions', unit: 'keywords', is_active: true, created_at: '2024-01-01T00:00:00Z' }
];

export const performanceService = {
  async getPerformanceRecords(analystId?: string): Promise<PerformanceRecord[]> {
    // For production deployment without Supabase, use mock data
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      const records = mockPerformanceRecords.map(record => ({
        ...record,
        analysts: mockAnalyst
      }));
      return analystId ? records.filter(r => r.analyst_id === analystId) : records;
    }
    
    let query = supabase
      .from('performance_records')
      .select(`
        *,
        analysts (
          id,
          name,
          email
        )
      `)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (analystId) {
      query = query.eq('analyst_id', analystId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.warn('Supabase error, falling back to mock data:', error);
      const records = mockPerformanceRecords.map(record => ({
        ...record,
        analysts: mockAnalyst
      }));
      return analystId ? records.filter(r => r.analyst_id === analystId) : records;
    }
    return data || [];
  },

  async createOrUpdatePerformanceRecord(record: Omit<PerformanceRecord, 'id' | 'created_at' | 'updated_at' | 'analysts'>): Promise<PerformanceRecord> {
    const { data, error } = await supabase
      .from('performance_records')
      .upsert([record], {
        onConflict: 'analyst_id,month,year'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getKPITargets(): Promise<KPITarget[]> {
    // For production deployment without Supabase, use mock data
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return mockKPITargets;
    }
    
    const { data, error } = await supabase
      .from('kpi_targets')
      .select('*')
      .order('role', { ascending: true })
      .order('kpi_name', { ascending: true });
    
    if (error) {
      console.warn('Supabase error, falling back to mock data:', error);
      return mockKPITargets;
    }
    return data || mockKPITargets;
  },

  async getKPITargetsByRole(role: string): Promise<KPITarget[]> {
    const { data, error } = await supabase
      .from('kpi_targets')
      .select('*')
      .eq('role', role)
      .order('kpi_name');
    
    if (error) throw error;
    return data || [];
  },

  async createOrUpdateKPITarget(target: Omit<KPITarget, 'id' | 'created_at'>): Promise<KPITarget> {
    const { data, error } = await supabase
      .from('kpi_targets')
      .upsert([target], {
        onConflict: 'kpi_name,role'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteKPITarget(id: string): Promise<void> {
    const { error } = await supabase
      .from('kpi_targets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getAnalystYearlyPerformance(analystId: string, year: number): Promise<PerformanceRecord[]> {
    const { data, error } = await supabase
      .from('performance_records')
      .select('*')
      .eq('analyst_id', analystId)
      .eq('year', year)
      .order('month');
    
    if (error) throw error;
    return data || [];
  },

  // Role management
  async getRoles(): Promise<Role[]> {
    // For production deployment without Supabase, use mock data
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return mockRoles;
    }
    
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.warn('Supabase error, falling back to mock data:', error);
      return mockRoles;
    }
    return data || mockRoles;
  },

  async createRole(role: Omit<Role, 'id' | 'created_at'>): Promise<Role> {
    const { data, error } = await supabase
      .from('roles')
      .insert([role])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateRole(id: string, updates: Partial<Role>): Promise<Role> {
    const { data, error } = await supabase
      .from('roles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteRole(id: string): Promise<void> {
    const { error } = await supabase
      .from('roles')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  },

  // KPI Definition management
  async getKPIDefinitions(): Promise<KPIDefinition[]> {
    // For production deployment without Supabase, use mock data
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return mockKPIDefinitions;
    }
    
    const { data, error } = await supabase
      .from('kpi_definitions')
      .select('*')
      .eq('is_active', true)
      .order('display_name');
    
    if (error) {
      console.warn('Supabase error, falling back to mock data:', error);
      return mockKPIDefinitions;
    }
    return data || mockKPIDefinitions;
  },

  async createKPIDefinition(kpi: Omit<KPIDefinition, 'id' | 'created_at'>): Promise<KPIDefinition> {
    const { data, error } = await supabase
      .from('kpi_definitions')
      .insert([kpi])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateKPIDefinition(id: string, updates: Partial<KPIDefinition>): Promise<KPIDefinition> {
    const { data, error } = await supabase
      .from('kpi_definitions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteKPIDefinition(id: string): Promise<void> {
    const { error } = await supabase
      .from('kpi_definitions')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  }
};