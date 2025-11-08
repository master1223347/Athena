export enum AchievementDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export interface AchievementRequirement {
  type: 'page_view' | 'login_count' | 'unique_page_views' | 'app_usage' | 'canvas_sync' | 'profile_picture' | 'dark_mode' | 'assignment_complete' | 'perfect_grade' | 'course_grade_above';
  count?: number;
  page?: string;
  threshold?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: AchievementDifficulty;
  unlocked: boolean;
  progress: number;
  points: number;
  user_id?: string;
  requirements: AchievementRequirement;
}

export interface AchievementMetrics {
  pageViews: number;
  loginCount: number;
  uniquePageViews: string[];
  currentPage?: string;
  canvasSyncCount?: number;
  hasProfilePicture?: boolean;
  prefersDarkMode?: boolean;
  assignmentCompleteCount?: number;
  perfectGradeCount?: number;
  courseGradesAbove?: Record<number, number>; // Record of threshold -> count
  unlockedAchievementsCount?: number;
  totalAchievementsCount?: number;
}
