
import { Achievement as AppAchievement, AchievementDifficulty, AchievementRequirement } from '@/types/achievement';
import { Json, Achievement as DbAchievement } from '@/types/supabase';

/**
 * Maps database achievement records to the application's Achievement model
 */
export function mapDatabaseRecordsToAchievements(records: DbAchievement[]): AppAchievement[] {
  return records.map(record => ({
    id: record.id,
    title: record.title,
    description: record.description,
    icon: record.icon,
    difficulty: mapDifficultyValue(record.difficulty),
    points: record.points || 0,
    unlocked: record.unlocked ?? false,
    progress: record.progress ?? 0,
    user_id: record.user_id,
    requirements: mapDbRequirementsToAppRequirements(record.requirements)
  }));
}

/**
 * Maps an application Achievement to database format
 */
export function mapAchievementToDatabaseFormat(achievement: Partial<AppAchievement>): Partial<DbAchievement> {
  if (!achievement) return {};
  
  // Create a new object to hold the database-formatted achievement
  const result: Record<string, any> = {};
  
  // Copy over basic properties
  if (achievement.id !== undefined) result.id = achievement.id;
  if (achievement.title !== undefined) result.title = achievement.title;
  if (achievement.description !== undefined) result.description = achievement.description;
  if (achievement.icon !== undefined) result.icon = achievement.icon;
  if (achievement.points !== undefined) result.points = achievement.points;
  if (achievement.progress !== undefined) result.progress = achievement.progress;
  if (achievement.unlocked !== undefined) result.unlocked = achievement.unlocked;
  if (achievement.user_id !== undefined) result.user_id = achievement.user_id;
  
  // Convert requirements to Json format if present
  if (achievement.requirements) {
    result.requirements = achievement.requirements as unknown as Json;
  }
  
  // Convert difficulty to string if it's an enum
  if (achievement.difficulty !== undefined) {
    result.difficulty = typeof achievement.difficulty === 'string'
      ? achievement.difficulty
      : String(achievement.difficulty).toLowerCase();
  }
  
  return result as Partial<DbAchievement>;
}

/**
 * Maps database Json requirements to application AchievementRequirement type
 */
export function mapDbRequirementsToAppRequirements(requirements: Json): AchievementRequirement {
  // Direct cast is safe because we validate the structure
  const req = requirements as unknown as AchievementRequirement;
  
  // Ensure the type property exists
  if (!req || !req.type) {
    console.warn('Invalid achievement requirements format:', requirements);
    return {
      type: 'page_view',
      page: 'dashboard'
    };
  }
  
  return req;
}

/**
 * Maps application AchievementRequirement to database Json format
 */
export function mapAppRequirementsToDbRequirements(requirements: AchievementRequirement): Json {
  return requirements as unknown as Json;
}

/**
 * Maps difficulty string value to enum
 */
export function mapDifficultyValue(difficultyValue: string): AchievementDifficulty {
  switch(difficultyValue.toLowerCase()) {
    case 'easy':
      return AchievementDifficulty.EASY;
    case 'medium':
      return AchievementDifficulty.MEDIUM;
    case 'hard':
      return AchievementDifficulty.HARD;
    default:
      return AchievementDifficulty.EASY; // Default case
  }
}
