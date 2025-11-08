import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Trophy, Calendar, LayoutDashboard, 
  TrendingUp, CheckCircle, Loader2, 
  RefreshCw, Award, Star, Zap, Heart, Expand
} from 'lucide-react';
import { canvasApi } from '@/services/canvasApi';
import { userDataService } from '@/services/userDataService';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { JourneyCourse } from '@/components/journey/JourneyMap';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';
import DailyProgress from '@/components/journey/DailyProgress';
import { Achievement } from '@/types/achievement';
import { JourneyProgress } from '@/components/journey/JourneyProgress';
import JourneyCalendarWrapper from '@/components/journey/JourneyCalendarWrapper';
import StreakDisplay from '@/components/streaks/StreakDisplay';

// Define LEVEL_TITLES for user levels
export const LEVEL_TITLES = [
  'Noob',
  'Rookie',
  'Homework Peasant',
  'Grade Grinder',
  'Quiz Crusher',
  'Brainiac',
  'GPA Gladiator',
  'Academic Weapon',
  'Prodigy',
  'Academic GOD'
];

// Map achievement icons to Lucide components
const achievementIcons: Record<string, React.ReactNode> = {
  'trophy': <Trophy className="w-4 h-4" />,
  'award': <Award className="w-4 h-4" />,
  'check-circle': <CheckCircle className="w-4 h-4" />,
  'star': <Star className="w-4 h-4" />,
  'calendar': <Calendar className="w-4 h-4" />,
  'heart': <Heart className="w-4 h-4" />,
  'zap': <Zap className="w-4 h-4" />,
  'log-in': <LayoutDashboard className="w-4 h-4" />,
  'layout-dashboard': <LayoutDashboard className="w-4 h-4" />,
  'trending-up': <TrendingUp className="w-4 h-4" />
};

const getIconComponent = (iconName: string) => {
  return achievementIcons[iconName] || <Trophy className="w-4 h-4" />;
};

const Index: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<JourneyCourse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      loadUserData();
      
      // Track login for achievement tracking
      userDataService.trackLogin(user.id);
      
      // Track dashboard page view
      userDataService.trackPageView(user.id, 'dashboard');

      // Set up event listener for page visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [user]);
  
  const handleVisibilityChange = () => {
    // Sync when the page becomes visible again (user returns to the tab)
    if (document.visibilityState === 'visible') {
      syncCanvasData();
    }
  };
  
  const loadUserData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Check for Canvas credentials
      const credentials = await userDataService.getCanvasCredentials(user.id);
      setShowConnectPrompt(!credentials);
      if (credentials) {
        // Initialize Canvas API with user credentials
        canvasApi.setCredentials(credentials.domain, credentials.token);

        // Get last sync time
        const syncInfo = await userDataService.getLastSync(user.id);
        if (syncInfo && syncInfo.lastSync) {
          // Store lastSync as string
          setLastSync(syncInfo.lastSync);
        }

        // Attempt to load courses from database first
        const storedCourses = await userDataService.getCoursesAsync(user.id);
        if (storedCourses && storedCourses.length > 0) {
          setCourses(storedCourses);
          calculateProgressMetrics(storedCourses);
        } else {
          // If no stored courses, sync data
          await syncCanvasData();
        }
      }

      // Load achievements
      const userAchievements = await userDataService.getAchievements(user.id);
      setAchievements(userAchievements);

    } catch (error) {
      console.error('Error loading user data', error);
      toast.error('Failed to load your data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const syncCanvasData = async () => {
    if (!user || !canvasApi.hasCredentials()) return;
    try {
      setIsLoading(true);
      toast.info('Syncing with Canvas...');

      // Fetch Canvas data
      const canvasData = await canvasApi.fetchAndTransformAllData();
      if (canvasData.length > 0) {
        // Save to database
        await userDataService.saveCourses(user.id, canvasData);

        // Update state with proper type casting to ensure it matches JourneyCourse[] type
        setCourses(canvasData as JourneyCourse[]);

        // Calculate progress metrics with type casting
        calculateProgressMetrics(canvasData as JourneyCourse[]);
        
        // Update last sync time
        await userDataService.updateLastSync(user.id);
        const syncInfo = await userDataService.getLastSync(user.id);
        if (syncInfo && syncInfo.lastSync) {
          setLastSync(syncInfo.lastSync);
        }
        
        toast.success('Canvas data synced successfully');
      } else {
        toast.info('No current courses found in Canvas');
      }
    } catch (error) {
      console.error('Failed to sync Canvas data', error);
      if (user && canvasApi.hasCredentials()) {
        toast.error('Failed to sync Canvas data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate weekly metrics
  const calculateProgressMetrics = (coursesData: JourneyCourse[]) => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Start week on Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // End week on Sunday

    // Calculate week-specific data (now includes all assignments for the current week)
    const weekMilestones = coursesData.flatMap(c => c.milestones).filter(m => m.dueDate && m.dueDate >= weekStart && m.dueDate <= weekEnd);
    const weeklyCompletedMilestones = weekMilestones.filter(m => m.status === 'completed').length;

    // Calculate total milestone counts
    const totalMilestones = coursesData.flatMap(c => c.milestones).length;
    const completedMilestones = coursesData.flatMap(c => c.milestones).filter(m => m.status === 'completed').length;

    // Set progress values
    setTotalProgress(totalMilestones > 0 ? Math.round(completedMilestones / totalMilestones * 100) : 0);
    setWeeklyProgress(weekMilestones.length > 0 ? Math.round(weeklyCompletedMilestones / weekMilestones.length * 100) : 0);
  };

  // Get upcoming assignments (next 6 days, excluding today)
  const upcomingAssignments = courses.flatMap(course => course.milestones.filter(m => {
    const now = new Date();
    const tomorrow = addDays(now, 1);
    const sixDaysLater = addDays(now, 6);
    return m.dueDate && m.dueDate >= tomorrow && m.dueDate <= sixDaysLater && m.status !== 'completed';
  }).map(m => ({
    ...m,
    courseName: course.title,
    courseCode: course.code,
    courseId: course.id
  }))).sort((a, b) => {
    if (!a.dueDate || !b.dueDate) return 0;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  // Handle milestone updates
  const handleMilestoneUpdate = async (courseId: string, milestoneId: string, updates: any) => {
    if (!user) return;
    
    try {
      // Update the courses state
      const updatedCourses = courses.map(course => {
        if (course.id === courseId) {
          const updatedMilestones = course.milestones.map(milestone => milestone.id === milestoneId ? {
            ...milestone,
            ...updates
          } : milestone);

          // Recalculate course progress based on completed milestones
          const completedCount = updatedMilestones.filter(m => m.status === 'completed').length;
          const progress = updatedMilestones.length > 0 ? Math.round(completedCount / updatedMilestones.length * 100) : 0;
          return {
            ...course,
            milestones: updatedMilestones,
            progress
          };
        }
        return course;
      });
      setCourses(updatedCourses);

      // Recalculate progress metrics
      calculateProgressMetrics(updatedCourses);

      // Find the updated course
      const courseToUpdate = updatedCourses.find(c => c.id === courseId);
      if (courseToUpdate) {
        // Save to database
        await userDataService.updateCourse(user.id, courseToUpdate);
        
        // Invalidate Redis cache for this course so fresh data is loaded
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          await supabase.functions.invoke('redis', {
            body: {
              courseId: courseId,
              invalidate: true
            }
          });
        } catch (cacheError) {
          console.error('Failed to invalidate cache:', cacheError);
          // Non-critical error, continue anyway
        }
        
        // Track assignment completion for achievements
        if (updates.status === 'completed' || updates.status === 'upcoming') {
          await userDataService.updateAssignmentCompletion(
            milestoneId,
            updates.status === 'completed'
          );
       
          if (updates.status === 'completed') {
            toast.success('Assignment marked as complete!', {
              description: 'Your progress has been updated.',
            });
          }
        }
      }

    } catch (error) {
      console.error('Error updating milestone', error);
      toast.error('Failed to update assignment status');
    }
  };

  // Get achievements with progress
  const achievementsWithProgress = achievements.filter(a => a.progress > 0).sort((a, b) => b.progress - a.progress);

  // Get completed achievements (100% progress)
  const completedAchievements = achievements.filter(a => a.progress === 100).sort((a, b) => b.points - a.points);
  
  // Format last sync time properly with null check
  const formattedLastSync = lastSync ? new Date(lastSync).toLocaleString() : 'Never';
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome to Gambit - Your improved educational experience</p>
          </div>
          
          <StreakDisplay compact />
        </div>
        
        
        {showConnectPrompt ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center p-6">
                <LayoutDashboard className="w-12 h-12 mx-auto text-journey-primary opacity-50 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Connect Your Canvas Account</h2>
                <p className="text-muted-foreground mb-4">
                  Connect your Canvas account to sync your courses, assignments, and grades.
                </p>
                <Button onClick={() => navigate('/settings?tab=canvas')}>
                  Connect Canvas
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Top Row: Tomorrow's Due Assignments, This Week's Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Daily Assignments (Today & Tomorrow) */}
              <DailyProgress courses={courses} onMilestoneUpdate={handleMilestoneUpdate} />
              {/* This Week's Progress */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-journey-primary" />
                    This Week's Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-bold text-2xl">{weeklyProgress}%</div>
                  <Progress value={weeklyProgress} className="h-2" />
                  <div className="mt-3 space-y-2">
                    {(() => {
                      const now = new Date();
                      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
                      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
                      const weekMilestones = courses.flatMap(c => c.milestones).filter(m => m.dueDate && m.dueDate >= weekStart && m.dueDate <= weekEnd);
                      const completed = weekMilestones.filter(m => m.status === 'completed').length;
                      const remaining = weekMilestones.length - completed;
                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Completed:</span>
                            <span className="font-medium text-journey-success">{completed} assignments</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Remaining:</span>
                            <span className="font-medium text-journey-warning">{remaining} assignments</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total for week:</span>
                            <span className="font-medium">{weekMilestones.length} assignments</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on {courses.flatMap(c => c.milestones).filter(m => {
                      if (!m.dueDate) return false;
                      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
                      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
                      return m.dueDate >= weekStart && m.dueDate <= weekEnd;
                    }).length} assignments due this week
                  </p>
                </CardContent>
              </Card>
            </div>
            {/* Bottom Row: Progress (courses) and Calendar widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Progress Widget (replaces Upcoming Assignments) */}
              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-journey-primary" />
                      Progress (Courses)
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/progress')}
                      className="h-8 w-8 p-0"
                    >
                      <Expand className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <JourneyProgress courses={courses} showUpcoming={false} />
                </CardContent>
              </Card>
              {/* Calendar Widget (replaces Earned Achievements) */}
              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-journey-primary" />
                      Calendar
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/calendar')}
                      className="h-8 w-8 p-0"
                    >
                      <Expand className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <JourneyCalendarWrapper courses={courses} onMilestoneUpdate={handleMilestoneUpdate} compact={true} />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Index;
