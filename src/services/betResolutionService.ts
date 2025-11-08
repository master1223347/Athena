import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/admin';

export interface BetResolution {
  gambleId: string;
  userId: string;
  assignmentId: string;
  betAmount: number;
  multiplier: number;
  requiredScore: number;
  actualScore: number | null;
  won: boolean;
  pointsAwarded: number;
}

export class BetResolutionService {
  /**
   * Check if user is premium
   */
  static async isPremiumUser(userId: string): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', userId)
        .single();
      
      return (profile as any)?.plan === 'premium';
    } catch (error) {
      console.error('Error checking user plan:', error);
      return false;
    }
  }

  /**
   * Check and resolve all pending bets for a user
   */
  static async resolveUserBets(userId: string): Promise<BetResolution[]> {
    try {
      // Only fetch unresolved gambles that have a milestone attached
      const { data: gambles, error: gamblesError } = await supabase
        .from('gambles')
        .select('id, user_id, milestone_id, amount, multiplier, base_score')
        .eq('user_id', userId)
        .eq('resolved', false)
        .not('milestone_id', 'is', null);
  
      if (gamblesError || !gambles) {
        console.error('Error fetching gambles:', gamblesError);
        return [];
      }
  
      const resolutions: BetResolution[] = [];
  
      for (const gamble of gambles) {
        const resolution = await this.resolveSingleBet(gamble);
        if (resolution) resolutions.push(resolution);
      }
  
      return resolutions;
    } catch (error) {
      console.error('Error resolving user bets:', error);
      return [];
    }
  }
  

  /**
   * Resolve a single bet
   */
  static async resolveSingleBet(gamble: any): Promise<BetResolution | null> {
    try {
      // Find the corresponding milestone/assignment
      const { data: milestone, error: milestoneError } = await supabase
        .from('milestones')
        .select('*')
        .eq('id', gamble.milestone_id)
        .single();

      if (milestoneError || !milestone) {
        console.log(`Milestone not found for gamble ${gamble.id}`);
        return null;
      }

      // Check if assignment has been graded
      if (!milestone.grade || milestone.status !== 'completed') {
        console.log(`Assignment ${milestone.id} not yet graded`);
        return null;
      }

      // Calculate percentage score: (grade / points_possible) * 100
      const rawScore = milestone.grade;
      const pointsPossible = milestone.points_possible || 100; // Default to 100 if not specified
      const actualScore = Math.round((rawScore / pointsPossible) * 100);
      
      console.log(`Score calculation: ${rawScore} / ${pointsPossible} * 100 = ${actualScore}%`);
      
      const requiredScore = this.calculateRequiredScore(gamble.baseScore, gamble.multiplier);
      const won = actualScore >= requiredScore;
      const pointsAwarded = won ? gamble.amount * gamble.multiplier : 0;

      console.log(`Bet resolution: Required ${requiredScore}%, Got ${actualScore}%, Won: ${won}`);

      // Create resolution object
      const resolution: BetResolution = {
        gambleId: gamble.id,
        userId: gamble.user_id,
        assignmentId: milestone.id,
        betAmount: gamble.amount,
        multiplier: gamble.multiplier,
        requiredScore,
        actualScore,
        won,
        pointsAwarded
      };

      // Award points if won
      if (won) {
        await this.awardPoints(gamble.user_id, pointsAwarded);
      }

      // Mark gamble as resolved
      await this.markGambleResolved(gamble.id, resolution);

      return resolution;
    } catch (error) {
      console.error('Error resolving single bet:', error);
      return null;
    }
  }

  /**
   * Award points to a user
   */
  static async awardPoints(userId: string, points: number): Promise<void> {
    try {
      // Use the new achievement points service for consistency
      const { AchievementPointsService } = await import('./achievementPointsService');
      await AchievementPointsService.awardWinnings(userId, points);
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  }

  /**
   * Mark a gamble as resolved
   */
  static async markGambleResolved(gambleId: string, resolution: BetResolution): Promise<void> {
    try {
      const { error } = await supabase
        .from('gambles')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          won: resolution.won,
          points_awarded: resolution.pointsAwarded,
          actual_score: resolution.actualScore
        })
        .eq('id', gambleId);

      if (error) {
        console.error('Error marking gamble resolved:', error);
      }
    } catch (error) {
      console.error('Error marking gamble resolved:', error);
    }
  }

  /**
   * Calculate required score based on base score and multiplier
   */
  static calculateRequiredScore(baseScore: number, multiplier: number): number {
    if (multiplier <= 1.0) {
      return baseScore;
    }
    const multiplierIncrements = (multiplier - 1.0) * 10;
    const exponentialFactor = Math.pow(1.17, multiplierIncrements) - 1;
    const scoreIncrease = baseScore * exponentialFactor;
    const requiredScore = baseScore + scoreIncrease;
    return Math.min(100, Math.round(requiredScore));
  }

  /**
   * Create a fake assignment for testing
   */
  static async createFakeAssignment(userId: string, courseId: string): Promise<string> {
    try {
      const fakeMilestone = {
        title: 'Fake Test Assignment',
        description: 'This is a fake assignment for testing gambling functionality',
        course_id: courseId,
        user_id: userId,
        canvas_id: `fake_${Date.now()}`,
        status: 'upcoming',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        progress: 0,
        type: 'assignment',
        points_possible: 100,
        grade: null,
        completed_date: null
      };

      const { data: milestone, error } = await supabase
        .from('milestones')
        .insert(fakeMilestone)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating fake assignment:', error);
        throw error;
      }

      return milestone.id;
    } catch (error) {
      console.error('Error creating fake assignment:', error);
      throw error;
    }
  }

  /**
   * Grade a fake assignment
   */
  static async gradeFakeAssignment(milestoneId: string, grade: number): Promise<void> {
    try {
      // Store the raw score (0-100) as the grade
      // The resolution logic will calculate the percentage: (grade / points_possible) * 100
      const { error } = await supabase
        .from('milestones')
        .update({
          status: 'completed',
          grade: grade, // This is the raw score (e.g., 85 out of 100)
          completed_date: new Date().toISOString(),
          progress: 100
        })
        .eq('id', milestoneId);

      if (error) {
        console.error('Error grading fake assignment:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error grading fake assignment:', error);
      throw error;
    }
  }

  /**
   * Pull latest assignment submission scores from Canvas and update gambles.actual_score
   * based on their linked milestone's Canvas assignment (via milestones.canvas_id).
   */
  static async updateGambleGradesFromCanvas(userId: string): Promise<{ updated: number }> {
    try {
      const { data: gambles, error } = await supabase
        .from('gambles')
        .select(`
          id,
          milestone_id,
          actual_score,
          milestones ( grade, points_possible, status )
        `)
        .eq('user_id', userId)
        .eq('resolved', false) // only update active gambles
        .not('milestone_id', 'is', null);
  
      if (error) throw error;
      if (!gambles || gambles.length === 0) return { updated: 0 };
  
      let updated = 0;
  
      // Batch updates efficiently
      const updates = gambles
        .filter(g => g.milestones?.grade != null)
        .map(g => {
          const score = g.milestones!.grade;
          const pointsPossible = g.milestones!.points_possible || 100;
          const percent = Math.round((score / pointsPossible) * 100);
          return { id: g.id, actual_score: percent };
        });
  
      for (const u of updates) {
        const { error: upErr } = await supabase
          .from('gambles')
          .update({ actual_score: u.actual_score })
          .eq('id', u.id);
        if (!upErr) updated++;
      }
  
      return { updated };
    } catch (error) {
      console.error('Error updating gamble grades from Canvas:', error);
      throw error;
    }
  }
}  