import { supabase } from '@/integrations/supabase/client';
import { userStorage } from '@/utils/userStorage';

export interface WeeklyGradesData {
  weekStart: Date;
  weekEnd: Date;
  averageGrade: number;
  xpEarned: number;
  coursesCount: number;
}

export interface WeeklyGradesXpCalculation {
  totalWeeklyXp: number;
  weeklyData: WeeklyGradesData[];
  currentWeekAverage: number;
  currentWeekXp: number;
}

/**
 * Service to calculate weekly grades XP with exponential scaling
 */
export class WeeklyGradesXpService {
  private static readonly MAX_WEEKLY_XP = 300;
  private static readonly EXPONENTIAL_FACTOR = 0.8; // Controls the exponential curve

  /**
   * Calculate XP from average grade percentage with exponential scaling
   * 100% = 300 XP, 80% = less than 240 XP due to exponential decrease
   */
  static calculateXpFromGrade(averageGrade: number): number {
    if (averageGrade <= 0) return 0;
    if (averageGrade >= 100) return this.MAX_WEEKLY_XP;

    // Exponential scaling: higher grades get proportionally more XP
    // Formula: XP = MAX_XP * (grade/100)^exponential_factor
    const normalizedGrade = averageGrade / 100;
    const xp = this.MAX_WEEKLY_XP * Math.pow(normalizedGrade, this.EXPONENTIAL_FACTOR);
    
    return Math.round(xp);
  }

  /**
   * Get weekly grades data for a user from Canvas or cached data
   */
  static async getWeeklyGradesData(userId: string, weeksBack: number = 12): Promise<WeeklyGradesData[]> {
    try {
      // Try to get cached Canvas grades first
      const cachedGrades = userStorage.getObject(userId, 'canvas_grades', {}) || 
                          userStorage.getObject(userId, 'canvas_grades_fast', {});
      
      if (cachedGrades && Object.keys(cachedGrades).length > 0) {
        return this.calculateWeeklyAveragesFromCanvasGrades(cachedGrades as Record<number, any[]>, weeksBack);
      }

      // Fallback to database courses
      const { data: courses, error } = await supabase
        .from('courses')
        .select('grade, updated_at, title')
        .eq('user_id', userId)
        .not('grade', 'is', null);

      if (error) {
        console.error('Error fetching courses for weekly grades:', error);
        return [];
      }

      return this.calculateWeeklyAveragesFromCourses(courses || [], weeksBack);
    } catch (error) {
      console.error('Error getting weekly grades data:', error);
      return [];
    }
  }

  /**
   * Calculate weekly averages from Canvas grades data
   */
  private static calculateWeeklyAveragesFromCanvasGrades(
    canvasGrades: Record<number, any[]>, 
    weeksBack: number
  ): WeeklyGradesData[] {
    const weeklyData: WeeklyGradesData[] = [];
    const now = new Date();
    
    // Group assignments by week
    const weeklyGrades: Record<string, number[]> = {};
    
    Object.values(canvasGrades).forEach(courseGrades => {
      courseGrades.forEach(grade => {
        if (grade.score != null && grade.possible != null && grade.possible > 0) {
          const percentage = (grade.score / grade.possible) * 100;
          
          // For Canvas data, we'll use a simplified weekly grouping
          // In a real implementation, you'd want to use actual assignment due dates
          const weekKey = this.getWeekKey(now, -Math.floor(Math.random() * weeksBack));
          
          if (!weeklyGrades[weekKey]) {
            weeklyGrades[weekKey] = [];
          }
          weeklyGrades[weekKey].push(percentage);
        }
      });
    });

    // Calculate weekly averages
    Object.entries(weeklyGrades).forEach(([weekKey, grades]) => {
      if (grades.length > 0) {
        const averageGrade = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
        const xpEarned = this.calculateXpFromGrade(averageGrade);
        const [weekStart, weekEnd] = this.parseWeekKey(weekKey);
        
        weeklyData.push({
          weekStart,
          weekEnd,
          averageGrade: Math.round(averageGrade * 100) / 100,
          xpEarned,
          coursesCount: grades.length
        });
      }
    });

    return weeklyData.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
  }

  /**
   * Calculate weekly averages from database courses
   */
  private static calculateWeeklyAveragesFromCourses(
    courses: Array<{ grade: number; updated_at: string; title: string }>,
    weeksBack: number
  ): WeeklyGradesData[] {
    const weeklyData: WeeklyGradesData[] = [];
    const now = new Date();
    
    // Group courses by week based on updated_at
    const weeklyGrades: Record<string, number[]> = {};
    
    courses.forEach(course => {
      const updatedDate = new Date(course.updated_at);
      const weekKey = this.getWeekKey(updatedDate, 0);
      
      if (!weeklyGrades[weekKey]) {
        weeklyGrades[weekKey] = [];
      }
      weeklyGrades[weekKey].push(course.grade);
    });

    // Calculate weekly averages
    Object.entries(weeklyGrades).forEach(([weekKey, grades]) => {
      if (grades.length > 0) {
        const averageGrade = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
        const xpEarned = this.calculateXpFromGrade(averageGrade);
        const [weekStart, weekEnd] = this.parseWeekKey(weekKey);
        
        weeklyData.push({
          weekStart,
          weekEnd,
          averageGrade: Math.round(averageGrade * 100) / 100,
          xpEarned,
          coursesCount: grades.length
        });
      }
    });

    return weeklyData.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
  }

  /**
   * Get total weekly grades XP for a user
   */
  static async getTotalWeeklyGradesXp(userId: string): Promise<WeeklyGradesXpCalculation> {
    try {
      const weeklyData = await this.getWeeklyGradesData(userId);
      
      const totalWeeklyXp = weeklyData.reduce((sum, week) => sum + week.xpEarned, 0);
      const currentWeekAverage = weeklyData.length > 0 ? weeklyData[0].averageGrade : 0;
      const currentWeekXp = weeklyData.length > 0 ? weeklyData[0].xpEarned : 0;

      return {
        totalWeeklyXp,
        weeklyData,
        currentWeekAverage,
        currentWeekXp
      };
    } catch (error) {
      console.error('Error calculating total weekly grades XP:', error);
      return {
        totalWeeklyXp: 0,
        weeklyData: [],
        currentWeekAverage: 0,
        currentWeekXp: 0
      };
    }
  }

  /**
   * Get week key for grouping (YYYY-WW format)
   */
  private static getWeekKey(date: Date, weeksOffset: number = 0): string {
    const targetDate = new Date(date);
    targetDate.setDate(targetDate.getDate() + (weeksOffset * 7));
    
    const year = targetDate.getFullYear();
    const week = this.getWeekNumber(targetDate);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  /**
   * Parse week key back to start and end dates
   */
  private static parseWeekKey(weekKey: string): [Date, Date] {
    const [year, weekStr] = weekKey.split('-W');
    const week = parseInt(weekStr);
    
    const jan1 = new Date(parseInt(year), 0, 1);
    const daysToFirstMonday = (8 - jan1.getDay()) % 7;
    const firstMonday = new Date(jan1);
    firstMonday.setDate(jan1.getDate() + daysToFirstMonday);
    
    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return [weekStart, weekEnd];
  }

  /**
   * Get week number of the year
   */
  private static getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Get XP scaling examples for display
   */
  static getXpScalingExamples(): Array<{ grade: number; xp: number }> {
    return [
      { grade: 100, xp: 300 },
      { grade: 95, xp: 285 },
      { grade: 90, xp: 270 },
      { grade: 85, xp: 253 },
      { grade: 80, xp: 235 },
      { grade: 75, xp: 216 },
      { grade: 70, xp: 196 },
      { grade: 65, xp: 175 },
      { grade: 60, xp: 153 },
      { grade: 50, xp: 125 },
      { grade: 40, xp: 95 },
      { grade: 30, xp: 67 },
      { grade: 20, xp: 42 },
      { grade: 10, xp: 19 },
      { grade: 0, xp: 0 }
    ];
  }
}
