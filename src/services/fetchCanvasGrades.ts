import { supabase } from '@/integrations/supabase/client';

export async function fetchCanvasGrades(rawUrl: string, token: string, direct = false) {
  // Always use the Supabase proxy for Canvas API calls in production/development
  if (direct) {
    // Direct mode: Use Canvas API directly (for production environments with CORS setup)
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    };
    
    const apiBaseUrl = `${rawUrl}/api/v1`;
    
    // 1) Get courses
    const coursesResp = await fetch(
      `${apiBaseUrl}/courses?enrollment_state=active&per_page=100`,
      { headers }
    );
    if (!coursesResp.ok) {
      throw new Error(`Failed to fetch courses: ${coursesResp.status}`);
    }
    const courses = await coursesResp.json();
    
    // 2) For each course, get enrollments/grades
    const coursesWithGrades = await Promise.all(
      courses.map(async (course: any) => {
        const url = `${apiBaseUrl}/courses/${course.id}/enrollments`
          + `?user_id=self&type[]=StudentEnrollment&per_page=100`;
        
        const enrResp = await fetch(url, { headers });
        if (!enrResp.ok) {
          return { ...course, grade: null };
        }
        const enrollments = await enrResp.json();
        const grade = enrollments[0]?.grades?.current_score
          ?? enrollments[0]?.grades?.final_score
          ?? null;
        
        return { ...course, grade };
      })
    );
    
    return coursesWithGrades;
  } else {
    // Proxy mode: Use Supabase canvas-proxy function
    try {
      // 1) Get courses through Supabase proxy
      const coursesResponse = await supabase.functions.invoke('canvas-proxy', {
        body: {
          domain: rawUrl,
          token: token,
          endpoint: '/api/v1/courses?enrollment_state=active&per_page=100',
          method: 'GET'
        }
      });
      
      if (coursesResponse.error) {
        console.error('Canvas proxy error:', coursesResponse.error);
        throw new Error(`Canvas proxy error: ${coursesResponse.error.message}`);
      }
      
      const courses = coursesResponse.data?.data;
      if (!courses) {
        throw new Error('No courses data received from Canvas proxy');
      }
      
      // 2) For each course, get enrollments/grades through proxy
      const coursesWithGrades = await Promise.all(
        courses.map(async (course: any) => {
          try {
            const enrollmentsResponse = await supabase.functions.invoke('canvas-proxy', {
              body: {
                domain: rawUrl,
                token: token,
                endpoint: `/api/v1/courses/${course.id}/enrollments?user_id=self&type[]=StudentEnrollment&per_page=100`,
                method: 'GET'
              }
            });
            
            if (enrollmentsResponse.error) {
              console.warn(`Failed to get enrollments for course ${course.id}:`, enrollmentsResponse.error);
              return { ...course, grade: null };
            }
            
            const enrollments = enrollmentsResponse.data?.data;
            const grade = enrollments?.[0]?.grades?.current_score
              ?? enrollments?.[0]?.grades?.final_score
              ?? null;
            
            return { ...course, grade };
          } catch (error) {
            console.warn(`Error fetching enrollments for course ${course.id}:`, error);
            return { ...course, grade: null };
          }
        })
      );
      
      return coursesWithGrades;
    } catch (error) {
      console.error('Error in fetchCanvasGrades:', error);
      throw new Error(`Failed to fetch Canvas grades: ${error.message}`);
    }
  }
}
  