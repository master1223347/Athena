import { useState, useEffect } from 'react';
import { WeeklyAchievementService, WeeklyAchievementResult } from '@/services/weeklyAchievementService';
import { WeeklyAchievement, WEEKLY_ACHIEVEMENT_CATEGORIES } from '@/data/weeklyAchievements';

export interface UseWeeklyAchievementsReturn {
  achievements: WeeklyAchievementResult[];
  loading: boolean;
  error: string | null;
  refreshAchievements: () => Promise<void>;
  getAchievementsByCategory: (category: WeeklyAchievement['category']) => WeeklyAchievementResult[];
  getUnlockedAchievements: () => WeeklyAchievementResult[];
  getProgressAchievements: () => WeeklyAchievementResult[];
}

/**
 * Hook for managing weekly achievements
 */
export function useWeeklyAchievements(
  userId: string,
  weekStart?: Date,
  weekEnd?: Date
): UseWeeklyAchievementsReturn {
  const [achievements, setAchievements] = useState<WeeklyAchievementResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default to current week if not provided
  const currentWeekStart = weekStart || (() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  })();

  const currentWeekEnd = weekEnd || (() => {
    const endOfWeek = new Date(currentWeekStart);
    endOfWeek.setDate(currentWeekStart.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
  })();

  const refreshAchievements = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const results = await WeeklyAchievementService.checkWeeklyAchievements(
        userId,
        currentWeekStart,
        currentWeekEnd
      );
      setAchievements(results);
    } catch (err) {
      console.error('Error fetching weekly achievements:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch achievements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAchievements();
  }, [userId, currentWeekStart, currentWeekEnd]);

  const getAchievementsByCategory = (category: WeeklyAchievement['category']): WeeklyAchievementResult[] => {
    return achievements.filter(achievement => achievement.achievement.category === category);
  };

  const getUnlockedAchievements = (): WeeklyAchievementResult[] => {
    return achievements.filter(achievement => achievement.unlocked);
  };

  const getProgressAchievements = (): WeeklyAchievementResult[] => {
    return achievements.filter(achievement => !achievement.unlocked && achievement.progress > 0);
  };

  return {
    achievements,
    loading,
    error,
    refreshAchievements,
    getAchievementsByCategory,
    getUnlockedAchievements,
    getProgressAchievements
  };
}

/**
 * Hook for getting weekly achievement categories
 */
export function useWeeklyAchievementCategories() {
  return WEEKLY_ACHIEVEMENT_CATEGORIES;
}

/**
 * Hook for getting all weekly achievements (static data)
 */
export function useAllWeeklyAchievements() {
  return {
    achievements: WEEKLY_ACHIEVEMENTS,
    categories: WEEKLY_ACHIEVEMENT_CATEGORIES
  };
}
