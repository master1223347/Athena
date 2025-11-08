import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, RotateCcw, ChevronLeft, ChevronRight, BookOpen, CheckCircle } from 'lucide-react';
import Flashcard from '@/components/ui/Flashcard';
import { ParsedFlashcard } from '@/utils/flashcardParser';

interface FlashcardStudyModeProps {
  flashcards: ParsedFlashcard[];
  onClose: () => void;
  onSave?: (flashcards: ParsedFlashcard[]) => void;
}

const FlashcardStudyMode: React.FC<FlashcardStudyModeProps> = ({ 
  flashcards, 
  onClose, 
  onSave 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studiedCards, setStudiedCards] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);

  const currentFlashcard = flashcards[currentIndex];
  const isLastCard = currentIndex === flashcards.length - 1;
  const allStudied = studiedCards.size === flashcards.length;

  const markAsStudied = () => {
    setStudiedCards(prev => new Set([...prev, currentFlashcard.id]));
  };

  const nextCard = () => {
    if (isLastCard) {
      setShowResults(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevCard = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const restart = () => {
    setCurrentIndex(0);
    setStudiedCards(new Set());
    setShowResults(false);
  };

  const progressPercentage = ((currentIndex + 1) / flashcards.length) * 100;

  if (showResults) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Study Complete!</h2>
          <p className="text-muted-foreground mb-6">
            You've studied all {flashcards.length} flashcards
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={restart}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Study Again
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold">Study Mode</h2>
              <p className="text-sm text-muted-foreground">
                {currentIndex + 1} of {flashcards.length} flashcards
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              {studiedCards.size} studied
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <div className="p-6">
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <Flashcard
                question={currentFlashcard.question}
                answer={currentFlashcard.answer}
                index={currentFlashcard.index}
                total={flashcards.length}
                onNext={nextCard}
                onPrev={prevCard}
                showControls={false}
              />
            </div>
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
            <Button
              variant="ghost"
              onClick={markAsStudied}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Studied
            </Button>
          </div>

          <Button
            onClick={nextCard}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex items-center gap-2"
          >
            {isLastCard ? 'Finish' : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FlashcardStudyMode;
