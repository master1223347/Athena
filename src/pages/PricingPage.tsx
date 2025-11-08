import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star, Brain, Award, Infinity, Headphones, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PipelineService, PipelineJob } from '@/services/pipelineService';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [discountCode, setDiscountCode] = useState<string>('');
  const [pipelineStatus, setPipelineStatus] = useState<{
    hasActiveJob: boolean;
    lastJob?: PipelineJob;
    totalFiles: number;
    processedFiles: number;
    processedFilesList?: Array<{ id: string; display_name: string; content_type: string }>;
  } | null>(null);
  const [isProcessingPipeline, setIsProcessingPipeline] = useState(false);
  const [isFilesListOpen, setIsFilesListOpen] = useState(false);

  // Fetch user's current plan and pipeline status
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const [planResponse, pipelineResponse] = await Promise.all([
          supabase
            .from('profiles')
            .select('plan')
            .eq('id', user.id)
            .single(),
          PipelineService.getPipelineStatus(user.id)
        ]);
        
        if (!planResponse.error && planResponse.data && (planResponse.data as any)?.plan) {
          setUserPlan((planResponse.data as any).plan as string);
        }
        
        setPipelineStatus(pipelineResponse);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  
  const pricing = {
    monthly: {
      price: 24.99,
      period: 'month',
      priceId: 'price_1S0CdTBqYGOBcqYFd6o9KPj6' // Monthly price ID
    },
    annual: {
      price: 14.99,
      period: 'month',
      priceId: 'price_1S0CdTBqYGOBcqYFFaxjDD70' // Annual price ID
    }
  };

  const features = {
    basic: [
      'Ranked Leaderboard',
      'Streaks',
      '1 Weekly Achievement',
      'Gambling (limited amounts of xp and multiplier)',
      'Limited AI Study Tools (10 chats max)'
    ],
    paid: [
      'All Basic Tier features',
      '3 Weekly Achievements',
      'Unlimited Gambling',
      'AI study tools syncing with canvas data',
      'Unlimited AI homework & assignment help',
      'Priority support'
    ]
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please log in to subscribe');
      return;
    }

    setIsCreatingCheckout(true);

    try {
      // Get Supabase URL - use hardcoded value if env var not available
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eakktmgnlwatvrgmjcok.supabase.co';
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVha2t0bWdubHdhdHZyZ21qY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzNDM4MTQsImV4cCI6MjA1NzkxOTgxNH0.T4iG0f02Ar5IWIRHXbHh8HCpNEvDfwOFHE0EX_bzIxc';
      
      // Use the correct price ID based on billing cycle
      const requestBody = {
        priceId: pricing[billingCycle].priceId,
        billingCycle,
        userId: user.id,
        discountCode: discountCode.trim() || undefined,
        successUrl: `${window.location.origin}/settings?success=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`,
      };
      
      console.log('Sending request to Stripe:', requestBody);
      console.log('Using Supabase URL:', supabaseUrl);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to create checkout session: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('Response data:', responseData);
      
      const { url } = responseData;
      
      if (url) {
        // Redirect to Stripe checkout
        window.location.href = url;
      } else {
        toast.error('Checkout session creation failed - no URL returned');
        setIsCreatingCheckout(false);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          toast.error('Checkout service not available. Please contact support.');
        } else if (error.message.includes('Failed to fetch')) {
          toast.error('Network error. Please check your connection and try again.');
        } else {
          toast.error(`Checkout error: ${error.message}`);
        }
      } else {
        toast.error('Failed to start checkout process');
      }
      
      setIsCreatingCheckout(false);
    }
  };

  const handleBillingCycleChange = (newCycle: 'monthly' | 'annual') => {
    setBillingCycle(newCycle);
  };

  const handleProcessPipeline = async () => {
    if (!user) return;
    
    setIsProcessingPipeline(true);
    try {
      await PipelineService.triggerPipeline(user.id);
      toast.success('Pipeline processing started! Your files will be processed shortly.');
      
      // Refresh pipeline status
      const newStatus = await PipelineService.getPipelineStatus(user.id);
      setPipelineStatus(newStatus);
    } catch (error) {
      console.error('Error starting pipeline:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start pipeline processing');
    } finally {
      setIsProcessingPipeline(false);
    }
  };

  return (
    <MainLayout>
      {/* Loading Overlay */}
      {isCreatingCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <h3 className="text-lg font-semibold">Please wait while we redirect you to Stripe</h3>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-journey-primary" />
            <h1 className="text-3xl font-bold">Choose Your Plan</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Select the plan that best fits your learning journey.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={() => handleBillingCycleChange(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                billingCycle === 'annual' ? 'bg-journey-primary' : 'bg-input'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${billingCycle === 'annual' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Annual
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Basic Tier */}
          <Card className={`relative ${!isLoading && userPlan === 'basic' ? 'border-2 border-green-500 bg-green-50 dark:bg-green-950/20' : ''}`}>
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className={`px-3 py-1 ${
                !isLoading && userPlan === 'basic' 
                  ? 'bg-green-600 text-white font-semibold' 
                  : 'bg-muted text-foreground'
              }`}>
                {isLoading ? 'Loading...' : userPlan === 'basic' ? 'Current Plan' : 'Basic Tier'}
              </Badge>
            </div>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold">Basic Tier</CardTitle>
              <CardDescription className="text-base">
                Perfect for getting started
              </CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {features.basic.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              {!isLoading && userPlan === 'basic' && (
                <Button 
                  variant="outline" 
                  className="w-full mt-6 bg-green-100 border-green-300 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-800/30"
                  disabled
                >
                  ✓ Current Plan
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Paid Tier */}
          <Card className={`relative ${!isLoading && userPlan === 'premium' ? 'border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : 'border-2 border-journey-primary'}`}>
            {billingCycle === 'annual' && (
              <div className="absolute top-2 right-4">
                <span className="text-sm font-semibold text-green-600 dark:text-green-500">
                  40% off
                </span>
              </div>
            )}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className={`px-3 py-1 flex items-center gap-1 ${
                !isLoading && userPlan === 'premium'
                  ? 'bg-yellow-600 text-white font-semibold'
                  : 'bg-journey-primary text-white'
              }`}>
                {!isLoading && userPlan === 'premium' ? (
                  <>
                    <Crown className="w-3 h-3" />
                    Current Plan
                  </>
                ) : (
                  <>
                    <Star className="w-3 h-3" />
                    Most Popular
                  </>
                )}
              </Badge>
            </div>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                Premium Plan
                <Crown className="w-4 h-4 text-journey-primary" />
              </CardTitle>
              <CardDescription className="text-base">
                Unlock unlimited potential
              </CardDescription>
              <div className="mt-4 space-y-2">
                <div>
                  <span className="text-3xl font-bold">
                    ${pricing[billingCycle].price}
                  </span>
                  <span className="text-muted-foreground">/{pricing[billingCycle].period}</span>
                </div>
                {billingCycle === 'monthly' && (
                  <div className="text-sm text-muted-foreground">
                    or <span className="font-semibold text-journey-primary">${pricing.annual.price}/{pricing.annual.period}</span> billed annually
                  </div>
                )}
                {billingCycle === 'annual' && (
                  <div className="text-sm text-muted-foreground">
                    or <span className="font-semibold text-journey-primary">${pricing.monthly.price}/{pricing.monthly.period}</span> billed monthly
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {features.paid.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {/* Discount Code Input
              <div className="mt-4">
                <label htmlFor="discount-code" className="block text-sm font-medium text-muted-foreground mb-2">
                  Have a discount code?
                </label>
                <div className="flex gap-2">
                  <input
                    id="discount-code"
                    type="text"
                    placeholder="Enter code (optional)"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDiscountCode('')}
                    className="px-3 py-2 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </div> */}
              
              {!isLoading && userPlan === 'premium' ? (
                <Button 
                  className="w-full mt-4 bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
                  disabled
                >
                  ✓ Current Plan
                </Button>
              ) : (
                <Button 
                  variant="default"
                  className="w-full mt-4"
                  onClick={handleSubscribe}
                  disabled={isCreatingCheckout}
                >
                  {isCreatingCheckout ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                      Creating Checkout...
                    </div>
                  ) : (
                    'Subscribe Now'
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Status Section for Premium Users */}
        {!isLoading && userPlan === 'premium' && pipelineStatus && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">AI Pipeline Status</h2>
              <p className="text-muted-foreground">
                Track the processing of your Canvas files for AI-powered study assistance
              </p>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* File Statistics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Total Files</p>
                      <p className="text-3xl font-bold">{pipelineStatus.totalFiles}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Processed Files</p>
                      <p className="text-3xl font-bold text-green-600">{pipelineStatus.processedFiles}</p>
                    </div>
                  </div>

                  {/* Processed Files List */}
                  {pipelineStatus.processedFilesList && pipelineStatus.processedFilesList.length > 0 && (
                    <div>
                      <Collapsible open={isFilesListOpen} onOpenChange={setIsFilesListOpen}>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" className="w-full flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              View Processed Files ({pipelineStatus.processedFiles})
                            </span>
                            {isFilesListOpen ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4">
                          <div className="max-h-96 overflow-y-auto space-y-2 p-4 bg-muted/30 rounded-lg border">
                            {pipelineStatus.processedFilesList.map((file) => (
                              <div key={file.id} className="flex items-start gap-2 p-3 text-sm bg-background rounded-md border hover:border-primary/50 transition-colors">
                                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{file.display_name || 'Untitled'}</p>
                                  {file.content_type && (
                                    <p className="text-xs text-muted-foreground">{file.content_type}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}

                  {/* Process Files Button */}
                  <Button
                    onClick={handleProcessPipeline}
                    disabled={isProcessingPipeline}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessingPipeline ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Starting...
                      </div>
                    ) : (
                      'Process Files Now'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* What's included in Pro? Section */}
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">What's included in Premium?</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* AI Study Tools */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Brain className="w-6 h-6 text-journey-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">AI Study Tools</h3>
                    <p className="text-sm text-muted-foreground">
                      Get personalized study assistance with access to your Canvas data for context-aware help.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Achievements */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Award className="w-6 h-6 text-journey-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Enhanced Achievements</h3>
                    <p className="text-sm text-muted-foreground">
                      Unlock more weekly achievements and track your progress with detailed analytics.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unlimited Features */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Infinity className="w-6 h-6 text-journey-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Unlimited Features</h3>
                    <p className="text-sm text-muted-foreground">
                      Remove all limitations on gambling, achievements, and other premium features.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Priority Support */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Headphones className="w-6 h-6 text-journey-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Priority Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Get faster response times and priority access to new features and updates.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PricingPage;
