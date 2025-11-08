import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { JourneyProgress } from '@/components/journey/JourneyProgress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, AlertCircle, Loader2, List, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { canvasApi } from '@/services/canvasApi';
import { userDataService } from '@/services/userDataService';
import { useAuth } from '@/contexts/AuthContext';
import { JourneyCourse, JourneyMilestone } from '@/components/journey/JourneyMap';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import useNodeClick from '@/hooks/useNodeClick';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AssignmentTracker from '@/components/journey/AssignmentTracker';
import { canvasDataTransformer } from '@/services/canvas/canvasDataTransformer';
import { canvasSync } from '@/services/canvas/canvasSync';
import { fetchCanvasGrades } from '@/services/fetchCanvasGrades';
import { fetchAssignmentGrades } from '@/services/fetchAssignmentGrades';
import { fetchAssignmentGradesFast } from '@/services/fetchAssignmentsGradesFast.ts';
import { supabase } from '@/integrations/supabase/client';
import { userStorage } from '@/utils/userStorage';
import { useNavigate } from 'react-router-dom';


const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<JourneyCourse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataAvailable, setIsDataAvailable] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { safeClick } = useNodeClick();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncAttempted, setSyncAttempted] = useState(false);
  const [hiddenCourses, setHiddenCourses] = useState<string[]>([]);


  const mergeGradesIntoCourses = (
    courses: JourneyCourse[],
    gradesFromCanvas: Array<{ id: number; grade: number | null; [key: string]: any }>
  ): JourneyCourse[] => {
    console.log('Merging grades into courses...');
    console.log('Courses to merge:', courses.map(c => ({ id: c.id, canvas_id: c.canvas_id, title: c.title })));
    console.log('Grades from Canvas:', gradesFromCanvas.map(g => ({ id: g.id, grade: g.grade })));
    
    return courses.map(course => {
      // coerce your course IDs into numbers for matching
      const canvasIdNum = Number(course.canvas_id);
      const courseIdNum = Number(course.id);
  
      const match = gradesFromCanvas.find(g =>
        g.id === canvasIdNum ||
        g.id === courseIdNum
      );
      
      const updatedCourse = {
        ...course,
        grade: match?.grade ?? course.grade ?? null, // Keep existing grade if no match
      };
      
      console.log(`Course ${course.title}: canvas_id=${course.canvas_id}, grade=${match?.grade}, final_grade=${updatedCourse.grade}`);
      
      return updatedCourse;
    });
  };
  
  
  
  
  useEffect(() => {
    if (user) {
      loadUserData();
      loadUserSettings();
    }
  }, [user]);
  
  const loadUserSettings = async () => {
    if (!user) return;
    
    try {
      // Load user settings
      const settings = await userDataService.getUserSettings(user.id);
      
      // Check if hidden_courses exists and is an array, otherwise initialize as empty array
      // Safely access the hidden_courses property
      const hiddenCoursesArray = settings && 
        'hidden_courses' in settings && 
        Array.isArray(settings.hidden_courses) 
          ? settings.hidden_courses 
          : [];
      
      setHiddenCourses(hiddenCoursesArray);
      console.log('Loaded hidden courses:', hiddenCoursesArray);
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };
  
  const loadUserData = async () => {
    if (!user) return;
  
    try {
      setIsLoading(true);
      setIsDataAvailable(true);
      setErrorMessage(null);
  
      // Check for Canvas credentials
      const credentials = await userDataService.getCanvasCredentials(user.id);
      if (!credentials) {
        setErrorMessage("Canvas not connected. Please connect Canvas in settings.");
        setIsDataAvailable(false);
        return;
      }
  
      if (credentials) {
        // Initialize Canvas API with user credentials
      canvasApi.setCredentials(credentials.domain, credentials.token);
        
        // Also initialize direct access to Canvas client for data transformer
      userStorage.set(user.id, 'canvas_credentials', JSON.stringify({
        domain: credentials.domain,
        token: credentials.token
      }));
  
        // Attempt to load courses from database first
        console.log('Fetching courses from database...');
        const storedCourses = await userDataService.getCoursesAsync(user.id);
        
        if (storedCourses && storedCourses.length > 0) {
          console.log(`Loaded ${storedCourses.length} courses from database`);
          
          // Ensure each course has a milestones array
          const safeStoredCourses = storedCourses.map(course => ({
            ...course,
            milestones: Array.isArray(course.milestones) ? course.milestones : []
          }));
  
          // Count total assignments
          const totalAssignments = safeStoredCourses.reduce((total, course) => 
            total + (course.milestones?.length || 0), 0);
          console.log(`Total assignments loaded: ${totalAssignments}`);
  
          const canvasBase = credentials.domain.startsWith("http")
            ? credentials.domain
            : `https://${credentials.domain}`;
            
            try {
              console.log('Fetching Canvas grades from:', canvasBase);
              console.log("Canvas token (last 4 chars):", credentials.token.slice(-4));
              
              const gradesFromCanvas = await fetchCanvasGrades(canvasBase, credentials.token, false); // Use proxy in development
              console.log("Raw grades from Canvas:", gradesFromCanvas);
              
              if (gradesFromCanvas && gradesFromCanvas.length > 0) {
                // Update database with grades
                console.log('Updating database with Canvas grades...');
                await Promise.all(
                  gradesFromCanvas.map(async (c) => {
                    const updateResult = await supabase
                      .from('courses')
                      .update({
                        grade: c.grade,
                        updated_at: new Date().toISOString(),
                      })
                      .eq('user_id', user.id)
                      .eq('canvas_id', String(c.id));
                      
                    console.log(`Updated course ${c.id} with grade ${c.grade}:`, updateResult);
                    return updateResult;
                  })
                );
                
                // Merge grades into courses
                console.log("Merging Canvas grades into stored courses...");
                const merged = mergeGradesIntoCourses(safeStoredCourses, gradesFromCanvas);
                console.log("Final merged courses:", merged.map(c => ({ title: c.title, grade: c.grade })));
                setCourses(merged);
                
                toast.success(`Updated grades for ${gradesFromCanvas.length} courses`);
              } else {
                console.warn('No grades returned from Canvas');
                setCourses(safeStoredCourses);
              }
            } catch (e) {
              console.error("Failed to fetch grades from Canvas:", e);
              toast.error('Failed to fetch current grades from Canvas');
              // fallback to the DB‑only courses
              setCourses(safeStoredCourses);
            }
          
          // If we have courses but very few or no assignments, trigger a refresh
      if (totalAssignments < 10 && !syncAttempted) {
            console.log('Few assignments found, triggering a Canvas refresh...');
            setSyncAttempted(true);
            await refreshFromCanvas();
          }
        } else {
          // If no stored courses, attempt to fetch from Canvas
        console.log('No courses found in database, fetching from Canvas...');
        setSyncAttempted(true);
        await refreshFromCanvas();
      }
      } else {
        setErrorMessage("Canvas not connected. Please connect Canvas in settings.");
      }
    } catch (error) {
      console.error('Error loading user data', error);
      toast.error('Failed to load your data');
      setErrorMessage("Error loading data. Please try again later.");
      setIsDataAvailable(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  
  const refreshFromCanvas = async () => {
    if (!user) {
      toast.error("You must be logged in to use this feature");
      return;
    }
    
    if (!canvasApi.hasCredentials()) {
      toast.error("Canvas not connected. Please connect Canvas in settings.");
      setErrorMessage("Canvas not connected. Please connect Canvas in settings.");
      return;
    }
    
    if (syncInProgress) {
      console.log('Canvas sync already in progress');
      return;
    }
    
    try {
      setIsLoading(true);
      setSyncInProgress(true);
      setErrorMessage(null);
      
      // First try to sync with Canvas
      const syncToast = toast.loading('Syncing with Canvas...');
      
      try {
        // Use the enhanced canvas sync method with comprehensive sync
        console.log('Starting comprehensive Canvas sync...');
        await canvasSync.syncWithCanvas(user.id, { syncType: 'progressOnly'});
        toast.success('Canvas sync completed', { id: syncToast });
      } catch (syncError) {
        console.error('Canvas sync error:', syncError);
        toast.error('Canvas sync failed, trying to use cached data', { id: syncToast });
      }
      
      // Fetch Canvas data using the enhanced data transformer
      console.log('Fetching transformed Canvas data...');
      const canvasData = await canvasDataTransformer.fetchAndTransformAllData(true);
      
      if (canvasData && canvasData.length > 0) {
        // Ensure each course has a milestones array
        const safeCanvasData = canvasData.map((course: any) => ({
          ...course,
          milestones: Array.isArray(course.milestones) ? course.milestones : []
        }));
        
        // Also fetch fresh grades from Canvas
        try {
          const credentials = await userDataService.getCanvasCredentials(user.id);
          if (credentials) {
            const canvasBase = credentials.domain.startsWith("http")
              ? credentials.domain
              : `https://${credentials.domain}`;
              
            console.log('Fetching fresh Canvas grades during refresh...');
            const gradesFromCanvas = await fetchCanvasGrades(canvasBase, credentials.token, false);
            
            if (gradesFromCanvas && gradesFromCanvas.length > 0) {
              // Merge grades into the fresh Canvas data
              const dataWithGrades = mergeGradesIntoCourses(safeCanvasData, gradesFromCanvas);
              
              // Update database with both course data and grades
              await Promise.all(
                dataWithGrades.map(async (course) => {
                  const { milestones, ...courseWithoutMilestones } = course;
                  return supabase
                    .from('courses')
                    .upsert(courseWithoutMilestones)
                    .eq('user_id', user.id);
                })
              );
              
              setCourses(dataWithGrades as JourneyCourse[]);
              console.log('Updated courses with fresh grades:', dataWithGrades.map(c => ({ title: c.title, grade: c.grade })));
            } else {
              setCourses(safeCanvasData as JourneyCourse[]);
            }
          } else {
            setCourses(safeCanvasData as JourneyCourse[]);
          }
        } catch (gradeError) {
          console.error('Failed to fetch grades during refresh:', gradeError);
          setCourses(safeCanvasData as JourneyCourse[]);
        }
        
        // Count total assignments
        const totalAssignments = safeCanvasData.reduce((total: number, course: any) => 
          total + (course.milestones?.length || 0), 0);
          
        console.log(`Loaded ${safeCanvasData.length} courses with ${totalAssignments} total assignments`);
        setIsDataAvailable(true);
        
        if (totalAssignments > 0) {
          toast.success(`Canvas data updated: ${totalAssignments} assignments loaded`);
        } else {
          toast.info('Canvas data updated, but no assignments were found');
          console.warn('No assignments found after sync. This could indicate a sync issue.');
        }
      } else {
        // Only show this if we really have no data after refresh
        setIsDataAvailable(false);
        setErrorMessage("No current courses found in Canvas. Make sure you have active courses in your Canvas account.");
        console.warn('No current courses found in Canvas API response');
      }
    } catch (error) {
      console.error('Failed to sync Canvas data', error);
      if (user && canvasApi.hasCredentials()) {
        toast.error('Failed to sync Canvas data');
      }      
      setErrorMessage("Failed to retrieve Canvas data. Please try again later.");
      setIsDataAvailable(false);
    } finally {
      setIsLoading(false);
      setSyncInProgress(false);
    }
  };
  
  // Toggle course visibility
  const toggleCourseVisibility = async (courseId: string) => {
    if (!user) return;
    
    try {
      let updatedHiddenCourses: string[];
      
      if (hiddenCourses.includes(courseId)) {
        // Remove from hidden courses
        updatedHiddenCourses = hiddenCourses.filter(id => id !== courseId);
      } else {
        // Add to hidden courses
        updatedHiddenCourses = [...hiddenCourses, courseId];
      }
      
      setHiddenCourses(updatedHiddenCourses);
      
      // Save to database
      await userDataService.updateUserSettings(user.id, { 
        hidden_courses: updatedHiddenCourses 
      });
      
      toast.success(
        hiddenCourses.includes(courseId) 
          ? 'Course is now visible' 
          : 'Course is now hidden'
      );
    } catch (error) {
      console.error('Error toggling course visibility:', error);
      toast.error('Failed to update course visibility');
    }
  };
  
  // Filter out hidden courses for display
  const visibleCourses = courses.filter(course => !hiddenCourses.includes(course.id));
  
  // Handle milestone updates
  const handleMilestoneUpdate = async (courseId: string, milestoneId: string, updates: Partial<JourneyMilestone>) => {
    if (!user) return;
    
    try {
      // Update the courses state
      const updatedCourses = courses.map(course => {
        if (course.id === courseId) {
          // Ensure milestones is an array
          const milestones = Array.isArray(course.milestones) ? course.milestones : [];
          
          const updatedMilestones = milestones.map(milestone => 
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
      }
    } catch (error) {
      console.error('Error updating milestone', error);
      toast.error('Failed to update assignment status');
    }
  };
  
  // Update the GPA calculation to use visibleCourses instead of all courses
  const calculateGPA = (courses: JourneyCourse[]): number | null => {
    const validGrades = courses
      .filter(course => 
        // Only include courses that are not hidden and have valid grades
        !hiddenCourses.includes(course.id) && 
        course.grade !== null && 
        course.grade !== undefined
      )
      .map(course => course.grade as number);
    
    if (validGrades.length === 0) return null;
    
    const gradePoints = validGrades.map(grade => {
      if (grade >= 93) return 4.0;
      if (grade >= 90) return 3.7;
      if (grade >= 87) return 3.3;
      if (grade >= 83) return 3.0;
      if (grade >= 80) return 2.7;
      if (grade >= 77) return 2.3;
      if (grade >= 73) return 2.0;
      return 0.0;
    });
    
    const sum = gradePoints.reduce((acc, points) => acc + points, 0);
    return Number((sum / validGrades.length).toFixed(2));
  };

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
              <h1 className="text-3xl font-bold">Academic Progress</h1>
              <p className="text-muted-foreground mt-1">
                Track your achievements and identify areas for improvement
              </p>
            </div>
          </div>
          
          <Button 
            onClick={refreshFromCanvas} 
            disabled={isLoading || syncInProgress}
            className="flex items-center gap-2"
          >
            {isLoading || syncInProgress ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading canvas grades...
              </>
            ) : 'Update Data'}
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="h-12 w-12 text-journey-primary animate-spin mb-4" />
            <h3 className="text-lg font-medium">Loading your academic progress...</h3>
          </div>
        ) : (!isDataAvailable && courses.length === 0) || errorMessage ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {!isDataAvailable ? 'No course data available' : 'Something went wrong'}
            </h3>
            <p className="text-muted-foreground max-w-md mb-4">
              {errorMessage || 'Check your Canvas connection or wait for your instructor to publish course content.'}
            </p>
            <Button onClick={refreshFromCanvas} variant="outline">
              Try Again
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Progress Dashboard
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Assignment Tracker
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              <Card className="border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-journey-primary" />
                    <CardTitle className="text-xl">Progress Dashboard</CardTitle>
                  </div>
                  
                  {/* Update GPA display to use visibleCourses */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Current GPA for Visible Courses:</span>
                    <span className="font-semibold text-lg">
                      {calculateGPA(visibleCourses)?.toFixed(2) ?? 'N/A'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <JourneyProgress 
                    courses={courses} 
                    hiddenCourses={hiddenCourses}
                    onToggleCourseVisibility={toggleCourseVisibility}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="assignments">
              <Card className="border-none shadow-md">
                <CardHeader className="flex flex-row items-center gap-2 py-3">
                  <List className="w-5 h-5 text-journey-primary" />
                  <CardTitle className="text-xl">Assignment Tracker</CardTitle>
                </CardHeader>
                <CardContent>
                  <AssignmentTracker 
                    courses={visibleCourses} 
                    onMilestoneUpdate={handleMilestoneUpdate}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
};

export default ProgressPage;
