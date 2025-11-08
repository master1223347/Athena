import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWeeklyAchievementSystem } from '@/hooks/useWeeklyAchievementSystem';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Trophy, 
  Target, 
  Star,
  RefreshCw,
  CheckCircle,
  Circle,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';

interface WeeklyAchievementSystemProps {
  className?: string;
}

export function WeeklyAchievementSystem({ className }: WeeklyAchievementSystemProps) {
  const { user } = useAuth();
  const {
    selection,
    stats,
    loading,
    error,
    isNewWeek,
    refreshSystem
  } = useWeeklyAchievementSystem(user?.id || '');

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
            <Button onClick={refreshSystem} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current">Current Week</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current" className="mt-4">
          <CurrentWeekTab 
            selection={selection} 
            isNewWeek={isNewWeek}
            refreshSystem={refreshSystem}
            loading={loading}
          />
        </TabsContent>
        
        <TabsContent value="progress" className="mt-4">
          <ProgressTab stats={stats} />
        </TabsContent>
        
        <TabsContent value="stats" className="mt-4">
          <StatsTab stats={stats} />
        </TabsContent>
        
        <TabsContent value="achievements" className="mt-4">
          <AchievementsTab stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface CurrentWeekTabProps {
  selection: any;
  isNewWeek: boolean;
  refreshSystem: () => Promise<void>;
  loading: boolean;
}

function CurrentWeekTab({ selection, isNewWeek, refreshSystem, loading }: CurrentWeekTabProps) {
  if (!selection) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            No weekly achievements available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>This Week's Challenges</span>
            {isNewWeek && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                New Week!
              </Badge>
            )}
          </CardTitle>
          <Button 
            onClick={refreshSystem} 
            variant="outline" 
            size="sm"
            disabled={loading}
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
            difficulty="easy"
            icon={<Circle className="h-5 w-5" />}
            color="green"
          />
          
          {/* Medium Achievement */}
          <AchievementCard
            title="Medium Challenge"
            achievement={selection.medium}
            difficulty="medium"
            icon={<Target className="h-5 w-5" />}
            color="blue"
          />
          
          {/* Hard Achievement */}
          <AchievementCard
            title="Hard Challenge"
            achievement={selection.hard}
            difficulty="hard"
            icon={<Star className="h-5 w-5" />}
            color="red"
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

interface ProgressTabProps {
  stats: any;
}

function ProgressTab({ stats }: ProgressTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>This Week's Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Easy Challenge</span>
              <div className="flex items-center space-x-2">
                <Progress value={0} className="w-24 h-2" />
                <span className="text-xs text-muted-foreground">0%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Medium Challenge</span>
              <div className="flex items-center space-x-2">
                <Progress value={0} className="w-24 h-2" />
                <span className="text-xs text-muted-foreground">0%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Hard Challenge</span>
              <div className="flex items-center space-x-2">
                <Progress value={0} className="w-24 h-2" />
                <span className="text-xs text-muted-foreground">0%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Weekly Streak</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.streak}</div>
            <p className="text-sm text-muted-foreground">Weeks in a row</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatsTabProps {
  stats: any;
}

function StatsTab({ stats }: StatsTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-sm font-medium">Total Weeks</p>
              <p className="text-2xl font-bold">{stats.totalWeeks}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-sm font-medium">This Week</p>
              <p className="text-2xl font-bold">{stats.unlockedThisWeek}/3</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Award className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Total Unlocked</p>
              <p className="text-2xl font-bold">{stats.totalUnlocked}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-sm font-medium">Streak</p>
              <p className="text-2xl font-bold">{stats.streak}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface AchievementCardProps {
  title: string;
  achievement: any;
  difficulty: string;
  icon: React.ReactNode;
  color: string;
}

function AchievementCard({ title, achievement, difficulty, icon, color }: AchievementCardProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-800';
      case 'blue': return 'bg-blue-100 text-blue-800';
      case 'red': return 'bg-red-100 text-red-800';
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
        <Badge className={getColorClasses(color)}>
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
        
        <div className="flex items-center space-x-1 text-muted-foreground text-xs">
          <Circle className="h-3 w-3" />
          <span>Not started</span>
        </div>
      </div>
    </div>
  );
}

interface AchievementsTabProps {
  stats: any;
}

function AchievementsTab({ stats }: AchievementsTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Achievement Pool</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.availableAchievements.easy}</div>
              <p className="text-sm text-muted-foreground">Easy Available</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.availableAchievements.medium}</div>
              <p className="text-sm text-muted-foreground">Medium Available</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.availableAchievements.hard}</div>
              <p className="text-sm text-muted-foreground">Hard Available</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Available</span>
              <span className="font-medium">{stats.availableAchievements.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Used</span>
              <span className="font-medium">{stats.usageStats.totalUsed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Usage Percentage</span>
              <span className="font-medium">{stats.usageStats.usagePercentage}%</span>
            </div>
          </div>
          
          {stats.usageStats.needsReset && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Achievement Pool Reset</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                All achievements have been used! The pool will reset for next week.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Selection Rules</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Circle className="h-4 w-4 text-green-500" />
              <span className="text-sm">1 Easy achievement selected each week</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm">1 Medium achievement selected each week</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-red-500" />
              <span className="text-sm">1 Hard achievement selected each week</span>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-purple-500" />
              <span className="text-sm">No repeats until all achievements are used</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
