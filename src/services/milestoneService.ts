import { supabase } from '@/integrations/supabase/client';
import { formatMilestoneForDatabase, ensureMilestoneTitle } from './userDataUtils';
import { getMilestones } from '../lib/milestones';

/**
 * Service for managing assignment milestones
 */
class MilestoneService {
  async getAssignments(courseId: string) {
    try {
      const milestones = await getMilestones(courseId);
      // Process milestones before returning
      return (milestones || []).map(milestone => ({
        ...milestone,
        title: ensureMilestoneTitle(milestone),
        dueDate: milestone.due_date ? new Date(milestone.due_date) : undefined,
        completedDate: milestone.completed_date ? new Date(milestone.completed_date) : undefined,
      }));
    } catch (err) {
      console.error('Exception fetching assignments:', err);
      return [];
    }
  }

  async addAssignment(assignmentData: any) {
    try {
      // Ensure assignment has a title
      const processedData = {
        ...assignmentData,
        title: ensureMilestoneTitle(assignmentData),
        status: assignmentData.status || 'pending',
        type: assignmentData.type || 'assignment'
      };
      
      const { data, error } = await supabase
        .from('milestones')
        .insert([processedData])
        .select();

      if (error) {
        console.error('Error adding assignment:', error);
        return { error };
      }

      return { data: data[0] };
    } catch (err) {
      console.error('Exception adding assignment:', err);
      return { error: err };
    }
  }

  async updateAssignmentCompletion(assignmentId: string, isCompleted: boolean) {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .update({ 
          status: isCompleted ? 'completed' : 'upcoming',
          completed_date: isCompleted ? new Date().toISOString() : null,
          progress: isCompleted ? 100 : 0
        })
        .eq('id', assignmentId)
        .select();

      if (error) {
        console.error('Error updating assignment completion:', error);
        return { error };
      }

      return { data: data[0] };
    } catch (err) {
      console.error('Exception updating assignment completion:', err);
      return { error: err };
    }
  }

  async syncMilestones(userId: string, courseId: string, milestones: any[]) {
    try {
      if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
        return;
      }
      
      // First, get existing milestones from database to preserve manual status changes
      const { data: existingMilestones } = await supabase
        .from('milestones')
        .select('id, status, completed_date, progress')
        .eq('course_id', courseId)
        .eq('user_id', userId);
      
      // Create a map of manually completed milestones
      const manualStatusMap = new Map();
      if (existingMilestones) {
        existingMilestones.forEach(milestone => {
          // Preserve completed status and manually set statuses
          if (milestone.status === 'completed' || milestone.completed_date) {
            manualStatusMap.set(milestone.id, {
              status: milestone.status,
              completed_date: milestone.completed_date,
              progress: milestone.progress
            });
          }
        });
      }
      
      // Prepare milestone updates for database (converting dueDate to due_date, etc.)
      const formattedMilestones = milestones.map(milestone => {
        const formatted = formatMilestoneForDatabase(milestone, courseId, userId);
        
        // Preserve manual status changes if they exist
        const manualStatus = manualStatusMap.get(milestone.id);
        if (manualStatus) {
          formatted.status = manualStatus.status;
          formatted.completed_date = manualStatus.completed_date;
          formatted.progress = manualStatus.progress;
        }
        
        return formatted;
      });
      
      // We use upsert to update or insert milestones
      const { error } = await supabase
        .from('milestones')
        .upsert(formattedMilestones, { 
          onConflict: 'id', 
          ignoreDuplicates: false 
        });
        
      if (error) {
        console.error('Error syncing milestones:', error);
      } else if (manualStatusMap.size > 0) {
        console.log(`Preserved ${manualStatusMap.size} manually completed assignment(s) during sync`);
      }
    } catch (err) {
      console.error('Exception syncing milestones:', err);
    }
  }
}

export const milestoneService = new MilestoneService();
