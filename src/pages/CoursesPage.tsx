import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { JourneyMap } from '@/components/journey/JourneyMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { canvasApi } from '@/services/canvasApi';
import { useAuth } from '@/contexts/AuthContext';
import { userDataService } from '@/services/userDataService';
import { toast } from 'sonner';
import { JourneyCourse } from '@/components/journey/JourneyMap';
import { userStorage } from '@/utils/userStorage';

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<JourneyCourse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [user]);
  
  useEffect(() => {
    // Track achievements when visiting courses page
    if (user) {
      const trackAchievements = async () => {
        try {
          console.log('Tracking course page achievements');
          
          // Track unique pages visited
          const visitedPages = JSON.parse(userStorage.get(user.id, 'visitedPages') || '[]');
          if (!visitedPages.includes('courses')) {
            visitedPages.push('courses');
            userStorage.set(user.id, 'visitedPages', JSON.stringify(visitedPages));
          }
          
          // Only track page view with the current standardized format
          await userDataService.checkAndUpdateAchievements(user.id, {
            currentPage: 'courses'
          });
        } catch (error) {
          console.error('Error tracking achievements:', error);
        }
      };
      
      trackAchievements();
    }
  }, [user, courses]);
  
  const loadCourses = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Check for Canvas credentials
      const credentials = await userDataService.getCanvasCredentials(user.id);
      
      if (credentials) {
        // Initialize Canvas API with user credentials
        canvasApi.setCredentials(credentials.domain, credentials.token);
        
        // Attempt to load courses from database first
        const storedCourses = await userDataService.getCoursesAsync(user.id);
        
        if (storedCourses && storedCourses.length > 0) {
          setCourses(storedCourses);
          
          // Track course-related metrics for achievements
          const courseMetrics = {
            currentPage: 'courses',
            courseViews: storedCourses.length,
            activeCourses: storedCourses.length,
            coursesWithProgressAbove: {
              25: storedCourses.filter(c => c.progress >= 25).length,
              50: storedCourses.filter(c => c.progress >= 50).length,
              75: storedCourses.filter(c => c.progress >= 75).length
            },
            completedCourses: storedCourses.filter(c => c.progress === 100).length,
            // Track assignment metrics
            assignmentViews: storedCourses.reduce((count, course) => 
              count + course.milestones.length, 0
            ),
            assignmentsCompleted: storedCourses.reduce((count, course) => 
              count + course.milestones.filter(m => m.status === 'completed').length, 0
            )
          };
          
          // Update localStorage for course tracking
          userStorage.set(user.id, 'courseViews', storedCourses.length.toString());
          userStorage.set(user.id, 'assignmentViews', courseMetrics.assignmentViews.toString());
          
          await userDataService.checkAndUpdateAchievements(user.id, courseMetrics);
        } else {
          // If no stored courses, sync data
          syncCanvasData();
        }
      }
    } catch (error) {
      console.error('Error loading courses', error);
      toast.error('Failed to load your courses');
    } finally {
      setIsLoading(false);
    }
  };
  
  const syncCanvasData = async () => {
    if (!user || !canvasApi.hasCredentials()) return;
    
    try {
      setIsLoading(true);
      toast.info('Syncing Canvas data...');
      
      // Fetch Canvas data
      const canvasData = await canvasApi.fetchAndTransformAllData();
      
      if (canvasData.length > 0) {
        // Save to database
        await userDataService.saveCourses(user.id, canvasData);
        setCourses(canvasData);
        
        // Update localStorage for tracking
        userStorage.set(user.id, 'courseViews', canvasData.length.toString());
        
        // Track as a page view for achievements (using the standard format)
        await userDataService.checkAndUpdateAchievements(user.id, {
          currentPage: 'course-edit'
        });
        
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
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Your Courses</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your courses and related content
          </p>
        </div>
        
        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center gap-2 py-3">
            <BookOpen className="w-5 h-5 text-journey-primary" />
            <CardTitle className="text-xl">All Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <JourneyMap courses={courses} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default CoursesPage;
