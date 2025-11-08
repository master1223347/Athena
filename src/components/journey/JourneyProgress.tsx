
import React, { useEffect } from 'react';
import { JourneyCourse } from './JourneyMap';
import { format, isToday, isPast, isFuture, addDays } from 'date-fns';
import GradeChart from './GradeChart';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDescription, Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
// import { getAssignmentGrades } from '@/services/assignmentService';
import { canvasApi } from "@/services/canvasApi";
import { useAuth } from '@/contexts/AuthContext';
import { userStorage } from '@/utils/userStorage';

interface JourneyProgressProps {
  courses: JourneyCourse[];
  hiddenCourses?: string[];
  onToggleCourseVisibility?: (courseId: string) => void;
  showUpcoming?: boolean;
}

export const JourneyProgress: React.FC<JourneyProgressProps> = ({
  courses,
  hiddenCourses = [],
  onToggleCourseVisibility,
  showUpcoming = true
}) => {
  const { user } = useAuth();

  // For progress bar chart data
  const progressData = courses.map(course => ({
    name: course.code || course.title,
    progress: course.progress || 0,
    fullName: course.title,
    id: course.id
  }));

  // Compute upcoming milestones
  const allMilestones = courses.flatMap(course => course.milestones.map(milestone => ({
    ...milestone,
    courseName: course.title,
    courseCode: course.code,
    courseId: course.id
  })));

  // Group milestones by date
  const upcomingMilestones = allMilestones.filter(milestone => 
    milestone.dueDate && 
    !milestone.completedDate && 
    (isToday(milestone.dueDate) || (isFuture(milestone.dueDate) && isPast(addDays(new Date(), -1))))
  ).sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime());

  // Get visible courses from user storage or use provided hiddenCourses
  const visibleCourses = courses.filter(c => {
    if (user?.id) {
      const userHiddenCourses = userStorage.getObject<string[]>(user.id, 'hiddenCourses', hiddenCourses);
      return !userHiddenCourses.includes(c.id);
    }
    return !hiddenCourses.includes(c.id);
  });

  // Update hidden courses in user storage when toggling visibility
  const handleToggleCourseVisibility = (courseId: string) => {
    if (onToggleCourseVisibility) {
      onToggleCourseVisibility(courseId);
      
      if (user?.id) {
        let userHiddenCourses = userStorage.getObject<string[]>(user.id, 'hiddenCourses', hiddenCourses);
        
        if (userHiddenCourses.includes(courseId)) {
          userHiddenCourses = userHiddenCourses.filter(id => id !== courseId);
        } else {
          userHiddenCourses.push(courseId);
        }
        
        userStorage.setObject(user.id, 'hiddenCourses', userHiddenCourses);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Course Grades</h3>
        {onToggleCourseVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Manage Visible Courses
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {courses.map(course => {
                const isHidden = user?.id 
                  ? userStorage.getObject<string[]>(user.id, 'hiddenCourses', hiddenCourses).includes(course.id)
                  : hiddenCourses?.includes(course.id);
                  
                return (
                  <DropdownMenuItem 
                    key={course.id}
                    onClick={() => handleToggleCourseVisibility(course.id)}
                    className="flex items-center justify-between cursor-pointer py-1.5"
                  >
                    <span
                      className={`flex-1 truncate ${
                        isHidden ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {course.code || course.title}
                    </span>
                    {isHidden ? (
                      <EyeOff className="h-5 w-5 text-red-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-green-500" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <GradeChart courses={visibleCourses} />
        </CardContent>
      </Card>
      
  {showUpcoming && upcomingMilestones.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Upcoming Deadlines</h3>
          <div className="grid gap-2">
            {upcomingMilestones.slice(0, 3).map(milestone => (
              <Alert key={milestone.id} className="py-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium">{milestone.title}</h4>
                    <AlertDescription className="text-sm flex items-center justify-between mt-1">
                      <span>{milestone.courseName} ({milestone.courseCode})</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={isToday(milestone.dueDate!) ? "destructive" : "outline"}>
                          {isToday(milestone.dueDate!) ? "Due Today!" : `Due: ${format(milestone.dueDate!, 'MMM d')}`}
                        </Badge>
                        <Badge variant="secondary">{milestone.type}</Badge>
                      </div>
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
            
            {upcomingMilestones.length > 3 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/calendar'}
                className="mt-2"
              >
                View {upcomingMilestones.length - 3} more deadlines
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
