# Weekly Achievement Test Suite

This directory contains comprehensive test cases for the weekly achievements system, specifically focusing on platform interaction achievements that don't require Canvas data.

## Test Coverage

The test suite covers the following four achievements:

1. **🎲 Risk Taker** - Gamble on a test score
2. **📈 Rank Climber** - Advance at least 1 place in your ranking  
3. **🤖 AI Quiz Champion** - Get 100% on an AI quiz
4. **🏆 Leaderboard Champion** - Get 1st place in your leaderboard

## Files

### Test Files
- `weeklyAchievements.test.ts` - Comprehensive Vitest test suite
- `weeklyAchievementValidation.test.ts` - Focused validation tests
- `testAchievements.ts` - Simple test runner script
- `runWeeklyAchievementTests.js` - JavaScript test runner

### Utility Files
- `../utils/achievementTestUtils.ts` - Utility functions for testing achievements

## Running Tests

### Option 1: JavaScript Test Runner
```bash
node src/tests/runWeeklyAchievementTests.js
```

### Option 2: TypeScript Test Runner (if tsx is available)
```bash
npx tsx src/tests/testAchievements.ts
```

### Option 3: Vitest (if configured)
```bash
npm test src/tests/weeklyAchievementValidation.test.ts
```

## Test Scenarios

### Scenario 1: All Achievements
- User gambles on a test score ✅
- User advances from 3rd to 1st place ✅
- User gets 100% on an AI quiz ✅
- User reaches 1st place in leaderboard ✅

### Scenario 2: Partial Achievements
- User gambles on a test score ✅
- User advances from 5th to 4th place ✅
- User gets 95% on AI quiz (not 100%) ❌
- User reaches 4th place (not 1st) ❌

### Scenario 3: No Achievements
- User doesn't gamble ❌
- User drops from 3rd to 5th place ❌
- User gets 100% on regular quiz (not AI) ❌
- User reaches 5th place (not 1st) ❌

## Data Structure

The tests use the following data structure:

```typescript
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
```

## Achievement Logic

### Risk Taker
- **Condition**: User has at least one gambling entry
- **Data Required**: `gamblingHistory.length > 0`

### Rank Climber  
- **Condition**: User's current position is better than previous position
- **Data Required**: At least 2 leaderboard entries, current position < previous position

### AI Quiz Champion
- **Condition**: User gets 100% on an AI quiz
- **Data Required**: Quiz with `quizType: 'AI'` and `score === maxScore`

### Leaderboard Champion
- **Condition**: User reaches 1st place in leaderboard
- **Data Required**: Position entry with `position === 1`

## Validation

The test suite includes data validation to ensure:
- All required fields are present
- Numeric values are within valid ranges
- Date objects are properly formatted
- Quiz types are valid ('AI' or 'regular')
- Positions don't exceed total participants

## Usage in Application

To use these test utilities in your application:

```typescript
import { 
  checkRiskTaker, 
  checkRankClimber, 
  checkAIQuizChampion, 
  checkLeaderboardChampion,
  getAllAchievementStatuses 
} from '@/utils/achievementTestUtils';

// Check individual achievements
const hasGambled = checkRiskTaker(userData);
const hasAdvanced = checkRankClimber(userData);
const hasPerfectAIQuiz = checkAIQuizChampion(userData);
const isFirstPlace = checkLeaderboardChampion(userData);

// Get all achievement statuses
const statuses = getAllAchievementStatuses(userData);
console.log('Achievements:', statuses);
```

## Expected Results

When running the tests, you should see:

```
🧪 Running Weekly Achievement Tests...

📋 Testing Scenario: allAchievements
==================================================
🎲 Risk Taker (Gamble): ✅ PASS
📈 Rank Climber (Advance): ✅ PASS  
🤖 AI Quiz Champion (100%): ✅ PASS
🏆 Leaderboard Champion (1st): ✅ PASS

📊 Total Achievements: 4/4
==================================================
```

This confirms that all achievement logic is working correctly and can be used in the application.
