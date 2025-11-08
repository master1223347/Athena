import React, { useState, useEffect, useRef, useCallback } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Calendar, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { canvasApi } from '@/services/canvasApi';
import { userDataService } from '@/services/userDataService';
import { useAuth } from '@/contexts/AuthContext';
import { JourneyCourse } from '@/components/journey/JourneyMap';
import { toast } from 'sonner';
import JourneyCalendarWrapper from '@/components/journey/JourneyCalendarWrapper';
import { format, addMonths, subMonths } from 'date-fns';
import { userStorage } from '@/utils/userStorage';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { personalMilestoneService } from '@/services/personalMilestoneService';

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<JourneyCourse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDataAvailable, setIsDataAvailable] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Use a ref for the interval
  const autoSyncInterval = useRef<number | null>(null);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

    // CalendarPage.tsx
  useEffect(() => {
    // Pause global auto‑sync when we mount
    canvasApi.clearAutoSync();

    return () => {
      canvasApi.setupAutoSync();
    };
  }, [user]);

  
  
  const loadUserData = async () => {
    if (!user) return;
    console.log('[CalendarPage] loadUserData called');
    try {
      setIsLoading(true);
      setIsDataAvailable(true);
      
      // Check for Canvas credentials
      const credentials = await userDataService.getCanvasCredentials(user.id);
      
      if (credentials) {
        // Initialize Canvas API with user credentials
        canvasApi.setCredentials(credentials.domain, credentials.token);
        
        // Attempt to load courses from database first
        const storedCourses = await userDataService.getCoursesAsync(user.id);
        
        if (storedCourses && storedCourses.length > 0) {
          setCourses(storedCourses);
        } else {
          console.log('no courses found, skipping refreshFromCanvas');
        }
      }
    } catch (error) {
      console.error('Error loading user data', error);
      toast.error('Failed to load your data');
    } finally {
      setIsLoading(false);
    }
  };
  const isSyncingRef = useRef(false);

const refreshFromCanvas = async () => {
  if (isSyncingRef.current) {
    console.log('[CalendarPage] Already syncing, skipping...');
    return;
  }
  isSyncingRef.current = true;
  setIsSyncing(true);
  setIsLoading(true);

  try {
    console.log('[CalendarPage] refreshFromCanvas called');
    console.time('calendarPageUpdate');

    await canvasApi.syncWithCanvas(user.id, { syncType: 'calendarOnly' });
    const canvasData = await canvasApi.fetchAndTransformAllData(true);

    if (canvasData.length > 0) {
      // Omit milestones before saving courses to Supabase
// Suppose canvasData is an array of course objects, each with milestones.
      // When preparing to save courses, always merge in the current DB grade if you don't have a new one
      const currentCourses = await supabase
      .from('courses')
      .select('id, grade')
      .eq('user_id', user.id);
    
    const coursesToSave = canvasData.map(course => {
      const dbCourse = currentCourses?.data?.find(c => c.id === course.id);
      // Only overwrite the grade if course.grade is NOT null/undefined
      return {
        ...course,
        grade: course.grade !== undefined && course.grade !== null
          ? course.grade
          : dbCourse?.grade ?? null
      };
    });
    await userDataService.saveCourses(user.id, coursesToSave);
    

      setCourses(canvasData as JourneyCourse[]);
      setIsDataAvailable(true);
    } else {
      setIsDataAvailable(false);
      console.warn('No current courses found in Canvas API response');
    }
  } catch (error) {
    console.error('Failed to fetch and transform Canvas data:', error);
    if (user && canvasApi.hasCredentials()) {
      toast.error('Failed to sync Canvas data');
    }
  } finally {
    setIsLoading(false);
    setIsSyncing(false);
    isSyncingRef.current = false;
    console.timeEnd('calendarPageUpdate');
  }
};

  
  
  // Handle milestone updates - wrapped in useCallback to maintain stable reference
  const handleMilestoneUpdate = useCallback(async (courseId: string, milestoneId: string, updates: Partial<JourneyCourse['milestones'][0]>) => {
    if (!user) return;
    
    try {
      
      // Update the courses state
      const updatedCourses = courses.map(course => {
        if (course.id === courseId) {
          const updatedMilestones = course.milestones.map(milestone => 
            milestone.id === milestoneId 
              ? { ...milestone, ...updates }
              : milestone
          );
          
          // Recalculate course progress based on completed milestones
          const completedCount = updatedMilestones.filter(m => m.status === 'completed').length;
          const progress = updatedMilestones.length > 0 
            ? Math.round((completedCount / updatedMilestones.length) * 100) 
            : 0;
          
          return {
            ...course,
            milestones: updatedMilestones,
            progress
          };
        }
        return course;
      });
      
      setCourses(updatedCourses);
      
      // Find the updated course
      const courseToUpdate = updatedCourses.find(c => c.id === courseId);
      if (courseToUpdate) {
        // Save to database
        await userDataService.updateCourse(user.id, courseToUpdate);
        
        // Invalidate Redis cache for this course so fresh data is loaded
        try {
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
          // let the patched service decide whether this change is new
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
      console.error('[CalendarPage] Error updating milestone:', error);
      toast.error('Failed to update assignment status');
    }
  }, [user, courses]);
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Academic Calendar</h1>
              <p className="text-muted-foreground mt-1">
                View and manage your upcoming assignments and deadlines
              </p>
            </div>
          </div>
          
          <Button 
            onClick={refreshFromCanvas} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading canvas data...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Update Data
              </>
            )}
          </Button>
        </div>
        
        {/* Month Navigation Controls
        <div className="flex items-center justify-between bg-muted/20 rounded-lg p-3">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous Month
          </Button>
          
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-journey-primary" />
            <h2 className="text-xl font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              Next Month
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div> */}
        
        {/* Updated Card with consistent padding and 1:1 aspect ratio for calendar */}
        <Card className="border-none shadow-md">
          <CardContent className="p-6">
            {!isDataAvailable && courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No course data available</h3>
                <p className="text-muted-foreground max-w-md mb-4">
                  Check your Canvas connection or wait for your instructor to publish course content.
                </p>
              </div>
            ) : (
              <div className="mx-auto max-w-4xl">
                <JourneyCalendarWrapper 
                  courses={courses} 
                  onMilestoneUpdate={handleMilestoneUpdate}
                  currentMonth={currentMonth}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default CalendarPage;
