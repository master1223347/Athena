
import { supabase } from '@/integrations/supabase/client';
import { canvasIntegrationService } from './canvasIntegrationService';
import { courseService } from './courseService';
import { milestoneService } from './milestoneService';
import { userSettingsService } from './userSettingsService';
import { achievementService } from './achievement/achievementService';
import { Achievement, AchievementMetrics } from '@/types/achievement';
import { JourneyCourse } from '@/components/journey/JourneyMap';


/**
 * Main service facade for accessing all user data services
 */
class UserDataService {
  // Canvas integration methods
  async getCanvasCredentials(userId: string) {
    return canvasIntegrationService.getCanvasCredentials(userId);
  }

  async saveCanvasCredentials(userId: string, domain: string, token: string) {
    return canvasIntegrationService.saveCanvasCredentials(userId, domain, token);
  }

  async clearCanvasCredentials(userId: string) {
    return canvasIntegrationService.clearCanvasCredentials(userId);
  }

  async updateLastSync(userId: string) {
    return canvasIntegrationService.updateLastSync(userId);
  }

  async getLastSync(userId: string) {
    return canvasIntegrationService.getLastSync(userId);
  }

  // Course methods
  async getCourses(userId: string) {
    return courseService.getCourses(userId);
  }

  async getCoursesAsync(userId: string) {
    return courseService.getCoursesAsync(userId);
  }

  async addCourse(userId: string, courseData: any) {
    return courseService.addCourse(userId, courseData);
  }

  async updateCourse(userId: string, course: any) {
    return courseService.updateCourse(userId, course);
  }

  async saveCourses(userId: string, courses: any[]) {
    return courseService.saveCourses(userId, courses);
  }

  // Milestone/assignment methods
  async getAssignments(courseId: string) {
    return milestoneService.getAssignments(courseId);
  }

  async addAssignment(assignmentData: any) {
    return milestoneService.addAssignment(assignmentData);
  }

  async updateAssignmentCompletion(assignmentId: string, isCompleted: boolean) {
    return milestoneService.updateAssignmentCompletion(assignmentId, isCompleted);
  }

  async syncMilestones(userId: string, courseId: string, milestones: any[]) {
    return milestoneService.syncMilestones(userId, courseId, milestones);
  }

  // User settings methods
  async getUserSettings(userId: string) {
    return userSettingsService.getUserSettings(userId);
  }

  async updateUserSettings(userId: string, settings: any) {
    return userSettingsService.updateUserSettings(userId, settings);
  }

  // Achievement methods
  async getAchievements(userId: string): Promise<Achievement[]> {
    return achievementService.getAchievements(userId);
  }

  async checkAndUpdateAchievements(userId: string, metrics: Partial<AchievementMetrics> = {}): Promise<void> {
    return achievementService.checkAndUpdateAchievements(userId, metrics);
  }
  
  async refreshAchievements(userId: string): Promise<void> {
    return achievementService.refreshAchievements(userId);
  }
  
  async addAchievement(userId: string, achievement: Achievement): Promise<void> {
    return achievementService.addAchievement(userId, achievement);
  }
  // userDataService.ts
// userDataService.ts
  async saveMilestonesOnly(userId: string, courses: JourneyCourse[]) {
    for (const c of courses) {
      await milestoneService.syncMilestones(userId, c.id, c.milestones);
    }
  }


  
  
  // Tracking methods
  trackLogin(userId: string): void {
    achievementService.trackLogin(userId);
  }
  
  trackPageView(userId: string, page: string): void {
    achievementService.trackPageView(userId, page);
  }
  
  trackCanvasSync(userId: string): void {
    achievementService.trackCanvasSync(userId);
  }
  
  trackProfilePictureUpdate(userId: string): void {
    achievementService.trackProfilePictureUpdate(userId);
  }
  
  trackThemeChange(userId: string, theme: 'dark' | 'light'): void {
    achievementService.trackThemeChange(userId, theme);
  }
  
  trackAssignmentComplete(userId: string): void {
    achievementService.trackAssignmentComplete(userId);
  }
  
  trackPerfectGrade(userId: string): void {
    achievementService.trackPerfectGrade(userId);
  }
  
  calculateLevel(totalPoints: number): number {
    return achievementService.calculateLevel(totalPoints);
  }
  
  calculatePointsToNextLevel(totalPoints: number): { current: number, next: number, progress: number } {
    return achievementService.calculatePointsToNextLevel(totalPoints);
  }
}

export const userDataService = new UserDataService();
