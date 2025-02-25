import { useQuery } from "@tanstack/react-query";
import type { Plant } from "@shared/schema";
import PlantCard from "@/components/plant-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: plants, isLoading } = useQuery<Plant[]>({
    queryKey: ["/api/plants"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-[200px] w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">My Plants</h1>
      {plants?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No plants added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {plants?.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      )}
    </div>
  );
}
