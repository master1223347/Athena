import { Achievement, AchievementDifficulty } from '@/types/achievement';

/**
 * Weekly achievements that can be determined through Canvas LMS API data
 * Based on assignment grades, completion rates, timing, and course engagement
 */

export interface WeeklyAchievement extends Omit<Achievement, 'id' | 'unlocked' | 'progress' | 'requirements'> {
  category: 'performance' | 'timing' | 'engagement' | 'variety' | 'improvement' | 'streak' | 'threshold';
  canvasDataRequired: string[];
  calculationMethod: string;
  weeklyCheck: boolean;
  progress?: number;
  requirements?: any;
}

export const WEEKLY_ACHIEVEMENTS: WeeklyAchievement[] = [
  // ========================================
  // EASY ACHIEVEMENTS
  // ========================================
  
  {
    title: "Assignment Starter",
    description: "Complete 10 assignments from your classes",
    category: "performance",
    difficulty: AchievementDifficulty.EASY,
    points: 30,
    icon: "📚",
    canvasDataRequired: ["assignment.status"],
    calculationMethod: "Count completed assignments in the week. Must be >= 10.",
    weeklyCheck: true
  },
  
  {
    title: "Perfect Timing",
    description: "Complete 100% of your assignments on time",
    category: "timing",
    difficulty: AchievementDifficulty.EASY,
    points: 30,
    icon: "⏰",
    canvasDataRequired: ["assignment.submitted_at", "assignment.due_date"],
    calculationMethod: "Check all submissions. None can be after due date.",
    weeklyCheck: true
  },
  
  {
    title: "Risk Taker",
    description: "Gamble on a test score",
    category: "engagement",
    difficulty: AchievementDifficulty.EASY,
    points: 30,
    icon: "🎲",
    canvasDataRequired: ["assignment.score", "assignment.possible"],
    calculationMethod: "Check if user has placed a bet on any assignment score.",
    weeklyCheck: true
  },
  
  {
    title: "Test Ace",
    description: "Earn 90% or more on at least one test/quiz",
    category: "performance",
    difficulty: AchievementDifficulty.EASY,
    points: 30,
    icon: "📊",
    canvasDataRequired: ["assignment.type", "assignment.score", "assignment.possible"],
    calculationMethod: "Filter test/quiz assignments. At least one must have >= 90% grade.",
    weeklyCheck: true
  },
  
  {
    title: "Rank Climber",
    description: "Advance at least 1 place in your ranking",
    category: "engagement",
    difficulty: AchievementDifficulty.EASY,
    points: 30,
    icon: "📈",
    canvasDataRequired: ["leaderboard_scores"],
    calculationMethod: "Compare current week ranking to previous week. Must improve by at least 1 position.",
    weeklyCheck: true
  },

  // ========================================
  // MEDIUM ACHIEVEMENTS
  // ========================================
  
  {
    title: "Assignment Master",
    description: "Complete 15 assignments from your classes",
    category: "performance",
    difficulty: AchievementDifficulty.MEDIUM,
    points: 50,
    icon: "📝",
    canvasDataRequired: ["assignment.status"],
    calculationMethod: "Count completed assignments in the week. Must be >= 15.",
    weeklyCheck: true
  },
  
  {
    title: "Early Bird",
    description: "Finish all your homework a day early",
    category: "timing",
    difficulty: AchievementDifficulty.MEDIUM,
    points: 50,
    icon: "🚀",
    canvasDataRequired: ["assignment.submitted_at", "assignment.due_date"],
    calculationMethod: "Check submission time vs due date. All must be submitted 24+ hours early.",
    weeklyCheck: true
  },
  
  {
    title: "Excellence Week",
    description: "Earn 90+% on all graded assignments this week",
    category: "performance",
    difficulty: AchievementDifficulty.MEDIUM,
    points: 50,
    icon: "⭐",
    canvasDataRequired: ["assignment.score", "assignment.possible"],
    calculationMethod: "Calculate average grade for all assignments due in the week. Must be >= 90%.",
    weeklyCheck: true
  },
  
  {
    title: "AI Quiz Champion",
    description: "Get 100% on an AI quiz",
    category: "performance",
    difficulty: AchievementDifficulty.MEDIUM,
    points: 50,
    icon: "🤖",
    canvasDataRequired: ["assignment.type", "assignment.score", "assignment.possible"],
    calculationMethod: "Filter AI quiz assignments. At least one must have 100% grade.",
    weeklyCheck: true
  },

  // ========================================
  // HARD ACHIEVEMENTS
  // ========================================
  
  {
    title: "Perfect Week",
    description: "Earn 100% on all graded assignments",
    category: "performance",
    difficulty: AchievementDifficulty.HARD,
    points: 100,
    icon: "💯",
    canvasDataRequired: ["assignment.score", "assignment.possible"],
    calculationMethod: "Calculate average grade for all assignments due in the week. Must be 100%.",
    weeklyCheck: true
  },
  
  {
    title: "Leaderboard Champion",
    description: "Get 1st place in your leaderboard",
    category: "engagement",
    difficulty: AchievementDifficulty.HARD,
    points: 100,
    icon: "🏆",
    canvasDataRequired: ["leaderboard_scores"],
    calculationMethod: "Check if user is ranked #1 in the leaderboard for the week.",
    weeklyCheck: true
  },
  
  {
    title: "Perfect Test",
    description: "Earn 100% on one test/quiz",
    category: "performance",
    difficulty: AchievementDifficulty.HARD,
    points: 100,
    icon: "📊",
    canvasDataRequired: ["assignment.type", "assignment.score", "assignment.possible"],
    calculationMethod: "Filter test/quiz assignments. At least one must have 100% grade.",
    weeklyCheck: true
  }
];

/**
 * Get achievements by category
 */
export function getWeeklyAchievementsByCategory(category: WeeklyAchievement['category']): WeeklyAchievement[] {
  return WEEKLY_ACHIEVEMENTS.filter(achievement => achievement.category === category);
}

/**
 * Get achievements by difficulty
 */
export function getWeeklyAchievementsByDifficulty(difficulty: WeeklyAchievement['difficulty']): WeeklyAchievement[] {
  return WEEKLY_ACHIEVEMENTS.filter(achievement => achievement.difficulty === difficulty);
}

/**
 * Get achievements that require specific Canvas data
 */
export function getWeeklyAchievementsByCanvasData(requiredData: string[]): WeeklyAchievement[] {
  return WEEKLY_ACHIEVEMENTS.filter(achievement => 
    requiredData.every(data => achievement.canvasDataRequired.includes(data))
  );
}

/**
 * Get all Canvas data fields required for weekly achievements
 */
export function getAllRequiredCanvasData(): string[] {
  const allData = new Set<string>();
  WEEKLY_ACHIEVEMENTS.forEach(achievement => {
    achievement.canvasDataRequired.forEach(data => allData.add(data));
  });
  return Array.from(allData);
}

/**
 * Weekly achievement categories and their descriptions
 */
export const WEEKLY_ACHIEVEMENT_CATEGORIES = {
  performance: {
    name: "Performance",
    description: "Based on grades and academic performance",
    icon: "📊",
    color: "blue"
  },
  timing: {
    name: "Timing",
    description: "Based on submission timing and punctuality",
    icon: "⏰",
    color: "green"
  },
  engagement: {
    name: "Engagement",
    description: "Based on course participation and balance",
    icon: "🌐",
    color: "purple"
  },
  variety: {
    name: "Variety",
    description: "Based on assignment type diversity",
    icon: "📝",
    color: "orange"
  },
  improvement: {
    name: "Improvement",
    description: "Based on academic progress and growth",
    icon: "📈",
    color: "teal"
  },
  streak: {
    name: "Streak",
    description: "Based on consecutive performance",
    icon: "🔥",
    color: "red"
  },
  threshold: {
    name: "Threshold",
    description: "Based on specific targets and milestones",
    icon: "🎯",
    color: "yellow"
  }
} as const;