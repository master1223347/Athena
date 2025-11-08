
import { supabase } from '@/integrations/supabase/client';

/**
 * Service for managing user settings
 */
class UserSettingsService {
  async getUserSettings(userId: string) {
    try {
      const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    

      if (error) {
        console.error('Error fetching user settings:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Exception fetching user settings:', err);
      return null;
    }
  }

  async updateUserSettings(userId: string, settings: any) {
    try {
      console.log('Updating user settings:', settings);
      
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating user settings:', error);
        return { error };
      }

      return { data };
    } catch (err) {
      console.error('Exception updating user settings:', err);
      return { error: err };
    }
  }
}

export const userSettingsService = new UserSettingsService();
