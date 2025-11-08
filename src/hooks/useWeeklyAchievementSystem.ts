import { useState, useEffect } from 'react';
import { WeeklyAchievementIntegration } from '@/services/weeklyAchievementIntegration';
import { WeeklyAchievementSelection } from '@/services/weeklyAchievementSelector';

export interface WeeklyAchievementSystemStats {
  currentWeek: WeeklyAchievementSelection | null;
  totalWeeks: number;
  unlockedThisWeek: number;
  totalUnlocked: number;
  streak: number;
  availableAchievements: {
    easy: number;
    medium: number;
    hard: number;
    total: number;
  };
  usageStats: {
    totalUsed: number;
    totalAvailable: number;
    usagePercentage: number;
    needsReset: boolean;
  };
}

export interface UseWeeklyAchievementSystemReturn {
  selection: WeeklyAchievementSelection | null;
  stats: WeeklyAchievementSystemStats;
  loading: boolean;
  error: string | null;
  isNewWeek: boolean;
  refreshSystem: () => Promise<void>;
  forceRefreshSelection: () => Promise<void>;
}

/**
 * Main hook for the weekly achievement system
 * Handles initialization, weekly selection, and progress tracking
 */
export function useWeeklyAchievementSystem(userId: string): UseWeeklyAchievementSystemReturn {
  const [selection, setSelection] = useState<WeeklyAchievementSelection | null>(null);
  const [stats, setStats] = useState<WeeklyAchievementSystemStats>({
    currentWeek: null,
    totalWeeks: 0,
    unlockedThisWeek: 0,
    totalUnlocked: 0,
    streak: 0,
    availableAchievements: { easy: 0, medium: 0, hard: 0, total: 0 },
    usageStats: { totalUsed: 0, totalAvailable: 0, usagePercentage: 0, needsReset: false }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewWeek, setIsNewWeek] = useState(false);

  const refreshSystem = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`🔄 Refreshing weekly achievement system for user ${userId}`);
      
      // Initialize weekly achievements (handles new week detection)
      const currentSelection = await WeeklyAchievementIntegration.initializeWeeklyAchievements(userId);
      setSelection(currentSelection);
      
      // Get updated stats
      const updatedStats = await WeeklyAchievementIntegration.getWeeklyAchievementStats(userId);
      
      // Get additional stats for achievement tracking
      const { WeeklyAchievementSelector } = await import('@/services/weeklyAchievementSelector');
      const availableAchievements = await WeeklyAchievementSelector.getAvailableAchievementsCount(userId);
      const usageStats = await WeeklyAchievementSelector.getAchievementUsageStats(userId);
      
      setStats({
        ...updatedStats,
        availableAchievements,
        usageStats
      });
      
      // Check if this is a new week
      const lastWeekStart = getLastWeekStart(userId);
      const currentWeekStart = getCurrentWeekStart();
      const isNewWeekCheck = !lastWeekStart || lastWeekStart.getTime() !== currentWeekStart.getTime();
      setIsNewWeek(isNewWeekCheck);
      
      if (isNewWeekCheck) {
        // Store new week start
        storeCurrentWeekStart(userId);
      }
      
      console.log(`✅ Weekly achievement system refreshed successfully`);
      
    } catch (err) {
      console.error('Error refreshing weekly achievement system:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh weekly achievements');
    } finally {
      setLoading(false);
    }
  };

  const forceRefreshSelection = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`🔄 Force refreshing weekly achievement selection for user ${userId}`);
      
      // Force refresh the selection to get new achievements
      const { WeeklyAchievementSelector } = await import('@/services/weeklyAchievementSelector');
      const newSelection = await WeeklyAchievementSelector.forceRefreshSelection(userId);
      setSelection(newSelection);
      
      // Get updated stats
      const updatedStats = await WeeklyAchievementIntegration.getWeeklyAchievementStats(userId);
      
      // Get additional stats for achievement tracking
      const availableAchievements = await WeeklyAchievementSelector.getAvailableAchievementsCount(userId);
      const usageStats = await WeeklyAchievementSelector.getAchievementUsageStats(userId);
      
      setStats({
        ...updatedStats,
        availableAchievements,
        usageStats
      });
      
      // Check if this is a new week
      const lastWeekStart = getLastWeekStart(userId);
      const currentWeekStart = getCurrentWeekStart();
      const isNewWeekCheck = !lastWeekStart || lastWeekStart.getTime() !== currentWeekStart.getTime();
      setIsNewWeek(isNewWeekCheck);
      
      if (isNewWeekCheck) {
        // Store new week start
        storeCurrentWeekStart(userId);
      }
      
      console.log(`✅ Weekly achievement selection force refreshed successfully`);
      
    } catch (err) {
      console.error('Error force refreshing weekly achievement selection:', err);
      setError(err instanceof Error ? err.message : 'Failed to force refresh weekly achievements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSystem();
  }, [userId]);

  return {
    selection,
    stats,
    loading,
    error,
    isNewWeek,
    refreshSystem,
    forceRefreshSelection
  };
}

/**
 * Get current week start date (Monday)
 */
function getCurrentWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, Monday = 1
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + daysToMonday);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

/**
 * Get last week start date from localStorage
 */
function getLastWeekStart(userId: string): Date | null {
  try {
    const key = `last_week_start_${userId}`;
    const stored = localStorage.getItem(key);
    return stored ? new Date(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Store current week start in localStorage
 */
function storeCurrentWeekStart(userId: string): void {
  try {
    const currentWeekStart = getCurrentWeekStart();
    const key = `last_week_start_${userId}`;
    localStorage.setItem(key, currentWeekStart.toISOString());
  } catch (error) {
    console.error('Error storing current week start:', error);
  }
}

/**
 * Hook for getting weekly achievement progress
 */
export function useWeeklyAchievementProgress(userId: string) {
  const [progress, setProgress] = useState({
    easy: { progress: 0, unlocked: false },
    medium: { progress: 0, unlocked: false },
    hard: { progress: 0, unlocked: false }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProgress = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        // In a real implementation, this would calculate actual progress
        // For now, we'll return mock progress
        setProgress({
          easy: { progress: 0, unlocked: false },
          medium: { progress: 0, unlocked: false },
          hard: { progress: 0, unlocked: false }
        });
      } catch (error) {
        console.error('Error loading weekly achievement progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [userId]);

  return { progress, loading };
}
