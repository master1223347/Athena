import React from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import Quiz, { Question } from '@/components/ui/Quiz';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ============================================================================
// WEBHOOK INTEGRATION POINTS FOR AI QUIZ BACKEND AGENTIC FEATURE
// ============================================================================

/**
 * WEBHOOK ENDPOINT CONFIGURATION
 * Replace this URL with your actual webhook endpoint for quiz generation
 */
const QUIZ_WEBHOOK_URL = "https://gambitquiz-7f0p.onrender.com";

/**
 * WEBHOOK REQUEST FORMAT
 * This is the expected format for sending quiz generation requests to the backend
 */
interface QuizWebhookRequest {
  course_context?: string;
  course_id?: string;
  user_id?: string;
  question_count: number;
  question_types: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  topics?: string[];
  assignment_id?: string;
}

/**
 * WEBHOOK RESPONSE FORMAT
 * This is the expected format returned by the AI Quiz Backend Agentic feature
 */
interface QuizWebhookResponse {
  flashcards: Array<{
    question: string;
    answer: string;
  }>;
  raw: null;
  conversation_id: string;
}

/**
 * WEBHOOK INTEGRATION FUNCTION
 * This function demonstrates how to integrate with the webhook
 * Replace the sample data with actual webhook calls
 */
const generateQuizFromWebhook = async (config: QuizWebhookRequest): Promise<Question[]> => {
  try {
    // WEBHOOK CALL - Replace this with actual webhook implementation
    const response = await fetch(QUIZ_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
        // 'Authorization': 'Bearer your-token-here',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status}`);
    }

    const webhookResponse: QuizWebhookResponse = await response.json();
    
    // Convert webhook response to frontend Question format
    return webhookResponse.flashcards.map((item, index) => ({
      id: index + 1,
      prompt: item.question,
      options: generateMultipleChoiceOptions(item.answer), // Convert to MC format
      correctAnswer: item.answer,
    }));
  } catch (error) {
    console.error('Webhook integration error:', error);
    // Fallback to sample data
    return getSampleQuestions();
  }
};

/**
 * HELPER FUNCTION: Generate multiple choice options from correct answer
 * This converts the backend's question-answer format to multiple choice
 */
const generateMultipleChoiceOptions = (correctAnswer: string): string[] => {
  // TODO: Implement AI-powered distractor generation
  // For now, using simple variations
  const distractors = [
    generateDistractor(correctAnswer),
    generateDistractor(correctAnswer),
    generateDistractor(correctAnswer)
  ];
  
  return [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
};

/**
 * HELPER FUNCTION: Generate plausible distractors
 * This should be enhanced with AI to generate better wrong answers
 */
const generateDistractor = (correctAnswer: string): string => {
  // Simple distractor generation - replace with AI-powered version
  const variations = [
    correctAnswer + " (incorrect)",
    "Not " + correctAnswer,
    "Alternative to " + correctAnswer
  ];
  return variations[Math.floor(Math.random() * variations.length)];
};

/**
 * SAMPLE QUESTIONS - Replace with webhook-generated questions
 * These are fallback questions when webhook is unavailable
 */
const getSampleQuestions = (): Question[] => [
  { id: 1, prompt: 'What is 2 + 2?', options: ['1','2','3','4'], correctAnswer: '4' },
  { id: 2, prompt: 'Capital of France?', options: ['Berlin','Paris','Rome','Madrid'], correctAnswer: 'Paris' },
  { id: 3, prompt: 'Which is a JS framework?', options: ['Laravel','Rails','React','Django'], correctAnswer: 'React' }
];

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

export default function QuizDemo() {
  // WEBHOOK INTEGRATION POINT: Replace sample data with webhook call
  const [questions, setQuestions] = React.useState<Question[]>(getSampleQuestions());
  const [isLoading, setIsLoading] = React.useState(false);

  /**
   * WEBHOOK INTEGRATION: Load questions from webhook on component mount
   * This demonstrates how to integrate webhook calls into the component lifecycle
   */
  React.useEffect(() => {
    const loadQuestionsFromWebhook = async () => {
      setIsLoading(true);
      try {
        // WEBHOOK CONFIGURATION - Customize these parameters
        const webhookConfig: QuizWebhookRequest = {
          question_count: 3,
          question_types: ['multiple_choice'],
          difficulty: 'medium',
          // Add course context if available
          // course_context: 'Computer Science 101',
          // course_id: 'cs101',
          // user_id: 'user123',
        };

        // WEBHOOK CALL
        const webhookQuestions = await generateQuizFromWebhook(webhookConfig);
        setQuestions(webhookQuestions);
      } catch (error) {
        console.error('Failed to load questions from webhook:', error);
        // Fallback to sample questions
        setQuestions(getSampleQuestions());
      } finally {
        setIsLoading(false);
      }
    };

    // Uncomment the line below to enable webhook integration
    // loadQuestionsFromWebhook();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quiz Demo</h1>
            <p className="text-sm text-muted-foreground">
              Try a quick sample quiz to preview the UI.
              {/* WEBHOOK STATUS INDICATOR */}
              {isLoading && <span className="text-blue-600"> (Loading from webhook...)</span>}
            </p>
          </div>
          
          {/* WEBHOOK INTEGRATION: Refresh button to reload from webhook */}
          <button
            onClick={async () => {
              setIsLoading(true);
              try {
                const webhookConfig: QuizWebhookRequest = {
                  question_count: 3,
                  question_types: ['multiple_choice'],
                  difficulty: 'medium',
                };
                const webhookQuestions = await generateQuizFromWebhook(webhookConfig);
                setQuestions(webhookQuestions);
              } catch (error) {
                console.error('Failed to refresh questions:', error);
              } finally {
                setIsLoading(false);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh from Webhook'}
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quiz Demo</CardTitle>
            {/* WEBHOOK INTEGRATION: Show webhook status */}
            <p className="text-sm text-muted-foreground">
              Questions loaded: {isLoading ? 'Loading from webhook...' : `${questions.length} questions`}
            </p>
          </CardHeader>
          <CardContent>
            <div className="py-6">
              <div className="w-full max-w-2xl mx-auto">
                {/* WEBHOOK INTEGRATION: Pass webhook-generated questions to Quiz component */}
                <Quiz questions={questions} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WEBHOOK INTEGRATION: Debug panel for webhook testing */}
        <Card className="border-dashed border-2 border-gray-300">
          <CardHeader>
            <CardTitle className="text-sm">Webhook Integration Debug Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Webhook URL:</strong> {QUIZ_WEBHOOK_URL}</p>
              <p><strong>Questions Count:</strong> {questions.length}</p>
              <p><strong>Loading State:</strong> {isLoading ? 'Yes' : 'No'}</p>
              <div className="mt-4">
                <button
                  onClick={() => {
                    console.log('Current questions:', questions);
                    console.log('Webhook URL:', QUIZ_WEBHOOK_URL);
                  }}
                  className="px-3 py-1 bg-gray-200 rounded text-xs"
                >
                  Log Debug Info
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
