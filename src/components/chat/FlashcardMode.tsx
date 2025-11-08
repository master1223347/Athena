import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Plus, RotateCcw, ChevronLeft, ChevronRight, Loader2, XCircle, Edit3, Trash2, Save, X, Star, Upload, FileText, Crown } from 'lucide-react';
import Flashcard from '@/components/ui/Flashcard';
import { toast } from 'sonner';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useNavigate } from 'react-router-dom';

interface FlashcardModeProps {
  courseContext?: string;
  courseId?: string;
  userId?: string;
}

interface FlashcardData {
  id: number;
  question: string;
  answer: string;
  isStarred?: boolean;
}

const FlashcardMode: React.FC<FlashcardModeProps> = ({ courseContext, courseId, userId }) => {
  const navigate = useNavigate();
  const { isPremium, isLoading: isPremiumLoading } = usePremiumStatus(userId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
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
  
  // Generate flashcards using the same approach as working chat
  const generateFlashcards = async () => {
    // Check premium status first
    if (!isPremium) {
      toast.error('Premium Feature', {
        description: 'Flashcard generation is only available for Premium users. You can still use the sample flashcards below.',
        duration: 5000,
      });
      setGenerationError('Flashcard generation is a Premium feature. Upgrade to Premium to unlock unlimited flashcard generation!');
      setFlashcards(getPlaceholderFlashcards());
      return;
    }

    // Check if either course is selected, query is provided, or file is uploaded
    const hasFile = uploadedFile !== null;
    const hasCourse = courseId || courseContext;
    const hasQuery = useQuery && queryText.trim();
    
    if (!hasFile && !hasCourse && !hasQuery) {
      setGenerationError('Please select a course, enter a query, or upload a file to generate flashcards.');
      return;
    }
    
    if (useQuery && !queryText.trim() && !hasFile) {
      setGenerationError('Please enter a query or upload a file to generate flashcards.');
      return;
    }
    
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      // ✅ CORRECT: Use FlashcardAI service format (NOT chat format)
      const requestBody: any = {
        user_id: userId,
        assignment_text: null, // Let it use course files
        conversation_id: 'flashcard-generation'
      };

      // Add course context, query text, or file content
      if (uploadedFile) {
        requestBody.uploaded_file_content = `--- FILE: ${uploadedFile.name} ---\n${uploadedFile.content}`;
      } else if (useQuery) {
        requestBody.query = queryText.trim();
      } else {
        requestBody.course_id = courseId || null;
        requestBody.course_context = courseContext || null;
      }
      
      console.log('Sending flashcard generation request:', requestBody);
  
      const res = await fetch("https://gambitflashcard.onrender.com/generate-flashcards", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBody),
      });
      
      // Handle 403 error for premium-only features
      if (!res.ok) {
        if (res.status === 403) {
          const errorData = await res.json();
          throw new Error(errorData.detail?.message || "Flashcards are only available for Premium users. Upgrade to Premium to unlock this feature!");
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Flashcard generation response:', data);
      
      // ✅ CORRECT: Handle FlashcardAI response format
      if (data.flashcards && Array.isArray(data.flashcards) && data.flashcards.length > 0) {
        const formattedFlashcards = data.flashcards.map((card: any, index: number) => ({
          id: index + 1,
          question: card.question || 'No question',
          answer: card.answer || 'No answer',
          isStarred: false
        }));
        setFlashcards(formattedFlashcards);
      } else if (data.raw) {
        // Fallback: Try to parse the raw JSON string if flashcards array is empty
        try {
          console.log('Attempting to parse raw flashcard data...');
          // Try to fix common JSON issues in the raw string
          let rawJson = data.raw.trim();
          
          // If it doesn't start with [, try to add it
          if (!rawJson.startsWith('[')) {
            rawJson = '[' + rawJson;
          }
          
          // Find all complete flashcard objects (pattern: "question": "...", "answer": "..."})
          // Match complete objects that have both question and answer fields properly closed
          const completeObjectRegex = /\{\s*"question":\s*"[^"]*"\s*,\s*"answer":\s*"[^"]*"\s*\}/g;
          const completeObjects = Array.from(rawJson.matchAll(completeObjectRegex));
          
          if (completeObjects.length > 0) {
            // Reconstruct JSON from complete objects only
            rawJson = '[' + completeObjects.map(m => m[0]).join(',') + ']';
          } else {
            // Fallback: find the last complete answer field and cut there
            const lastCompleteAnswer = rawJson.lastIndexOf('"answer": "');
            if (lastCompleteAnswer > 0) {
              // Find the closing of that answer field
              const answerEnd = rawJson.indexOf('"}', lastCompleteAnswer);
              if (answerEnd > 0) {
                // Find the closing brace of that object
                const objectEnd = rawJson.indexOf('}', answerEnd);
                if (objectEnd > 0) {
                  rawJson = rawJson.substring(0, objectEnd + 1);
                }
              }
            }
            
            // Remove trailing comma if present
            rawJson = rawJson.replace(/,\s*$/, '');
            
            // Ensure it ends with ]
            if (!rawJson.endsWith(']')) {
              rawJson = rawJson + ']';
            }
          }
          
          const parsedFlashcards = JSON.parse(rawJson);
          
          if (Array.isArray(parsedFlashcards) && parsedFlashcards.length > 0) {
            const formattedFlashcards = parsedFlashcards.map((card: any, index: number) => ({
              id: index + 1,
              question: card.question || 'No question',
              answer: card.answer || 'No answer',
              isStarred: false
            }));
            console.log(`Successfully parsed ${formattedFlashcards.length} flashcards from raw data`);
            setFlashcards(formattedFlashcards);
          } else {
            throw new Error('Parsed flashcards array is empty');
          }
        } catch (parseError) {
          console.error('Failed to parse raw flashcard data:', parseError);
          console.warn('Raw data:', data.raw.substring(0, 500)); // Log first 500 chars
          
          // Try a more lenient regex-based extraction
          try {
            // Extract complete flashcard objects first
            const flashcardObjectRegex = /\{\s*"question":\s*"([^"\\]*(\\.[^"\\]*)*)"\s*,\s*"answer":\s*"([^"\\]*(\\.[^"\\]*)*)"\s*\}/g;
            const flashcardMatches = Array.from(data.raw.matchAll(flashcardObjectRegex));
            
            if (flashcardMatches.length > 0) {
              const extractedFlashcards = flashcardMatches.map((match, i) => ({
                id: i + 1,
                question: match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
                answer: match[3].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
                isStarred: false
              }));
              console.log(`Extracted ${extractedFlashcards.length} flashcards using regex fallback`);
              setFlashcards(extractedFlashcards);
            } else {
              // Fallback: try simpler pattern
              const questionMatches = Array.from(data.raw.matchAll(/"question":\s*"((?:[^"\\]|\\.)*)"/g));
              const answerMatches = Array.from(data.raw.matchAll(/"answer":\s*"((?:[^"\\]|\\.)*)"/g));
              
              const questions = questionMatches.map(m => m[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'));
              const answers = answerMatches.map(m => m[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'));
              
              const minLength = Math.min(questions.length, answers.length);
              
              if (minLength > 0) {
                const extractedFlashcards = Array.from({ length: minLength }, (_, i) => ({
                  id: i + 1,
                  question: questions[i] || 'No question',
                  answer: answers[i] || 'No answer',
                  isStarred: false
                }));
                console.log(`Extracted ${extractedFlashcards.length} flashcards using simple regex fallback`);
                setFlashcards(extractedFlashcards);
              } else {
                throw new Error('Regex extraction failed - no matches found');
              }
            }
          } catch (regexError) {
            console.error('Regex extraction also failed:', regexError);
            setGenerationError('Failed to parse flashcard data. The response format may be invalid.');
            setFlashcards(getPlaceholderFlashcards());
          }
        }
      } else {
        // Handle error case or empty flashcards
        console.warn('No flashcards in response:', data);
        setFlashcards(getPlaceholderFlashcards());
      }
      
    } catch (error) {
      console.error('Error generating flashcards:', error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setGenerationError('🌐 Network error: Cannot connect to flashcard service. The service might be starting up or experiencing issues. Please try again in a moment.');
      } else if (error instanceof Error && error.message.includes('CORS')) {
        setGenerationError('🔒 CORS error: There\'s a configuration issue with the flashcard service. Please try again or contact support.');
      } else {
        setGenerationError(`❌ Failed to generate flashcards: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Fallback to placeholder flashcards
      setFlashcards(getPlaceholderFlashcards());
    } finally {
      setIsGenerating(false);
    }
  };

  // Parse AI response to extract flashcards
  const parseFlashcardResponse = (response: string): FlashcardData[] => {
    const flashcards: FlashcardData[] = [];
    const lines = response.split('\n');
    
    let currentFlashcard: Partial<FlashcardData> = {};
    let flashcardId = 1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      const flashcardMatch = line.match(/^Flashcard\s+(\d+):\s*$/);
      if (flashcardMatch) {
        if (currentFlashcard.question && currentFlashcard.answer) {
          flashcards.push(currentFlashcard as FlashcardData);
        }
        currentFlashcard = { id: flashcardId++ };
        continue;
      }
      
      const questionMatch = line.match(/^\s*Q:\s*(.+)$/);
      if (questionMatch && currentFlashcard.id) {
        currentFlashcard.question = questionMatch[1].trim();
        continue;
      }
      
      const answerMatch = line.match(/^\s*A:\s*(.+)$/);
      if (answerMatch && currentFlashcard.id) {
        currentFlashcard.answer = answerMatch[1].trim();
        continue;
      }
    }
    
    // Add the last flashcard if it exists
    if (currentFlashcard.question && currentFlashcard.answer) {
      flashcards.push(currentFlashcard as FlashcardData);
    }
    
    return flashcards.length > 0 ? flashcards : getPlaceholderFlashcards();
  };

  // Get placeholder flashcards
  const getPlaceholderFlashcards = (): FlashcardData[] => [
    {
      id: 1,
      question: "What is the definition of psychology?",
      answer: "Psychology is the scientific study of behavior and mental processes."
    },
    {
      id: 2,
      question: "What is classical conditioning?",
      answer: "Classical conditioning is a learning process that occurs when two stimuli are repeatedly paired."
    },
    {
      id: 3,
      question: "What is the difference between nature and nurture?",
      answer: "Nature refers to genetic inheritance, while nurture refers to environmental influences."
    }
  ];

  // NOTE: Generation is now user-triggered via button. Previously this ran on mount.

  const currentFlashcard = flashcards[currentIndex];

  const nextCard = () => {
    setCurrentIndex(prev => Math.min(flashcards.length - 1, prev + 1));
  };

  const prevCard = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const restart = () => {
    setCurrentIndex(0);
  };

  const toggleStar = (cardIndex: number) => {
    setFlashcards(prev => prev.map((card, index) => 
      index === cardIndex 
        ? { ...card, isStarred: !card.isStarred }
        : card
    ));
  };

  // Arrow key navigation - only in study mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle navigation when not editing a card
      if (editingCard !== null) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          prevCard();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextCard();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingCard, prevCard, nextCard]);

  // Edit functions
  const startEdit = (cardIndex: number) => {
    const card = flashcards[cardIndex];
    setEditingCard(cardIndex);
    setEditQuestion(card.question);
    setEditAnswer(card.answer);
  };

  const saveEdit = () => {
    if (editingCard !== null) {
      const updatedFlashcards = [...flashcards];
      updatedFlashcards[editingCard] = {
        ...updatedFlashcards[editingCard],
        question: editQuestion,
        answer: editAnswer
      };
      setFlashcards(updatedFlashcards);
      setEditingCard(null);
      setEditQuestion('');
      setEditAnswer('');
    }
  };

  const cancelEdit = () => {
    setEditingCard(null);
    setEditQuestion('');
    setEditAnswer('');
  };

  const deleteCard = (cardIndex: number) => {
    const updatedFlashcards = flashcards.filter((_, index) => index !== cardIndex);
    setFlashcards(updatedFlashcards);
    if (currentIndex >= updatedFlashcards.length) {
      setCurrentIndex(Math.max(0, updatedFlashcards.length - 1));
    }
  };

  const addNewCard = () => {
    const newCard: FlashcardData = {
      id: Math.max(...flashcards.map(c => c.id), 0) + 1,
      question: 'New question',
      answer: 'New answer'
    };
    setFlashcards([...flashcards, newCard]);
    setCurrentIndex(flashcards.length);
  };

  // Show loading state while generating flashcards
  if (isGenerating) {
    return (
      <div className="flex-1 flex flex-col bg-background rounded-xl border shadow-sm overflow-hidden mx-6 mb-6 min-h-[600px] max-h-[800px]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6">
            {/* Animated flashcard icon */}
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Generating Your Flashcards</h3>
              <p className="text-muted-foreground max-w-md">
                Creating personalized flashcards based on {courseContext || 'your course content'}...
              </p>
            </div>
            
            {/* Progress animation */}
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            
            {/* Loading steps */}
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Analyzing course content...</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Generating flashcards...</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>Formatting cards...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show prompt to generate flashcards when none exist
  if (!isGenerating && flashcards.length === 0 && !generationError) {
    const hasCourseOrQuery = (courseId || courseContext) || (useQuery && queryText.trim()) || uploadedFile;
    
    return (
      <div className="flex-1 flex flex-col bg-background rounded-xl border shadow-sm overflow-hidden mx-6 mb-6 min-h-[600px] max-h-[800px]">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-semibold">Create Flashcards</h3>
              <p className="text-muted-foreground mt-2">Choose how you want to generate your flashcards</p>
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
                <TabsTrigger value="query">Custom Flashcards</TabsTrigger>
                <TabsTrigger value="file">Upload File</TabsTrigger>
              </TabsList>
              <TabsContent value="course" className="space-y-4 mt-4">
                <div className="text-center p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    {courseContext || courseId 
                      ? `Using course: ${courseContext || 'Selected course'}`
                      : 'Select a course from the dropdown above to generate flashcards based on your course content'}
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
                    placeholder="Enter a topic, concept, or subject you want to create flashcards for..."
                    className="min-h-[120px] resize-none"
                  />
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Describe what you want to create flashcards for</span>
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
                        Upload a document to generate flashcards from
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
                  <span className="text-sm text-amber-700 dark:text-amber-300">Premium feature - Upgrade to generate custom flashcards</span>
                </div>
              )}
              <div className="flex items-center justify-center space-x-3">
                {isPremium ? (
                  <Button 
                    onClick={generateFlashcards} 
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={!hasCourseOrQuery}
                  >
                    {hasCourseOrQuery 
                      ? 'Generate Flashcards' 
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
                <Button onClick={() => setFlashcards(getPlaceholderFlashcards())} variant="outline">Use Sample Flashcards</Button>
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
                  <Button onClick={generateFlashcards} variant="outline">
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
                  setFlashcards(getPlaceholderFlashcards());
                }} variant="default">
                  Use Sample Flashcards
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background rounded-xl border shadow-sm overflow-hidden mx-6 mb-6 h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-purple-600" />
          <div>
            <h2 className="text-xl font-semibold">Flashcard Mode</h2>
            <p className="text-sm text-muted-foreground">
              Study with interactive flashcards
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            {currentIndex + 1} of {flashcards.length}
          </Badge>
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

      {/* Flashcard Study Mode */}
      <div className="flex-1 p-6 flex items-center justify-center">
        <div 
          className="w-full max-w-2xl focus:outline-none" 
          tabIndex={0}
          onFocus={() => {/* Focus handler for accessibility */}}
        >
          {currentFlashcard ? (
            <Flashcard
              question={currentFlashcard.question}
              answer={currentFlashcard.answer}
              index={currentFlashcard.id}
              total={flashcards.length}
              onNext={nextCard}
              onPrev={prevCard}
              showControls={false}
              isStarred={currentFlashcard.isStarred || false}
              onStar={() => toggleStar(currentIndex)}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              Loading flashcards...
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-6 border-t bg-gray-50 dark:bg-slate-800">
        <Button
          variant="outline"
          onClick={prevCard}
          disabled={currentIndex === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} of {flashcards.length}
          </span>
          <div className="flex space-x-1">
            {flashcards.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex 
                    ? 'bg-purple-600' 
                    : 'bg-purple-200'
                }`}
              />
            ))}
          </div>
        </div>

        <Button
          onClick={nextCard}
          disabled={currentIndex === flashcards.length - 1}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex items-center gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* All Flashcards Section */}
      <div className="px-6 pb-6 pt-8 mt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">All Flashcards</h3>
          <Button onClick={addNewCard} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Add New Card
          </Button>
        </div>
        
        <div className="space-y-3">
          {flashcards.map((card, index) => (
            <div key={card.id} className="bg-muted/50 border rounded-lg p-4">
              {editingCard === index ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Question</label>
                    <textarea
                      value={editQuestion}
                      onChange={(e) => setEditQuestion(e.target.value)}
                      className="w-full mt-1 p-3 border rounded-lg resize-none bg-background text-foreground border-input"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Answer</label>
                    <textarea
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                      className="w-full mt-1 p-3 border rounded-lg resize-none bg-background text-foreground border-input"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveEdit} size="sm" className="bg-green-600 hover:bg-green-700">
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button onClick={cancelEdit} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1 flex">
                    {/* Question Column */}
                    <div className="flex-1 pr-4 border-r border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Question</div>
                      <div className="text-base font-medium">{card.question}</div>
                    </div>
                    {/* Answer Column */}
                    <div className="flex-1 pl-4">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Answer</div>
                      <div className="text-base text-muted-foreground">{card.answer}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStar(index)}
                      className={card.isStarred ? "text-yellow-600 hover:text-yellow-700" : ""}
                    >
                      <Star className={`h-4 w-4 ${card.isStarred ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(index)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCard(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlashcardMode;
