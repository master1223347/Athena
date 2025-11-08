import { Achievement, AchievementMetrics, AchievementRequirement } from '@/types/achievement';

/**
 * Calculate the progress of an achievement based on user metrics
 * Enhanced with better logging and more reliable progress calculations
 */
export function calculateAchievementProgress(
  achievement: Achievement,
  metrics: AchievementMetrics
): { progress: number; unlocked: boolean } {
  const requirement = achievement.requirements;
  let progress = 0;
  
  console.log(`Calculating progress for achievement: ${achievement.title} (${achievement.id})`);
  console.log(`Requirement type: ${requirement.type}`);

  try {
    switch (requirement.type) {
      case 'login_count':
        if (requirement.count && metrics.loginCount !== undefined) {
          progress = Math.min(100, Math.round((metrics.loginCount / requirement.count) * 100));
          console.log(`Login count: ${metrics.loginCount}/${requirement.count} = ${progress}%`);
        }
        break;
        
      case 'page_view':
        if (requirement.page && metrics.pageViews) {
          const pageViews = metrics.pageViews[requirement.page] || 0;
          progress = pageViews > 0 ? 100 : 0;
          console.log(`Page view ${requirement.page}: ${pageViews > 0 ? 'Viewed' : 'Not viewed'} = ${progress}%`);
        }
        break;
        
      case 'unique_page_views':
        if (requirement.count && metrics.uniquePageViews) {
          const uniqueViewsCount = metrics.uniquePageViews.length;
          progress = Math.min(100, Math.round((uniqueViewsCount / requirement.count) * 100));
          console.log(`Unique views: ${uniqueViewsCount}/${requirement.count} = ${progress}%`);
        }
        break;
        
      case 'app_usage':
        if (requirement.count && metrics.pageViews) {
          // This is a placeholder for app usage tracking
          const totalDays = Object.keys(metrics.pageViews).length;
          progress = Math.min(100, Math.round((totalDays / requirement.count) * 100));
          console.log(`App usage days: ${totalDays}/${requirement.count} = ${progress}%`);
        }
        break;
        
      case 'canvas_sync':
        if (requirement.count !== undefined && metrics.canvasSyncCount !== undefined) {
          // Special case for "First Steps" - if we have any sync count at all, achievement is complete
          if (achievement.id === '98ffd0cf-15f6-43b8-bdf2-7c0533d1b4ef' || achievement.title === 'First Steps') {
            progress = metrics.canvasSyncCount > 0 ? 100 : 0;
            console.log(`Canvas sync special case for First Steps - sync count: ${metrics.canvasSyncCount} > 0 = ${progress}%`);
          } else {
            progress = Math.min(100, Math.round((metrics.canvasSyncCount / requirement.count) * 100));
            console.log(`Canvas sync count: ${metrics.canvasSyncCount}/${requirement.count} = ${progress}%`);
          }
        }
        break;
        
      case 'profile_picture':
        if (metrics.hasProfilePicture !== undefined) {
          progress = metrics.hasProfilePicture ? 100 : 0;
          console.log(`Has profile picture: ${metrics.hasProfilePicture ? 'Yes' : 'No'} = ${progress}%`);
        }
        break;
        
      case 'dark_mode':
        if (metrics.prefersDarkMode !== undefined) {
          progress = metrics.prefersDarkMode ? 100 : 0;
          console.log(`Prefers dark mode: ${metrics.prefersDarkMode ? 'Yes' : 'No'} = ${progress}%`);
        }
        break;
        
      case 'assignment_complete':
        if (requirement.count && metrics.assignmentCompleteCount !== undefined) {
          // Calculate progress as a percentage (e.g., 2/5 = 40%)
          progress = Math.min(100, Math.round((metrics.assignmentCompleteCount / requirement.count) * 100));
          console.log(`Assignments completed: ${metrics.assignmentCompleteCount}/${requirement.count} = ${progress}%`);
        }
        break;
        
      case 'perfect_grade':
        if (requirement.count && metrics.perfectGradeCount !== undefined) {
          // Calculate progress as a percentage (e.g., 5/15 = 33%)
          progress = Math.min(100, Math.round((metrics.perfectGradeCount / requirement.count) * 100));
          console.log(`Perfect grades (100%): ${metrics.perfectGradeCount}/${requirement.count} = ${progress}%`);
        }
        break;
        
      case 'course_grade_above':
        if (requirement.threshold && requirement.count && metrics.courseGradesAbove) {
          const threshold = requirement.threshold;
          const count = metrics.courseGradesAbove[threshold] || 0;
          progress = Math.min(100, Math.round((count / requirement.count) * 100));
          console.log(`Courses with grades above ${threshold}%: ${count}/${requirement.count} = ${progress}%`);
        }
        break;
        
      default:
        console.warn(`Unknown achievement requirement type: ${requirement.type}`);
        break;
    }
  } catch (error) {
    console.error(`Error calculating progress for achievement ${achievement.id}:`, error);
    // Default to 0 progress in case of errors
    progress = 0;
  }
  
  // Round progress to nearest integer to avoid database type errors
  progress = Math.round(progress);
  
  // Achievement is unlocked when progress is 100%
  const unlocked = progress >= 100;
  
  console.log(`Achievement "${achievement.title}" (${achievement.id}) progress: ${progress}%, unlocked: ${unlocked}`);
  return { progress, unlocked };
}
