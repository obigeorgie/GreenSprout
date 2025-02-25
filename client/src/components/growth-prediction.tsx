import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Plant, type GrowthPrediction } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Wand2 } from "lucide-react";

interface GrowthPredictionProps {
  plant: Plant;
}

export default function GrowthPrediction({ plant }: GrowthPredictionProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: predictions = [], isLoading } = useQuery<GrowthPrediction[]>({
    queryKey: [`/api/plants/${plant.id}/growth-predictions`],
  });

  const handleGeneratePrediction = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/plants/${plant.id}/generate-prediction`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to generate prediction");
      }

      await response.json();
      toast({
        title: "Prediction Generated",
        description: "New growth prediction has been generated for your plant.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate growth prediction.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="h-[300px] bg-muted animate-pulse rounded-lg" />
      </Card>
    );
  }

  const chartData = predictions.map((pred) => ({
    date: new Date(pred.predictedDate).toLocaleDateString(),
    height: pred.predictedHeight,
    leaves: pred.predictedLeafCount,
    confidence: pred.confidence,
  }));

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Growth Prediction</h3>
        <Button
          onClick={handleGeneratePrediction}
          disabled={isGenerating}
          size="sm"
        >
          <Wand2 className="h-4 w-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate Prediction"}
        </Button>
      </div>

      {chartData.length > 0 ? (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="height"
                stroke="#2563eb"
                name="Height (cm)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="leaves"
                stroke="#16a34a"
                name="Leaf Count"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>No predictions available yet.</p>
          <p className="text-sm">Generate a prediction to see growth projections.</p>
        </div>
      )}
    </Card>
  );
}
