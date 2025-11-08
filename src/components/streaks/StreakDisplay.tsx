import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Flame, Calendar, Info, Target, Zap, Trophy, TrendingUp, Award } from 'lucide-react';
import { useStreaks } from '@/hooks/useStreaks';
import StreakProgress from './StreakProgress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface StreakDisplayProps {
  className?: string;
  compact?: boolean;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({ className = '', compact = false }) => {
  const { user } = useAuth();
  const { 
    streakStats, 
    loading, 
    lastReward, 
    processDailyLogin, 
    getDailyMultiplier, 
    getWeeklyMultiplier, 
    getDailyPoints, 
    getWeeklyPoints 
  } = useStreaks();

  useEffect(() => {
    if (user) {
      // Process daily login when component mounts
      const handleDailyLogin = async () => {
        const reward = await processDailyLogin();
        if (reward) {
          // Show toast notification
          if (reward.type === 'daily_login') {
            toast.success(`🔥 Daily Login Streak! +${reward.points} XP`, {
              description: `Day ${reward.streak_count}${reward.multiplier > 1 ? ` (${reward.multiplier.toFixed(1)}x multiplier!)` : ''}`,
              duration: 4000,
            });
          }
        }
      };
      
      handleDailyLogin();
    }
  }, [user, processDailyLogin]);

  if (!user || loading) {
    console.log('StreakDisplay: Loading or no user', { user: !!user, loading });
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-muted animate-pulse rounded-xl"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
              <div className="h-3 bg-muted animate-pulse rounded w-32"></div>
            </div>
      </div>
        </CardContent>
      </Card>
    );
  }

  if (!streakStats) {
    console.log('StreakDisplay: No streak stats, showing default state');
    return (
      <Card className={`${className} border-dashed`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Start Your Streak</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Login daily to earn XP rewards and build your streak!
              </p>
            </div>
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              Ready
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log('StreakDisplay: Rendering with stats', streakStats);

  // Compact version for leaderboard
  if (compact) {
  return (
      <Card className={`${className} overflow-hidden`}>
        <CardContent className="p-3 mx-auto flex items-center">
          <div className="flex items-center justify-between w-full">
            {/* Title and Description */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-500 rounded flex items-center justify-center shadow-sm">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Streak Tracker</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Daily & Weekly</div>
              </div>
            </div>

            {/* Streak Information */}
            <div className="flex items-center gap-4">
              {/* Daily Streak */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Flame 
                    className={`w-4 h-4 ${
                      streakStats.daily.current > 0 
                        ? 'text-orange-500' 
                        : 'text-slate-400'
                    }`} 
                  />
                  {streakStats.daily.current > 0 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-slate-900 animate-pulse"></div>
                  )}
                </div>
                <div className="text-xs min-w-[45px]">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {streakStats.daily.current}d
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
                    +{getDailyPoints(streakStats.daily.current)} XP
                  </div>
                </div>
              </div>

              {/* Weekly Streak */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Calendar 
                    className={`w-4 h-4 ${
                      streakStats.weekly.current > 0 
                        ? 'text-blue-500' 
                        : 'text-slate-400'
                    }`} 
                  />
                  {streakStats.weekly.current > 0 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-slate-900 animate-pulse"></div>
                  )}
                </div>
                <div className="text-xs min-w-[45px]">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {streakStats.weekly.current}w
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
                    +{getWeeklyPoints(streakStats.weekly.current)} XP
                  </div>
                </div>
              </div>
            </div>

            {/* Info Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-lg"
                >
                  <Info className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
              Streak Tracker
                  </DialogTitle>
                  <DialogDescription>
                    Track your streaks and earn XP rewards for consistent engagement
                  </DialogDescription>
                </DialogHeader>

                {/* Quick Stats Header */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                      {streakStats.daily.current + streakStats.weekly.current}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Total Streaks</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      +{getDailyPoints(streakStats.daily.current) + getWeeklyPoints(streakStats.weekly.current)}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">XP This Week</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {Math.max(streakStats.daily.current, streakStats.weekly.current)}
                    </div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">Best Streak</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Daily Streak Section */}
                  <div className="bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 dark:from-orange-900/20 dark:via-red-900/20 dark:to-orange-900/30 rounded-2xl p-6 border border-orange-200 dark:border-orange-700 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
                            <Flame className="w-6 h-6 text-white" />
                          </div>
                          {streakStats.daily.current > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-orange-900 dark:text-orange-100">
                            Daily Streak
                          </h3>
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            Login daily to maintain your streak
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                          {streakStats.daily.current}
                        </div>
                        <div className="text-sm text-orange-600 dark:text-orange-400">days</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <StreakProgress
                        type="daily"
                        currentStreak={streakStats.daily.current}
                        nextMilestone={streakStats.daily.nextReward}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">XP per Day</div>
                          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                            +{getDailyPoints(streakStats.daily.current)}
                          </div>
                        </div>
                        <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Multiplier</div>
                          <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                            {getDailyMultiplier(streakStats.daily.current).toFixed(1)}x
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Streak Section */}
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/30 rounded-2xl p-6 border border-blue-200 dark:border-blue-700 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                            <Calendar className="w-6 h-6 text-white" />
                          </div>
                          {streakStats.weekly.current > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                            Weekly Streak
                          </h3>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Complete weekly goals to maintain your streak
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                          {streakStats.weekly.current}
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">weeks</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <StreakProgress
                        type="weekly"
                        currentStreak={streakStats.weekly.current}
                        nextMilestone={streakStats.weekly.nextReward}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">XP per Week</div>
                          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                            +{getWeeklyPoints(streakStats.weekly.current)}
                          </div>
                        </div>
                        <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Multiplier</div>
                          <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                            {getWeeklyMultiplier(streakStats.weekly.current).toFixed(1)}x
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} overflow-hidden`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            Streak Tracker
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Info className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Streak Tracker
                </DialogTitle>
                <DialogDescription>
                  Track your streaks and earn XP rewards for consistent engagement
                </DialogDescription>
              </DialogHeader>

              {/* Quick Stats Header */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    {streakStats.daily.current + streakStats.weekly.current}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Streaks</div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    +{getDailyPoints(streakStats.daily.current) + getWeeklyPoints(streakStats.weekly.current)}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">XP This Week</div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {Math.max(streakStats.daily.current, streakStats.weekly.current)}
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Best Streak</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Streak Section */}
                <div className="bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 dark:from-orange-900/20 dark:via-red-900/20 dark:to-orange-900/30 rounded-2xl p-6 border border-orange-200 dark:border-orange-700 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
                          <Flame className="w-6 h-6 text-white" />
                        </div>
                        {streakStats.daily.current > 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-orange-900 dark:text-orange-100">
                          Daily Streak
                        </h3>
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                          Login daily to maintain your streak
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                        {streakStats.daily.current}
                      </div>
                      <div className="text-sm text-orange-600 dark:text-orange-400">days</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <StreakProgress
                      type="daily"
                      currentStreak={streakStats.daily.current}
                      nextMilestone={streakStats.daily.nextReward}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">XP per Day</div>
                        <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                          +{getDailyPoints(streakStats.daily.current)}
                        </div>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Multiplier</div>
                        <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                          {getDailyMultiplier(streakStats.daily.current).toFixed(1)}x
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weekly Streak Section */}
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/30 rounded-2xl p-6 border border-blue-200 dark:border-blue-700 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        {streakStats.weekly.current > 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                          Weekly Streak
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Complete weekly goals to maintain your streak
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                        {streakStats.weekly.current}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">weeks</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <StreakProgress
                      type="weekly"
                      currentStreak={streakStats.weekly.current}
                      nextMilestone={streakStats.weekly.nextReward}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">XP per Week</div>
                        <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                          +{getWeeklyPoints(streakStats.weekly.current)}
                        </div>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3">
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Multiplier</div>
                        <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                          {getWeeklyMultiplier(streakStats.weekly.current).toFixed(1)}x
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Streak Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Daily Streak */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-700">
            <div className="flex items-center gap-3">
            <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
              {streakStats.daily.current > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{streakStats.daily.current}</span>
                  </div>
              )}
            </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-orange-800 dark:text-orange-200">Daily Streak</div>
                <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                {streakStats.daily.current > 0 ? `${streakStats.daily.current} day${streakStats.daily.current !== 1 ? 's' : ''}` : 'No streak'}
              </div>
                <div className="text-xs text-orange-600 dark:text-orange-400">
                +{getDailyPoints(streakStats.daily.current)} XP
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Streak */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-3">
            <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
              {streakStats.weekly.current > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{streakStats.weekly.current}</span>
                  </div>
              )}
            </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Weekly Streak</div>
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {streakStats.weekly.current > 0 ? `${streakStats.weekly.current} week${streakStats.weekly.current !== 1 ? 's' : ''}` : 'No streak'}
              </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                +{getWeeklyPoints(streakStats.weekly.current)} XP
                </div>
              </div>
              </div>
            </div>
          </div>

        {/* Progress Section */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progress to Next Milestone</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {(() => {
                const milestones = [3, 7, 14, 30, 60, 100];
                const next = milestones.find(m => m > streakStats.daily.current);
                return next ? `${next} days` : 'Max!';
              })()}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min((streakStats.daily.current % 7) / 7 * 100, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
              {streakStats.daily.current % 7}/7
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakDisplay; 