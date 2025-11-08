import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/admin';

export interface ReferralResult {
  success: boolean;
  message: string;
  referrerFound: boolean;
  pointsAwarded: number;
}

export class ReferralService {
  /**
   * Process a referral and award points to both users
   */
  static async processReferral(
    newUserId: string,
    referrerEmail: string
  ): Promise<ReferralResult> {
    try {
      console.log('Processing referral for:', { newUserId, referrerEmail });
      
      // Check if referrer email exists in database
      const { data: referrer, error: referrerError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, points')
        .eq('email', referrerEmail.trim().toLowerCase())
        .single();

      console.log('Referrer query result:', { 
        referrer, 
        error: referrerError,
        emailSearched: referrerEmail.trim().toLowerCase()
      });

      if (referrerError || !referrer) {
        console.log('Referrer not found, checking all profiles...');
        
        // Debug: Let's see what emails exist in the database
        const { data: allProfiles, error: allError } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .limit(5);
        
        console.log('Sample profiles in database:', { allProfiles, allError });
        
        return {
          success: false,
          message: 'Referrer email not found in our system',
          referrerFound: false,
          pointsAwarded: 0,
        };
      }

      // Award 20 points to both users
      const pointsToAward = 20;

      // Update referrer's points
      const { error: referrerUpdateError } = await supabase
        .from('profiles')
        .update({ 
          points: (referrer.points || 0) + pointsToAward,
          updated_at: new Date().toISOString()
        })
        .eq('id', referrer.id);

      if (referrerUpdateError) {
        console.error('Error updating referrer points:', referrerUpdateError);
        return {
          success: false,
          message: 'Failed to award points to referrer',
          referrerFound: true,
          pointsAwarded: 0,
        };
      }

      // Update new user's points
      const { error: newUserUpdateError } = await supabase
        .from('profiles')
        .update({ 
          points: pointsToAward,
          updated_at: new Date().toISOString()
        })
        .eq('id', newUserId);

      if (newUserUpdateError) {
        console.error('Error updating new user points:', newUserUpdateError);
        return {
          success: false,
          message: 'Failed to award points to new user',
          referrerFound: true,
          pointsAwarded: 0,
        };
      }

      return {
        success: true,
        message: `Successfully awarded ${pointsToAward} points to both you and ${referrerEmail}!`,
        referrerFound: true,
        pointsAwarded: pointsToAward,
      };

    } catch (error) {
      console.error('Error processing referral:', error);
      return {
        success: false,
        message: 'An error occurred while processing the referral',
        referrerFound: false,
        pointsAwarded: 0,
      };
    }
  }
} 