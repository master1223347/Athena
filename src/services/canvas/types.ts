
import { JourneyCourse, JourneyMilestone } from '@/components/journey/JourneyMap';

export interface CanvasCredentials {
  domain: string;
  token: string;
}

export interface CanvasProfile {
  id: string;
  name: string;
  short_name: string;
  [key: string]: any;
}

export interface CanvasSyncResult {
  success: boolean;
  message?: string;
  stats?: {
    coursesAdded: number;
    coursesUpdated: number;
    milestonesAdded: number;
    milestonesUpdated: number;
    errors: any[];
  };
}

export interface CanvasAPIOptions {
  method?: string;
  data?: any;
  cacheControl?: string;
}
