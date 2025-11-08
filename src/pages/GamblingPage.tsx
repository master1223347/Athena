import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGambling } from '@/hooks/useGambling';
import { GamblingService } from '@/services/gamblingService';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, Target, Zap, Loader2 } from 'lucide-react';
import { BetResolutionService } from '@/services/betResolutionService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { canvasApi } from '@/services/canvasApi';

const GamblingPage: React.FC = () => {
  const { user } = useAuth();
  const [pastGambles, setPastGambles] = useState<any[]>([]);
  const [isSyncingGrades, setIsSyncingGrades] = useState(false);
  const {
    selectedTest,
    betAmount,
    multiplier,
    requiredScore,
    scoreEstimate,
    isLoading,
    error,
    stats,
    upcomingAssignments,
    selectedAssignment,
    currentGambles,
    isPremium,
    freeUserLimits,
    availablePoints,
    selectTest,
    updateMultiplier,
    updateBetAmount,
    validateGamble,
    submitGamble,
    clearError,
    refreshCurrentGambles,
  } = useGambling();

  // Debug logging
  useEffect(() => {
    console.log('Current user ID:', user?.id);
    console.log('Current gambles:', currentGambles);
    console.log('Stats:', stats);
    console.log('Available points:', availablePoints);
    
    // Calculate points breakdown for debugging
    if (currentGambles.length > 0) {
      const totalGambled = currentGambles.reduce((sum, gamble) => sum + gamble.amount, 0);
      console.log('Points breakdown:');
      console.log('- Total achievement points: 170');
      console.log('- Points in active bets:', totalGambled);
      console.log('- Available for betting:', availablePoints);
    }
  }, [user?.id, currentGambles, stats, availablePoints]);

  // Auto-resolve bets when page loads
  useEffect(() => {
    const autoResolveBets = async () => {
      if (!user) return;
      
      try {
        console.log('Auto-resolving bets for user:', user.id);
        const resolutions = await BetResolutionService.resolveUserBets(user.id);
        
        if (resolutions.length > 0) {
          const wonBets = resolutions.filter(r => r.won);
          const totalPoints = wonBets.reduce((sum, r) => sum + r.pointsAwarded, 0);
          
          if (wonBets.length > 0) {
            console.log(`Auto-resolved ${wonBets.length} winning bets, awarded ${totalPoints} points`);
            // You could show a toast notification here
          }
        }
      } catch (error) {
        console.error('Error auto-resolving bets:', error);
      }
    };

    autoResolveBets();
  }, [user]);

  // Load past gambles (resolved)
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('gambles')
        .select('id, title, amount, multiplier, won, points_awarded, resolved_at, created_at, courses(title)')
        .eq('user_id', user.id)
        .eq('resolved', true)
        .order('resolved_at', { ascending: false });
      setPastGambles(data || []);
    };
    load();
  }, [user]);

  // availablePoints now comes from useGambling hook

  const handleTestSelection = async (assignment: any) => {
    await selectTest(assignment);
  };

  const handleMultiplierChange = (value: number[]) => {
    updateMultiplier(value[0]);
  };

  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateBetAmount(e.target.value);
  };

  const handleSubmitGamble = async () => {
    await submitGamble();
  };

  const handleUpdateGradesFromCanvas = async () => {
    if (!user) return;
    try {
      setIsSyncingGrades(true);
      // First trigger server-side Canvas sync (no CORS). Edge function updates DB.
      try {
        await canvasApi.syncWithCanvas(user.id, { syncType: 'gradesOnly' });
      } catch (err: any) {
        if (err.message?.includes('Canvas credentials not set')) {
          toast.error('Please connect your Canvas account before syncing grades.');
          return;
        }
        throw err;
      }
      

      // Then copy milestone grades into gambles.actual_score
      const { updated } = await BetResolutionService.updateGambleGradesFromCanvas(user.id);
      toast.success(`Updated ${updated} gambles with latest grades from Canvas`);
      // Optionally auto-resolve after update
      const resolutions = await BetResolutionService.resolveUserBets(user.id);
      if (resolutions.length > 0) {
        const wonBets = resolutions.filter(r => r.won);
        const totalPoints = wonBets.reduce((sum, r) => sum + r.pointsAwarded, 0);
        if (wonBets.length > 0) {
          toast.success(`Resolved ${wonBets.length} winning bets, +${totalPoints} points`);
        }
      }
      // Refresh past gambles list after resolving
      await refreshCurrentGambles(user.id);
      const { data } = await supabase
        .from('gambles')
        .select('id, title, amount, multiplier, won, points_awarded, resolved_at, created_at, courses(title)')
        .eq('user_id', user.id)
        .eq('resolved', true)
        .order('resolved_at', { ascending: false });
      setPastGambles(data || []);
    } catch (e:any) {
      toast.error(e?.message || 'Failed to update grades from Canvas');
    }
    finally {
      setIsSyncingGrades(false);
    }
  };

  const handleCreateFakeAssignment = async () => {
    if (!user) return;
    
    try {
      // Get first course for the user
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .eq('user_id', user.id)
        .limit(1);

      if (!courses || courses.length === 0) {
        alert('No courses found. Please sync with Canvas first.');
        return;
      }

      const courseId = courses[0].id;
      const courseTitle = courses[0].title;
      const milestoneId = await BetResolutionService.createFakeAssignment(user.id, courseId);
      
      alert(`Fake assignment created in ${courseTitle}! It will appear in the Available Assignments list.`);
      
      // Reload gambling data to show the new assignment
      window.location.reload();
    } catch (error) {
      console.error('Error creating fake assignment:', error);
      alert('Failed to create fake assignment');
    }
  };

  const handleGradeFakeAssignment = async () => {
    // Find all fake assignments
    const { data: fakeAssignments } = await supabase
      .from('milestones')
      .select('id, title, grade, status')
      .eq('user_id', user?.id)
      .eq('title', 'Fake Test Assignment')
      .order('created_at', { ascending: false });

    if (!fakeAssignments || fakeAssignments.length === 0) {
      alert('No fake assignments found. Create one first.');
      return;
    }

    // Show grading interface
    const assignment = fakeAssignments[0];
    const currentGrade = assignment.grade || 'Not graded';
    const currentStatus = assignment.status;
    
    const grade = prompt(
      `Grade "${assignment.title}"\n\nCurrent grade: ${currentGrade}\nCurrent status: ${currentStatus}\n\nEnter raw score (0-100):`
    );
    
    if (!grade || isNaN(parseFloat(grade))) {
      alert('Please enter a valid grade');
      return;
    }

    const gradeNum = parseFloat(grade);
    if (gradeNum < 0 || gradeNum > 100) {
      alert('Grade must be between 0 and 100');
      return;
    }

    try {
      await BetResolutionService.gradeFakeAssignment(assignment.id, gradeNum);
      
      alert(`Assignment graded with ${gradeNum}%!`);
      
      // Resolve bets
      const resolutions = await BetResolutionService.resolveUserBets(user?.id || '');
      if (resolutions.length > 0) {
        const wonBets = resolutions.filter(r => r.won);
        const totalPoints = wonBets.reduce((sum, r) => sum + r.pointsAwarded, 0);
        alert(`Bets resolved! Won ${wonBets.length} bets, awarded ${totalPoints} points`);
      } else {
        alert('No bets to resolve');
      }
      
      // Reload page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error grading fake assignment:', error);
      alert('Failed to grade fake assignment');
    }
  };

  const handleCheckGradedAssignments = async () => {
    if (!user) return;
    
    try {
      console.log('Manually checking for graded assignments...');
      const resolutions = await BetResolutionService.resolveUserBets(user.id);
      
      if (resolutions.length > 0) {
        const wonBets = resolutions.filter(r => r.won);
        const lostBets = resolutions.filter(r => !r.won);
        const totalPoints = wonBets.reduce((sum, r) => sum + r.pointsAwarded, 0);
        
        alert(`Bet resolution complete!\n\nWon: ${wonBets.length} bets\nLost: ${lostBets.length} bets\nTotal points awarded: ${totalPoints}`);
      } else {
        alert('No graded assignments found to resolve bets.');
      }
      
      // Reload page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error checking graded assignments:', error);
      alert('Failed to check graded assignments');
    }
  };

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier <= 1.2) return 'text-green-600';
    if (multiplier <= 1.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAssignmentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'at-risk':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isFreeUser = !isPremium;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto w-full p-8">
        {/* Header and user info */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-extrabold mb-1 flex items-center gap-2">
              Gambling
              {isPremium && (
                <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-orange-200 text-orange-700 border-orange-200">
                  <Zap className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Gamble on your future test scores with your XP
              {isPremium && (
                <span className="block mt-1 text-sm font-medium text-green-600">
                  ✨ Premium: Unlimited gambling with up to 5x multiplier
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleUpdateGradesFromCanvas} variant="outline" disabled={isSyncingGrades}>
              {isSyncingGrades ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing...
                </span>
              ) : (
                'Update Grades from Canvas'
              )}
            </Button>
          </div>
        </div>

        {isSyncingGrades && (
          <div className="mb-4 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Syncing Canvas grades and resolving gambles…</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearError}
                className="ml-2 h-auto p-0 text-red-800 hover:text-red-900"
              >
                ×
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Free User Notice */}
        {isFreeUser && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              <strong>Free User:</strong> You're limited to {freeUserLimits.maxMultiplier}x multiplier and can only bet up to {Math.round((availablePoints + currentGambles.reduce((sum, gamble) => sum + gamble.amount, 0)) * freeUserLimits.maxBetPercentage)} points per bet ({freeUserLimits.maxBetPercentage * 100}% of your achievement points). 
              <Button variant="link" className="ml-2 h-auto p-0 text-blue-800 hover:text-blue-900">
                Upgrade to Premium for unlimited gambling
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Premium User Notice */}
        {isPremium && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              <strong>Premium User:</strong> You have unlimited gambling with up to {freeUserLimits.maxMultiplier}x multiplier and can bet up to 100% of your points! 🚀
            </AlertDescription>
          </Alert>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Upcoming Tests */}
          <Card className="lg:col-span-1 flex flex-col lg:h-[700px]">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-xl">Available Quizzes & Tests</CardTitle>
              <p className="text-sm text-muted-foreground">
                Upcoming quizzes and tests due in the next 2 months (only future assignments can be bet on)
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading assignments...
                </div>
              ) : upcomingAssignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">No quizzes or tests available for gambling</p>
                  <p className="text-sm">Sync with Canvas to see your quizzes and tests</p>
                </div>
              ) : (
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {upcomingAssignments.map((assignment) => (
                    <div 
                      key={assignment.id} 
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTest === assignment.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleTestSelection(assignment)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{assignment.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {assignment.course}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium capitalize">
                            {assignment.type || 'Quiz/Test'}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatDate(assignment.dueDate)}
                            </span>
                            {assignment.pointsPossible > 0 && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">
                                  {assignment.pointsPossible} pts
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getAssignmentStatusColor(assignment.status)}`}
                        >
                          {assignment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gambling Interface */}
          <Card className="lg:col-span-2 flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-xl">Gambling Interface</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              {!selectedTest ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg mb-2">Select a quiz or test to start gambling</p>
                  <p className="text-sm">Choose from the available quizzes and tests to see your AI-powered score estimate</p>
                </div>
              ) : (
                <div className="space-y-6 flex-1 overflow-y-auto">
                  {/* Selected Test Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">{selectedAssignment?.name}</h3>
                    <p className="text-muted-foreground">{selectedAssignment?.course}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedAssignment?.dueDate || '')}
                      </div>
                      {selectedAssignment?.pointsPossible > 0 && (
                        <div>{selectedAssignment.pointsPossible} points possible</div>
                      )}
                    </div>
                  </div>

                  {/* AI Score Estimate */}
                  {scoreEstimate && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">AI Score Estimate</h4>
                        <Badge variant="outline" className={getConfidenceColor(scoreEstimate.confidence)}>
                          {Math.round(scoreEstimate.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-2">
                          {scoreEstimate.baseScore}%
                        </div>
                        <p className="text-sm text-blue-700 mb-2">Base score based on your past performance</p>
                        
                        {scoreEstimate.factors.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-blue-700">Factors:</p>
                            {scoreEstimate.factors.map((factor, index) => (
                              <p key={index} className="text-xs text-blue-600">• {factor}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Multiplier Slider */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Multiplier & Required Score</h4>
                      <div className={`text-lg font-bold ${getMultiplierColor(multiplier)}`}>
                        {multiplier.toFixed(1)}x
                      </div>
                    </div>
                    
                    <Slider
                      min={1.0}
                      max={freeUserLimits.maxMultiplier}
                      step={0.1}
                      value={[multiplier]}
                      onValueChange={handleMultiplierChange}
                      className="mb-2"
                    />
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1.0x</span>
                      <span>{freeUserLimits.maxMultiplier}x</span>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-lg font-semibold text-yellow-700 mb-1">
                        Required Score: {requiredScore}%
                      </div>
                      <p className="text-sm text-yellow-600">
                        You need to score at least {requiredScore}% to win the {multiplier.toFixed(1)}x multiplier
                      </p>
                    </div>
                  </div>

                  {/* Bet Amount */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Bet Amount</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Input
                          type="text"
                          placeholder="Enter bet amount"
                          value={betAmount}
                          onChange={handleBetAmountChange}
                          className="text-lg"
                        />
                      </div>
                      <span className="text-muted-foreground">points</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Available: {availablePoints} points
                        {isFreeUser && (
                          <span className="text-blue-600 ml-2">
                            (Max bet: {Math.round((availablePoints + currentGambles.reduce((sum, gamble) => sum + gamble.amount, 0)) * freeUserLimits.maxBetPercentage)} points for free users)
                          </span>
                        )}
                        {isPremium && (
                          <span className="text-green-600 ml-2">
                            (Unlimited betting for premium users!)
                          </span>
                        )}
                      </p>
                      
                      <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                        <strong>Points Breakdown:</strong>
                        <div className="mt-1 space-y-1">
                          <div>Total Achievement Points: {availablePoints + currentGambles.reduce((sum, gamble) => sum + gamble.amount, 0)} (includes partial progress)</div>
                          {currentGambles.length > 0 && (
                            <div>Points in Active Bets: {currentGambles.reduce((sum, gamble) => sum + gamble.amount, 0)}</div>
                          )}
                          <div className="border-t pt-1">Available for Betting: {availablePoints}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Potential Winnings */}
                  {betAmount && parseFloat(betAmount) > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-lg font-semibold text-green-700 mb-1">
                        Potential Winnings: {(parseFloat(betAmount) * multiplier).toFixed(1)} points
                      </div>
                      <p className="text-sm text-green-600">
                        If you score {requiredScore}% or higher
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    onClick={handleSubmitGamble}
                    disabled={isLoading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-3"
                  >
                    {isLoading ? 'Processing...' : 'Place Gamble'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Current Gambles */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Current Gambles</CardTitle>
          </CardHeader>
          <CardContent>
            {currentGambles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active gambles
              </div>
            ) : (
              <div className="space-y-3">
                {currentGambles.map((gamble) => (
                  <div key={gamble.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{gamble.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {gamble.courses?.title || 'Unknown Course'} • Created {new Date(gamble.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-blue-700">{gamble.amount} points</div>
                      <div className="text-sm text-muted-foreground">
                        for {(gamble.multiplier * gamble.amount).toFixed(1)} points
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Gambles */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Past Gambles</CardTitle>
            <CardDescription>Resolved gambles with outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            {pastGambles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No past gambles yet</div>
            ) : (
              <div className="space-y-3">
                {pastGambles.map((g) => (
                  <div key={g.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{g.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {g.courses?.title || 'Unknown Course'} • Resolved {new Date(g.resolved_at || g.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${g.won ? 'text-green-700' : 'text-red-700'}`}>
                        {g.won ? 'Won' : 'Lost'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {g.amount} pts @ {g.multiplier?.toFixed(1)}x {g.won ? `→ +${g.points_awarded ?? (g.amount * g.multiplier)} pts` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gambling Stats */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Gambling Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalGambled}</div>
                  <div className="text-sm text-muted-foreground">Total Points Gambled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.totalWon}</div>
                  <div className="text-sm text-muted-foreground">Total Won</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.totalLost}</div>
                  <div className="text-sm text-muted-foreground">Total Lost</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.activeGambles}</div>
                  <div className="text-sm text-muted-foreground">Active Gambles</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Explanatory note */}
        <div className="mt-8 flex justify-center">
          <div className="bg-yellow-200 text-yellow-900 rounded-md px-4 py-2 text-sm max-w-2xl shadow border border-yellow-300">
            <strong>How it works:</strong> Our AI analyzes your past performance to estimate your expected score. 
            You can gamble on beating that estimate - the higher you aim, the bigger the multiplier, but the harder it gets to win!
          </div>
        </div>

        {/* Testing Section
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xl">Testing Tools</CardTitle>
            <CardDescription>
              Create fake assignments and test bet resolution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <Button 
                  onClick={handleCreateFakeAssignment}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  Create Fake Assignment
                </Button>
                <Button 
                  onClick={handleGradeFakeAssignment}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Grade Fake Assignment
                </Button>
                <Button 
                  onClick={handleCheckGradedAssignments}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Check Graded Assignments
                </Button>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">How to Test:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Click "Create Fake Assignment" - it will appear in Available Quizzes & Tests above</li>
                  <li>Select the fake assignment and place a bet with your desired multiplier</li>
                  <li>Click "Grade Fake Assignment" and enter a grade (0-100)</li>
                  <li>Check if you won your bet and received points!</li>
                  <li>For real assignments: Grade them in Canvas, then click "Check Graded Assignments"</li>
                </ol>
              </div>
              
              <p className="text-sm text-muted-foreground">
                The fake assignment will appear in your Available Quizzes & Tests list and can be bet on just like real quizzes and tests.
                Real assignments are automatically checked when you load the page.
              </p>
            </div>
          </CardContent>
        </Card> */}

      </div>
    </MainLayout>
  );
};

export default GamblingPage;