import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Question {
  id: number;
  prompt: string;
  options: string[];
  correctAnswer: string;
  hint?: string;
  focus?: string;
  type?: 'multiple_choice' | 'fill_in_blank' | 'short_answer';
}

export interface QuizProps {
  questions: Question[];
}

const cardVariants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const Quiz: React.FC<QuizProps> = ({ questions }) => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, { selected: string | null; correct: boolean }>>({});

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-lg p-6 text-center">
          <p className="text-muted-foreground">No questions provided.</p>
        </div>
      </div>
    );
  }

  const q = questions[current];

  const handleOptionClick = (opt: string) => {
  if (submitted) return; // lock selection after submit
  setSelected(prev => prev === opt ? null : opt);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    const correct = selected === q.correctAnswer;
    setAnswers(prev => ({ ...prev, [q.id]: { selected, correct } }));
    setSubmitted(true);
  };

  const handleNext = () => {
    // If not submitted, treat as skip/submit as wrong
    if (!submitted) {
      const correct = selected === q.correctAnswer;
      setAnswers(prev => ({ ...prev, [q.id]: { selected, correct } }));
    }

    setSubmitted(false);
    setSelected(null);

    if (current < questions.length - 1) {
      setCurrent(current + 1);
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      setCurrent(current - 1);
      setSubmitted(false);
      setSelected(null);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setSubmitted(false);
    setAnswers({});
  };

  const score = Object.values(answers).filter(a => a.correct).length;
  const percent = Math.round((score / questions.length) * 100);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-lg p-6">
        <AnimatePresence mode="wait">
          {current < questions.length ? (
            <motion.div
              key={q.id}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Question {current + 1} of {questions.length}</h3>
                  <p className="text-sm text-muted-foreground">Think carefully and choose one option.</p>
                </div>
                <div className="text-sm text-muted-foreground">{score} correct</div>
              </div>

              <div className="mb-6">
                <p className="text-foreground text-base md:text-lg font-medium">{q.prompt}</p>
              </div>

              <div className="grid gap-3">
                {q.options.map(opt => {
                  const isSelected = selected === opt;
                  const submittedAnswer = answers[q.id];

                  // determine classes after submission
                  let bg = 'bg-white dark:bg-slate-800';
                  let border = 'border border-transparent';
                  let text = 'text-foreground';

                  if (submitted) {
                    if (opt === q.correctAnswer) {
                      bg = 'bg-emerald-50 dark:bg-emerald-900/30';
                      border = 'border border-emerald-200 dark:border-emerald-700';
                      text = 'text-emerald-700 dark:text-emerald-200';
                    } else if (isSelected && opt !== q.correctAnswer) {
                      bg = 'bg-red-50 dark:bg-red-900/30';
                      border = 'border border-red-200 dark:border-red-700';
                      text = 'text-red-700 dark:text-red-200';
                    } else {
                      bg = 'bg-white dark:bg-slate-800';
                    }
                  } else if (isSelected) {
                    bg = 'bg-slate-50 dark:bg-slate-800';
                    border = 'border border-slate-200 dark:border-slate-700';
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleOptionClick(opt)}
                      onKeyDown={(e) => { if (!submitted && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleOptionClick(opt); } }}
                      disabled={submitted}
                      className={`text-left w-full rounded-lg shadow-sm p-3 ${bg} ${border} ${text} hover:scale-[1.01] transition-transform duration-150`}
                      aria-pressed={isSelected}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 truncate">{opt}</div>
                        {submitted && opt === q.correctAnswer && (
                          <div className="ml-3 text-sm font-semibold text-emerald-700">Correct</div>
                        )}
                        {submitted && isSelected && opt !== q.correctAnswer && (
                          <div className="ml-3 text-sm font-semibold text-red-600">Wrong</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={current === 0}
                    className="rounded-md px-3 py-2 text-sm bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    Previous
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {!submitted ? (
                    <button
                      onClick={handleSubmit}
                      disabled={selected === null}
                      className="rounded-md px-4 py-2 bg-journey-primary text-white hover:opacity-95 transition-opacity disabled:opacity-50"
                    >
                      Submit
                    </button>
                  ) : (
                    <>
                      {current < questions.length - 1 ? (
                        <button
                          onClick={handleNext}
                          className="rounded-md px-4 py-2 bg-journey-primary text-white hover:opacity-95 transition-opacity"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          onClick={() => setCurrent(questions.length)}
                          className="rounded-md px-4 py-2 bg-journey-primary text-white hover:opacity-95 transition-opacity"
                        >
                          Finish
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
            >
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Results</h2>
                <p className="text-muted-foreground">You scored</p>
                <div className="mt-4 mb-4">
                  <div className="text-4xl font-bold">{score} / {questions.length}</div>
                  <div className="text-lg text-muted-foreground">{percent}%</div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleRestart}
                    className="rounded-md px-4 py-2 bg-white dark:bg-slate-800 border hover:bg-slate-50 transition-colors"
                  >
                    Restart
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Quiz;
