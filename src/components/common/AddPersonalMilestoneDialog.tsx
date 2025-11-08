import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { personalMilestoneService, CreatePersonalMilestoneData } from '@/services/personalMilestoneService';
import { JourneyCourse } from '@/components/journey/JourneyMap';
import { toast } from 'sonner';

interface AddPersonalMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMilestoneCreated: () => void;
  userId: string;
  courses: JourneyCourse[];
  selectedDate?: Date;
}

const AddPersonalMilestoneDialog: React.FC<AddPersonalMilestoneDialogProps> = ({
  open,
  onOpenChange,
  onMilestoneCreated,
  userId,
  courses,
  selectedDate
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(selectedDate);
  const [status, setStatus] = useState<'upcoming' | 'in-progress' | 'at-risk' | 'completed'>('upcoming');
  const [type, setType] = useState<'assignment' | 'exam' | 'reading' | 'project' | 'module' | 'course'>('assignment');
  const [courseId, setCourseId] = useState<string>('none');
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setDueDate(selectedDate);
      setStatus('upcoming');
      setType('assignment');
      setCourseId('none');
      setUrl('');
    }
  }, [open, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a title for your task');
      return;
    }

    setIsSubmitting(true);

    try {
      const milestoneData: CreatePersonalMilestoneData = {
        user_id: userId,
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate,
        status,
        type,
        course_id: courseId === 'none' ? undefined : courseId || undefined,
        url: url.trim() || undefined,
      };

      await personalMilestoneService.createPersonalMilestone(milestoneData);
      
      toast.success('Personal task created successfully!');
      onMilestoneCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating personal milestone:', error);
      toast.error('Failed to create personal task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Personal Task
          </DialogTitle>
          <DialogDescription>
            Create a personal task or assignment to track in your calendar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value: any) => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="reading">Reading</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="module">Module</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course">Associated Course (Optional)</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No course association</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code || course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL (Optional)</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPersonalMilestoneDialog; 