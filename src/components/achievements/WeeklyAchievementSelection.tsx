import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useWeeklyAchievementSelection } from '@/hooks/useWeeklyAchievementSelection';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Trophy, 
  Target, 
  Star,
  RefreshCw,
  CheckCircle,
  Circle,
  Calendar,
  Award
} from 'lucide-react';

interface WeeklyAchievementSelectionProps {
  className?: string;
}

export function WeeklyAchievementSelection({ className }: WeeklyAchievementSelectionProps) {
  const { user } = useAuth();
  const {
    selection,
    progress,
    loading,
    error,
    refreshSelection,
    isNewWeek
  } = useWeeklyAchievementSelection(user?.id || '');

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
            <Button onClick={refreshSelection} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selection || !progress) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            No weekly achievements available
          </p>
        </CardContent>
      </Card>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <Circle className="h-4 w-4" />;
      case 'medium': return <Target className="h-4 w-4" />;
      case 'hard': return <Star className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>This Week's Achievements</span>
            {isNewWeek && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                New Week!
              </Badge>
            )}
          </CardTitle>
          <Button 
            onClick={refreshSelection} 
            variant="outline" 
            size="sm"
            disabled={loading}
            title="Get new weekly achievements"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>
              {selection.weekStart.toLocaleDateString()} - {selection.weekEnd.toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Easy Achievement */}
          <AchievementCard
            title="Easy Challenge"
            achievement={selection.easy}
            progress={progress.easy}
            difficulty="easy"
            icon={<Circle className="h-5 w-5" />}
          />
          
          {/* Medium Achievement */}
          <AchievementCard
            title="Medium Challenge"
            achievement={selection.medium}
            progress={progress.medium}
            difficulty="medium"
            icon={<Target className="h-5 w-5" />}
          />
          
          {/* Hard Achievement */}
          <AchievementCard
            title="Hard Challenge"
            achievement={selection.hard}
            progress={progress.hard}
            difficulty="hard"
            icon={<Star className="h-5 w-5" />}
          />
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Weekly Challenge</span>
          </div>
          <p className="text-xs text-blue-700">
            Complete all three achievements this week to earn bonus XP and unlock special rewards!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface AchievementCardProps {
  title: string;
  achievement: any;
  progress: any;
  difficulty: string;
  icon: React.ReactNode;
}

function AchievementCard({ title, achievement, progress, difficulty, icon }: AchievementCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {icon}
          <h3 className="font-medium text-sm">{title}</h3>
        </div>
        <Badge className={getDifficultyColor(difficulty)}>
          {difficulty}
        </Badge>
      </div>
      
      <div className="space-y-3">
        <div>
          <h4 className="font-medium text-sm mb-1">{achievement.title}</h4>
          <p className="text-xs text-muted-foreground">{achievement.description}</p>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{achievement.points} XP</span>
          <span>{achievement.icon}</span>
        </div>
        
        {!progress.unlocked && progress.progress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Progress</span>
              <span>{Math.round(progress.progress)}%</span>
            </div>
            <Progress value={progress.progress} className="h-2" />
          </div>
        )}
        
        {progress.unlocked && (
          <div className="flex items-center space-x-1 text-green-600 text-xs">
            <CheckCircle className="h-3 w-3" />
            <span>Completed!</span>
          </div>
        )}
        
        {!progress.unlocked && progress.progress === 0 && (
          <div className="flex items-center space-x-1 text-muted-foreground text-xs">
            <Circle className="h-3 w-3" />
            <span>Not started</span>
          </div>
        )}
      </div>
    </div>
  );
}
