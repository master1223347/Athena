// src/services/leaderboardGroupService.ts
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type GroupMember = {
  group_id: string;
  user_id: string;
  status: "pending" | "accepted";
  joined_at: string | null;
};

export type LeaderboardGroup = {
  id: string;
  owner_id: string;
  name: string;
  join_code: string;
  created_at: string;
  leaderboard_group_members: GroupMember[];
};

export async function fetchMyGroups(): Promise<LeaderboardGroup[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const uid = user.id;
  
    /* step 1 – my memberships ---------------------------- */
    const { data: memberships, error: memErr } = await supabase
      .from("leaderboard_group_members" as any)
      .select("group_id")
      .eq("user_id", uid);
  
    if (memErr) throw memErr;
    const memberIds = (memberships ?? []).map(m => m.group_id);
  
    /* step 2 – groups ------------------------------------ */
    let query = supabase
      .from("leaderboard_groups" as any)
      .select(`
        id,
        owner_id,
        name,
        join_code,
        created_at,
        leaderboard_group_members (
          user_id,
          status,
          joined_at
        )
      `);
  
    if (memberIds.length) {
      // uid is owner OR I'm in the members list
      const filter = `owner_id.eq.${uid},id.in.(${memberIds.join(",")})`;
      query = query.or(filter);
    } else {
      // only the groups I own
      query = query.eq("owner_id", uid);
    }
  
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  
  


/**
 * Create a new private group with a random 8-char code.
 */
export async function createGroup(name: string): Promise<LeaderboardGroup> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  
  const join_code = Math.random().toString(36).substring(2, 10).toUpperCase();
  const { data, error } = await supabase
    .from("leaderboard_groups")
    .insert({ name, join_code, owner_id: user.id })
    .select()
    .single();
  
  if (error) throw error;
  
  const { error: insertOwnerError } = await supabase
    .from("leaderboard_group_members")
    .insert({
        group_id: data.id,
        user_id: user.id,
        status: "accepted",
        joined_at: new Date().toISOString()
    });

    if (insertOwnerError) {
        console.error("Failed to insert owner as member:", insertOwnerError);
        throw insertOwnerError;
    }

    
  return data;
}

/**
 * Request to join a group using its code
 */
export async function requestToJoin(code: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  
  // Find the group by code
  const { data: group, error: groupError } = await supabase
    .from("leaderboard_groups")
    .select("id")
    .eq("join_code", code)
    .single();
    
  if (groupError) throw new Error("Invalid group code");
  
  // Check if already a member
  const { data: existingMember, error: memberError } = await supabase
    .from<any>("leaderboard_group_members")
    .select("status")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();
    
  if (existingMember) {
    // Already a member, update status if needed
    if (existingMember.status !== "accepted") {
      await supabase
        .from<any>("leaderboard_group_members")
        .update({ status: "accepted", joined_at: new Date().toISOString() })
        .eq("group_id", group.id)
        .eq("user_id", user.id);
    }
    return;
  }
  
  // New membership
  const { error: insertError } = await supabase
    .from<any>("leaderboard_group_members")
    .insert({
      group_id: group.id,
      user_id: user.id,
      status: "accepted", // Auto-accept for now
      joined_at: new Date().toISOString()
    });
  
  if (insertError) throw insertError;
}

/**
 * Update a member's status
 */
export async function setMemberStatus(
  groupId: string,
  userId: string,
  status: "pending" | "accepted"
): Promise<void> {
  const { error } = await supabase
    .from<any>("leaderboard_group_members")
    .update({ status })
    .eq("group_id", groupId)
    .eq("user_id", userId);
    
  if (error) throw error;
}


// src/services/leaderboardGroupService.ts
export async function deleteGroup(groupId: string): Promise<void> {
    // this will cascade and delete its memberships too (because of ON DELETE CASCADE)
    const { error } = await supabase
      .from("leaderboard_groups")
      .delete()
      .eq("id", groupId);
  
    if (error) throw error;
  }

export async function removeMember(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("leaderboard_group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) throw error;
}