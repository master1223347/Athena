import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Member = {
  user_id: string;
  joined_at: string;
  points: number;
  full_name: string;    // ← add this
};

type Group = {
  name: string;
  leaderboard_group_members: Member[];
};

export default function LeaderboardGroupsIdPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!groupId) return;

      // 1️⃣ fetch group + member rows
      const { data: grp, error: grpErr } = await supabase
        .from("leaderboard_groups")
        .select(`
          name,
          leaderboard_group_members (
            user_id,
            joined_at
          )
        `)
        .eq("id", groupId)
        .single();

      if (grpErr || !grp) {
        console.error("Error fetching group:", grpErr?.message);
        setLoading(false);
        return setGroup(null);
      }

      const members = grp.leaderboard_group_members;
      const userIds = members.map((m) => m.user_id);

      // 2️⃣ fetch profiles (to get full_name)
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")                // your public.profiles table
        .select("id, full_name")         
        .in("id", userIds);

      if (profErr) {
        console.error("Error fetching profiles:", profErr.message);
      }

      // 3️⃣ fetch each member’s all-time score
      const { data: scores, error: scoreErr } = await supabase
        .from("leaderboard_scores")
        .select("user_id, score")
        .eq("time_period", "all_time")
        .in("user_id", userIds);

      if (scoreErr) {
        console.error("Error fetching scores:", scoreErr.message);
      }

      // 4️⃣ merge it all together
      const enriched: Member[] = members.map((m) => {
        const profile = profiles?.find((p) => p.id === m.user_id);
        const scoreRow = scores?.find((s) => s.user_id === m.user_id);
        return {
          ...m,
          full_name: profile?.full_name ?? "Anonymous",
          points: scoreRow?.score ?? 0,
        };
      });

      setGroup({
        name: grp.name,
        leaderboard_group_members: enriched,
      });
      setLoading(false);
    };

    fetchLeaderboard();
  }, [groupId]);

  return (
    <MainLayout>
      <div className="mb-4">
        <Button variant="outline" onClick={() => navigate("/leaderboard/groups")}>
          ← Back to Groups
        </Button>
      </div>

      {loading ? (
        <p>Loading leaderboard…</p>
      ) : !group ? (
        <p className="text-red-500">Group not found or failed to load.</p>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-6">
            Name: <span className="text-muted-foreground">{group.name}</span>
          </h1>

          <div className="space-y-2">
            {group.leaderboard_group_members.length === 0 ? (
              <p className="text-muted-foreground">No members yet.</p>
            ) : (
              group.leaderboard_group_members.map((member) => (
                <div
                  key={member.user_id}
                  className="p-4 bg-muted rounded-md flex justify-between items-center"
                >
                  <div>
                    <p>👤 {member.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined: {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{member.points} pts</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </MainLayout>
  );
}
