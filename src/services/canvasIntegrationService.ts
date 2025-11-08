import { supabase } from "@/integrations/supabase/client";
import { trackCanvasConnection } from "@/utils/eventTracker";

/**
 * Service for managing Canvas integration and credentials
 */
class CanvasIntegrationService {
  async getCanvasCredentials(userId: string) {
    try {
      const { data, error } = await supabase
        .from("canvas_credentials")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching Canvas credentials:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Exception fetching Canvas credentials:", err);
      return null;
    }
  }

  async saveCanvasCredentials(userId: string, domain: string, token: string) {
    try {
      const { data, error } = await supabase
        .from("canvas_credentials")
        .upsert({
          user_id: userId,
          domain,
          token,
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        console.error("Error saving Canvas credentials:", error);
        // Track failed connection
        trackCanvasConnection(false, {
          domain,
          error: error.message,
        });
        return { error };
      }

      // Track successful connection
      trackCanvasConnection(true, { domain });
      return { data: data[0] };
    } catch (err) {
      console.error("Exception saving Canvas credentials:", err);
      // Track failed connection
      trackCanvasConnection(false, {
        domain,
        error: String(err),
      });
      return { error: err };
    }
  }

  async clearCanvasCredentials(userId: string) {
    try {
      // Get domain before deleting for tracking purposes
      const { data: credentials } = await supabase
        .from("canvas_credentials")
        .select("domain")
        .eq("user_id", userId)
        .single();

      const domain = credentials?.domain;

      const { error } = await supabase
        .from("canvas_credentials")
        .delete()
        .eq("user_id", userId);

      if (error) {
        console.error("Error clearing Canvas credentials:", error);
        return { error };
      }

      // Track disconnection
      if (domain) {
        trackCanvasConnection(false, {
          domain,
          action: "disconnect",
        });
      }

      return { success: true };
    } catch (err) {
      console.error("Exception clearing Canvas credentials:", err);
      return { error: err };
    }
  }

  async updateLastSync(userId: string) {
    try {
      // Update the last sync time using the database function
      const { error } = await supabase.rpc("update_last_sync", {
        user_id_param: userId,
        sync_time_param: new Date().toISOString(),
      });

      if (error) {
        console.error("Error updating last sync time:", error);
        return { error };
      }

      // Also update the last_sync_date in canvas_credentials table for backward compatibility
      await supabase
        .from("canvas_credentials")
        .update({
          last_sync_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      return { success: true };
    } catch (err) {
      console.error("Exception updating last sync time:", err);
      return { error: err };
    }
  }

  async getLastSync(userId: string) {
    try {
      // First try to get the last sync time from the new function
      const { data: syncData, error: syncError } = await supabase.rpc(
        "get_last_sync",
        {
          user_id_param: userId,
        }
      );

      if (
        !syncError &&
        syncData &&
        Array.isArray(syncData) &&
        syncData.length > 0
      ) {
        return {
          lastSync: syncData[0].last_sync,
        };
      }

      // Fallback to the old method if new method fails
      const { data, error } = await supabase
        .from("canvas_credentials")
        .select("last_sync_date")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error getting last sync date:", error);
        return { error, lastSync: null };
      }

      return {
        lastSync: data ? data.last_sync_date : null,
      };
    } catch (err) {
      console.error("Exception getting last sync date:", err);
      return { error: err, lastSync: null };
    }
  }
}

export const canvasIntegrationService = new CanvasIntegrationService();
