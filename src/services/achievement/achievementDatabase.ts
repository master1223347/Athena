import { supabase } from '@/integrations/supabase/client';
import { Achievement, AchievementRequirement } from '@/types/achievement';
import { v4 as uuidv4 } from 'uuid';
import { getAchievements } from '@/lib/achievements';

// Type for database operations
type AchievementDB = Omit<Achievement, 'requirements'> & {
  requirements: any; // Using 'any' for the database JSON field
};

// Helper functions for type conversion
function fromDB(dbAchievement: any): Achievement {
  return {
    ...dbAchievement,
    requirements: dbAchievement.requirements as AchievementRequirement
  };
}

function toDB(achievement: Partial<Achievement>): any {
  if (!achievement.requirements) {
    return achievement;
  }
  
  return {
    ...achievement,
    requirements: achievement.requirements as any
  };
}

// Database operations for achievements
export async function fetchUserAchievements(userId: string): Promise<Achievement[]> {
  try {
    // Use the new Redis-cached helper
    const achievements = await getAchievements(userId);
    return achievements;
  } catch (error) {
    console.error('Error fetching achievements:', error);
    throw new Error(`Failed to fetch achievements: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function fetchAchievementById(achievementId: string): Promise<Achievement | null> {
  try {
    // For single achievement lookup, we still need to use direct Supabase query
    // since the helper is designed for user-wide queries
    const { data, error } = await supabase
    .from('achievements')
    .select('id, user_id, title, progress, unlocked, points, requirements')
    .eq('id', achievementId)
    .single();
  
      
    if (error) {
      console.error('Error fetching achievement by ID:', error);
      return null;
    }
    
    // Convert from DB format to Achievement type
    return data ? fromDB(data) : null;
  } catch (error) {
    console.error('Error fetching achievement by ID:', error);
    return null;
  }
}

export async function updateAchievementInDatabase(achievementId: string, updates: Partial<Achievement>) {
  // Convert to DB format before updating
  const dbUpdates = toDB(updates);
  
  // Ensure progress is always an integer
  if (typeof dbUpdates.progress === 'number') {
    dbUpdates.progress = Math.round(dbUpdates.progress);
  }
  
  const { error } = await supabase
    .from('achievements')
    .update(dbUpdates)
    .eq('id', achievementId);

  if (error) {
    console.error('Error updating achievement:', error);
    throw new Error(`Failed to update achievement: ${error.message}`);
  }
}

export async function deleteAllUserAchievements(userId: string) {
  console.log(`Deleting ALL achievements for user ${userId}`);
  const { error } = await supabase
    .from('achievements')
    .delete()
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error deleting all achievements:', error);
    throw new Error(`Failed to delete all achievements: ${error.message}`);
  }
}

export async function deleteAchievementById(achievementId: string) {
  const { error } = await supabase
    .from('achievements')
    .delete()
    .eq('id', achievementId);
    
  if (error) {
    console.error('Error deleting achievement by ID:', error);
    throw new Error(`Failed to delete achievement: ${error.message}`);
  }
}

export async function insertAchievement(
  achievement: Omit<Achievement, "id"> & { user_id: string }
) {
  const dbAchievement = toDB({
    ...achievement,
    id: uuidv4(),
    // make sure progress is an integer
    progress: Math.round(achievement.progress ?? 0),
  });

  const { error } = await supabase
    .from("achievements")
    .upsert(dbAchievement, {
      // same columns you declared UNIQUE in Postgres
      onConflict: "user_id,title",
    });

  if (error) {
    console.error(`Error upserting achievement ${achievement.title}:`, error);
    throw error;
  }
}

