import React, { useState, useEffect } from 'react';
import { canvasApi } from '@/services/canvasApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertTriangle, GraduationCap, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userDataService } from '@/services/userDataService';
import { formatDistanceToNow } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { userStorage } from '@/utils/userStorage';

interface SyncStatus {
  timestamp: string;
  inProgress: boolean;
  lastSuccess?: string;
  lastError?: string;
}

const CanvasConnect: React.FC = () => {
  const [domain, setDomain] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'success' | 'error'>('none');
  const [userName, setUserName] = useState<string>('Canvas User');
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const {
    user
  } = useAuth();

  useEffect(() => {
    if (user) {
      loadCredentials();
    } else {
      resetState();
    }

    return () => {
      canvasApi.clearAutoSync();
    };
  }, [user]);

  const resetState = () => {
    setDomain('');
    setToken('');
    setIsConnected(false);
    setIsLoading(false);
    setIsSyncing(false);
    setConnectionStatus('none');
    setUserName('Canvas User');
    setLastSyncDate(null);
    setErrorDetails('');
  };

  const loadCredentials = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const credentials = await userDataService.getCanvasCredentials(user.id);
      if (credentials && credentials.domain && credentials.token) {
        console.log('Found saved Canvas credentials');

        setDomain(credentials.domain);
        setToken('••••••••••••••••');
        setIsConnected(true);

        canvasApi.setCredentials(credentials.domain, credentials.token);

        // Also save to localStorage for the sync function
        userStorage.set(user.id, 'canvas_credentials', JSON.stringify({
          domain: credentials.domain,
          token: credentials.token
        }));

        const lastSync = await userDataService.getLastSync(user.id);
        if (lastSync && lastSync.lastSync) {
          setLastSyncDate(new Date(lastSync.lastSync));
        }
        canvasApi.clearAutoSync();
        canvasApi.setupAutoSync();   // ← default payload, still comprehensive

        await testConnection();
      } else {
        console.log('No Canvas credentials found');
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error loading Canvas credentials:', error);
      toast.error('Failed to load saved Canvas settings');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    if (!canvasApi.hasCredentials()) {
      toast.error('Canvas credentials not set');
      return false;
    }
    try {
      setIsSyncing(true);
      setErrorDetails('');
      setConnectionStatus('none');
      console.log('Testing Canvas connection...');
      const profile = await canvasApi.getUserProfile();

      console.log('Canvas profile:', sanitizeLogData(profile));
      setUserName(profile?.name || 'Canvas User');
      setConnectionStatus('success');
      return true;
    } catch (error) {
      console.error('Canvas connection test failed:', sanitizeErrorForLogs(error));
      setConnectionStatus('error');
      const errorMessage = getSanitizedErrorMessage(error);
      setErrorDetails(errorMessage);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const sanitizeLogData = (data: any) => {
    if (!data) return data;
    
    const sanitized = JSON.parse(JSON.stringify(data));
    
    if (sanitized.primary_email) sanitized.primary_email = '[REDACTED]';
    if (sanitized.login_id) sanitized.login_id = '[REDACTED]';
    
    return sanitized;
  };

  const getSanitizedErrorMessage = (error: any): string => {
    if (!error) return 'Unknown error';
    
    if (error.message?.includes('401')) {
      return 'Authentication failed. Please check your API token.';
    } else if (error.message?.includes('403')) {
      return 'Access forbidden. Your API token may not have sufficient permissions.';
    } else if (error.message?.includes('404')) {
      return 'Resource not found. Please check your Canvas domain.';
    } else if (error.message?.includes('429')) {
      return 'Rate limit exceeded. Please try again later.';
    } else if (error.message?.includes('500')) {
      return 'Canvas server error. Please try again later.';
    }
    
    return 'Connection error. Please check your credentials and try again.';
  };

  const sanitizeErrorForLogs = (error: any): any => {
    if (!error) return error;
    
    let errorForLog = error;
    if (typeof error === 'object' && error !== null) {
      errorForLog = { ...error };
      
      if (errorForLog.message) {
        errorForLog.message = errorForLog.message.replace(/Bearer\s+[a-zA-Z0-9._~-]+/g, 'Bearer [REDACTED]');
        errorForLog.message = errorForLog.message.replace(/(token|api_key|key)=\S+/gi, '$1=[REDACTED]');
      }
      
      if (errorForLog.stack) {
        errorForLog.stack = errorForLog.stack.replace(/Bearer\s+[a-zA-Z0-9._~-]+/g, 'Bearer [REDACTED]');
        errorForLog.stack = errorForLog.stack.replace(/(token|api_key|key)=\S+/gi, '$1=[REDACTED]');
      }
    }
    
    return errorForLog;
  };

  const [loadingStep, setLoadingStep] = useState<string>('');

  const handleConnect = async () => {
    if (!domain || !token) {
      toast.error('Please enter both Canvas domain and API token');
      return;
    }
    
    if (!user) {
      toast.error('You must be logged in to connect to Canvas');
      return;
    }
    
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    let formattedDomain = domain.trim();
    if (formattedDomain.startsWith('http://')) {
      formattedDomain = formattedDomain.substring(7);
    } else if (formattedDomain.startsWith('https://')) {
      formattedDomain = formattedDomain.substring(8);
    }
    formattedDomain = formattedDomain.replace(/\/+$/, "");
    
    if (!domainRegex.test(formattedDomain)) {
      toast.error('Please enter a valid domain name');
      return;
    }
    
    if (token.length < 10) {
      toast.error('Please enter a valid API token');
      return;
    }
    
    setIsLoading(true);
    setConnectionStatus('none');
    setErrorDetails('');
    setLoadingStep('Validating credentials...');
    
    try {
      console.log(`Connecting to Canvas with domain: ${formattedDomain}`);

      canvasApi.setCredentials(formattedDomain, token);
      
      setLoadingStep('Testing connection...');
      const connectionSuccessful = await testConnection();
      
      if (connectionSuccessful) {
        setLoadingStep('Saving credentials...');
        await userDataService.saveCanvasCredentials(user.id, formattedDomain, token);

        // Also save to localStorage for the sync function
        userStorage.set(user.id, 'canvas_credentials', JSON.stringify({
          domain: formattedDomain,
          token: token
        }));

        setDomain(formattedDomain);
        setToken('••••••••••••••••');
        setIsConnected(true);
        canvasApi.clearAutoSync();
        canvasApi.setupAutoSync();   // ← default payload, still comprehensive

        setLoadingStep('Syncing Canvas data...');
        await syncCanvasData();

        setLoadingStep('Finalizing setup...');
        userDataService.trackCanvasSync(user.id);

        userDataService.refreshAchievements(user.id);
        toast.success('Successfully connected to Canvas LMS');
      } else {
        canvasApi.clearCredentials();
        toast.error('Failed to connect to Canvas. Please check your credentials.');
      }
    } catch (error) {
      console.error('Error connecting to Canvas:', sanitizeErrorForLogs(error));
      
      const errorMessage = getSanitizedErrorMessage(error);
      setErrorDetails(errorMessage);
      toast.error('Failed to connect to Canvas. Please check your credentials.');

      canvasApi.clearCredentials();
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    try {
      await userDataService.clearCanvasCredentials(user.id);
      canvasApi.clearCredentials();
      resetState();
      toast.info('Disconnected from Canvas LMS');
    } catch (error) {
      console.error('Error disconnecting from Canvas:', error);
      toast.error('Failed to disconnect from Canvas');
    }
  };

  const [syncStep, setSyncStep] = useState<string>('');

  const syncCanvasData = async () => {
    if (!user) {
      toast.error('You must be logged in to sync Canvas data');
      return false;
    }
    if (!canvasApi.hasCredentials()) {
      toast.error('Canvas credentials not set');
      return false;
    }
    try {
      setIsSyncing(true);
      setErrorDetails('');
      setSyncStep('Connecting to Canvas...');
      
      const syncToast = toast.info('Syncing Canvas data...', {
        duration: 0,
        id: 'canvas-sync'
      });

      setSyncStep('Fetching courses...');
      const success = await canvasApi.syncWithCanvas(user.id);

      setSyncStep('Updating database...');
      const lastSync = await userDataService.getLastSync(user.id);
      if (lastSync && lastSync.lastSync) {
        setLastSyncDate(new Date(lastSync.lastSync));
      }

      setSyncStep('Finalizing...');
      if (success) {
        toast.success('Canvas data synced successfully', {
          id: 'canvas-sync'
        });
      } else {
        toast.error('Canvas sync completed with errors', {
          id: 'canvas-sync'
        });
      }
      return success;
    } catch (error) {
      console.error('Failed to sync Canvas data:', error);
      if (user && canvasApi.hasCredentials()) {
        toast.error('Failed to sync Canvas data', {
          id: 'canvas-sync'
        });
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      setErrorDetails(errorMessage);
      return false;
    } finally {
      setIsSyncing(false);
      setSyncStep('');
    }
  };

  const formatTimeSinceLastSync = () => {
    if (!lastSyncDate) return 'Never synced';
    return `${formatDistanceToNow(lastSyncDate)} ago`;
  };

  // Show loading screen when connecting
  if (isLoading && !isConnected) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-journey-primary to-blue-600 rounded-full flex items-center justify-center animate-pulse">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
              <Loader2 className="absolute -bottom-2 -right-2 h-8 w-8 text-journey-primary animate-spin" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Connecting to Canvas</h3>
              <p className="text-muted-foreground">{loadingStep || 'Please wait...'}</p>
            </div>
            
            {/* Progress steps */}
            <div className="w-full max-w-xs space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${loadingStep.includes('Validating') || loadingStep.includes('Testing') || loadingStep.includes('Saving') || loadingStep.includes('Syncing') || loadingStep.includes('Finalizing') ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={loadingStep.includes('Validating') ? 'text-journey-primary font-medium' : 'text-muted-foreground'}>
                  Validating credentials
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${loadingStep.includes('Testing') || loadingStep.includes('Saving') || loadingStep.includes('Syncing') || loadingStep.includes('Finalizing') ? 'bg-green-500' : loadingStep.includes('Validating') ? 'bg-journey-primary animate-pulse' : 'bg-gray-300'}`} />
                <span className={loadingStep.includes('Testing') ? 'text-journey-primary font-medium' : 'text-muted-foreground'}>
                  Testing connection
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${loadingStep.includes('Saving') || loadingStep.includes('Syncing') || loadingStep.includes('Finalizing') ? 'bg-green-500' : loadingStep.includes('Testing') ? 'bg-journey-primary animate-pulse' : 'bg-gray-300'}`} />
                <span className={loadingStep.includes('Saving') ? 'text-journey-primary font-medium' : 'text-muted-foreground'}>
                  Saving credentials
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${loadingStep.includes('Syncing') || loadingStep.includes('Finalizing') ? 'bg-green-500' : loadingStep.includes('Saving') ? 'bg-journey-primary animate-pulse' : 'bg-gray-300'}`} />
                <span className={loadingStep.includes('Syncing') ? 'text-journey-primary font-medium' : 'text-muted-foreground'}>
                  Syncing Canvas data
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${loadingStep.includes('Finalizing') ? 'bg-green-500' : loadingStep.includes('Syncing') ? 'bg-journey-primary animate-pulse' : 'bg-gray-300'}`} />
                <span className={loadingStep.includes('Finalizing') ? 'text-journey-primary font-medium' : 'text-muted-foreground'}>
                  Finalizing setup
                </span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              This may take a minute depending on the number of courses and assignments in your Canvas account.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show syncing overlay when manually syncing
  if (isSyncing && isConnected) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
                <RefreshCw className="h-10 w-10 text-white animate-spin" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Syncing Canvas Data</h3>
              <p className="text-muted-foreground">{syncStep || 'Please wait...'}</p>
            </div>
            
            {/* Sync Progress steps */}
            <div className="w-full max-w-xs space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${syncStep.includes('Connecting') || syncStep.includes('Fetching') || syncStep.includes('Updating') || syncStep.includes('Finalizing') ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={syncStep.includes('Connecting') ? 'text-journey-primary font-medium' : 'text-muted-foreground'}>
                  Connecting to Canvas
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${syncStep.includes('Fetching') || syncStep.includes('Updating') || syncStep.includes('Finalizing') ? 'bg-green-500' : syncStep.includes('Connecting') ? 'bg-journey-primary animate-pulse' : 'bg-gray-300'}`} />
                <span className={syncStep.includes('Fetching') ? 'text-journey-primary font-medium' : 'text-muted-foreground'}>
                  Fetching courses and assignments
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${syncStep.includes('Updating') || syncStep.includes('Finalizing') ? 'bg-green-500' : syncStep.includes('Fetching') ? 'bg-journey-primary animate-pulse' : 'bg-gray-300'}`} />
                <span className={syncStep.includes('Updating') ? 'text-journey-primary font-medium' : 'text-muted-foreground'}>
                  Updating database
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${syncStep.includes('Finalizing') ? 'bg-green-500' : syncStep.includes('Updating') ? 'bg-journey-primary animate-pulse' : 'bg-gray-300'}`} />
                <span className={syncStep.includes('Finalizing') ? 'text-journey-primary font-medium' : 'text-muted-foreground'}>
                  Finalizing sync
                </span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Syncing your latest Canvas data. This may take a moment...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-journey-primary" />
          <CardTitle>Connect to Canvas LMS</CardTitle>
        </div>
        <CardDescription>
          Enter your Canvas domain and API token to integrate your courses and assignments
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isConnected ? <div className="text-center py-4">
            <div className="h-12 w-12 rounded-full bg-journey-primary/10 text-journey-primary flex items-center justify-center mx-auto mb-4">
              {isSyncing ? <Loader2 className="w-6 h-6 animate-spin" /> : connectionStatus === 'error' ? <AlertTriangle className="w-6 h-6 text-journey-warning" /> : <CheckCircle className="w-6 h-6" />}
            </div>
            <h3 className="text-lg font-medium">
              {connectionStatus === 'error' ? 'Connection Error' : 'Connected to Canvas'}
            </h3>
            {userName && connectionStatus !== 'error' && <p className="text-sm font-medium mt-1">
                Welcome, {userName}
              </p>}
            <p className="text-sm text-muted-foreground mt-1">
              {connectionStatus === 'error' ? 'There was an error with your Canvas connection. Please reconnect.' : 'Your Canvas account is successfully connected'}
            </p>
            {errorDetails && <div className="mt-2">
                <p className="text-xs text-red-500 p-2 bg-red-50 rounded border border-red-100">
                  Error details: {errorDetails}
                </p>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="link" size="sm" className="text-xs mt-1">
                      Show troubleshooting tips
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 text-xs">
                    <h4 className="font-medium mb-2">Common fixes:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Make sure your Canvas domain is correct (e.g., school.instructure.com)</li>
                      <li>Ensure your API token has the correct permissions</li>
                      <li>Check if your Canvas instance requires special API access</li>
                      <li>Try generating a new API token in your Canvas settings</li>
                      <li>Verify that your institution allows API access</li>
                    </ul>
                  </PopoverContent>
                </Popover>
              </div>}
            
            <div className="flex items-center justify-center gap-2 mt-4">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Last synced: {formatTimeSinceLastSync()}
              </span>
            </div>
            
            <div className="flex items-center justify-center mt-4 border rounded-md p-3 bg-muted/10">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Auto-sync every 5 minutes</span>
                <span className="text-xs text-journey-primary">(Active)</span>
              </div>
            </div>
          </div> : <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Canvas Domain</Label>
              <Input id="domain" placeholder="school.instructure.com" value={domain} onChange={e => setDomain(e.target.value)} />
              <p className="text-xs text-muted-foreground px-[7px]">Enter your school's Canvas domain (e.g.,[school].instructure.com from the Canvas website url)</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="token">API Token</Label>
              <Input id="token" type="password" placeholder="Canvas API token" value={token} onChange={e => setToken(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                Generate an API token from your Canvas account settings
              </p>
              <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted/40 rounded border border-muted">
                <p className="font-medium mb-1">To get your Canvas API token:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Log in to your Canvas account</li>
                  <li>Go to Account &gt; Settings</li>
                  <li>Scroll to Approved Integrations</li>
                  <li>Click "New Access Token"</li>
                  <li>Enter a purpose (e.g., "Gambit")</li>
                  <li>Copy the generated token</li>
                </ol>
              </div>
            </div>
            {errorDetails && <p className="text-xs text-red-500 mt-2 p-2 bg-red-50 rounded border border-red-100">
                Error details: {errorDetails}
              </p>}
          </div>}
      </CardContent>
      
      <CardFooter className="flex justify-end">
        {isConnected ? <div className="flex gap-2">
            <Button variant="outline" onClick={syncCanvasData} disabled={isSyncing || isLoading} className="flex items-center">
              {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Sync Now
            </Button>
            <Button variant="outline" onClick={testConnection} disabled={isSyncing || isLoading}>
              {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Test Connection
            </Button>
            <Button variant="destructive" onClick={handleDisconnect} disabled={isSyncing || isLoading}>
              Disconnect
            </Button>
          </div> : <Button onClick={handleConnect} disabled={isLoading || isSyncing}>
            {isLoading || isSyncing ? <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </> : 'Connect to Canvas'}
          </Button>}
      </CardFooter>
    </Card>;
};

export default CanvasConnect;
