
import React from 'react';
import { JourneyCourse } from './JourneyMap';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, Calendar } from 'lucide-react';

interface JourneyTimelineProps {
  courses: JourneyCourse[];
}

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ courses }) => {
  // Flatten all milestones across all courses
  const allMilestones = courses.flatMap(course => 
    course.milestones.map(milestone => ({
      ...milestone,
      courseName: course.title,
      courseCode: course.code,
    }))
  );
  
  // Sort milestones by due date
  const sortedMilestones = allMilestones
    .filter(m => m.dueDate)
    .sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  
  // Group milestones by month
  const milestonesByMonth: Record<string, typeof sortedMilestones> = {};
  
  sortedMilestones.forEach(milestone => {
    if (!milestone.dueDate) return;
    
    const monthKey = format(milestone.dueDate, 'MMMM yyyy');
    if (!milestonesByMonth[monthKey]) {
      milestonesByMonth[monthKey] = [];
    }
    milestonesByMonth[monthKey].push(milestone);
  });
  
  return (
    <div>
      <div className="flex items-center mb-6">
        <GraduationCap className="w-6 h-6 mr-2 text-journey-primary" />
        <h2 className="text-2xl font-bold">Academic Timeline</h2>
      </div>
      
      <ScrollArea className="h-[70vh] pr-4">
        <div className="space-y-6 pb-8">
          {Object.entries(milestonesByMonth).map(([month, monthMilestones]) => (
            <div key={month} className="animate-fade-in">
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 mr-2 text-journey-primary" />
                <h3 className="text-xl font-semibold">{month}</h3>
              </div>
              
              <div className="pl-2 border-l-2 border-journey-primary/30 space-y-4">
                {monthMilestones.map(milestone => (
                  <Card key={milestone.id} className="border-l-4 overflow-hidden transition-all hover:shadow-md"
                    style={{
                      borderLeftColor: milestone.status === 'completed' ? 'var(--journey-success)' :
                                      milestone.status === 'in-progress' ? 'var(--journey-primary)' :
                                      milestone.status === 'at-risk' ? 'var(--journey-warning)' :
                                      'var(--journey-muted)',
                    }}
                  >
                    <CardHeader className="py-3 px-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-medium">{milestone.title}</CardTitle>
                        <Badge 
                          variant="outline"
                          className="text-xs font-normal"
                        >
                          {milestone.courseCode}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="py-2 px-4 text-sm text-muted-foreground">
                      <p>{milestone.description || `A ${milestone.type} for ${milestone.courseName}`}</p>
                      
                      {milestone.progress !== undefined && milestone.progress > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={milestone.progress} className="h-1.5 flex-1" />
                          <span className="text-xs">{milestone.progress}%</span>
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="py-2 px-4 text-xs text-muted-foreground bg-muted/20 flex justify-between">
                      <span>
                        Due: {milestone.dueDate ? format(milestone.dueDate, 'MMM d, yyyy') : 'No due date'}
                      </span>
                      
                      {milestone.completedDate && (
                        <span className="text-journey-success">
                          Completed: {format(milestone.completedDate, 'MMM d, yyyy')}
                        </span>
                      )}
                      
                      {milestone.grade !== undefined && (
                        <span className={
                          milestone.grade >= 90 ? 'text-journey-success' :
                          milestone.grade >= 80 ? 'text-journey-primary' :
                          milestone.grade >= 70 ? 'text-journey-info' :
                          'text-journey-warning'
                        }>
                          Grade: {milestone.grade}%
                        </span>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
