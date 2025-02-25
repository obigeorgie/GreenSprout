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
  const [identificationResults, setIdentificationResults] = useState<Record<string, number> | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleCapture = async (imageData: string) => {
    setShowCamera(false);
    setCapturedImage(imageData);
    setAnalyzing(true);

    try {
      const response = await fetch("/api/identify-plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        throw new Error("Failed to identify plant");
      }

      const results = await response.json();
      setIdentificationResults(results.data);

      toast({
        title: "Plant Identified!",
        description: "We've found potential matches in our database.",
      });
    } catch (error) {
      toast({
        title: "Identification Failed",
        description: "Unable to identify the plant. Please try again.",
        variant: "destructive",
      });
      setIdentificationResults(null);
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

      {identificationResults && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Identification Results</h2>
            <div className="space-y-2">
              {Object.entries(identificationResults)
                .sort(([, a], [, b]) => b - a)
                .map(([species, confidence]) => (
                  <div key={species} className="flex justify-between items-center">
                    <span>{species}</span>
                    <span className="text-muted-foreground">
                      {(confidence * 100).toFixed(1)}% match
                    </span>
                  </div>
                ))}
            </div>
            <Button
              className="w-full mt-4"
              onClick={() => navigate("/add")}
            >
              Add to My Plants
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}