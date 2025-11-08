import { supabase } from '@/integrations/supabase/client';
import { WEEKLY_ACHIEVEMENTS, WeeklyAchievement, getWeeklyAchievementsByCategory } from '@/data/weeklyAchievements';
import { toast } from 'sonner';

export interface WeeklyAchievementData {
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  assignments: CanvasAssignmentData[];
  courses: CanvasCourseData[];
  previousWeekData?: WeeklyAchievementData;
}

export interface CanvasAssignmentData {
  id: string;
  courseId: string;
  title: string;
  type: 'assignment' | 'exam' | 'project' | 'reading' | 'other';
  score?: number;
  possible?: number;
  dueDate?: Date;
  submittedAt?: Date;
  status: 'completed' | 'in-progress' | 'at-risk' | 'upcoming';
  grade?: number;
}

export interface CanvasCourseData {
  id: string;
  title: string;
  code: string;
  progress: number;
  grade?: number;
  term: string;
}

export interface WeeklyAchievementResult {
  achievement: WeeklyAchievement;
  unlocked: boolean;
  progress: number;
  data: any;
}

/**
 * Service for detecting and processing weekly achievements based on Canvas LMS data
 */
export class WeeklyAchievementService {
  
  /**
   * Check all weekly achievements for a user
   */
  static async checkWeeklyAchievements(
    userId: string, 
    weekStart: Date, 
    weekEnd: Date
  ): Promise<WeeklyAchievementResult[]> {
    try {
      console.log(`🔍 Checking weekly achievements for user ${userId} (${weekStart.toISOString()} - ${weekEnd.toISOString()})`);
      
      // Get Canvas data for the week
      const weeklyData = await this.getWeeklyCanvasData(userId, weekStart, weekEnd);
      
      // Get previous week data for comparison achievements
      const previousWeekStart = new Date(weekStart);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);
      const previousWeekEnd = new Date(weekEnd);
      previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);
      const previousWeekData = await this.getWeeklyCanvasData(userId, previousWeekStart, previousWeekEnd);
      
      const results: WeeklyAchievementResult[] = [];
      
      // Check each achievement
      for (const achievement of WEEKLY_ACHIEVEMENTS) {
        const result = await this.checkSingleAchievement(
          achievement, 
          { ...weeklyData, previousWeekData }
        );
        results.push(result);
      }
      
      // Process unlocked achievements
      const unlockedAchievements = results.filter(r => r.unlocked);
      if (unlockedAchievements.length > 0) {
        await this.processUnlockedAchievements(userId, unlockedAchievements);
      }
      
      console.log(`✅ Checked ${results.length} weekly achievements, ${unlockedAchievements.length} unlocked`);
      return results;
      
    } catch (error) {
      console.error('Error checking weekly achievements:', error);
      return [];
    }
  }
  
  /**
   * Get Canvas data for a specific week
   */
  private static async getWeeklyCanvasData(
    userId: string, 
    weekStart: Date, 
    weekEnd: Date
  ): Promise<WeeklyAchievementData> {
    try {
      // Get assignments due in this week
      const { data: assignments, error: assignmentsError } = await supabase
        .from('milestones')
        .select(`
          id,
          course_id,
          title,
          type,
          grade,
          points_possible,
          due_date,
          completed_date,
          status,
          progress
        `)
        .eq('user_id', userId)
        .gte('due_date', weekStart.toISOString())
        .lte('due_date', weekEnd.toISOString());
      
      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        throw assignmentsError;
      }
      
      // Get courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          code,
          progress,
          grade,
          term
        `)
        .eq('user_id', userId);
      
      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        throw coursesError;
      }
      
      // Transform assignment data
      const assignmentData: CanvasAssignmentData[] = (assignments || []).map(assignment => ({
        id: assignment.id,
        courseId: assignment.course_id,
        title: assignment.title,
        type: assignment.type as any,
        score: assignment.grade,
        possible: assignment.points_possible,
        dueDate: assignment.due_date ? new Date(assignment.due_date) : undefined,
        submittedAt: assignment.completed_date ? new Date(assignment.completed_date) : undefined,
        status: assignment.status as any,
        grade: assignment.grade
      }));
      
      // Transform course data
      const courseData: CanvasCourseData[] = (courses || []).map(course => ({
        id: course.id,
        title: course.title,
        code: course.code,
        progress: course.progress || 0,
        grade: course.grade,
        term: course.term
      }));
      
      return {
        userId,
        weekStart,
        weekEnd,
        assignments: assignmentData,
        courses: courseData
      };
      
    } catch (error) {
      console.error('Error getting weekly Canvas data:', error);
      throw error;
    }
  }
  
  /**
   * Check a single achievement using comprehensive logic
   */
  private static async checkSingleAchievement(
    achievement: WeeklyAchievement,
    data: WeeklyAchievementData & { previousWeekData?: WeeklyAchievementData }
  ): Promise<WeeklyAchievementResult> {
    try {
      let unlocked = false;
      let progress = 0;
      let resultData: any = {};
      
      // First try specific implementations for better performance
      const specificResult = this.checkSpecificAchievement(achievement, data);
      if (specificResult !== null) {
        return specificResult;
      }
      
      // Fall back to generic calculation method parser
      const genericResult = this.checkGenericAchievementByMethod(achievement, data);
      return genericResult;
      
    } catch (error) {
      console.error(`Error checking achievement ${achievement.title}:`, error);
      return {
        achievement,
        unlocked: false,
        progress: 0,
        data: {}
      };
    }
  }

  /**
   * Check specific achievements with optimized implementations
   */
  private static checkSpecificAchievement(
    achievement: WeeklyAchievement,
    data: WeeklyAchievementData & { previousWeekData?: WeeklyAchievementData }
  ): WeeklyAchievementResult | null {
    const { title } = achievement;
    
    // Performance-based achievements
    if (title === "Perfect Week") {
      const unlocked = this.checkPerfectWeek(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculatePerfectWeekProgress(data),
        data: {}
      };
    }
    
    if (title === "A+ Week") {
      const unlocked = this.checkAPlusWeek(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculateAPlusWeekProgress(data),
        data: {}
      };
    }
    
    if (title === "Excellence Week") {
      const unlocked = this.checkExcellenceWeek(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculateExcellenceWeekProgress(data),
        data: {}
      };
    }
    
    if (title === "Strong Week") {
      const unlocked = this.checkStrongWeek(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculateStrongWeekProgress(data),
        data: {}
      };
    }
    
    if (title === "Solid Week") {
      const unlocked = this.checkSolidWeek(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculateSolidWeekProgress(data),
        data: {}
      };
    }
    
    // Completion-based achievements
    if (title === "Perfect Completion") {
      const unlocked = this.checkPerfectCompletion(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculatePerfectCompletionProgress(data),
        data: {}
      };
    }
    
    if (title === "Near Perfect") {
      const unlocked = this.checkNearPerfect(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculateNearPerfectProgress(data),
        data: {}
      };
    }
    
    if (title === "High Completion") {
      const unlocked = this.checkHighCompletion(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculateHighCompletionProgress(data),
        data: {}
      };
    }
    
    // Timing-based achievements
    if (title === "Early Bird") {
      const unlocked = this.checkEarlyBird(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculateEarlyBirdProgress(data),
        data: {}
      };
    }
    
    if (title === "Never Late") {
      const unlocked = this.checkNeverLate(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculateNeverLateProgress(data),
        data: {}
      };
    }
    
    // Engagement achievements
    if (title === "Multi-Course Master") {
      const unlocked = this.checkMultiCourseMaster(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculateMultiCourseMasterProgress(data),
        data: {}
      };
    }
    
    if (title === "Course Balancer") {
      const unlocked = this.checkCourseBalancer(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculateCourseBalancerProgress(data),
        data: {}
      };
    }
    
    // Assignment type achievements
    if (title === "Assignment Master") {
      const unlocked = this.checkAssignmentMaster(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculateAssignmentMasterProgress(data),
        data: {}
      };
    }
    
    if (title === "Reading Champion") {
      const unlocked = this.checkReadingChampion(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculateReadingChampionProgress(data),
        data: {}
      };
    }
    
    // Improvement achievements
    if (title === "Grade Climber") {
      const unlocked = this.checkGradeClimber(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculateGradeClimberProgress(data),
        data: {}
      };
    }
    
    if (title === "Consistent Improver") {
      const unlocked = this.checkConsistentImprover(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculateConsistentImproverProgress(data),
        data: {}
      };
    }
    
    // Streak achievements
    if (title === "Perfect Streak") {
      const unlocked = this.checkPerfectStreak(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculatePerfectStreakProgress(data),
        data: {}
      };
    }
    
    if (title === "Excellence Streak") {
      const unlocked = this.checkExcellenceStreak(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculateExcellenceStreakProgress(data),
        data: {}
      };
    }
    
    // Threshold achievements
    if (title === "90% Club") {
      const unlocked = this.check90Club(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculate90ClubProgress(data),
        data: {}
      };
    }
    
    if (title === "Assignment Heavy") {
      const unlocked = this.checkAssignmentHeavy(data);
      return {
        achievement,
        unlocked,
        progress: unlocked ? 100 : this.calculateAssignmentHeavyProgress(data),
        data: {}
      };
    }
    
    // Return null to indicate no specific implementation
    return null;
  }

  /**
   * Generic achievement checker based on calculationMethod
   */
  private static checkGenericAchievementByMethod(
    achievement: WeeklyAchievement,
    data: WeeklyAchievementData & { previousWeekData?: WeeklyAchievementData }
  ): WeeklyAchievementResult {
    const { calculationMethod, title, category } = achievement;
    
    try {
      let unlocked = false;
      let progress = 0;
      let resultData: any = {};
      
      // Parse calculation method to determine what to check
      const method = calculationMethod.toLowerCase();
      
      // Performance-based checks (grade thresholds)
      if (method.includes('average grade') && method.includes('>=')) {
        const threshold = this.extractThreshold(method);
        const averageGrade = this.calculateAverageGrade(data.assignments);
        unlocked = averageGrade >= threshold;
        progress = Math.min((averageGrade / threshold) * 100, 100);
        resultData = { averageGrade, threshold };
      }
      
      // Completion-based checks
      else if (method.includes('completion') && method.includes('%')) {
        const threshold = this.extractPercentage(method);
        const totalAssignments = data.assignments.length;
        const completedAssignments = data.assignments.filter(a => a.status === 'completed').length;
        const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
        unlocked = completionRate >= threshold;
        progress = Math.min(completionRate, 100);
        resultData = { completionRate, threshold, totalAssignments, completedAssignments };
      }
      
      // Timing-based checks
      else if (method.includes('submission') && method.includes('hours')) {
        const hoursRequired = this.extractHours(method);
        const percentageRequired = this.extractPercentage(method);
        const assignments = data.assignments.filter(a => a.submittedAt && a.dueDate);
        
        if (assignments.length === 0) {
          unlocked = false;
          progress = 0;
        } else {
          const earlySubmissions = assignments.filter(a => {
            const hoursEarly = (a.dueDate!.getTime() - a.submittedAt!.getTime()) / (1000 * 60 * 60);
            return hoursEarly >= hoursRequired;
          }).length;
          
          const earlyPercentage = (earlySubmissions / assignments.length) * 100;
          unlocked = earlyPercentage >= percentageRequired;
          progress = Math.min(earlyPercentage, 100);
          resultData = { earlyPercentage, threshold: percentageRequired, earlySubmissions, totalAssignments: assignments.length };
        }
      }
      
      // Course engagement checks
      else if (method.includes('courses') && method.includes('>=')) {
        const threshold = this.extractNumber(method);
        const completedAssignments = data.assignments.filter(a => a.status === 'completed');
        const uniqueCourses = new Set(completedAssignments.map(a => a.courseId));
        unlocked = uniqueCourses.size >= threshold;
        progress = Math.min((uniqueCourses.size / threshold) * 100, 100);
        resultData = { uniqueCourses: uniqueCourses.size, threshold };
      }
      
      // Assignment type variety checks
      else if (method.includes('assignment types') && method.includes('>=')) {
        const threshold = this.extractNumber(method);
        const completedAssignments = data.assignments.filter(a => a.status === 'completed');
        const types = new Set(completedAssignments.map(a => a.type));
        unlocked = types.size >= threshold;
        progress = Math.min((types.size / threshold) * 100, 100);
        resultData = { types: types.size, threshold, typesList: Array.from(types) };
      }
      
      // Grade improvement checks
      else if (method.includes('improvement') && method.includes('%')) {
        if (!data.previousWeekData) {
          unlocked = false;
          progress = 0;
        } else {
          const improvementThreshold = this.extractPercentage(method);
          const currentAverage = this.calculateAverageGrade(data.assignments);
          const previousAverage = this.calculateAverageGrade(data.previousWeekData.assignments);
          const improvement = currentAverage - previousAverage;
          unlocked = improvement >= improvementThreshold;
          progress = Math.min((improvement / improvementThreshold) * 100, 100);
          resultData = { improvement, threshold: improvementThreshold, currentAverage, previousAverage };
        }
      }
      
      // Streak checks (simplified - would need historical data for full implementation)
      else if (method.includes('consecutive') && method.includes('weeks')) {
        const weeksRequired = this.extractNumber(method);
        // For now, just check current week performance
        const currentWeekGood = this.checkCurrentWeekPerformance(achievement, data);
        unlocked = currentWeekGood && weeksRequired === 1; // Simplified
        progress = currentWeekGood ? 100 : 0;
        resultData = { weeksRequired, currentWeekGood };
      }
      
      // Threshold-based checks (specific grade counts)
      else if (method.includes('assignments') && method.includes('>=') && method.includes('%')) {
        const gradeThreshold = this.extractPercentage(method);
        const countThreshold = this.extractNumber(method);
        const highGradeAssignments = data.assignments.filter(a => {
          if (!a.score || !a.possible) return false;
          return (a.score / a.possible) * 100 >= gradeThreshold;
        });
        unlocked = highGradeAssignments.length >= countThreshold;
        progress = Math.min((highGradeAssignments.length / countThreshold) * 100, 100);
        resultData = { highGradeAssignments: highGradeAssignments.length, countThreshold, gradeThreshold };
      }
      
      // Volume-based checks (assignment count)
      else if (method.includes('assignments') && method.includes('>=') && !method.includes('%')) {
        const countThreshold = this.extractNumber(method);
        const completedAssignments = data.assignments.filter(a => a.status === 'completed');
        unlocked = completedAssignments.length >= countThreshold;
        progress = Math.min((completedAssignments.length / countThreshold) * 100, 100);
        resultData = { completedAssignments: completedAssignments.length, countThreshold };
      }
      
      // Point-based checks
      else if (method.includes('points') && method.includes('>=')) {
        const pointThreshold = this.extractNumber(method);
        const totalPoints = data.assignments.reduce((sum, a) => sum + (a.score || 0), 0);
        unlocked = totalPoints >= pointThreshold;
        progress = Math.min((totalPoints / pointThreshold) * 100, 100);
        resultData = { totalPoints, pointThreshold };
      }
      
      // Perfect grade checks (100% average)
      else if (method.includes('must be 100%') || method.includes('100%')) {
        const averageGrade = this.calculateAverageGrade(data.assignments);
        unlocked = averageGrade === 100;
        progress = Math.min(averageGrade, 100);
        resultData = { averageGrade, target: 100 };
      }
      
      // Perfect completion checks (100% completion)
      else if (method.includes('100%') && method.includes('completion')) {
        const totalAssignments = data.assignments.length;
        const completedAssignments = data.assignments.filter(a => a.status === 'completed').length;
        const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
        unlocked = completionRate === 100;
        progress = Math.min(completionRate, 100);
        resultData = { completionRate, target: 100, totalAssignments, completedAssignments };
      }
      
      // On-time submission checks
      else if (method.includes('none can be after due date') || method.includes('on or before due date')) {
        const assignments = data.assignments.filter(a => a.submittedAt && a.dueDate);
        if (assignments.length === 0) {
          unlocked = false;
          progress = 0;
        } else {
          const onTimeSubmissions = assignments.filter(a => a.submittedAt <= a.dueDate).length;
          const onTimePercentage = (onTimeSubmissions / assignments.length) * 100;
          unlocked = onTimePercentage === 100;
          progress = Math.min(onTimePercentage, 100);
          resultData = { onTimePercentage, target: 100, onTimeSubmissions, totalAssignments: assignments.length };
        }
      }
      
      // Assignment type completion checks
      else if (method.includes('all assignment types') || method.includes('all types')) {
        const completedAssignments = data.assignments.filter(a => a.status === 'completed');
        const types = new Set(completedAssignments.map(a => a.type));
        const allTypes = ['assignment', 'exam', 'project', 'reading'];
        const hasAllTypes = allTypes.every(type => types.has(type));
        unlocked = hasAllTypes;
        progress = (types.size / allTypes.length) * 100;
        resultData = { types: types.size, target: allTypes.length, typesList: Array.from(types), hasAllTypes };
      }
      
      // Reading assignment completion
      else if (method.includes('reading assignments') && method.includes('100%')) {
        const readingAssignments = data.assignments.filter(a => a.type === 'reading');
        const completedReading = readingAssignments.filter(a => a.status === 'completed');
        const completionRate = readingAssignments.length > 0 ? (completedReading.length / readingAssignments.length) * 100 : 0;
        unlocked = completionRate === 100;
        progress = Math.min(completionRate, 100);
        resultData = { completionRate, target: 100, readingAssignments: readingAssignments.length, completedReading: completedReading.length };
      }
      
      // Point threshold checks
      else if (method.includes('sum all assignment scores') || method.includes('earn') && method.includes('points')) {
        const pointThreshold = this.extractNumber(method);
        const totalPoints = data.assignments.reduce((sum, a) => sum + (a.score || 0), 0);
        unlocked = totalPoints >= pointThreshold;
        progress = Math.min((totalPoints / pointThreshold) * 100, 100);
        resultData = { totalPoints, pointThreshold };
      }
      
      // Default fallback
      else {
        console.warn(`Unrecognized calculation method for ${title}: ${calculationMethod}`);
        unlocked = false;
        progress = 0;
      }
      
      return {
        achievement,
        unlocked,
        progress,
        data: resultData
      };
      
    } catch (error) {
      console.error(`Error in generic achievement check for ${title}:`, error);
      return {
        achievement,
        unlocked: false,
        progress: 0,
        data: {}
      };
    }
  }
  
  // ========================================
  // PERFORMANCE-BASED ACHIEVEMENT CHECKS
  // ========================================
  
  private static checkPerfectWeek(data: WeeklyAchievementData): boolean {
    const assignments = data.assignments.filter(a => a.score !== undefined && a.possible !== undefined);
    if (assignments.length === 0) return false;
    
    const averageGrade = this.calculateAverageGrade(assignments);
    return averageGrade === 100;
  }
  
  private static calculatePerfectWeekProgress(data: WeeklyAchievementData): number {
    const assignments = data.assignments.filter(a => a.score !== undefined && a.possible !== undefined);
    if (assignments.length === 0) return 0;
    
    const averageGrade = this.calculateAverageGrade(assignments);
    return Math.min(averageGrade, 100);
  }
  
  private static checkAPlusWeek(data: WeeklyAchievementData): boolean {
    const assignments = data.assignments.filter(a => a.score !== undefined && a.possible !== undefined);
    if (assignments.length === 0) return false;
    
    const averageGrade = this.calculateAverageGrade(assignments);
    return averageGrade >= 95;
  }
  
  private static calculateAPlusWeekProgress(data: WeeklyAchievementData): number {
    const assignments = data.assignments.filter(a => a.score !== undefined && a.possible !== undefined);
    if (assignments.length === 0) return 0;
    
    const averageGrade = this.calculateAverageGrade(assignments);
    return Math.min((averageGrade / 95) * 100, 100);
  }
  
  private static checkExcellenceWeek(data: WeeklyAchievementData): boolean {
    const assignments = data.assignments.filter(a => a.score !== undefined && a.possible !== undefined);
    if (assignments.length === 0) return false;
    
    const averageGrade = this.calculateAverageGrade(assignments);
    return averageGrade >= 90;
  }
  
  private static calculateExcellenceWeekProgress(data: WeeklyAchievementData): number {
    const assignments = data.assignments.filter(a => a.score !== undefined && a.possible !== undefined);
    if (assignments.length === 0) return 0;
    
    const averageGrade = this.calculateAverageGrade(assignments);
    return Math.min((averageGrade / 90) * 100, 100);
  }
  
  private static checkStrongWeek(data: WeeklyAchievementData): boolean {
    const assignments = data.assignments.filter(a => a.score !== undefined && a.possible !== undefined);
    if (assignments.length === 0) return false;
    
    const averageGrade = this.calculateAverageGrade(assignments);
    return averageGrade >= 85;
  }
  
  private static calculateStrongWeekProgress(data: WeeklyAchievementData): number {
    const assignments = data.assignments.filter(a => a.score !== undefined && a.possible !== undefined);
    if (assignments.length === 0) return 0;
    
    const averageGrade = this.calculateAverageGrade(assignments);
    return Math.min((averageGrade / 85) * 100, 100);
  }
  
  private static checkSolidWeek(data: WeeklyAchievementData): boolean {
    const assignments = data.assignments.filter(a => a.score !== undefined && a.possible !== undefined);
    if (assignments.length === 0) return false;
    
    const averageGrade = this.calculateAverageGrade(assignments);
    return averageGrade >= 80;
  }
  
  private static calculateSolidWeekProgress(data: WeeklyAchievementData): number {
    const assignments = data.assignments.filter(a => a.score !== undefined && a.possible !== undefined);
    if (assignments.length === 0) return 0;
    
    const averageGrade = this.calculateAverageGrade(assignments);
    return Math.min((averageGrade / 80) * 100, 100);
  }
  
  // ========================================
  // COMPLETION-BASED ACHIEVEMENT CHECKS
  // ========================================
  
  private static checkPerfectCompletion(data: WeeklyAchievementData): boolean {
    const totalAssignments = data.assignments.length;
    const completedAssignments = data.assignments.filter(a => a.status === 'completed').length;
    
    if (totalAssignments === 0) return false;
    return (completedAssignments / totalAssignments) === 1;
  }
  
  private static calculatePerfectCompletionProgress(data: WeeklyAchievementData): number {
    const totalAssignments = data.assignments.length;
    const completedAssignments = data.assignments.filter(a => a.status === 'completed').length;
    
    if (totalAssignments === 0) return 0;
    return (completedAssignments / totalAssignments) * 100;
  }
  
  private static checkNearPerfect(data: WeeklyAchievementData): boolean {
    const totalAssignments = data.assignments.length;
    const completedAssignments = data.assignments.filter(a => a.status === 'completed').length;
    
    if (totalAssignments === 0) return false;
    return (completedAssignments / totalAssignments) >= 0.95;
  }
  
  private static calculateNearPerfectProgress(data: WeeklyAchievementData): number {
    const totalAssignments = data.assignments.length;
    const completedAssignments = data.assignments.filter(a => a.status === 'completed').length;
    
    if (totalAssignments === 0) return 0;
    return (completedAssignments / totalAssignments) * 100;
  }
  
  private static checkHighCompletion(data: WeeklyAchievementData): boolean {
    const totalAssignments = data.assignments.length;
    const completedAssignments = data.assignments.filter(a => a.status === 'completed').length;
    
    if (totalAssignments === 0) return false;
    return (completedAssignments / totalAssignments) >= 0.90;
  }
  
  private static calculateHighCompletionProgress(data: WeeklyAchievementData): number {
    const totalAssignments = data.assignments.length;
    const completedAssignments = data.assignments.filter(a => a.status === 'completed').length;
    
    if (totalAssignments === 0) return 0;
    return (completedAssignments / totalAssignments) * 100;
  }
  
  // ========================================
  // TIMING-BASED ACHIEVEMENT CHECKS
  // ========================================
  
  private static checkEarlyBird(data: WeeklyAchievementData): boolean {
    const assignments = data.assignments.filter(a => a.submittedAt && a.dueDate);
    if (assignments.length === 0) return false;
    
    const earlySubmissions = assignments.filter(a => {
      const hoursEarly = (a.dueDate!.getTime() - a.submittedAt!.getTime()) / (1000 * 60 * 60);
      return hoursEarly >= 24;
    }).length;
    
    return (earlySubmissions / assignments.length) >= 0.80;
  }
  
  private static calculateEarlyBirdProgress(data: WeeklyAchievementData): number {
    const assignments = data.assignments.filter(a => a.submittedAt && a.dueDate);
    if (assignments.length === 0) return 0;
    
    const earlySubmissions = assignments.filter(a => {
      const hoursEarly = (a.dueDate!.getTime() - a.submittedAt!.getTime()) / (1000 * 60 * 60);
      return hoursEarly >= 24;
    }).length;
    
    return (earlySubmissions / assignments.length) * 100;
  }
  
  private static checkNeverLate(data: WeeklyAchievementData): boolean {
    const assignments = data.assignments.filter(a => a.submittedAt && a.dueDate);
    if (assignments.length === 0) return false;
    
    const onTimeSubmissions = assignments.filter(a => {
      return a.submittedAt! <= a.dueDate!;
    }).length;
    
    return (onTimeSubmissions / assignments.length) === 1;
  }
  
  private static calculateNeverLateProgress(data: WeeklyAchievementData): number {
    const assignments = data.assignments.filter(a => a.submittedAt && a.dueDate);
    if (assignments.length === 0) return 0;
    
    const onTimeSubmissions = assignments.filter(a => {
      return a.submittedAt! <= a.dueDate!;
    }).length;
    
    return (onTimeSubmissions / assignments.length) * 100;
  }
  
  // ========================================
  // ENGAGEMENT ACHIEVEMENT CHECKS
  // ========================================
  
  private static checkMultiCourseMaster(data: WeeklyAchievementData): boolean {
    const completedAssignments = data.assignments.filter(a => a.status === 'completed');
    const uniqueCourses = new Set(completedAssignments.map(a => a.courseId));
    return uniqueCourses.size >= 3;
  }
  
  private static calculateMultiCourseMasterProgress(data: WeeklyAchievementData): number {
    const completedAssignments = data.assignments.filter(a => a.status === 'completed');
    const uniqueCourses = new Set(completedAssignments.map(a => a.courseId));
    return Math.min((uniqueCourses.size / 3) * 100, 100);
  }
  
  private static checkCourseBalancer(data: WeeklyAchievementData): boolean {
    const activeCourses = data.courses.length;
    const coursesWithAssignments = new Set(data.assignments.map(a => a.courseId)).size;
    return coursesWithAssignments === activeCourses;
  }
  
  private static calculateCourseBalancerProgress(data: WeeklyAchievementData): number {
    const activeCourses = data.courses.length;
    const coursesWithAssignments = new Set(data.assignments.map(a => a.courseId)).size;
    return (coursesWithAssignments / activeCourses) * 100;
  }
  
  // ========================================
  // ASSIGNMENT TYPE ACHIEVEMENT CHECKS
  // ========================================
  
  private static checkAssignmentMaster(data: WeeklyAchievementData): boolean {
    const completedAssignments = data.assignments.filter(a => a.status === 'completed');
    const types = new Set(completedAssignments.map(a => a.type));
    return types.size >= 4; // assignment, exam, project, reading
  }
  
  private static calculateAssignmentMasterProgress(data: WeeklyAchievementData): number {
    const completedAssignments = data.assignments.filter(a => a.status === 'completed');
    const types = new Set(completedAssignments.map(a => a.type));
    return Math.min((types.size / 4) * 100, 100);
  }
  
  private static checkReadingChampion(data: WeeklyAchievementData): boolean {
    const readingAssignments = data.assignments.filter(a => a.type === 'reading');
    const completedReading = readingAssignments.filter(a => a.status === 'completed');
    return readingAssignments.length > 0 && (completedReading.length / readingAssignments.length) === 1;
  }
  
  private static calculateReadingChampionProgress(data: WeeklyAchievementData): number {
    const readingAssignments = data.assignments.filter(a => a.type === 'reading');
    const completedReading = readingAssignments.filter(a => a.status === 'completed');
    if (readingAssignments.length === 0) return 0;
    return (completedReading.length / readingAssignments.length) * 100;
  }
  
  // ========================================
  // IMPROVEMENT ACHIEVEMENT CHECKS
  // ========================================
  
  private static checkGradeClimber(data: WeeklyAchievementData & { previousWeekData?: WeeklyAchievementData }): boolean {
    if (!data.previousWeekData) return false;
    
    const currentAverage = this.calculateAverageGrade(data.assignments);
    const previousAverage = this.calculateAverageGrade(data.previousWeekData.assignments);
    
    return currentAverage > previousAverage && (currentAverage - previousAverage) >= 10;
  }
  
  private static calculateGradeClimberProgress(data: WeeklyAchievementData & { previousWeekData?: WeeklyAchievementData }): number {
    if (!data.previousWeekData) return 0;
    
    const currentAverage = this.calculateAverageGrade(data.assignments);
    const previousAverage = this.calculateAverageGrade(data.previousWeekData.assignments);
    
    if (currentAverage <= previousAverage) return 0;
    return Math.min(((currentAverage - previousAverage) / 10) * 100, 100);
  }
  
  private static checkConsistentImprover(data: WeeklyAchievementData & { previousWeekData?: WeeklyAchievementData }): boolean {
    // This would require historical data - simplified for now
    return this.checkGradeClimber(data);
  }
  
  private static calculateConsistentImproverProgress(data: WeeklyAchievementData & { previousWeekData?: WeeklyAchievementData }): number {
    return this.calculateGradeClimberProgress(data);
  }
  
  // ========================================
  // STREAK ACHIEVEMENT CHECKS
  // ========================================
  
  private static checkPerfectStreak(data: WeeklyAchievementData): boolean {
    // This would require historical data - simplified for now
    return this.checkPerfectCompletion(data);
  }
  
  private static calculatePerfectStreakProgress(data: WeeklyAchievementData): number {
    return this.calculatePerfectCompletionProgress(data);
  }
  
  private static checkExcellenceStreak(data: WeeklyAchievementData): boolean {
    // This would require historical data - simplified for now
    return this.checkExcellenceWeek(data);
  }
  
  private static calculateExcellenceStreakProgress(data: WeeklyAchievementData): number {
    return this.calculateExcellenceWeekProgress(data);
  }
  
  // ========================================
  // THRESHOLD ACHIEVEMENT CHECKS
  // ========================================
  
  private static check90Club(data: WeeklyAchievementData): boolean {
    const highGradeAssignments = data.assignments.filter(a => {
      if (!a.score || !a.possible) return false;
      return (a.score / a.possible) >= 0.90;
    });
    return highGradeAssignments.length >= 5;
  }
  
  private static calculate90ClubProgress(data: WeeklyAchievementData): number {
    const highGradeAssignments = data.assignments.filter(a => {
      if (!a.score || !a.possible) return false;
      return (a.score / a.possible) >= 0.90;
    });
    return Math.min((highGradeAssignments.length / 5) * 100, 100);
  }
  
  private static checkAssignmentHeavy(data: WeeklyAchievementData): boolean {
    const completedAssignments = data.assignments.filter(a => a.status === 'completed');
    return completedAssignments.length >= 10;
  }
  
  private static calculateAssignmentHeavyProgress(data: WeeklyAchievementData): number {
    const completedAssignments = data.assignments.filter(a => a.status === 'completed');
    return Math.min((completedAssignments.length / 10) * 100, 100);
  }
  
  // ========================================
  // UTILITY METHODS FOR PARSING CALCULATION METHODS
  // ========================================
  
  private static extractThreshold(method: string): number {
    // Extract threshold from method like "Must be >= 95%"
    const match = method.match(/>=\s*(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }
  
  private static extractPercentage(method: string): number {
    // Extract percentage from method like "Must be >= 95%"
    const match = method.match(/>=\s*(\d+(?:\.\d+)?)%/);
    return match ? parseFloat(match[1]) : 0;
  }
  
  private static extractHours(method: string): number {
    // Extract hours from method like "24+ hours before due date"
    const match = method.match(/(\d+)\+?\s*hours?/);
    return match ? parseInt(match[1]) : 0;
  }
  
  private static extractNumber(method: string): number {
    // Extract any number from method
    const match = method.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
  
  private static checkCurrentWeekPerformance(achievement: WeeklyAchievement, data: WeeklyAchievementData): boolean {
    // Simplified check for current week performance based on category
    switch (achievement.category) {
      case 'performance':
        const averageGrade = this.calculateAverageGrade(data.assignments);
        return averageGrade >= 80; // Basic threshold
      case 'timing':
        const assignments = data.assignments.filter(a => a.submittedAt && a.dueDate);
        if (assignments.length === 0) return false;
        const onTime = assignments.filter(a => a.submittedAt! <= a.dueDate!).length;
        return (onTime / assignments.length) >= 0.8;
      case 'engagement':
        const completedAssignments = data.assignments.filter(a => a.status === 'completed');
        const uniqueCourses = new Set(completedAssignments.map(a => a.courseId));
        return uniqueCourses.size >= 2;
      default:
        return false;
    }
  }
  
  private static checkGenericAchievement(achievement: WeeklyAchievement, data: WeeklyAchievementData): boolean {
    // Fallback for achievements not specifically implemented
    console.warn(`Generic check for achievement: ${achievement.title}`);
    return false;
  }
  
  // ========================================
  // UTILITY METHODS
  // ========================================
  
  private static calculateAverageGrade(assignments: CanvasAssignmentData[]): number {
    const gradedAssignments = assignments.filter(a => a.score !== undefined && a.possible !== undefined && a.possible > 0);
    if (gradedAssignments.length === 0) return 0;
    
    const totalPoints = gradedAssignments.reduce((sum, a) => sum + (a.score || 0), 0);
    const totalPossible = gradedAssignments.reduce((sum, a) => sum + (a.possible || 0), 0);
    
    if (totalPossible === 0) return 0;
    return (totalPoints / totalPossible) * 100;
  }
  
  /**
   * Process unlocked achievements
   */
  private static async processUnlockedAchievements(
    userId: string, 
    unlockedAchievements: WeeklyAchievementResult[]
  ): Promise<void> {
    for (const result of unlockedAchievements) {
      try {
        // Check if achievement already exists
        const { data: existingAchievement } = await supabase
          .from('achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('title', result.achievement.title)
          .single();
        
        if (existingAchievement) continue;
        
        // Create new achievement
        const { error } = await supabase
          .from('achievements')
          .insert({
            user_id: userId,
            title: result.achievement.title,
            description: result.achievement.description,
            difficulty: result.achievement.difficulty,
            icon: result.achievement.icon,
            points: result.achievement.points,
            progress: 100,
            unlocked: true,
            requirements: { 
              type: 'weekly', 
              category: result.achievement.category,
              canvasDataRequired: result.achievement.canvasDataRequired
            }
          });
        
        if (error) {
          console.error(`Error creating achievement ${result.achievement.title}:`, error);
          continue;
        }
        
        // Show toast notification
        toast.success(`🏆 Weekly Achievement Unlocked: ${result.achievement.title}`, {
          description: `+${result.achievement.points} XP for your weekly performance!`,
          duration: 5000,
        });
        
        console.log(`✅ Unlocked weekly achievement: ${result.achievement.title}`);
        
      } catch (error) {
        console.error(`Error processing achievement ${result.achievement.title}:`, error);
      }
    }
  }
  
  /**
   * Get weekly achievement progress for a user
   */
  static async getWeeklyAchievementProgress(
    userId: string, 
    weekStart: Date, 
    weekEnd: Date
  ): Promise<WeeklyAchievementResult[]> {
    return this.checkWeeklyAchievements(userId, weekStart, weekEnd);
  }
  
  /**
   * Get achievements by category
   */
  static getAchievementsByCategory(category: WeeklyAchievement['category']): WeeklyAchievement[] {
    return getWeeklyAchievementsByCategory(category);
  }

  /**
   * Get comprehensive achievement statistics for a user
   */
  static async getAchievementStatistics(
    userId: string, 
    weekStart: Date, 
    weekEnd: Date
  ): Promise<{
    totalAchievements: number;
    unlockedAchievements: number;
    progressAchievements: number;
    categoryBreakdown: Record<string, { total: number; unlocked: number; progress: number }>;
    difficultyBreakdown: Record<string, { total: number; unlocked: number; progress: number }>;
    recentUnlocks: WeeklyAchievementResult[];
  }> {
    try {
      const results = await this.checkWeeklyAchievements(userId, weekStart, weekEnd);
      
      const unlocked = results.filter(r => r.unlocked);
      const progress = results.filter(r => !r.unlocked && r.progress > 0);
      
      // Category breakdown
      const categoryBreakdown: Record<string, { total: number; unlocked: number; progress: number }> = {};
      const difficultyBreakdown: Record<string, { total: number; unlocked: number; progress: number }> = {};
      
      results.forEach(result => {
        const category = result.achievement.category;
        const difficulty = result.achievement.difficulty;
        
        // Initialize category if not exists
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { total: 0, unlocked: 0, progress: 0 };
        }
        if (!difficultyBreakdown[difficulty]) {
          difficultyBreakdown[difficulty] = { total: 0, unlocked: 0, progress: 0 };
        }
        
        // Count totals
        categoryBreakdown[category].total++;
        difficultyBreakdown[difficulty].total++;
        
        // Count unlocked
        if (result.unlocked) {
          categoryBreakdown[category].unlocked++;
          difficultyBreakdown[difficulty].unlocked++;
        }
        
        // Count progress
        if (result.progress > 0) {
          categoryBreakdown[category].progress++;
          difficultyBreakdown[difficulty].progress++;
        }
      });
      
      return {
        totalAchievements: results.length,
        unlockedAchievements: unlocked.length,
        progressAchievements: progress.length,
        categoryBreakdown,
        difficultyBreakdown,
        recentUnlocks: unlocked.slice(0, 5) // Last 5 unlocked
      };
      
    } catch (error) {
      console.error('Error getting achievement statistics:', error);
      return {
        totalAchievements: 0,
        unlockedAchievements: 0,
        progressAchievements: 0,
        categoryBreakdown: {},
        difficultyBreakdown: {},
        recentUnlocks: []
      };
    }
  }

  /**
   * Get achievements that are close to being unlocked (high progress)
   */
  static async getNearCompletionAchievements(
    userId: string, 
    weekStart: Date, 
    weekEnd: Date,
    progressThreshold: number = 75
  ): Promise<WeeklyAchievementResult[]> {
    try {
      const results = await this.checkWeeklyAchievements(userId, weekStart, weekEnd);
      return results.filter(r => !r.unlocked && r.progress >= progressThreshold);
    } catch (error) {
      console.error('Error getting near completion achievements:', error);
      return [];
    }
  }

  /**
   * Get achievements by specific criteria
   */
  static async getAchievementsByCriteria(
    userId: string,
    weekStart: Date,
    weekEnd: Date,
    criteria: {
      category?: string;
      difficulty?: string;
      unlocked?: boolean;
      minProgress?: number;
    }
  ): Promise<WeeklyAchievementResult[]> {
    try {
      const results = await this.checkWeeklyAchievements(userId, weekStart, weekEnd);
      
      return results.filter(result => {
        if (criteria.category && result.achievement.category !== criteria.category) return false;
        if (criteria.difficulty && result.achievement.difficulty !== criteria.difficulty) return false;
        if (criteria.unlocked !== undefined && result.unlocked !== criteria.unlocked) return false;
        if (criteria.minProgress !== undefined && result.progress < criteria.minProgress) return false;
        return true;
      });
    } catch (error) {
      console.error('Error getting achievements by criteria:', error);
      return [];
    }
  }
}
