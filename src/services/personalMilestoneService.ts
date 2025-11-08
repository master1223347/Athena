import { supabase } from '@/integrations/supabase/client';

export interface PersonalMilestone {
  id: string;
  user_id: string;
  course_id?: string;
  title: string;
  description?: string;
  due_date?: Date;
  completed_date?: Date;
  status: 'completed' | 'in-progress' | 'upcoming' | 'at-risk';
  type: 'assignment' | 'exam' | 'reading' | 'project' | 'module' | 'course';
  canvas_id?: string;
  url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePersonalMilestoneData {
  user_id: string;
  course_id?: string;
  title: string;
  description?: string;
  due_date?: Date;
  status: 'completed' | 'in-progress' | 'upcoming' | 'at-risk';
  type: 'assignment' | 'exam' | 'reading' | 'project' | 'module' | 'course';
  url?: string;
}

export interface UpdatePersonalMilestoneData {
  title?: string;
  description?: string;
  due_date?: Date;
  completed_date?: Date;
  status?: 'completed' | 'in-progress' | 'upcoming' | 'at-risk';
  type?: 'assignment' | 'exam' | 'reading' | 'project' | 'module' | 'course';
  course_id?: string;
  url?: string;
}

class PersonalMilestoneService {
  async createPersonalMilestone(data: CreatePersonalMilestoneData): Promise<PersonalMilestone> {
    const { data: milestone, error } = await (supabase as any)
      .from('personal_milestones')
      .insert({
        user_id: data.user_id,
        course_id: data.course_id,
        title: data.title,
        description: data.description,
        due_date: data.due_date?.toISOString(),
        status: data.status,
        type: data.type,
        url: data.url,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create personal milestone: ${error.message}`);
    }

    return {
      ...milestone,
      due_date: milestone.due_date ? new Date(milestone.due_date) : undefined,
      completed_date: milestone.completed_date ? new Date(milestone.completed_date) : undefined,
      created_at: new Date(milestone.created_at),
      updated_at: new Date(milestone.updated_at),
    };
  }

  async getPersonalMilestones(userId: string): Promise<PersonalMilestone[]> {
    const { data: milestones, error } = await (supabase as any)
      .from('personal_milestones')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch personal milestones: ${error.message}`);
    }

    return milestones.map((milestone: any) => ({
      ...milestone,
      due_date: milestone.due_date ? new Date(milestone.due_date) : undefined,
      completed_date: milestone.completed_date ? new Date(milestone.completed_date) : undefined,
      created_at: new Date(milestone.created_at),
      updated_at: new Date(milestone.updated_at),
    }));
  }

  async updatePersonalMilestone(
    milestoneId: string, 
    updates: UpdatePersonalMilestoneData
  ): Promise<PersonalMilestone> {
    const updateData: any = { ...updates };
    
    if (updates.due_date) {
      updateData.due_date = updates.due_date.toISOString();
    }
    if (updates.completed_date) {
      updateData.completed_date = updates.completed_date.toISOString();
    }

    const { data: milestone, error } = await (supabase as any)
      .from('personal_milestones')
      .update(updateData)
      .eq('id', milestoneId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update personal milestone: ${error.message}`);
    }

    return {
      ...milestone,
      due_date: milestone.due_date ? new Date(milestone.due_date) : undefined,
      completed_date: milestone.completed_date ? new Date(milestone.completed_date) : undefined,
      created_at: new Date(milestone.created_at),
      updated_at: new Date(milestone.updated_at),
    };
  }

  async deletePersonalMilestone(milestoneId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('personal_milestones')
      .delete()
      .eq('id', milestoneId);

    if (error) {
      throw new Error(`Failed to delete personal milestone: ${error.message}`);
    }
  }

  async getPersonalMilestonesByDateRange(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<PersonalMilestone[]> {
    const { data: milestones, error } = await (supabase as any)
      .from('personal_milestones')
      .select('*')
      .eq('user_id', userId)
      .gte('due_date', startDate.toISOString())
      .lte('due_date', endDate.toISOString())
      .order('due_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch personal milestones by date range: ${error.message}`);
    }

    return milestones.map((milestone: any) => ({
      ...milestone,
      due_date: milestone.due_date ? new Date(milestone.due_date) : undefined,
      completed_date: milestone.completed_date ? new Date(milestone.completed_date) : undefined,
      created_at: new Date(milestone.created_at),
      updated_at: new Date(milestone.updated_at),
    }));
  }
}

export const personalMilestoneService = new PersonalMilestoneService(); 