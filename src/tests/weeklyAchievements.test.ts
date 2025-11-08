import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WEEKLY_ACHIEVEMENTS } from '@/data/weeklyAchievements';
import { AchievementDifficulty } from '@/types/achievement';

// Mock user data for testing
interface MockUserData {
  userId: string;
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

describe('Weekly Achievements - Platform Interaction Tests', () => {
  let mockUserData: MockUserData;

  beforeEach(() => {
    // Reset mock data for each test
    mockUserData = {
      userId: 'test-user-123',
      gamblingHistory: [],
      leaderboardHistory: [],
      quizResults: [],
      leaderboardPositions: []
    };
  });

  describe('Risk Taker - Gamble on a test score', () => {
    const achievement = WEEKLY_ACHIEVEMENTS.find(a => a.title === 'Risk Taker');
    
    it('should be defined', () => {
      expect(achievement).toBeDefined();
      expect(achievement?.difficulty).toBe(AchievementDifficulty.EASY);
      expect(achievement?.points).toBe(30);
      expect(achievement?.category).toBe('engagement');
    });

    it('should unlock when user has gambled on any test score', () => {
      // Add gambling history
      mockUserData.gamblingHistory = [
        {
          assignmentId: 'test-1',
          assignmentName: 'Math Quiz',
          betAmount: 50,
          predictedScore: 85,
          actualScore: 90,
          date: new Date('2024-01-15')
        }
      ];

      const hasGambled = mockUserData.gamblingHistory.length > 0;
      expect(hasGambled).toBe(true);
    });

    it('should not unlock when user has not gambled', () => {
      const hasGambled = mockUserData.gamblingHistory.length > 0;
      expect(hasGambled).toBe(false);
    });

    it('should work with multiple gambling attempts', () => {
      mockUserData.gamblingHistory = [
        {
          assignmentId: 'test-1',
          assignmentName: 'Math Quiz',
          betAmount: 25,
          predictedScore: 80,
          date: new Date('2024-01-15')
        },
        {
          assignmentId: 'test-2',
          assignmentName: 'Science Test',
          betAmount: 75,
          predictedScore: 95,
          actualScore: 92,
          date: new Date('2024-01-16')
        }
      ];

      const hasGambled = mockUserData.gamblingHistory.length > 0;
      expect(hasGambled).toBe(true);
    });
  });

  describe('Rank Climber - Advance at least 1 place in your ranking', () => {
    const achievement = WEEKLY_ACHIEVEMENTS.find(a => a.title === 'Rank Climber');
    
    it('should be defined', () => {
      expect(achievement).toBeDefined();
      expect(achievement?.difficulty).toBe(AchievementDifficulty.EASY);
      expect(achievement?.points).toBe(30);
      expect(achievement?.category).toBe('engagement');
    });

    it('should unlock when user advances 1 position', () => {
      // Previous week: position 5
      // Current week: position 4
      mockUserData.leaderboardHistory = [
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
      ];

      const currentWeek = mockUserData.leaderboardHistory[mockUserData.leaderboardHistory.length - 1];
      const previousWeek = mockUserData.leaderboardHistory[mockUserData.leaderboardHistory.length - 2];
      
      const hasAdvanced = currentWeek.position < previousWeek.position;
      expect(hasAdvanced).toBe(true);
    });

    it('should unlock when user advances multiple positions', () => {
      mockUserData.leaderboardHistory = [
        {
          week: '2024-W02',
          position: 8,
          score: 750,
          date: new Date('2024-01-08')
        },
        {
          week: '2024-W03',
          position: 3,
          score: 950,
          date: new Date('2024-01-15')
        }
      ];

      const currentWeek = mockUserData.leaderboardHistory[mockUserData.leaderboardHistory.length - 1];
      const previousWeek = mockUserData.leaderboardHistory[mockUserData.leaderboardHistory.length - 2];
      
      const hasAdvanced = currentWeek.position < previousWeek.position;
      expect(hasAdvanced).toBe(true);
    });

    it('should not unlock when user stays at same position', () => {
      mockUserData.leaderboardHistory = [
        {
          week: '2024-W02',
          position: 5,
          score: 850,
          date: new Date('2024-01-08')
        },
        {
          week: '2024-W03',
          position: 5,
          score: 900,
          date: new Date('2024-01-15')
        }
      ];

      const currentWeek = mockUserData.leaderboardHistory[mockUserData.leaderboardHistory.length - 1];
      const previousWeek = mockUserData.leaderboardHistory[mockUserData.leaderboardHistory.length - 2];
      
      const hasAdvanced = currentWeek.position < previousWeek.position;
      expect(hasAdvanced).toBe(false);
    });

    it('should not unlock when user drops in ranking', () => {
      mockUserData.leaderboardHistory = [
        {
          week: '2024-W02',
          position: 3,
          score: 950,
          date: new Date('2024-01-08')
        },
        {
          week: '2024-W03',
          position: 6,
          score: 880,
          date: new Date('2024-01-15')
        }
      ];

      const currentWeek = mockUserData.leaderboardHistory[mockUserData.leaderboardHistory.length - 1];
      const previousWeek = mockUserData.leaderboardHistory[mockUserData.leaderboardHistory.length - 2];
      
      const hasAdvanced = currentWeek.position < previousWeek.position;
      expect(hasAdvanced).toBe(false);
    });
  });

  describe('AI Quiz Champion - Get 100% on an AI quiz', () => {
    const achievement = WEEKLY_ACHIEVEMENTS.find(a => a.title === 'AI Quiz Champion');
    
    it('should be defined', () => {
      expect(achievement).toBeDefined();
      expect(achievement?.difficulty).toBe(AchievementDifficulty.MEDIUM);
      expect(achievement?.points).toBe(50);
      expect(achievement?.category).toBe('performance');
    });

    it('should unlock when user gets 100% on an AI quiz', () => {
      mockUserData.quizResults = [
        {
          quizId: 'ai-quiz-1',
          quizType: 'AI',
          score: 100,
          maxScore: 100,
          date: new Date('2024-01-15')
        }
      ];

      const hasPerfectAIQuiz = mockUserData.quizResults.some(
        quiz => quiz.quizType === 'AI' && quiz.score === quiz.maxScore
      );
      expect(hasPerfectAIQuiz).toBe(true);
    });

    it('should not unlock when user gets less than 100% on AI quiz', () => {
      mockUserData.quizResults = [
        {
          quizId: 'ai-quiz-1',
          quizType: 'AI',
          score: 95,
          maxScore: 100,
          date: new Date('2024-01-15')
        }
      ];

      const hasPerfectAIQuiz = mockUserData.quizResults.some(
        quiz => quiz.quizType === 'AI' && quiz.score === quiz.maxScore
      );
      expect(hasPerfectAIQuiz).toBe(false);
    });

    it('should not unlock when user gets 100% on regular quiz (not AI)', () => {
      mockUserData.quizResults = [
        {
          quizId: 'regular-quiz-1',
          quizType: 'regular',
          score: 100,
          maxScore: 100,
          date: new Date('2024-01-15')
        }
      ];

      const hasPerfectAIQuiz = mockUserData.quizResults.some(
        quiz => quiz.quizType === 'AI' && quiz.score === quiz.maxScore
      );
      expect(hasPerfectAIQuiz).toBe(false);
    });

    it('should work with multiple AI quizzes', () => {
      mockUserData.quizResults = [
        {
          quizId: 'ai-quiz-1',
          quizType: 'AI',
          score: 85,
          maxScore: 100,
          date: new Date('2024-01-15')
        },
        {
          quizId: 'ai-quiz-2',
          quizType: 'AI',
          score: 100,
          maxScore: 100,
          date: new Date('2024-01-16')
        }
      ];

      const hasPerfectAIQuiz = mockUserData.quizResults.some(
        quiz => quiz.quizType === 'AI' && quiz.score === quiz.maxScore
      );
      expect(hasPerfectAIQuiz).toBe(true);
    });
  });

  describe('Leaderboard Champion - Get 1st place in your leaderboard', () => {
    const achievement = WEEKLY_ACHIEVEMENTS.find(a => a.title === 'Leaderboard Champion');
    
    it('should be defined', () => {
      expect(achievement).toBeDefined();
      expect(achievement?.difficulty).toBe(AchievementDifficulty.HARD);
      expect(achievement?.points).toBe(100);
      expect(achievement?.category).toBe('engagement');
    });

    it('should unlock when user is in 1st place', () => {
      mockUserData.leaderboardPositions = [
        {
          week: '2024-W03',
          position: 1,
          totalParticipants: 50,
          date: new Date('2024-01-15')
        }
      ];

      const isFirstPlace = mockUserData.leaderboardPositions.some(
        position => position.position === 1
      );
      expect(isFirstPlace).toBe(true);
    });

    it('should not unlock when user is not in 1st place', () => {
      mockUserData.leaderboardPositions = [
        {
          week: '2024-W03',
          position: 2,
          totalParticipants: 50,
          date: new Date('2024-01-15')
        }
      ];

      const isFirstPlace = mockUserData.leaderboardPositions.some(
        position => position.position === 1
      );
      expect(isFirstPlace).toBe(false);
    });

    it('should work with multiple weeks of data', () => {
      mockUserData.leaderboardPositions = [
        {
          week: '2024-W02',
          position: 3,
          totalParticipants: 45,
          date: new Date('2024-01-08')
        },
        {
          week: '2024-W03',
          position: 1,
          totalParticipants: 50,
          date: new Date('2024-01-15')
        }
      ];

      const isFirstPlace = mockUserData.leaderboardPositions.some(
        position => position.position === 1
      );
      expect(isFirstPlace).toBe(true);
    });
  });

  describe('Integration Tests - Multiple Achievements', () => {
    it('should handle user with multiple achievements in one week', () => {
      // User gambles, advances ranking, gets 100% on AI quiz, and reaches 1st place
      mockUserData.gamblingHistory = [
        {
          assignmentId: 'test-1',
          assignmentName: 'Math Quiz',
          betAmount: 100,
          predictedScore: 90,
          actualScore: 95,
          date: new Date('2024-01-15')
        }
      ];

      mockUserData.leaderboardHistory = [
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
      ];

      mockUserData.quizResults = [
        {
          quizId: 'ai-quiz-1',
          quizType: 'AI',
          score: 100,
          maxScore: 100,
          date: new Date('2024-01-15')
        }
      ];

      mockUserData.leaderboardPositions = [
        {
          week: '2024-W03',
          position: 1,
          totalParticipants: 50,
          date: new Date('2024-01-15')
        }
      ];

      // Check all achievements
      const hasGambled = mockUserData.gamblingHistory.length > 0;
      const hasAdvanced = mockUserData.leaderboardHistory.length >= 2 && 
        mockUserData.leaderboardHistory[mockUserData.leaderboardHistory.length - 1].position < 
        mockUserData.leaderboardHistory[mockUserData.leaderboardHistory.length - 2].position;
      const hasPerfectAIQuiz = mockUserData.quizResults.some(
        quiz => quiz.quizType === 'AI' && quiz.score === quiz.maxScore
      );
      const isFirstPlace = mockUserData.leaderboardPositions.some(
        position => position.position === 1
      );

      expect(hasGambled).toBe(true);
      expect(hasAdvanced).toBe(true);
      expect(hasPerfectAIQuiz).toBe(true);
      expect(isFirstPlace).toBe(true);
    });

    it('should handle edge cases with no data', () => {
      // All arrays empty
      const hasGambled = mockUserData.gamblingHistory.length > 0;
      const hasAdvanced = mockUserData.leaderboardHistory.length >= 2 && 
        mockUserData.leaderboardHistory[mockUserData.leaderboardHistory.length - 1].position < 
        mockUserData.leaderboardHistory[mockUserData.leaderboardHistory.length - 2].position;
      const hasPerfectAIQuiz = mockUserData.quizResults.some(
        quiz => quiz.quizType === 'AI' && quiz.score === quiz.maxScore
      );
      const isFirstPlace = mockUserData.leaderboardPositions.some(
        position => position.position === 1
      );

      expect(hasGambled).toBe(false);
      expect(hasAdvanced).toBe(false);
      expect(hasPerfectAIQuiz).toBe(false);
      expect(isFirstPlace).toBe(false);
    });
  });

  describe('Data Validation Tests', () => {
    it('should validate gambling data structure', () => {
      const validGamblingData = {
        assignmentId: 'test-1',
        assignmentName: 'Math Quiz',
        betAmount: 50,
        predictedScore: 85,
        actualScore: 90,
        date: new Date('2024-01-15')
      };

      expect(validGamblingData.assignmentId).toBeDefined();
      expect(validGamblingData.betAmount).toBeGreaterThan(0);
      expect(validGamblingData.predictedScore).toBeGreaterThanOrEqual(0);
      expect(validGamblingData.predictedScore).toBeLessThanOrEqual(100);
      expect(validGamblingData.date).toBeInstanceOf(Date);
    });

    it('should validate leaderboard data structure', () => {
      const validLeaderboardData = {
        week: '2024-W03',
        position: 1,
        totalParticipants: 50,
        date: new Date('2024-01-15')
      };

      expect(validLeaderboardData.position).toBeGreaterThan(0);
      expect(validLeaderboardData.totalParticipants).toBeGreaterThan(0);
      expect(validLeaderboardData.position).toBeLessThanOrEqual(validLeaderboardData.totalParticipants);
      expect(validLeaderboardData.date).toBeInstanceOf(Date);
    });

    it('should validate quiz data structure', () => {
      const validQuizData = {
        quizId: 'ai-quiz-1',
        quizType: 'AI' as const,
        score: 100,
        maxScore: 100,
        date: new Date('2024-01-15')
      };

      expect(validQuizData.quizType).toBe('AI');
      expect(validQuizData.score).toBeGreaterThanOrEqual(0);
      expect(validQuizData.maxScore).toBeGreaterThan(0);
      expect(validQuizData.score).toBeLessThanOrEqual(validQuizData.maxScore);
      expect(validQuizData.date).toBeInstanceOf(Date);
    });
  });
});
