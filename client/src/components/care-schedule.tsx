import { type Plant } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Droplets, Sun, Sprout } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface CareScheduleProps {
  plant: Plant;
  onUpdate: () => void;
}

export default function CareSchedule({ plant, onUpdate }: CareScheduleProps) {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);

  const handleWater = async () => {
    try {
      setUpdating(true);
      await apiRequest("PATCH", `/api/plants/${plant.id}`, {
        lastWatered: new Date(),
      });
      onUpdate();
      toast({
        title: "Plant watered!",
        description: "Watering schedule has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update watering schedule.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleFertilize = async () => {
    try {
      setUpdating(true);
      await apiRequest("PATCH", `/api/plants/${plant.id}`, {
        lastFertilized: new Date(),
      });
      onUpdate();
      toast({
        title: "Plant fertilized!",
        description: "Fertilizer schedule has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update fertilizer schedule.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Water</p>
            <p className="text-sm text-muted-foreground">
              {plant.lastWatered
                ? `Last watered: ${format(new Date(plant.lastWatered), "MMM d")}`
                : "Not watered yet"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleWater}
          disabled={updating}
        >
          Water Now
        </Button>
      </div>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Sprout className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Fertilize</p>
            <p className="text-sm text-muted-foreground">
              {plant.lastFertilized
                ? `Last fertilized: ${format(
                    new Date(plant.lastFertilized),
                    "MMM d",
                  )}`
                : "Not fertilized yet"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFertilize}
          disabled={updating}
        >
          Fertilize Now
        </Button>
      </div>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Sunlight</p>
            <p className="text-sm text-muted-foreground">
              {plant.sunlightNeeds} light needed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}