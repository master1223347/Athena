/**
 * This is a utility to patch the achievement tracking functions
 * It normalizes legacy metrics to the new achievement tracking system
 */

import { userDataService } from '@/services/userDataService';
import { AchievementMetrics } from '@/types/achievement';
import { supabase } from '@/integrations/supabase/client';
import { milestoneService } from '@/services/milestoneService';
import { userStorage } from '@/utils/userStorage';
import { collectUserMetrics } from './achievementMetricsService';
import { getMilestones } from '../../lib/milestones';

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
  if ('assignmentCompleteCount' in metrics) validMetrics.assignmentCompleteCount = metrics.assignmentCompleteCount;
  
  console.log('Achievement patcher: normalized metrics', metrics, '->', validMetrics);
  
  // Call the original method with normalized metrics
  return originalCheckAndUpdate.call(userDataService, userId, validMetrics);
};

// Patch the milestoneService.updateAssignmentCompletion method to track achievements
const originalUpdateAssignmentCompletion = milestoneService.updateAssignmentCompletion;
if (originalUpdateAssignmentCompletion) {
  milestoneService.updateAssignmentCompletion = async function(assignmentId: string, isCompleted: boolean) {
    const result = await originalUpdateAssignmentCompletion.call(this, assignmentId, isCompleted);
  
    try {
      // Update milestone status in Supabase
      await supabase
        .from('milestones')
        .update({ 
          status: isCompleted ? 'completed' : 'incomplete',
          completed_date: isCompleted ? new Date().toISOString() : null
        })
        .eq('id', assignmentId);
  
      const { data: milestone } = await supabase
        .from('milestones')
        .select('user_id')
        .eq('id', assignmentId)
        .single();
  
      if (milestone?.user_id) {
        const userId = milestone.user_id;
  
        // Get fresh count from database immediately
        const completedAssignments = await getMilestones(undefined, { userId, status: 'completed' });
  
        const currentCount = completedAssignments ? completedAssignments.length : 0;
        
        // Sync localStorage to database
        userStorage.setNumber(userId, 'assignmentCompleteCount', currentCount);
        const completedIds = completedAssignments ? completedAssignments.map(a => a.id) : [];
        userStorage.set(userId, 'trackedCompletedAssignments', JSON.stringify(completedIds));
  
        // Update achievements with fresh metrics
        const metrics = await collectUserMetrics(userId);
        await userDataService.checkAndUpdateAchievements(userId, metrics);
        
        console.log(`Assignment completion updated: ${currentCount} total completed`);
      }
    } catch (err) {
      console.error('Error updating assignment completion:', err);
    }
  
    return result;
  };  
}

// Export a function to initialize the patch
export function initAchievementPatcher() {
  console.log('Achievement tracking system patched for legacy metrics support');
}
