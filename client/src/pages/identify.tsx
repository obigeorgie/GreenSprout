import { useState } from "react";
import { useLocation } from "wouter";
import ARCamera from "@/components/ar-camera";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function IdentifyPlant() {
  const [showCamera, setShowCamera] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleCapture = async (imageData: string) => {
    setShowCamera(false);
    setCapturedImage(imageData);
    setAnalyzing(true);

    try {
      // TODO: Implement plant identification API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated delay
      
      toast({
        title: "Plant Identified!",
        description: "We've found a match in our database.",
      });
      
      // TODO: Navigate to add plant page with pre-filled data
      navigate("/add");
    } catch (error) {
      toast({
        title: "Identification Failed",
        description: "Unable to identify the plant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">Identify Plant</h1>

      {!showCamera && !analyzing && !capturedImage && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4 text-muted-foreground">
              Take a photo of your plant to identify it and get care instructions
            </p>
            <Button onClick={() => setShowCamera(true)}>
              <Camera className="mr-2 h-4 w-4" />
              Open Camera
            </Button>
          </CardContent>
        </Card>
      )}

      {showCamera && (
        <ARCamera
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {analyzing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured plant"
                  className="w-full rounded-lg"
                />
              )}
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Analyzing your plant...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
