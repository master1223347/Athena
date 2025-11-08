import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, RotateCcw, ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2, Lightbulb, Target, Settings, Upload, FileText, X, Crown } from 'lucide-react';
import Quiz, { Question } from '@/components/ui/Quiz';
import QuestionTypeModal from '@/components/ui/QuestionTypeModal';
import HintModal from '@/components/ui/HintModal';
import { toast } from 'sonner';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useNavigate } from 'react-router-dom';

interface QuizModeProps {
  courseContext?: string;
  courseId?: string;
  userId?: string;
}

const QuizMode: React.FC<QuizModeProps> = ({ courseContext, courseId, userId }) => {
  const navigate = useNavigate();
  const { isPremium, isLoading: isPremiumLoading } = usePremiumStatus(userId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>(['multiple_choice']);
  const [showHint, setShowHint] = useState(false);
  const [showAnswersImmediately, setShowAnswersImmediately] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [useQuery, setUseQuery] = useState(false);
  const [queryText, setQueryText] = useState('');
  const MAX_QUERY_LENGTH = 500;
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string; type: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'course' | 'query' | 'file'>('course');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILE_SIZE = 700 * 1024; // 700KB
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
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

        const response = await fetch('https://gambitchatbot.onrender.com/upload-file', {
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
  };
  
  // Generate quiz questions
  const generateQuizQuestions = async () => {
    // Check premium status first
    if (!isPremium) {
      toast.error('Premium Feature', {
        description: 'Quiz generation is only available for Premium users. You can still use the sample quiz below.',
        duration: 5000,
      });
      setGenerationError('Quiz generation is a Premium feature. Upgrade to Premium to unlock unlimited quiz generation!');
      setQuestions(getPlaceholderQuestions());
      return;
    }

    // Check if either course is selected, query is provided, or file is uploaded
    const hasFile = uploadedFile !== null;
    const hasCourse = courseId || courseContext;
    const hasQuery = useQuery && queryText.trim();
    
    if (!hasFile && !hasCourse && !hasQuery) {
      setGenerationError('Please select a course, enter a query, or upload a file to generate a quiz.');
      return;
    }
    
    if (useQuery && !queryText.trim() && !hasFile) {
      setGenerationError('Please enter a query or upload a file to generate a quiz.');
      return;
    }
    
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      // Use the EXACT same request structure as the working chat functionality
      // Build question type instruction based on selected types
      const questionTypeInstructions = selectedQuestionTypes.map(type => {
        switch(type) {
          case 'multiple_choice':
            return 'multiple choice questions with 4 options each';
          case 'fill_in_blank':
            return 'fill-in-the-blank questions';
          case 'short_answer':
            return 'short answer questions';
          default:
            return 'multiple choice questions';
        }
      }).join(' and ');

      const requestBody: any = {
        user_id: userId,
        question_types: selectedQuestionTypes,
        num_questions: 5,
        conversation_id: 'quiz-generation'
      };

      // Add course context, query text, or file content
      if (uploadedFile) {
        requestBody.uploaded_file_content = `--- FILE: ${uploadedFile.name} ---\n${uploadedFile.content}`;
      } else if (useQuery) {
        requestBody.query = queryText.trim();
      } else {
        requestBody.course_id = courseId;
        requestBody.course_context = courseContext;
      }

      console.log('Sending quiz generation request:', requestBody);

      const res = await fetch("https://gambitquiz-7f0p.onrender.com/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      // Handle 403 error for premium-only features
      if (!res.ok) {
        if (res.status === 403) {
          const errorData = await res.json();
          throw new Error(errorData.detail?.message || "Quizzes are only available for Premium users. Upgrade to Premium to unlock this feature!");
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Quiz generation response:', data);
      
      // Check if we have a valid response
      if (!data || !data.quiz) {
        throw new Error(data.parse_error || 'Invalid response from server');
      }
      
      // The backend now returns properly formatted quiz questions
      const generatedQuestions: Question[] = data.quiz.map((q: any) => ({
        id: q.id,
        prompt: q.prompt,
        options: q.options || [],
        correctAnswer: q.correct_answer,
        type: q.type || 'multiple_choice'
      }));
      
      setQuestions(generatedQuestions.length > 0 ? generatedQuestions : getPlaceholderQuestions());
      
    } catch (error) {
      console.error('Error generating quiz:', error);
      
      // Check if it's a CORS or network error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setGenerationError('Network error: Unable to connect to the server. Please try again or use sample questions below.');
      } else {
        setGenerationError(`Failed to generate quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Fallback to placeholder questions
      setQuestions(getPlaceholderQuestions());
    } finally {
      setIsGenerating(false);
    }
  };


  // Fallback placeholder questions
  const getPlaceholderQuestions = (): Question[] => [
    {
      id: 1,
      prompt: "What is the primary focus of cognitive psychology?",
      options: [
        "Unconscious mental processes",
        "Mental processes like thinking, memory, and problem-solving",
        "Behavioral conditioning",
        "Social interactions"
      ],
      correctAnswer: "Mental processes like thinking, memory, and problem-solving",
      hint: "Think about what 'cognitive' means - it relates to mental processes and thinking.",
      focus: "Cognitive Psychology Fundamentals",
      type: 'multiple_choice'
    },
    {
      id: 2,
      prompt: "Which psychologist is known for the theory of operant conditioning?",
      options: [
        "Sigmund Freud",
        "B.F. Skinner",
        "Carl Rogers",
        "Ivan Pavlov"
      ],
      correctAnswer: "B.F. Skinner",
      hint: "This psychologist worked with animals and developed the concept of reinforcement schedules.",
      focus: "Learning Theories",
      type: 'multiple_choice'
    },
    {
      id: 3,
      prompt: "What is the difference between classical and operant conditioning?",
      options: [
        "Classical involves rewards, operant involves punishment",
        "Classical involves involuntary responses, operant involves voluntary behavior",
        "There is no difference",
        "Classical is for animals, operant is for humans"
      ],
      correctAnswer: "Classical involves involuntary responses, operant involves voluntary behavior",
      hint: "Consider whether the behavior is automatic (involuntary) or something the organism chooses to do (voluntary).",
      focus: "Conditioning Types",
      type: 'multiple_choice'
    }
  ];

  // NOTE: Generation is now user-triggered via button. Previously this ran on mount.

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Start timer when quiz begins
  useEffect(() => {
    if (questions.length > 0 && !isGenerating && !showResults && !quizStartTime) {
      setQuizStartTime(new Date());
    }
  }, [questions, isGenerating, showResults, quizStartTime]);

  const currentQuestion = questions[currentIndex];

  // Show loading state while generating quiz
  if (isGenerating) {
    return (
      <div className="flex-1 flex flex-col bg-background rounded-xl border shadow-sm overflow-hidden mx-6 mb-6 min-h-[600px] max-h-[800px]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6">
            {/* Animated quiz icon */}
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Generating Your Quiz</h3>
              <p className="text-muted-foreground max-w-md">
                Creating personalized questions based on {courseContext || 'your course content'}...
              </p>
            </div>
            
            {/* Progress animation */}
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            
            {/* Loading steps */}
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Analyzing course content...</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Generating questions...</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>Formatting quiz...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show prompt to generate quiz when none exist
  if (!isGenerating && questions.length === 0 && !generationError) {
    const hasCourseOrQuery = (courseId || courseContext) || (useQuery && queryText.trim()) || uploadedFile;
    
    return (
      <div className="flex-1 flex flex-col bg-background rounded-xl border shadow-sm overflow-hidden mx-6 mb-6 min-h-[600px] max-h-[800px]">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-semibold">Create a Quiz</h3>
              <p className="text-muted-foreground mt-2">Choose how you want to generate your quiz</p>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => {
              setActiveTab(value as 'course' | 'query' | 'file');
              if (value === 'query') {
                setUseQuery(true);
                setUploadedFile(null);
              } else if (value === 'file') {
                setUseQuery(false);
                setQueryText('');
              } else {
                setUseQuery(false);
                setUploadedFile(null);
                setQueryText('');
              }
            }} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="course">Select Course</TabsTrigger>
                <TabsTrigger value="query">Custom Quiz</TabsTrigger>
                <TabsTrigger value="file">Upload File</TabsTrigger>
              </TabsList>
              <TabsContent value="course" className="space-y-4 mt-4">
                <div className="text-center p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    {courseContext || courseId 
                      ? `Using course: ${courseContext || 'Selected course'}`
                      : 'Select a course from the dropdown above to generate a quiz based on your course content'}
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="query" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Textarea
                    value={queryText}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_QUERY_LENGTH) {
                        setQueryText(e.target.value);
                      }
                    }}
                    placeholder="Enter a topic, concept, or subject you want to quiz yourself on..."
                    className="min-h-[120px] resize-none"
                  />
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Describe what you want to be quizzed on</span>
                    <span>{queryText.length}/{MAX_QUERY_LENGTH}</span>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="file" className="space-y-4 mt-4">
                {uploadedFile ? (
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg bg-muted/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">{uploadedFile.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Replace File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload a document to generate quiz questions from
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Supported: .txt, .md, .pdf, .json, .csv (max 700KB)
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.pdf,.json,.csv,text/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </TabsContent>
            </Tabs>

            <div className="flex flex-col items-center justify-center space-y-3">
              {!isPremium && !isPremiumLoading && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <Crown className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-700 dark:text-amber-300">Premium feature - Upgrade to generate custom quizzes</span>
                </div>
              )}
              <div className="flex items-center justify-center space-x-3">
                {isPremium ? (
                  <Button 
                    onClick={generateQuizQuestions} 
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                    disabled={!hasCourseOrQuery}
                  >
                    {hasCourseOrQuery 
                      ? 'Generate Quiz' 
                      : activeTab === 'course' 
                        ? 'Choose a course first!' 
                        : activeTab === 'query' 
                          ? 'Enter a query' 
                          : 'Upload a file'}
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
                <Button onClick={() => setQuestions(getPlaceholderQuestions())} variant="outline">Use Sample Quiz</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if generation failed
  if (generationError) {
    const isPremiumError = generationError.includes('Premium');
    return (
      <div className="flex-1 flex flex-col bg-background rounded-xl border shadow-sm overflow-hidden mx-6 mb-6 min-h-[600px] max-h-[800px]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            {isPremiumError ? (
              <Crown className="h-8 w-8 mx-auto text-amber-600" />
            ) : (
              <XCircle className="h-8 w-8 mx-auto text-red-600" />
            )}
            <div>
              <h3 className="text-lg font-semibold">{isPremiumError ? 'Premium Feature' : 'Generation Failed'}</h3>
              <p className="text-muted-foreground mb-4 max-w-md">{generationError}</p>
              <div className="flex gap-2 justify-center">
                {isPremiumError ? (
                  <Button 
                    onClick={() => navigate('/pricing')}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                ) : (
                  <Button onClick={generateQuizQuestions} variant="outline">
                    {((courseId || courseContext) || (useQuery && queryText.trim()) || uploadedFile) 
                      ? 'Try Again' 
                      : activeTab === 'course' 
                        ? 'Choose a course first!' 
                        : activeTab === 'query' 
                          ? 'Enter a query' 
                          : 'Upload a file'}
                  </Button>
                )}
                <Button onClick={() => {
                  setGenerationError(null);
                  setQuestions(getPlaceholderQuestions());
                }} variant="default">
                  Use Sample Quiz
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const nextQuestion = () => {
    // Save current answer if selected
    if (selectedAnswer) {
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: selectedAnswer }));
    }
    
    // If showAnswersImmediately is true, show feedback before moving on
    if (showAnswersImmediately && selectedAnswer) {
      setShowFeedback(true);
      // Show feedback for a moment, then move to next question
      setTimeout(() => {
        setShowFeedback(false);
        if (currentIndex < questions.length - 1) {
          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);
          setSelectedAnswer(answers[questions[nextIndex]?.id] || null);
          setShowHint(false);
        } else {
          setShowResults(true);
        }
      }, 2000); // Show feedback for 2 seconds
    } else {
      if (currentIndex < questions.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setSelectedAnswer(answers[questions[nextIndex]?.id] || null);
        setShowHint(false);
      } else {
        setShowResults(true);
      }
    }
  };

  const prevQuestion = () => {
    // Save current answer if selected
    if (selectedAnswer) {
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: selectedAnswer }));
    }
    
    const prevIndex = Math.max(0, currentIndex - 1);
    setCurrentIndex(prevIndex);
    setSelectedAnswer(answers[questions[prevIndex]?.id] || null);
    setShowHint(false); // Reset hint display
  };

  const restart = () => {
    setCurrentIndex(0);
    setShowResults(false);
    setSelectedAnswer(null);
    setAnswers({});
    setShowHint(false);
    setShowFeedback(false);
    setQuizStartTime(null);
  };

  // Calculate elapsed time
  const getElapsedTime = () => {
    if (!quizStartTime) return 0;
    return Math.floor((currentTime.getTime() - quizStartTime.getTime()) / 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  // Calculate results
  const calculateResults = () => {
    let correct = 0;
    const results = questions.map(question => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correct++;
      
      return {
        question: question.prompt,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect
      };
    });
    
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100),
      results
    };
  };

  if (showResults) {
    const { correct, total, percentage, results } = calculateResults();
    
    return (
      <div className="flex-1 flex flex-col bg-background rounded-xl border shadow-sm overflow-hidden mx-6 mb-6 min-h-[600px] max-h-[800px]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Quiz Results</h2>
              <p className="text-sm text-muted-foreground">
                Here's how you performed
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={restart}
            className="text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Retake Quiz
          </Button>
        </div>

        {/* Results Summary */}
        <div className="p-6 border-b">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-3xl font-bold">{correct} / {total}</h3>
              <p className="text-lg text-muted-foreground">{percentage}%</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              {correct === total ? (
                <span className="text-green-600 font-semibold">Perfect Score! 🎉</span>
              ) : correct >= total * 0.8 ? (
                <span className="text-blue-600 font-semibold">Great Job! 👍</span>
              ) : correct >= total * 0.6 ? (
                <span className="text-yellow-600 font-semibold">Good Effort! 💪</span>
              ) : (
                <span className="text-orange-600 font-semibold">Keep Studying! 📚</span>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="flex-1 overflow-y-auto p-6">
          <h4 className="text-lg font-semibold mb-4">Question Review</h4>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-sm">Question {index + 1}</h5>
                  <div className="flex items-center gap-2">
                    {result.isCorrect ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      result.isCorrect ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{result.question}</p>
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="font-medium">Your answer: </span>
                    <span className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                      {result.userAnswer || 'No answer selected'}
                    </span>
                  </div>
                  {!result.isCorrect && (
                    <div className="text-sm">
                      <span className="font-medium">Correct answer: </span>
                      <span className="text-green-600">{result.correctAnswer}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t bg-gray-50 dark:bg-slate-800">
          <div className="flex justify-center gap-4">
            <Button
              onClick={restart}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Take Quiz Again
            </Button>
            <Button
              onClick={() => {
                setShowResults(false);
                setCurrentIndex(0);
                setSelectedAnswer(null);
                setAnswers({});
                setShowHint(false);
                setShowFeedback(false);
                setQuizStartTime(null);
                generateQuizQuestions();
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Generate New Quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-background rounded-xl border shadow-sm overflow-hidden mx-6 mb-6 min-h-[600px] max-h-[800px]">
      {/* Timer Panel - Left Side */}
      <div className="w-80 border-r bg-gray-50 dark:bg-gray-900/50 flex flex-col">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4">Quiz Timer</h3>
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400">
              {formatTime(getElapsedTime())}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Elapsed Time</p>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {currentIndex + 1} / {questions.length}
            </div>
            <p className="text-sm text-muted-foreground">Questions</p>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground">
              {Math.round(((currentIndex + 1) / questions.length) * 100)}%
            </div>
            <p className="text-sm text-muted-foreground">Complete</p>
          </div>
        </div>
      </div>

      {/* Quiz Panel - Right Side */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Quiz Mode</h2>
              <p className="text-sm text-muted-foreground">
                Test your knowledge with interactive questions
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <QuestionTypeModal
              selectedTypes={selectedQuestionTypes}
              onTypesChange={setSelectedQuestionTypes}
              showAnswersImmediately={showAnswersImmediately}
              onShowAnswersChange={setShowAnswersImmediately}
              currentQuestion={currentQuestion}
            >
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </QuestionTypeModal>
            <Button
              variant="outline"
              size="sm"
              onClick={restart}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Restart
            </Button>
          </div>
        </div>

        {/* Quiz Display */}
        <div className="flex-1 p-6">
          <div className="w-full max-w-2xl mx-auto">
          <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">Question {currentIndex + 1} of {questions.length}</h3>
                  {currentQuestion.focus && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      <Target className="h-3 w-3 mr-1" />
                      {currentQuestion.focus}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Think carefully and choose one option.</p>
              </div>
              {currentQuestion.hint && (
                <HintModal
                  hint={currentQuestion.hint}
                  open={showHint}
                  onOpenChange={setShowHint}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Show Hint
                  </Button>
                </HintModal>
              )}
            </div>

            <div className="mb-6">
              <p className="text-foreground text-base md:text-lg font-medium">{currentQuestion.prompt}</p>
            </div>

            <div className="grid gap-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.correctAnswer;
                const showCorrectness = showFeedback || showResults;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={showFeedback}
                    className={`text-left w-full rounded-lg shadow-sm p-3 transition-all duration-150 ${
                      showCorrectness
                        ? isCorrect
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          : isSelected
                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                            : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700'
                        : isSelected 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:scale-[1.01]' 
                          : 'bg-white dark:bg-slate-800 border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-[1.01]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 truncate">{option}</div>
                      {showCorrectness && isCorrect && (
                        <div className="ml-3 text-sm font-semibold text-green-600">✓ Correct</div>
                      )}
                      {showCorrectness && isSelected && !isCorrect && (
                        <div className="ml-3 text-sm font-semibold text-red-600">✗ Wrong</div>
                      )}
                      {!showCorrectness && isSelected && (
                        <div className="ml-3 text-sm font-semibold text-blue-600">Selected</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-6 border-t bg-gray-50 dark:bg-slate-800">
        <Button
          variant="outline"
          onClick={prevQuestion}
          disabled={currentIndex === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} of {questions.length}
          </span>
          <div className="flex space-x-1">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex 
                    ? 'bg-blue-600' 
                    : 'bg-blue-200'
                }`}
              />
            ))}
          </div>
        </div>

        <Button
          onClick={nextQuestion}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2"
        >
          {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
        </div>
      </div>
  );
};

export default QuizMode;
