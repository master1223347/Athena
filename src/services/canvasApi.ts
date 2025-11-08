import { JourneyCourse, JourneyMilestone } from '@/components/journey/JourneyMap';
import { toast } from 'sonner';
import { canvasClient } from './canvas/canvasClient';
import { canvasDataTransformer } from './canvas/canvasDataTransformer';
import { canvasSync } from './canvas/canvasSync';

/**
 * Canvas API service that coordinates between the client, sync and data transformer
 */
class CanvasAPI {
  /**
   * Set Canvas API credentials
   */
  setCredentials(domain: string, token: string) {
    canvasClient.setCredentials(domain, token);
  }

  /**
   * Clear Canvas API credentials
   */
  clearCredentials() {
    canvasClient.clearCredentials();
    canvasSync.clearAutoSync();
  }

  /**
   * Check if Canvas API credentials are set
   */
  hasCredentials(): boolean {
    return canvasClient.hasCredentials();
  }

  /**
   * Set up automatic sync at fixed 5-minute interval
   */
  setupAutoSync(intervalMinutes: number = 480, opts: any = {}) {
    canvasSync.setupAutoSync(intervalMinutes, opts);
  }

  /**
   * Clear auto-sync interval
   */
  clearAutoSync() {
    canvasSync.clearAutoSync();
  }

  /**
   * Sync data with Canvas
   */
  async syncWithCanvas(userId?: string, options: any = {}): Promise<boolean> {
    return canvasSync.syncWithCanvas(userId, options);
  }

  /**
   * Fetch and transform all Canvas data - uses cached data from Supabase
   */
  async fetchAndTransformAllData(forceRefresh: boolean = false): Promise<JourneyCourse[]> {
    return canvasDataTransformer.fetchAndTransformAllData(forceRefresh);
  }

  /**
   * Get user profile from Canvas
   */
  async getUserProfile() {
    return canvasDataTransformer.getUserProfile();
  }

  /**
   * Get detailed course information
   */
  async getCourseDetails(courseId: string) {
    return canvasDataTransformer.getCourseDetails(courseId);
  }

  /**
   * Get assignment details
   */
  async getAssignmentDetails(courseId: string, assignmentId: string) {
    return canvasDataTransformer.getAssignmentDetails(courseId, assignmentId);
  }
}

export const canvasApi = new CanvasAPI();
