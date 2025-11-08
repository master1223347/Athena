import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/admin';

export interface AdminStats {
  totalUsers: number;
  totalAchievements: number;
  totalMilestones: number;
  totalCourses: number;
  totalGambles: number;
  activeUsers: number;
  recentActivity: any[];
}

export interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  achievements_count: number;
  milestones_count: number;
  courses_count: number;
  gambles_count: number;
}

export class AdminService {
  /**
   * Get comprehensive admin statistics using service role
   */
  static async getAdminStats(): Promise<AdminStats> {
    try {
      console.log('Fetching admin stats with service role...');
      
      // Use the working redis-admin edge function to get user count
      const { data: userData, error: userError } = await supabase.functions.invoke('redis-admin', {
        body: { dataType: 'users', invalidate: true }
      });
      
      const totalUsers = userData?.data?.length || 0;
      console.log('User count from edge function:', { totalUsers, userError });
      
      // Get other counts with admin client
      const { count: totalAchievements, error: achievementError } = await supabaseAdmin
        .from('achievements')
        .select('*', { count: 'exact', head: true });
      
      console.log('Achievement count result:', { totalAchievements, achievementError });
      
      const { count: totalMilestones, error: milestoneError } = await supabaseAdmin
        .from('milestones')
        .select('*', { count: 'exact', head: true });
      
      console.log('Milestone count result:', { totalMilestones, milestoneError });
      
      const { count: totalCourses, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('*', { count: 'exact', head: true });
      
      console.log('Course count result:', { totalCourses, courseError });
      
      const { count: totalGambles, error: gambleError } = await supabaseAdmin
        .from('gambles')
        .select('*', { count: 'exact', head: true });
      
      console.log('Gamble count result:', { totalGambles, gambleError });

      // Get active users (updated within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsers, error: activeUserError } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', thirtyDaysAgo.toISOString());
      
      console.log('Active user count result:', { activeUsers, activeUserError });

      // Get recent activity
      const { data: recentActivity, error: activityError } = await supabaseAdmin
        .from('milestones')
        .select('*, profiles(email), courses(title)')
        .order('created_at', { ascending: false })
        .limit(10);
      
      console.log('Recent activity result:', { recentActivity: recentActivity?.length, activityError });

      const stats = {
        totalUsers: totalUsers,
        totalAchievements: totalAchievements || 0,
        totalMilestones: totalMilestones || 0,
        totalCourses: totalCourses || 0,
        totalGambles: totalGambles || 0,
        activeUsers: activeUsers || 0,
        recentActivity: recentActivity || []
      };
      
      console.log('Final admin stats:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return {
        totalUsers: 0,
        totalAchievements: 0,
        totalMilestones: 0,
        totalCourses: 0,
        totalGambles: 0,
        activeUsers: 0,
        recentActivity: []
      };
    }
  }

  /**
   * Get all users with their activity counts
   */
  static async getAllUsers(): Promise<UserData[]> {
    try {
      const { data: userData, error } = await supabase.functions.invoke('redis-admin', {
        body: { dataType: 'users', invalidate: false }
      });

      if (error) throw error;

      const users = userData?.data || [];
      
      // Map the data to UserData format
      return users.map((user: any) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.updated_at, // Use updated_at as proxy
        achievements_count: 0, // Will be calculated separately if needed
        milestones_count: 0,
        courses_count: 0,
        gambles_count: 0
      }));
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  /**
   * Get all achievements across all users
   */
  static async getAllAchievements() {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*, profiles(email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all achievements:', error);
      return [];
    }
  }

  /**
   * Get all milestones across all users
   */
  static async getAllMilestones() {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*, profiles(email), courses(title)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all milestones:', error);
      return [];
    }
  }

  /**
   * Get all gambles across all users
   */
  static async getAllGambles() {
    try {
      const { data, error } = await supabase
        .from('gambles')
        .select('*, profiles(email), courses(title)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all gambles:', error);
      return [];
    }
  }

  /**
   * Cache admin data in Redis using the admin edge function
   */
  static async cacheAdminData(dataType: string, filter?: string) {
    try {
      const { data, error } = await supabase.functions.invoke('redis-admin', {
        body: { dataType, filter, invalidate: true }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error caching admin data:', error);
      return null;
    }
  }
} 