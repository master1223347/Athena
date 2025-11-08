import { supabase } from '@/integrations/supabase/client';
import { WeeklyAchievementSelector, WeeklyAchievementSelection } from './weeklyAchievementSelector';
import { WeeklyAchievementService } from './weeklyAchievementService';
import { toast } from 'sonner';

/**
 * Service for integrating weekly achievement selection with the main achievement system
 */
export class WeeklyAchievementIntegration {
  
  /**
   * Initialize weekly achievements for a user
   * Sets up the current week's selection and checks for new week
   */
  static async initializeWeeklyAchievements(userId: string): Promise<WeeklyAchievementSelection> {
    try {
      console.log(`🎯 Initializing weekly achievements for user ${userId}`);
      
      // Get or create current week's selection
      const selection = await WeeklyAchievementSelector.checkAndUpdateWeekSelection(userId);
      
      // Check if this is a new week
      const isNewWeek = await this.isNewWeek(userId, selection.weekStart);
      
      if (isNewWeek) {
        console.log(`📅 New week detected! Creating new achievement selection`);
  // New week notification removed per request
      }
      
      // Check progress on current week's achievements
      await this.checkWeeklyAchievementProgress(userId, selection);
      
      return selection;
      
    } catch (error) {
      console.error('Error initializing weekly achievements:', error);
      throw error;
    }
  }
  
  /**
   * Check if it's a new week for the user
   */
  private static async isNewWeek(userId: string, currentWeekStart: Date): Promise<boolean> {
    try {
      // Check if we have a stored week start for this user
      const key = `last_week_start_${userId}`;
      const stored = localStorage.getItem(key);
      
      if (!stored) {
        // First time, store current week
        localStorage.setItem(key, currentWeekStart.toISOString());
        return true;
      }
      
      const lastWeekStart = new Date(stored);
      const isNewWeek = lastWeekStart.getTime() !== currentWeekStart.getTime();
      
      if (isNewWeek) {
        // Update stored week
        localStorage.setItem(key, currentWeekStart.toISOString());
      }
      
      return isNewWeek;
      
    } catch (error) {
      console.error('Error checking new week:', error);
      return false;
    }
  }
  
  /**
   * Check progress on current week's achievements
   */
  static async checkWeeklyAchievementProgress(
    userId: string, 
    selection: WeeklyAchievementSelection
  ): Promise<void> {
    try {
      console.log(`🔍 Checking weekly achievement progress for user ${userId}`);
      
      // Get Canvas data for the current week
      const weeklyData = await WeeklyAchievementService['getWeeklyCanvasData'](
        userId, 
        selection.weekStart, 
        selection.weekEnd
      );
      
      // Check each selected achievement
      const achievements = [selection.easy, selection.medium, selection.hard];
      const unlockedAchievements: any[] = [];
      
      for (const achievement of achievements) {
        try {
          // Check if achievement is unlocked
          const isUnlocked = await this.checkAchievementUnlocked(achievement, weeklyData);
          
          if (isUnlocked) {
            unlockedAchievements.push(achievement);
          }
        } catch (error) {
          console.error(`Error checking achievement ${achievement.title}:`, error);
        }
      }
      
      // Process unlocked achievements
      if (unlockedAchievements.length > 0) {
        await this.processUnlockedWeeklyAchievements(userId, unlockedAchievements);
      }
      
    } catch (error) {
      console.error('Error checking weekly achievement progress:', error);
    }
  }
  
  /**
   * Check if a specific achievement is unlocked
   */
  private static async checkAchievementUnlocked(
    achievement: any, 
    weeklyData: any
  ): Promise<boolean> {
    try {
      // Use the existing achievement checking logic
      const result = await WeeklyAchievementService['checkSingleAchievement'](
        achievement, 
        weeklyData
      );
      
      return result.unlocked;
      
    } catch (error) {
      console.error(`Error checking achievement ${achievement.title}:`, error);
      return false;
    }
  }
  
  /**
   * Process unlocked weekly achievements
   */
  private static async processUnlockedWeeklyAchievements(
    userId: string, 
    unlockedAchievements: any[]
  ): Promise<void> {
    for (const achievement of unlockedAchievements) {
      try {
        // Check if achievement already exists in database
        const { data: existingAchievement } = await supabase
          .from('achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('title', achievement.title)
          .single();
        
        if (existingAchievement) {
          console.log(`Achievement ${achievement.title} already exists, skipping`);
          continue;
        }
        
        // Create new achievement
        const { error } = await supabase
          .from('achievements')
          .insert({
            user_id: userId,
            title: achievement.title,
            description: achievement.description,
            difficulty: achievement.difficulty,
            icon: achievement.icon,
            points: achievement.points,
            progress: 100,
            unlocked: true,
            requirements: { 
              type: 'weekly', 
              category: achievement.category,
              canvasDataRequired: achievement.canvasDataRequired
            }
          });
        
        if (error) {
          console.error(`Error creating achievement ${achievement.title}:`, error);
          continue;
        }
        
        // Show toast notification
        toast.success(`🏆 Weekly Achievement Unlocked: ${achievement.title}`, {
          description: `+${achievement.points} XP for completing this week's challenge!`,
          duration: 5000,
        });
        
        console.log(`✅ Unlocked weekly achievement: ${achievement.title}`);
        
      } catch (error) {
        console.error(`Error processing achievement ${achievement.title}:`, error);
      }
    }
  }
  
  /**
   * Get weekly achievement statistics for a user
   */
  static async getWeeklyAchievementStats(userId: string): Promise<{
    currentWeek: WeeklyAchievementSelection | null;
    totalWeeks: number;
    unlockedThisWeek: number;
    totalUnlocked: number;
    streak: number;
  }> {
    try {
      // Get current week's selection
      const currentWeek = await WeeklyAchievementSelector.getCurrentWeekSelection(userId);
      
      // Get user's achievement stats
      const userStats = await WeeklyAchievementSelector.getUserAchievementStats(userId);
      
      // Calculate unlocked this week
      const unlockedThisWeek = await this.getUnlockedThisWeek(userId, currentWeek);
      
      return {
        currentWeek,
        totalWeeks: userStats.totalWeeks,
        unlockedThisWeek,
        totalUnlocked: userStats.totalUnlocked,
        streak: 0 // Would need to implement streak calculation
      };
      
    } catch (error) {
      console.error('Error getting weekly achievement stats:', error);
      return {
        currentWeek: null,
        totalWeeks: 0,
        unlockedThisWeek: 0,
        totalUnlocked: 0,
        streak: 0
      };
    }
  }
  
  /**
   * Get number of achievements unlocked this week
   */
  private static async getUnlockedThisWeek(
    userId: string, 
    currentWeek: WeeklyAchievementSelection | null
  ): Promise<number> {
    if (!currentWeek) return 0;
    
    try {
      const { data: achievements } = await supabase
        .from('achievements')
        .select('title')
        .eq('user_id', userId)
        .eq('unlocked', true)
        .gte('created_at', currentWeek.weekStart.toISOString())
        .lte('created_at', currentWeek.weekEnd.toISOString());
      
      return achievements?.length || 0;
      
    } catch (error) {
      console.error('Error getting unlocked this week:', error);
      return 0;
    }
  }
  
  /**
   * Reset weekly achievements (for testing)
   */
  static async resetWeeklyAchievements(userId: string): Promise<void> {
    try {
      // Clear stored week data
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(`weekly_achievements_${userId}_`) || 
        key === `last_week_start_${userId}`
      );
      
      keys.forEach(key => localStorage.removeItem(key));
      
      console.log(`🔄 Reset weekly achievements for user ${userId}`);
      
    } catch (error) {
      console.error('Error resetting weekly achievements:', error);
    }
  }
}
