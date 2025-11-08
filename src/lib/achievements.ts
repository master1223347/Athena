import { supabase } from "@/integrations/supabase/client";
import { Achievement } from "@/types/achievement";

interface FetchOptions {
  /** bust Redis & force fresh fetch */
  invalidate?: boolean;
  /** cache lifetime (seconds) - default 7200 (2 hours) */
  ttl?: number;
  /** filter unlocked state */
  unlocked?: boolean;
  /** filter by difficulty tier */
  difficulty?: "easy" | "medium" | "hard";
}

/**
 * Cache-first → Supabase fallback loader for achievements
 */
export async function getAchievements(
  userId: string,
  opts: FetchOptions = {},
): Promise<Achievement[]> {
  try {
    // --- 1️⃣  call our redis-achievements edge function -------------------------------
    const { data, error } = await supabase.functions.invoke<{
      achievements: Achievement[];
    }>("redis-achievements", {
      body: { 
        userId, 
        ...opts 
      },
    });

    if (!error && data?.achievements) {
      return data.achievements;
    }

    console.warn(
      "[Redis] failed → direct Supabase. Error:",
      error ?? "(unknown)",
    );

    // --- 2️⃣  Supabase direct fallback ------------------------------------
    let q = supabase.from("achievements").select("*").eq("user_id", userId);
    if (opts.unlocked !== undefined) q = q.eq("unlocked", opts.unlocked);
    if (opts.difficulty) q = q.eq("difficulty", opts.difficulty);

    const { data: directData, error: directErr } = await q;
    if (directErr) {
      console.error("Direct Supabase query failed:", directErr);
      return [];
    }

    // no need to push back into Redis – edge-function will do that on next hit
    return directData ?? [];
  } catch (err) {
    console.error("getAchievements() unexpected error:", err);
    return [];
  }
}
