
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, CheckCircle, Star, Clock, BookOpen, 
  Target, TrendingUp, Calendar, Flame, Map, Users, Heart,
  MessageCircle, Zap, Flag, User, Settings, Compass, Sun,
  Repeat, CheckSquare, Edit3, LogIn, Clipboard, BarChart2 } from 'lucide-react';
import { Achievement, AchievementDifficulty } from '@/types/achievement';

const achievementIcons: Record<string, React.ReactNode> = {
  'trophy': <Trophy />,
  'award': <Award />,
  'check-circle': <CheckCircle />,
  'star': <Star />,
  'clock': <Clock />,
  'book-open': <BookOpen />,
  'target': <Target />,
  'trending-up': <TrendingUp />,
  'calendar': <Calendar />,
  'flame': <Flame />,
  'map': <Map />,
  'users': <Users />,
  'heart': <Heart />,
  'message-circle': <MessageCircle />,
  'zap': <Zap />,
  'flag': <Flag />,
  'user': <User />,
  'settings': <Settings />,
  'compass': <Compass />,
  'sun': <Sun />,
  'repeat': <Repeat />,
  'check-square': <CheckSquare />,
  'edit-3': <Edit3 />,
  'log-in': <LogIn />,
  'clipboard': <Clipboard />,
  'bar-chart-2': <BarChart2 />
};

const difficultyText: Record<AchievementDifficulty, string> = {
  [AchievementDifficulty.EASY]: 'Easy',
  [AchievementDifficulty.MEDIUM]: 'Medium',
  [AchievementDifficulty.HARD]: 'Hard'
};

const getIconComponent = (iconName: string) => {
  return achievementIcons[iconName] || <Trophy />;
};

interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const iconComponent = getIconComponent(achievement.icon);
  
  return (
    <Card className="overflow-hidden transition-all">
      <div className="h-1"></div>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted text-muted-foreground">
          {React.cloneElement(iconComponent as React.ReactElement, { className: 'w-5 h-5' })}
        </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{achievement.title}</h3>
              <Badge variant="outline" className="ml-2">
                {achievement.points} pts
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
            
            <div className="mt-3">
              <div className="flex justify-between items-center text-xs mb-1">
                <Badge variant="outline">
                  {difficultyText[achievement.difficulty]}
                </Badge>
                <span>{achievement.progress}%</span>
              </div>
              <Progress value={achievement.progress} className="h-1" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementCard;
