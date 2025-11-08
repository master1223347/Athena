import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { GamblingService, TestScoreEstimate, GamblingStats, UpcomingAssignment, GambleWithCourse } from '@/services/gamblingService';
import { supabase } from '@/integrations/supabase/client';

export interface GamblingState {
  selectedTest: string | null;
  betAmount: string;
  multiplier: number;
  requiredScore: number;
  scoreEstimate: TestScoreEstimate | null;
  isLoading: boolean;
  error: string | null;
  stats: GamblingStats | null;
  upcomingAssignments: UpcomingAssignment[];
  selectedAssignment: UpcomingAssignment | null;
  currentGambles: GambleWithCourse[];
  isPremium: boolean;
  freeUserLimits: { maxMultiplier: number; maxBetPercentage: number };
  availablePoints: number;
}

export const useGambling = () => {
  const { user } = useAuth();
  const [state, setState] = useState<GamblingState>({
    selectedTest: null,
    betAmount: '',
    multiplier: 1.0,
    requiredScore: 0,
    scoreEstimate: null,
    isLoading: false,
    error: null,
    stats: null,
    upcomingAssignments: [],
    selectedAssignment: null,
    currentGambles: [],
    isPremium: false,
    freeUserLimits: { maxMultiplier: 1.5, maxBetPercentage: 0.1 },
    availablePoints: 0,
  });

  const refreshCurrentGambles = async (userId: string) => {
    const { data } = await supabase
      .from('gambles')
      .select('*, courses(title)')
      .eq('user_id', userId)
      .eq('resolved', false)
      .order('created_at', { ascending: false });
    setState(prev => ({ ...prev, currentGambles: data || [] }));
  };

  useEffect(() => {
    if (user) loadGamblingData();
  }, [user]);

  const loadGamblingData = async () => {
    if (!user) return;
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const [stats, upcomingAssignments, isPremium, limits, availablePoints] = await Promise.all([
        GamblingService.getGamblingStats(user.id),
        GamblingService.getUpcomingAssignments(user.id),
        GamblingService.isPremiumUser(user.id),
        GamblingService.getFreeUserLimits(user.id),
        GamblingService.getUserSpendablePoints(user.id),
      ]);
      await refreshCurrentGambles(user.id);
      setState(prev => ({
        ...prev,
        stats,
        upcomingAssignments,
        isPremium,
        freeUserLimits: limits,
        availablePoints,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to load gambling data', isLoading: false }));
    }
  };

  const selectTest = async (assignment: UpcomingAssignment) => {
    if (!user) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const scoreEstimate = await GamblingService.calculateScoreEstimate(
        user.id,
        assignment.courseId,
        assignment.name
      );
      setState(prev => ({
        ...prev,
        selectedTest: assignment.id,
        selectedAssignment: assignment,
        scoreEstimate,
        requiredScore: scoreEstimate.baseScore,
        multiplier: 1.0,
        isLoading: false,
      }));
    } catch {
      setState(prev => ({ ...prev, error: 'Failed to calculate score estimate', isLoading: false }));
    }
  };

  const updateMultiplier = (newMultiplier: number) => {
    if (!state.scoreEstimate) return;
    const requiredScore = GamblingService.calculateRequiredScore(
      state.scoreEstimate.baseScore, 
      newMultiplier,
      state.freeUserLimits.maxMultiplier
    );
    setState(prev => ({ ...prev, multiplier: newMultiplier, requiredScore }));
  };

  const updateBetAmount = (amount: string) => {
    const numericValue = amount.replace(/[^0-9.]/g, '');
    setState(prev => ({ ...prev, betAmount: numericValue }));
  };

  const validateGamble = async () => {
    if (!state.selectedTest || !state.betAmount || !state.scoreEstimate || !user) {
      return { isValid: false, error: 'Please select a test and enter a bet amount' };
    }
    const betAmount = parseFloat(state.betAmount);
    const totalPoints = state.availablePoints;
    return await GamblingService.validateGamble(user.id, betAmount, state.multiplier, totalPoints);
  };

  const submitGamble = async () => {
    if (!user || !state.selectedTest || !state.selectedAssignment) return;
    const validation = await validateGamble();
    if (!validation.isValid) {
      setState(prev => ({ ...prev, error: validation.error }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const gambleData = {
        user_id: user.id,
        course_id: state.selectedAssignment.courseId,
        title: state.selectedAssignment.name,
        amount: parseFloat(state.betAmount),
        multiplier: state.multiplier,
        milestone_id: state.selectedTest,
        base_score: state.scoreEstimate?.baseScore ?? 75,
      };
      const result = await GamblingService.createGamble(gambleData);
      if (result) {
        setState(prev => ({
          ...prev,
          selectedTest: null,
          selectedAssignment: null,
          betAmount: '',
          multiplier: 1.0,
          requiredScore: 0,
          scoreEstimate: null,
          isLoading: false,
        }));
        await loadGamblingData();
      } else {
        setState(prev => ({ ...prev, error: 'Failed to create gamble', isLoading: false }));
      }
    } catch {
      setState(prev => ({ ...prev, error: 'Failed to submit gamble', isLoading: false }));
    }
  };

  const clearError = () => setState(prev => ({ ...prev, error: null }));

  return {
    ...state,
    selectTest,
    updateMultiplier,
    updateBetAmount,
    validateGamble,
    submitGamble,
    clearError,
    refreshCurrentGambles, // ✅ added
  };
};
