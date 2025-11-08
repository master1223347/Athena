# 🎯 **Frontend-to-Backend Integration Outline: AI Flashcard Backend Agentic Feature**

## 📋 **Current Frontend Architecture Analysis**

### **Existing Components:**
1. **`FlashcardMode.tsx`** - Advanced flashcard interface with generation, editing, and study modes
2. **`Flashcard.tsx`** - Interactive flashcard component with flip animations
3. **`FlashcardDemo.tsx`** - Demo page showcasing flashcard functionality (✅ **Updated with webhook integration**)
4. **`AIFlashcard.tsx`** - AI-powered flashcard generation component

### **Current Backend Integration:**
- **Endpoint**: `https://gambitbackend.onrender.com/chat`
- **Method**: POST
- **Request Format**: JSON with `history`, `question`, `user_id`, `conversation_id`, `course_id`, `course_context`

---

## 🔗 **Backend Feature Integration Outline**

### **Backend Response Format:**
```json
{
  "quiz": [
    {
      "id": 1,
      "prompt": "What is binary search time complexity?",
      "options": ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
      "correct_answer": "O(log n)",
      "type": "multiple_choice"
    }
  ],
  "raw": null,
  "conversation_id": "conv_id"
}
```

### **Required Frontend Modifications:**

## 📝 **Phase 1: Backend Response Handler**

### **1.1 Update FlashcardMode.tsx Response Parsing**
```typescript
// Current parsing logic needs to handle new backend format
const parseFlashcardResponse = (response: any): FlashcardData[] => {
  // Handle both old text format and new JSON format
  if (response.quiz && Array.isArray(response.quiz)) {
    return response.quiz.map((item: any, index: number) => ({
      id: item.id || index + 1,
      question: item.prompt || item.question,
      answer: item.correct_answer || item.answer,
      type: item.type || 'flashcard',
      isStarred: false
    }));
  }
  // Fallback to existing text parsing
  return parseTextResponse(response.answer || response);
};
```

### **1.2 Create Flashcard Type Converter**
```typescript
const convertQuizToFlashcard = (quizItem: any): FlashcardData => {
  return {
    id: quizItem.id,
    question: quizItem.prompt,
    answer: quizItem.correct_answer,
    type: quizItem.type,
    isStarred: false
  };
};
```

## 📝 **Phase 2: Enhanced Flashcard Generation**

### **2.1 Update Request Format**
```typescript
const generateFlashcards = async () => {
  const requestBody = {
    history: [],
    question: `Generate flashcards${courseContext ? ` for ${courseContext}` : ''} based on the course content. 
    IMPORTANT: Return the response in this exact JSON format:
    {
      "quiz": [
        {
          "id": 1,
          "prompt": "Your question here",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correct_answer": "Correct answer here",
          "type": "multiple_choice"
        }
      ],
      "raw": null,
      "conversation_id": "flashcard-generation"
    }`,
    user_id: userId,
    conversation_id: 'flashcard-generation',
    course_id: courseId,
    course_context: courseContext
  };
};
```

### **2.2 Add Flashcard-Specific Endpoint Support**
```typescript
// Optional: Create dedicated flashcard endpoint
const FLASHCARD_ENDPOINT = "https://gambitbackend.onrender.com/flashcard-webhook";

const generateFlashcards = async () => {
  const requestBody = {
    course_context: courseContext,
    course_id: courseId,
    user_id: userId,
    card_count: 8,
    difficulty: 'medium',
    topics: selectedTopics,
    format: 'q_and_a' // or 'multiple_choice'
  };
  
  const res = await fetch(FLASHCARD_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });
};
```

## 📝 **Phase 3: Enhanced Flashcard Types**

### **3.1 Support Multiple Flashcard Formats**
```typescript
interface FlashcardData {
  id: number;
  question: string;
  answer: string;
  type: 'q_and_a' | 'multiple_choice' | 'fill_in_blank' | 'true_false';
  options?: string[]; // For multiple choice
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
  isStarred?: boolean;
  createdAt?: Date;
  lastStudied?: Date;
  studyCount?: number;
}
```

### **3.2 Backend Response Mapping**
```typescript
const mapBackendResponse = (backendResponse: any): FlashcardData[] => {
  return backendResponse.quiz.map((item: any, index: number) => {
    const flashcardType = determineFlashcardType(item);
    
    return {
      id: item.id || index + 1,
      question: item.prompt || item.question,
      answer: item.correct_answer || item.answer,
      type: flashcardType,
      options: flashcardType === 'multiple_choice' ? item.options : undefined,
      difficulty: item.difficulty || 'medium',
      topic: item.topic,
      isStarred: false,
      createdAt: new Date(),
      studyCount: 0
    };
  });
};
```

## 📝 **Phase 4: Advanced Features**

### **4.1 Flashcard Analytics Integration**
```typescript
interface FlashcardAnalytics {
  flashcardId: string;
  userId: string;
  courseId: string;
  studySessionId: string;
  timeSpent: number;
  difficulty: 'easy' | 'medium' | 'hard';
  wasCorrect: boolean;
  studyDate: Date;
}

const submitFlashcardAnalytics = async (analytics: FlashcardAnalytics) => {
  await fetch("https://gambitbackend.onrender.com/flashcard/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(analytics),
  });
};
```

### **4.2 Adaptive Difficulty**
```typescript
const generateAdaptiveFlashcards = async (userPerformance: any) => {
  const requestBody = {
    course_context: courseContext,
    course_id: courseId,
    user_id: userId,
    previous_performance: userPerformance.scores,
    difficulty_preference: userPerformance.preferredDifficulty,
    card_count: 8,
    weak_topics: userPerformance.weakTopics
  };
  
  // Backend can adjust difficulty based on user performance
};
```

## 📝 **Phase 5: UI Enhancements**

### **5.1 Flashcard Configuration Panel**
```typescript
interface FlashcardConfig {
  cardCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  format: 'q_and_a' | 'multiple_choice';
  timeLimit?: number;
  showHints: boolean;
  spacedRepetition: boolean;
}

const FlashcardConfigModal: React.FC = () => {
  // Configuration UI for flashcard generation
};
```

### **5.2 Enhanced Study Modes**
```typescript
const StudyModes = {
  REVIEW: 'review',
  PRACTICE: 'practice',
  TEST: 'test',
  SPACED_REPETITION: 'spaced_repetition'
};

const FlashcardStudyMode: React.FC = () => {
  // Different study modes with different UI/UX
};
```

## 📝 **Phase 6: Integration Points**

### **6.1 AI Assistant Integration**
```typescript
// In AIAssistantPage.tsx
const handleFlashcardToolClick = async () => {
  setActiveTool('flashcards');
  
  // Generate flashcards with current course context
  const flashcards = await generateFlashcards();
  setFlashcards(flashcards);
};
```

### **6.2 Course-Specific Flashcards**
```typescript
// Generate flashcards based on specific course content
const generateCourseFlashcards = async (courseId: string, topics: string[]) => {
  const requestBody = {
    course_id: courseId,
    topics: topics,
    card_count: 10,
    user_id: userId,
    format: 'q_and_a'
  };
};
```

### **6.3 Assignment Integration**
```typescript
// Generate flashcards for specific assignment
const generateAssignmentFlashcards = async (assignmentId: string) => {
  const requestBody = {
    assignment_id: assignmentId,
    course_id: courseId,
    user_id: userId,
    card_count: 5,
    format: 'multiple_choice'
  };
};
```

## 📝 **Phase 7: Error Handling & Fallbacks**

### **7.1 Robust Error Handling**
```typescript
const handleFlashcardGenerationError = (error: any) => {
  if (error.message.includes('CORS')) {
    // Use offline flashcards
    setFlashcards(getOfflineFlashcards());
  } else if (error.message.includes('rate limit')) {
    // Show rate limit message, offer to try later
    setGenerationError('Rate limit reached. Please try again in a few minutes.');
  } else {
    // Generic error handling
    setGenerationError('Failed to generate flashcards. Using sample flashcards.');
    setFlashcards(getPlaceholderFlashcards());
  }
};
```

### **7.2 Offline Mode Support**
```typescript
const getOfflineFlashcards = (): FlashcardData[] => {
  // Pre-defined flashcards for offline mode
  // Could be stored in localStorage or imported from static files
};
```

---

## 🎯 **Implementation Priority**

### **High Priority (Phase 1-2):**
1. ✅ Update response parsing to handle new backend format
2. ✅ Modify request format to work with backend agentic feature
3. ✅ Test integration with existing FlashcardMode component

### **Medium Priority (Phase 3-4):**
1. 🔄 Add support for multiple flashcard types
2. 🔄 Implement flashcard analytics
3. 🔄 Add adaptive difficulty

### **Low Priority (Phase 5-7):**
1. ⏳ Enhanced UI features
2. ⏳ Advanced configuration options
3. ⏳ Comprehensive error handling

---

## 🔧 **Technical Requirements**

### **Backend Compatibility:**
- ✅ Handle JSON response format with `quiz` array
- ✅ Support conversation_id tracking
- ✅ Maintain existing request structure

### **Frontend Updates:**
- ✅ Update FlashcardMode.tsx response parsing
- ✅ Enhance FlashcardData interface
- ✅ Add error handling for new format
- ✅ Maintain backward compatibility

---

## 📋 **Webhook Integration Points Added**

### **FlashcardDemo.tsx Updates:**
- ✅ **Webhook Endpoint Configuration**: `FLASHCARD_WEBHOOK_URL`
- ✅ **Request/Response Interfaces**: `FlashcardWebhookRequest` & `FlashcardWebhookResponse`
- ✅ **Integration Function**: `generateFlashcardsFromWebhook()`
- ✅ **Type Conversion**: `convertQuizToFlashcard()`
- ✅ **State Management**: Loading states and error handling
- ✅ **Debug Panel**: Webhook testing and status display
- ✅ **Refresh Button**: Manual webhook trigger

### **How to Use:**
1. **Update Webhook URL**: Replace `FLASHCARD_WEBHOOK_URL` with your actual endpoint
2. **Enable Integration**: Uncomment `loadFlashcardsFromWebhook()` in useEffect
3. **Customize Config**: Modify `webhookConfig` parameters
4. **Test Integration**: Use "Refresh from Webhook" button and debug panel

This outline provides a comprehensive roadmap for integrating the AI Flashcard Backend Agentic feature with the existing frontend architecture while maintaining all current functionality and adding new capabilities.
