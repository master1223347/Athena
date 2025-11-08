import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Loader2, RefreshCw, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface SummaryModeProps {
  courseContext?: string;
  courseId?: string;
  userId?: string;
}

const SummaryMode: React.FC<SummaryModeProps> = ({ courseContext, courseId, userId }) => {
  const [isGenerating, setIsGenerating] = useState(true);
  const [summary, setSummary] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const generateSummary = async () => {
    setIsGenerating(true);
    setError(null);
    setSummary("");

    try {
      const requestBody: any = {
        history: [],
        question: `Please generate a concise, structured summary of the provided course material${courseContext ? ` for ${courseContext}` : ""}. Provide key points, core concepts, and quick study takeaways. Use short bullet sections like: TLDR, Key Concepts, Important Definitions, Example(s), Study Tips.`,
        user_id: userId,
        conversation_id: "summary-generation"
      };

      if (courseId) requestBody.course_id = courseId;
      if (courseContext) requestBody.course_context = courseContext;

      const res = await fetch("https://gambitbackend.onrender.com/chat", {
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

  useEffect(() => {
    generateSummary();
    // re-generate when courseContext or courseId changes
  }, [courseContext, courseId]);

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
              <p className="text-muted-foreground max-w-md">Analyzing course content and creating a concise summary…</p>
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
    return (
      <div className="flex-1 flex flex-col bg-background rounded-xl border shadow-sm overflow-hidden mx-6 mb-6 min-h-[600px] max-h-[800px]">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-lg">
            <h3 className="text-xl font-semibold">Summary Generation Failed</h3>
            <p className="text-muted-foreground">{error}</p>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={generateSummary} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => setSummary("No summary available. Try again or check your course data.")} variant="default">
                Use Placeholder
              </Button>
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
            <p className="text-sm text-muted-foreground">Concise notes and study takeaways generated from your course content</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={generateSummary}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Regenerate
          </Button>
          <Button variant="ghost" size="sm" onClick={saveSummary}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <Card className="w-full">
          <CardContent className="prose max-w-none">
            {/* Render markdown for nice formatting from the AI */}
            {summary ? (
              <ReactMarkdown>{summary}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground">No summary returned. Try regenerating or pick a different course.</p>
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
