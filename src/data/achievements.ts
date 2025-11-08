
import { Achievement, AchievementDifficulty } from '@/types/achievement';
import { v4 as uuidv4 } from 'uuid';

// Empty achievements array to prevent any default achievements from being added
export const ACHIEVEMENTS: Achievement[] = [];

// Export with backward compatibility
export { ACHIEVEMENTS as achievements };
