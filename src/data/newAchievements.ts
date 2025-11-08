
import { Achievement, AchievementDifficulty } from '@/types/achievement';
import { v4 as uuidv4 } from 'uuid';

// Define the new achievements with UUID format IDs to ensure compatibility with database
export const NEW_ACHIEVEMENTS: Achievement[] = [
  // Canvas Connection Achievement
  {
    id: uuidv4(),
    title: 'First Steps',
    description: 'Connect your Canvas account to the application',
    icon: 'graduation-cap',
    difficulty: AchievementDifficulty.EASY,
    points: 10,
    unlocked: false,
    progress: 0,
    requirements: {
      type: 'canvas_sync',
      count: 1
    }
  },
  // Assignment Completion Achievement
  {
    id: uuidv4(),
    title: '5 Guys',
    description: 'Mark 5 assignments as complete',
    icon: 'check-square',
    difficulty: AchievementDifficulty.EASY,
    points: 10,
    unlocked: false,
    progress: 0,
    requirements: {
      type: 'assignment_complete',
      count: 5
    }
  },
  // Medium Assignment Completion Achievement (new)
  {
    id: uuidv4(),
    title: '35 Guys',
    description: 'Mark 35 assignments as complete',
    icon: 'check-square',
    difficulty: AchievementDifficulty.MEDIUM,
    points: 30,
    unlocked: false,
    progress: 0,
    requirements: {
      type: 'assignment_complete',
      count: 35
    }
  },
  // Hard Assignment Completion Achievement (new)
  {
    id: uuidv4(),
    title: '65 Guys',
    description: 'Mark 65 assignments as complete',
    icon: 'check-square',
    difficulty: AchievementDifficulty.HARD,
    points: 50,
    unlocked: false,
    progress: 0,
    requirements: {
      type: 'assignment_complete',
      count: 65
    }
  },
  // Profile Picture Achievement (new)
  {
    id: uuidv4(),
    title: 'Good Looks',
    description: 'Upload a profile picture',
    icon: 'image',
    difficulty: AchievementDifficulty.EASY,
    points: 10,
    unlocked: false,
    progress: 0,
    requirements: {
      type: 'profile_picture'
    }
  },
  // New Perfect Grade Achievement
  {
    id: uuidv4(),
    title: 'Ace',
    description: 'Get 15 assignments graded 100%',
    icon: 'award',
    difficulty: AchievementDifficulty.MEDIUM,
    points: 30,
    unlocked: false,
    progress: 0,
    requirements: {
      type: 'perfect_grade',
      count: 15
    }
  },
  // New Course Grade Achievement
  {
    id: uuidv4(),
    title: 'Getting There',
    description: 'Have at least 1 course with a grade above 90%',
    icon: 'trending-up',
    difficulty: AchievementDifficulty.EASY,
    points: 10,
    unlocked: false,
    progress: 0,
    requirements: {
      type: 'course_grade_above',
      threshold: 90,
      count: 1
    }
  },
  // New "Getting Closer" Achievement (3 courses above 90%)
  {
    id: uuidv4(),
    title: 'Getting Closer',
    description: 'Have at least 3 courses with grades above 90%',
    icon: 'trending-up',
    difficulty: AchievementDifficulty.MEDIUM,
    points: 30,
    unlocked: false,
    progress: 0,
    requirements: {
      type: 'course_grade_above',
      threshold: 90,
      count: 3
    }
  },
  // New "Got There" Achievement (5 courses above 90%)
  {
    id: uuidv4(),
    title: 'Got There',
    description: 'Have at least 5 courses with grades above 90%',
    icon: 'trophy',
    difficulty: AchievementDifficulty.HARD,
    points: 50,
    unlocked: false,
    progress: 0,
    requirements: {
      type: 'course_grade_above',
      threshold: 90,
      count: 5
    }
  },
  // "Day N Nite" Achievement (dark mode) - Ensuring it's properly defined
  {
    id: uuidv4(),
    title: 'Day N Nite',
    description: 'Enable dark mode in the application',
    icon: 'moon',
    difficulty: AchievementDifficulty.EASY,
    points: 10,
    unlocked: false,
    progress: 0,
    requirements: {
      type: 'dark_mode'
    }
  }
];
