
import React from 'react';
import { 
  Calendar, CheckCircle, AlertCircle, Clock, FileText, BookOpen, Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { JourneyMilestone } from './JourneyMap';
import { format } from 'date-fns';

export interface JourneyNodeProps {
  milestone: JourneyMilestone;
  selected?: boolean;
  onClick: () => void;
}

export const JourneyNode: React.FC<JourneyNodeProps> = ({
  milestone,
  selected = false,
  onClick
}) => {
  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-journey-success hover:bg-journey-success/80';
      case 'in-progress':
        return 'bg-journey-primary hover:bg-journey-primary/80';
      case 'at-risk':
        return 'bg-journey-warning hover:bg-journey-warning/80';
      default:
        return 'bg-journey-muted hover:bg-journey-muted/80';
    }
  };
  
  // Icon selection based on milestone type
  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <FileText className="h-4 w-4" />;
      case 'exam':
        return <BookOpen className="h-4 w-4" />;
      case 'project':
        return <Flag className="h-4 w-4" />;
      case 'reading':
        return <BookOpen className="h-4 w-4" />;
      case 'other':
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all transform',
              getStatusColor(milestone.status),
              selected ? 'ring-4 ring-primary ring-opacity-50 scale-110' : ''
            )}
            onClick={onClick}
          >
            {milestone.status === 'completed' ? (
              <CheckCircle className="h-5 w-5 text-white" />
            ) : milestone.status === 'at-risk' ? (
              <AlertCircle className="h-5 w-5 text-white" />
            ) : milestone.status === 'in-progress' ? (
              <Clock className="h-5 w-5 text-white" />
            ) : (
              getMilestoneIcon(milestone.type)
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{milestone.title}</p>
            <p className="text-xs text-muted-foreground capitalize">{milestone.type}</p>
            {milestone.dueDate && (
              <p className="text-xs flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {format(milestone.dueDate, 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default JourneyNode;
