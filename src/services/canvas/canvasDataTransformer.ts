import { JourneyCourse, JourneyMilestone } from '@/components/journey/JourneyMap';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { canvasClient } from './canvasClient';
import { canvasSync } from './canvasSync';
import { getMilestones } from '@/lib/milestones';

/**
 * Handle data transformation from Canvas to our app's format
 */
export class CanvasDataTransformer {
  /**
   * Fetch and transform all Canvas data - uses cached data from Supabase
   */
  async fetchAndTransformAllData(forceRefresh: boolean = false): Promise<JourneyCourse[]> {
    if (!canvasClient.hasCredentials()) {
      throw new Error('Canvas API credentials not set');
    }

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // // If we're forcing a refresh, sync with Canvas first
      // if (forceRefresh) {
      //   try {
      //     await canvasSync.syncWithCanvas(user.id);
      //   } catch (error) {
      //     console.error('Failed to sync with Canvas during forced refresh:', error);
      //     toast.error('Failed to sync with Canvas, trying to use cached data');
      //     // Continue to fetch cached data even if sync fails
      //   }
      // }
      
      // Fetch courses from Supabase with enhanced error handling
      console.log(`Fetching courses for user: ${user.id}`);
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, code, term, progress, grade, start_date, end_date, description, canvas_id')
        .eq('user_id', user.id)
        .order('title', { ascending: true });
      
      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        throw new Error(`Error fetching courses: ${coursesError.message}`);
      }
      
      console.log(`Found ${courses?.length || 0} courses in database`);
      
      if (!courses || courses.length === 0) {
        // If no courses in database and not already tried refreshing, try syncing with Canvas
        if (!forceRefresh) {
          console.log('No courses found, attempting to sync with Canvas...');
          return await this.fetchAndTransformAllData(true);
        }
        console.warn('No current courses found in Canvas API response after forced refresh');
        return [];
      }
      
      // Transform the database courses to JourneyCourse objects
      const journeyCourses: JourneyCourse[] = [];
      
      for (const course of courses) {
        try {
          // Fetch milestones for this course with enhanced error handling
          console.log(`Fetching milestones for course ${course.id} (${course.title})`);
          
          const milestones = await getMilestones(course.id);
          
          // Log the number of milestones fetched
          console.log(`Fetched ${milestones?.length || 0} milestones for course ${course.id} (${course.title})`);
          
          if (!milestones || milestones.length === 0) {
            console.warn(`No milestones found for course ${course.id} (${course.title}), this might indicate a sync issue`);
          }
          
          // Transform to JourneyMilestone format
          const journeyMilestones: JourneyMilestone[] = (milestones || []).map(milestone => {
            // Create base milestone object with type safety
            const journeyMilestone: JourneyMilestone = {
              id: milestone.id,
              title: milestone.title || 'Unnamed Assignment',
              description: milestone.description || '',
              status: (milestone.status as "completed" | "in-progress" | "at-risk" | "upcoming") || 'upcoming',
              dueDate: milestone.due_date ? new Date(milestone.due_date) : undefined,
              completedDate: milestone.completed_date ? new Date(milestone.completed_date) : undefined,
              progress: milestone.progress || 0,
              grade: milestone.grade,
              points_possible: milestone.points_possible,
              type: (milestone.type as "assignment" | "exam" | "project" | "reading" | "other") || 'assignment',
              canvas_id: milestone.canvas_id,
              courseId: course.id // Set the courseId from the parent course
            };
            
            // Handle URL property - safely check if it exists first
            if (milestone && milestone.url) {
              journeyMilestone.url = milestone.url;
            }
            
            return journeyMilestone;
          });
          
          // Create JourneyCourse object
          const journeyCourse: JourneyCourse = {
            id: course.id,
            title: course.title || 'Unnamed Course',
            code: course.code || 'N/A',
            term: course.term || 'Current Term',
            progress: course.progress || 0,
            grade: course.grade,
            milestones: journeyMilestones,
            startDate: course.start_date ? new Date(course.start_date) : undefined,
            endDate: course.end_date ? new Date(course.end_date) : undefined,
            description: course.description || '',
            canvas_id: course.canvas_id
          };
          
          journeyCourses.push(journeyCourse);
        } catch (error) {
          console.error(`Error processing course ${course.id}:`, error);
        }
      }
      
      if (journeyCourses.length === 0 && courses.length > 0) {
        console.warn('Failed to transform courses to journey format');
      }
      
      // Log the final count of courses and milestones
      const totalMilestones = journeyCourses.reduce((total, course) => total + course.milestones.length, 0);
      console.log(`Transformed ${journeyCourses.length} courses with ${totalMilestones} total milestones`);
      
      // If we have courses but very few milestones and this wasn't a forced refresh, try a forced refresh
      if (totalMilestones < 10 && !forceRefresh && journeyCourses.length > 0) {
        console.warn('Found very few milestones, attempting forced refresh to fetch missing assignments...');
        return await this.fetchAndTransformAllData(true);
      }
      
      return journeyCourses;
    } catch (error) {
      console.error('Error fetching Canvas data:', error);
      throw error;
    }
  }

  /**
   * Get user profile from Canvas
   */
  async getUserProfile() {
    try {
      const response = await canvasClient.callCanvasAPI('/api/v1/users/self/profile');
      
      // Ensure we have default values to prevent 'undefined' errors
      if (!response) {
        return {
          name: 'Canvas User',
          short_name: 'User',
          id: 'unknown'
        };
      }
      
      // Add defaults for name fields if missing
      if (!response.name) response.name = 'Canvas User';
      if (!response.short_name) response.short_name = response.name || 'User';
      
      return response;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Get detailed course information
   */
  async getCourseDetails(courseId: string) {
    try {
      return await canvasClient.callCanvasAPI(`/api/v1/courses/${courseId}?include[]=syllabus_body&include[]=term&include[]=total_scores`);
    } catch (error) {
      console.error(`Error fetching course details for ${courseId}:`, error);
      throw error;
    }
  }

  /**
   * Get assignment details
   */
  async getAssignmentDetails(courseId: string, assignmentId: string) {
    try {
      return await canvasClient.callCanvasAPI(`/api/v1/courses/${courseId}/assignments/${assignmentId}?include[]=submission`);
    } catch (error) {
      console.error(`Error fetching assignment details for ${assignmentId}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const canvasDataTransformer = new CanvasDataTransformer();
