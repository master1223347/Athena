import React, { useState, useEffect } from 'react';
import { JourneyCourse } from './JourneyMap';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Search, Loader2 } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, isSameDay, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { canvasApi } from '@/services/canvasApi';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { userDataService } from '@/services/userDataService';
import AssignmentDetailsDialog from '@/components/common/AssignmentDetailsDialog';
import { JourneyMilestone } from './JourneyMap';

interface JourneyCalendarProps {
  courses: JourneyCourse[];
}

interface ExtendedMilestone extends JourneyMilestone {
  courseName: string;
  courseCode: string;
  courseId: string;
}

export const JourneyCalendar: React.FC<JourneyCalendarProps> = ({ courses: initialCourses }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [courses, setCourses] = useState<JourneyCourse[]>(initialCourses);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { user } = useAuth();
  
  // New state for selected milestone and dialog
  const [selectedMilestone, setSelectedMilestone] = useState<ExtendedMilestone | null>(null);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);

  useEffect(() => {
    // Add class to body to fix any CSS issues
    document.body.classList.add('calendar-view-active');
    
    // Initial data load if we have credentials but no courses
    if (canvasApi.hasCredentials() && (initialCourses.length === 0 || courses.length === 0)) {
      refreshFromCanvas();
    } else {
      setCourses(initialCourses);
    }
    
    return () => {
      document.body.classList.remove('calendar-view-active');
    };
  }, [initialCourses]);
  
  // Extract all milestones with due dates
  const allMilestones = courses.flatMap(course => 
    course.milestones
      .filter(m => m.dueDate) // Only include milestones with due dates
      .map(m => ({
        ...m,
        courseName: course.title,
        courseCode: course.code,
        courseId: course.id
      }))
  );
  
  // Filter milestones by search term
  const filteredMilestones = debouncedSearchTerm.trim() === '' 
    ? allMilestones 
    : allMilestones.filter(m => 
        m.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
        m.courseName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        m.courseCode.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
  
  // Days of the week
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get days in the current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Navigate to previous/next month
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  
  // Get milestones for a specific day
  const getMilestonesForDay = (day: Date) => {
    return filteredMilestones.filter(milestone => 
      milestone.dueDate && isSameDay(milestone.dueDate, day)
    );
  };
  
  // Handle milestone click
  const handleMilestoneClick = (milestone: ExtendedMilestone) => {
    setSelectedMilestone(milestone);
    setMilestoneDialogOpen(true);
  };

  // Handle milestone status update
  const handleMilestoneUpdate = async (courseId: string, milestoneId: string, updates: Partial<JourneyMilestone>) => {
    if (!user) return;
    
    try {
      // Update the courses state
      const updatedCourses = courses.map(course => {
        if (course.id === courseId) {
          const updatedMilestones = course.milestones.map(milestone => 
            milestone.id === milestoneId 
              ? { ...milestone, ...updates }
              : milestone
          );
          
          // Recalculate course progress based on completed milestones
          const completedCount = updatedMilestones.filter(m => m.status === 'completed').length;
          const progress = updatedMilestones.length > 0 
            ? Math.round((completedCount / updatedMilestones.length) * 100) 
            : 0;
          
          return {
            ...course,
            milestones: updatedMilestones,
            progress
          };
        }
        return course;
      });
      
      setCourses(updatedCourses);
      
      // Find the updated course
      const courseToUpdate = updatedCourses.find(c => c.id === courseId);
      if (courseToUpdate) {
        // Save to database
        await userDataService.updateCourse(user.id, courseToUpdate);
      }
    } catch (error) {
      console.error('Error updating milestone', error);
      toast.error('Failed to update assignment status');
    }
  };

  // Manual refresh from Canvas
  const refreshFromCanvas = async () => {
    if (!canvasApi.hasCredentials() || !user) {
      toast.error("Canvas not connected. Please connect Canvas in settings.");
      return;
    }
    
    try {
      setIsLoading(true);
      toast.info("Syncing calendar data from Canvas...");
      
      // Fetch fresh data from Canvas
      const freshData = await canvasApi.fetchAndTransformAllData();
      
      if (freshData && freshData.length > 0) {
        // Update local state
        setCourses(freshData);
        
        // Save to database
        await userDataService.saveCourses(user.id, freshData);
        
        console.log('Calendar synced with data:', freshData);
        toast.success("Calendar synced successfully");
      } else {
        toast.error("No data returned from Canvas");
        console.error("No data returned from Canvas refresh");
      }
    } catch (error) {
      console.error("Error syncing calendar:", error);
      toast.error("Failed to sync calendar data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Export calendar to iCal format
  const exportToICal = () => {
    if (filteredMilestones.length === 0) {
      toast.error("No calendar items to export");
      return;
    }
    
    try {
      setIsExporting(true);
      
      // Create iCal content
      let icalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//BetterCanvas//Academic Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
      ];
      
      // Add events
      filteredMilestones.forEach(milestone => {
        if (!milestone.dueDate) return;
        
        const dateStr = format(milestone.dueDate, "yyyyMMdd'T'HHmmss'Z'");
        const uid = `${milestone.id}@bettercanvas.app`;
        
        icalContent = [
          ...icalContent,
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
          `DTSTART:${dateStr}`,
          `DTEND:${dateStr}`,
          `SUMMARY:${milestone.title}`,
          `DESCRIPTION:${milestone.description || ''} (${milestone.courseCode})`,
          'END:VEVENT'
        ];
      });
      
      // Close calendar
      icalContent.push('END:VCALENDAR');
      
      // Create downloadable file
      const blob = new Blob([icalContent.join('\r\n')], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BetterCanvas-Calendar-${format(new Date(), 'yyyy-MM-dd')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Calendar exported successfully");
    } catch (error) {
      console.error("Error exporting calendar:", error);
      toast.error("Failed to export calendar");
    } finally {
      setIsExporting(false);
    }
  };
  
  // Generate calendar grid
  const renderCalendarDays = () => {
    // Determine the start day of the week (0 = Sunday)
    const startDay = monthStart.getDay();
    
    // Create empty slots for days from previous month
    const blanks = Array(startDay).fill(null).map((_, i) => (
      <div key={`blank-${i}`} className="p-1 text-center text-muted-foreground opacity-30">
        {/* Empty cell */}
      </div>
    ));
    
    // Create day cells for current month
    const days = daysInMonth.map(day => {
      const dayMilestones = getMilestonesForDay(day);
      const hasCompletedMilestone = dayMilestones.some(m => m.status === 'completed');
      const hasInProgressMilestone = dayMilestones.some(m => m.status === 'in-progress');
      const hasAtRiskMilestone = dayMilestones.some(m => m.status === 'at-risk');
      const hasUpcomingMilestone = dayMilestones.some(m => m.status === 'upcoming');
      
      return (
        <div 
          key={day.toString()} 
          className={cn(
            "min-h-24 p-2 border rounded-md transition-all",
            isToday(day) ? "border-journey-primary bg-journey-primary/5" : "border-gray-100",
            hasCompletedMilestone ? "border-l-4 border-l-journey-success" : "",
            hasAtRiskMilestone ? "border-l-4 border-l-journey-warning" : "",
            hasInProgressMilestone && !hasAtRiskMilestone ? "border-l-4 border-l-journey-primary" : "",
            hasUpcomingMilestone && !hasInProgressMilestone && !hasAtRiskMilestone ? "border-l-4 border-l-journey-muted" : "",
            "hover:shadow-sm"
          )}
        >
          <div className="flex justify-between items-center mb-1">
            <span className={cn(
              "text-sm font-medium",
              isToday(day) ? "text-journey-primary" : ""
            )}>
              {format(day, 'd')}
            </span>
            {dayMilestones.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100">
                {dayMilestones.length}
              </span>
            )}
          </div>
          
          <div className="space-y-1">
            {dayMilestones.slice(0, 3).map(milestone => (
              <TooltipProvider key={milestone.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={cn(
                        "text-xs p-1 rounded truncate cursor-pointer",
                        milestone.status === 'completed' ? "bg-journey-success/10 text-journey-success" :
                        milestone.status === 'in-progress' ? "bg-journey-primary/10 text-journey-primary" :
                        milestone.status === 'at-risk' ? "bg-journey-warning/10 text-journey-warning" :
                        "bg-journey-muted/10 text-journey-text"
                      )}
                      onClick={() => handleMilestoneClick(milestone)}
                    >
                      {milestone.title}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-1 p-1">
                      <p className="font-semibold">{milestone.title}</p>
                      <p className="text-xs">{milestone.courseCode} - {milestone.courseName}</p>
                      {milestone.description && (
                        <p className="text-xs text-muted-foreground">{milestone.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1 pt-1 border-t border-gray-100">
                        <Badge variant={
                          milestone.status === 'completed' ? 'default' :
                          milestone.status === 'in-progress' ? 'secondary' :
                          milestone.status === 'at-risk' ? 'destructive' :
                          'outline'
                        }>
                          {milestone.status}
                        </Badge>
                        {milestone.grade !== undefined && (
                          <Badge variant="outline">
                            Grade: {milestone.grade}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            
            {dayMilestones.length > 3 && (
              <div className="text-xs text-muted-foreground text-center">
                +{dayMilestones.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    });
    
    return [...blanks, ...days];
  };
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <CalendarIcon className="w-6 h-6 mr-2 text-journey-primary" />
          <h2 className="text-2xl font-bold">Academic Calendar</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={refreshFromCanvas}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CalendarIcon className="w-4 h-4 mr-2" />
              )}
              Sync
            </Button>
            
            <Button
              onClick={exportToICal}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial"
              disabled={isExporting || filteredMilestones.length === 0}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h3 className="text-lg font-medium">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        
        <button
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="grid grid-cols-7 gap-0.5 p-2 bg-muted/20">
          {weekdays.map(day => (
            <div key={day} className="text-center text-sm font-medium py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-0.5 p-2">
          {renderCalendarDays()}
        </div>
        
        <div className="flex flex-wrap gap-3 p-4 border-t">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-journey-success rounded-full mr-1"></div>
            <span className="text-xs">Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-journey-primary rounded-full mr-1"></div>
            <span className="text-xs">In Progress</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-journey-warning rounded-full mr-1"></div>
            <span className="text-xs">At Risk</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-journey-muted rounded-full mr-1"></div>
            <span className="text-xs">Upcoming</span>
          </div>
        </div>
      </div>
      
      {filteredMilestones.length === 0 && !isLoading && (
        <div className="text-center p-8 mt-6 bg-gray-50 rounded-lg">
          <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-3" />
          {searchTerm.trim() !== '' ? (
            <>
              <h3 className="text-lg font-medium mb-1">No matching assignments</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium mb-1">No upcoming assignments</h3>
              <p className="text-muted-foreground mb-4">
                Connect Canvas or add courses to see your academic calendar
              </p>
              <Button onClick={refreshFromCanvas} disabled={isLoading}>
                {isLoading ? "Syncing..." : "Sync with Canvas"}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Add shared assignment details dialog */}
      <AssignmentDetailsDialog
        milestone={selectedMilestone}
        open={milestoneDialogOpen}
        onOpenChange={setMilestoneDialogOpen}
        onStatusChange={handleMilestoneUpdate}
      />
    </div>
  );
};
