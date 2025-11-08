import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { canvasClient } from './canvasClient';
import { CanvasSyncResult } from './types';
import { userDataService } from '@/services/userDataService';
import { userStorage } from '@/utils/userStorage';
import { getMilestones } from '@/lib/milestones';

/**
 * Handle Canvas synchronization
 */
export class CanvasSync {
  private isSyncing: boolean = false;  
  private autoSyncIntervals: number[] = [];

  setupAutoSync(intervalMinutes = 480, opts: any = {}) {
    if (this.autoSyncIntervals.length) return;
    this.clearAutoSync();          // wipes every old id
  
    if (!canvasClient.hasCredentials()) return;
  
    const id = window.setInterval(() => {
      this.syncWithCanvas(undefined, opts).catch(console.error);
    }, intervalMinutes * 60_000);
  
    this.autoSyncIntervals.push(id);
    console.log(`Auto‑sync running every ${intervalMinutes} min`);
  }
  
  clearAutoSync() {
    this.autoSyncIntervals.forEach(id => clearInterval(id));
    this.autoSyncIntervals = [];
    console.log('Auto‑sync cleared (all timers)');
  }
  

  /**
   * Sync data with Canvas
   */
  async syncWithCanvas(userId?: string, options: any = {}): Promise<boolean> {
    if (!canvasClient.hasCredentials()) {
      throw new Error('Canvas API credentials not set');
    }
    
    if (this.isSyncing) {
      console.log('Canvas sync already in progress');
      return false;
    }
    
    try {
      this.isSyncing = true;
      
      if (!userId) {
        // Try to get user ID from Supabase auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        userId = user.id;
      }
      
      // First, get user's manually completed assignments (that might not be in Canvas yet)
      const manuallyCompletedMilestones = await getMilestones(undefined, { userId, status: 'completed' });
      
      // Create a map of manually completed assignments for quick lookup
      const manuallyCompletedMap = new Map();
      if (manuallyCompletedMilestones) {
        manuallyCompletedMilestones.forEach(milestone => {
          manuallyCompletedMap.set(milestone.id, {
            status: milestone.status,
            completed_date: milestone.completed_date,
            progress: milestone.progress
          });
        });
      }
      
      // Ensure domain has protocol prefix for the edge function
      const { domain, token } = JSON.parse(userStorage.get(userId, 'canvas_credentials') || '{}');
      const domainWithProtocol = domain && !domain.startsWith('http') 
        ? `https://${domain}`
        : domain;
      
      console.log(`Starting Canvas sync for user ${userId}...`);
      console.log('Canvas credentials:', { domain, token: token ? '***' : 'missing', domainWithProtocol });
      
      // Check if credentials are missing
      if (!domain || !token) {
        throw new Error('Canvas credentials not found. Please connect your Canvas account first.');
      }
      
      // First attempt: Standard comprehensive sync
      const requestBody = { 
        userId, 
        domain: domainWithProtocol, 
        token,
        syncType: 'full'
      };
      
      console.log('Sending request to canvas-sync:', { ...requestBody, token: '***' });
      
      const response = await supabase.functions.invoke('canvas-sync', {
        body: requestBody
      });

      if (!response.data?.success) {
        console.error('First Canvas sync attempt failed:', response);
        throw new Error(response.error?.message || response.data?.message || 'Canvas sync failed');
      }
      
      console.log('First and only sync attempt completed:', response.data);

      
      // Now restore any manually completed assignments that might have been overwritten
      if (manuallyCompletedMilestones && manuallyCompletedMilestones.length > 0) {
        for (const milestone of manuallyCompletedMilestones) {
          // Update the milestone to restore its completed status
          await supabase
            .from('milestones')
            .update({
              status: 'completed',
              completed_date: milestone.completed_date,
              progress: milestone.progress || 100
            })
            .eq('id', milestone.id);
        }
        console.log(`Restored ${manuallyCompletedMilestones.length} manually completed assignments after sync`);
      }
      
      // Show detailed counts to help diagnose sync issues
      const stats = response.data.stats || {};
      toast.success(`Canvas sync completed: ${stats.coursesUpdated || 0} courses and ${stats.milestonesUpdated || 0} assignments updated`);
      
      // Log more detailed sync statistics for debugging
      if (stats) {
        console.log(`Sync details:
          - Courses: Added ${stats.coursesAdded || 0}, Updated ${stats.coursesUpdated || 0}
          - Milestones: Added ${stats.milestonesAdded || 0}, Updated ${stats.milestonesUpdated || 0}
          - Manually completed assignments preserved: ${manuallyCompletedMilestones?.length || 0}
          - Errors: ${(stats.errors || []).length}
        `);
      }
      
      // Track sync event for achievements
      // userDataService.trackCanvasSync(userId);
      if (!options.skipAchievementTrack) {
        userDataService.trackCanvasSync(userId);
      }
     
      
      return true;
    } catch (error) {
      console.error('Error syncing with Canvas:', error);
      toast.error(`Sync error: ${error.message || 'Unknown error'}`);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }
}

// Export a singleton instance
export const canvasSync = new CanvasSync();
