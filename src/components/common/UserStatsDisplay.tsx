import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Star, Info, Circle, Target, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWeeklyAchievementSystem } from '@/hooks/useWeeklyAchievementSystem';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface UserStatsDisplayProps {
  className?: string;
  compact?: boolean;
}

const UserStatsDisplay: React.FC<UserStatsDisplayProps> = ({ className = '', compact = false }) => {
  const { user } = useAuth();
  const {
    selection,
    stats,
    loading,
    error,
    isNewWeek,
    refreshSystem,
    forceRefreshSelection
  } = useWeeklyAchievementSystem(user?.id || '');

  if (!user) {
    return null;
  }

  // Calculate completed achievements from the weekly system
  const completedAchievements = selection ? 
    [selection.easy, selection.medium, selection.hard].filter(achievement => {
      // This would need to be connected to actual progress checking
      // For now, we'll use mock data but with the real achievement structure
      return false; // Placeholder - would check actual progress
    }).length : 0;
  const totalAchievements = 3;
  const streak = stats?.streak || 0;

  // Compact version for leaderboard
  if (compact) {
    return (
      <Card className={`${className} overflow-hidden`}>
        <CardContent className="p-3 mx-auto flex items-center">
          <div className="flex items-center justify-between w-full">
            {/* Title and Description */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-500 rounded flex items-center justify-center shadow-sm">
                <Award className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Weekly Achievements</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Progress & Rewards</div>
              </div>
            </div>

            {/* Stats Information */}
            <div className="flex items-center gap-4">
              {/* Achievements Progress */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Star 
                    className="w-4 h-4 text-yellow-500" 
                  />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-slate-900 animate-pulse"></div>
                </div>
                <div className="text-xs min-w-[45px]">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {completedAchievements}/{totalAchievements}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
                    completed
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
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-500" />
                    Weekly Achievements
                  </DialogTitle>
                  <DialogDescription>
                    Complete these weekly challenges to earn rewards and build your streak
                  </DialogDescription>
                </DialogHeader>

                {/* Weekly Achievements */}
                {loading ? (
                  <div className="space-y-4">
                    <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                    <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                    <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-4">Error loading weekly achievements</p>
                    <Button onClick={refreshSystem} variant="outline" size="sm">
                      Retry
                    </Button>
                  </div>
                ) : selection ? (
                  <div className="space-y-4">
                    {/* Easy Achievement */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700 shadow-md">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                          <Circle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Easy</h4>
                            <span className="text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-3 py-1 rounded-full">Free</span>
                          </div>
                          <p className="text-base text-slate-600 dark:text-slate-400 mb-0">{selection.easy?.description || 'Complete assignments this week'}</p>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-500 dark:text-slate-400">Progress: Not started</div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-slate-500">+{selection.easy?.points || 0} XP</div>
                              <div className="text-sm text-slate-500">Not Started</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Medium Achievement */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700 shadow-md">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Medium</h4>
                            <span className="text-sm bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-3 py-1 rounded-full">Premium</span>
                          </div>
                          <p className="text-base text-slate-600 dark:text-slate-400 mb-0">{selection.medium?.description || 'Complete medium difficulty tasks'}</p>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-500 dark:text-slate-400">Progress: Not started</div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-slate-500">+{selection.medium?.points || 0} XP</div>
                              <div className="text-sm text-slate-500">Not Started</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hard Achievement */}
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700 shadow-md">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Hard</h4>
                            <span className="text-sm bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-3 py-1 rounded-full">Premium</span>
                          </div>
                          <p className="text-base text-slate-600 dark:text-slate-400 mb-0">{selection.hard?.description || 'Complete challenging tasks'}</p>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-500 dark:text-slate-400">Progress: Not started</div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-slate-500">+{selection.hard?.points || 0} XP</div>
                              <div className="text-sm text-slate-500">Not Started</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-500">No weekly achievements available</p>
                  </div>
                )}

              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  }

  return (
    <Card className={`${className} overflow-hidden`}>
      <CardContent className="p-3 mx-auto flex items-center">
        <div className="flex items-center justify-between w-full">
          {/* Title and Description */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-500 rounded flex items-center justify-center shadow-sm">
              <Award className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Weekly Achievements</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Progress & Rewards</div>
            </div>
          </div>

          {/* Stats Information */}
          <div className="flex items-center gap-4">
            {/* Achievements Progress */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Star 
                  className="w-4 h-4 text-yellow-500" 
                />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-slate-900 animate-pulse"></div>
              </div>
              <div className="text-xs min-w-[45px]">
                <div className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  {completedAchievements}/{totalAchievements}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
                  completed
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserStatsDisplay;
