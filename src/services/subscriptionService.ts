import { supabase } from '@/integrations/supabase/client';

export class SubscriptionService {
  /**
   * Cancel a user's subscription
   * This will:
   * 1. Cancel the Stripe subscription
   * 2. Delete all Canvas files
   * 3. Update profile to basic plan
   * 4. Remove Stripe IDs
   */
  static async cancelSubscription(userId: string): Promise<void> {
    try {
      // Get user's profile to get Stripe subscription ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_subscription_id, stripe_customer_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw new Error('Failed to fetch profile');
      }

      // Cancel Stripe subscription if exists
      if (profile?.stripe_subscription_id) {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eakktmgnlwatvrgmjcok.supabase.co';
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVha2t0bWdubHdhdHZyZ21qY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzNDM4MTQsImV4cCI6MjA1NzkxOTgxNH0.T4iG0f02Ar5IWIRHXbHh8HCpNEvDfwOFHE0EX_bzIxc';

          const response = await fetch(`${supabaseUrl}/functions/v1/cancel-subscription`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              subscriptionId: profile.stripe_subscription_id,
            }),
          });

          if (!response.ok) {
            console.error('Failed to cancel Stripe subscription:', await response.text());
            // Continue anyway - we still want to clean up local data
          }
        } catch (stripeError) {
          console.error('Error canceling Stripe subscription:', stripeError);
          // Continue anyway - we still want to clean up local data
        }
      }

      // Delete all Canvas files for the user
      const { error: filesError } = await supabase
        .from('canvas_files')
        .delete()
        .eq('user_id', userId);

      if (filesError) {
        console.error('Error deleting Canvas files:', filesError);
        throw new Error('Failed to delete Canvas files');
      }

      // Update profile: change to basic plan and remove Stripe IDs
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          plan: 'basic',
          subscription_status: 'none',
          stripe_customer_id: null,
          stripe_subscription_id: null,
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error('Failed to update profile');
      }

    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Get user's current subscription status
   */
  static async getSubscriptionStatus(userId: string): Promise<{
    plan: string;
    subscriptionStatus: string;
    hasStripeSubscription: boolean;
  }> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('plan, subscription_status, stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      throw new Error('Failed to fetch subscription status');
    }

    return {
      plan: profile.plan || 'basic',
      subscriptionStatus: profile.subscription_status || 'none',
      hasStripeSubscription: !!profile.stripe_subscription_id,
    };
  }
}

