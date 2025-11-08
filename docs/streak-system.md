# Streak System Documentation

## Overview

The Gambit streak system is inspired by Duolingo and provides users with daily login and weekly completion streaks to encourage consistent engagement with the platform. Users earn XP rewards for maintaining streaks and reaching milestones.

## Features

### Daily Login Streaks
- **Base Points**: 5 XP per day
- **Multiplier**: 1.2x every 7 days
- **Maximum Points**: 50 XP per day (capped at 4x multiplier)
- **Multiplier Cap**: 4.0x
- **Milestone Rewards**:
  - 1 day: 5 XP
  - 3 days: 10 XP
  - 7 days: 20 XP
  - 14 days: 35 XP
  - 30 days: 75 XP
  - 60 days: 150 XP
  - 100 days: 300 XP

### Weekly Completion Streaks
- **Base Points**: 100 XP per week
- **Multiplier**: 1.3x every 4 weeks
- **Maximum Points**: 500 XP per week (capped at 3x multiplier)
- **Multiplier Cap**: 3.0x
- **Milestone Rewards**:
  - 1 week: 25 XP
  - 2 weeks: 50 XP
  - 4 weeks: 100 XP
  - 8 weeks: 200 XP
  - 12 weeks: 400 XP
  - 26 weeks: 800 XP
  - 52 weeks: 1500 XP

## How It Works

### Daily Streak Logic
1. User logs in daily to maintain streak
2. Streak continues if login is consecutive
3. **Streak resets to 1 if a day is missed**
4. Multiplier increases every 7 days
5. Points are calculated: `min(basePoints * multiplier, maxPoints) + milestoneReward`
6. **XP is automatically added to user's profile**

### Weekly Streak Logic
1. User completes all weekly assignments
2. Streak continues if completed consecutively
3. **Streak resets to 1 if a week is missed**
4. Multiplier increases every 4 weeks
5. Points are calculated: `min(basePoints * multiplier, maxPoints) + milestoneReward`
6. **XP is automatically added to user's profile**

## Streak Achievements

### Daily Streak Achievements
- **First Steps** (1 day): 10 XP
- **Three Day Warrior** (3 days): 15 XP
- **Week Warrior** (7 days): 25 XP
- **Fortnight Fighter** (14 days): 50 XP
- **Monthly Master** (30 days): 100 XP
- **Two Month Titan** (60 days): 200 XP
- **Century Club** (100 days): 500 XP

### Weekly Streak Achievements
- **Weekly Wonder** (1 week): 50 XP
- **Two Week Titan** (2 weeks): 75 XP
- **Monthly Marvel** (4 weeks): 150 XP
- **Two Month Master** (8 weeks): 300 XP
- **Quarterly Queen** (12 weeks): 500 XP
- **Half Year Hero** (26 weeks): 1000 XP
- **Yearly Legend** (52 weeks): 2000 XP

## Database Schema

The streak system uses the `user_settings` table with these additional fields:

```sql
ALTER TABLE user_settings ADD COLUMN:
- daily_login_streak: INTEGER DEFAULT 0
- weekly_completion_streak: INTEGER DEFAULT 0
- last_login_date: DATE DEFAULT CURRENT_DATE
- last_weekly_completion_date: DATE DEFAULT CURRENT_DATE
- streak_start_date: DATE DEFAULT CURRENT_DATE
```

## Components

### StreakDisplay
- Main streak display component (now on Dashboard page)
- Shows current daily and weekly streaks
- Displays XP rewards and multipliers
- Shows milestone progress and next rewards
- Includes collapsible detailed view

### StreakProgress
- Progress indicator for streaks
- Shows progress towards next milestone
- Displays current and next multipliers

### StreakService
- Core streak logic and calculations
- Handles streak updates and persistence
- Manages streak rewards and multipliers
- **Automatically adds XP to user profiles**

### StreakAchievementService
- Manages streak-based achievements
- Automatically awards achievements when milestones are reached
- Integrates with the main achievement system

## Usage

### Basic Implementation
```tsx
import StreakDisplay from '@/components/streaks/StreakDisplay';

// In your component (now on Dashboard page)
<StreakDisplay className="w-full" />
```

### Using the Hook
```tsx
import { useStreaks } from '@/hooks/useStreaks';

const { streakStats, processDailyLogin, processWeeklyCompletion } = useStreaks();
```

### Manual Streak Processing
```tsx
// Process daily login
const reward = await StreakService.processDailyLogin(userId);

// Process weekly completion
const reward = await StreakService.processWeeklyCompletion(userId);
```

## Configuration

Streak settings can be modified in `src/services/streakService.ts`:

```typescript
const STREAK_CONFIG = {
  daily: {
    basePoints: 5,
    maxPoints: 50,
    multiplierInterval: 7,
    multiplier: 1.2,
    maxMultiplier: 4.0,
    milestoneRewards: {
      1: 5, 3: 10, 7: 20, 14: 35, 30: 75, 60: 150, 100: 300
    }
  },
  weekly: {
    basePoints: 100,
    maxPoints: 500,
    multiplierInterval: 4,
    multiplier: 1.3,
    maxMultiplier: 3.0,
    milestoneRewards: {
      1: 25, 2: 50, 4: 100, 8: 200, 12: 400, 26: 800, 52: 1500
    }
  },
};
```

## Animations

The streak system includes several animations:

- **Streak Celebration**: Appears when streaks are maintained
- **Streak Loss**: Appears when streaks are broken
- **Progress Indicators**: Visual feedback for streak progress

## Integration Points

- **Dashboard Page**: Streak display prominently featured at the top
- **Achievement System**: Automatic achievement unlocking
- **User Settings**: Streak data persistence
- **Toast Notifications**: Real-time feedback for users
- **Profile Points**: XP automatically added to user's total points

## Future Enhancements

- Streak freeze items (prevent streak loss)
- Streak sharing and social features
- Customizable streak goals
- Streak analytics and insights
- Streak-based leaderboards 