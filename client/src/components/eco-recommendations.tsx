import { useQuery } from "@tanstack/react-query";
import { type Plant, type EcoProduct } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";

interface EcoRecommendationsProps {
  plant: Plant;
}

export default function EcoRecommendations({ plant }: EcoRecommendationsProps) {
  const { data: recommendations, isLoading } = useQuery<EcoProduct[]>({
    queryKey: [`/api/plants/${plant.id}/recommendations`],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="space-y-3">
              <div className="h-20 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations?.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <Leaf className="h-5 w-5 text-primary" />
        Eco-Friendly Recommendations
      </h3>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {recommendations.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="aspect-square relative mb-4">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="rounded-lg object-cover w-full h-full"
                />
              </div>
              <h4 className="font-semibold">{product.name}</h4>
              <p className="text-sm text-muted-foreground mb-2">
                {product.description}
              </p>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Sustainability:</span>{" "}
                  {product.sustainabilityFeatures}
                </div>
                {product.carbonFootprint && (
                  <div className="text-sm">
                    <span className="font-medium">Carbon Footprint:</span>{" "}
                    {product.carbonFootprint}
                  </div>
                )}
                <div className="text-sm font-medium">{product.price}</div>
              </div>
              <Button
                className="w-full mt-4"
                variant="outline"
                onClick={() => window.open(product.purchaseUrl, "_blank")}
              >
                View Product
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
