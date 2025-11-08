
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Achievement } from '@/types/achievement';
import AchievementCard from './AchievementCard';

interface AchievementListProps {
  achievements: Achievement[];
  isLoading: boolean;
}

const AchievementList: React.FC<AchievementListProps> = ({ achievements, isLoading }) => {
  const renderSkeletons = () => {
    return Array(4).fill(0).map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <div className="h-1 bg-muted"></div>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
              <div className="pt-2">
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {renderSkeletons()}
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No Achievements Available</h3>
          <p className="text-muted-foreground text-center max-w-md mt-2">
            There are currently no achievements in this category. Check back later!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {achievements.map(achievement => (
        <AchievementCard key={achievement.id} achievement={achievement} />
      ))}
    </div>
  );
};

export default AchievementList;
