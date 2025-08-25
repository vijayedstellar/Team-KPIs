import { supabase } from '../lib/supabase';
import type { PerformanceRecord, KPITarget, Role, KPIDefinition } from '../lib/supabase';

export const performanceService = {
  async getPerformanceRecords(analystId?: string): Promise<PerformanceRecord[]> {
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
    
    if (error) throw error;
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
    const { data, error } = await supabase
      .from('kpi_targets')
      .select('*')
      .order('role', { ascending: true })
      .order('kpi_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
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
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
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
    const { data, error } = await supabase
      .from('kpi_definitions')
      .select('*')
      .eq('is_active', true)
      .order('display_name');
    
    if (error) throw error;
    return data || [];
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