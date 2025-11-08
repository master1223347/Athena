import { useState, useEffect } from 'react';
import { 
  WeeklyAchievementSelector, 
  WeeklyAchievementSelection, 
  WeeklyAchievementProgress 
} from '@/services/weeklyAchievementSelector';

export interface UseWeeklyAchievementSelectionReturn {
  selection: WeeklyAchievementSelection | null;
  progress: WeeklyAchievementProgress | null;
  loading: boolean;
  error: string | null;
  refreshSelection: () => Promise<void>;
  isNewWeek: boolean;
}

/**
 * Hook for managing weekly achievement selection
 * Each week selects 1 easy, 1 medium, and 1 hard achievement
 */
export function useWeeklyAchievementSelection(userId: string): UseWeeklyAchievementSelectionReturn {
  const [selection, setSelection] = useState<WeeklyAchievementSelection | null>(null);
  const [progress, setProgress] = useState<WeeklyAchievementProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewWeek, setIsNewWeek] = useState(false);

  const refreshSelection = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // Force refresh the selection to get new achievements
      const currentSelection = await WeeklyAchievementSelector.forceRefreshSelection(userId);
      
      // Check if this is a new week
      const lastWeekStart = getLastWeekStart();
      const currentWeekStart = getCurrentWeekStart();
      const isNewWeekCheck = !lastWeekStart || lastWeekStart.getTime() !== currentWeekStart.getTime();
      setIsNewWeek(isNewWeekCheck);
      
      setSelection(currentSelection);
      
      // Get progress for current week
      const currentProgress = await WeeklyAchievementSelector.getCurrentWeekProgress(userId);
      setProgress(currentProgress);
      
    } catch (err) {
      console.error('Error refreshing weekly achievement selection:', err);
      setError(err instanceof Error ? err.message : 'Failed to load weekly achievements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSelection();
  }, [userId]);

  return {
    selection,
    progress,
    loading,
    error,
    refreshSelection,
    isNewWeek
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
function getLastWeekStart(): Date | null {
  try {
    const stored = localStorage.getItem('last_week_start');
    return stored ? new Date(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Store current week start in localStorage
 */
function storeCurrentWeekStart(): void {
  try {
    const currentWeekStart = getCurrentWeekStart();
    localStorage.setItem('last_week_start', currentWeekStart.toISOString());
  } catch (error) {
    console.error('Error storing current week start:', error);
  }
}

/**
 * Hook for getting weekly achievement statistics
 */
export function useWeeklyAchievementStats(userId: string) {
  const [stats, setStats] = useState({
    totalWeeks: 0,
    unlockedEasy: 0,
    unlockedMedium: 0,
    unlockedHard: 0,
    totalUnlocked: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const userStats = await WeeklyAchievementSelector.getUserAchievementStats(userId);
        setStats(userStats);
      } catch (error) {
        console.error('Error loading weekly achievement stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userId]);

  return { stats, loading };
}
