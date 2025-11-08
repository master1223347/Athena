/**
 * Proper achievement evaluation system
 * Handles both Canvas-based and Platform Interaction achievements correctly
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

export interface CanvasData {
  assignments: Array<{
    id: string;
    name: string;
    type: string;
    score: number;
    possible: number;
    dueDate: Date;
    submittedAt: Date;
  }>;
}

/**
 * PLATFORM INTERACTION ACHIEVEMENTS (No Canvas data needed)
 */

export function evaluateRankClimber(data: PlatformInteractionData): boolean {
  if (data.leaderboardHistory.length < 2) return false;
  
  const current = data.leaderboardHistory[data.leaderboardHistory.length - 1];
  const previous = data.leaderboardHistory[data.leaderboardHistory.length - 2];
  
  return current.position < previous.position;
}

export function evaluateAIQuizChampion(data: PlatformInteractionData): boolean {
  return data.quizResults.some(quiz => 
    quiz.quizType === 'AI' && quiz.score === quiz.maxScore
  );
}

export function evaluateLeaderboardChampion(data: PlatformInteractionData): boolean {
  return data.leaderboardPositions.some(position => position.position === 1);
}

export function evaluateRiskTaker(data: PlatformInteractionData): boolean {
  return data.gamblingHistory.length > 0;
}

/**
 * CANVAS DATA ACHIEVEMENTS (Canvas data required)
 */

export function evaluateExcellenceWeek(canvasData: CanvasData): boolean {
  if (canvasData.assignments.length === 0) return false;
  
  // Calculate average grade for all assignments
  const totalScore = canvasData.assignments.reduce((sum, assignment) => sum + assignment.score, 0);
  const totalPossible = canvasData.assignments.reduce((sum, assignment) => sum + assignment.possible, 0);
  
  if (totalPossible === 0) return false;
  
  const averageGrade = (totalScore / totalPossible) * 100;
  return averageGrade >= 90;
}

/**
 * COMBINED EVALUATION SYSTEM
 */

export function evaluateAllAchievements(
  platformData: PlatformInteractionData,
  canvasData: CanvasData
): {
  rankClimber: boolean;
  aiQuizChampion: boolean;
  leaderboardChampion: boolean;
  riskTaker: boolean;
  excellenceWeek: boolean;
} {
  return {
    // Platform Interaction Achievements (no Canvas data needed)
    rankClimber: evaluateRankClimber(platformData),
    aiQuizChampion: evaluateAIQuizChampion(platformData),
    leaderboardChampion: evaluateLeaderboardChampion(platformData),
    riskTaker: evaluateRiskTaker(platformData),
    
    // Canvas Data Achievement
    excellenceWeek: evaluateExcellenceWeek(canvasData)
  };
}

/**
 * Test the evaluation system
 */
export function testAchievementEvaluation(): void {
  console.log('🧪 Testing Achievement Evaluation System\n');
  
  // Test Platform Interaction Data
  const platformData: PlatformInteractionData = {
    gamblingHistory: [
      {
        assignmentId: 'test-1',
        assignmentName: 'Math Quiz',
        betAmount: 100,
        predictedScore: 90,
        actualScore: 95,
        date: new Date('2024-01-15')
      }
    ],
    leaderboardHistory: [
      {
        week: '2024-W02',
        position: 3,
        score: 850,
        date: new Date('2024-01-08')
      },
      {
        week: '2024-W03',
        position: 1,
        score: 1000,
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
  
  // Test Canvas Data
  const canvasData: CanvasData = {
    assignments: [
      {
        id: 'assignment-1',
        name: 'Math Homework',
        type: 'homework',
        score: 95,
        possible: 100,
        dueDate: new Date('2024-01-15'),
        submittedAt: new Date('2024-01-14')
      },
      {
        id: 'assignment-2',
        name: 'Science Project',
        type: 'project',
        score: 90,
        possible: 100,
        dueDate: new Date('2024-01-16'),
        submittedAt: new Date('2024-01-15')
      }
    ]
  };
  
  const results = evaluateAllAchievements(platformData, canvasData);
  
  console.log('📊 Achievement Evaluation Results:');
  console.log(`🎲 Risk Taker (Platform): ${results.riskTaker ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);
  console.log(`📈 Rank Climber (Platform): ${results.rankClimber ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);
  console.log(`🤖 AI Quiz Champion (Platform): ${results.aiQuizChampion ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);
  console.log(`🏆 Leaderboard Champion (Platform): ${results.leaderboardChampion ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);
  console.log(`⭐ Excellence Week (Canvas): ${results.excellenceWeek ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);
  
  const platformAchievements = [results.riskTaker, results.rankClimber, results.aiQuizChampion, results.leaderboardChampion];
  const platformCount = platformAchievements.filter(Boolean).length;
  
  console.log(`\n📈 Platform Achievements: ${platformCount}/4`);
  console.log(`📊 Canvas Achievements: ${results.excellenceWeek ? '1/1' : '0/1'}`);
  console.log(`🎯 Total Achievements: ${platformCount + (results.excellenceWeek ? 1 : 0)}/5`);
}
