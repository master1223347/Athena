import { AchievementMetrics } from '@/types/achievement';
import { supabase } from '@/integrations/supabase/client';
import { userStorage } from '@/utils/userStorage';
import { checkAndUpdateAchievements } from './achievementActions';
import { getMilestones } from '../../lib/milestones';
import { getAchievements } from '@/lib/achievements';

/**
 * Service to fetch and collect metrics needed for achievement processing
 */
export async function collectUserMetrics(userId: string): Promise<AchievementMetrics> {
  try {
    // Get completed assignments count
    const completedAssignments = await getMilestones(undefined, { userId, status: 'completed' });
    const assignmentCompleteCount = completedAssignments.length;

    // Get perfect grade count (assignments with 100% grade)
    const perfectAssignments = await getMilestones(undefined, { userId, grade: 100 });
    const perfectGradeCount = perfectAssignments.length;

    // Get course grades
    const { data: courses } = await supabase
      .from('courses')
      .select('grade')
      .eq('user_id', userId)
      .not('grade', 'is', null);

    const courseGrades = courses?.map(c => c.grade) || [];
    const courseGradesAbove: Record<number, number> = {};
    
    // Count courses above different thresholds
    [90, 85, 80, 75, 70].forEach(threshold => {
      courseGradesAbove[threshold] = courseGrades.filter(grade => grade >= threshold).length;
    });

    // Get Canvas sync count
    const canvasSyncCount = userStorage.getNumber(userId, 'canvasSyncCount') || 0;

    // Get profile picture status
    const hasProfilePicture = userStorage.get(userId, 'hasProfilePicture') === 'true';

    // Get dark mode preference
    const prefersDarkMode = userStorage.get(userId, 'prefersDarkMode') === 'true';

    // Get page views
    const pageViews = userStorage.getNumber(userId, 'pageViews') || 0;

    // Get achievements count using the new helper
    const achievements = await getAchievements(userId);
    const unlockedAchievementsCount = achievements.filter(a => a.unlocked).length;
    const totalAchievementsCount = achievements.length;

    return {
      assignmentCompleteCount,
      perfectGradeCount,
      courseGradesAbove,
      canvasSyncCount,
      hasProfilePicture,
      prefersDarkMode,
      pageViews,
      unlockedAchievementsCount,
      totalAchievementsCount
    };
  } catch (error) {
    console.error('Error collecting user metrics:', error);
    return {
      assignmentCompleteCount: 0,
      perfectGradeCount: 0,
      courseGradesAbove: {},
      canvasSyncCount: 0,
      hasProfilePicture: false,
      prefersDarkMode: false,
      pageViews: 0,
      unlockedAchievementsCount: 0,
      totalAchievementsCount: 0
    };
  }
}

/**
 * Update metrics when tracking specific user actions
 */
export function trackLogin(userId: string): void {
  try {
    const loginCount = userStorage.getNumber(userId, 'loginCount', 0) + 1;
    userStorage.setNumber(userId, 'loginCount', loginCount);
    
    console.log(`Login tracked. Count: ${loginCount}`);
  } catch (error) {
    console.error('Error tracking login:', error);
  }
}

export function trackPageView(userId: string, page: string): void {
  try {
    // Store the current page
    userStorage.set(userId, 'currentPage', page);
    
    // Update page view tracking in localStorage
    const cleanPage = page.replace(/^\/+/, '').toLowerCase();
    const storedPageViews = userStorage.getObject<Record<string, number>>(userId, 'pageViews', {});
    const storedUniquePageViews = userStorage.getObject<string[]>(userId, 'visitedPages', []);
    
    // Update unique page views
    if (!storedUniquePageViews.includes(cleanPage)) {
      storedUniquePageViews.push(cleanPage);
      userStorage.setObject(userId, 'visitedPages', storedUniquePageViews);
    }
    
    // Update page view count
    if (!storedPageViews[cleanPage]) {
      storedPageViews[cleanPage] = 0;
    }
    storedPageViews[cleanPage]++;
    userStorage.setObject(userId, 'pageViews', storedPageViews);
    
    console.log(`Page view tracked: ${page}`);
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
}

export function trackCanvasSync(userId: string): void {
  try {
    const syncCount = userStorage.getNumber(userId, 'canvasSyncCount', 0) + 1;
    userStorage.setNumber(userId, 'canvasSyncCount', syncCount);
    
    console.log(`Canvas sync event tracked. Count: ${syncCount}`);
  } catch (error) {
    console.error('Error tracking Canvas sync:', error);
  }
}

export function trackProfilePictureUpdate(userId: string): void {
  try {
    userStorage.setBoolean(userId, 'hasProfilePicture', true);
    
    console.log('Profile picture update tracked: true');
  } catch (error) {
    console.error('Error tracking profile picture update:', error);
  }
}

export function trackThemeChange(userId: string, theme: 'dark' | 'light'): void {
  try {
    const isDarkMode = theme === 'dark';
    userStorage.setBoolean(userId, 'prefersDarkMode', isDarkMode);
    
    console.log(`Theme change tracked: ${theme}`);
  } catch (error) {
    console.error('Error tracking theme change:', error);
  }
}

export function trackAssignmentComplete(userId: string, totalCompleted?: number) {
  // If specific total provided, use it and update achievements
  if (totalCompleted !== undefined) {
    userStorage.setNumber(userId, "assignmentCompleteCount", totalCompleted);
    checkAndUpdateAchievements(userId, { assignmentCompleteCount: totalCompleted });
  } else {
    // Otherwise, refresh from database to get accurate count
    collectUserMetrics(userId).then(metrics => {
      checkAndUpdateAchievements(userId, metrics);
    }).catch(error => {
      console.error('Error refreshing assignment completion:', error);
    });
  }
}

export function trackPerfectGrade(userId: string): void {
  try {
    const perfectGradeCount = userStorage.getNumber(userId, 'perfectGradeCount', 0) + 1;
    userStorage.setNumber(userId, 'perfectGradeCount', perfectGradeCount);
    
    console.log(`Perfect grade tracked. Count: ${perfectGradeCount}`);
  } catch (error) {
    console.error('Error tracking perfect grade:', error);
  }
}
