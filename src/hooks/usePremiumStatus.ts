import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to check if a user has premium status
 * @param userId - The user ID to check
 * @returns Object with isPremium boolean and isLoading boolean
 */
export const usePremiumStatus = (userId: string | undefined) => {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!userId) {
        setIsPremium(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error checking premium status:', error);
          setIsPremium(false);
        } else {
          setIsPremium(profile?.plan === 'premium');
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremiumStatus();
  }, [userId]);

  return { isPremium, isLoading };
};

