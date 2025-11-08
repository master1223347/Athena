
// src/services/fetchAssignmentGrades.ts
import { userStorage } from '@/utils/userStorage';

export interface CanvasAssignmentGrade {
  id:       number;
  name:     string;
  score:    number;              // student's score
  possible: number | null;       // points_possible (may be null)
}

export async function fetchAssignmentGrades(
  rawUrl: string,          // e.g. "https://canvas.ucsc.edu"
  token:  string,
  direct = false,          // default = use proxy, same as fetchCanvasGrades
  userId?: string          // optional userId for caching
): Promise<Record<number, CanvasAssignmentGrade[]>> {

  const apiBase = direct ? `${rawUrl}/api/v1`
                         :               '/canvas-api/api/v1';

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept:        'application/json',
  };

  /* ------------------------------------------------- */
  /* 1) active courses                                 */
  /* ------------------------------------------------- */
  const coursesRes = await fetch(
    `${apiBase}/courses?enrollment_state=active&per_page=100`,
    { headers }
  );
  if (!coursesRes.ok) {
    throw new Error(`Failed to fetch courses: ${coursesRes.status}`);
  }
  const courses: Array<{ id: number; name?: string }> = await coursesRes.json();

  /* ------------------------------------------------- */
  /* 2) assignments + submissions for each course      */
  /* ------------------------------------------------- */
  const byCourse: Record<number, CanvasAssignmentGrade[]> = {};

  await Promise.all(
    courses.map(async (course) => {
      const cId = course.id;

      // 2‑a) fetch assignments
      const aRes = await fetch(
        `${apiBase}/courses/${cId}/assignments?per_page=100`,
        { headers }
      );
      if (!aRes.ok) {
        console.warn(`⚠️  assignments call failed for course ${cId}`);
        byCourse[cId] = [];
        return;
      }
      const assignments: Array<{ id: number; name: string; points_possible?: number }> =
        await aRes.json();

      // 2‑b) for each assignment fetch the student's own submission
      const grades = await Promise.all(
        assignments.map(async (a) => {
          const sRes = await fetch(
            `${apiBase}/courses/${cId}/assignments/${a.id}/submissions/self`,
            { headers }
          );
          if (!sRes.ok) return null;

          const sub: { score: number | null } = await sRes.json();
          if (sub.score == null) return null;

          return {
            id:       a.id,
            name:     a.name,
            score:    sub.score,
            possible: a.points_possible ?? null,
          } as CanvasAssignmentGrade;
        })
      );

      byCourse[cId] = grades.filter(Boolean) as CanvasAssignmentGrade[];
    })
  );

  // If userId is provided, cache the results
  if (userId) {
    try {
      userStorage.setObject(userId, 'canvas_grades', byCourse);
    } catch (err) {
      console.error('Failed to cache Canvas grades in storage:', err);
    }
  }

  return byCourse;
}
