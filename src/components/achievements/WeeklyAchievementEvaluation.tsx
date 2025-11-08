import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWeeklyAchievementEvaluation } from '@/hooks/useWeeklyAchievementEvaluation';
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
  Circle,
  Search,
  Filter,
  Star,
  Award,
  Zap
} from 'lucide-react';

interface WeeklyAchievementEvaluationProps {
  className?: string;
  weekStart?: Date;
  weekEnd?: Date;
}

export function WeeklyAchievementEvaluation({ 
  className, 
  weekStart, 
  weekEnd 
}: WeeklyAchievementEvaluationProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const {
    allAchievements,
    unlockedAchievements,
    progressAchievements,
    nearCompletionAchievements,
    stats,
    loading,
    error,
    refreshEvaluation,
    getAchievementsByCategory,
    getAchievementsByDifficulty,
    getAchievementsByCriteria
  } = useWeeklyAchievementEvaluation(user?.id || '', weekStart, weekEnd);

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            Please log in to view achievement evaluation
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
            <span>Evaluating weekly achievements...</span>
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
            <p className="text-destructive mb-4">Error evaluating achievements</p>
            <Button onClick={refreshEvaluation} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter achievements based on search and filters
  const getFilteredAchievements = () => {
    let filtered = allAchievements;

    // Apply status filter
    if (selectedStatus === 'unlocked') {
      filtered = unlockedAchievements;
    } else if (selectedStatus === 'progress') {
      filtered = progressAchievements;
    } else if (selectedStatus === 'near-completion') {
      filtered = nearCompletionAchievements;
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.achievement.category === selectedCategory);
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(a => a.achievement.difficulty === selectedDifficulty);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.achievement.title.toLowerCase().includes(term) ||
        a.achievement.description.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const filteredAchievements = getFilteredAchievements();

  return (
    <div className={className}>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">All Achievements</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <OverviewTab 
            stats={stats}
            unlockedAchievements={unlockedAchievements}
            progressAchievements={progressAchievements}
            nearCompletionAchievements={nearCompletionAchievements}
            refreshEvaluation={refreshEvaluation}
            loading={loading}
          />
        </TabsContent>
        
        <TabsContent value="achievements" className="mt-4">
          <AchievementsTab 
            achievements={filteredAchievements}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedDifficulty={selectedDifficulty}
            setSelectedDifficulty={setSelectedDifficulty}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
          />
        </TabsContent>
        
        <TabsContent value="progress" className="mt-4">
          <ProgressTab 
            progressAchievements={progressAchievements}
            nearCompletionAchievements={nearCompletionAchievements}
          />
        </TabsContent>
        
        <TabsContent value="statistics" className="mt-4">
          <StatisticsTab stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface OverviewTabProps {
  stats: any;
  unlockedAchievements: any[];
  progressAchievements: any[];
  nearCompletionAchievements: any[];
  refreshEvaluation: () => Promise<void>;
  loading: boolean;
}

function OverviewTab({ 
  stats, 
  unlockedAchievements, 
  progressAchievements, 
  nearCompletionAchievements,
  refreshEvaluation,
  loading 
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{stats?.totalAchievements || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Unlocked</p>
                <p className="text-2xl font-bold">{stats?.unlockedAchievements || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">In Progress</p>
                <p className="text-2xl font-bold">{stats?.progressAchievements || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Near Completion</p>
                <p className="text-2xl font-bold">{nearCompletionAchievements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Unlocks */}
      {unlockedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Recent Unlocks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unlockedAchievements.slice(0, 5).map((achievement, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl">{achievement.achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{achievement.achievement.title}</h4>
                    <p className="text-xs text-muted-foreground">{achievement.achievement.description}</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    +{achievement.achievement.points} XP
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Near Completion */}
      {nearCompletionAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Almost There!</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nearCompletionAchievements.slice(0, 3).map((achievement, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{achievement.achievement.title}</span>
                    <span className="text-xs text-muted-foreground">{Math.round(achievement.progress)}%</span>
                  </div>
                  <Progress value={achievement.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button 
          onClick={refreshEvaluation} 
          variant="outline" 
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Evaluation
        </Button>
      </div>
    </div>
  );
}

interface AchievementsTabProps {
  achievements: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedDifficulty: string;
  setSelectedDifficulty: (difficulty: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
}

function AchievementsTab({
  achievements,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedDifficulty,
  setSelectedDifficulty,
  selectedStatus,
  setSelectedStatus
}: AchievementsTabProps) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search achievements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="timing">Timing</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="variety">Variety</SelectItem>
                <SelectItem value="improvement">Improvement</SelectItem>
                <SelectItem value="streak">Streak</SelectItem>
                <SelectItem value="threshold">Threshold</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unlocked">Unlocked</SelectItem>
                <SelectItem value="progress">In Progress</SelectItem>
                <SelectItem value="near-completion">Near Completion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Achievements List */}
      <div className="space-y-3">
        {achievements.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No achievements found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          achievements.map((achievement, index) => (
            <AchievementEvaluationCard key={index} achievement={achievement} />
          ))
        )}
      </div>
    </div>
  );
}

interface ProgressTabProps {
  progressAchievements: any[];
  nearCompletionAchievements: any[];
}

function ProgressTab({ progressAchievements, nearCompletionAchievements }: ProgressTabProps) {
  return (
    <div className="space-y-4">
      {/* Near Completion */}
      {nearCompletionAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Almost There! ({nearCompletionAchievements.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nearCompletionAchievements.map((achievement, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{achievement.achievement.icon}</span>
                      <div>
                        <h4 className="font-medium text-sm">{achievement.achievement.title}</h4>
                        <p className="text-xs text-muted-foreground">{achievement.achievement.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                      {Math.round(achievement.progress)}%
                    </Badge>
                  </div>
                  <Progress value={achievement.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* In Progress */}
      {progressAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>In Progress ({progressAchievements.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progressAchievements.map((achievement, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{achievement.achievement.icon}</span>
                      <div>
                        <h4 className="font-medium text-sm">{achievement.achievement.title}</h4>
                        <p className="text-xs text-muted-foreground">{achievement.achievement.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      {Math.round(achievement.progress)}%
                    </Badge>
                  </div>
                  <Progress value={achievement.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface StatisticsTabProps {
  stats: any;
}

function StatisticsTab({ stats }: StatisticsTabProps) {
  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No statistics available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Category Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.categoryBreakdown).map(([category, data]: [string, any]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{category}</span>
                  <span className="text-xs text-muted-foreground">
                    {data.unlocked}/{data.total} unlocked
                  </span>
                </div>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Unlocked</div>
                    <Progress value={(data.unlocked / data.total) * 100} className="h-2" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">In Progress</div>
                    <Progress value={(data.progress / data.total) * 100} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5" />
            <span>Difficulty Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.difficultyBreakdown).map(([difficulty, data]: [string, any]) => (
              <div key={difficulty} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{difficulty}</span>
                  <span className="text-xs text-muted-foreground">
                    {data.unlocked}/{data.total} unlocked
                  </span>
                </div>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Unlocked</div>
                    <Progress value={(data.unlocked / data.total) * 100} className="h-2" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">In Progress</div>
                    <Progress value={(data.progress / data.total) * 100} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface AchievementEvaluationCardProps {
  achievement: any;
}

function AchievementEvaluationCard({ achievement }: AchievementEvaluationCardProps) {
  const { achievement: data, unlocked, progress } = achievement;
  
  const getStatusColor = () => {
    if (unlocked) return 'bg-green-100 text-green-800';
    if (progress >= 75) return 'bg-orange-100 text-orange-800';
    if (progress > 0) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = () => {
    if (unlocked) return 'Unlocked';
    if (progress >= 75) return 'Almost There';
    if (progress > 0) return 'In Progress';
    return 'Not Started';
  };

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
                <Badge variant="secondary" className={getStatusColor()}>
                  {getStatusText()}
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
