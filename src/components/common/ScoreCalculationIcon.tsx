import React, { useState } from 'react';
import { Calculator, Info, TrendingUp, Award, BookOpen, Flame, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { WeeklyGradesXpService } from '@/services/weeklyGradesXpService';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

interface ScoreCalculationIconProps {
  className?: string;
}

const ScoreCalculationIcon: React.FC<ScoreCalculationIconProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [weeklyGradesData, setWeeklyGradesData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadWeeklyGradesData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await WeeklyGradesXpService.getTotalWeeklyGradesXp(user.id);
      setWeeklyGradesData(data);
    } catch (error) {
      console.error('Error loading weekly grades data:', error);
    } finally {
      setLoading(false);
    }
  };

  const xpExamples = WeeklyGradesXpService.getXpScalingExamples();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${className}`}
          onClick={loadWeeklyGradesData}
        >
          <Calculator className="w-4 h-4 text-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            How Your Leaderboard Score is Calculated
          </DialogTitle>
          <DialogDescription>
            Your total XP is calculated from multiple sources. Here's the breakdown:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Weekly Grades XP Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  Weekly Grades XP
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Earn XP based on your weekly average grades across all classes
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Week Data */}
              <div className="space-y-3">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">This Week</h4>
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-blue-200 dark:bg-blue-700 rounded animate-pulse"></div>
                    <div className="h-4 bg-blue-200 dark:bg-blue-700 rounded animate-pulse w-3/4"></div>
                  </div>
                ) : weeklyGradesData ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700 dark:text-blue-300">Average Grade:</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                        {weeklyGradesData.currentWeekAverage.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700 dark:text-blue-300">XP Earned:</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                        +{weeklyGradesData.currentWeekXp} XP
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700 dark:text-blue-300">Total Weekly XP:</span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
                        {weeklyGradesData.totalWeeklyXp} XP
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Connect Canvas to see your weekly grades XP
                  </p>
                )}
              </div>

              {/* XP Scaling Examples */}
              <div className="space-y-3">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">XP Scaling Examples</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {xpExamples.slice(0, 8).map((example, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span className="text-blue-700 dark:text-blue-300">{example.grade}%</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">{example.xp} XP</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                  Higher grades earn proportionally more XP due to exponential scaling
                </p>
              </div>
            </div>
          </div>

          {/* Other XP Sources */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Other XP Sources
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Achievements */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-900 dark:text-green-100">Achievements</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Complete achievements to earn XP. Progress is tracked and XP is awarded based on completion percentage.
                </p>
              </div>

              {/* Daily Streaks */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="font-medium text-orange-900 dark:text-orange-100">Daily Streaks</span>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Login daily to maintain streaks. Earn 5-50 XP per day with multipliers up to 4x.
                </p>
              </div>

              {/* Weekly Streaks */}
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium text-purple-900 dark:text-purple-100">Weekly Streaks</span>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Complete weekly goals to earn 100-500 XP per week with multipliers up to 3x.
                </p>
              </div>

              {/* Milestones */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-medium text-indigo-900 dark:text-indigo-100">Milestones</span>
                </div>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  Complete personal and assignment milestones to earn additional XP rewards.
                </p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              How Weekly Grades XP Works
            </h4>
            <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
              <li>• Each week, we calculate your average grade across all classes</li>
              <li>• This average is converted to XP using exponential scaling (max 300 XP)</li>
              <li>• Higher grades earn proportionally more XP than lower grades</li>
              <li>• XP updates automatically as your grades change over time</li>
              <li>• Students who perform better in classes will have higher XP over time</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScoreCalculationIcon;
