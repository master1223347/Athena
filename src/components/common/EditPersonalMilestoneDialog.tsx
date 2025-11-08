import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { personalMilestoneService, PersonalMilestone, UpdatePersonalMilestoneData } from '@/services/personalMilestoneService';
import { JourneyCourse } from '@/components/journey/JourneyMap';
import { toast } from 'sonner';

interface EditPersonalMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMilestoneUpdated: () => void;
  onMilestoneDeleted: () => void;
  milestone: PersonalMilestone | null;
  courses: JourneyCourse[];
}

const EditPersonalMilestoneDialog: React.FC<EditPersonalMilestoneDialogProps> = ({
  open,
  onOpenChange,
  onMilestoneUpdated,
  onMilestoneDeleted,
  milestone,
  courses
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [status, setStatus] = useState<'upcoming' | 'in-progress' | 'at-risk' | 'completed'>('upcoming');
  const [type, setType] = useState<'assignment' | 'exam' | 'reading' | 'project' | 'module' | 'course'>('assignment');
  const [courseId, setCourseId] = useState<string>('none');
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Populate form when milestone changes
  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title);
      setDescription(milestone.description || '');
      setDueDate(milestone.due_date);
      setStatus(milestone.status);
      setType(milestone.type);
      setCourseId(milestone.course_id || 'none');
      setUrl(milestone.url || '');
    }
  }, [milestone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!milestone || !title.trim()) {
      toast.error('Please enter a title for your task');
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: UpdatePersonalMilestoneData = {
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate,
        status,
        type,
        course_id: courseId === 'none' ? undefined : courseId,
        url: url.trim() || undefined,
      };

      await personalMilestoneService.updatePersonalMilestone(milestone.id, updateData);
      
      toast.success('Personal task updated successfully!');
      onMilestoneUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating personal milestone:', error);
      toast.error('Failed to update personal task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!milestone) return;

    if (!confirm('Are you sure you want to delete this personal task? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      await personalMilestoneService.deletePersonalMilestone(milestone.id);
      
      toast.success('Personal task deleted successfully!');
      onMilestoneDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting personal milestone:', error);
      toast.error('Failed to delete personal task. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!milestone) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Personal Task
          </DialogTitle>
          <DialogDescription>
            Update your personal task details.
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

          <DialogFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Trash2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Task'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPersonalMilestoneDialog; 