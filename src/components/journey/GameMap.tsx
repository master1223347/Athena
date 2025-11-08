
import React, { useState, useEffect, useRef } from 'react';
import { JourneyCourse, JourneyMilestone } from './JourneyMap';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Clock, 
  Award, 
  BookOpen,
  Flag,
  Star,
  FileText,
  Sparkles,
  Zap
} from 'lucide-react';
import { format, isThisWeek, isToday, addDays } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import AssignmentDetailsDialog from '@/components/common/AssignmentDetailsDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface GameMapProps {
  courses: JourneyCourse[];
  onMilestoneUpdate?: (courseId: string, milestoneId: string, updates: Partial<JourneyMilestone>) => void;
}

const COLOR_MAP = {
  completed: 'bg-journey-success',
  'in-progress': 'bg-journey-primary',
  upcoming: 'bg-journey-muted',
  'at-risk': 'bg-journey-warning'
};

const ICON_MAP: Record<string, React.ReactNode> = {
  assignment: <FileText className="w-4 h-4" />,
  exam: <BookOpen className="w-4 h-4" />,
  reading: <BookOpen className="w-4 h-4" />,
  project: <Flag className="w-4 h-4" />,
  module: <BookOpen className="w-4 h-4" />,
  course: <Star className="w-4 h-4" />
};

const GameMap: React.FC<GameMapProps> = ({ courses, onMilestoneUpdate }) => {
  const [viewMode, setViewMode] = useState<'courses' | 'milestones'>('milestones');
  const [selectedCourse, setSelectedCourse] = useState<JourneyCourse | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<(JourneyMilestone & {
    courseName: string;
    courseId: string;
    courseCode?: string;
  }) | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  
  // Prepare milestone data
  const currentWeekMilestones = courses.flatMap(course => 
    course.milestones
      .filter(m => m.dueDate && isThisWeek(m.dueDate))
      .map(m => ({ ...m, courseName: course.title, courseCode: course.code, courseId: course.id }))
  );
  
  const todayMilestones = courses.flatMap(course => 
    course.milestones
      .filter(m => m.dueDate && isToday(m.dueDate))
      .map(m => ({ ...m, courseName: course.title, courseCode: course.code, courseId: course.id }))
  );
  
  const upcomingMilestones = courses.flatMap(course => 
    course.milestones
      .filter(m => 
        m.dueDate && 
        m.dueDate > new Date() && 
        m.dueDate <= addDays(new Date(), 14) &&
        m.status !== 'completed'
      )
      .map(m => ({ ...m, courseName: course.title, courseCode: course.code, courseId: course.id }))
  ).sort((a, b) => {
    if (!a.dueDate || !b.dueDate) return 0;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });
  
  const allMilestones = courses.flatMap(course => 
    course.milestones.map(m => ({ ...m, courseName: course.title, courseCode: course.code, courseId: course.id }))
  );
  
  // Handle milestone details view
  const handleMilestoneClick = (milestone: JourneyMilestone & { courseName: string, courseCode: string, courseId: string }) => {
    setSelectedMilestone(milestone);
    setDialogOpen(true);
  };
  
  // Handle status change from dialog
  const handleDialogStatusChange = (courseId: string, milestoneId: string, updates: Partial<JourneyMilestone>) => {
    if (onMilestoneUpdate) {
      onMilestoneUpdate(courseId, milestoneId, updates);
      
      // Show toast notification
      if (updates.status === 'completed') {
        toast.success(`Assignment marked as completed!`);
      }
    }
    
    // Close the dialog
    setDialogOpen(false);
  };
  
  // Group milestones by course
  const milestonesByCourse = courses.map(course => ({
    course,
    milestones: course.milestones
  }));
  
  // Calculate weekly progress
  const weeklyProgress = currentWeekMilestones.length > 0
    ? Math.round((currentWeekMilestones.filter(m => m.status === 'completed').length / currentWeekMilestones.length) * 100)
    : 0;
  
  // Calculate daily progress
  const dailyProgress = todayMilestones.length > 0
    ? Math.round((todayMilestones.filter(m => m.status === 'completed').length / todayMilestones.length) * 100)
    : 0;
  
  return (
    <div className="relative flex flex-col h-[75vh]">
      {/* Game Map Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <Button 
            variant={viewMode === 'courses' ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode('courses')}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Courses
          </Button>
          <Button 
            variant={viewMode === 'milestones' ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode('milestones')}
          >
            <Flag className="w-4 h-4 mr-2" />
            Journey Path
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setScale(s => Math.min(s + 0.2, 2))}
          >
            +
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setScale(s => Math.max(s - 0.2, 0.5))}
          >
            -
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {setPosition({ x: 0, y: 0 }); setScale(1);}}
          >
            Reset
          </Button>
        </div>
      </div>
      
      {/* Progress Indicators */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-journey-primary/10 to-journey-primary/5 p-4 rounded-xl border border-journey-primary/20">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-journey-primary mr-2" />
              <h3 className="font-semibold">This Week</h3>
            </div>
            <Badge variant="outline">{currentWeekMilestones.filter(m => m.status === 'completed').length}/{currentWeekMilestones.length}</Badge>
          </div>
          <Progress value={weeklyProgress} className="h-2 mb-1" />
          <p className="text-xs text-muted-foreground text-right">{weeklyProgress}% Complete</p>
        </div>
        
        <div className="bg-gradient-to-r from-journey-success/10 to-journey-success/5 p-4 rounded-xl border border-journey-success/20">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-journey-success mr-2" />
              <h3 className="font-semibold">Today</h3>
            </div>
            <Badge variant="outline">{todayMilestones.filter(m => m.status === 'completed').length}/{todayMilestones.length}</Badge>
          </div>
          <Progress value={dailyProgress} className="h-2 mb-1" />
          <p className="text-xs text-muted-foreground text-right">{dailyProgress}% Complete</p>
        </div>
      </div>
      
      {/* Draggable Game Map */}
      <div ref={constraintsRef} className="flex-1 overflow-hidden border rounded-lg bg-slate-50 shadow-inner relative">
        <motion.div
          drag
          dragConstraints={constraintsRef}
          dragMomentum={false}
          dragElastic={0.1}
          whileDrag={{ cursor: "grabbing" }}
          style={{ scale }}
          animate={isDragging ? {} : { x: position.x, y: position.y }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(e, info) => {
            setIsDragging(false);
            setPosition(prev => ({
              x: prev.x + info.offset.x,
              y: prev.y + info.offset.y
            }));
          }}
          className="min-w-[1200px] min-h-[800px] cursor-grab active:cursor-grabbing"
        >
          {viewMode === 'milestones' ? (
            <div className="p-8">
              {/* Journey Path Visual */}
              <div className="relative">
                <div className="absolute top-0 left-1/2 w-1 h-full bg-journey-muted/30 -translate-x-1/2 z-0"></div>
                
                <div className="flex flex-col items-center gap-6 relative z-10">
                  {/* Starting point */}
                  <div className="w-10 h-10 rounded-full bg-journey-primary flex items-center justify-center text-white shadow-md">
                    <Flag className="w-5 h-5" />
                  </div>
                  
                  {allMilestones.map((milestone, index) => (
                    <TooltipProvider key={milestone.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div
                            className={`w-32 h-24 rounded-xl p-3 shadow-md flex flex-col justify-between ${
                              COLOR_MAP[milestone.status]
                            } bg-opacity-80 hover:bg-opacity-100 transition-all cursor-pointer relative z-10`}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => handleMilestoneClick(milestone)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                                {ICON_MAP[milestone.type] || <FileText className="w-3 h-3" />}
                              </div>
                              {milestone.status === 'completed' && (
                                <CheckCircle2 className="w-5 h-5 text-white" />
                              )}
                              {milestone.status === 'at-risk' && (
                                <AlertCircle className="w-5 h-5 text-white" />
                              )}
                            </div>
                            
                            <div>
                              <div className="text-xs text-white/90 font-semibold truncate">
                                {milestone.title}
                              </div>
                              <div className="text-[10px] text-white/80">
                                {milestone.courseCode}
                              </div>
                              {milestone.dueDate && (
                                <div className="text-[10px] text-white/80">
                                  {format(milestone.dueDate, 'MMM d')}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div>
                            <div className="font-semibold">{milestone.title}</div>
                            <div className="text-xs">{milestone.courseName}</div>
                            {milestone.dueDate && (
                              <div className="text-xs">
                                Due: {format(milestone.dueDate, 'MMM d, yyyy')}
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  
                  {/* End point */}
                  <div className="w-12 h-12 rounded-full bg-journey-success flex items-center justify-center text-white shadow-md">
                    <Award className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-8 p-8">
              {milestonesByCourse.map(({ course, milestones }) => (
                <motion.div
                  key={course.id}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
                  whileHover={{ y: -5 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{course.code}</h3>
                      <p className="text-sm text-muted-foreground">{course.title}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge 
                        className={
                          course.progress >= 90 ? "bg-journey-success" :
                          course.progress >= 60 ? "bg-journey-primary" :
                          "bg-journey-muted"
                        }
                      >
                        Level {Math.floor(course.progress / 10) + 1}
                      </Badge>
                      {course.grade !== undefined && (
                        <span className="text-xs mt-1">Grade: {Math.round(course.grade)}%</span>
                      )}
                    </div>
                  </div>
                  
                  <Progress value={course.progress} className="h-2 mb-3" />
                  
                  <div className="flex justify-between text-xs text-muted-foreground mb-4">
                    <span>{course.progress}% complete</span>
                    <span>{milestones.filter(m => m.status === 'completed').length}/{milestones.length} completed</span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {milestones.slice(0, 8).map((milestone) => (
                      <div 
                        key={milestone.id}
                        className={`h-8 w-8 rounded-full ${COLOR_MAP[milestone.status]} flex items-center justify-center cursor-pointer`}
                        onClick={() => handleMilestoneClick({
                          ...milestone,
                          courseName: course.title,
                          courseCode: course.code,
                          courseId: course.id
                        })}
                      >
                        {milestone.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : ICON_MAP[milestone.type] || <FileText className="w-4 h-4 text-white" />}
                      </div>
                    ))}
                    {milestones.length > 8 && (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                        +{milestones.length - 8}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
        
        {/* Next milestones side panel */}
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-white/90 backdrop-blur-sm border-l p-4 overflow-y-auto">
          <div className="flex items-center mb-3">
            <Sparkles className="w-5 h-5 text-journey-primary mr-2" />
            <h3 className="font-semibold">Next Quests</h3>
          </div>
          
          <div className="space-y-3">
            {upcomingMilestones.slice(0, 5).map(milestone => (
              <div 
                key={milestone.id}
                className="p-2 border rounded-lg bg-white hover:bg-gray-50 cursor-pointer"
                onClick={() => handleMilestoneClick(milestone)}
              >
                <div className="flex items-start gap-2">
                  <div className={`w-8 h-8 rounded-full ${COLOR_MAP[milestone.status]} flex items-center justify-center`}>
                    {ICON_MAP[milestone.type] || <FileText className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium line-clamp-1">{milestone.title}</div>
                    <div className="text-xs text-muted-foreground">{milestone.courseCode}</div>
                    {milestone.dueDate && (
                      <div className="text-xs text-journey-primary">
                        {format(milestone.dueDate, 'MMM d')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {upcomingMilestones.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Zap className="w-8 h-8 mb-2 text-journey-muted" />
                <p className="text-muted-foreground text-sm">No upcoming quests!</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Milestone details dialog */}
      <AssignmentDetailsDialog
        milestone={selectedMilestone}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onStatusChange={handleDialogStatusChange}
      />
    </div>
  );
};

export default GameMap;
