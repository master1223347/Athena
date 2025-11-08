/**
 * Utility functions for testing weekly achievements
 * These functions can be used to validate achievement logic in the application
 */

export interface PlatformInteractionData {
  gamblingHistory: Array<{
    assignmentId: string;
    assignmentName: string;
    betAmount: number;
    predictedScore: number;
    actualScore?: number;
    date: Date;
  }>;
  leaderboardHistory: Array<{
    week: string;
    position: number;
    score: number;
    date: Date;
  }>;
  quizResults: Array<{
    quizId: string;
    quizType: 'AI' | 'regular';
    score: number;
    maxScore: number;
    date: Date;
  }>;
  leaderboardPositions: Array<{
    week: string;
    position: number;
    totalParticipants: number;
    date: Date;
  }>;
}

/**
 * Check if user has achieved the "Risk Taker" achievement
 * Achievement: Gamble on a test score
 */
export function checkRiskTaker(data: PlatformInteractionData): boolean {
  return data.gamblingHistory.length > 0;
}

/**
 * Check if user has achieved the "Rank Climber" achievement
 * Achievement: Advance at least 1 place in your ranking
 */
export function checkRankClimber(data: PlatformInteractionData): boolean {
  if (data.leaderboardHistory.length < 2) return false;
  
  const current = data.leaderboardHistory[data.leaderboardHistory.length - 1];
  const previous = data.leaderboardHistory[data.leaderboardHistory.length - 2];
  
  return current.position < previous.position;
}

/**
 * Check if user has achieved the "AI Quiz Champion" achievement
 * Achievement: Get 100% on an AI quiz
 */
export function checkAIQuizChampion(data: PlatformInteractionData): boolean {
  return data.quizResults.some(quiz => 
    quiz.quizType === 'AI' && quiz.score === quiz.maxScore
  );
}

/**
 * Check if user has achieved the "Leaderboard Champion" achievement
 * Achievement: Get 1st place in your leaderboard
 */
export function checkLeaderboardChampion(data: PlatformInteractionData): boolean {
  return data.leaderboardPositions.some(position => position.position === 1);
}

/**
 * Get all achievement statuses for a user
 */
export function getAllAchievementStatuses(data: PlatformInteractionData) {
  return {
    riskTaker: checkRiskTaker(data),
    rankClimber: checkRankClimber(data),
    aiQuizChampion: checkAIQuizChampion(data),
    leaderboardChampion: checkLeaderboardChampion(data)
  };
}

/**
 * Get the count of achieved achievements
 */
export function getAchievementCount(data: PlatformInteractionData): number {
  const statuses = getAllAchievementStatuses(data);
  return Object.values(statuses).filter(Boolean).length;
}

/**
 * Validate data structure for platform interactions
 */
export function validatePlatformData(data: PlatformInteractionData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate gambling history
  data.gamblingHistory.forEach((gamble, index) => {
    if (!gamble.assignmentId) errors.push(`Gambling entry ${index}: missing assignmentId`);
    if (gamble.betAmount <= 0) errors.push(`Gambling entry ${index}: betAmount must be positive`);
    if (gamble.predictedScore < 0 || gamble.predictedScore > 100) {
      errors.push(`Gambling entry ${index}: predictedScore must be between 0-100`);
    }
    if (!(gamble.date instanceof Date)) errors.push(`Gambling entry ${index}: date must be a Date object`);
  });

  // Validate leaderboard history
  data.leaderboardHistory.forEach((entry, index) => {
    if (entry.position <= 0) errors.push(`Leaderboard entry ${index}: position must be positive`);
    if (entry.score < 0) errors.push(`Leaderboard entry ${index}: score must be non-negative`);
    if (!(entry.date instanceof Date)) errors.push(`Leaderboard entry ${index}: date must be a Date object`);
  });

  // Validate quiz results
  data.quizResults.forEach((quiz, index) => {
    if (!['AI', 'regular'].includes(quiz.quizType)) {
      errors.push(`Quiz entry ${index}: quizType must be 'AI' or 'regular'`);
    }
    if (quiz.score < 0) errors.push(`Quiz entry ${index}: score must be non-negative`);
    if (quiz.maxScore <= 0) errors.push(`Quiz entry ${index}: maxScore must be positive`);
    if (quiz.score > quiz.maxScore) {
      errors.push(`Quiz entry ${index}: score cannot exceed maxScore`);
    }
    if (!(quiz.date instanceof Date)) errors.push(`Quiz entry ${index}: date must be a Date object`);
  });

  // Validate leaderboard positions
  data.leaderboardPositions.forEach((position, index) => {
    if (position.position <= 0) errors.push(`Position entry ${index}: position must be positive`);
    if (position.totalParticipants <= 0) errors.push(`Position entry ${index}: totalParticipants must be positive`);
    if (position.position > position.totalParticipants) {
      errors.push(`Position entry ${index}: position cannot exceed totalParticipants`);
    }
    if (!(position.date instanceof Date)) errors.push(`Position entry ${index}: date must be a Date object`);
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create sample data for testing
 */
export function createSampleData(): PlatformInteractionData {
  return {
    gamblingHistory: [
      {
        assignmentId: 'test-1',
        assignmentName: 'Math Quiz',
        betAmount: 50,
        predictedScore: 85,
        actualScore: 90,
        date: new Date('2024-01-15')
      }
    ],
    leaderboardHistory: [
      {
        week: '2024-W02',
        position: 5,
        score: 850,
        date: new Date('2024-01-08')
      },
      {
        week: '2024-W03',
        position: 4,
        score: 920,
        date: new Date('2024-01-15')
      }
    ],
    quizResults: [
      {
        quizId: 'ai-quiz-1',
        quizType: 'AI',
        score: 100,
        maxScore: 100,
        date: new Date('2024-01-15')
      }
    ],
    leaderboardPositions: [
      {
        week: '2024-W03',
        position: 1,
        totalParticipants: 50,
        date: new Date('2024-01-15')
      }
    ]
  };
}

/**
 * Test all achievements with sample data
 */
export function runAchievementTests(): void {
  console.log('🧪 Testing Weekly Achievements...\n');
  
  const sampleData = createSampleData();
  const statuses = getAllAchievementStatuses(sampleData);
  const count = getAchievementCount(sampleData);
  
  console.log('📊 Achievement Status:');
  console.log(`🎲 Risk Taker (Gamble): ${statuses.riskTaker ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);
  console.log(`📈 Rank Climber (Advance): ${statuses.rankClimber ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);
  console.log(`🤖 AI Quiz Champion (100%): ${statuses.aiQuizChampion ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);
  console.log(`🏆 Leaderboard Champion (1st): ${statuses.leaderboardChampion ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);
  
  console.log(`\n📈 Total Achievements: ${count}/4`);
  
  // Validate data
  const validation = validatePlatformData(sampleData);
  if (validation.isValid) {
    console.log('\n✅ Data validation: PASSED');
  } else {
    console.log('\n❌ Data validation: FAILED');
    console.log('Errors:', validation.errors);
  }
}
