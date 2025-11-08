import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';

interface HintModalProps {
  children: React.ReactNode;
  hint: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HintModal: React.FC<HintModalProps> = ({
  children,
  hint,
  open,
  onOpenChange
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Hint
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {hint}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HintModal;
