import React, { useEffect, useState, useMemo } from "react";
import { JourneyCourse } from "./JourneyMap";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, CalendarDays } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import AssignmentDetailsDialog from "@/components/common/AssignmentDetailsDialog";
import { isToday, isTomorrow, format } from "date-fns";

interface DailyProgressProps {
  courses: JourneyCourse[];
  onMilestoneUpdate?: (
    courseId: string,
    milestoneId: string,
    updates: any
  ) => Promise<void>;
}

const DailyProgress: React.FC<DailyProgressProps> = ({
  courses,
  onMilestoneUpdate,
}) => {
  const { user } = useAuth();
  const [completionMap, setCompletionMap] = useState<Record<string, boolean>>({});
  const [todayCompletionMap, setTodayCompletionMap] = useState<Record<string, boolean>>({});
  const [celebrationShown, setCelebrationShown] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [todayProgressPercentage, setTodayProgressPercentage] = useState(0);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // tomorrow's
  const tomorrowAssignments = useMemo(() => {
    return (courses || []).flatMap((course) => {
      const ms = Array.isArray(course.milestones) ? course.milestones : [];
      return ms
        .filter((m) => m.dueDate && isTomorrow(m.dueDate))
        .map((m) => ({ ...m, courseName: course.title, courseId: course.id }));
    });
  }, [courses]);

  // ** today's assignments **
  const todayAssignments = useMemo(() => {
    const allAssignments = (courses || []).flatMap((course) => {
      const ms = Array.isArray(course.milestones) ? course.milestones : [];
      return ms
        .filter((m) => {
          if (!m.dueDate) return false;
          // Ensure dueDate is a Date object
          const dueDate = m.dueDate instanceof Date ? m.dueDate : new Date(m.dueDate);
          if (isNaN(dueDate.getTime())) return false;
          // Use isToday which handles timezone normalization
          return isToday(dueDate);
        })
        .map((m) => ({ ...m, courseName: course.title, courseId: course.id }));
    });
    return allAssignments;
  }, [courses]);

  // which due today are still incomplete?
  const incompleteToday = todayAssignments.filter(
    (a) => !(a.status === "completed" || todayCompletionMap[a.id])
  );

  // init map & progress for tomorrow's assignments
  useEffect(() => {
    const init: Record<string, boolean> = {};
    tomorrowAssignments.forEach((a) => {
      init[a.id] = a.status === "completed";
    });
    setCompletionMap(init);

    const done = tomorrowAssignments.filter((a) => a.status === "completed").length;
    setProgressPercentage(
      tomorrowAssignments.length > 0
        ? Math.round((done / tomorrowAssignments.length) * 100)
        : 100
    );
    setCelebrationShown(false);
  }, [tomorrowAssignments]);

  // init map & progress for today's assignments
  useEffect(() => {
    const init: Record<string, boolean> = {};
    todayAssignments.forEach((a) => {
      init[a.id] = a.status === "completed";
    });
    setTodayCompletionMap(init);

    const done = todayAssignments.filter((a) => a.status === "completed").length;
    setTodayProgressPercentage(
      todayAssignments.length > 0
        ? Math.round((done / todayAssignments.length) * 100)
        : 100
    );
  }, [todayAssignments]);

  // confetti on all done
  useEffect(() => {
    if (
      progressPercentage === 100 &&
      tomorrowAssignments.length > 0 &&
      !celebrationShown
    ) {
      const t = setTimeout(() => {
        new Audio("/success-sound.mp3").play().catch(() => {});
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        toast.success("Good job! All assignments due tomorrow are complete! 🎉", {
          duration: 5000,
        });
        setCelebrationShown(true);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [progressPercentage, tomorrowAssignments.length, celebrationShown]);

  // Format assignment title to be more readable
  const formatAssignmentTitle = (title: string): string => {
    if (!title) return "Unnamed Assignment";

    // Remove any HTML tags
    let formatted = title.replace(/<[^>]*>/g, "");

    // Replace multiple spaces with a single space
    formatted = formatted.replace(/\s+/g, " ");

    // Remove any leading/trailing whitespace
    formatted = formatted.trim();

    // Truncate if too long (more than 50 chars)
    if (formatted.length > 50) {
      formatted = formatted.substring(0, 47) + "...";
    }

    return formatted;
  };

  const handleToggleCompletion = async (
    assignment: any,
    isCompleted: boolean,
    isToday: boolean = false
  ) => {
    // Update local state immediately
    if (isToday) {
      setTodayCompletionMap((prev) => ({
        ...prev,
        [assignment.id]: isCompleted,
      }));

      // Calculate new progress percentage for today
      const completedCount = todayAssignments.reduce(
        (count, a) =>
          count +
          (a.id === assignment.id
            ? isCompleted
              ? 1
              : 0
            : a.status === "completed" || todayCompletionMap[a.id]
            ? 1
            : 0),
        0
      );

      const newProgressPercentage =
        todayAssignments.length > 0
          ? Math.round((completedCount / todayAssignments.length) * 100)
          : 100;

      setTodayProgressPercentage(newProgressPercentage);
    } else {
      setCompletionMap((prev) => ({
        ...prev,
        [assignment.id]: isCompleted,
      }));

      // Calculate new progress percentage for tomorrow
      const completedCount = tomorrowAssignments.reduce(
        (count, a) =>
          count +
          (a.id === assignment.id
            ? isCompleted
              ? 1
              : 0
            : a.status === "completed" || completionMap[a.id]
            ? 1
            : 0),
        0
      );

      const newProgressPercentage =
        tomorrowAssignments.length > 0
          ? Math.round((completedCount / tomorrowAssignments.length) * 100)
          : 100;

      setProgressPercentage(newProgressPercentage);
    }

    // Update in parent component
    if (onMilestoneUpdate) {
      try {
        await onMilestoneUpdate(assignment.courseId, assignment.id, {
          status: isCompleted ? "completed" : "upcoming",
          completedDate: isCompleted ? new Date() : undefined,
          progress: isCompleted ? 100 : 0,
        });
      } catch (error) {
        console.error("Error updating milestone:", error);
        // Revert local state if update fails
        if (isToday) {
          setTodayCompletionMap((prev) => ({
            ...prev,
            [assignment.id]: !isCompleted,
          }));
        } else {
          setCompletionMap((prev) => ({
            ...prev,
            [assignment.id]: !isCompleted,
          }));
        }
      }
    }
  };

  const handleAssignmentClick = (assignment: any) => {
    setSelectedAssignment(assignment);
    setDialogOpen(true);
  };

  const handleDialogStatusChange = async (
    courseId: string,
    milestoneId: string,
    updates: any
  ) => {
    if (onMilestoneUpdate) {
      try {
        await onMilestoneUpdate(courseId, milestoneId, updates);
        // Update the completion map as well (check if it's today or tomorrow)
        const isTodayAssignment = todayAssignments.some(a => a.id === milestoneId);
        const isTomorrowAssignment = tomorrowAssignments.some(a => a.id === milestoneId);
        
        if (updates.status === "completed") {
          if (isTodayAssignment) {
            setTodayCompletionMap((prev) => ({
              ...prev,
              [milestoneId]: true,
            }));
          }
          if (isTomorrowAssignment) {
            setCompletionMap((prev) => ({
              ...prev,
              [milestoneId]: true,
            }));
          }
        } else {
          if (isTodayAssignment) {
            setTodayCompletionMap((prev) => ({
              ...prev,
              [milestoneId]: false,
            }));
          }
          if (isTomorrowAssignment) {
            setCompletionMap((prev) => ({
              ...prev,
              [milestoneId]: false,
            }));
          }
        }
      } catch (error) {
        console.error("Error updating milestone:", error);
      }
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-journey-primary" />
          Daily Assignments
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-6">
          
          {/* ── Today's Assignments Section ── */}
          {todayAssignments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Today's Due Assignments
                </h4>
                <div className="font-bold text-xl text-red-600 dark:text-red-400">
                  {todayProgressPercentage}%
                </div>
              </div>
              <Progress value={todayProgressPercentage} className="h-2" />
              <div className="space-y-2">
                {todayAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-start gap-3">
                    <Checkbox
                      id={`today-assignment-${assignment.id}`}
                      checked={
                        assignment.status === "completed" ||
                        todayCompletionMap[assignment.id]
                      }
                      onCheckedChange={(checked) =>
                        handleToggleCompletion(assignment, !!checked, true)
                      }
                      className="mt-1"
                    />
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleAssignmentClick(assignment)}
                    >
                      <label
                        htmlFor={`today-assignment-${assignment.id}`}
                        className="text-sm font-medium cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {formatAssignmentTitle(assignment.title)}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {assignment.courseName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tomorrow's Assignments Section ── */}
          {tomorrowAssignments.length > 0 && (
            <div className="space-y-3">
              {todayAssignments.length > 0 && (
                <div className="border-t pt-4"></div>
              )}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-journey-primary flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Tomorrow's Due Assignments
                </h4>
                <div className="font-bold text-xl">{progressPercentage}%</div>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              {progressPercentage === 100 && (
                <div className="text-journey-success flex items-center text-sm">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  <span className="font-medium">All set for tomorrow!</span>
                </div>
              )}
              <div className="space-y-2">
                {tomorrowAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-start gap-3">
                    <Checkbox
                      id={`tomorrow-assignment-${assignment.id}`}
                      checked={
                        assignment.status === "completed" ||
                        completionMap[assignment.id]
                      }
                      onCheckedChange={(checked) =>
                        handleToggleCompletion(assignment, !!checked, false)
                      }
                      className="mt-1"
                    />
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleAssignmentClick(assignment)}
                    >
                      <label
                        htmlFor={`tomorrow-assignment-${assignment.id}`}
                        className="text-sm font-medium cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {formatAssignmentTitle(assignment.title)}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {assignment.courseName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Empty State ── */}
          {todayAssignments.length === 0 && tomorrowAssignments.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No assignments due today or tomorrow!</p>
            </div>
          )}
        </div>
      </CardContent>

      <AssignmentDetailsDialog
        milestone={selectedAssignment}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onStatusChange={handleDialogStatusChange}
      />
     {/* <Chatbot />  */}
    </Card>
  );
};


export default DailyProgress;
