
// This file is deprecated. All functionality has been moved to AchievementManager.ts
// Keeping this file as a stub for backward compatibility

import { Achievement, AchievementMetrics } from '@/types/achievement';
import { achievementManager } from './AchievementManager';
import { collectUserMetrics } from './achievementMetricsService';
import { calculateAchievementProgress } from '@/utils/achievement/achievementTracker';
import {
  processFirstStepsAchievement,
  process5GuysAchievement,
  process35GuysAchievement,
  process65GuysAchievement,
  processGoodLooksAchievement,
  processAceAchievement,
  processGettingThereAchievement,
  processGettingCloserAchievement,
  processGotThereAchievement,
  processDayNNiteAchievement
} from './achievementProcessors';

// Forward all calls to the AchievementManager
export async function getAchievements(userId: string): Promise<Achievement[]> {
  return achievementManager.getAchievements(userId);
}

export async function updateAchievement(achievementId: string, updates: Partial<Achievement>): Promise<void> {
  return achievementManager.updateAchievement(achievementId, updates);
}

export async function getAchievementById(achievementId: string): Promise<Achievement | null> {
  // Get achievement directly from database since this isn't included in the manager
  const achievements = await achievementManager.getAchievements(achievementId.split('-')[0]);
  return achievements.find(a => a.id === achievementId) || null;
}

export async function syncAchievementsWithCode(userId: string): Promise<void> {
  // This is now handled by refreshAchievements
  return achievementManager.refreshAchievements(userId);
}

export async function resetAchievements(userId: string): Promise<void> {
  return achievementManager.refreshAchievements(userId);
}

export async function addAchievement(userId: string, achievement: Achievement): Promise<void> {
  return achievementManager.addAchievement(userId, achievement);
}

export async function checkAndUpdateAchievements(userId: string, metrics: Partial<AchievementMetrics> = {}): Promise<void> {
  try {
    console.log('Checking and updating achievements with metrics:', metrics);
    
    // Get all user metrics
    const allMetrics = await collectUserMetrics(userId);
    const combinedMetrics: AchievementMetrics = {
      ...allMetrics,
      ...metrics
    };
    
    console.log('All metrics for achievement calculation:', combinedMetrics);
    
    // Get user's current achievements
    const achievements = await getAchievements(userId);
    
    // Process each achievement
    for (const achievement of achievements) {
      const { progress, unlocked } = calculateAchievementProgress(achievement, combinedMetrics);
      
      // Update achievement progress if changed
      if (progress !== achievement.progress || unlocked !== achievement.unlocked) {
        console.log(`Updating achievement ${achievement.title}: progress=${progress}, unlocked=${unlocked}`);
        await updateAchievement(achievement.id, { progress, unlocked });
      }
    }
    
    // Ensure all achievement exists and are properly processed
    await processFirstStepsAchievement(userId, combinedMetrics, updateAchievement, addAchievement);
    await process5GuysAchievement(userId, combinedMetrics, updateAchievement, addAchievement);
    await process35GuysAchievement(userId, combinedMetrics, updateAchievement, addAchievement);
    await process65GuysAchievement(userId, combinedMetrics, updateAchievement, addAchievement);
    await processGoodLooksAchievement(userId, combinedMetrics, updateAchievement, addAchievement);
    await processAceAchievement(userId, combinedMetrics, updateAchievement, addAchievement);
    await processGettingThereAchievement(userId, combinedMetrics, updateAchievement, addAchievement);
    await processGettingCloserAchievement(userId, combinedMetrics, updateAchievement, addAchievement);
    await processGotThereAchievement(userId, combinedMetrics, updateAchievement, addAchievement);
    await processDayNNiteAchievement(userId, combinedMetrics, updateAchievement, addAchievement);
  } catch (error) {
    console.error('Error checking and updating achievements:', error);
  }
}
