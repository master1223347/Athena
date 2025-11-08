import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Star } from 'lucide-react';

export interface FlashcardProps {
  question: string;
  answer: string;
  index?: number;
  total?: number;
  onNext?: () => void;
  onPrev?: () => void;
  showControls?: boolean;
  onEdit?: () => void;
  isStarred?: boolean;
  onStar?: () => void;
}

const FlipIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12a9 9 0 10-8.48 8.98" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 3v6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Flashcard: React.FC<FlashcardProps> = ({ question, answer, index = 1, total = 1, onNext, onPrev, showControls = true, onEdit, isStarred = false, onStar }) => {
  const [flipped, setFlipped] = useState(false);
  const [hovered, setHovered] = useState(false);

  const reveal = () => {
    setFlipped(true);
  };

  return (
    <div className="w-full flex justify-center">
      <div className="relative w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 text-sm font-medium text-indigo-700">Flashcard</span>
            <div className="text-sm text-muted-foreground">Tap card or press Flip to reveal</div>
          </div>
          <div className="flex items-center gap-3">
            {total > 1 && (
              <div className="inline-flex items-center px-2 py-1 rounded-md bg-gradient-to-r from-indigo-50 to-purple-50 text-sm font-medium text-indigo-700">{index} / {total}</div>
            )}
          </div>
        </div>

        {/* colorful border wrapper */}
        <div className="rounded-2xl p-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-2xl hover:scale-[1.01] transition-transform">
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-1">
            <div className="relative overflow-hidden rounded-2xl">
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFlipped(s => !s); }}
                onClick={() => setFlipped(s => !s)}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className="perspective-1000 cursor-pointer"
              >
                <div className="relative w-full h-72 md:h-80 lg:h-96" style={{ transformStyle: 'preserve-3d' }}>
                  {/* Action buttons overlay */}
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    {onStar && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStar();
                        }}
                        className={`p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 outline-none ${
                          isStarred 
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' 
                            : 'bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300'
                        }`}
                        title={isStarred ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star className={`h-4 w-4 ${isStarred ? 'fill-current' : ''}`} />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit();
                        }}
                        className="p-2 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 shadow-lg transition-all duration-200 hover:scale-110 outline-none"
                        title="Edit this flashcard"
                      >
                        <Edit3 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </button>
                    )}
                  </div>
                  
                  {/* Front face */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white to-indigo-50 dark:from-slate-900 dark:to-slate-800 backdrop-blur-sm border border-gray-100 dark:border-slate-800 shadow-2xl p-8 flex flex-col justify-center"
                    initial={false}
                    animate={flipped ? { rotateY: 180, opacity: 0, translateY: 10 } : { rotateY: 0, opacity: 1, translateY: 0, rotateZ: hovered ? 1 : 0 }}
                    transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                    style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
                  >
                        <div className="text-sm text-muted-foreground mb-3">Question</div>
                        <div className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight">{question}</div>
                  </motion.div>

                  {/* Back face */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white to-indigo-50 dark:from-slate-900 dark:to-slate-800 backdrop-blur-sm border border-gray-100 dark:border-slate-800 shadow-2xl p-8 flex flex-col justify-center"
                    initial={false}
                    animate={flipped ? { rotateY: 0, opacity: 1, translateY: 0, rotateZ: hovered ? -1 : 0 } : { rotateY: -180, opacity: 0, translateY: -10 }}
                    transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                    style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
                  >
                    <div className="text-sm text-muted-foreground mb-3">Answer</div>
                    <div className="text-2xl md:text-3xl font-semibold text-indigo-700 leading-snug whitespace-pre-wrap">{answer}</div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFlipped(s => !s)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:brightness-105 shadow-lg transition-transform transform hover:-translate-y-[1px]"
              aria-pressed={flipped}
            >
              <FlipIcon className="w-4 h-4 opacity-90" />
              <span className="text-sm font-semibold">Flip</span>
            </button>

            {showControls && (
              <>
                <button
                  onClick={() => { setFlipped(false); if (onPrev) onPrev(); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 border border-gray-100 dark:border-slate-800 shadow-sm transition"
                >
                  Prev
                </button>

                <button
                  onClick={() => { setFlipped(false); if (onNext) onNext(); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 border border-gray-100 dark:border-slate-800 shadow-sm transition"
                >
                  Next
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
