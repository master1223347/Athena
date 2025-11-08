import {
  Achievement,
  AchievementMetrics,
  AchievementDifficulty,
} from "@/types/achievement";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { NEW_ACHIEVEMENTS } from "@/data/newAchievements";
import {
  mapDatabaseRecordsToAchievements,
  mapAchievementToDatabaseFormat,
} from "./achievementMapper";
import {
  calculateLevel,
  calculatePointsToNextLevel,
} from "@/utils/achievement/levelUtils";
import { Json } from "@/types/supabase";
import { collectUserMetrics } from "./achievementMetricsService";
import { calculateAchievementProgress } from "@/utils/achievement/achievementTracker";
import {
  processFirstStepsAchievement,
  process5GuysAchievement,
  process35GuysAchievement,
  process65GuysAchievement,
  processGoodLooksAchievement,
  processAceAchievement,
  processGettingThereAchievement,
  processGettingCloserAchievement,
  processGotThereAchievement,
  processDayNNiteAchievement,
} from "./achievementProcessors";
import {
  trackAssignmentComplete,
  trackCanvasSync,
  trackLogin,
  trackPageView,
  trackPerfectGrade,
  trackProfilePictureUpdate,
  trackThemeChange,
} from "./achievementMetricsService";

/**
 * AchievementManager - Centralized class to handle all achievement operations
 * Manages achievement creation, updates, tracking, and synchronization
 */
class AchievementManager {
  /**
   * Get all achievements for a user
   */
  async getAchievements(userId: string): Promise<Achievement[]> {
    try {
      console.log("Loading achievements for user", userId);

      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching achievements:", error);
        return [];
      }
      console.log('after login localStorage:', { ...localStorage });
      console.log(`Loaded ${data?.length || 0} achievements`);
      // Use the mapping function to convert database records to Achievement objects
      return mapDatabaseRecordsToAchievements(data || []);
    } catch (error) {
      console.error("Error in getAchievements:", error);
      return [];
    }
  }

  /**
   * Update a single achievement
   */
  async updateAchievement(
    achievementId: string,
    updates: Partial<Achievement>
  ): Promise<void> {
    try {
      console.log(`Updating achievement ${achievementId}:`, updates);

      // Ensure progress is always an integer
      if (typeof updates.progress === "number") {
        updates.progress = Math.round(updates.progress);
      }

      // Convert to database format before updating
      const dbUpdates = mapAchievementToDatabaseFormat(updates);

      const { error } = await supabase
        .from("achievements")
        .update(dbUpdates)
        .eq("id", achievementId);

      if (error) {
        console.error("Error updating achievement:", error);
        throw new Error(`Failed to update achievement: ${error.message}`);
      }

      // If achievement was just unlocked, show a toast
      if (updates.unlocked && updates.progress === 100) {
        // Find the achievement title for the toast
        const { data: achievement } = await supabase
          .from("achievements")
          .select("title, description")
          .eq("id", achievementId)
          .single();

        if (achievement) {
          // Show toast notification when achievement is unlocked
          toast.success(`🏆 Achievement Unlocked: ${achievement.title}`, {
            description: achievement.description,
            duration: 5000,
          });
          console.log(`🏆 Achievement unlocked: ${achievement.title}`);
        }
      }
    } catch (error) {
      console.error("Error updating achievement:", error);
      throw new Error(
        `Failed to update achievement: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Add a new achievement for a user
   */
  async addAchievement(
    userId: string,
    achievement: Achievement
  ): Promise<void> {
    try {
      console.log(`Adding achievement ${achievement.title} for user:`, userId);

      // Verify the achievement doesn't already exist (by ID)
      const { data: existing } = await supabase
        .from("achievements")
        .select("id")
        .eq("user_id", userId)
        .eq("id", achievement.id)
        .maybeSingle();

      if (existing) {
        console.log(
          `Achievement with ID ${achievement.id} already exists, skipping`
        );
        return;
      }

      // Create values object with required fields explicitly set
      const dbValues = {
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        difficulty: achievement.difficulty.toString().toLowerCase(),
        points: achievement.points,
        progress: achievement.progress || 0,
        unlocked: achievement.unlocked || false,
        user_id: userId,
        requirements: achievement.requirements as unknown as Json,
        id: achievement.id,
      };

      const { error } = await supabase
      .from("achievements")
      .upsert(dbValues, {
        onConflict: "user_id,title",
      });

      if (error) {
        throw new Error(`Failed to add achievement: ${error.message}`);
      }

      console.log(`Successfully added achievement: ${achievement.title}`);
    } catch (error) {
      console.error("Error adding achievement:", error);
      throw new Error(
        `Failed to add achievement: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Refresh achievements for a user - updates progress but doesn't add/remove any achievements
   */
  async refreshAchievements(userId: string): Promise<void> {
    try {
      console.log("Refreshing achievement progress for user:", userId);

      // Collect all user metrics
      const allMetrics = await collectUserMetrics(userId);

      console.log("Current metrics for achievement calculation:", allMetrics);

      // Get the user's achievements
      const achievements = await this.getAchievements(userId);
      let updatedCount = 0;

      // Update progress for each achievement
      for (const achievement of achievements) {
        const skip =
          (achievement.title === 'Day N Nite' && achievement.unlocked) ||
          (achievement.title === 'First Steps' && achievement.unlocked);
        if (skip) continue;
        const { progress, unlocked } = calculateAchievementProgress(
          achievement,
          allMetrics
        );

        // Only update if progress has changed
        if (
          progress !== achievement.progress ||
          unlocked !== achievement.unlocked
        ) {
          console.log(
            `Updating achievement ${achievement.title} (${achievement.id}): progress=${progress}, unlocked=${unlocked}`
          );

          await this.updateAchievement(achievement.id, {
            progress,
            unlocked,
          });

          updatedCount++;
        }

        // Make sure First Steps achievement has correct points value (10)
        if (achievement.title === "First Steps" && achievement.points !== 10) {
          console.log(
            `Updating First Steps achievement points from ${achievement.points} to 10`
          );
          await this.updateAchievement(achievement.id, {
            points: 10,
          });
          updatedCount++;
        }
      }

      console.log(`Refreshed ${updatedCount} achievements`);

      // Ensure achievements exist
      await processFirstStepsAchievement(
        userId,
        allMetrics,
        this.updateAchievement.bind(this),
        this.addAchievement.bind(this)
      );
      await process5GuysAchievement(
        userId,
        allMetrics,
        this.updateAchievement.bind(this),
        this.addAchievement.bind(this)
      );
      await process35GuysAchievement(
        userId,
        allMetrics,
        this.updateAchievement.bind(this),
        this.addAchievement.bind(this)
      );
      await process65GuysAchievement(
        userId,
        allMetrics,
        this.updateAchievement.bind(this),
        this.addAchievement.bind(this)
      );
      await processGoodLooksAchievement(
        userId,
        allMetrics,
        this.updateAchievement.bind(this),
        this.addAchievement.bind(this)
      );
      await processAceAchievement(
        userId,
        allMetrics,
        this.updateAchievement.bind(this),
        this.addAchievement.bind(this)
      );
      await processGettingThereAchievement(
        userId,
        allMetrics,
        this.updateAchievement.bind(this),
        this.addAchievement.bind(this)
      );
      await processGettingCloserAchievement(
        userId,
        allMetrics,
        this.updateAchievement.bind(this),
        this.addAchievement.bind(this)
      );
      await processGotThereAchievement(
        userId,
        allMetrics,
        this.updateAchievement.bind(this),
        this.addAchievement.bind(this)
      );
      await processDayNNiteAchievement(
        userId,
        allMetrics,
        this.updateAchievement.bind(this),
        this.addAchievement.bind(this)
      );

      // Show success toast
      toast.success("Achievements refreshed", {
        description: `Updated progress on ${updatedCount} achievements`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error refreshing achievements:", error);
      toast.error("Failed to refresh achievements", {
        description: error instanceof Error ? error.message : "Unknown error",
        duration: 4000,
      });
      throw new Error(
        `Failed to refresh achievements: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Check and update all achievements based on user metrics
   */
  async checkAndUpdateAchievements(
    userId: string,
    metricUpdates: Partial<AchievementMetrics> = {}
  ): Promise<void> {
    try {
      console.log("Checking achievements with metric updates:", metricUpdates);

      // Get all relevant metrics combined with updates
      const allMetrics = await collectUserMetrics(userId);
      const combinedMetrics: AchievementMetrics = {
        ...allMetrics,
        ...metricUpdates,
      };

      console.log("All metrics for achievement calculation:", combinedMetrics);

      // Get user's current achievements
      const achievements = await this.getAchievements(userId);
      if (!achievements || achievements.length === 0) {
        console.log("No achievements to update");
        return;
      }

      // Process each achievement based on metrics in a single transaction
      let updatedCount = 0;

      for (const achievement of achievements) {
        const skip =
            (achievement.title === 'Day N Nite' && achievement.unlocked) ||
            (achievement.title === 'First Steps' && achievement.unlocked); 
        if (skip) continue;
        const { progress, unlocked } = calculateAchievementProgress(
          achievement,
          combinedMetrics
        );

        // If achievement progress changed, update it
        if (
          progress !== achievement.progress ||
          unlocked !== achievement.unlocked
        ) {
          console.log(
            `Updating achievement ${achievement.title} (${achievement.id}): progress=${progress}, unlocked=${unlocked}`
          );

          await this.updateAchievement(achievement.id, {
            progress,
            unlocked,
          });

          updatedCount++;
        }
      }

      console.log(`Updated ${updatedCount} achievements`);

      // Make sure all achievements exist and are properly tracked
      await processFirstStepsAchievement(
        userId,
        combinedMetrics,
        this.updateAchievement.bind(this),
        this.addAchievement.bind(this)
      );
      await process5GuysAchievement(
        userId,
        combinedMetrics,
        this.updateAchievement.bind(this),
        this.addAchievement.bind(this)
      );
      await process35GuysAchievement(
        userId,
        combinedMetrics,
        this.updateAchievement.bind(this),
        this.addAchievement.bind(this)
      );
      await process65GuysAchievement(
        userId,
        combinedMetrics,
        this.updateAchievement.bind(this),
        this.addAchievement.bind(this)
      );
      await processGoodLooksAchievement(
        userId,
        combinedMetrics,
        this.updateAchievement.bind(this),
        this.addAchievement.bind(this)
      );
      await processAceAchievement(
        userId,
        combinedMetrics,
        this.updateAchievement.bind(this),
        this.addAchievement.bind(this)
      );

      // Only update course grade achievements if on Progress page
      if (metricUpdates.currentPage === 'progress') {
        await processGettingThereAchievement(
          userId,
          combinedMetrics,
          this.updateAchievement.bind(this),
          this.addAchievement.bind(this)
        );
        await processGettingCloserAchievement(
          userId,
          combinedMetrics,
          this.updateAchievement.bind(this),
          this.addAchievement.bind(this)
        );
        await processGotThereAchievement(
          userId,
          combinedMetrics,
          this.updateAchievement.bind(this),
          this.addAchievement.bind(this)
        );
      }
      await processDayNNiteAchievement(
        userId,
        combinedMetrics,
        this.updateAchievement.bind(this),
        this.addAchievement.bind(this)
      );
    } catch (error) {
      console.error("Error checking and updating achievements:", error);
    }
  }

  // Tracking methods (delegate to metrics service)
  trackLogin = trackLogin;
  trackPageView = trackPageView;
  trackCanvasSync = trackCanvasSync;
  trackProfilePictureUpdate = trackProfilePictureUpdate;
  trackThemeChange = trackThemeChange;
  trackAssignmentComplete = trackAssignmentComplete;
  trackPerfectGrade = trackPerfectGrade;

  // Level utilities
  calculateLevel = calculateLevel;
  calculatePointsToNextLevel = calculatePointsToNextLevel;
}

// Create and export a singleton instance
export const achievementManager = new AchievementManager();
