import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { JourneyCourse, JourneyMilestone } from './JourneyMap';
import { PersonalMilestone } from '@/services/personalMilestoneService';
import { CalendarDays, Plus, User } from 'lucide-react';
import { format, isSameDay, startOfDay, isSameMonth } from 'date-fns';
import AssignmentDetailsDialog from '@/components/common/AssignmentDetailsDialog';
import AddPersonalMilestoneDialog from '@/components/common/AddPersonalMilestoneDialog';
import EditPersonalMilestoneDialog from '@/components/common/EditPersonalMilestoneDialog';
import { personalMilestoneService } from '@/services/personalMilestoneService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface JourneyCalendarEnhancedProps {
  courses: JourneyCourse[];
  onMilestoneUpdate?: (courseId: string, milestoneId: string, updates: Partial<JourneyMilestone>) => void;
  currentMonth?: Date;
  compact?: boolean;
}

interface MilestoneWithCourseInfo extends JourneyMilestone {
  courseName: string;
  courseId: string;
  isPersonal: false;
}

interface PersonalMilestoneWithCourseInfo extends PersonalMilestone {
  courseName?: string;
  courseId?: string;
  isPersonal: true;
}

type CombinedMilestone = MilestoneWithCourseInfo | PersonalMilestoneWithCourseInfo;

// Helper function to get due date from either milestone type
function getMilestoneDueDate(milestone: JourneyMilestone | PersonalMilestone): Date | undefined {
  if ('dueDate' in milestone) {
    return (milestone as JourneyMilestone).dueDate;
  } else {
    return (milestone as PersonalMilestone).due_date;
  }
}

// Type guard to check if milestone is personal
function isPersonalMilestone(milestone: CombinedMilestone): milestone is PersonalMilestoneWithCourseInfo {
  return milestone.isPersonal;
}

function getDisplayStatus(milestone: JourneyMilestone | PersonalMilestone): string {
  // If already completed, always return completed status
  if (milestone.status === "completed") {
    return "completed";
  }
  
  const dueDate = getMilestoneDueDate(milestone);
  // Only mark as at-risk if upcoming and past due
  if (
    milestone.status === "upcoming" &&
    dueDate &&
    new Date(dueDate) < new Date()
  ) {
    return "at-risk";
  }
  
  return milestone.status;
}

const JourneyCalendarEnhanced: React.FC<JourneyCalendarEnhancedProps> = ({ 
  courses,
  onMilestoneUpdate,
  currentMonth,
  compact = false 
}) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(currentMonth || new Date());
  const [displayMonth, setDisplayMonth] = useState<Date>(currentMonth || new Date());
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneWithCourseInfo | null>(null);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [personalMilestones, setPersonalMilestones] = useState<PersonalMilestone[]>([]);
  const [addPersonalDialogOpen, setAddPersonalDialogOpen] = useState(false);
  const [editPersonalDialogOpen, setEditPersonalDialogOpen] = useState(false);
  const [selectedPersonalMilestone, setSelectedPersonalMilestone] = useState<PersonalMilestone | null>(null);
  
  // Update displayMonth and selectedDate when currentMonth changes
  useEffect(() => {
    if (currentMonth) {
      setSelectedDate(currentMonth);
      setDisplayMonth(currentMonth);
    }
  }, [currentMonth]);

  // Load personal milestones
  useEffect(() => {
    if (user) {
      loadPersonalMilestones();
    }
  }, [user]);

  const loadPersonalMilestones = async () => {
    if (!user) return;
    
    try {
      const milestones = await personalMilestoneService.getPersonalMilestones(user.id);
      setPersonalMilestones(milestones);
    } catch (error) {
      console.error('Error loading personal milestones:', error);
    }
  };
  
  // Format assignment title to be more readable
  const formatAssignmentTitle = (title: string): string => {
    if (!title) return 'Unnamed Assignment';
    
    // Remove any HTML tags
    let formatted = title.replace(/<[^>]*>/g, '');
    
    // Replace multiple spaces with a single space
    formatted = formatted.replace(/\s+/g, ' ');
    
    // Remove any leading/trailing whitespace
    formatted = formatted.trim();
    
    return formatted || 'Unnamed Assignment'; // Return 'Unnamed Assignment' if the title is empty after formatting
  };
  
  // Get all milestones with due dates (both Canvas and personal)
  const allMilestones: CombinedMilestone[] = [
    // Canvas milestones
    ...courses.flatMap(course => 
      course.milestones
        .filter(milestone => milestone.dueDate)
        .map(milestone => ({
          ...milestone,
          title: formatAssignmentTitle(milestone.title),
          courseName: course.title,
          courseId: course.id,
          isPersonal: false as const
        }))
    ),
    // Personal milestones
    ...personalMilestones
      .filter(milestone => milestone.due_date)
      .map(milestone => {
        const associatedCourse = courses.find(c => c.id === milestone.course_id);
        return {
          ...milestone,
          courseName: associatedCourse?.title || 'Personal Task',
          courseId: milestone.course_id || '',
          isPersonal: true as const
        };
      })
  ];
  
  // Group milestones by date
  const milestonesByDate = allMilestones.reduce((acc, milestone) => {
    const dueDate = isPersonalMilestone(milestone) ? milestone.due_date : milestone.dueDate;
    if (!dueDate) return acc;
    
    const dateKey = startOfDay(dueDate).toISOString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(milestone);
    return acc;
  }, {} as Record<string, CombinedMilestone[]>);
  
  // Get milestones for selected date
  const getMilestonesForDate = (date: Date | undefined): CombinedMilestone[] => {
    if (!date) return [];
    
    return allMilestones.filter(milestone => {
      const dueDate = isPersonalMilestone(milestone) ? milestone.due_date : milestone.dueDate;
      return dueDate && isSameDay(dueDate, date);
    });
  };
  
  const selectedDateMilestones = selectedDate ? getMilestonesForDate(selectedDate) : [];
  
  // Custom day renderer to show badges for dates with milestones
  const dayRenderer = (day: Date) => {
    const dateKey = startOfDay(day).toISOString();
    const hasMilestones = milestonesByDate[dateKey] && milestonesByDate[dateKey].length > 0;

    if (!hasMilestones) return null;

    const milestones = milestonesByDate[dateKey];

    return (
      <div className="flex flex-row gap-1 justify-center items-center min-h-[8px]">
        {milestones.slice(0, 3).map((m, idx) => (
          <div
            key={m.id}
            className={
              "w-2 h-2 rounded-full" +
              (getDisplayStatus(m) === "completed"
                ? " bg-journey-success"
                : getDisplayStatus(m) === "at-risk"
                ? " bg-journey-warning"
                : m.isPersonal
                ? " bg-purple-500"
                : " bg-journey-primary")
            }
          />
        ))}
        {milestones.length > 3 && (
      <span className="text-xs text-muted-foreground ml-0.1 flex items-center leading-none self-center" style={{ height: '8px' }}>
        +{milestones.length - 3}
      </span> )}
      </div>
    );
  };
  
  const handleMilestoneClick = (milestone: CombinedMilestone) => {
    if (isPersonalMilestone(milestone)) {
      setSelectedPersonalMilestone(milestone);
      setEditPersonalDialogOpen(true);
    } else {
      setSelectedMilestone(milestone);
      setMilestoneDialogOpen(true);
    }
  };

  const handlePersonalMilestoneUpdate = async () => {
    await loadPersonalMilestones();
  };

  const handlePersonalMilestoneDelete = async () => {
    await loadPersonalMilestones();
  };
  
  const getDayStyle = (date: Date | undefined) => {
    if (!date || !selectedDate) return "";
    
    // Highlight today differently
    if (isSameDay(date, new Date())) {
      return "bg-journey-primary/20 font-bold";
    }
    
    // Highlight selected date
    if (isSameDay(date, selectedDate)) {
      return "bg-accent/60 text-black font-bold text-lg";
    }
    // Different month dates are more faded
    if (!isSameMonth(date, selectedDate)) {
      return "opacity-40";
    }
    
    return "";
  };
  
  // Handlers for month navigation
  const handlePrevMonth = () => {
    setDisplayMonth(prev => {
      const newMonth = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      return newMonth;
    });
  };
  const handleNextMonth = () => {
    setDisplayMonth(prev => {
      const newMonth = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      return newMonth;
    });
  };
  
  return (
    <div className="space-y-6 h-full">
      <div className={compact ? 'flex flex-col gap-6 h-full' : 'flex flex-col md:flex-row gap-6 h-full'}>
        {/* Calendar container with improved aspect ratio - Make it 1:1 */}
        <div className="md:w-[500px] flex-shrink-0 max-h-[400px] overflow-hidden">
          <Card className="h-full p-6">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="Previous month"
              >
                <span className="sr-only">Previous month</span>
                &#8592;
              </button>
              <span className="font-semibold text-lg">
                {format(displayMonth, 'MMMM yyyy')}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="Next month"
              >
                <span className="sr-only">Next month</span>
                &#8594;
              </button>
            </div>
            <Calendar 
              mode="single" 
              selected={selectedDate} 
              onSelect={setSelectedDate}
              month={displayMonth}
              onMonthChange={setDisplayMonth}
              className="w-full h-full"
              styles={{
                head_cell: { textTransform: 'capitalize' },
                table: { width: '100%' },
                month: { width: '100%' }
              }}
              components={{
                Caption: () => null,
                Day: ({ date, ...props }) => {
                  const isSelected = isSameDay(date, selectedDate);
                  const isToday = isSameDay(date, new Date());

                  // Dynamic classes for light/dark mode
                  const baseCircle =
                    "flex items-center justify-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full w-7 h-7 z-10 transition-colors";
                  const selectedCircle =
                    "bg-journey-primary text-white font-bold text-lg shadow";         // << no ring here
                  const selectedCircleDark =
                    "dark:bg-journey-primary-dark dark:text-white";                    // pick your dark mode variant
                  const todayCircle =
                    "border-2 border-journey-primary text-journey-primary font-bold text-base " +
                    "bg-white dark:bg-blue-600 dark:text-white dark:border-blue-400";
                  const defaultCircle = "text-base text-foreground dark:text-white";

                  return (
                    <div
                      onClick={() => setSelectedDate(date)}
                      className={
                        "relative cursor-pointer flex items-center justify-center h-14 w-10"
                      }
                      {...props}
                    >
                      {/* Date number, always centered */}
                      <span
                        className={
                          baseCircle +
                          (isSelected
                            ? ` ${selectedCircle} ${selectedCircleDark}`
                            : isToday
                            ? ` ${todayCircle}`
                            : ` ${defaultCircle}`)
                        }
                        style={
                          isSelected
                            ? {
                                boxShadow:
                                  "0 0 0 2px rgba(59,130,246,0.3)" // blue-500/30 for light, overridden by dark:shadow
                              }
                            : undefined
                        }
                      >
                        {format(date, 'd')}
                      </span>
                      {/* Dots row, always at the bottom */}
                      <div className="absolute bottom-1 left-0 right-0 flex justify-center items-center pointer-events-none">
                        {dayRenderer(date)}
                      </div>
                    </div>
                  );
                }
              }}
            />
          </Card>
        </div>
        
        {/* Daily assignments panel */}
        <div className="flex-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-journey-primary" />
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'No date selected'}
                  </CardTitle>
                  <CardDescription>
                    {selectedDateMilestones.length 
                      ? `${selectedDateMilestones.length} ${selectedDateMilestones.length === 1 ? 'assignment' : 'assignments'} due`
                      : 'No assignments due on this date'}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setAddPersonalDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {selectedDateMilestones.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto opacity-20 mb-2" />
                  <p>No assignments due on this date</p>
                  {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddPersonalDialogOpen(true)}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Personal Task
                  </Button> */}
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateMilestones.map((milestone) => (
                    <div 
                      key={milestone.id} 
                      className="p-3 border rounded-md cursor-pointer hover:bg-muted/10 transition-colors"
                      onClick={() => handleMilestoneClick(milestone)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{milestone.title}</div>
                            {milestone.isPersonal && (
                              <User className="h-4 w-4 text-purple-500" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{milestone.courseName}</div>
                        </div>
                        <Badge variant={
                          getDisplayStatus(milestone) === 'completed' ? 'default' :
                          getDisplayStatus(milestone) === 'in-progress' ? 'secondary' :
                          getDisplayStatus(milestone) === 'at-risk' ? 'destructive' : 'outline'
                        }>
                          {getDisplayStatus(milestone)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Use shared assignment details dialog for Canvas milestones */}
      <AssignmentDetailsDialog
        milestone={selectedMilestone}
        open={milestoneDialogOpen}
        onOpenChange={setMilestoneDialogOpen}
        onStatusChange={onMilestoneUpdate}
      />

      {/* Add personal milestone dialog */}
      <AddPersonalMilestoneDialog
        open={addPersonalDialogOpen}
        onOpenChange={setAddPersonalDialogOpen}
        onMilestoneCreated={handlePersonalMilestoneUpdate}
        userId={user?.id || ''}
        courses={courses}
        selectedDate={selectedDate}
      />

      {/* Edit personal milestone dialog */}
      <EditPersonalMilestoneDialog
        open={editPersonalDialogOpen}
        onOpenChange={setEditPersonalDialogOpen}
        onMilestoneUpdated={handlePersonalMilestoneUpdate}
        onMilestoneDeleted={handlePersonalMilestoneDelete}
        milestone={selectedPersonalMilestone}
        courses={courses}
      />
    </div>
  );
};

export default JourneyCalendarEnhanced;
