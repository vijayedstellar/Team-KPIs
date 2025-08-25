import { supabase } from '../lib/supabase';
import { mockAnalysts } from '../data/mockData';
import type { Analyst } from '../lib/supabase';

export const analystService = {
  async getAllAnalysts(): Promise<Analyst[]> {
    // For production deployment without Supabase, use mock data
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return mockAnalysts;
    }
    
    const { data, error } = await supabase
      .from('analysts')
      .select('*')
      .order('name');
    
    if (error) {
      console.warn('Supabase error, falling back to mock data:', error);
      return mockAnalysts;
    }
    return data || mockAnalysts;
  },

  async getActiveAnalysts(): Promise<Analyst[]> {
    // For production deployment without Supabase, use mock data
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return mockAnalysts.filter(analyst => analyst.status === 'active');
    }
    
    const { data, error } = await supabase
      .from('analysts')
      .select('*')
      .eq('status', 'active')
      .order('name');
    
    if (error) {
      console.warn('Supabase error, falling back to mock data:', error);
      return mockAnalysts.filter(analyst => analyst.status === 'active');
    }
    return data || mockAnalysts.filter(analyst => analyst.status === 'active');
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