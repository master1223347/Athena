import React from 'react';
import JourneyCalendarEnhanced from './JourneyCalendarEnhanced';
import { JourneyCourse, JourneyMilestone } from './JourneyMap';

interface JourneyCalendarWrapperProps {
  courses: JourneyCourse[];
  onMilestoneUpdate?: (courseId: string, milestoneId: string, updates: Partial<JourneyMilestone>) => void;
  currentMonth?: Date;
  compact?: boolean;
}

/**
 * A wrapper component to ensure 1:1 aspect ratio for the calendar
 */
const JourneyCalendarWrapper: React.FC<JourneyCalendarWrapperProps> = ({ 
  courses, 
  onMilestoneUpdate,
  currentMonth,
  compact = false
}) => {
  return (
    <div className={compact ? '' : 'relative w-full aspect-square bg-white'}>
      <div className={compact ? '' : 'absolute inset-0 p-4'}>
        <JourneyCalendarEnhanced 
          courses={courses} 
          onMilestoneUpdate={onMilestoneUpdate}
          currentMonth={currentMonth}
          compact={compact}
        />
      </div>
    </div>
  );
};

export default JourneyCalendarWrapper;
