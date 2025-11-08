import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BookOpen, RotateCcw } from 'lucide-react';

interface AIFlashcardProps {
  question: string;
  answer: string;
  index: number;
  total: number;
  onStudyMode?: () => void;
}

const AIFlashcard: React.FC<AIFlashcardProps> = ({ 
  question, 
  answer, 
  index, 
  total, 
  onStudyMode 
}) => {
  const [flipped, setFlipped] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-xs font-medium text-purple-700">
            <BookOpen className="h-3 w-3 mr-1" />
            Flashcard {index} of {total}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFlipped(!flipped)}
          className="h-8 w-8 p-0 hover:bg-purple-50"
        >
          <RotateCcw className="h-4 w-4 text-purple-600" />
        </Button>
      </div>

      {/* Card */}
      <div className="relative">
        <div className="rounded-xl p-1 bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg hover:scale-[1.02] transition-transform">
          <div className="rounded-xl bg-white dark:bg-slate-900 p-1">
            <div className="relative overflow-hidden rounded-xl">
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFlipped(s => !s); }}
                onClick={() => setFlipped(s => !s)}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className="cursor-pointer"
              >
                <div className="relative w-full h-48" style={{ transformStyle: 'preserve-3d' }}>
                  {/* Front face */}
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-gradient-to-b from-white to-purple-50 dark:from-slate-900 dark:to-slate-800 border border-gray-100 dark:border-slate-800 shadow-lg p-6 flex flex-col justify-center"
                    initial={false}
                    animate={flipped ? { rotateY: 180, opacity: 0 } : { rotateY: 0, opacity: 1, rotateZ: hovered ? 1 : 0 }}
                    transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                    style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
                  >
                    <div className="text-xs text-muted-foreground mb-2">Question</div>
                    <div className="text-lg font-semibold text-foreground leading-tight">{question}</div>
                  </motion.div>

                  {/* Back face */}
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-gradient-to-b from-white to-blue-50 dark:from-slate-900 dark:to-slate-800 border border-gray-100 dark:border-slate-800 shadow-lg p-6 flex flex-col justify-center"
                    initial={false}
                    animate={flipped ? { rotateY: 0, opacity: 1 } : { rotateY: -180, opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                    style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
                  >
                    <div className="text-xs text-muted-foreground mb-2">Answer</div>
                    <div className="text-lg font-medium text-blue-700 leading-snug whitespace-pre-wrap">{answer}</div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Click to flip • Space/Enter to flip
        </div>
      </div>
    </div>
  );
};

export default AIFlashcard;
