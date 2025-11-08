import { useState, useEffect, useCallback } from 'react';
import { WeeklyAchievementService, WeeklyAchievementResult } from '@/services/weeklyAchievementService';

export interface WeeklyAchievementEvaluationStats {
  totalAchievements: number;
  unlockedAchievements: number;
  progressAchievements: number;
  categoryBreakdown: Record<string, { total: number; unlocked: number; progress: number }>;
  difficultyBreakdown: Record<string, { total: number; unlocked: number; progress: number }>;
  recentUnlocks: WeeklyAchievementResult[];
}

export interface UseWeeklyAchievementEvaluationReturn {
  // Core data
  allAchievements: WeeklyAchievementResult[];
  unlockedAchievements: WeeklyAchievementResult[];
  progressAchievements: WeeklyAchievementResult[];
  nearCompletionAchievements: WeeklyAchievementResult[];
  
  // Statistics
  stats: WeeklyAchievementEvaluationStats | null;
  
  // Filtering
  getAchievementsByCategory: (category: string) => WeeklyAchievementResult[];
  getAchievementsByDifficulty: (difficulty: string) => WeeklyAchievementResult[];
  getAchievementsByCriteria: (criteria: {
    category?: string;
    difficulty?: string;
    unlocked?: boolean;
    minProgress?: number;
  }) => WeeklyAchievementResult[];
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshEvaluation: () => Promise<void>;
  evaluateAchievements: (weekStart: Date, weekEnd: Date) => Promise<void>;
}

export function useWeeklyAchievementEvaluation(
  userId: string,
  weekStart?: Date,
  weekEnd?: Date
): UseWeeklyAchievementEvaluationReturn {
  const [allAchievements, setAllAchievements] = useState<WeeklyAchievementResult[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<WeeklyAchievementResult[]>([]);
  const [progressAchievements, setProgressAchievements] = useState<WeeklyAchievementResult[]>([]);
  const [nearCompletionAchievements, setNearCompletionAchievements] = useState<WeeklyAchievementResult[]>([]);
  const [stats, setStats] = useState<WeeklyAchievementEvaluationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default to current week if no dates provided
  const currentWeekStart = weekStart || (() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    const monday = new Date(now);
    monday.setDate(monday.getDate() + daysToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  })();

  const currentWeekEnd = weekEnd || (() => {
    const sunday = new Date(currentWeekStart);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return sunday;
  })();

  const evaluateAchievements = useCallback(async (startDate: Date, endDate: Date) => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 Evaluating weekly achievements for user ${userId} (${startDate.toISOString()} - ${endDate.toISOString()})`);

      // Get all achievements with their status
      const achievements = await WeeklyAchievementService.checkWeeklyAchievements(userId, startDate, endDate);
      setAllAchievements(achievements);

      // Filter by status
      const unlocked = achievements.filter(a => a.unlocked);
      const progress = achievements.filter(a => !a.unlocked && a.progress > 0);
      const nearCompletion = achievements.filter(a => !a.unlocked && a.progress >= 75);

      setUnlockedAchievements(unlocked);
      setProgressAchievements(progress);
      setNearCompletionAchievements(nearCompletion);

      // Get comprehensive statistics
      const statistics = await WeeklyAchievementService.getAchievementStatistics(userId, startDate, endDate);
      setStats(statistics);

      console.log(`✅ Evaluation complete: ${unlocked.length} unlocked, ${progress.length} in progress, ${nearCompletion.length} near completion`);

    } catch (err) {
      console.error('Error evaluating weekly achievements:', err);
      setError(err instanceof Error ? err.message : 'Failed to evaluate achievements');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refreshEvaluation = useCallback(async () => {
    await evaluateAchievements(currentWeekStart, currentWeekEnd);
  }, [evaluateAchievements, currentWeekStart, currentWeekEnd]);

  // Filtering functions
  const getAchievementsByCategory = useCallback((category: string): WeeklyAchievementResult[] => {
    return allAchievements.filter(achievement => achievement.achievement.category === category);
  }, [allAchievements]);

  const getAchievementsByDifficulty = useCallback((difficulty: string): WeeklyAchievementResult[] => {
    return allAchievements.filter(achievement => achievement.achievement.difficulty === difficulty);
  }, [allAchievements]);

  const getAchievementsByCriteria = useCallback((criteria: {
    category?: string;
    difficulty?: string;
    unlocked?: boolean;
    minProgress?: number;
  }): WeeklyAchievementResult[] => {
    return allAchievements.filter(achievement => {
      if (criteria.category && achievement.achievement.category !== criteria.category) return false;
      if (criteria.difficulty && achievement.achievement.difficulty !== criteria.difficulty) return false;
      if (criteria.unlocked !== undefined && achievement.unlocked !== criteria.unlocked) return false;
      if (criteria.minProgress !== undefined && achievement.progress < criteria.minProgress) return false;
      return true;
    });
  }, [allAchievements]);

  // Auto-evaluate on mount and when dates change
  useEffect(() => {
    if (userId) {
      evaluateAchievements(currentWeekStart, currentWeekEnd);
    }
  }, [userId, currentWeekStart, currentWeekEnd, evaluateAchievements]);

  return {
    // Core data
    allAchievements,
    unlockedAchievements,
    progressAchievements,
    nearCompletionAchievements,
    
    // Statistics
    stats,
    
    // Filtering
    getAchievementsByCategory,
    getAchievementsByDifficulty,
    getAchievementsByCriteria,
    
    // State
    loading,
    error,
    
    // Actions
    refreshEvaluation,
    evaluateAchievements
  };
}
