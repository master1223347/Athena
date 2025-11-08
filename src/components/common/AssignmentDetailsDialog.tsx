
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { JourneyMilestone } from '@/components/journey/JourneyMap';
import { format } from 'date-fns';

interface AssignmentDetailsDialogProps {
  milestone: JourneyMilestone & { 
    courseName?: string;
    courseId?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (
    courseId: string, 
    milestoneId: string, 
    updates: Partial<JourneyMilestone>
  ) => void;
}

export const AssignmentDetailsDialog: React.FC<AssignmentDetailsDialogProps> = ({
  milestone,
  open,
  onOpenChange,
  onStatusChange
}) => {
  if (!milestone) return null;

  // Format assignment title to be more readable
  const formatText = (text: string): string => {
    if (!text) return '';
    
    // Remove any HTML tags
    let formatted = text.replace(/<[^>]*>/g, '');
    
    // Replace multiple spaces with a single space
    formatted = formatted.replace(/\s+/g, ' ');
    
    // Remove any leading/trailing whitespace
    formatted = formatted.trim();
    
    return formatted;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{formatText(milestone.title)}</DialogTitle>
          <DialogDescription>
            {milestone.courseName || 'Course'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {milestone.description && (
            <div>
              <h4 className="text-sm font-medium mb-1">Description</h4>
              <p className="text-sm text-muted-foreground">{formatText(milestone.description)}</p>
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Status</h4>
              <Badge variant={
                milestone.status === 'completed' ? 'default' :
                milestone.status === 'in-progress' ? 'secondary' :
                milestone.status === 'at-risk' ? 'destructive' : 'outline'
              }>
                {milestone.status}
              </Badge>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-1">Type</h4>
              <Badge variant="outline">{milestone.type}</Badge>
            </div>
            
            {milestone.dueDate && (
              <div>
                <h4 className="text-sm font-medium mb-1">Due Date</h4>
                <div className="text-sm">{format(milestone.dueDate, 'PPP')}</div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex items-center gap-2">
          <div className="flex items-center mr-auto">
            <Checkbox 
              id="mark-completed"
              checked={milestone.status === 'completed'} 
              onCheckedChange={(checked) => {
                if (milestone.courseId && onStatusChange) {
                  onStatusChange(milestone.courseId, milestone.id, {
                    status: checked === true ? 'completed' : 'upcoming',
                    completedDate: checked === true ? new Date() : undefined,
                    progress: checked === true ? 100 : 0
                  });
                  onOpenChange(false);
                }
              }}
            />
            <label 
              htmlFor="mark-completed" 
              className="ml-2 text-sm cursor-pointer"
            >
              Mark as completed
            </label>
          </div>
          
          {milestone.url && (
            <Button variant="outline" asChild>
              <a href={milestone.url} target="_blank" rel="noopener noreferrer">
                View in Canvas
              </a>
            </Button>
          )}
          
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentDetailsDialog;
