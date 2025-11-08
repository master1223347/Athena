import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StreakAchievementService } from './streakAchievementService';

export interface StreakData {
  daily_login_streak: number;
  weekly_completion_streak: number;
  last_login_date: string;
  last_weekly_completion_date: string;
  streak_start_date: string;
}

export interface StreakReward {
  type: 'daily_login' | 'weekly_completion';
  points: number;
  multiplier: number;
  streak_count: number;
}

// Streak configuration with XP rewards
const STREAK_CONFIG = {
  daily: {
    basePoints: 5,
    maxPoints: 50,
    multiplierInterval: 7, // Every 7 days
    multiplier: 1.2,
    maxMultiplier: 4.0, // Cap at 4x
    // XP rewards for specific milestones
    milestoneRewards: {
      1: 5,    // 1 day: 5 XP
      3: 10,   // 3 days: 10 XP
      7: 20,   // 1 week: 20 XP
      14: 35,  // 2 weeks: 35 XP
      30: 75,  // 1 month: 75 XP
      60: 150, // 2 months: 150 XP
      100: 300, // 100 days: 300 XP
    }
  },
  weekly: {
    basePoints: 100,
    maxPoints: 500,
    multiplierInterval: 4, // Every 4 weeks
    multiplier: 1.3,
    maxMultiplier: 3.0, // Cap at 3x
    // XP rewards for specific milestones
    milestoneRewards: {
      1: 25,   // 1 week: 25 XP
      2: 50,   // 2 weeks: 50 XP
      4: 100,  // 1 month: 100 XP
      8: 200,  // 2 months: 200 XP
      12: 400, // 3 months: 400 XP
      26: 800, // 6 months: 800 XP
      52: 1500, // 1 year: 1500 XP
    }
  },
};

export class StreakService {
  /**
   * Get current streak data for a user
   */
  static async getStreakData(userId: string): Promise<StreakData | null> {
    try {
      console.log('StreakService: Getting streak data for user:', userId);
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('daily_login_streak, weekly_completion_streak, last_login_date, last_weekly_completion_date, streak_start_date')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.log('StreakService: Error getting streak data:', error.message);
        
        // If user_settings doesn't exist, try to create it
        if (error.message.includes('No rows returned')) {
          console.log('StreakService: Creating user_settings for new user');
          await this.initializeStreakData(userId);
          
          // Try to get the data again
          const { data: newData, error: newError } = await supabase
            .from('user_settings')
            .select('daily_login_streak, weekly_completion_streak, last_login_date, last_weekly_completion_date, streak_start_date')
            .eq('user_id', userId)
            .single();
            
          if (newError) {
            console.log('StreakService: Still error after initialization:', newError.message);
            return null;
          }
          
          console.log('StreakService: Retrieved streak data after initialization:', newData);
          return newData;
        }
        
        return null;
      }

      console.log('StreakService: Retrieved streak data:', data);
      return data;
    } catch (error) {
      console.log('StreakService: Exception getting streak data:', error);
      return null;
    }
  }

  /**
   * Process daily login streak
   */
  static async processDailyLogin(userId: string): Promise<StreakReward | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const streakData = await this.getStreakData(userId);
      
      if (!streakData) {
        // Initialize streak data for new users
        await this.initializeStreakData(userId);
        const reward = this.calculateMilestoneReward(1, 'daily');
        await this.addPointsToUser(userId, reward);
        
        return {
          type: 'daily_login',
          points: reward,
          multiplier: 1.0,
          streak_count: 1,
        };
      }

      const lastLoginDate = new Date(streakData.last_login_date);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        // Already logged in today
        return null;
      }

      if (daysDiff === 1) {
        // Consecutive day - continue streak
        const newStreak = streakData.daily_login_streak + 1;
        const multiplier = this.calculateMultiplier(newStreak, STREAK_CONFIG.daily);
        const basePoints = Math.min(
          Math.floor(STREAK_CONFIG.daily.basePoints * multiplier),
          STREAK_CONFIG.daily.maxPoints
        );

        // Check for milestone rewards
        const milestoneReward = this.calculateMilestoneReward(newStreak, 'daily');
        const totalReward = basePoints + milestoneReward;

        await this.updateDailyLoginStreak(userId, newStreak, today);
        
        // Add points to user's profile
        if (totalReward > 0) {
          await this.addPointsToUser(userId, totalReward);
        }
        
        // Check for achievements
        await StreakAchievementService.checkStreakAchievements(userId, newStreak, streakData.weekly_completion_streak);
        
        return {
          type: 'daily_login',
          points: totalReward,
          multiplier,
          streak_count: newStreak,
        };
      } else if (daysDiff > 1) {
        // Streak broken - reset to 1
        await this.updateDailyLoginStreak(userId, 1, today);
        
        const reward = this.calculateMilestoneReward(1, 'daily');
        if (reward > 0) {
          await this.addPointsToUser(userId, reward);
        }
        
        return {
          type: 'daily_login',
          points: reward,
          multiplier: 1.0,
          streak_count: 1,
        };
      }

      return null;
    } catch (error) {
      console.error('Error in processDailyLogin:', error);
      return null;
    }
  }

  /**
   * Calculate milestone rewards for streaks
   */
  private static calculateMilestoneReward(streakCount: number, type: 'daily' | 'weekly'): number {
    const config = type === 'daily' ? STREAK_CONFIG.daily : STREAK_CONFIG.weekly;
    const milestones = Object.keys(config.milestoneRewards).map(Number).sort((a, b) => a - b);
    
    // Find the highest milestone reached
    let highestMilestone = 0;
    for (const milestone of milestones) {
      if (streakCount >= milestone) {
        highestMilestone = milestone;
      } else {
        break;
      }
    }
    
    return highestMilestone > 0 ? config.milestoneRewards[highestMilestone] : 0;
  }

  /**
   * Add points to user's profile
   */
  private static async addPointsToUser(userId: string, points: number): Promise<void> {
    try {
      // First get current points
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching user profile:', fetchError);
        return;
      }

      const currentPoints = profile?.points || 0;
      const newPoints = currentPoints + points;

      // Update with new total
      const { error } = await supabase
        .from('profiles')
        .update({ points: newPoints })
        .eq('id', userId);

      if (error) {
        console.error('Error adding points to user:', error);
      }
    } catch (error) {
      console.error('Error in addPointsToUser:', error);
    }
  }

  /**
   * Process weekly completion streak
   */
  static async processWeeklyCompletion(userId: string): Promise<StreakReward | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const streakData = await this.getStreakData(userId);
      
      if (!streakData) {
        return null;
      }

      // Check if all assignments for the week are completed
      const hasCompletedWeekly = await this.checkWeeklyCompletion(userId);
      
      if (!hasCompletedWeekly) {
        return null;
      }

      const lastCompletionDate = new Date(streakData.last_weekly_completion_date);
      const todayDate = new Date(today);
      const weeksDiff = Math.floor((todayDate.getTime() - lastCompletionDate.getTime()) / (1000 * 60 * 60 * 24 * 7));

      if (weeksDiff === 0) {
        // Already completed this week
        return null;
      }

      if (weeksDiff === 1) {
        // Consecutive week - continue streak
        const newStreak = streakData.weekly_completion_streak + 1;
        const multiplier = this.calculateMultiplier(newStreak, STREAK_CONFIG.weekly);
        const basePoints = Math.min(
          Math.floor(STREAK_CONFIG.weekly.basePoints * multiplier),
          STREAK_CONFIG.weekly.maxPoints
        );

        // Check for milestone rewards
        const milestoneReward = this.calculateMilestoneReward(newStreak, 'weekly');
        const totalReward = basePoints + milestoneReward;

        await this.updateWeeklyCompletionStreak(userId, newStreak, today);
        
        // Add points to user's profile
        if (totalReward > 0) {
          await this.addPointsToUser(userId, totalReward);
        }
        
        // Check for achievements
        await StreakAchievementService.checkStreakAchievements(userId, streakData.daily_login_streak, newStreak);
        
        return {
          type: 'weekly_completion',
          points: totalReward,
          multiplier,
          streak_count: newStreak,
        };
      } else if (weeksDiff > 1) {
        // Streak broken - reset to 1
        await this.updateWeeklyCompletionStreak(userId, 1, today);
        
        const reward = this.calculateMilestoneReward(1, 'weekly');
        if (reward > 0) {
          await this.addPointsToUser(userId, reward);
        }
        
        return {
          type: 'weekly_completion',
          points: reward,
          multiplier: 1.0,
          streak_count: 1,
        };
      }

      return null;
    } catch (error) {
      console.error('Error in processWeeklyCompletion:', error);
      return null;
    }
  }

  /**
   * Calculate multiplier based on streak count
   */
  private static calculateMultiplier(streakCount: number, config: { multiplierInterval: number; multiplier: number; maxMultiplier: number }): number {
    const multiplierCount = Math.floor(streakCount / config.multiplierInterval);
    const multiplier = 1 + (multiplierCount * (config.multiplier - 1));
    return Math.min(multiplier, config.maxMultiplier);
  }

  /**
   * Check if user has completed all assignments for the current week
   */
  private static async checkWeeklyCompletion(userId: string): Promise<boolean> {
    try {
      // Get current week's assignments
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // This is a simplified check - in a real implementation, you'd check actual assignment completion
      // For now, we'll assume weekly completion if user has been active
      const { data: achievements } = await supabase
        .from('achievements')
        .select('progress')
        .eq('user_id', userId)
        .gte('updated_at', startOfWeek.toISOString());

      // Consider it complete if user has made progress on achievements this week
      return (achievements?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking weekly completion:', error);
      return false;
    }
  }

  /**
   * Update daily login streak
   */
  private static async updateDailyLoginStreak(userId: string, streak: number, date: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          daily_login_streak: streak,
          last_login_date: date,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating daily login streak:', error);
      }
    } catch (error) {
      console.error('Error in updateDailyLoginStreak:', error);
    }
  }

  /**
   * Update weekly completion streak
   */
  private static async updateWeeklyCompletionStreak(userId: string, streak: number, date: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          weekly_completion_streak: streak,
          last_weekly_completion_date: date,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating weekly completion streak:', error);
      }
    } catch (error) {
      console.error('Error in updateWeeklyCompletionStreak:', error);
    }
  }

  /**
   * Initialize streak data for new users
   */
  private static async initializeStreakData(userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('user_settings')
        .update({
          daily_login_streak: 1,
          weekly_completion_streak: 0,
          last_login_date: today,
          last_weekly_completion_date: today,
          streak_start_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error initializing streak data:', error);
      }
    } catch (error) {
      console.error('Error in initializeStreakData:', error);
    }
  }

  /**
   * Get streak statistics for display
   */
  static async getStreakStats(userId: string): Promise<{
    daily: { current: number; longest: number; nextReward: number };
    weekly: { current: number; longest: number; nextReward: number };
  } | null> {
    try {
      const streakData = await this.getStreakData(userId);
      
      if (!streakData) {
        return null;
      }

      const dailyNextReward = this.calculateNextReward(
        streakData.daily_login_streak,
        STREAK_CONFIG.daily
      );
      
      const weeklyNextReward = this.calculateNextReward(
        streakData.weekly_completion_streak,
        STREAK_CONFIG.weekly
      );

      return {
        daily: {
          current: streakData.daily_login_streak,
          longest: streakData.daily_login_streak, // In a real app, you'd track longest separately
          nextReward: dailyNextReward,
        },
        weekly: {
          current: streakData.weekly_completion_streak,
          longest: streakData.weekly_completion_streak, // In a real app, you'd track longest separately
          nextReward: weeklyNextReward,
        },
      };
    } catch (error) {
      console.error('Error in getStreakStats:', error);
      return null;
    }
  }

  /**
   * Calculate next reward milestone
   */
  private static calculateNextReward(currentStreak: number, config: { multiplierInterval: number }): number {
    const nextMilestone = Math.ceil((currentStreak + 1) / config.multiplierInterval) * config.multiplierInterval;
    return nextMilestone;
  }

  /**
   * Get XP rewards for current streak
   */
  static getDailyStreakReward(streakCount: number): number {
    return this.calculateMilestoneReward(streakCount, 'daily');
  }

  static getWeeklyStreakReward(streakCount: number): number {
    return this.calculateMilestoneReward(streakCount, 'weekly');
  }

  /**
   * Get next milestone for display
   */
  static getNextDailyMilestone(currentStreak: number): number | null {
    const milestones = Object.keys(STREAK_CONFIG.daily.milestoneRewards).map(Number).sort((a, b) => a - b);
    const nextMilestone = milestones.find(m => m > currentStreak);
    return nextMilestone || null;
  }

  static getNextWeeklyMilestone(currentStreak: number): number | null {
    const milestones = Object.keys(STREAK_CONFIG.weekly.milestoneRewards).map(Number).sort((a, b) => a - b);
    const nextMilestone = milestones.find(m => m > currentStreak);
    return nextMilestone || null;
  }
} 