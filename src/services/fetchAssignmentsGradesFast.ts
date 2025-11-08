
// services/fetchAssignmentGradesFast.ts
import { userStorage } from '@/utils/userStorage';

export async function fetchAssignmentGradesFast(
    apiBase: string, // https://canvas.ucsc.edu or /canvas-api
    token: string,
    direct = false,
    userId?: string
  ) {
    const base = direct ? `${apiBase}/api/v1` : '/canvas-api/api/v1';
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  
    // 1) active courses
    const cRes = await fetch(
      `${base}/courses?enrollment_state=active&per_page=100`,
      { headers }
    );
    const courses: Array<{ id: number; name?: string }> = await cRes.json();
  
    const byCourse: Record<number, any[]> = {};
  
    await Promise.all(
      courses.map(async (c) => {
        // <-- ONE request per course, includes every submission + assignment meta
        const url =
          `${base}/courses/${c.id}/students/submissions` +
          `?student_ids[]=self&include[]=assignment&per_page=100`;
  
        const sRes = await fetch(url, { headers });
        if (!sRes.ok) return;
  
        const subs: Array<any> = await sRes.json();
        byCourse[c.id] = subs
          .filter((s) => s.score != null)
          .map((s) => ({
            id:       s.assignment.id,
            name:     s.assignment.name,
            score:    s.score,
            possible: s.assignment.points_possible,
          }));
      })
    );
  
    // If userId is provided, cache the results
    if (userId) {
      try {
        userStorage.setObject(userId, 'canvas_grades_fast', byCourse);
      } catch (err) {
        console.error('Failed to cache Canvas grades in storage:', err);
      }
    }
  
    return byCourse;
  }
