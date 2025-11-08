import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useWeeklyAchievements, useWeeklyAchievementCategories } from '@/hooks/useWeeklyAchievements';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Clock, 
  Globe, 
  FileText, 
  BarChart3,
  RefreshCw,
  CheckCircle,
  Circle
} from 'lucide-react';

interface WeeklyAchievementsProps {
  className?: string;
  weekStart?: Date;
  weekEnd?: Date;
}

export function WeeklyAchievements({ 
  className, 
  weekStart, 
  weekEnd 
}: WeeklyAchievementsProps) {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  const {
    achievements,
    loading,
    error,
    refreshAchievements,
    getAchievementsByCategory,
    getUnlockedAchievements,
    getProgressAchievements
  } = useWeeklyAchievements(user?.id || '', weekStart, weekEnd);
  
  const categories = useWeeklyAchievementCategories();

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            Please log in to view weekly achievements
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading weekly achievements...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-destructive mb-4">Error loading achievements</p>
            <Button onClick={refreshAchievements} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unlockedAchievements = getUnlockedAchievements();
  const progressAchievements = getProgressAchievements();
  
  const getFilteredAchievements = () => {
    if (activeCategory === 'all') return achievements;
    if (activeCategory === 'unlocked') return unlockedAchievements;
    if (activeCategory === 'progress') return progressAchievements;
    return getAchievementsByCategory(activeCategory as any);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <BarChart3 className="h-4 w-4" />;
      case 'timing': return <Clock className="h-4 w-4" />;
      case 'engagement': return <Globe className="h-4 w-4" />;
      case 'variety': return <FileText className="h-4 w-4" />;
      case 'improvement': return <TrendingUp className="h-4 w-4" />;
      case 'streak': return <Target className="h-4 w-4" />;
      case 'threshold': return <Circle className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'uncommon': return 'bg-green-100 text-green-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Weekly Achievements</span>
          </CardTitle>
          <Button 
            onClick={refreshAchievements} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>{unlockedAchievements.length} unlocked</span>
          </div>
          <div className="flex items-center space-x-1">
            <Circle className="h-4 w-4 text-blue-500" />
            <span>{progressAchievements.length} in progress</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            {Object.entries(categories).map(([key, category]) => (
              <TabsTrigger key={key} value={key} className="hidden lg:flex">
                {getCategoryIcon(key)}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <AchievementList achievements={achievements} />
          </TabsContent>
          
          <TabsContent value="unlocked" className="mt-4">
            <AchievementList achievements={unlockedAchievements} />
          </TabsContent>
          
          <TabsContent value="progress" className="mt-4">
            <AchievementList achievements={progressAchievements} />
          </TabsContent>
          
          {Object.entries(categories).map(([key, category]) => (
            <TabsContent key={key} value={key} className="mt-4">
              <AchievementList achievements={getAchievementsByCategory(key as any)} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface AchievementListProps {
  achievements: any[];
}

function AchievementList({ achievements }: AchievementListProps) {
  if (achievements.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No achievements found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {achievements.map((achievement, index) => (
        <AchievementCard key={index} achievement={achievement} />
      ))}
    </div>
  );
}

interface AchievementCardProps {
  achievement: any;
}

function AchievementCard({ achievement }: AchievementCardProps) {
  const { achievement: data, unlocked, progress } = achievement;
  
  return (
    <Card className={`transition-all duration-200 ${unlocked ? 'ring-2 ring-green-200 bg-green-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
              unlocked ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {data.icon}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm">{data.title}</h3>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="secondary" 
                  className={getDifficultyColor(data.difficulty)}
                >
                  {data.difficulty}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {data.points} XP
                </span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground mb-3">
              {data.description}
            </p>
            
            {!unlocked && progress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            {unlocked && (
              <div className="flex items-center space-x-1 text-green-600 text-xs">
                <CheckCircle className="h-3 w-3" />
                <span>Unlocked!</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'common': return 'bg-gray-100 text-gray-800';
    case 'uncommon': return 'bg-green-100 text-green-800';
    case 'rare': return 'bg-blue-100 text-blue-800';
    case 'epic': return 'bg-purple-100 text-purple-800';
    case 'legendary': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
