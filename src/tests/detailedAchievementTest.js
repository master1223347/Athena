#!/usr/bin/env node

/**
 * Detailed test to show exactly how achievements are evaluated
 * This demonstrates the actual logic being used to determine achievement status
 */

// Achievement evaluation functions
function checkRiskTaker(data) {
  const hasGambled = data.gamblingHistory.length > 0;
  console.log(`   📊 Gambling History: ${data.gamblingHistory.length} entries`);
  if (data.gamblingHistory.length > 0) {
    data.gamblingHistory.forEach((gamble, i) => {
      console.log(`      ${i + 1}. ${gamble.assignmentName}: Bet $${gamble.betAmount}, Predicted ${gamble.predictedScore}%`);
    });
  }
  return hasGambled;
}

function checkRankClimber(data) {
  if (data.leaderboardHistory.length < 2) {
    console.log(`   📊 Leaderboard History: ${data.leaderboardHistory.length} entries (need at least 2)`);
    return false;
  }
  
  const current = data.leaderboardHistory[data.leaderboardHistory.length - 1];
  const previous = data.leaderboardHistory[data.leaderboardHistory.length - 2];
  
  console.log(`   📊 Previous Week: Position ${previous.position}`);
  console.log(`   📊 Current Week: Position ${current.position}`);
  console.log(`   📊 Improvement: ${current.position < previous.position ? 'YES' : 'NO'}`);
  
  return current.position < previous.position;
}

function checkAIQuizChampion(data) {
  const aiQuizzes = data.quizResults.filter(quiz => quiz.quizType === 'AI');
  console.log(`   📊 AI Quizzes: ${aiQuizzes.length} total`);
  
  aiQuizzes.forEach((quiz, i) => {
    const percentage = (quiz.score / quiz.maxScore * 100).toFixed(1);
    console.log(`      ${i + 1}. ${quiz.quizId}: ${quiz.score}/${quiz.maxScore} (${percentage}%)`);
  });
  
  const hasPerfectAIQuiz = aiQuizzes.some(quiz => quiz.score === quiz.maxScore);
  console.log(`   📊 Perfect AI Quiz: ${hasPerfectAIQuiz ? 'YES' : 'NO'}`);
  
  return hasPerfectAIQuiz;
}

function checkLeaderboardChampion(data) {
  const firstPlacePositions = data.leaderboardPositions.filter(pos => pos.position === 1);
  console.log(`   📊 Leaderboard Positions: ${data.leaderboardPositions.length} total`);
  
  data.leaderboardPositions.forEach((pos, i) => {
    console.log(`      ${i + 1}. Week ${pos.week}: Position ${pos.position}/${pos.totalParticipants}`);
  });
  
  const isFirstPlace = firstPlacePositions.length > 0;
  console.log(`   📊 First Place Achieved: ${isFirstPlace ? 'YES' : 'NO'}`);
  
  return isFirstPlace;
}

// Test scenarios with detailed data
const testScenarios = {
  allAchievements: {
    name: "All Achievements",
    data: {
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
    }
  },
  
  partialAchievements: {
    name: "Partial Achievements",
    data: {
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
    }
  },
  
  noAchievements: {
    name: "No Achievements",
    data: {
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
  }
};

function runDetailedTests() {
  console.log('🔍 Detailed Achievement Evaluation Tests\n');
  console.log('=' .repeat(80));

  Object.entries(testScenarios).forEach(([key, scenario]) => {
    console.log(`\n📋 ${scenario.name}`);
    console.log('=' .repeat(50));
    
    const data = scenario.data;
    
    console.log('\n🎲 Risk Taker (Gamble on a test score):');
    const riskTaker = checkRiskTaker(data);
    console.log(`   ✅ Result: ${riskTaker ? 'ACHIEVED' : 'NOT ACHIEVED'}`);
    
    console.log('\n📈 Rank Climber (Advance at least 1 place):');
    const rankClimber = checkRankClimber(data);
    console.log(`   ✅ Result: ${rankClimber ? 'ACHIEVED' : 'NOT ACHIEVED'}`);
    
    console.log('\n🤖 AI Quiz Champion (Get 100% on AI quiz):');
    const aiQuizChampion = checkAIQuizChampion(data);
    console.log(`   ✅ Result: ${aiQuizChampion ? 'ACHIEVED' : 'NOT ACHIEVED'}`);
    
    console.log('\n🏆 Leaderboard Champion (Get 1st place):');
    const leaderboardChampion = checkLeaderboardChampion(data);
    console.log(`   ✅ Result: ${leaderboardChampion ? 'ACHIEVED' : 'NOT ACHIEVED'}`);
    
    const totalAchievements = [riskTaker, rankClimber, aiQuizChampion, leaderboardChampion].filter(Boolean).length;
    console.log(`\n📊 Total Achievements: ${totalAchievements}/4`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Detailed evaluation completed!');
}

// Run the detailed tests
runDetailedTests();
