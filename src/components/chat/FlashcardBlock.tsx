import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, Save, Share2 } from 'lucide-react';
import AIFlashcard from './AIFlashcard';
import { ParsedFlashcard } from '@/utils/flashcardParser';

interface FlashcardBlockProps {
  flashcards: ParsedFlashcard[];
  totalCount: number;
  onStudyMode?: () => void;
  onSaveDeck?: (flashcards: ParsedFlashcard[]) => void;
}

const FlashcardBlock: React.FC<FlashcardBlockProps> = ({ 
  flashcards, 
  totalCount, 
  onStudyMode,
  onSaveDeck 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const currentFlashcard = flashcards[currentIndex];

  const nextCard = () => {
    setCurrentIndex(prev => Math.min(flashcards.length - 1, prev + 1));
  };

  const prevCard = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-foreground">AI Generated Flashcards</span>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            {totalCount} cards
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleShowAll}
            className="text-xs"
          >
            {showAll ? 'Show One' : 'Show All'}
          </Button>
        </div>
      </div>

      {/* Flashcard Display */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardContent className="p-6">
          {showAll ? (
            <div className="space-y-4">
              {flashcards.map((flashcard, index) => (
                <motion.div
                  key={flashcard.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AIFlashcard
                    question={flashcard.question}
                    answer={flashcard.answer}
                    index={flashcard.index}
                    total={totalCount}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <AIFlashcard
                question={currentFlashcard.question}
                answer={currentFlashcard.answer}
                index={currentFlashcard.index}
                total={totalCount}
              />
              
              {/* Navigation */}
              {flashcards.length > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevCard}
                    disabled={currentIndex === 0}
                    className="text-xs"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2">
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
                    variant="outline"
                    size="sm"
                    onClick={nextCard}
                    disabled={currentIndex === flashcards.length - 1}
                    className="text-xs"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSaveDeck?.(flashcards)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Save className="h-3 w-3 mr-1" />
            Save Deck
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Share2 className="h-3 w-3 mr-1" />
            Share
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Generated by AI Assistant
        </div>
      </div>
    </div>
  );
};

export default FlashcardBlock;
