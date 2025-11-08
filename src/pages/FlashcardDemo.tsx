import React from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import Flashcard from '@/components/ui/Flashcard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ============================================================================
// WEBHOOK INTEGRATION POINTS FOR AI FLASHCARD BACKEND AGENTIC FEATURE
// ============================================================================

/**
 * WEBHOOK ENDPOINT CONFIGURATION
 * Replace this URL with your actual webhook endpoint for flashcard generation
 */
const FLASHCARD_WEBHOOK_URL = "https://gambitflashcard.onrender.com/generate-flashcards";

/**
 * WEBHOOK REQUEST FORMAT
 * This is the expected format for sending flashcard generation requests to the backend
 */
interface FlashcardWebhookRequest {
  course_context?: string;
  course_id?: string;
  user_id?: string;
  card_count: number;
  difficulty: 'easy' | 'medium' | 'hard';
  format: 'q_and_a' | 'multiple_choice' | 'fill_in_blank';
  topics?: string[];
  assignment_id?: string;
}

/**
 * WEBHOOK RESPONSE FORMAT
 * This is the expected format returned by the AI Flashcard Backend Agentic feature
 */
interface FlashcardWebhookResponse {
  quiz: Array<{
    id: number;
    prompt: string;
    options?: string[];
    correct_answer: string;
    type: string;
  }>;
  raw: null;
  conversation_id: string;
}

/**
 * FLASHCARD DATA INTERFACE
 * Frontend interface for flashcard data structure
 */
interface FlashcardData {
  q: string;
  a: string;
  id?: number;
  type?: string;
  difficulty?: string;
  topic?: string;
}

/**
 * WEBHOOK INTEGRATION FUNCTION
 * This function demonstrates how to integrate with the flashcard webhook
 * Replace the sample data with actual webhook calls
 */
const generateFlashcardsFromWebhook = async (config: FlashcardWebhookRequest): Promise<FlashcardData[]> => {
  try {
    // WEBHOOK CALL - Replace this with actual webhook implementation
    const response = await fetch(FLASHCARD_WEBHOOK_URL, {
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

    const webhookResponse: FlashcardWebhookResponse = await response.json();
    
    // Convert webhook response to frontend FlashcardData format
    return webhookResponse.quiz.map((item, index) => ({
      q: item.prompt,
      a: item.correct_answer,
      id: item.id || index + 1,
      type: item.type,
      difficulty: config.difficulty,
      topic: config.topics?.[0]
    }));
  } catch (error) {
    console.error('Webhook integration error:', error);
    // Fallback to sample data
    return getSampleFlashcards();
  }
};

/**
 * HELPER FUNCTION: Convert multiple choice to Q&A format
 * This converts the backend's quiz format to simple Q&A flashcards
 */
const convertQuizToFlashcard = (quizItem: any): FlashcardData => {
  return {
    q: quizItem.prompt,
    a: quizItem.correct_answer,
    id: quizItem.id,
    type: quizItem.type,
    difficulty: 'medium'
  };
};

/**
 * SAMPLE FLASHCARDS - Replace with webhook-generated flashcards
 * These are fallback flashcards when webhook is unavailable
 */
const getSampleFlashcards = (): FlashcardData[] => [
  { q: 'What is a closure in JavaScript?', a: 'A closure is a function that has access to its outer function scope even after the outer has returned.' },
  { q: 'What is hoisting?', a: 'Hoisting is JavaScript behavior where variable and function declarations are moved to the top of their scope before code execution.' },
  { q: 'What is the event loop?', a: 'The event loop is a mechanism that allows JavaScript to perform non-blocking operations by putting callbacks in a task queue.' }
];

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

export default function FlashcardDemo() {
  // WEBHOOK INTEGRATION POINT: Replace sample data with webhook call
  const [deck, setDeck] = React.useState<FlashcardData[]>(getSampleFlashcards());
  const [isLoading, setIsLoading] = React.useState(false);
  const [idx, setIdx] = React.useState(0);

  /**
   * WEBHOOK INTEGRATION: Load flashcards from webhook on component mount
   * This demonstrates how to integrate webhook calls into the component lifecycle
   */
  React.useEffect(() => {
    const loadFlashcardsFromWebhook = async () => {
      setIsLoading(true);
      try {
        // WEBHOOK CONFIGURATION - Customize these parameters
        const webhookConfig: FlashcardWebhookRequest = {
          card_count: 3,
          difficulty: 'medium',
          format: 'q_and_a',
          // Add course context if available
          // course_context: 'JavaScript Fundamentals',
          // course_id: 'js101',
          // user_id: 'user123',
        };

        // WEBHOOK CALL
        const webhookFlashcards = await generateFlashcardsFromWebhook(webhookConfig);
        setDeck(webhookFlashcards);
      } catch (error) {
        console.error('Failed to load flashcards from webhook:', error);
        // Fallback to sample flashcards
        setDeck(getSampleFlashcards());
      } finally {
        setIsLoading(false);
      }
    };

    // Uncomment the line below to enable webhook integration
    // loadFlashcardsFromWebhook();
  }, []);

  const next = () => setIdx(i => Math.min(deck.length - 1, i + 1));
  const prev = () => setIdx(i => Math.max(0, i - 1));

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Flashcards</h1>
            <p className="text-sm text-muted-foreground">
              Try a small deck to preview the UI.
              {/* WEBHOOK STATUS INDICATOR */}
              {isLoading && <span className="text-purple-600"> (Loading from webhook...)</span>}
            </p>
          </div>
          
          {/* WEBHOOK INTEGRATION: Refresh button to reload from webhook */}
          <button
            onClick={async () => {
              setIsLoading(true);
              try {
                const webhookConfig: FlashcardWebhookRequest = {
                  card_count: 3,
                  difficulty: 'medium',
                  format: 'q_and_a',
                };
                const webhookFlashcards = await generateFlashcardsFromWebhook(webhookConfig);
                setDeck(webhookFlashcards);
                setIdx(0); // Reset to first card
              } catch (error) {
                console.error('Failed to refresh flashcards:', error);
              } finally {
                setIsLoading(false);
              }
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh from Webhook'}
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Flashcard Demo</CardTitle>
            {/* WEBHOOK INTEGRATION: Show webhook status */}
            <p className="text-sm text-muted-foreground">
              Flashcards loaded: {isLoading ? 'Loading from webhook...' : `${deck.length} cards`}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-6">
              <div className="w-full max-w-xl">
                {/* WEBHOOK INTEGRATION: Pass webhook-generated flashcards to Flashcard component */}
                <Flashcard 
                  question={deck[idx].q} 
                  answer={deck[idx].a} 
                  index={idx + 1} 
                  total={deck.length} 
                  onNext={next} 
                  onPrev={prev} 
                  showControls 
                />
                <div className="mt-4">
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-2 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full transition-width" 
                      style={{ width: `${((idx + 1) / deck.length) * 100}%` }} 
                    />
                  </div>
                </div>
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
              <p><strong>Webhook URL:</strong> {FLASHCARD_WEBHOOK_URL}</p>
              <p><strong>Flashcards Count:</strong> {deck.length}</p>
              <p><strong>Loading State:</strong> {isLoading ? 'Yes' : 'No'}</p>
              <p><strong>Current Card:</strong> {idx + 1} of {deck.length}</p>
              <div className="mt-4">
                <button
                  onClick={() => {
                    console.log('Current flashcards:', deck);
                    console.log('Webhook URL:', FLASHCARD_WEBHOOK_URL);
                    console.log('Current card:', deck[idx]);
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
