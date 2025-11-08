
/**
 * Utility functions for the UserDataService
 */

// Helper to strip HTML tags from text
export const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

// Helper method to ensure milestone has a proper title
export const ensureMilestoneTitle = (milestone: any): string => {
  if (!milestone) return "Assignment";
  
  // If we have a good title, use it
  if (milestone.title && milestone.title !== "unnamed assignment" && milestone.title.trim() !== "") {
    return milestone.title.trim();
  }
  
  // If we have a description, use part of it as the title
  if (milestone.description && milestone.description.length > 0) {
    const cleanDesc = stripHtmlTags(milestone.description);
    if (cleanDesc.trim().length > 0) {
      return cleanDesc.substring(0, 30) + (cleanDesc.length > 30 ? '...' : '');
    }
  }
  
  // Use the ID as a fallback
  if (milestone.id) {
    return `Assignment ${milestone.id.toString().substring(0, 6)}`;
  }
  
  // Last resort
  if (milestone.canvas_id) {
    return `Assignment ${milestone.canvas_id.toString().substring(0, 6)}`;
  }
  
  return "Assignment";
};

// Process milestones for database formatting
export const formatMilestoneForDatabase = (milestone: any, courseId: string, userId: string) => {
  return {
    id: milestone.id,
    course_id: courseId,
    user_id: userId,
    title: ensureMilestoneTitle(milestone),
    description: milestone.description || '',
    type: milestone.type || 'assignment',
    status: milestone.status || 'upcoming',
    due_date: milestone.dueDate instanceof Date ? milestone.dueDate.toISOString() : milestone.dueDate,
    completed_date: milestone.completedDate instanceof Date ? milestone.completedDate.toISOString() : milestone.completedDate,
    progress: milestone.progress || 0,
    grade: milestone.grade,
    points_possible: milestone.points_possible,
    canvas_id: milestone.canvas_id,
    url: milestone.url,
    updated_at: new Date().toISOString()
  };
};
