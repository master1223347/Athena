import React, { useState, useRef, useEffect } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Sparkles, BookOpen, Brain, Zap, GraduationCap, FileText, Upload, X, History, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { courseService } from "@/services/courseService";
import { milestoneService } from "@/services/milestoneService";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import MessageRenderer from "@/components/chat/MessageRenderer";
import FlashcardMode from "@/components/chat/FlashcardMode";
import QuizMode from "@/components/chat/QuizMode";
import SummaryMode from "@/components/chat/SummaryMode";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Add interface for course data
interface Course {
  id: string;
  canvas_id: string;
  title: string;
  code: string;
}

// Add interface for assignment data
interface Assignment {
  id: string;
  title: string;
  due_date?: string;
  status?: string;
  type?: string;
}

const AiAssistantPage = () => {
  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        <Chatbot />
      </div>
    </MainLayout>
  );
};

export default AiAssistantPage;

const Chatbot: React.FC = () => {
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [coursesLoading, setCoursesLoading] = useState(true);
  // Commented out assignment dropdown functionality
  // const [assignments, setAssignments] = useState<Assignment[]>([]);
  // const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  // const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>("basic");
  const [chatCount, setChatCount] = useState<number>(0);
  const [chatLimitReached, setChatLimitReached] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; content: string; type: string }>>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, session } = useAuth();

  // Generate a new conversation ID
  const generateConversationId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  // Fetch available courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      
      try {
        setCoursesLoading(true);
        const coursesData = await courseService.getCourses(user.id);
        setCourses(coursesData);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  // Commented out: Fetch assignments when course is selected
  // useEffect(() => {
  //   const fetchAssignments = async () => {
  //     if (!selectedCourse || selectedCourse === 'all') {
  //       setAssignments([]);
  //       setSelectedAssignment("");
  //       return;
  //     }

  //     try {
  //       setAssignmentsLoading(true);
  //       const assignmentsData = await milestoneService.getAssignments(selectedCourse);
  //       setAssignments(assignmentsData);
  //       setSelectedAssignment(""); // Reset assignment selection when course changes
  //     } catch (error) {
  //       console.error('Error fetching assignments:', error);
  //       setAssignments([]);
  //     } finally {
  //       setAssignmentsLoading(false);
  //     }
  //   };

  //   fetchAssignments();
  // }, [selectedCourse]);

  // Fetch user plan and chat count
  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!user) return;
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single();
        
        if ((profile as any)?.plan) {
          setUserPlan((profile as any).plan);
        }
        
        // Fetch chat count for basic users
        if ((profile as any)?.plan === 'basic') {
          const { count } = await (supabase as any)
            .from('chat_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          
          setChatCount(count || 0);
          setChatLimitReached((count || 0) >= 10);
        }
      } catch (error) {
        console.error('Error fetching user plan:', error);
      }
    };

    fetchUserPlan();
  }, [user]);

  // Fetch chat history
  const fetchChatHistory = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`https://gambitchatbot.onrender.com/chat-history?user_id=${user.id}`);
      const data = await response.json();
      
      if (data.chats) {
        // Group chats by conversation_id
        const groupedChats: Record<string, any[]> = {};
        data.chats.forEach((chat: any) => {
          const convId = chat.conversation_id || 'default';
          if (!groupedChats[convId]) {
            groupedChats[convId] = [];
          }
          // Normalize field names (backend uses 'question' and 'answer')
          groupedChats[convId].push({
            ...chat,
            user_message: chat.question,
            bot_response: chat.answer
          });
        });
        
        // Convert to array of conversations
        const conversations = Object.entries(groupedChats).map(([convId, chats]) => ({
          conversation_id: convId,
          chats: chats,
          lastMessage: chats[chats.length - 1],
          timestamp: chats[0].created_at
        }));
        
        // Sort by most recent
        conversations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setChatHistory(conversations);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchChatHistory();
    }
  }, [user, showHistory]);

  const handleToolClick = async (tool: string) => {
    // Check if user is premium for summary mode
    // if (tool === 'summary' && userPlan !== 'premium') {
    //   toast.error('Premium Feature', {
    //     description: 'Summary generation is only available for Premium users. Upgrade to Premium to unlock this feature!'
    //   });
    //   return;
    // }

    // Allow quiz and flashcards to be accessed without course selection
    // The generate buttons will show "Choose a course" if no course is selected

    setLoading(true);
    try {
      const selectedCourseInfo = courses.find(c => c.id === selectedCourse);
      const courseContext = selectedCourseInfo ? ` for ${selectedCourseInfo.code} - ${selectedCourseInfo.title}` : "";
      // For flashcards, quiz, and summary, don't show chat messages - just activate the tool
      if (tool === 'flashcards' || tool === 'quiz' || tool === 'summary') {
        setActiveTool(tool);
        setLoading(false);
        return;
      }

      // For practice (chat), just activate the tool without sending any message
      if (tool === 'practice') {
        setActiveTool(tool);
        setLoading(false);
        return;
      }

      setActiveTool(tool);
      const prompt = `Generate ${tool}${courseContext} based on the current course content.`;
      const newHistory = [...history, { role: "user", content: prompt }];
      setHistory(newHistory);
      
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Template responses for each tool
      const templateResponses = {
        transcript: `📝 **Transcript Generator Online**${courseContext}\n\nGenerating a comprehensive transcript featuring:\n\n• Main concepts summary\n• Key definitions\n• Important examples\n• Study highlights\n\nWhich section would you like me to transcribe first?`
      };

      setHistory([...newHistory, { 
        role: "assistant", 
        content: templateResponses[tool as keyof typeof templateResponses] 
      }]);
    } catch (e) {
      setHistory([...history, { 
        role: "assistant", 
        content: `❌ Error: Could not generate ${tool}. Please try again.` 
      }]);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!user?.id) {
      setHistory([...history, { 
        role: "assistant", 
        content: "❌ **Authentication Error**\n\nPlease log in to use the AI assistant." 
      }]);
      return;
    }
    
    // Check chat limit for basic users
    if (userPlan === 'basic' && chatLimitReached) {
      setHistory([...history, { 
        role: "assistant", 
        content: "❌ **Chat Limit Reached**\n\nYou've reached the maximum of 10 chats allowed on the Basic plan. Please upgrade to Premium for unlimited chatting!\n\n**Premium features include:**\n• Unlimited chat messages\n• Advanced AI responses\n• Unlimited gambling (up to 5x multiplier)\n• Priority support" 
      }]);
      return;
    }
    
    // Generate conversation ID if this is the first message
    if (!currentConversationId) {
      setCurrentConversationId(generateConversationId());
    }
    
    const newHistory = [...history, { role: "user", content: input }];
    setHistory(newHistory);
    setInput("");
    setLoading(true);
  
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  
    try {
      const selectedCourseInfo = courses.find(c => c.id === selectedCourse);
  
      // ✅ Fix 3: sanitize history before sending
      const historyForRequest = newHistory.map(h => ({
        role: h.role,
        content: h.content
      }));
  
      const requestBody: any = {
        history: historyForRequest,
        question: input,
        user_id: user?.id,
        conversation_id: currentConversationId
      };
      if (selectedCourse) requestBody.course_id = selectedCourse;
      if (selectedCourseInfo) {
        requestBody.course_context = `${selectedCourseInfo.code} - ${selectedCourseInfo.title}`;
      }
      
      // Commented out: Add assignment context if an assignment is selected
      // if (selectedAssignment) {
      //   const selectedAssignmentInfo = assignments.find(a => a.id === selectedAssignment);
      //   if (selectedAssignmentInfo) {
      //     requestBody.assignment_context = selectedAssignmentInfo.title;
      //     // Prepend assignment details to the question for better context
      //     let assignmentDetails = `[Assignment Context: ${selectedAssignmentInfo.title}`;
      //     if (selectedAssignmentInfo.due_date) {
      //       assignmentDetails += ` (Due: ${new Date(selectedAssignmentInfo.due_date).toLocaleDateString()})`;
      //     }
      //     if (selectedAssignmentInfo.type) {
      //       assignmentDetails += ` - ${selectedAssignmentInfo.type}`;
      //     }
      //     assignmentDetails += ']\n\n';
      //     requestBody.question = assignmentDetails + requestBody.question;
      //   }
      // }
      // Add uploaded file content if any files are uploaded
      if (uploadedFiles.length > 0) {
        // Combine all file contents into a single string for the backend
        const combinedContent = uploadedFiles.map(file => 
          `--- FILE: ${file.name} ---\n${file.content}`
        ).join('\n\n');
        requestBody.uploaded_file_content = combinedContent;
      }
      
      // Add flashcard format instruction if generating flashcards (hidden from user)
      if (activeTool === 'flashcards' || input.toLowerCase().includes('flashcard')) {
        requestBody.system_instruction = "When generating flashcards, ALWAYS use this exact format:\n\nFlashcard 1:\nQ: [Your question here]\nA: [Your answer here]\n\nFlashcard 2:\nQ: [Your question here]\nA: [Your answer here]\n\nThis specific format is required for the interactive flashcard UI to render properly. Do not use any other format.";
        // Also add the format instruction to the prompt for the backend
        requestBody.question = `${prompt} IMPORTANT: Use this exact format for each flashcard:\n\nFlashcard 1:\nQ: [Your question here]\nA: [Your answer here]\n\nFlashcard 2:\nQ: [Your question here]\nA: [Your answer here]\n\nThis format ensures the flashcards will render as interactive components.`;
      }

      console.log('Sending request:', requestBody); // Debug log

      const res = await fetch("https://gambitchatbot.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      
      // Check if limit was reached
      if (data.limit_reached) {
        setChatLimitReached(true);
        setChatCount(10);
      }
      
      // Add the AI response to the history
      const updatedHistory = [...newHistory, { role: "assistant", content: data.answer }];
      setHistory(updatedHistory);
      
      // Set the conversation ID from the backend response
      if (data.conversation_id && !currentConversationId) {
        setCurrentConversationId(data.conversation_id);
      }
      
      // Update chat count for basic users
      if (userPlan === 'basic' && !data.limit_reached) {
        setChatCount(prev => prev + 1);
      }
      
      // Scroll to bottom to show the new message
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
      
      // Refresh chat history if sidebar is open
      if (showHistory) {
        fetchChatHistory();
      }
      
      // Don't automatically save individual messages anymore
      // Only save when user explicitly starts a new chat
    } catch (e) {
      setHistory([...newHistory, {
        role: "assistant",
        content: "❌ **Connection Error**\n\nI'm having trouble connecting to my servers. Please check your connection and try again."
      }]);
    }
    setLoading(false);
  };
  

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Maximum file size: 700KB
    const MAX_FILE_SIZE = 700 * 1024; // 700KB in bytes
    const MAX_FILES = 3;

    // Check if adding these files would exceed the limit
    const currentFileCount = uploadedFiles.length;
    const remainingSlots = MAX_FILES - currentFileCount;
    
    if (remainingSlots <= 0) {
      toast.error('File limit reached', {
        description: `You can only upload up to ${MAX_FILES} files at a time. Please remove some files before uploading more.`
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const newFiles: Array<{ name: string; content: string; type: string }> = [];
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    // Show processing toast for PDFs
    const hasPDF = filesToProcess.some(f => f.name.toLowerCase().endsWith('.pdf'));
    if (hasPDF) {
      toast.info('Processing PDF files...', {
        description: 'This may take a moment for PDFs with complex formatting.'
      });
    }

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File too large: ${file.name}`, {
          description: `File size must be less than 700KB. ${file.name} is ${(file.size / 1024).toFixed(2)}KB.`
        });
        continue;
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
        continue;
      }

      try {
        // For PDFs and other files, send to backend for processing
        if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
          // Upload PDF to backend for Mathpix processing
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('https://gambitchatbot.onrender.com/upload-file', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Failed to process PDF: ${response.statusText}`);
          }

          const data = await response.json();
          
          if (data.success && data.content) {
            newFiles.push({
              name: file.name,
              content: data.content,
              type: file.type || 'application/pdf'
            });
          } else {
            throw new Error('Invalid response from server');
          }
        } else {
          // For text files, read directly
          const content = await file.text();
          newFiles.push({
            name: file.name,
            content: content,
            type: file.type || 'text/plain'
          });
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        toast.error(`Failed to process file: ${file.name}`, {
          description: error instanceof Error ? error.message : 'Please try again or use a different file.'
        });
      }
    }

    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file${newFiles.length > 1 ? 's' : ''} uploaded successfully`, {
        description: `${MAX_FILES - currentFileCount - newFiles.length} slot${MAX_FILES - currentFileCount - newFiles.length !== 1 ? 's' : ''} remaining`
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startNewChat = () => {
    setHistory([]);
    setActiveTool(null);
    setCurrentConversationId(generateConversationId());
    setShowHistory(false);
  };

  const loadConversation = (conversation: any) => {
    const messages: { role: string; content: string }[] = [];
    conversation.chats.forEach((chat: any) => {
      if (chat.user_message) {
        messages.push({ role: 'user', content: chat.user_message });
      }
      if (chat.bot_response) {
        messages.push({ role: 'assistant', content: chat.bot_response });
      }
    });
    setHistory(messages);
    setCurrentConversationId(conversation.conversation_id);
    setActiveTool(null);
    setShowHistory(false);
  };




  return (
    <div className="flex h-full overflow-hidden">
      {/* Chat History Sidebar */}
      {showHistory && (
        <div className="w-80 border-r border-border bg-muted/20 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="h-5 w-5" />
                Chat History
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(false)}
              >
              </Button>
            </div>
            <Button
              onClick={startNewChat}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {chatHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No chat history yet
                </p>
              ) : (
                chatHistory.map((conversation, idx) => {
                  const firstMessage = conversation.chats[0]?.user_message || 'Untitled conversation';
                  const preview = firstMessage.length > 50 ? firstMessage.substring(0, 50) + '...' : firstMessage;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => loadConversation(conversation)}
                      className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {preview}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(conversation.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              AI Learning Assistant
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              Your intelligent study companion powered by advanced AI
              {userPlan === 'premium' && (
                <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-orange-200 text-orange-700 border-orange-200">
                  <Zap className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </p>
            {userPlan === 'basic' && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">
                  Chat limit: {chatCount}/10
                </span>
                {chatLimitReached && (
                  <Badge variant="destructive" className="text-xs">
                    Limit Reached
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="text-muted-foreground hover:text-foreground"
            >
              <History className="h-4 w-4 mr-2" />
              {showHistory ? 'Hide' : 'Show'} History
            </Button>
            {history.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startNewChat}
                  className="text-muted-foreground hover:text-foreground"
                >
                  New Chat
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setHistory([]);
                    setSelectedCourse("");
                    // setSelectedAssignment("");
                    setActiveTool(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear Chat
                </Button>
              </>
            )}
            <Badge variant="secondary" className="px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-200 text-purple-700 border-purple-200">
              <Zap className="h-3 w-3 mr-1" />
              {userPlan === 'premium' ? 'Premium' : 'Basic'}
            </Badge>
          </div>
        </div>

      {/* Course Selection */}
      <div className="mb-6 px-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Course Context
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select a course for Quiz/Flashcards
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.json,.csv,.pdf,text/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-muted-foreground hover:text-foreground"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
            {selectedCourse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCourse("");
                  // setSelectedAssignment("");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear Selection
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <GraduationCap className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={coursesLoading}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue 
                placeholder={coursesLoading ? "Loading courses..." : "Select a course (optional)"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{course.code}</span>
                    <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                      {course.title}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Commented out: Assignment Selection - Only show if a course is selected */}
        {/* {selectedCourse && selectedCourse !== 'all' && (
          <div className="mt-3 flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <Select 
              value={selectedAssignment} 
              onValueChange={setSelectedAssignment} 
              disabled={assignmentsLoading}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue 
                  placeholder={assignmentsLoading ? "Loading assignments..." : "Select an assignment (optional)"}
                />
              </SelectTrigger>
              <SelectContent>
                {assignments.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                    {assignmentsLoading ? "Loading..." : "No assignments found"}
                  </div>
                ) : (
                  assignments.map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{assignment.title || 'Untitled Assignment'}</span>
                        {assignment.due_date && (
                          <span className="text-xs text-muted-foreground">
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                        )}
                        {assignment.type && (
                          <span className="text-xs text-muted-foreground">
                            Type: {assignment.type}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedAssignment && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAssignment("")}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            )}
          </div>
        )} */}
        
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1"
          >
            <GraduationCap className="h-3 w-3" />
            <span className="max-w-[200px] truncate">
              {(() => {
                const selectedCourseData = selectedCourse && selectedCourse !== "" 
                  ? courses.find(c => c.id === selectedCourse) 
                  : null;
                return selectedCourseData 
                  ? `${selectedCourseData.code} - ${selectedCourseData.title}`
                  : "All Courses";
              })()}
            </span>
          </Badge>
          {/* Commented out: Selected assignment badge */}
          {/* {selectedAssignment && (
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1"
            >
              <FileText className="h-3 w-3" />
              <span className="max-w-[200px] truncate">
                {assignments.find(a => a.id === selectedAssignment)?.title || 'Selected Assignment'}
              </span>
            </Badge>
          )} */}
          {uploadedFiles.map((file, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1"
            >
              <FileText className="h-3 w-3" />
              <span className="max-w-[200px] truncate">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                aria-label="Remove file"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Learning Tools */}
      <div className="mb-6 px-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {activeTool ? `${activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} Mode` : "Quick Actions"}
          </h3>
          {activeTool && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTool(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              Exit Mode
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant={activeTool === 'practice' ? "default" : "outline"}
            onClick={() => handleToolClick('practice')}
            disabled={loading}
            className={`h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200 group ${
              activeTool === 'practice' 
                ? "bg-green-600 text-white hover:bg-green-700" 
                : "hover:bg-green-50 dark:hover:bg-green-900/30 hover:border-green-200 dark:hover:border-green-700"
            }`}
          >
            <Brain className={`h-5 w-5 group-hover:scale-110 transition-transform ${
              activeTool === 'practice' ? "text-white" : "text-green-600 dark:text-green-400"
            }`} />
            <div className="text-sm font-medium">
              {activeTool === 'practice' ? 'Chat Mode' : 'Chat'}
            </div>
          </Button>
          <Button
            variant={activeTool === 'quiz' ? "default" : "outline"}
            onClick={() => handleToolClick('quiz')}
            disabled={loading}
            className={`h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200 group ${
              activeTool === 'quiz' 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-200 dark:hover:border-blue-700"
            }`}
          >
            <BookOpen className={`h-5 w-5 group-hover:scale-110 transition-transform ${
              activeTool === 'quiz' ? "text-white" : "text-blue-600 dark:text-blue-400"
            }`} />
            <span className="text-sm font-medium">
              {activeTool === 'quiz' ? 'Quiz Mode' : 'Create Quiz'}
            </span>
          </Button>
          <Button
            variant={activeTool === 'flashcards' ? "default" : "outline"}
            onClick={() => handleToolClick('flashcards')}
            disabled={loading}
            className={`h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200 group ${
              activeTool === 'flashcards' 
                ? "bg-purple-600 text-white hover:bg-purple-700" 
                : "hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-200 dark:hover:border-purple-700"
            }`}
          >
            <Sparkles className={`h-5 w-5 group-hover:scale-110 transition-transform ${
              activeTool === 'flashcards' ? "text-white" : "text-purple-600 dark:text-purple-400"
            }`} />
            <span className="text-sm font-medium">
              {activeTool === 'flashcards' ? 'Flashcard Mode' : 'Flashcards'}
            </span>
          </Button>

          {/* Summary Button */}
          <Button
            variant={activeTool === 'summary' ? "default" : "outline"}
            onClick={() => handleToolClick('summary')}
            disabled={loading}
            className={`h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200 group ${
              activeTool === 'summary' 
                ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                : "hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-700"
            }`}
          >
            <FileText className={`h-5 w-5 group-hover:scale-110 transition-transform ${
              activeTool === 'summary' ? "text-white" : "text-indigo-600 dark:text-indigo-400"
            }`} />
            <span className="text-sm font-medium">
              {activeTool === 'summary' ? 'Summary Mode' : 'Summary'}
            </span>
          </Button>
        </div>
      </div>

      {/* Show Flashcard Mode when active */}
      {activeTool === 'flashcards' && (
        <FlashcardMode 
          courseContext={selectedCourse ? courses.find(c => c.id === selectedCourse)?.code + ' - ' + courses.find(c => c.id === selectedCourse)?.title : undefined}
          courseId={selectedCourse}
          userId={user?.id}
        />
      )}

      {/* Show Quiz Mode when active */}
      {activeTool === 'quiz' && (
        <QuizMode 
          courseContext={selectedCourse ? courses.find(c => c.id === selectedCourse)?.code + ' - ' + courses.find(c => c.id === selectedCourse)?.title : undefined}
          courseId={selectedCourse}
          userId={user?.id}
        />
      )}

      {/* Show Summary Mode when active */}
      {activeTool === 'summary' && (
        <SummaryMode
          courseContext={selectedCourse ? courses.find(c => c.id === selectedCourse)?.code + ' - ' + courses.find(c => c.id === selectedCourse)?.title : undefined}
          courseId={selectedCourse}
          userId={user?.id}
        />
      )}

      {/* Chat Container - Hide when flashcards or quiz tools are active */}
      {!(activeTool === 'flashcards' || activeTool === 'quiz' || activeTool === 'summary') && (
        <div className="flex-1 flex flex-col bg-background rounded-xl border shadow-sm overflow-hidden mx-6 mb-6 min-h-[600px] max-h-[800px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Welcome to your AI Learning Assistant
                </h3>
                <p className="text-muted-foreground max-w-full mb-8">
                  Ask me anything about your courses, or use the quick actions above to generate study materials.
                  {userPlan === 'premium' && (
                    <span className="block mt-2 text-sm font-medium text-green-600">
                      ✨ Premium: Unlimited messages and advanced features
                    </span>
                  )}
                  {userPlan === 'basic' && (
                    <span className="block mt-2 w-100 text-sm font-medium text-blue-600">
                      📊 Basic: {Math.max(0, 10 - chatCount)} chats remaining
                    </span>
                  )}
                </p>
                <Button
                  onClick={() => {
                    setHistory([]);
                    setSelectedCourse("");
                    // setSelectedAssignment("");
                    setActiveTool(null);
                    setCurrentConversationId(null);
                    setUploadedFiles([]); // Clear uploaded files
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={chatLimitReached}
                >
                  Start New Chat
                </Button>
              </div>
            </div>
          ) : (
            history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[80%]">
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-foreground ml-auto"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-foreground shadow-sm"
                    }`}
                  >
                    <MessageRenderer content={msg.content} role={msg.role as 'user' | 'assistant'} />
                  </div>
                  <div className={`text-xs text-muted-foreground mt-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                    {msg.role === "user" ? "You" : "AI Assistant"}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%]">
                <div className="bg-muted border px-4 py-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1 text-left">
                  AI Assistant
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-background p-4">
          {chatLimitReached ? (
            <div className="text-center py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm font-medium mb-2">
                  ❌ Chat limit reached
                </p>
                <p className="text-red-700 text-sm mb-3">
                  You've used all 10 chats on your Basic plan. Upgrade to Premium for unlimited access!
                </p>
                <Button
                  onClick={() => window.location.href = '/pricing'}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Upgrade to Premium
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    adjustTextareaHeight();
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    selectedCourse 
                      ? `Ask me about ${courses.find(c => c.id === selectedCourse)?.code}...`
                      : "Ask me anything about your courses..."
                  }
                  disabled={loading}
                  className="w-full resize-none border rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-sm bg-background text-foreground"
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="h-11 w-11 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex-shrink-0 self-center"
              >
                <Send className="h-4 w-4 self-center" />
              </Button>
            </div>
          )}
        </div>
      </div>
      )}
      </div>
    </div>
  );
};
