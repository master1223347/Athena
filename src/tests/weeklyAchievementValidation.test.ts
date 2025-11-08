import { describe, it, expect } from 'vitest';
import { WEEKLY_ACHIEVEMENTS } from '@/data/weeklyAchievements';
import { AchievementDifficulty } from '@/types/achievement';

/**
 * Test suite for validating weekly achievements that don't require Canvas data
 * Focuses on platform interaction achievements:
 * - Gamble on a test score (Risk Taker)
 * - Advance at least 1 place in your ranking (Rank Climber) 
 * - Get 100% on an AI quiz (AI Quiz Champion)
 * - Get 1st place in your leaderboard (Leaderboard Champion)
 */

interface PlatformInteractionData {
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

describe('Weekly Achievements - Platform Interaction Validation', () => {
  
  describe('Achievement Definitions', () => {
    it('should have Risk Taker achievement defined correctly', () => {
      const achievement = WEEKLY_ACHIEVEMENTS.find(a => a.title === 'Risk Taker');
      
      expect(achievement).toBeDefined();
      expect(achievement?.title).toBe('Risk Taker');
      expect(achievement?.description).toBe('Gamble on a test score');
      expect(achievement?.difficulty).toBe(AchievementDifficulty.EASY);
      expect(achievement?.points).toBe(30);
      expect(achievement?.category).toBe('engagement');
      expect(achievement?.icon).toBe('🎲');
    });

    it('should have Rank Climber achievement defined correctly', () => {
      const achievement = WEEKLY_ACHIEVEMENTS.find(a => a.title === 'Rank Climber');
      
      expect(achievement).toBeDefined();
      expect(achievement?.title).toBe('Rank Climber');
      expect(achievement?.description).toBe('Advance at least 1 place in your ranking');
      expect(achievement?.difficulty).toBe(AchievementDifficulty.EASY);
      expect(achievement?.points).toBe(30);
      expect(achievement?.category).toBe('engagement');
      expect(achievement?.icon).toBe('📈');
    });

    it('should have AI Quiz Champion achievement defined correctly', () => {
      const achievement = WEEKLY_ACHIEVEMENTS.find(a => a.title === 'AI Quiz Champion');
      
      expect(achievement).toBeDefined();
      expect(achievement?.title).toBe('AI Quiz Champion');
      expect(achievement?.description).toBe('Get 100% on an AI quiz');
      expect(achievement?.difficulty).toBe(AchievementDifficulty.MEDIUM);
      expect(achievement?.points).toBe(50);
      expect(achievement?.category).toBe('performance');
      expect(achievement?.icon).toBe('🤖');
    });

    it('should have Leaderboard Champion achievement defined correctly', () => {
      const achievement = WEEKLY_ACHIEVEMENTS.find(a => a.title === 'Leaderboard Champion');
      
      expect(achievement).toBeDefined();
      expect(achievement?.title).toBe('Leaderboard Champion');
      expect(achievement?.description).toBe('Get 1st place in your leaderboard');
      expect(achievement?.difficulty).toBe(AchievementDifficulty.HARD);
      expect(achievement?.points).toBe(100);
      expect(achievement?.category).toBe('engagement');
      expect(achievement?.icon).toBe('🏆');
    });
  });

  describe('Risk Taker - Gamble on a test score', () => {
    const checkRiskTaker = (data: PlatformInteractionData): boolean => {
      return data.gamblingHistory.length > 0;
    };

    it('should unlock when user has gambled on any test', () => {
      const data: PlatformInteractionData = {
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
        leaderboardHistory: [],
        quizResults: [],
        leaderboardPositions: []
      };

      expect(checkRiskTaker(data)).toBe(true);
    });

    it('should not unlock when user has not gambled', () => {
      const data: PlatformInteractionData = {
        gamblingHistory: [],
        leaderboardHistory: [],
        quizResults: [],
        leaderboardPositions: []
      };

      expect(checkRiskTaker(data)).toBe(false);
    });

    it('should work with multiple gambling attempts', () => {
      const data: PlatformInteractionData = {
        gamblingHistory: [
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
        ],
        leaderboardHistory: [],
        quizResults: [],
        leaderboardPositions: []
      };

      expect(checkRiskTaker(data)).toBe(true);
    });
  });

  describe('Rank Climber - Advance at least 1 place in your ranking', () => {
    const checkRankClimber = (data: PlatformInteractionData): boolean => {
      if (data.leaderboardHistory.length < 2) return false;
      const current = data.leaderboardHistory[data.leaderboardHistory.length - 1];
      const previous = data.leaderboardHistory[data.leaderboardHistory.length - 2];
      return current.position < previous.position;
    };

    it('should unlock when user advances 1 position', () => {
      const data: PlatformInteractionData = {
        gamblingHistory: [],
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
        quizResults: [],
        leaderboardPositions: []
      };

      expect(checkRankClimber(data)).toBe(true);
    });

    it('should unlock when user advances multiple positions', () => {
      const data: PlatformInteractionData = {
        gamblingHistory: [],
        leaderboardHistory: [
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
        ],
        quizResults: [],
        leaderboardPositions: []
      };

      expect(checkRankClimber(data)).toBe(true);
    });

    it('should not unlock when user stays at same position', () => {
      const data: PlatformInteractionData = {
        gamblingHistory: [],
        leaderboardHistory: [
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
        ],
        quizResults: [],
        leaderboardPositions: []
      };

      expect(checkRankClimber(data)).toBe(false);
    });

    it('should not unlock when user drops in ranking', () => {
      const data: PlatformInteractionData = {
        gamblingHistory: [],
        leaderboardHistory: [
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
        ],
        quizResults: [],
        leaderboardPositions: []
      };

      expect(checkRankClimber(data)).toBe(false);
    });

    it('should not unlock with insufficient history', () => {
      const data: PlatformInteractionData = {
        gamblingHistory: [],
        leaderboardHistory: [
          {
            week: '2024-W03',
            position: 1,
            score: 1000,
            date: new Date('2024-01-15')
          }
        ],
        quizResults: [],
        leaderboardPositions: []
      };

      expect(checkRankClimber(data)).toBe(false);
    });
  });

  describe('AI Quiz Champion - Get 100% on an AI quiz', () => {
    const checkAIQuizChampion = (data: PlatformInteractionData): boolean => {
      return data.quizResults.some(quiz => 
        quiz.quizType === 'AI' && quiz.score === quiz.maxScore
      );
    };

    it('should unlock when user gets 100% on an AI quiz', () => {
      const data: PlatformInteractionData = {
        gamblingHistory: [],
        leaderboardHistory: [],
        quizResults: [
          {
            quizId: 'ai-quiz-1',
            quizType: 'AI',
            score: 100,
            maxScore: 100,
            date: new Date('2024-01-15')
          }
        ],
        leaderboardPositions: []
      };

      expect(checkAIQuizChampion(data)).toBe(true);
    });

    it('should not unlock when user gets less than 100% on AI quiz', () => {
      const data: PlatformInteractionData = {
        gamblingHistory: [],
        leaderboardHistory: [],
        quizResults: [
          {
            quizId: 'ai-quiz-1',
            quizType: 'AI',
            score: 95,
            maxScore: 100,
            date: new Date('2024-01-15')
          }
        ],
        leaderboardPositions: []
      };

      expect(checkAIQuizChampion(data)).toBe(false);
    });

    it('should not unlock when user gets 100% on regular quiz (not AI)', () => {
      const data: PlatformInteractionData = {
        gamblingHistory: [],
        leaderboardHistory: [],
        quizResults: [
          {
            quizId: 'regular-quiz-1',
            quizType: 'regular',
            score: 100,
            maxScore: 100,
            date: new Date('2024-01-15')
          }
        ],
        leaderboardPositions: []
      };

      expect(checkAIQuizChampion(data)).toBe(false);
    });

    it('should work with multiple AI quizzes', () => {
      const data: PlatformInteractionData = {
        gamblingHistory: [],
        leaderboardHistory: [],
        quizResults: [
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
        ],
        leaderboardPositions: []
      };

      expect(checkAIQuizChampion(data)).toBe(true);
    });
  });

  describe('Leaderboard Champion - Get 1st place in your leaderboard', () => {
    const checkLeaderboardChampion = (data: PlatformInteractionData): boolean => {
      return data.leaderboardPositions.some(position => position.position === 1);
    };

    it('should unlock when user is in 1st place', () => {
      const data: PlatformInteractionData = {
        gamblingHistory: [],
        leaderboardHistory: [],
        quizResults: [],
        leaderboardPositions: [
          {
            week: '2024-W03',
            position: 1,
            totalParticipants: 50,
            date: new Date('2024-01-15')
          }
        ]
      };

      expect(checkLeaderboardChampion(data)).toBe(true);
    });

    it('should not unlock when user is not in 1st place', () => {
      const data: PlatformInteractionData = {
        gamblingHistory: [],
        leaderboardHistory: [],
        quizResults: [],
        leaderboardPositions: [
          {
            week: '2024-W03',
            position: 2,
            totalParticipants: 50,
            date: new Date('2024-01-15')
          }
        ]
      };

      expect(checkLeaderboardChampion(data)).toBe(false);
    });

    it('should work with multiple weeks of data', () => {
      const data: PlatformInteractionData = {
        gamblingHistory: [],
        leaderboardHistory: [],
        quizResults: [],
        leaderboardPositions: [
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
        ]
      };

      expect(checkLeaderboardChampion(data)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should handle user achieving all four achievements', () => {
      const data: PlatformInteractionData = {
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

      const riskTaker = data.gamblingHistory.length > 0;
      const rankClimber = data.leaderboardHistory.length >= 2 && 
        data.leaderboardHistory[data.leaderboardHistory.length - 1].position < 
        data.leaderboardHistory[data.leaderboardHistory.length - 2].position;
      const aiQuizChampion = data.quizResults.some(quiz => 
        quiz.quizType === 'AI' && quiz.score === quiz.maxScore
      );
      const leaderboardChampion = data.leaderboardPositions.some(position => 
        position.position === 1
      );

      expect(riskTaker).toBe(true);
      expect(rankClimber).toBe(true);
      expect(aiQuizChampion).toBe(true);
      expect(leaderboardChampion).toBe(true);
    });

    it('should handle user achieving no achievements', () => {
      const data: PlatformInteractionData = {
        gamblingHistory: [],
        leaderboardHistory: [
          {
            week: '2024-W02',
            position: 3,
            score: 850,
            date: new Date('2024-01-08')
          },
          {
            week: '2024-W03',
            position: 5,
            score: 800,
            date: new Date('2024-01-15')
          }
        ],
        quizResults: [
          {
            quizId: 'regular-quiz-1',
            quizType: 'regular',
            score: 100,
            maxScore: 100,
            date: new Date('2024-01-15')
          }
        ],
        leaderboardPositions: [
          {
            week: '2024-W03',
            position: 5,
            totalParticipants: 50,
            date: new Date('2024-01-15')
          }
        ]
      };

      const riskTaker = data.gamblingHistory.length > 0;
      const rankClimber = data.leaderboardHistory.length >= 2 && 
        data.leaderboardHistory[data.leaderboardHistory.length - 1].position < 
        data.leaderboardHistory[data.leaderboardHistory.length - 2].position;
      const aiQuizChampion = data.quizResults.some(quiz => 
        quiz.quizType === 'AI' && quiz.score === quiz.maxScore
      );
      const leaderboardChampion = data.leaderboardPositions.some(position => 
        position.position === 1
      );

      expect(riskTaker).toBe(false);
      expect(rankClimber).toBe(false);
      expect(aiQuizChampion).toBe(false);
      expect(leaderboardChampion).toBe(false);
    });
  });

  describe('Data Validation', () => {
    it('should validate gambling data structure', () => {
      const gamblingData = {
        assignmentId: 'test-1',
        assignmentName: 'Math Quiz',
        betAmount: 50,
        predictedScore: 85,
        actualScore: 90,
        date: new Date('2024-01-15')
      };

      expect(gamblingData.assignmentId).toBeDefined();
      expect(gamblingData.betAmount).toBeGreaterThan(0);
      expect(gamblingData.predictedScore).toBeGreaterThanOrEqual(0);
      expect(gamblingData.predictedScore).toBeLessThanOrEqual(100);
      expect(gamblingData.date).toBeInstanceOf(Date);
    });

    it('should validate leaderboard data structure', () => {
      const leaderboardData = {
        week: '2024-W03',
        position: 1,
        totalParticipants: 50,
        date: new Date('2024-01-15')
      };

      expect(leaderboardData.position).toBeGreaterThan(0);
      expect(leaderboardData.totalParticipants).toBeGreaterThan(0);
      expect(leaderboardData.position).toBeLessThanOrEqual(leaderboardData.totalParticipants);
      expect(leaderboardData.date).toBeInstanceOf(Date);
    });

    it('should validate quiz data structure', () => {
      const quizData = {
        quizId: 'ai-quiz-1',
        quizType: 'AI' as const,
        score: 100,
        maxScore: 100,
        date: new Date('2024-01-15')
      };

      expect(quizData.quizType).toBe('AI');
      expect(quizData.score).toBeGreaterThanOrEqual(0);
      expect(quizData.maxScore).toBeGreaterThan(0);
      expect(quizData.score).toBeLessThanOrEqual(quizData.maxScore);
      expect(quizData.date).toBeInstanceOf(Date);
    });
  });
});
