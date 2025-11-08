import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { getMilestones } from '@/lib/milestones';

export type Gamble = Database['public']['Tables']['gambles']['Row'];
export type CreateGambleData = Database['public']['Tables']['gambles']['Insert'];

export interface GambleWithCourse extends Gamble {
  courses?: {
    title: string;
  } | null;
}

export interface TestScoreEstimate {
  baseScore: number;
  confidence: number;
  factors: string[];
}

export interface GamblingStats {
  totalGambled: number;
  totalWon: number;
  totalLost: number;
  activeGambles: number;
}

export interface UpcomingAssignment {
  id: string;
  name: string;
  course: string;
  courseId: string;
  dueDate: string;
  pointsPossible: number;
  type: string;
  status: string;
}

export class GamblingService {
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
   * Fetch upcoming assignments for gambling
   * Gets assignments due in the next 2 months (upcoming only, not completed)
   */
  static async getUpcomingAssignments(userId: string): Promise<UpcomingAssignment[]> {
    try {
      // Use direct Supabase query to bypass Redis filtering that removes some assignments
      const { data: directMilestones, error: directError } = await supabase
        .from('milestones')
        .select('*')
        .eq('user_id', userId);
        
      if (directError) {
        console.error('Error fetching milestones for gambling:', directError);
        return [];
      }

      const milestones = directMilestones || [];
      
      if (!milestones || milestones.length === 0) {
        return [];
      }

      // Get course information for each milestone
      const courseIds = [...new Set(milestones.map(m => m.course_id))];
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', courseIds);

      if (coursesError) {
        console.error('Error fetching courses for gambling:', coursesError);
        return [];
      }

      const courseMap = new Map(courses?.map(c => [c.id, c.title]) || []);
      
      // Calculate date ranges - 2 months from now
      const now = new Date();
      const twoMonthsFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days
      
      const upcomingAssignments = milestones
        .filter(milestone => {
          // Always include fake assignments for testing
          if (milestone.title === 'Fake Test Assignment') {
            return true;
          }
          
          // Only include quizzes and tests
          const assignmentType = milestone.type?.toLowerCase() || '';
          const isQuizOrTest = assignmentType.includes('quiz') || 
                              assignmentType.includes('test') || 
                              assignmentType.includes('exam') ||
                              assignmentType.includes('assessment');
          
          if (!isQuizOrTest) {
            return false;
          }
          
          // Only exclude if actually graded (can't bet on assignments with known outcomes)
          // Grade of 0 is often just a placeholder, not an actual grade
          if (milestone.grade !== null && milestone.grade !== 0) {
            return false;
          }
          
          const dueDate = milestone.due_date ? new Date(milestone.due_date) : null;
          
          // Only include if due in next 2 months (upcoming assignments only)
          if (dueDate && dueDate >= now && dueDate <= twoMonthsFromNow) {
            return true;
          }
          
          // If no due date but not graded, include it (ongoing assignment)
          if (!dueDate && (milestone.grade === null || milestone.grade === 0)) {
            return true;
          }
          
          return false;
        })
        .map(milestone => ({
          id: milestone.id,
          name: milestone.title,
          course: courseMap.get(milestone.course_id) || 'Unknown Course',
          courseId: milestone.course_id,
          dueDate: milestone.due_date || '',
          pointsPossible: milestone.points_possible || 0,
          type: milestone.type,
          status: milestone.status,
        }))
        .sort((a, b) => {
          // Sort by due date, with upcoming assignments first
          const aDue = new Date(a.dueDate);
          const bDue = new Date(b.dueDate);
          return aDue.getTime() - bDue.getTime();
        });

      return upcomingAssignments;
    } catch (error) {
      console.error('Error fetching upcoming assignments for gambling:', error);
      return [];
    }
  }

  /**
   * Create a new gamble for a user
   */
  static async createGamble(data: CreateGambleData & { 
    multiplier: number;
    milestone_id: string;
    base_score: number;
  }): Promise<Gamble | null> {
    try {
      // Import here to avoid circular dependency
      const { AchievementPointsService } = await import('./achievementPointsService');
      
      // Validate that the assignment is still bettable (not completed)
      const { data: milestone, error: milestoneError } = await supabase
        .from('milestones')
        .select('*')
        .eq('id', data.milestone_id)
        .single();

      if (milestoneError || !milestone) {
        console.error('Assignment not found for betting:', milestoneError);
        return null;
      }

      // Check if assignment is already graded (can't bet on graded assignments)
      // Grade of 0 is often just a placeholder, not an actual grade
      if (milestone.grade !== null && milestone.grade !== 0) {
        console.error('Cannot bet on already graded assignment:', milestone.title);
        return null;
      }

      // Check if assignment is past due (unless it's a fake assignment for testing)
      if (milestone.title !== 'Fake Test Assignment' && milestone.due_date) {
        const dueDate = new Date(milestone.due_date);
        const now = new Date();
        if (dueDate < now) {
          console.error('Cannot bet on past due assignment:', milestone.title);
          return null;
        }
      }
      
      // Check if user has enough points
      const canDeduct = await AchievementPointsService.deductPointsForBet(data.user_id, data.amount);
      if (!canDeduct) {
        console.error('Insufficient points for bet');
        return null;
      }

      const { data: gamble, error } = await supabase
        .from('gambles')
        .insert({
          ...data,
          resolved: false // Ensure new gambles are marked as unresolved
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating gamble:', error);
        return null;
      }

      return gamble;
    } catch (error) {
      console.error('Error creating gamble:', error);
      return null;
    }
  }

  /**
   * Get all gambles for a user
   */
  static async getUserGambles(userId: string): Promise<GambleWithCourse[]> {
    try {
      // Try the joined query first
      const { data: gamblesWithCourses, error: joinedError } = await supabase
        .from('gambles')
        .select(`
          *,
          courses(title)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // If the joined query fails, fall back to just gambles
      if (joinedError || !gamblesWithCourses) {
        const { data: basicGambles, error: basicError } = await supabase
          .from('gambles')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (basicError) {
          console.error('Error fetching user gambles:', basicError);
          return [];
        }

        // Convert to GambleWithCourse format without course info
        return (basicGambles || []).map(gamble => ({
          ...gamble,
          courses: null
        }));
      }

      return gamblesWithCourses || [];
    } catch (error) {
      console.error('Error fetching user gambles:', error);
      return [];
    }
  }

  /**
   * Get gambling statistics for a user
   */
  static async getGamblingStats(userId: string): Promise<GamblingStats> {
    try {
      const gambles = await this.getUserGambles(userId);
      
      const totalGambled = gambles.reduce((sum, gamble) => sum + gamble.amount, 0);
      const activeGambles = gambles.filter(g => !g.resolved).length;
      
      // TODO: Implement win/loss calculation based on actual test scores
      const totalWon = 0;
      const totalLost = 0;

      return {
        totalGambled,
        totalWon,
        totalLost,
        activeGambles,
      };
    } catch (error) {
      console.error('Error calculating gambling stats:', error);
      return {
        totalGambled: 0,
        totalWon: 0,
        totalLost: 0,
        activeGambles: 0,
      };
    }
  }

  /**
   * Calculate AI-based score estimate for a test
   * This would integrate with an AI service to analyze past performance
   */
  static async calculateScoreEstimate(
    userId: string, 
    courseId: string, 
    testTitle: string
  ): Promise<TestScoreEstimate> {
    try {
      // Get user's past performance in this course
      const { data: milestones, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('type', 'assignment')
        .not('grade', 'is', null);

      if (error) {
        console.error('Error fetching milestones for score estimation:', error);
        return this.getDefaultScoreEstimate();
      }

      if (!milestones || milestones.length === 0) {
        return this.getDefaultScoreEstimate();
      }

      // Calculate average grade from past assignments
      const grades = milestones
        .map(m => m.grade)
        .filter(grade => grade !== null) as number[];

      if (grades.length === 0) {
        return this.getDefaultScoreEstimate();
      }

      const averageGrade = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
      
      // Calculate confidence based on consistency
      const variance = grades.reduce((sum, grade) => sum + Math.pow(grade - averageGrade, 2), 0) / grades.length;
      const standardDeviation = Math.sqrt(variance);
      const confidence = Math.max(0.3, Math.min(0.9, 1 - (standardDeviation / 20)));

      // Identify factors affecting the estimate
      const factors: string[] = [];
      if (grades.length < 3) factors.push('Limited historical data');
      if (standardDeviation > 10) factors.push('Inconsistent performance');
      if (averageGrade > 85) factors.push('Strong academic performance');
      if (averageGrade < 70) factors.push('Below average performance');

      let finalBaseScore = Math.round(averageGrade);
      
      // Enforce minimum base score of 65%
      if (finalBaseScore < 65) {
        factors.push(`Base score adjusted to 65% (was ${finalBaseScore}%)`);
        finalBaseScore = 65;
      }
      
      // Fix edge case: if base score is 100, default to 65
      if (finalBaseScore === 100) {
        finalBaseScore = 65;
        factors.push('Base score adjusted to 65% (was 100%)');
      }
      
      return {
        baseScore: finalBaseScore,
        confidence: Math.round(confidence * 100) / 100,
        factors,
      };
    } catch (error) {
      console.error('Error calculating score estimate:', error);
      return this.getDefaultScoreEstimate();
    }
  }

  /**
   * Calculate multiplier based on target score and base score
   * New system: exponential growth where each 0.1x increment adds more difficulty
   */
  static calculateMultiplier(baseScore: number, targetScore: number): number {
    if (targetScore <= baseScore) {
      return 1.0; // No multiplier if target is at or below base
    }

    // Calculate score increase
    const scoreIncrease = targetScore - baseScore;
    
    // Reverse the exponential formula: scoreIncrease = base * (1.1^increments - 1)
    // So: increments = log((scoreIncrease/base + 1)) / log(1.1)
    const ratio = scoreIncrease / baseScore;
    const multiplierIncrements = Math.log(ratio + 1) / Math.log(1.1);
    const multiplier = 1.0 + (multiplierIncrements * 0.1);
    
    // Cap at 2x for free users
    return Math.min(2.0, Math.round(multiplier * 10) / 10);
  }

  /**
   * Calculate required score for a given multiplier
   * Free users (1.5x max): 65% → 70% → 77% → 85% → 95% → 100%
   * Premium users (5x max): More gradual progression up to 100%
   * Minimum base score is 65%
   */
  static calculateRequiredScore(baseScore: number, multiplier: number, maxMultiplier: number = 1.5): number {
    // Ensure minimum base score of 65%
    const effectiveBaseScore = Math.max(65, baseScore);
    
    if (multiplier <= 1.0) {
      return effectiveBaseScore;
    }

    // Premium users (5x multiplier) get more gradual progression
    if (maxMultiplier >= 5.0) {
      // Premium progression: spread 35 points (65→100) across 4.0x range (1.0→5.0)
      // More gradual: ~8.75 points per 1.0x increment
      const multiplierTargets = [
        { multiplier: 1.0, score: effectiveBaseScore },      // 65%
        { multiplier: 1.5, score: effectiveBaseScore + 4 },  // 69% (+4)
        { multiplier: 2.0, score: effectiveBaseScore + 9 },  // 74% (+5)
        { multiplier: 2.5, score: effectiveBaseScore + 14 }, // 79% (+5)
        { multiplier: 3.0, score: effectiveBaseScore + 20 }, // 85% (+6)
        { multiplier: 3.5, score: effectiveBaseScore + 25 }, // 90% (+5)
        { multiplier: 4.0, score: effectiveBaseScore + 30 }, // 95% (+5)
        { multiplier: 4.5, score: effectiveBaseScore + 33 }, // 98% (+3)
        { multiplier: 5.0, score: effectiveBaseScore + 35 }, // 100% (+2)
      ];

      // Find the appropriate range
      for (let i = 1; i < multiplierTargets.length; i++) {
        const prev = multiplierTargets[i - 1];
        const curr = multiplierTargets[i];
        
        if (multiplier <= curr.multiplier) {
          // Interpolate between the two points
          const progress = (multiplier - prev.multiplier) / (curr.multiplier - prev.multiplier);
          const scoreRange = curr.score - prev.score;
          const requiredScore = prev.score + (progress * scoreRange);
          
          // Cap at 100% maximum
          return Math.min(100, Math.round(requiredScore));
        }
      }
      
      // For multipliers above 5.0x (shouldn't happen, but handle it)
      return 100;
    }

    // Free users (1.5x max): steeper progression
    const multiplierTargets = [
      { multiplier: 1.0, score: effectiveBaseScore },
      { multiplier: 1.1, score: effectiveBaseScore + 5 },   // +5 points (65→70)
      { multiplier: 1.2, score: effectiveBaseScore + 12 },  // +7 points (70→77) 
      { multiplier: 1.3, score: effectiveBaseScore + 20 },  // +8 points (77→85)
      { multiplier: 1.4, score: effectiveBaseScore + 30 },  // +10 points (85→95)
      { multiplier: 1.5, score: effectiveBaseScore + 35 },  // +5 points (95→100)
    ];

    // Find the appropriate range
    for (let i = 1; i < multiplierTargets.length; i++) {
      const prev = multiplierTargets[i - 1];
      const curr = multiplierTargets[i];
      
      if (multiplier <= curr.multiplier) {
        // Interpolate between the two points
        const progress = (multiplier - prev.multiplier) / (curr.multiplier - prev.multiplier);
        const scoreRange = curr.score - prev.score;
        const requiredScore = prev.score + (progress * scoreRange);
        
        // Cap at 100% maximum
        return Math.min(100, Math.round(requiredScore));
      }
    }
    
    // For multipliers above 1.5x (free users shouldn't reach here)
    return Math.min(100, effectiveBaseScore + 35);
  }

  /**
   * Check if user is a free user (for limits)
   */
  static async isFreeUser(userId: string): Promise<boolean> {
    return !(await this.isPremiumUser(userId));
  }

  /**
   * Get gambling limits for free users
   */
  static async getFreeUserLimits(userId: string) {
    const isPremium = await this.isPremiumUser(userId);
    
    if (isPremium) {
      return {
        maxMultiplier: 5.0, // Unlimited for premium
        maxBetPercentage: 1.0, // 100% of total points for premium
      };
    }
    
    return {
      maxMultiplier: 1.5,
      maxBetPercentage: 0.1, // 10% of total points
    };
  }

  /**
   * Validate if a gamble is allowed for the user
   */
  static async validateGamble(
    userId: string,
    betAmount: number, 
    multiplier: number, 
    totalPoints: number
  ): Promise<{ isValid: boolean; error?: string }> {
    const isPremium = await this.isPremiumUser(userId);
    
    if (!isPremium) {
      const limits = await this.getFreeUserLimits(userId);
      
      if (multiplier > limits.maxMultiplier) {
        return { 
          isValid: false, 
          error: `Free users are limited to ${limits.maxMultiplier}x multiplier` 
        };
      }
      
      // Get the user's total achievement points (including partial progress) for percentage calculation
      const { AchievementPointsService } = await import('./achievementPointsService');
      const totalAchievementPoints = await AchievementPointsService.getTotalAchievementPoints(userId);
      const maxBetAmount = totalAchievementPoints * limits.maxBetPercentage;
      
      if (betAmount > maxBetAmount) {
        return { 
          isValid: false, 
          error: `Free users can only bet up to ${Math.round(maxBetAmount)} points (${limits.maxBetPercentage * 100}% of your ${totalAchievementPoints} achievement points)` 
        };
      }
    }

    if (betAmount <= 0) {
      return { isValid: false, error: 'Bet amount must be greater than 0' };
    }

    if (betAmount > totalPoints) {
      return { isValid: false, error: 'Bet amount cannot exceed available points' };
    }

    return { isValid: true };
  }

  /**
   * Get user's total spendable points for gambling
   */
  static async getUserSpendablePoints(userId: string): Promise<number> {
    try {
      // Import here to avoid circular dependency
      const { AchievementPointsService } = await import('./achievementPointsService');
      return await AchievementPointsService.getTotalSpendablePoints(userId);
    } catch (error) {
      console.error('Error getting user spendable points:', error);
      return 0;
    }
  }

  private static getDefaultScoreEstimate(): TestScoreEstimate {
    return {
      baseScore: 65,
      confidence: 0.5,
      factors: ['No historical data available - using default base score'],
    };
  }
} 