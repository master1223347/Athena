export interface ParsedFlashcard {
  id: string;
  question: string;
  answer: string;
  index: number;
}

export interface FlashcardBlock {
  type: 'flashcards';
  flashcards: ParsedFlashcard[];
  totalCount: number;
}

export interface TextBlock {
  type: 'text';
  content: string;
}

export type MessageBlock = FlashcardBlock | TextBlock;

/**
 * Parses AI response text to extract flashcards and separate them from regular text
 * Supports multiple flashcard formats:
 * - (#). Front: {text}\n Back: {text}
 * - (#) Front: {text}\n Back: {text}
 * - Question {#}: {text}\n Answer: {text}
 */
export function parseMessageContent(content: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  const flashcards: ParsedFlashcard[] = [];
  
  // Split content into lines for easier processing
  const lines = content.split('\n');
  let currentText = '';
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Check if this line starts a flashcard pattern (multiple formats)
    const flashcardMatch = line.match(/^Flashcard\s+(\d+):\s*$/);
    
    if (flashcardMatch) {
      // Save any accumulated text
      if (currentText.trim()) {
        blocks.push({ type: 'text', content: currentText.trim() });
        currentText = '';
      }
      
      // Look for Q: and A: on the next lines
      let question = '';
      let answer = '';
      let j = i + 1;
      
      while (j < lines.length) {
        const nextLine = lines[j];
        
        // Check for Q: pattern
        const questionMatch = nextLine.match(/^\s*Q:\s*(.+)$/);
        if (questionMatch) {
          question = questionMatch[1].trim();
          j++;
          continue;
        }
        
        // Check for A: pattern
        const answerMatch = nextLine.match(/^\s*A:\s*(.+)$/);
        if (answerMatch) {
          answer = answerMatch[1].trim();
          j++;
          break;
        }
        
        // If we hit another flashcard or empty line, stop
        if (nextLine.match(/^Flashcard\s+\d+:/) || nextLine.trim() === '') {
          break;
        }
        
        j++;
      }
      
      if (question && answer) {
        const flashcard: ParsedFlashcard = {
          id: `flashcard-${flashcardMatch[1]}-${Date.now()}`,
          question: question,
          answer: answer,
          index: parseInt(flashcardMatch[1], 10)
        };
        flashcards.push(flashcard);
        i = j; // Skip all processed lines
        continue;
      }
    }
    
    // Also check for the original format: (1). Front: ... Back: ...
    const originalFlashcardMatch = line.match(/^(\d+)\)\.?\s*(?:Front|Question):\s*(.+)$/);
    
    if (originalFlashcardMatch) {
      // Save any accumulated text
      if (currentText.trim()) {
        blocks.push({ type: 'text', content: currentText.trim() });
        currentText = '';
      }
      
      // Look for the answer on the next line
      if (i + 1 < lines.length) {
        const answerLine = lines[i + 1];
        const answerMatch = answerLine.match(/^\s*(?:Back|Answer):\s*(.+)$/);
        
        if (answerMatch) {
          const flashcard: ParsedFlashcard = {
            id: `flashcard-${originalFlashcardMatch[1]}-${Date.now()}`,
            question: originalFlashcardMatch[2].trim(),
            answer: answerMatch[1].trim(),
            index: parseInt(originalFlashcardMatch[1], 10)
          };
          flashcards.push(flashcard);
          i += 2; // Skip both question and answer lines
          continue;
        }
      }
    }
    
    // If not a flashcard, add to current text
    currentText += (currentText ? '\n' : '') + line;
    i++;
  }
  
  // Add any remaining text
  if (currentText.trim()) {
    blocks.push({ type: 'text', content: currentText.trim() });
  }
  
  // If we found flashcards, add them as a block
  if (flashcards.length > 0) {
    blocks.push({
      type: 'flashcards',
      flashcards,
      totalCount: flashcards.length
    });
  }
  
  // If no flashcards found, return the entire content as text
  if (blocks.length === 0) {
    blocks.push({ type: 'text', content });
  }
  
  return blocks;
}

/**
 * Checks if a message contains flashcards
 */
export function hasFlashcards(content: string): boolean {
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for "Flashcard X:" format
    const flashcardMatch = line.match(/^Flashcard\s+(\d+):\s*$/);
    if (flashcardMatch) {
      // Look for Q: and A: patterns in the next few lines
      let foundQuestion = false;
      let foundAnswer = false;
      
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j];
        if (nextLine.match(/^\s*Q:\s*(.+)$/)) {
          foundQuestion = true;
        }
        if (nextLine.match(/^\s*A:\s*(.+)$/)) {
          foundAnswer = true;
        }
        if (nextLine.match(/^Flashcard\s+\d+:/)) {
          break; // Hit another flashcard
        }
      }
      
      if (foundQuestion && foundAnswer) {
        return true;
      }
    }
    
    // Check for original format: (1). Front: ... Back: ...
    const originalFlashcardMatch = line.match(/^(\d+)\)\.?\s*(?:Front|Question):\s*(.+)$/);
    if (originalFlashcardMatch && i + 1 < lines.length) {
      const answerLine = lines[i + 1];
      const answerMatch = answerLine.match(/^\s*(?:Back|Answer):\s*(.+)$/);
      if (answerMatch) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Extracts just the flashcards from content
 */
export function extractFlashcards(content: string): ParsedFlashcard[] {
  const blocks = parseMessageContent(content);
  const flashcardBlocks = blocks.filter(block => block.type === 'flashcards') as FlashcardBlock[];
  
  return flashcardBlocks.flatMap(block => block.flashcards);
}