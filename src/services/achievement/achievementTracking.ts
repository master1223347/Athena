
import { calculateAchievementProgress } from '@/utils/achievement/achievementTracker';
import { calculateLevel, calculatePointsToNextLevel } from '@/utils/achievement/levelUtils';
import { checkAndUpdateAchievements } from './achievementActions';
import { userStorage } from '@/utils/userStorage';

/**
 * Functions to track user activities for achievements
 */
export function trackLogin(userId: string): void {
  const loginCount = userStorage.getNumber(userId, 'loginCount', 0) + 1;
  userStorage.setNumber(userId, 'loginCount', loginCount);
  
  // Update achievements based on login
  checkAndUpdateAchievements(userId, { loginCount });
}

export function trackPageView(userId: string, page: string): void {
  // Store the current page
  userStorage.set(userId, 'currentPage', page);
  
  // Update achievements with current page
  checkAndUpdateAchievements(userId, { currentPage: page });
}

// Track Canvas sync events
export function trackCanvasSync(userId: string): void {
  const syncCount = userStorage.getNumber(userId, 'canvasSyncCount', 0) + 1;
  userStorage.setNumber(userId, 'canvasSyncCount', syncCount);
  
  // Ensure we persist the sync count
  console.log(`Canvas sync event tracked. Current count: ${syncCount}`);
  
  // Trigger immediate achievement check
  setTimeout(() => {
    checkAndUpdateAchievements(userId, { canvasSyncCount: syncCount });
  }, 500);
}

// Track profile picture update events
export function trackProfilePictureUpdate(userId: string): void {
  // Set the flag to true when a profile picture is updated
  userStorage.setBoolean(userId, 'hasProfilePicture', true);
  
  console.log('Profile picture update tracked: true');
  
  // Trigger immediate achievement check
  setTimeout(() => {
    checkAndUpdateAchievements(userId, { hasProfilePicture: true });
  }, 500);
}

// Track theme change events
export function trackThemeChange(userId: string, theme: 'dark' | 'light'): void {
  // Store the theme preference
  const isDarkMode = theme === 'dark';
  userStorage.setBoolean(userId, 'prefersDarkMode', isDarkMode);
  
  console.log(`Theme change tracked: ${theme} (isDarkMode: ${isDarkMode})`);
  
  // Trigger immediate achievement check
  setTimeout(() => {
    checkAndUpdateAchievements(userId, { prefersDarkMode: isDarkMode });
  }, 500);
}


// Expose level calculation methods
export { calculateLevel, calculatePointsToNextLevel };
