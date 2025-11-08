import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StreakAchievement {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly';
  milestone: number;
  points: number;
  icon: string;
  unlocked: boolean;
}

export const STREAK_ACHIEVEMENTS: Omit<StreakAchievement, 'id' | 'unlocked'>[] = [
  // Daily streak achievements
  {
    title: "First Steps",
    description: "Complete your first daily login streak",
    type: "daily",
    milestone: 1,
    points: 10,
    icon: "🔥"
  },
  {
    title: "Three Day Warrior",
    description: "Maintain a 3-day daily login streak",
    type: "daily",
    milestone: 3,
    points: 15,
    icon: "⚡"
  },
  {
    title: "Week Warrior",
    description: "Maintain a 7-day daily login streak",
    type: "daily",
    milestone: 7,
    points: 25,
    icon: "💪"
  },
  {
    title: "Fortnight Fighter",
    description: "Maintain a 14-day daily login streak",
    type: "daily",
    milestone: 14,
    points: 50,
    icon: "🎯"
  },
  {
    title: "Monthly Master",
    description: "Maintain a 30-day daily login streak",
    type: "daily",
    milestone: 30,
    points: 100,
    icon: "👑"
  },
  {
    title: "Two Month Titan",
    description: "Maintain a 60-day daily login streak",
    type: "daily",
    milestone: 60,
    points: 200,
    icon: "🏆"
  },
  {
    title: "Century Club",
    description: "Maintain a 100-day daily login streak",
    type: "daily",
    milestone: 100,
    points: 500,
    icon: "💎"
  },

  // Weekly streak achievements
  {
    title: "Weekly Wonder",
    description: "Complete your first weekly completion streak",
    type: "weekly",
    milestone: 1,
    points: 50,
    icon: "📅"
  },
  {
    title: "Two Week Titan",
    description: "Maintain a 2-week completion streak",
    type: "weekly",
    milestone: 2,
    points: 75,
    icon: "🌟"
  },
  {
    title: "Monthly Marvel",
    description: "Maintain a 4-week completion streak",
    type: "weekly",
    milestone: 4,
    points: 150,
    icon: "💫"
  },
  {
    title: "Two Month Master",
    description: "Maintain an 8-week completion streak",
    type: "weekly",
    milestone: 8,
    points: 300,
    icon: "🎖️"
  },
  {
    title: "Quarterly Queen",
    description: "Maintain a 12-week completion streak",
    type: "weekly",
    milestone: 12,
    points: 500,
    icon: "💎"
  },
  {
    title: "Half Year Hero",
    description: "Maintain a 26-week completion streak",
    type: "weekly",
    milestone: 26,
    points: 1000,
    icon: "🏅"
  },
  {
    title: "Yearly Legend",
    description: "Maintain a 52-week completion streak",
    type: "weekly",
    milestone: 52,
    points: 2000,
    icon: "👑"
  }
];

export class StreakAchievementService {
  /**
   * Check and award streak achievements
   */
  static async checkStreakAchievements(
    userId: string, 
    dailyStreak: number, 
    weeklyStreak: number
  ): Promise<StreakAchievement[]> {
    try {
      // Get existing achievements for this user
      const { data: existingAchievements } = await supabase
        .from('achievements')
        .select('title, progress')
        .eq('user_id', userId)
        .like('title', '%streak%');

      const unlockedAchievements: StreakAchievement[] = [];

      // Check daily streak achievements
      for (const achievement of STREAK_ACHIEVEMENTS.filter(a => a.type === 'daily')) {
        if (dailyStreak >= achievement.milestone) {
          const exists = existingAchievements?.some(ea => ea.title === achievement.title);
          
          if (!exists) {
            // Create new achievement
            const { data: newAchievement, error } = await supabase
              .from('achievements')
              .insert({
                user_id: userId,
                title: achievement.title,
                description: achievement.description,
                difficulty: this.getDifficulty(achievement.milestone),
                icon: achievement.icon,
                points: achievement.points,
                progress: 100,
                unlocked: true,
                requirements: { type: 'streak', milestone: achievement.milestone }
              })
              .select()
              .single();

            if (newAchievement && !error) {
              unlockedAchievements.push({
                ...achievement,
                id: newAchievement.id,
                unlocked: true
              });

              // Show toast notification
              toast.success(`🏆 Achievement Unlocked: ${achievement.title}`, {
                description: `+${achievement.points} XP for your ${achievement.milestone}-day streak!`,
                duration: 5000,
              });
            }
          }
        }
      }

      // Check weekly streak achievements
      for (const achievement of STREAK_ACHIEVEMENTS.filter(a => a.type === 'weekly')) {
        if (weeklyStreak >= achievement.milestone) {
          const exists = existingAchievements?.some(ea => ea.title === achievement.title);
          
          if (!exists) {
            // Create new achievement
            const { data: newAchievement, error } = await supabase
              .from('achievements')
              .insert({
                user_id: userId,
                title: achievement.title,
                description: achievement.description,
                difficulty: this.getDifficulty(achievement.milestone),
                icon: achievement.icon,
                points: achievement.points,
                progress: 100,
                unlocked: true,
                requirements: { type: 'streak', milestone: achievement.milestone }
              })
              .select()
              .single();

            if (newAchievement && !error) {
              unlockedAchievements.push({
                ...achievement,
                id: newAchievement.id,
                unlocked: true
              });

              // Show toast notification
              toast.success(`🏆 Achievement Unlocked: ${achievement.title}`, {
                description: `+${achievement.points} XP for your ${achievement.milestone}-week streak!`,
                duration: 5000,
              });
            }
          }
        }
      }

      return unlockedAchievements;
    } catch (error) {
      console.error('Error checking streak achievements:', error);
      return [];
    }
  }

  /**
   * Get difficulty based on milestone
   */
  private static getDifficulty(milestone: number): string {
    if (milestone <= 7) return 'easy';
    if (milestone <= 30) return 'medium';
    if (milestone <= 100) return 'hard';
    return 'legendary';
  }

  /**
   * Get next achievement milestone
   */
  static getNextMilestone(currentStreak: number, type: 'daily' | 'weekly'): number | null {
    const achievements = STREAK_ACHIEVEMENTS.filter(a => a.type === type);
    const nextAchievement = achievements.find(a => a.milestone > currentStreak);
    return nextAchievement?.milestone || null;
  }

  /**
   * Get progress towards next achievement
   */
  static getAchievementProgress(currentStreak: number, type: 'daily' | 'weekly'): {
    current: number;
    next: number | null;
    progress: number;
  } {
    const nextMilestone = this.getNextMilestone(currentStreak, type);
    
    if (!nextMilestone) {
      return { current: currentStreak, next: null, progress: 100 };
    }

    const progress = Math.min((currentStreak / nextMilestone) * 100, 100);
    return { current: currentStreak, next: nextMilestone, progress };
  }
} 