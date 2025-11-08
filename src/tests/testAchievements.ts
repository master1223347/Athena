/**
 * Simple test script to validate weekly achievements
 * Run with: npx tsx src/tests/testAchievements.ts
 */

import { 
  createSampleData, 
  runAchievementTests, 
  getAllAchievementStatuses,
  getAchievementCount,
  validatePlatformData 
} from '../utils/achievementTestUtils';

// Test scenarios
const testScenarios = [
  {
    name: 'All Achievements',
    data: createSampleData()
  },
  {
    name: 'No Achievements',
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
  },
  {
    name: 'Partial Achievements',
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
  }
];

function runAllTests() {
  console.log('🧪 Weekly Achievement Test Suite\n');
  console.log('=' .repeat(60));

  testScenarios.forEach((scenario, index) => {
    console.log(`\n📋 Test Scenario ${index + 1}: ${scenario.name}`);
    console.log('-'.repeat(40));

    const statuses = getAllAchievementStatuses(scenario.data);
    const count = getAchievementCount(scenario.data);
    const validation = validatePlatformData(scenario.data);

    console.log(`🎲 Risk Taker (Gamble): ${statuses.riskTaker ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);
    console.log(`📈 Rank Climber (Advance): ${statuses.rankClimber ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);
    console.log(`🤖 AI Quiz Champion (100%): ${statuses.aiQuizChampion ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);
    console.log(`🏆 Leaderboard Champion (1st): ${statuses.leaderboardChampion ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);
    
    console.log(`\n📊 Total Achievements: ${count}/4`);
    console.log(`✅ Data Validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
    
    if (!validation.isValid) {
      console.log('❌ Validation Errors:');
      validation.errors.forEach(error => console.log(`   - ${error}`));
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!');
}

// Run the tests
runAllTests();
