
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JourneyProgress } from './JourneyProgress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Map } from 'lucide-react';

// Extended with all Canvas data fields
export interface JourneyMilestone {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'at-risk' | 'upcoming';
  dueDate?: Date;
  completedDate?: Date;
  progress: number;
  grade?: number;
  points_possible?: number;
  type: 'assignment' | 'exam' | 'project' | 'reading' | 'other';
  url?: string;
  canvas_id?: string;
  courseId?: string; // Added courseId property
}

// Extended with all Canvas data fields
export interface JourneyCourse {
  id: string;
  title: string;
  code: string;
  term: string;
  progress: number;
  grade?: number;
  milestones: JourneyMilestone[];
  startDate?: Date;
  endDate?: Date;
  description: string;
  canvas_id?: string;
}

interface JourneyMapProps {
  courses: JourneyCourse[];
}

export const JourneyMap: React.FC<JourneyMapProps> = ({ courses }) => {
  const [view, setView] = useState<'progress' | 'map'>('progress');
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
          <TabsTrigger value="progress" onClick={() => setView('progress')} className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Progress View
          </TabsTrigger>
          <TabsTrigger value="map" onClick={() => setView('map')} className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Journey Map
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="progress" className="w-full">
          <JourneyProgress courses={courses} />
        </TabsContent>
        
        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>Academic Journey Map</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The Journey Map visualization is coming soon. This view will show your academic journey visually,
                connecting courses and milestones in a timeline format.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
