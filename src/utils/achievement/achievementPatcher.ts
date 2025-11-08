
/**
 * This is a utility to patch the achievement tracking functions
 * It normalizes legacy metrics to the new achievement tracking system
 */

import { userDataService } from '@/services/userDataService';
import { AchievementMetrics } from '@/types/achievement';

// Original method reference
const originalCheckAndUpdate = userDataService.checkAndUpdateAchievements;

// Patch the checkAndUpdateAchievements method
userDataService.checkAndUpdateAchievements = function(userId: string, metrics: any = {}) {
  // Create a valid metrics object that matches our current type definition
  const validMetrics: Partial<AchievementMetrics> = {};
  
  // Handle current page views (most important for our new achievement system)
  if ('currentPage' in metrics) {
    validMetrics.currentPage = metrics.currentPage;
  } else if ('courseViews' in metrics || 'courseEdits' in metrics) {
    // If we're in the courses page
    validMetrics.currentPage = 'courses';
  }
  
  // Copy valid properties
  if ('pageViews' in metrics) validMetrics.pageViews = metrics.pageViews;
  if ('loginCount' in metrics) validMetrics.loginCount = metrics.loginCount;
  if ('uniquePageViews' in metrics) validMetrics.uniquePageViews = metrics.uniquePageViews;
  if ('canvasSyncCount' in metrics) validMetrics.canvasSyncCount = metrics.canvasSyncCount;
  if ('hasProfilePicture' in metrics) validMetrics.hasProfilePicture = metrics.hasProfilePicture;
  if ('prefersDarkMode' in metrics) validMetrics.prefersDarkMode = metrics.prefersDarkMode;
  
  console.log('Achievement patcher: normalized metrics', metrics, '->', validMetrics);
  
  // Call the original method with normalized metrics
  return originalCheckAndUpdate.call(userDataService, userId, validMetrics);
};

// Export a function to initialize the patch
export function initAchievementPatcher() {
  console.log('Achievement tracking system patched for legacy metrics support');
}
