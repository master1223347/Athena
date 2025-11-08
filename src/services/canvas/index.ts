import { canvasApi } from "../canvasApi";
import { achievementManager } from "../achievement/AchievementManager";

// Export the canvasApi for backward compatibility
export { canvasApi } from "../canvasApi";

// Track Canvas sync event for achievements
export const trackCanvasSync = (userId: string) => {
  console.log("Tracking Canvas sync event for user:", userId);
  achievementManager.trackCanvasSync(userId);
};
