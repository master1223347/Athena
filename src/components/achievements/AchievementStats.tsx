
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Award, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Achievement } from '@/types/achievement';

export const LEVEL_TITLES = [
  'Noob',       // Level 1
  'Rookie',      // Level 2
  'Homework Peasant',         // Level 3
  'Grade Grinder',         // Level 4
  'Quiz Crusher',       // Level 5
  'Brainiac', // Level 6
  'GPA Gladiator',      // Level 7
  'Academic Weapon',      // Level 8
  'Prodigy',           // Level 9
  'Academic GOD'      // Level 10
];

interface AchievementStatsProps {
  achievements: Achievement[];
  totalPoints: number;
  progressCount: number;
  userLevel: number;
  nextLevelProgress: number;
  pointsToNextLevel: { current: number, next: number, progress: number };
  isLoading: boolean;
  hideNextAchievement?: boolean;
}

const AchievementStats: React.FC<AchievementStatsProps> = ({
  achievements,
  totalPoints,
  progressCount,
  userLevel,
  nextLevelProgress,
  pointsToNextLevel,
  isLoading,
  hideNextAchievement = false
}) => {
  // Always use 3-column grid since we're hiding the Next Achievement card
  const gridCols = 'grid-cols-1 md:grid-cols-3';
  
  // Calculate the number of actually completed (unlocked) achievements
  const completedCount = achievements.filter(a => a.unlocked && a.progress === 100).length;
  
  return (
    <div className={`grid ${gridCols} gap-4`}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            Total Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold">{completedCount}</div>
            <div className="text-muted-foreground text-sm pb-1">/ {achievements.length}</div>
          </div>
          <Progress 
            value={achievements.length > 0 ? (completedCount / achievements.length) * 100 : 0} 
            className="h-2 mt-2" 
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            Achievement Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{Math.round(totalPoints)}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {progressCount} achievements in progress
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Player Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end">
            <div className="text-3xl font-bold">
              {LEVEL_TITLES[userLevel-1] || 'Freshman'}
            </div>
            {userLevel < 10 && (
              <div className="text-sm text-muted-foreground">
                {pointsToNextLevel.next - pointsToNextLevel.current} pts to {LEVEL_TITLES[userLevel] || 'Sophomore'}
              </div>
            )}
          </div>
          {userLevel < 10 && (
            <Progress 
              value={nextLevelProgress} 
              className="h-2 mt-2" 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AchievementStats;
