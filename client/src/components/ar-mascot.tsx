import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { mascotAnimations, tutorialSteps } from '@/lib/mascot-animations';

export default function ARMascot() {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentAnimation, setCurrentAnimation] = useState('idle');

  useEffect(() => {
    setCurrentAnimation(tutorialSteps[currentStep].animation);
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="relative">
      {/* Simple 2D mascot using CSS */}
      <div className="flex items-center justify-center mb-8">
        <div 
          className={`relative w-32 h-32 transition-transform duration-1000`}
          style={{ transform: mascotAnimations[currentAnimation].transform }}
        >
          <div className="absolute inset-0 bg-green-500 rounded-full" />
          <div className="absolute bottom-1/4 left-1/4 right-1/4 h-1/2 bg-green-600 rounded-full" />
          <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-white rounded-full" />
          <div className="absolute top-1/4 right-1/3 w-4 h-4 bg-white rounded-full" />
        </div>
      </div>

      <Card className="p-4 bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">
            {tutorialSteps[currentStep].title}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextStep}
              disabled={currentStep === tutorialSteps.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          {tutorialSteps[currentStep].message}
        </p>
      </Card>
    </div>
  );
}