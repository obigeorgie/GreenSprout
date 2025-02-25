import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import type { Plant } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import CareSchedule from "@/components/care-schedule";
import { careGuides } from "@shared/schema";
import WeatherCare from "@/components/weather-care";
import GrowthTimeline from "@/components/growth-timeline";
import EcoRecommendations from "@/components/eco-recommendations";
import PlantSoundtrack from "@/components/plant-soundtrack";
import GrowthPrediction from "@/components/growth-prediction";

export default function PlantDetail() {
  const [match, params] = useRoute("/plant/:id");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: plant, isLoading } = useQuery<Plant>({
    queryKey: [`/api/plants/${params?.id}`],
  });

  if (isLoading) {
    return (
      <div className="py-8 space-y-4">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!plant) return null;

  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/plants/${plant.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      toast({
        title: "Success",
        description: "Plant has been deleted.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete plant.",
        variant: "destructive",
      });
    }
  };

  // Type assertion to ensure sunlightNeeds is a valid key
  const careGuide = careGuides[plant.sunlightNeeds as keyof typeof careGuides];

  return (
    <div className="py-8">
      <div className="aspect-[3/2] relative rounded-lg overflow-hidden mb-6">
        <img
          src={plant.image}
          alt={plant.name}
          className="object-cover w-full h-full"
        />
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{plant.name}</h1>
          {plant.speciesId && (
            <p className="text-muted-foreground">
              {plant.speciesId}
            </p>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Plant</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this plant? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">Plant Soundtrack</h2>
          <PlantSoundtrack plant={plant} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Growth Timeline</h2>
          <GrowthTimeline plantId={plant.id} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Growth Prediction</h2>
          <GrowthPrediction plant={plant} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Care Schedule</h2>
          <CareSchedule
            plant={plant}
            onUpdate={() =>
              queryClient.invalidateQueries({
                queryKey: [`/api/plants/${plant.id}`],
              })
            }
          />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Weather-Based Care</h2>
          <WeatherCare plant={plant} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Care Guide</h2>
          <div className="space-y-3">
            <p>
              <strong>Sunlight:</strong> {careGuide.sunlight}
            </p>
            <p>
              <strong>Water:</strong> {careGuide.water}
            </p>
            <p>
              <strong>Fertilizer:</strong> {careGuide.fertilizer}
            </p>
          </div>
        </section>

        <section>
          <EcoRecommendations plant={plant} />
        </section>

        {plant.notes && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            <p className="text-muted-foreground">{plant.notes}</p>
          </section>
        )}
      </div>
    </div>
  );
}