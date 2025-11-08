import { supabase } from '@/integrations/supabase/client';

export interface PipelineJob {
  id: string;
  user_id: string;
  type: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  file_count: number;
  processed_count: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export class PipelineService {
  // Get user's pipeline jobs
  static async getUserJobs(userId: string): Promise<PipelineJob[]> {
    const { data, error } = await supabase
      .from('pipeline_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pipeline jobs:', error);
      throw error;
    }

    return (data || []) as PipelineJob[];
  }

  // Get a specific pipeline job
  static async getJob(jobId: string): Promise<PipelineJob | null> {
    const { data, error } = await supabase
      .from('pipeline_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      console.error('Error fetching pipeline job:', error);
      throw error;
    }

    return data as PipelineJob;
  }

  // Create a new pipeline job
  static async createJob(userId: string, type: string = 'full_sync'): Promise<PipelineJob> {
    const { data, error } = await supabase
      .from('pipeline_jobs')
      .insert({
        user_id: userId,
        type,
        status: 'queued'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pipeline job:', error);
      throw error;
    }

    return data as PipelineJob;
  }

  // Process a pipeline job (this would integrate with your unified pipeline)
  static async processJob(jobId: string): Promise<void> {
    try {
      // Call the Supabase Edge Function to process the job
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/process-pipeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ jobId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process pipeline job');
      }

      const result = await response.json();
      console.log('Pipeline job processed:', result);

    } catch (error) {
      console.error('Error processing pipeline job:', error);
      throw error;
    }
  }

  // Get pipeline status for a user
  static async getPipelineStatus(userId: string): Promise<{
    hasActiveJob: boolean;
    lastJob?: PipelineJob;
    totalFiles: number;
    processedFiles: number;
    processedFilesList?: Array<{ id: string; display_name: string; content_type: string }>;
  }> {
    const jobs = await this.getUserJobs(userId);
    const activeJob = jobs.find(job => 
      job.status === 'queued' || job.status === 'processing'
    );
    const lastJob = jobs[0];

    // Get file counts from canvas_files table
    // Total files: all files in the table
    // Processed files: files with status = 'downloaded' or 'completed'
    const [totalFilesResponse, processedFilesResponse] = await Promise.all([
      supabase
        .from('canvas_files')
        .select('id', { count: 'exact' })
        .eq('user_id', userId),
      supabase
        .from('canvas_files')
        .select('id, display_name, content_type')
        .eq('user_id', userId)
        .in('status', ['downloaded', 'completed'])
    ]);

    const totalFiles = totalFilesResponse.count || 0;
    const processedFilesList = processedFilesResponse.data || [];
    const processedFiles = processedFilesList.length;

    return {
      hasActiveJob: !!activeJob,
      lastJob,
      totalFiles,
      processedFiles,
      processedFilesList
    };
  }

  // Manually trigger pipeline for a user
  static async triggerPipeline(userId: string): Promise<PipelineJob> {
    // Check if user has premium plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single();

    if (!profile || profile.plan !== 'premium') {
      throw new Error('Pipeline processing requires a premium plan');
    }

    // Check if there's already an active job
    const activeJobs = await this.getUserJobs(userId);
    const hasActiveJob = activeJobs.some(job => 
      job.status === 'queued' || job.status === 'processing'
    );

    if (hasActiveJob) {
      throw new Error('Pipeline job already in progress');
    }

    // Create and start processing
    const job = await this.createJob(userId);
    await this.processJob(job.id);

    return job;
  }
}
