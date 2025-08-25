import { supabase } from '../lib/supabase';
import type { AdminUser } from '../lib/supabase';

export const authService = {
  async verifyAdminCredentials(email: string, password: string): Promise<AdminUser | null> {
    try {
      console.log('Attempting to verify credentials for:', email);
      
      // For production deployment without Supabase, use hardcoded credentials
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.log('No Supabase config found, using hardcoded credentials');
        if (email === 'vijay@edstellar' && password === 'Edstellar@2025') {
          return {
            id: 'hardcoded-admin-id',
            email: 'vijay@edstellar',
            password_hash: 'Edstellar@2025',
            name: 'Vijay',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        return null;
      }
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password) // In production, use proper password hashing
        .eq('is_active', true)
        .single();
      
      console.log('Auth query result:', { data, error });
      
      if (error || !data) {
        console.log('Authentication failed:', error?.message || 'No data returned');
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error verifying credentials:', error);
      return null;
    }
  },

  async getAdminByEmail(email: string): Promise<AdminUser | null> {
    try {
      // For production deployment without Supabase, use hardcoded credentials
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        if (email === 'vijay@edstellar') {
          return {
            id: 'hardcoded-admin-id',
            email: 'vijay@edstellar',
            password_hash: 'Edstellar@2025',
            name: 'Vijay',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        return null;
      }
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting admin user:', error);
      return null;
    }
  },

  async updateAdminPassword(id: string, newPassword: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ password_hash: newPassword })
        .eq('id', id);
      
      return !error;
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  }
};