import { WEEKLY_ACHIEVEMENTS, WeeklyAchievement } from '@/data/weeklyAchievements';
import { AchievementDifficulty } from '@/types/achievement';

export interface WeeklyAchievementSelection {
  easy: WeeklyAchievement;
  medium: WeeklyAchievement;
  hard: WeeklyAchievement;
  weekStart: Date;
  weekEnd: Date;
  selectionDate: Date;
}

export interface WeeklyAchievementProgress {
  easy: {
    achievement: WeeklyAchievement;
    progress: number;
    unlocked: boolean;
  };
  medium: {
    achievement: WeeklyAchievement;
    progress: number;
    unlocked: boolean;
  };
  hard: {
    achievement: WeeklyAchievement;
    progress: number;
    unlocked: boolean;
  };
}

/**
 * Service for selecting and managing weekly achievements
 * Each week, selects 1 easy, 1 medium, and 1 hard achievement
 */
export class WeeklyAchievementSelector {
  
  /**
   * Get the current week's achievement selection
   * Creates a new selection if one doesn't exist for the current week
   */
  static async getCurrentWeekSelection(userId: string): Promise<WeeklyAchievementSelection> {
    const weekStart = this.getWeekStart(new Date());
    const weekEnd = this.getWeekEnd(weekStart);
    
    // Check if selection already exists for this week
    const existingSelection = await this.getWeekSelection(userId, weekStart);
    if (existingSelection) {
      return existingSelection;
    }
    
    // Create new selection for this week
    return await this.createWeekSelection(userId, weekStart, weekEnd);
  }

  /**
   * Force refresh the weekly achievement selection
   * Clears cached data and creates a new selection
   */
  static async forceRefreshSelection(userId: string): Promise<WeeklyAchievementSelection> {
    const weekStart = this.getWeekStart(new Date());
    const weekEnd = this.getWeekEnd(weekStart);
    
    // Clear any existing selection for this week
    const key = `weekly_achievements_${userId}_${weekStart.toISOString().split('T')[0]}`;
    localStorage.removeItem(key);
    
    // Create new selection
    return await this.createWeekSelection(userId, weekStart, weekEnd);
  }
  
  /**
   * Get achievement selection for a specific week
   */
  static async getWeekSelection(userId: string, weekStart: Date): Promise<WeeklyAchievementSelection | null> {
    try {
      // In a real implementation, this would check a database
      // For now, we'll use localStorage to simulate persistence
      const key = `weekly_achievements_${userId}_${weekStart.toISOString().split('T')[0]}`;
      const stored = localStorage.getItem(key);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          weekStart: new Date(parsed.weekStart),
          weekEnd: new Date(parsed.weekEnd),
          selectionDate: new Date(parsed.selectionDate)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting week selection:', error);
      return null;
    }
  }
  
  /**
   * Create a new achievement selection for a week
   * Ensures no repeats from previous weeks
   */
  static async createWeekSelection(
    userId: string, 
    weekStart: Date, 
    weekEnd: Date
  ): Promise<WeeklyAchievementSelection> {
    // Check if selection already exists for this week
    const existingSelection = await this.getWeekSelection(userId, weekStart);
    if (existingSelection) {
      return existingSelection;
    }
    
    // Get previously used achievements to avoid repeats
    const usedAchievements = await this.getUsedAchievements(userId);
    
    const easyAchievements = this.getAchievementsByDifficulty(AchievementDifficulty.EASY)
      .filter(achievement => !usedAchievements.includes(achievement.title));
    const mediumAchievements = this.getAchievementsByDifficulty(AchievementDifficulty.MEDIUM)
      .filter(achievement => !usedAchievements.includes(achievement.title));
    const hardAchievements = this.getAchievementsByDifficulty(AchievementDifficulty.HARD)
      .filter(achievement => !usedAchievements.includes(achievement.title));
    
    // Check if we have enough achievements to select from
    if (easyAchievements.length === 0 || mediumAchievements.length === 0 || hardAchievements.length === 0) {
      console.warn('Not enough unused achievements available, resetting used achievements');
      await this.resetUsedAchievements(userId);
      
      // Retry with all achievements available
      const allEasyAchievements = this.getAchievementsByDifficulty(AchievementDifficulty.EASY);
      const allMediumAchievements = this.getAchievementsByDifficulty(AchievementDifficulty.MEDIUM);
      const allHardAchievements = this.getAchievementsByDifficulty(AchievementDifficulty.HARD);
      
      const easy = this.selectRandomAchievement(allEasyAchievements);
      const medium = this.selectRandomAchievement(allMediumAchievements);
      const hard = this.selectRandomAchievement(allHardAchievements);
      
      const selection: WeeklyAchievementSelection = {
        easy,
        medium,
        hard,
        weekStart,
        weekEnd,
        selectionDate: new Date()
      };
      
      // Store the selection and mark as used
      await this.storeWeekSelection(userId, selection);
      await this.markAchievementsAsUsed(userId, [easy.title, medium.title, hard.title]);
      
      return selection;
    }
    
    // Select one achievement from each difficulty level (avoiding repeats)
    const easy = this.selectRandomAchievement(easyAchievements);
    const medium = this.selectRandomAchievement(mediumAchievements);
    const hard = this.selectRandomAchievement(hardAchievements);
    
    const selection: WeeklyAchievementSelection = {
      easy,
      medium,
      hard,
      weekStart,
      weekEnd,
      selectionDate: new Date()
    };
    
    // Store the selection and mark as used
    await this.storeWeekSelection(userId, selection);
    await this.markAchievementsAsUsed(userId, [easy.title, medium.title, hard.title]);
    
    return selection;
  }
  
  /**
   * Get achievements by difficulty level
   */
  private static getAchievementsByDifficulty(difficulty: AchievementDifficulty): WeeklyAchievement[] {
    return WEEKLY_ACHIEVEMENTS.filter(achievement => achievement.difficulty === difficulty);
  }
  
  /**
   * Select a random achievement from a list
   * Uses weighted selection to favor certain categories
   */
  private static selectRandomAchievement(achievements: WeeklyAchievement[]): WeeklyAchievement {
    if (achievements.length === 0) {
      throw new Error('No achievements available for selection');
    }
    
    // Weight achievements by category to ensure variety
    const weightedAchievements = this.applyCategoryWeights(achievements);
    
    // Select random achievement
    const randomIndex = Math.floor(Math.random() * weightedAchievements.length);
    return weightedAchievements[randomIndex];
  }
  
  /**
   * Apply category weights to ensure variety in weekly selections
   */
  private static applyCategoryWeights(achievements: WeeklyAchievement[]): WeeklyAchievement[] {
    const categoryWeights = {
      performance: 1.2,    // Slightly favor performance achievements
      timing: 1.0,         // Standard weight
      engagement: 1.1,     // Slightly favor engagement
      variety: 1.0,        // Standard weight
      improvement: 1.3,    // Favor improvement achievements
      streak: 0.8,         // Slightly reduce streak achievements (require historical data)
      threshold: 1.0       // Standard weight
    };
    
    const weightedAchievements: WeeklyAchievement[] = [];
    
    achievements.forEach(achievement => {
      const weight = categoryWeights[achievement.category] || 1.0;
      const count = Math.ceil(weight);
      
      for (let i = 0; i < count; i++) {
        weightedAchievements.push(achievement);
      }
    });
    
    return weightedAchievements;
  }
  
  /**
   * Store week selection in localStorage (simulate database)
   */
  private static async storeWeekSelection(
    userId: string, 
    selection: WeeklyAchievementSelection
  ): Promise<void> {
    try {
      const key = `weekly_achievements_${userId}_${selection.weekStart.toISOString().split('T')[0]}`;
      localStorage.setItem(key, JSON.stringify(selection));
    } catch (error) {
      console.error('Error storing week selection:', error);
    }
  }
  
  /**
   * Get week start date (Monday)
   */
  private static getWeekStart(date: Date): Date {
    const weekStart = new Date(date);
    const dayOfWeek = weekStart.getDay();
    // Sunday = 0, Monday = 1, Tuesday = 2, ..., Saturday = 6
    // To get Monday: if Sunday (0), go back 6 days; otherwise go back (dayOfWeek - 1) days
    const daysToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    
    // Use UTC methods to avoid timezone issues
    const year = weekStart.getUTCFullYear();
    const month = weekStart.getUTCMonth();
    const day = weekStart.getUTCDate();
    
    const targetDate = new Date(Date.UTC(year, month, day + daysToMonday, 0, 0, 0, 0));
    return targetDate;
  }
  
  /**
   * Get week end date (Sunday)
   */
  private static getWeekEnd(weekStart: Date): Date {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }
  
  /**
   * Get current week's achievements with progress
   */
  static async getCurrentWeekProgress(userId: string): Promise<WeeklyAchievementProgress | null> {
    try {
      const selection = await this.getCurrentWeekSelection(userId);
      
      // In a real implementation, this would check actual progress
      // For now, we'll return mock progress
      return {
        easy: {
          achievement: selection.easy,
          progress: 0, // Would be calculated based on Canvas data
          unlocked: false
        },
        medium: {
          achievement: selection.medium,
          progress: 0,
          unlocked: false
        },
        hard: {
          achievement: selection.hard,
          progress: 0,
          unlocked: false
        }
      };
    } catch (error) {
      console.error('Error getting current week progress:', error);
      return null;
    }
  }
  
  /**
   * Check if it's a new week and create new selection if needed
   */
  static async checkAndUpdateWeekSelection(userId: string): Promise<WeeklyAchievementSelection> {
    const currentWeekStart = this.getWeekStart(new Date());
    const existingSelection = await this.getWeekSelection(userId, currentWeekStart);
    
    if (existingSelection) {
      return existingSelection;
    }
    
    // Create new selection for the new week
    const weekEnd = this.getWeekEnd(currentWeekStart);
    return await this.createWeekSelection(userId, currentWeekStart, weekEnd);
  }
  
  /**
   * Get all weekly selections for a user (for history)
   */
  static async getUserWeekSelections(userId: string, limit: number = 10): Promise<WeeklyAchievementSelection[]> {
    try {
      // In a real implementation, this would query a database
      // For now, we'll return empty array
      return [];
    } catch (error) {
      console.error('Error getting user week selections:', error);
      return [];
    }
  }
  
  /**
   * Get achievement statistics for a user
   */
  static async getUserAchievementStats(userId: string): Promise<{
    totalWeeks: number;
    unlockedEasy: number;
    unlockedMedium: number;
    unlockedHard: number;
    totalUnlocked: number;
  }> {
    try {
      // In a real implementation, this would calculate from database
      return {
        totalWeeks: 0,
        unlockedEasy: 0,
        unlockedMedium: 0,
        unlockedHard: 0,
        totalUnlocked: 0
      };
    } catch (error) {
      console.error('Error getting user achievement stats:', error);
      return {
        totalWeeks: 0,
        unlockedEasy: 0,
        unlockedMedium: 0,
        unlockedHard: 0,
        totalUnlocked: 0
      };
    }
  }
  
  /**
   * Get previously used achievements for a user
   */
  private static async getUsedAchievements(userId: string): Promise<string[]> {
    try {
      const key = `used_achievements_${userId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting used achievements:', error);
      return [];
    }
  }
  
  /**
   * Mark achievements as used for a user
   */
  private static async markAchievementsAsUsed(userId: string, achievementTitles: string[]): Promise<void> {
    try {
      const key = `used_achievements_${userId}`;
      const currentUsed = await this.getUsedAchievements(userId);
      const updatedUsed = [...currentUsed, ...achievementTitles];
      localStorage.setItem(key, JSON.stringify(updatedUsed));
    } catch (error) {
      console.error('Error marking achievements as used:', error);
    }
  }
  
  /**
   * Reset used achievements for a user (when all achievements have been used)
   */
  private static async resetUsedAchievements(userId: string): Promise<void> {
    try {
      const key = `used_achievements_${userId}`;
      localStorage.removeItem(key);
      console.log(`Reset used achievements for user ${userId}`);
    } catch (error) {
      console.error('Error resetting used achievements:', error);
    }
  }
  
  /**
   * Get available achievements count by difficulty
   */
  static async getAvailableAchievementsCount(userId: string): Promise<{
    easy: number;
    medium: number;
    hard: number;
    total: number;
  }> {
    try {
      const usedAchievements = await this.getUsedAchievements(userId);
      const easyAchievements = this.getAchievementsByDifficulty(AchievementDifficulty.EASY)
        .filter(achievement => !usedAchievements.includes(achievement.title));
      const mediumAchievements = this.getAchievementsByDifficulty(AchievementDifficulty.MEDIUM)
        .filter(achievement => !usedAchievements.includes(achievement.title));
      const hardAchievements = this.getAchievementsByDifficulty(AchievementDifficulty.HARD)
        .filter(achievement => !usedAchievements.includes(achievement.title));
      
      return {
        easy: easyAchievements.length,
        medium: mediumAchievements.length,
        hard: hardAchievements.length,
        total: easyAchievements.length + mediumAchievements.length + hardAchievements.length
      };
    } catch (error) {
      console.error('Error getting available achievements count:', error);
      return { easy: 0, medium: 0, hard: 0, total: 0 };
    }
  }
  
  /**
   * Check if user has enough unused achievements for next week
   */
  static async canCreateNextWeekSelection(userId: string): Promise<boolean> {
    try {
      const available = await this.getAvailableAchievementsCount(userId);
      return available.easy > 0 && available.medium > 0 && available.hard > 0;
    } catch (error) {
      console.error('Error checking if can create next week selection:', error);
      return false;
    }
  }
  
  /**
   * Get achievement usage statistics
   */
  static async getAchievementUsageStats(userId: string): Promise<{
    totalUsed: number;
    totalAvailable: number;
    usagePercentage: number;
    needsReset: boolean;
  }> {
    try {
      const usedAchievements = await this.getUsedAchievements(userId);
      const totalAvailable = WEEKLY_ACHIEVEMENTS.length;
      const totalUsed = usedAchievements.length;
      const usagePercentage = (totalUsed / totalAvailable) * 100;
      const needsReset = totalUsed >= totalAvailable;
      
      return {
        totalUsed,
        totalAvailable,
        usagePercentage: Math.round(usagePercentage * 100) / 100,
        needsReset
      };
    } catch (error) {
      console.error('Error getting achievement usage stats:', error);
      return {
        totalUsed: 0,
        totalAvailable: 0,
        usagePercentage: 0,
        needsReset: false
      };
    }
  }
}
