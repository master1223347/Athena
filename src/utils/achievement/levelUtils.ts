
// Utility functions for achievement level calculations

// Define level thresholds with more achievable progression
export const LEVEL_THRESHOLDS = [
  0,    // Level 1: 0 points
  5,    // Level 2: 5 points (made easier than before)
  15,   // Level 3: 15 points
  30,   // Level 4: 30 points
  50,   // Level 5: 50 points
  75,   // Level 6: 75 points
  110,  // Level 7: 110 points
  150,  // Level 8: 150 points
  200,  // Level 9: 200 points
  275   // Level 10: 275 points
];

// Standard achievement point values
export const ACHIEVEMENT_POINTS = {
  EASY: 10,    // Easy achievements = 10 points
  MEDIUM: 30,  // Medium achievements = 30 points
  HARD: 50     // Hard achievements = 50 points
};

// Calculate user level based on achievement points
export function calculateLevel(totalPoints: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1; // Default to level 1
}

// Calculate points needed for next level
export function calculatePointsToNextLevel(totalPoints: number): { current: number, next: number, progress: number } {
  const currentLevel = calculateLevel(totalPoints);
  const nextLevel = Math.min(currentLevel + 1, LEVEL_THRESHOLDS.length);
  
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1];
  const nextThreshold = LEVEL_THRESHOLDS[nextLevel - 1];
  
  // Handle max level case
  if (currentLevel === LEVEL_THRESHOLDS.length) {
    return {
      current: currentThreshold,
      next: currentThreshold,
      progress: 100
    };
  }
  
  const pointsNeeded = nextThreshold - currentThreshold;
  const pointsGained = totalPoints - currentThreshold;
  const progress = Math.min(100, Math.floor((pointsGained / pointsNeeded) * 100));
  
  return {
    current: currentThreshold,
    next: nextThreshold,
    progress
  };
}
