import { supabase } from '../lib/supabase';
import type { Analyst } from '../lib/supabase';

export const analystService = {
  async getAllAnalysts(): Promise<Analyst[]> {
    const { data, error } = await supabase
      .from('analysts')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async getActiveAnalysts(): Promise<Analyst[]> {
    const { data, error } = await supabase
      .from('analysts')
      .select('*')
      .eq('status', 'active')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async createAnalyst(analyst: Omit<Analyst, 'id' | 'created_at' | 'updated_at'>): Promise<Analyst> {
    const { data, error } = await supabase
      .from('analysts')
      .insert([analyst])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateAnalyst(id: string, updates: Partial<Analyst>): Promise<Analyst> {
    const { data, error } = await supabase
      .from('analysts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteAnalyst(id: string): Promise<void> {
    const { error } = await supabase
      .from('analysts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};