import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Loader2, RefreshCw, Save, Upload, FileText, X, Crown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useNavigate } from 'react-router-dom';

interface SummaryModeProps {
  courseContext?: string;
  courseId?: string;
  userId?: string;
}

const SummaryMode: React.FC<SummaryModeProps> = ({ courseContext, courseId, userId }) => {
  const navigate = useNavigate();
  const { isPremium, isLoading: isPremiumLoading } = usePremiumStatus(userId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Maximum file size: 700KB
  const MAX_FILE_SIZE = 700 * 1024;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleFileUpload called", event.target.files);
    const file = event.target.files?.[0];
    console.log("Selected file:", file);
    if (!file) {
      console.log("No file selected, returning early");
      return;
    }

    // Check file size
    console.log("File size for", file.name, "->", file.size, "bytes (", (file.size / 1024).toFixed(2), "KB)");
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large: ${file.name}`, {
        description: `File size must be less than 700KB. ${file.name} is ${(file.size / 1024).toFixed(2)}KB.`
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Check if file type is supported
    const isSupported = file.type.startsWith('text/') || 
        file.type === 'application/pdf' || 
        file.name.endsWith('.txt') || 
        file.name.endsWith('.md') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.csv');

    if (!isSupported) {
      toast.error(`Unsupported file type: ${file.name}`, {
        description: 'Please upload text files (.txt, .md, .json, .csv, or .pdf)'
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      // Show processing toast for PDFs
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        toast.info('Processing PDF file...', {
          description: 'This may take a moment for PDFs with complex formatting.'
        });

        // Upload PDF to backend for Mathpix processing
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('https://gambitsummary.onrender.com/upload-file', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to process PDF: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success && data.content) {
          setUploadedFile({
            name: file.name,
            content: data.content,
            type: file.type || 'application/pdf'
          });
          toast.success('File uploaded successfully');
        } else {
          throw new Error('Invalid response from server');
        }
      } else {
        // For text files, read directly
        const content = await file.text();
        setUploadedFile({
          name: file.name,
          content: content,
          type: file.type || 'text/plain'
        });
        toast.success('File uploaded successfully');
      }
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      toast.error(`Failed to process file: ${file.name}`, {
        description: error instanceof Error ? error.message : 'Please try again or use a different file.'
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setSummary("");
    setError(null);
  };

  const generateSummary = async () => {
    if (!isPremium) {
      toast.error('Premium Feature', {
        description: 'Summary generation is only available for Premium users.',
        duration: 5000,
      });
      setError('Summary generation is a Premium feature. Upgrade to Premium to unlock unlimited summary generation!');
      return;
    }

    if (!uploadedFile) {
      toast.error('Please upload a file first', {
        description: 'You need to upload a file before generating a summary.'
      });
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSummary("");

    try {
      const requestBody: any = {
        history: [],
        question: `Please generate a concise, structured summary of the provided file content. Provide key points, core concepts, and quick study takeaways. Use short bullet sections like: TLDR, Key Concepts, Important Definitions, Example(s), Study Tips.`,
        user_id: userId,
        conversation_id: "summary-generation",
        uploaded_file_content: `--- FILE: ${uploadedFile.name} ---\n${uploadedFile.content}`
      };

      // Summary mode only uses file upload, no course context
      // if (courseId) requestBody.course_id = courseId;
      // if (courseContext) requestBody.course_context = courseContext;

      const res = await fetch("https://gambitsummary.onrender.com/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!data || (!data.answer && !data.summary)) {
        throw new Error("Invalid response from server");
      }

      // prefer explicit "summary" field if backend returns structured data, otherwise use answer string
      const serverSummary = data.summary ? data.summary : data.answer;
      setSummary(serverSummary || "");
      if (data.conversation_id) setConversationId(data.conversation_id);
    } catch (err: any) {
      console.error("Summary generation error:", err);
      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        setError("Network error: could not reach the backend. This may be CORS or network related.");
      } else {
        setError(err?.message || "Unknown error while generating summary.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const saveSummary = async () => {
    // Placeholder save: you can wire this to your Supabase /save endpoint later
    try {
      await navigator.clipboard.writeText(summary || "");
      // quick feedback
      alert("Summary copied to clipboard (temporary save). Hook this up to your save API to persist.");
    } catch {
      alert("Could not copy summary to clipboard. Implement save endpoint or check clipboard permissions.");
    }
  };

  // Show file upload UI if no file is uploaded
  if (!uploadedFile && !isGenerating && !summary) {
    return (
      <div className="flex-1 flex flex-col bg-background rounded-xl border shadow-sm overflow-hidden mx-6 mb-6 min-h-[600px] max-h-[800px]">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Create Summary</h2>
              <p className="text-sm text-muted-foreground">Upload a file to generate a summary</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
              <Upload className="h-10 w-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Upload a File</h3>
              <p className="text-muted-foreground mb-4">
                Upload a document (.txt, .md, .pdf, .json, .csv) to generate a concise summary with key points, concepts, and study tips.
              </p>
              {!isPremium && !isPremiumLoading && (
                <div className="flex items-center justify-center gap-2 px-4 py-2 mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <Crown className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-700 dark:text-amber-300">Premium feature - Upgrade to generate summaries</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json,.csv,.pdf,text/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              {isPremium ? (
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  size="lg"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Choose File
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/pricing')}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                  size="lg"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Upgrade to Premium
                </Button>
              )}
              <p className="text-xs text-muted-foreground mt-3">
                Maximum file size: 700KB
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="flex-1 flex flex-col bg-background rounded-xl border shadow-sm overflow-hidden mx-6 mb-6 min-h-[600px] max-h-[800px]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Generating Summary</h3>
              <p className="text-muted-foreground max-w-md">Analyzing file content and creating a concise summary…</p>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="animate-spin h-5 w-5" />
              <span className="text-sm text-muted-foreground">This may take a few seconds</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isPremiumError = error.includes('Premium');
    return (
      <div className="flex-1 flex flex-col bg-background rounded-xl border shadow-sm overflow-hidden mx-6 mb-6 min-h-[600px] max-h-[800px]">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-lg">
            {isPremiumError ? (
              <Crown className="h-8 w-8 mx-auto text-amber-600 mb-2" />
            ) : null}
            <h3 className="text-xl font-semibold">{isPremiumError ? 'Premium Feature' : 'Summary Generation Failed'}</h3>
            <p className="text-muted-foreground">{error}</p>
            <div className="flex items-center justify-center gap-2">
              {isPremiumError ? (
                <Button 
                  onClick={() => navigate('/pricing')}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Premium
                </Button>
              ) : (
                <>
                  <Button onClick={generateSummary} variant="outline" disabled={!uploadedFile}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={removeFile} variant="default">
                    Upload Different File
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background rounded-xl border shadow-sm overflow-hidden mx-6 mb-6 min-h-[600px] max-h-[800px]">
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold">Summary</h2>
            <p className="text-sm text-muted-foreground">Concise notes and study takeaways generated from your file</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPremium ? (
            <>
              <Button variant="outline" size="sm" onClick={generateSummary} disabled={!uploadedFile}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate
              </Button>
              <Button variant="ghost" size="sm" onClick={saveSummary} disabled={!summary}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/pricing')}
              className="border-amber-600 text-amber-600 hover:bg-amber-50"
            >
              <Crown className="h-4 w-4 mr-1" />
              Upgrade to Generate
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={removeFile}>
            <Upload className="h-4 w-4 mr-1" />
            New File
          </Button>
        </div>
      </div>

      {/* File info badge */}
      {uploadedFile && (
        <div className="px-6 pt-4">
          <Badge variant="secondary" className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1">
            <FileText className="h-3 w-3" />
            <span className="max-w-[200px] truncate">{uploadedFile.name}</span>
            <button
              onClick={removeFile}
              className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
              aria-label="Remove file"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      <div className="flex-1 p-6 overflow-y-auto">
        <Card className="w-full">
          <CardContent className="prose max-w-none">
            {/* Render markdown for nice formatting from the AI */}
            {summary ? (
              <ReactMarkdown>{summary}</ReactMarkdown>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Ready to generate summary</p>
                {isPremium ? (
                  <Button onClick={generateSummary} disabled={!uploadedFile}>
                    Generate Summary
                  </Button>
                ) : (
                  <Button 
                    onClick={() => navigate('/pricing')}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="p-6 border-t bg-gray-50 dark:bg-slate-800">
        <div className="text-sm text-muted-foreground">
          Generated by AI Assistant {conversationId ? `• conversation ${conversationId}` : ""}
        </div>
      </div>
    </div>
  );
};

export default SummaryMode;
