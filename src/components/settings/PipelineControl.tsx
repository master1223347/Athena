import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Square, RefreshCw, Database, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PipelineStatus {
  user_id: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'stopped';
  progress: number;
  message: string;
  stage: string;
  started_at?: string;
  completed_at?: string;
  errors: string[];
  warnings: string[];
  summary?: {
    total_files_processed: number;
    errors: number;
    warnings: number;
    completed_at: string;
  };
}

const PipelineControl: React.FC = () => {
  const { user } = useAuth();
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Pipeline API base URL
  const PIPELINE_API_URL = import.meta.env.VITE_PIPELINE_API_URL || 'http://localhost:8081';

  useEffect(() => {
    if (user?.id) {
      checkPipelineStatus();
    }
  }, [user?.id]);

  const checkPipelineStatus = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${PIPELINE_API_URL}/pipeline/status/${user.id}`);
      if (response.ok) {
        const status = await response.json();
        setPipelineStatus(status);
        setLastChecked(new Date());
      }
    } catch (error) {
      console.error('Failed to check pipeline status:', error);
    }
  };

  const startPipeline = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${PIPELINE_API_URL}/pipeline/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          force_restart: false,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setPipelineStatus(result.status);
        toast.success('Pipeline started successfully!');
        
        // Start polling for status updates
        startStatusPolling();
      } else {
        const error = await response.json();
        toast.error(`Failed to start pipeline: ${error.detail}`);
      }
    } catch (error) {
      console.error('Failed to start pipeline:', error);
      toast.error('Failed to start pipeline. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopPipeline = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${PIPELINE_API_URL}/pipeline/stop/${user.id}`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Pipeline stopped successfully!');
        checkPipelineStatus();
      } else {
        const error = await response.json();
        toast.error(`Failed to stop pipeline: ${error.detail}`);
      }
    } catch (error) {
      console.error('Failed to stop pipeline:', error);
      toast.error('Failed to stop pipeline. Please check your connection.');
    }
  };

  const startStatusPolling = () => {
    // Poll for status updates every 2 seconds
    const interval = setInterval(async () => {
      await checkPipelineStatus();
      
      // Stop polling if pipeline is no longer running
      if (pipelineStatus?.status && !['running', 'initializing'].includes(pipelineStatus.status)) {
        clearInterval(interval);
      }
    }, 2000);

    // Clean up interval after 10 minutes (safety)
    setTimeout(() => clearInterval(interval), 10 * 60 * 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'stopped':
        return <Square className="h-4 w-4 text-yellow-500" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'stopped':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = end.getTime() - start.getTime();
    
    const minutes = Math.floor(duration / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  if (!user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please log in to access the pipeline controls.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pipeline Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pipeline Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {pipelineStatus ? getStatusIcon(pipelineStatus.status) : <Database className="h-4 w-4" />}
              <Badge variant="outline" className={pipelineStatus ? getStatusColor(pipelineStatus.status) : ''}>
                {pipelineStatus?.status || 'idle'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pipelineStatus?.progress || 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Controls</CardTitle>
          <CardDescription>
            Start or stop the Canvas data processing pipeline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={startPipeline}
              disabled={isLoading || pipelineStatus?.status === 'running'}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Pipeline
            </Button>

            <Button
              onClick={stopPipeline}
              disabled={!pipelineStatus || pipelineStatus.status !== 'running'}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop Pipeline
            </Button>

            <Button
              onClick={checkPipelineStatus}
              variant="ghost"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Status
            </Button>
          </div>

          {pipelineStatus?.status === 'running' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{pipelineStatus.message}</span>
                <span>{pipelineStatus.progress}%</span>
              </div>
              <Progress value={pipelineStatus.progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Details */}
      {pipelineStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Current Stage</h4>
                <p className="text-sm text-muted-foreground">{pipelineStatus.stage}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Message</h4>
                <p className="text-sm text-muted-foreground">{pipelineStatus.message}</p>
              </div>

              {pipelineStatus.started_at && (
                <div>
                  <h4 className="font-medium mb-2">Started</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(pipelineStatus.started_at).toLocaleString()}
                  </p>
                </div>
              )}

              {pipelineStatus.completed_at && (
                <div>
                  <h4 className="font-medium mb-2">Duration</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDuration(pipelineStatus.started_at!, pipelineStatus.completed_at)}
                  </p>
                </div>
              )}
            </div>

            {/* Summary */}
            {pipelineStatus.summary && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Processing Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Files Processed:</span>
                    <div className="font-medium">{pipelineStatus.summary.total_files_processed}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Errors:</span>
                    <div className="font-medium text-red-600">{pipelineStatus.summary.errors}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Warnings:</span>
                    <div className="font-medium text-yellow-600">{pipelineStatus.summary.warnings}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Errors and Warnings */}
            {pipelineStatus.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Errors:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {pipelineStatus.errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {pipelineStatus.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Warnings:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {pipelineStatus.warnings.map((warning, index) => (
                      <li key={index} className="text-sm">{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>What This Pipeline Does</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Database className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Downloads Canvas Data:</strong> Fetches your course files, assignments, syllabus, and modules
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Database className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Smart PDF Processing:</strong> Automatically detects handwritten notes and uses Mathpix for math/science content
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Database className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Text Extraction:</strong> Converts all documents to searchable text with proper formatting
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Database className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>AI Enhancement:</strong> Generates embeddings so your AI assistant can answer course-specific questions
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PipelineControl; 