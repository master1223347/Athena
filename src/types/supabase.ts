
import { Database } from '@/integrations/supabase/types';

// Export the existing Database type for convenience
export type { Database } from '@/integrations/supabase/types';

// Export the Json type from the Database definition
export type Json = Database['public']['Tables']['achievements']['Row']['requirements'];

// Define additional types that extend or use the Supabase types
export type ProfileWithAvatar = Database['public']['Tables']['profiles']['Row'] & {
  avatar_url?: string;
};

// Add any other extended types here
export type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
};

// Export table row types for convenience
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Course = Database['public']['Tables']['courses']['Row'];
export type Milestone = Database['public']['Tables']['milestones']['Row'];
export type Achievement = Database['public']['Tables']['achievements']['Row'];
