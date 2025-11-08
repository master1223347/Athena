import React, { useEffect, useState, KeyboardEvent } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  calculateLevel,
  LEVEL_THRESHOLDS,
} from "@/utils/achievement/levelUtils";
import { LEVEL_TITLES } from "@/components/achievements/AchievementStats";
import StreakDisplay from "@/components/streaks/StreakDisplay";
import UserStatsDisplay from "@/components/common/UserStatsDisplay";
import { AchievementPointsService } from "@/services/achievementPointsService";
import ScoreCalculationIcon from "@/components/common/ScoreCalculationIcon";

/* ─── shapes ─────────────────────────────────────────────────────────── */
type ScoreRow = { user_id: string; score: number };
type DisplayRow = { id: string; name: string; total: number; level: number };

/* ─── component ──────────────────────────────────────────────────────── */
const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();

  /* state */
  const [rows, setRows]               = useState<DisplayRow[]>([]);
  const [loading, setLoad]            = useState(true);
  const [myRank, setRank]             = useState<number | null>(null);
  const [levelSize, setLevelSize]     = useState<number | null>(null);
  const [myScore, setScore]           = useState<number | null>(null);
  const [myLevel, setMyLevel]         = useState<number | null>(null);
  const [ptsToNext, setPtsToNext]     = useState<number | null>(null);

  // Fallback function to load scores from achievements
  const loadScoresFromAchievements = async () => {
    try {
      console.log('Falling back to achievements-based scoring...');
      
      // Get all users from profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email");
      
      if (profilesError) {
        console.error(profilesError);
        toast.error("Couldn't load leaderboard");
        setLoad(false);
        return;
      }

      // Calculate points for each user based on their achievements
      const userPoints: Record<string, number> = {};
      
      console.log(`Processing ${profiles?.length || 0} users...`);
      
      for (const profile of profiles || []) {
        try {
          // Use getAvailablePoints to match the overall points display (includes gambling wins/losses)
          const totalPoints = await AchievementPointsService.getAvailablePoints(profile.id);
          userPoints[profile.id] = totalPoints;
        } catch (error) {
          console.error(`Error calculating points for user ${profile.id}:`, error);
          userPoints[profile.id] = 0;
        }
      }

      let myName = "You";
      if (user && user.user_metadata?.full_name) myName = user.user_metadata.full_name;

      const display: DisplayRow[] = Object.entries(userPoints)
        .map(([id, total]) => ({
          id,
          name: id === user?.id ? myName : (profiles?.find(p => p.id === id)?.full_name || "Anonymous"),
          total: Math.round(total * 100) / 100,
          level: calculateLevel(total),
        }))
        .sort((a, b) => b.total - a.total);
      
      setRows(display);

      // Calculate user's rank and level
      if (user) {
        const pts = userPoints[user.id] ? Math.round(userPoints[user.id] * 100) / 100 : null;
        setScore(pts);

        if (pts != null) {
          const lvl = calculateLevel(pts);
          setMyLevel(lvl);

          const levelUsers = display.filter((r) => r.level === lvl);
          const rankInLevel = levelUsers.findIndex((r) => r.id === user.id) + 1;
          setRank(rankInLevel);
          setLevelSize(levelUsers.length);

          const maxLvl = LEVEL_TITLES.length;
          const nextCut = lvl < maxLvl ? LEVEL_THRESHOLDS[lvl] : null;
          const toNext = nextCut != null ? Math.max(0, Math.round(nextCut - pts)) : null;
          setPtsToNext(toNext);
        }
      }
    } catch (error) {
      console.error('Error in fallback scoring:', error);
      toast.error('Failed to load leaderboard data');
    } finally {
      setLoad(false);
    }
  };

  /* ── fetch scores once we're opted‑in ── */
  useEffect(() => {
    (async () => {
      setLoad(true);
      
      try {
        // Query the leaderboard_scores table for alltime scores
        const { data: scores, error: scoresError } = await supabase
          .from("leaderboard_scores")
          .select(`
            id,
            user_id,
            score,
            assignments_completed,
            assignments_due,
            average_course_percentage,
            calculated_at,
            time_period
          `)
          .eq("time_period", "all_time")
          .order("score", { ascending: false });

        if (scoresError) {
          console.error("Error fetching leaderboard scores:", scoresError);
          toast.error("Couldn't load leaderboard");
          setLoad(false);
          return;
        }

        console.log(`Loaded ${scores?.length || 0} leaderboard scores`);

        if (!scores || scores.length === 0) {
          console.log('No scores found in leaderboard_scores table');
          // Fallback to the old method if no scores exist
          await loadScoresFromAchievements();
          return;
        }

        // Get user profiles for names
        const userIds = [...new Set(scores.map(s => s.user_id))];
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          // Continue without names, use Anonymous
        }

        // Create a map of user_id to profile data
        const profileMap = new Map();
        if (profiles) {
          profiles.forEach(profile => {
            profileMap.set(profile.id, profile);
          });
        }

        let myName = "You";
        if (user && user.user_metadata?.full_name) myName = user.user_metadata.full_name;

        // Calculate real-time points for the current user first
        let currentUserPoints: number | null = null;
        if (user) {
          try {
            // Get profile points to see gambling wins/losses
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('points')
              .eq('id', user.id)
              .single();
            
            // Use getAvailablePoints to match the overall points display (includes gambling wins/losses)
            currentUserPoints = await AchievementPointsService.getAvailablePoints(user.id);
          } catch (error) {
            console.error('❌ LEADERBOARD: Error calculating current user points:', error);
          }
        }

        const display: DisplayRow[] = scores.map((score, index) => {
          const profile = profileMap.get(score.user_id);
          const name = score.user_id === user?.id ? myName : (profile?.full_name || "Anonymous");
          
          // Use real-time points for the current user, cached score for others
          const actualScore = (score.user_id === user?.id && currentUserPoints !== null) 
            ? currentUserPoints 
            : score.score;
          const calculatedLevel = calculateLevel(actualScore);
          
          return {
            id: score.user_id,
            name,
            total: Math.round(actualScore * 100) / 100,
            level: calculatedLevel,
          };
        });

        // If current user is not in leaderboard_scores, add them
        if (user) {
          const existingUser = display.find(r => r.id === user.id);
          if (!existingUser && currentUserPoints !== null) {
            const userLevel = calculateLevel(currentUserPoints);
            
            display.push({
              id: user.id,
              name: user.user_metadata?.full_name || "You",
              total: Math.round(currentUserPoints * 100) / 100,
              level: userLevel,
            });
          }
        }
        
        // Sort by score to maintain proper ranking
        display.sort((a, b) => b.total - a.total);

        setRows(display);

        /* --- compute my rank within my current level --- */
        if (user) {
          // Get the current user's data from the display array
          const currentUserRow = display.find(r => r.id === user.id);
          
          if (currentUserRow) {
            const pts = currentUserRow.total;
            const lvl = currentUserRow.level;
            
            console.log(`✅ LEADERBOARD: Setting user score to ${pts}, level to ${lvl}`);
            
            // Set the user's score and level
            setScore(pts);
            setMyLevel(lvl);

            // Calculate rank within the user's level
            const levelUsers = display.filter((r) => r.level === lvl);
            const rankInLevel = levelUsers.findIndex((r) => r.id === user.id) + 1;
            setRank(rankInLevel);
            setLevelSize(levelUsers.length);

            const maxLvl = LEVEL_TITLES.length;
            const nextCut = lvl < maxLvl ? LEVEL_THRESHOLDS[lvl] : null;
            const toNext = nextCut != null ? Math.max(0, Math.round(nextCut - pts)) : null;
            setPtsToNext(toNext);
          }
        }
      } catch (error) {
        console.error("Error in leaderboard loading:", error);
        toast.error("Failed to load leaderboard");
      } finally {
        setLoad(false);
      }
    })();
  }, [user]);

  const rowsByLevel = rows.reduce<Record<number, DisplayRow[]>>((acc, row) => {
    (acc[row.level] ??= []).push(row);
    return acc;
  }, {});

  const myTier = rows.find((r) => r.id === user?.id)?.level ?? null;
  const displayedLevels = myTier
    ? [myTier]
    : Object.keys(rowsByLevel)
        .map(Number)
        .sort((a, b) => b - a);

  /* Generate a random code (placeholder logic) */
  const handleCreateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    // setGroupCode(code); // This state variable was removed
  };

  /* ─── render ───────────────────────────────────────────────────────── */
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header (matches ProgressPage style) */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* left: title + subtitle */}
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gambit Leaderboard
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mt-2">
              Compete with peers & climb the leaderboard
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Names are shown on the leaderboard (not anonymous) when available.
            </p>
          </div>
          
          {/* right: stats and streak displays */}
          <div className="flex gap-3">
            <UserStatsDisplay className="w-[350px] max-w-sm" compact />
            <StreakDisplay className="max-w-md" compact />
          </div>
        </div>


        {/* teaser OR leaderboard */}
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">No scores yet.</p>
        ) : (
          <div className="space-y-4">
            <div className="relative mb-0 mt-8">
              {/* Left: Your Score */}
              {myScore != null && myRank != null && levelSize != null && (
                <div className="absolute left-0 text-left" style={{ top: '2.2rem' }}>
                  <div className="text-sm leading-none">
                    <span className="text-black dark:text-white font-bold text-base">Your Score: <span className="text-blue-500">{myScore}</span> XP</span> • <span className="text-slate-600 dark:text-slate-400">Rank #{myRank} of {levelSize} users</span>
                  </div>
                </div>
              )}
              
              {/* Center: Rankings Title */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                  {LEVEL_TITLES[myLevel! - 1] ?? `Level ${myLevel}`} Rankings
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-none">
                  Compete with {rows.filter(r => r.level === myLevel).length} other users at your level
                </p>
              </div>
              
              {/* Right: Next Level and Calculator */}
              {myLevel != null && (
                <div className="absolute right-0 text-right" style={{ top: '1.15rem' }}>
                  <div className="flex items-center gap-1">
                    <div className="bg-transparent text-white w-9 h-9 rounded-xl text-sm font-semibold inline-flex items-center justify-center transition-colors duration-150 hover:bg-blue-600/20 hover:shadow-lg cursor-pointer">
                        <ScoreCalculationIcon className="!h-5 !w-5 !p-0 !bg-transparent !text-white" />
                    </div>
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold inline-block">
                      {ptsToNext && ptsToNext > 0 ? `${ptsToNext} pts to ${LEVEL_TITLES[myLevel] ?? `Level ${myLevel + 1}`}` : `Max Level!`}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {rows.filter(r => r.level === myLevel).length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">No other users found at your level.</p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  You're the only user at the {LEVEL_TITLES[myLevel! - 1] ?? `Level ${myLevel}`} level!
                </p>
              </div>
            ) : (
              <table className="w-full text-left bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                  <tr className="border-b border-slate-200 dark:border-slate-600">
                    <th className="py-3 px-2 font-semibold text-slate-700 dark:text-slate-300 w-12">#</th>
                    <th className="py-3 px-2 font-semibold text-slate-700 dark:text-slate-300">User</th>
                    <th className="py-3 px-2 font-semibold text-slate-700 dark:text-slate-300 text-right">XP</th>
                    <th className="py-3 px-2 font-semibold text-slate-700 dark:text-slate-300 text-right">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {rows
                    .filter(r => r.level === myLevel)
                    .map((r, index) => {
                      const isCurrent = r.id === user?.id;
                      
                      // Enhanced styling for current user row
                      const currentUserStyles = isCurrent 
                        ? "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-l-4 border-amber-400 shadow-lg ring-1 ring-amber-200/50 dark:ring-amber-700/50 font-semibold transition-all duration-300 ease-in-out" 
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200";

                      // medal for top 3
                      let rankLabel: React.ReactNode = index + 1;
                      if (index === 0) rankLabel = "🥇";
                      else if (index === 1) rankLabel = "🥈";
                      else if (index === 2) rankLabel = "🥉";

                      return (
                        <tr key={r.id} className={`${currentUserStyles}`}>
                          <td className={`py-3 px-2 ${isCurrent ? 'text-amber-700 dark:text-amber-300' : ''}`}>
                            {rankLabel}
                          </td>
                          <td className={`py-3 px-2 ${isCurrent ? 'text-amber-700 dark:text-amber-300' : ''}`}>
                            {isCurrent ? (
                              <span className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full shadow-sm"></div>
                                  <span className="font-semibold">{r.name}</span>
                                </div>
                                <Badge variant="secondary" className="bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-300 text-amber-900 border-amber-300 shadow-sm font-medium px-3 py-1 dark:from-amber-700/40 dark:via-yellow-700/40 dark:to-amber-700/40 dark:text-amber-100 dark:border-amber-600">
                                  You
                                </Badge>
                              </span>
                            ) : (
                              r.name
                            )}
                          </td>
                          <td className={`py-3 px-2 text-right ${isCurrent ? 'text-amber-700 dark:text-amber-300 font-semibold' : ''}`}>
                            {r.total}
                          </td>
                          <td className={`py-3 px-2 text-right ${isCurrent ? 'text-amber-700 dark:text-amber-300 font-semibold' : ''}`}>
                            {LEVEL_TITLES[r.level - 1] ?? `Level ${r.level}`}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default LeaderboardPage;
