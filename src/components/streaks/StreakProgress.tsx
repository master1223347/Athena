import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Calendar, Target, Zap, TrendingUp, Award } from 'lucide-react';

interface StreakProgressProps {
  type: 'daily' | 'weekly';
  currentStreak: number;
  nextMilestone: number;
}

const StreakProgress: React.FC<StreakProgressProps> = ({ type, currentStreak, nextMilestone }) => {
  const isDaily = type === 'daily';
  const progress = isDaily 
    ? Math.min((currentStreak % 7) / 7 * 100, 100)
    : Math.min((currentStreak % 7) / 7 * 100, 100);
  
  const nextMilestoneDisplay = isDaily 
    ? Math.ceil((currentStreak + 1) / 7) * 7
    : Math.ceil((currentStreak + 1) / 7) * 7;

  const getIcon = () => isDaily ? <Flame className="w-4 h-4" /> : <Calendar className="w-4 h-4" />;
  const getColor = () => isDaily ? 'from-orange-400 to-red-500' : 'from-blue-400 to-indigo-500';
  const getBgColor = () => isDaily ? 'from-orange-50 to-red-50' : 'from-blue-50 to-indigo-50';
  const getBorderColor = () => isDaily ? 'border-orange-200' : 'border-blue-200';
  const getDarkBgColor = () => isDaily ? 'dark:from-orange-900/20 dark:to-red-900/20' : 'dark:from-blue-900/20 dark:to-indigo-900/20';

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <CardContent className="p-0">
        {/* Header with gradient background */}
        <div className={`bg-gradient-to-r ${getBgColor()} ${getDarkBgColor()} p-4 border-b border-slate-200 dark:border-slate-700`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getColor()} flex items-center justify-center shadow-sm`}>
              {getIcon()}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-800 dark:text-slate-200 capitalize text-lg">
                {type} Streak Progress
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {currentStreak} / {nextMilestoneDisplay} {isDaily ? 'days' : 'weeks'}
              </div>
            </div>
            <Badge 
              variant="secondary" 
              className={`${
                isDaily 
                  ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700' 
                  : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700'
              }`}
            >
              {Math.round(progress)}%
            </Badge>
          </div>
        </div>

        {/* Progress Section */}
        <div className="p-4 space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Progress to Next Milestone</span>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Next: {nextMilestoneDisplay}
                </span>
              </div>
            </div>
            
            <div className="relative">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getColor()} rounded-full transition-all duration-700 ease-out shadow-sm`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Milestone and Multiplier Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Next Milestone */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Next Milestone</span>
              </div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {nextMilestoneDisplay} {isDaily ? 'days' : 'weeks'}
              </div>
            </div>

            {/* Multiplier Status */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Multiplier</span>
              </div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {currentStreak >= 7 ? (
                  <span className="text-green-600 dark:text-green-400">
                    Active! ✨
                  </span>
                ) : (
                  <span className="text-slate-600 dark:text-slate-400">
                    {7 - (currentStreak % 7)} to go
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Encouragement Message */}
          <div className="text-center">
            {currentStreak >= 7 ? (
              <div className="text-sm text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 rounded-lg py-2 px-3">
                🎉 Great job! Your multiplier is active. Keep the streak going!
              </div>
            ) : (
              <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg py-2 px-3">
                {7 - (currentStreak % 7)} more {isDaily ? 'days' : 'weeks'} until your next multiplier bonus!
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakProgress; 