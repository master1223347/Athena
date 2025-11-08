import { supabase } from '@/integrations/supabase/client';
import { getAchievements } from '@/lib/achievements';
import { WeeklyGradesXpService } from './weeklyGradesXpService';

/**
 * Service to manage user achievement points for gambling system
 */
export class AchievementPointsService {
  /**
   * Calculate total achievement points including partial progress and weekly grades XP
   */
  static async getTotalAchievementPoints(userId: string): Promise<number> {
    try {
      // verbose logs disabled
      const achievements = await getAchievements(userId);
      
      
      // Calculate total points including partial progress
      const achievementPoints = achievements.reduce((total, achievement) => {
        const progress = achievement.progress || 0;
        const maxPoints = achievement.points || 0;
        const earnedPoints = Math.round((progress / 100) * maxPoints);
        return total + earnedPoints;
      }, 0);
      
      // Get weekly grades XP
      const weeklyGradesData = await WeeklyGradesXpService.getTotalWeeklyGradesXp(userId);
      const weeklyGradesXp = weeklyGradesData.totalWeeklyXp;
      
      const totalPoints = achievementPoints + weeklyGradesXp;
      
      const unlockedAchievements = achievements.filter(achievement => achievement.unlocked);
      const fullyUnlockedPoints = unlockedAchievements
        .reduce((total, achievement) => total + (achievement.points || 0), 0);
      
      // logs removed
      
      // per-achievement logs removed
      
      return totalPoints;
    } catch (error) {
      console.error('Error calculating total achievement points:', error);
      return 0;
    }
  }

  /**
   * Get available points for gambling (total XP minus any restrictions)
   */
  static async getAvailablePoints(userId: string): Promise<number> {
    try {
      // Get total achievement points (from achievements + weekly grades)
      const totalAchievementPoints = await this.getTotalAchievementPoints(userId);
      
      // Get profile points (includes gambling winnings/losses)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile points:', error);
        return totalAchievementPoints; // Fallback to achievement points only
      }

      const profilePoints = profile?.points || 0;
      
      // Total available = achievement points + profile points
      // Profile points can be negative if user has lost more than they've won in gambling
      const availablePoints = totalAchievementPoints + profilePoints;
      
      // summary log removed
      
      return Math.max(0, availablePoints);
    } catch (error) {
      console.error('Error calculating available points:', error);
      return 0;
    }
  }

  /**
   * Deduct points when placing a bet (actually removes XP from user's profile)
   */
  static async deductPointsForBet(userId: string, betAmount: number): Promise<boolean> {
    try {
      const availablePoints = await this.getAvailablePoints(userId);
      
      if (betAmount > availablePoints) {
        console.error(`Insufficient points: ${betAmount} requested, ${availablePoints} available`);
        return false;
      }
      
      // Actually deduct the points from the user's profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching user profile for bet deduction:', fetchError);
        return false;
      }

      const currentPoints = profile?.points || 0;
      const newPoints = currentPoints - betAmount; // Allow negative points for gambling losses

      // Update the user's profile with reduced points
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: newPoints })
        .eq('id', userId);

      if (updateError) {
        console.error('Error deducting points from user profile:', updateError);
        return false;
      }

      // deduction log removed
      return true;
    } catch (error) {
      console.error('Error deducting points for bet:', error);
      return false;
    }
  }

  /**
   * Award points back when a bet is won (adds to achievement points via profiles table)
   */
  static async awardWinnings(userId: string, winnings: number): Promise<void> {
    try {
      // Get current points from profiles table (this is separate from achievement points)
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching user profile for winnings:', fetchError);
        return;
      }

      const currentProfilePoints = profile?.points || 0;
      const newProfilePoints = currentProfilePoints + winnings;

      // Update profile points (this is gambling winnings, separate from achievements)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          points: newProfilePoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error awarding winnings:', updateError);
      }
    } catch (error) {
      console.error('Error awarding winnings:', error);
    }
  }

  /**
   * Get user's gambling winnings from profiles table
   */
  static async getGamblingWinnings(userId: string): Promise<number> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching gambling winnings:', error);
        return 0;
      }

      return profile?.points || 0;
    } catch (error) {
      console.error('Error getting gambling winnings:', error);
      return 0;
    }
  }

  /**
   * Get total spendable points (same as getAvailablePoints - for consistency)
   */
  static async getTotalSpendablePoints(userId: string): Promise<number> {
    // Use the same logic as getAvailablePoints for consistency
    return this.getAvailablePoints(userId);
  }
}
