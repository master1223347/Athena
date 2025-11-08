#!/usr/bin/env node

/**
 * Test runner for Weekly Achievements
 * Tests the four specific achievements mentioned:
 * 1. Gamble on a test score (Risk Taker)
 * 2. Advance at least 1 place in your ranking (Rank Climber)
 * 3. Get 100% on an AI quiz (AI Quiz Champion)
 * 4. Get 1st place in your leaderboard (Leaderboard Champion)
 */

// Mock data structures
const mockUserData = {
  userId: 'test-user-123',
  gamblingHistory: [],
  leaderboardHistory: [],
  quizResults: [],
  leaderboardPositions: []
};

// Test scenarios
const testScenarios = {
  // Scenario 1: User achieves all four achievements
  allAchievements: {
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
  },

  // Scenario 2: User achieves some but not all achievements
  partialAchievements: {
    gamblingHistory: [
      {
        assignmentId: 'test-1',
        assignmentName: 'Science Test',
        betAmount: 50,
        predictedScore: 85,
        date: new Date('2024-01-15')
      }
    ],
    leaderboardHistory: [
      {
        week: '2024-W02',
        position: 5,
        score: 800,
        date: new Date('2024-01-08')
      },
      {
        week: '2024-W03',
        position: 4,
        score: 850,
        date: new Date('2024-01-15')
      }
    ],
    quizResults: [
      {
        quizId: 'ai-quiz-1',
        quizType: 'AI',
        score: 95,
        maxScore: 100,
        date: new Date('2024-01-15')
      }
    ],
    leaderboardPositions: [
      {
        week: '2024-W03',
        position: 4,
        totalParticipants: 50,
        date: new Date('2024-01-15')
      }
    ]
  },

  // Scenario 3: User achieves no achievements
  noAchievements: {
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
  }
};

// Achievement checking functions
function checkRiskTaker(data) {
  return data.gamblingHistory.length > 0;
}

function checkRankClimber(data) {
  if (data.leaderboardHistory.length < 2) return false;
  const current = data.leaderboardHistory[data.leaderboardHistory.length - 1];
  const previous = data.leaderboardHistory[data.leaderboardHistory.length - 2];
  return current.position < previous.position;
}

function checkAIQuizChampion(data) {
  return data.quizResults.some(quiz => 
    quiz.quizType === 'AI' && quiz.score === quiz.maxScore
  );
}

function checkLeaderboardChampion(data) {
  return data.leaderboardPositions.some(position => position.position === 1);
}

// Test execution
function runTests() {
  console.log('🧪 Running Weekly Achievement Tests...\n');

  Object.entries(testScenarios).forEach(([scenarioName, data]) => {
    console.log(`📋 Testing Scenario: ${scenarioName}`);
    console.log('=' .repeat(50));

    const results = {
      riskTaker: checkRiskTaker(data),
      rankClimber: checkRankClimber(data),
      aiQuizChampion: checkAIQuizChampion(data),
      leaderboardChampion: checkLeaderboardChampion(data)
    };

    console.log(`🎲 Risk Taker (Gamble): ${results.riskTaker ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📈 Rank Climber (Advance): ${results.rankClimber ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🤖 AI Quiz Champion (100%): ${results.aiQuizChampion ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🏆 Leaderboard Champion (1st): ${results.leaderboardChampion ? '✅ PASS' : '❌ FAIL'}`);

    const totalAchievements = Object.values(results).filter(Boolean).length;
    console.log(`\n📊 Total Achievements: ${totalAchievements}/4`);
    console.log('=' .repeat(50));
    console.log('');
  });

  // Edge case testing
  console.log('🔍 Testing Edge Cases...\n');

  // Test with empty data
  const emptyData = {
    gamblingHistory: [],
    leaderboardHistory: [],
    quizResults: [],
    leaderboardPositions: []
  };

  console.log('Empty Data Test:');
  console.log(`🎲 Risk Taker: ${checkRiskTaker(emptyData) ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📈 Rank Climber: ${checkRankClimber(emptyData) ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🤖 AI Quiz Champion: ${checkAIQuizChampion(emptyData) ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🏆 Leaderboard Champion: ${checkLeaderboardChampion(emptyData) ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n✅ All tests completed!');
}

// Run the tests
runTests();
