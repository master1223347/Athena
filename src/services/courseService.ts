import { supabase } from '@/integrations/supabase/client';
import { milestoneService } from './milestoneService';
import { ensureMilestoneTitle } from './userDataUtils';

/**
 * Service for managing courses
 */
class CourseService {
  /**
   * Load all courses for a user, each with fully-mapped milestones
   * ( dueDate / completedDate etc. in camelCase )
   */
  async getCourses(userId: string) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(
          'id, title, code, term, progress, grade, start_date, end_date, description, canvas_id'
        )
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching courses:', error);
        return [];
      }

      // ──────────────────────────────────────────────────────────────────────────
      // 1. build a base array (no milestones yet)
      // ──────────────────────────────────────────────────────────────────────────
      const courses = (data ?? []).map((course: any) => ({
        ...course,
        milestones: [] as any[],
      }));

      if (!courses.length) return courses;

      // ──────────────────────────────────────────────────────────────────────────
      // 2. attach milestones, already mapped to Journey shape
      // ──────────────────────────────────────────────────────────────────────────
      const coursesWithMilestones = await Promise.all(
        courses.map(async (course) => {
          try {
            //  <--  key change: use milestoneService helper
            const milestones = await milestoneService.getAssignments(course.id);
            return { ...course, milestones };
          } catch (e) {
            console.error(
              `Error fetching milestones for course ${course.id}:`,
              e
            );
            return { ...course, milestones: [] };
          }
        })
      );

      return coursesWithMilestones;
    } catch (err) {
      console.error('Exception fetching courses:', err);
      return [];
    }
  }

  /** Backwards-compat wrapper */
  async getCoursesAsync(userId: string) {
    return this.getCourses(userId);
  }

  async addCourse(userId: string, courseData: any) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert([{ ...courseData, user_id: userId }])
        .select();

      if (error) {
        console.error('Error adding course:', error);
        return { error };
      }

      return { data: data[0] };
    } catch (err) {
      console.error('Exception adding course:', err);
      return { error: err };
    }
  }

  async updateCourse(userId: string, course: any) {
    try {
      // Extract milestones before processing course data
      const { milestones, ...courseWithoutMilestones } = course;
      
      // Process milestones separately if they exist
      if (Array.isArray(milestones)) {
        const processedMilestones = milestones.map((m) => ({
          ...m,
          title: ensureMilestoneTitle(m),
        }));
        await milestoneService.syncMilestones(userId, course.id, processedMilestones);
      }

      // Update course without milestones column
      const { data, error } = await supabase
        .from("courses")
        .update({
          ...courseWithoutMilestones,
          updated_at: new Date().toISOString(),
        })
        .eq("id", course.id)
        .eq("user_id", userId)
        .select();

      if (error) {
        console.error("Error updating course:", error);
        return { error };
      }

      return { data: data[0] };
    } catch (err) {
      console.error("Exception updating course:", err);
      return { error: err };
    }
  }

  async saveCourses(userId: string, courses: any[]) {
    try {
      const processedCourses = courses.map((course) => {
        // Extract milestones before processing course data
        const { milestones, ...courseWithoutMilestones } = course;
        
        // Ensure course data is clean for database
        const cleanCourse = {
          ...courseWithoutMilestones,
          user_id: userId,
          updated_at: new Date().toISOString(),
        };
        
        return { cleanCourse, milestones };
      });

      // upsert all courses (without milestones column)
      const results = await Promise.all(
        processedCourses.map(async ({ cleanCourse, milestones }) => {
          const { data, error } = await supabase
            .from('courses')
            .upsert(cleanCourse)
            .select();

          if (error) {
            console.error('Error saving course:', error);
            return { error, course: null };
          }
          return { course: data[0], milestones };
        })
      );

      // sync milestones separately for successful course saves
      await Promise.all(
        results
          .filter((r) => r.course && r.milestones)
          .map(async ({ course, milestones }) => {
            if (Array.isArray(milestones)) {
              await milestoneService.syncMilestones(userId, course.id, milestones);
            }
          })
      );

      return results.filter((r) => r.course).map((r) => r.course);
    } catch (err) {
      console.error('Exception saving courses:', err);
      return [];
    }
  }
}

export const courseService = new CourseService();
