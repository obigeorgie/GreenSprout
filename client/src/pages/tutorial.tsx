import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { tutorialSteps } from "@/lib/mascot-animations";
import ARCamera from "@/components/ar-camera";

export default function Tutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showCamera, setShowCamera] = useState(false);

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

  const handleCameraCapture = (imageData: string) => {
    // Handle captured image data
    setShowCamera(false);
  };

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">Plant Care Tutorial</h1>

      <div className="relative">
        {showCamera ? (
          <ARCamera onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
        ) : (
          <Card className="p-6">
            <div className="flex items-center justify-center mb-8">
              <div className={`relative w-32 h-32 ${tutorialSteps[currentStep].animation === 'wave' ? 'animate-bounce' : ''}`}>
                {/* Simple 2D mascot using CSS */}
                <div className="absolute inset-0 bg-green-500 rounded-full" />
                <div className="absolute bottom-1/4 left-1/4 right-1/4 h-1/2 bg-green-600 rounded-full" />
                <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-white rounded-full" />
                <div className="absolute top-1/4 right-1/3 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>

            <div className="space-y-4 text-center">
              <h2 className="text-2xl font-semibold">{tutorialSteps[currentStep].title}</h2>
              <p className="text-muted-foreground">{tutorialSteps[currentStep].message}</p>

              {tutorialSteps[currentStep].id === 'identify' && (
                <Button onClick={() => setShowCamera(true)} className="mt-4">
                  Try Plant Identification
                </Button>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={nextStep}
                disabled={currentStep === tutorialSteps.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
