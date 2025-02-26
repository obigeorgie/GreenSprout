import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import ARCamera from "@/components/ar-camera";

interface HealthIssue {
  issue: string;
  confidence: number;
  recommendations: string[];
}

export default function PlantHealthScan() {
  const [showCamera, setShowCamera] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [healthReport, setHealthReport] = useState<HealthIssue[] | null>(null);
  const { toast } = useToast();

  const handleCapture = async (imageData: string) => {
    setShowCamera(false);
    setCapturedImage(imageData);
    setAnalyzing(true);

    try {
      const response = await fetch("/api/diagnose-plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze plant health");
      }

      const data = await response.json();
      setHealthReport(data.issues);

      toast({
        title: "Analysis Complete",
        description: "We've analyzed your plant's health condition.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze plant health. Please try again.",
        variant: "destructive",
      });
      setHealthReport(null);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">Plant Health Scan</h1>

      {!showCamera && !analyzing && !capturedImage && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4 text-muted-foreground">
              Take a photo of your plant to analyze its health and get care recommendations
            </p>
            <Button onClick={() => setShowCamera(true)}>
              <Camera className="mr-2 h-4 w-4" />
              Start Health Scan
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
                Analyzing plant health...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {healthReport && (
        <div className="space-y-4 mt-6">
          {healthReport.map((issue, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{issue.issue}</h3>
                  <span className="text-sm text-muted-foreground">
                    {(issue.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <ul className="list-disc list-inside space-y-2">
                  {issue.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-muted-foreground">
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}