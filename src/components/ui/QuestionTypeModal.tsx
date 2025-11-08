import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle } from 'lucide-react';

interface QuestionTypeModalProps {
  children: React.ReactNode;
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  showAnswersImmediately: boolean;
  onShowAnswersChange: (show: boolean) => void;
  currentQuestion?: {
    hint?: string;
    focus?: string;
  };
}

const QuestionTypeModal: React.FC<QuestionTypeModalProps> = ({
  children,
  selectedTypes,
  onTypesChange,
  showAnswersImmediately,
  onShowAnswersChange,
  currentQuestion
}) => {
  const [open, setOpen] = useState(false);
  const [tempSelectedTypes, setTempSelectedTypes] = useState<string[]>(selectedTypes);
  const [tempShowAnswersImmediately, setTempShowAnswersImmediately] = useState<boolean>(showAnswersImmediately);

  const questionTypes = [
    {
      id: 'multiple_choice',
      name: 'Multiple Choice',
      description: 'Choose from multiple options'
    },
    {
      id: 'fill_in_blank',
      name: 'Fill in the Blank',
      description: 'Complete the missing information'
    },
    {
      id: 'short_answer',
      name: 'Short Answer',
      description: 'Provide a brief written response'
    }
  ];

  const handleTypeToggle = (typeId: string) => {
    setTempSelectedTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleApply = () => {
    onTypesChange(tempSelectedTypes);
    onShowAnswersChange(tempShowAnswersImmediately);
    setOpen(false);
  };

  const handleCancel = () => {
    setTempSelectedTypes(selectedTypes);
    setTempShowAnswersImmediately(showAnswersImmediately);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        
        <div className="space-y-6">
          {/* Answer Display Preferences */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Answer Display</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  tempShowAnswersImmediately 
                    ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800'
                }`}
                onClick={() => setTempShowAnswersImmediately(true)}
              >
                <div className="font-medium text-foreground">Show answers immediately</div>
                <p className="text-sm text-muted-foreground mt-1">See correct answers right after each question</p>
              </div>
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  !tempShowAnswersImmediately 
                    ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800'
                }`}
                onClick={() => setTempShowAnswersImmediately(false)}
              >
                <div className="font-medium text-foreground">Show results at the end</div>
                <p className="text-sm text-muted-foreground mt-1">Complete all questions before seeing results</p>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">Select Question Type</h3>
          </div>

          {/* Question Types Selection */}
          <div>
            <div className="grid gap-3">
              {questionTypes.map((type) => (
                <div
                  key={type.id}
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    tempSelectedTypes.includes(type.id)
                      ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => handleTypeToggle(type.id)}
                >
                  <Checkbox
                    checked={tempSelectedTypes.includes(type.id)}
                    onChange={() => handleTypeToggle(type.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{type.name}</div>
                    <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleApply} className="bg-blue-600 hover:bg-blue-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Apply Selection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionTypeModal;
