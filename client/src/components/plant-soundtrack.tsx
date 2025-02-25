import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, Music } from "lucide-react";
import { plantSoundGenerator } from "@/lib/audio-generator";
import { type Plant } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface PlantSoundtrackProps {
  plant: Plant;
}

export default function PlantSoundtrack({ plant }: PlantSoundtrackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const togglePlayback = async () => {
    try {
      if (!isPlaying) {
        const params = plantSoundGenerator.generateParameters(plant);
        await plantSoundGenerator.generateMusic(params);
        plantSoundGenerator.play();
      } else {
        plantSoundGenerator.pause();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      toast({
        title: "Playback Error",
        description: "Failed to play plant soundtrack. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isPlaying) {
        plantSoundGenerator.pause();
      }
    };
  }, [isPlaying]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Plant Soundtrack</h3>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlayback}
          className="h-8 w-8"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span className="sr-only">
            {isPlaying ? "Pause soundtrack" : "Play soundtrack"}
          </span>
        </Button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Listen to a personalized ambient soundtrack based on your plant's characteristics and care needs.
      </p>
    </Card>
  );
}
