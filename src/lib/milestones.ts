import { supabase } from "@/integrations/supabase/client";

export type Milestone = {
  id: string;
  course_id: string;
  title: string;
  due_date: string | null;
  completed_date: string | null;
  status: string;
  progress: number;
  type: string;
  grade?: number;
  points_possible?: number;
  canvas_id?: string;
  url?: string;
  description?: string;
};

export interface FetchOptions {
  /** skip Redis and force a Supabase fetch */
  invalidate?: boolean;
  /** cache Time-To-Live in seconds (default 7200 - 2 hours) */
  ttl?: number;
  /** for user-wide queries */
  userId?: string;
  status?: string;
  grade?: number;
}

/**
 * Unified helper – always calls the Redis edge function first.
 * On cache-miss the edge function handles Supabase + re-prime,
 * so the client only needs one network round-trip.
 */
export async function getMilestones(
  courseId?: string,
  opts: FetchOptions = {},
): Promise<Milestone[]> {
  // ---------- 1) try Redis edge function ----------
  const { data, error } = await supabase.functions.invoke<{
    milestones: Milestone[];
  }>("redis", { body: { courseId, ...opts } });

  if (!error && data?.milestones) {
    return data.milestones;
  }

  console.warn("[Milestones] Edge-function failed → direct Supabase", error);

  // ---------- 2) direct Supabase fallback ----------
  let q = supabase.from("milestones").select("*");

  if (courseId) {
    q = q.eq("course_id", courseId);
  } else if (opts.userId) {
    q = q.eq("user_id", opts.userId);
    if (opts.status) q = q.eq("status", opts.status);
    if (opts.grade !== undefined) q = q.eq("grade", opts.grade);
  } else {
    console.error("getMilestones: courseId or userId is required");
    return [];
  }

  const { data: rows, error: supaErr } = await q;
  if (supaErr) {
    console.error("Supabase fallback error:", supaErr);
    return [];
  }
  return rows ?? [];
}
