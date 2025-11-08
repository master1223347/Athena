
import { Achievement, AchievementMetrics } from '@/types/achievement';
import { achievementManager } from './AchievementManager';
import { calculateLevel, calculatePointsToNextLevel } from '@/utils/achievement/levelUtils';

/**
 * Achievement service that delegates to the centralized AchievementManager
 */
class AchievementService {
  // Core achievement operations
  getAchievements = achievementManager.getAchievements.bind(achievementManager);
  updateAchievement = achievementManager.updateAchievement.bind(achievementManager);
  refreshAchievements = achievementManager.refreshAchievements.bind(achievementManager);
  addAchievement = achievementManager.addAchievement.bind(achievementManager);
  checkAndUpdateAchievements = achievementManager.checkAndUpdateAchievements.bind(achievementManager);
  
  // Tracking methods
  trackLogin = achievementManager.trackLogin.bind(achievementManager);
  trackPageView = achievementManager.trackPageView.bind(achievementManager);
  trackCanvasSync = achievementManager.trackCanvasSync.bind(achievementManager);
  trackProfilePictureUpdate = achievementManager.trackProfilePictureUpdate.bind(achievementManager);
  trackThemeChange = achievementManager.trackThemeChange.bind(achievementManager);
  trackAssignmentComplete = achievementManager.trackAssignmentComplete.bind(achievementManager);
  trackPerfectGrade = achievementManager.trackPerfectGrade.bind(achievementManager);
  
  // Level utilities
  calculateLevel = calculateLevel;
  calculatePointsToNextLevel = calculatePointsToNextLevel;
}

export const achievementService = new AchievementService();
