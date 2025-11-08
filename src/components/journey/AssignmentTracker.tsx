import React, { useState, useMemo, useEffect } from "react";
import { JourneyCourse, JourneyMilestone } from "./JourneyMap";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutGrid,
  List,
  CalendarDays,
  AlertTriangle,
  Clock,
  CheckCircle,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { format, isPast, isToday, addDays, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import AssignmentDetailsDialog from "@/components/common/AssignmentDetailsDialog";
import { trackAssignmentTracker } from "@/utils/eventTracker";


function stripHtml(input: string): string {
  const div = document.createElement("div");
  div.innerHTML = input;
  return div.textContent || div.innerText || "";
}


interface AssignmentTrackerProps {
  courses: JourneyCourse[];
  onMilestoneUpdate?: (
    courseId: string,
    milestoneId: string,
    updates: Partial<JourneyMilestone>
  ) => void;
  defaultView?: "list" | "card";
}

type ViewMode = "list" | "card";
type FilterMode = "all" | "in-progress" | "at-risk" | "upcoming" | "completed";

function getDisplayStatus(milestone: JourneyMilestone): string {
  // If already completed, always return completed status
  if (milestone.status === "completed") {
    return "completed";
  }
  
  // Only mark as at-risk if upcoming and past due
  if (
    milestone.status === "upcoming" &&
    milestone.dueDate &&
    isPast(milestone.dueDate) &&
    !isToday(milestone.dueDate)
  ) {
    return "at-risk";
  }
  
  return milestone.status;
}

const AssignmentTracker: React.FC<AssignmentTrackerProps> = ({
  courses,
  onMilestoneUpdate,
  defaultView = "card",
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | "all">("all");
  const [selectedMilestone, setSelectedMilestone] = useState<
    | (JourneyMilestone & {
        courseName: string;
        courseId: string;
        courseCode?: string;
      })
    | null
  >(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Get all milestones from all courses
  const allMilestones = useMemo(() => {
    return courses.flatMap((course) =>
      course.milestones.map((milestone) => ({
        ...milestone,
        courseName: stripHtml(course.title || ""), 
        description: milestone.description ? stripHtml(milestone.description) : "",
        courseId: course.id,
        courseCode: course.code,
      }))
    );
  }, [courses]);
  

  // Filter milestones based on search query, filter mode, and course selection
  const filteredMilestones = useMemo(() => {
    let filtered = allMilestones;

    // Filter by course
    if (selectedCourse !== "all") {
      filtered = filtered.filter((m) => m.courseId === selectedCourse);
    }

    // Filter by status
    if (filterMode !== "all") {
      filtered = filtered.filter((m) => getDisplayStatus(m) === filterMode);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.courseName.toLowerCase().includes(query) ||
          (m.description && m.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [allMilestones, filterMode, searchQuery, selectedCourse]);

  // Sort milestones by due date (closest first)
  const sortedMilestones = useMemo(() => {
    return [...filteredMilestones].sort((a, b) => {
      // Put assignments without due dates at the end
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      // Sort by due date (ascending)
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  }, [filteredMilestones]);

  // Group milestones by status
  const inProgressMilestones = useMemo(
    () => sortedMilestones.filter((m) => getDisplayStatus(m) === "in-progress"),
    [sortedMilestones]
  );

  const upcomingMilestones = useMemo(
    () => sortedMilestones.filter((m) => getDisplayStatus(m) === "upcoming"),
    [sortedMilestones]
  );

  const atRiskMilestones = useMemo(
    () => sortedMilestones.filter((m) => getDisplayStatus(m) === "at-risk"),
    [sortedMilestones]
  );

  const completedMilestones = useMemo(
    () => sortedMilestones.filter((m) => getDisplayStatus(m) === "completed"),
    [sortedMilestones]
  );

  // Track when the component is first viewed
  useEffect(() => {
    trackAssignmentTracker("view", {
      numCourses: courses.length,
      numMilestones: allMilestones.length,
    });
  }, []);

  const handleMilestoneStatusChange = (
    milestone: any,
    isCompleted: boolean
  ) => {
    if (onMilestoneUpdate) {
  onMilestoneUpdate(milestone.courseId, milestone.id, {
    status: isCompleted ? "completed" : "upcoming",
    completedDate: isCompleted ? new Date() : undefined,
    progress: isCompleted ? 100 : 0,
  });

      // Track milestone completion
      if (isCompleted) {
        trackAssignmentTracker("complete", {
          milestoneId: milestone.id,
          milestoneTitle: milestone.title,
          courseId: milestone.courseId,
          courseName: milestone.courseName,
        });
      }
    }
  };

  const handleDialogStatusChange = (
    courseId: string,
    milestoneId: string,
    updates: Partial<JourneyMilestone>
  ) => {
    if (onMilestoneUpdate) {
      onMilestoneUpdate(courseId, milestoneId, updates);
    }
  };

  const openMilestoneDetails = (milestone: any) => {
    setSelectedMilestone(milestone);
    setDialogOpen(true);
  };

  // Force list view when searching
  React.useEffect(() => {
    if (searchQuery && viewMode === "card") {
      setViewMode("list");
    }
  }, [searchQuery]);

  // Track when filters are applied
  const handleFilterChange = (newFilter: FilterMode) => {
    setFilterMode(newFilter);
    trackAssignmentTracker("filter", {
      filterMode: newFilter,
      viewMode,
    });
  };

  const renderMilestoneCard = (milestone: any) => {
    const isMissing =
      getDisplayStatus(milestone) === "at-risk" &&
      milestone.dueDate &&
      isPast(milestone.dueDate) &&
      !isToday(milestone.dueDate);

    const statusColor = {
      completed: "bg-journey-success/10 text-journey-success",
      "in-progress": "bg-journey-primary/10 text-journey-primary",
      "at-risk": "bg-journey-warning/10 text-journey-warning",
      upcoming: "bg-muted text-muted-foreground",
    }[getDisplayStatus(milestone)];

    return (
      <Card
        key={milestone.id}
        className={cn(
          "overflow-hidden cursor-pointer",
          getDisplayStatus(milestone) === "completed"
            ? "border-l-4 border-l-journey-success"
            : getDisplayStatus(milestone) === "in-progress"
            ? "border-l-4 border-l-journey-primary"
            : isMissing
            ? "border-l-4 border-l-journey-danger"
            : getDisplayStatus(milestone) === "at-risk"
            ? "border-l-4 border-l-journey-warning"
            : ""
        )}
        onClick={() => openMilestoneDetails(milestone)}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-medium line-clamp-2">{milestone.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {milestone.courseName}
              </p>

              {milestone.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {milestone.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mt-1 text-xs">
                {milestone.dueDate && (
                  <Badge
                    variant="outline"
                    className={
                      isMissing ? "bg-destructive/10 text-destructive" : ""
                    }
                  >
                    {isMissing
                      ? `${Math.abs(
                          differenceInDays(milestone.dueDate, new Date())
                        )} days overdue`
                      : `Due: ${format(milestone.dueDate, "MMM d, yyyy")}`}
                  </Badge>
                )}

                <Badge variant="outline" className={statusColor}>
                  {getDisplayStatus(milestone)}
                </Badge>

                {milestone.type && (
                  <Badge variant="outline">{milestone.type}</Badge>
                )}
              </div>
            </div>

            <Checkbox
              checked={getDisplayStatus(milestone) === "completed"}
              onCheckedChange={(checked) => {
                handleMilestoneStatusChange(milestone, checked === true);
                // Stop event propagation to prevent opening the dialog
                event?.stopPropagation();
              }}
              className="ml-2 mt-1"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {milestone.progress !== undefined &&
            milestone.progress > 0 &&
            milestone.progress < 100 && (
              <div className="mt-3">
                <Progress value={milestone.progress} className="h-1.5" />
              </div>
            )}
        </CardContent>
      </Card>
    );
  };

  const renderMilestoneRow = (milestone: any) => {
    const isMissing =
      getDisplayStatus(milestone) === "at-risk" &&
      milestone.dueDate &&
      isPast(milestone.dueDate) &&
      !isToday(milestone.dueDate);

    return (
      <div
        key={milestone.id}
        className={cn(
          "flex items-start gap-3 p-3 border-b last:border-0 cursor-pointer",
          getDisplayStatus(milestone) === "completed"
            ? "bg-journey-success/5"
            : isMissing
            ? "bg-journey-danger/5"
            : ""
        )}
        onClick={() => openMilestoneDetails(milestone)}
      >
        <Checkbox
          checked={getDisplayStatus(milestone) === "completed"}
          onCheckedChange={(checked) => {
            handleMilestoneStatusChange(milestone, checked === true);
            // Stop event propagation to prevent opening the dialog
            event?.stopPropagation();
          }}
          className="mt-1"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{milestone.title}</div>
          <div className="text-xs text-muted-foreground">
            {milestone.courseName}
          </div>

          <div className="flex flex-wrap gap-1 mt-1">
            {milestone.dueDate && (
              <Badge variant="outline" className="text-xs">
                {isMissing
                  ? `${Math.abs(
                      differenceInDays(milestone.dueDate, new Date())
                    )} days overdue`
                  : `Due: ${format(milestone.dueDate, "MMM d, yyyy")}`}
              </Badge>
            )}

            {milestone.type && (
              <Badge variant="outline" className="text-xs">
                {milestone.type}
              </Badge>
            )}
          </div>
        </div>

        <Badge
          variant={
            getDisplayStatus(milestone) === "completed"
              ? "default"
              : getDisplayStatus(milestone) === "in-progress"
              ? "secondary"
              : isMissing
              ? "destructive"
              : getDisplayStatus(milestone) === "at-risk"
              ? "outline"
              : "outline"
          }
        >
          {getDisplayStatus(milestone)}
        </Badge>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search assignments..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? "bg-muted" : ""}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>

        <div className="hidden md:flex border rounded-md overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-none h-9 px-3",
              viewMode === "list" && "bg-muted"
            )}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-none h-9 px-3",
              viewMode === "card" && "bg-muted"
            )}
            onClick={() => setViewMode("card")}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Cards
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="p-4 border rounded-md bg-muted/20">
          <div className="space-y-2">
            <div>
              <h4 className="font-medium text-sm mb-1">Course</h4>
              <select
                className="w-full p-2 rounded-md border"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="all">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-1">Status</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={filterMode === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("all")}
                  className="justify-start"
                >
                  <span>All</span>
                </Button>

                <Button
                  variant={filterMode === "in-progress" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("in-progress")}
                  className="justify-start"
                >
                  <Clock className="h-4 w-4 mr-2 text-journey-primary" />
                  <span>In Progress</span>
                </Button>

                <Button
                  variant={filterMode === "at-risk" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("at-risk")}
                  className="justify-start"
                >
                  <AlertTriangle className="h-4 w-4 mr-2 text-journey-warning" />
                  <span>At Risk</span>
                </Button>

                <Button
                  variant={filterMode === "upcoming" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("upcoming")}
                  className="justify-start"
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  <span>Upcoming</span>
                </Button>

                <Button
                  variant={filterMode === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("completed")}
                  className="justify-start col-span-2"
                >
                  <CheckCircle className="h-4 w-4 mr-2 text-journey-success" />
                  <span>Completed</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {searchQuery ? (
        // Search results view
        <div>
          <h3 className="font-medium mb-2">
            Search Results ({filteredMilestones.length})
          </h3>

          <div
            className={
              viewMode === "card"
                ? "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "border rounded-md divide-y"
            }
          >
            {filteredMilestones.length === 0 ? (
              <div className="col-span-full text-center p-8 bg-muted/10 rounded-md">
                <p className="text-muted-foreground">
                  No assignments found matching "{searchQuery}"
                </p>
              </div>
            ) : (
              filteredMilestones.map((milestone) =>
                viewMode === "card"
                  ? renderMilestoneCard(milestone)
                  : renderMilestoneRow(milestone)
              )
            )}
          </div>
        </div>
      ) : (
        // Default categorized view
        <Tabs defaultValue="in-progress">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="in-progress" className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-journey-primary" />
              <span>In Progress</span>
              <Badge variant="outline" className="ml-2">
                {inProgressMilestones.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger value="upcoming" className="flex items-center">
              <CalendarDays className="w-4 h-4 mr-2" />
              <span>Upcoming</span>
              <Badge variant="outline" className="ml-2">
                {upcomingMilestones.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger value="at-risk" className="flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-journey-warning" />
              <span>At Risk</span>
              <Badge variant="outline" className="ml-2">
                {atRiskMilestones.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger value="completed" className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-journey-success" />
              <span>Done</span>
              <Badge variant="outline" className="ml-2">
                {completedMilestones.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="in-progress">
            {inProgressMilestones.length === 0 ? (
              <div className="text-center p-8 bg-muted/10 rounded-md">
                <p className="text-muted-foreground">
                  No in-progress assignments
                </p>
              </div>
            ) : (
              <div
                className={
                  viewMode === "card"
                    ? "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    : "border rounded-md divide-y"
                }
              >
                {inProgressMilestones.map((milestone) =>
                  viewMode === "card"
                    ? renderMilestoneCard(milestone)
                    : renderMilestoneRow(milestone)
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {upcomingMilestones.length === 0 ? (
              <div className="text-center p-8 bg-muted/10 rounded-md">
                <p className="text-muted-foreground">No upcoming assignments</p>
              </div>
            ) : (
              <div
                className={
                  viewMode === "card"
                    ? "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    : "border rounded-md divide-y"
                }
              >
                {upcomingMilestones.map((milestone) =>
                  viewMode === "card"
                    ? renderMilestoneCard(milestone)
                    : renderMilestoneRow(milestone)
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="at-risk">
            {atRiskMilestones.length === 0 ? (
              <div className="text-center p-8 bg-muted/10 rounded-md">
                <CheckCircle className="h-10 w-10 mx-auto text-journey-success opacity-70 mb-2" />
                <p>No at-risk assignments - great work!</p>
              </div>
            ) : (
              <div
                className={
                  viewMode === "card"
                    ? "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    : "border rounded-md divide-y"
                }
              >
                {atRiskMilestones.map((milestone) =>
                  viewMode === "card"
                    ? renderMilestoneCard(milestone)
                    : renderMilestoneRow(milestone)
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedMilestones.length === 0 ? (
              <div className="text-center p-8 bg-muted/10 rounded-md">
                <p className="text-muted-foreground">
                  No completed assignments yet
                </p>
              </div>
            ) : (
              <div
                className={
                  viewMode === "card"
                    ? "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    : "border rounded-md divide-y"
                }
              >
                {completedMilestones.map((milestone) =>
                  viewMode === "card"
                    ? renderMilestoneCard(milestone)
                    : renderMilestoneRow(milestone)
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <AssignmentDetailsDialog
        milestone={selectedMilestone}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onStatusChange={handleDialogStatusChange}
      />
    </div>
  );
};

export default AssignmentTracker;
