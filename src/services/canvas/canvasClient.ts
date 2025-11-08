
import { supabase } from '@/integrations/supabase/client';
import { CanvasAPIOptions, CanvasCredentials } from './types';
import { userStorage } from '@/utils/userStorage';

/**
 * A class for making calls to the Canvas API through our proxy function
 */
export class CanvasClient {
  private domain: string | null = null;
  private token: string | null = null;
  private currentUserId: string | null = null;
  
  constructor(credentials?: CanvasCredentials, userId?: string) {
    if (credentials) {
      this.domain = credentials.domain;
      this.token = credentials.token;
      if (userId) {
        this.currentUserId = userId;
      }
    }
  }
  
  /**
   * Set the current user ID for storage
   */
  setUserId(userId: string): void {
    this.currentUserId = userId;
    this.loadCredentialsFromStorage(userId);
  }
  
  /**
   * Load credentials from userId-specific localStorage if available
   */
  private loadCredentialsFromStorage(userId?: string): void {
    try {
      const userIdToUse = userId || this.currentUserId;
      if (!userIdToUse) return;
      
      const domain = userStorage.get(userIdToUse, 'canvas_domain', '');
      const token = userStorage.get(userIdToUse, 'canvas_token', '');
      
      if (domain && token) {
        this.domain = domain;
        this.token = token;
      }
    } catch (e) {
      console.error('Error loading Canvas credentials from user storage:', e);
    }
  }
  
  /**
   * Set Canvas API credentials
   */
  setCredentials(domain: string, token: string, userId?: string): void {
    this.domain = domain;
    this.token = token;
    
    const userIdToUse = userId || this.currentUserId;
    
    // Save credentials to user-specific storage if userId is available
    if (userIdToUse) {
      try {
        userStorage.set(userIdToUse, 'canvas_domain', domain);
        userStorage.set(userIdToUse, 'canvas_token', token);
      } catch (e) {
        console.error('Error saving Canvas credentials to user storage:', e);
      }
    }
  }
  
  /**
   * Clear Canvas API credentials
   */
  clearCredentials(userId?: string): void {
    this.domain = null;
    this.token = null;
    
    const userIdToUse = userId || this.currentUserId;
    
    // Clear from user-specific storage if userId is available
    if (userIdToUse) {
      try {
        userStorage.set(userIdToUse, 'canvas_domain', '');
        userStorage.set(userIdToUse, 'canvas_token', '');
      } catch (e) {
        console.error('Error removing Canvas credentials from user storage:', e);
      }
    }
  }
  
  /**
   * Check if Canvas API credentials are set
   */
  hasCredentials(): boolean {
    return !!this.domain && !!this.token;
  }
  
  /**
   * Helper method to make Canvas API calls through our proxy function
   */
  async callCanvasAPI(endpoint: string, options: CanvasAPIOptions = {}): Promise<any> {
    if (!this.hasCredentials()) {
      throw new Error('Canvas API credentials not set');
    }
    
    const { method = 'GET', data, cacheControl } = options;
    
    try {
      const response = await supabase.functions.invoke('canvas-proxy', {
        body: {
          endpoint,
          method,
          data,
          domain: this.domain,
          token: this.token,
          cacheControl
        }
      });
      
      if (response.error) {
        console.error(`Canvas API error for ${endpoint}:`, response.error);
        throw new Error(`Canvas API error: ${response.error.message}`);
      }
      
      return response.data?.data;
    } catch (error) {
      console.error(`Error calling Canvas API ${endpoint}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const canvasClient = new CanvasClient();
