import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StreakService, StreakReward } from '@/services/streakService';

export interface StreakStats {
  daily: { current: number; longest: number; nextReward: number };
  weekly: { current: number; longest: number; nextReward: number };
}

export const useStreaks = () => {
  const { user } = useAuth();
  const [streakStats, setStreakStats] = useState<StreakStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastReward, setLastReward] = useState<StreakReward | null>(null);

  const loadStreakStats = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const stats = await StreakService.getStreakData(user.id);
      
      if (stats) {
        const dailyNextReward = calculateNextReward(stats.daily_login_streak, 7);
        const weeklyNextReward = calculateNextReward(stats.weekly_completion_streak, 7);
        
        setStreakStats({
          daily: {
            current: stats.daily_login_streak,
            longest: stats.daily_login_streak,
            nextReward: dailyNextReward,
          },
          weekly: {
            current: stats.weekly_completion_streak,
            longest: stats.weekly_completion_streak,
            nextReward: weeklyNextReward,
          },
        });
      } else {
        // No streak data found, initialize with default values
        setStreakStats({
          daily: {
            current: 0,
            longest: 0,
            nextReward: 7,
          },
          weekly: {
            current: 0,
            longest: 0,
            nextReward: 4,
          },
        });
      }
    } catch (error) {
      console.error('Error loading streak stats:', error);
      // Set default stats on error
      setStreakStats({
        daily: {
          current: 0,
          longest: 0,
          nextReward: 7,
        },
        weekly: {
          current: 0,
          longest: 0,
          nextReward: 4,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const processDailyLogin = useCallback(async (): Promise<StreakReward | null> => {
    if (!user) return null;
    
    try {
      const reward = await StreakService.processDailyLogin(user.id);
      if (reward) {
        setLastReward(reward);
        
        // Reload stats after a short delay
        setTimeout(() => {
          loadStreakStats();
        }, 1000);
        
        // Clear reward after 3 seconds
        setTimeout(() => {
          setLastReward(null);
        }, 3000);
      }
      return reward;
    } catch (error) {
      console.error('Error processing daily login:', error);
      return null;
    }
  }, [user, loadStreakStats]);

  const processWeeklyCompletion = useCallback(async (): Promise<StreakReward | null> => {
    if (!user) return null;
    
    try {
      const reward = await StreakService.processWeeklyCompletion(user.id);
      if (reward) {
        setLastReward(reward);
        
        // Reload stats after a short delay
        setTimeout(() => {
          loadStreakStats();
        }, 1000);
        
        // Clear reward after 3 seconds
        setTimeout(() => {
          setLastReward(null);
        }, 3000);
      }
      return reward;
    } catch (error) {
      console.error('Error processing weekly completion:', error);
      return null;
    }
  }, [user, loadStreakStats]);

  const calculateNextReward = (currentStreak: number, interval: number): number => {
    return Math.ceil((currentStreak + 1) / interval) * interval;
  };

  const getDailyMultiplier = (streak: number): number => {
    const multiplierCount = Math.floor(streak / 7);
    return Math.min(1 + (multiplierCount * 0.2), 4.0);
  };

  const getWeeklyMultiplier = (streak: number): number => {
    const multiplierCount = Math.floor(streak / 4);
    return Math.min(1 + (multiplierCount * 0.3), 3.0);
  };

  const getDailyPoints = (streak: number): number => {
    const multiplier = getDailyMultiplier(streak);
    const basePoints = Math.min(Math.floor(5 * multiplier), 50);
    const milestoneReward = StreakService.getDailyStreakReward(streak);
    return basePoints + milestoneReward;
  };

  const getWeeklyPoints = (streak: number): number => {
    const multiplier = getWeeklyMultiplier(streak);
    const basePoints = Math.min(Math.floor(100 * multiplier), 500);
    const milestoneReward = StreakService.getWeeklyStreakReward(streak);
    return basePoints + milestoneReward;
  };

  useEffect(() => {
    if (user) {
      loadStreakStats();
    }
  }, [user, loadStreakStats]);

  return {
    streakStats,
    loading,
    lastReward,
    loadStreakStats,
    processDailyLogin,
    processWeeklyCompletion,
    getDailyMultiplier,
    getWeeklyMultiplier,
    getDailyPoints,
    getWeeklyPoints,
    calculateNextReward,
  };
}; 