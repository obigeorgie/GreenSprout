import { type Plant } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Droplets, Sun, Sprout } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

interface PlantCardProps {
  plant: Plant;
}

export default function PlantCard({ plant }: PlantCardProps) {
  return (
    <Link href={`/plant/${plant.id}`}>
      <a className="block">
        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="aspect-square relative">
            <img
              src={plant.image}
              alt={plant.name}
              className="object-cover w-full h-full"
            />
          </div>
          <CardHeader className="p-4">
            <h3 className="font-semibold text-lg">{plant.name}</h3>
            <p className="text-sm text-muted-foreground">{plant.species}</p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Droplets className="h-4 w-4 text-primary" />
                <span>{plant.wateringFrequency}d</span>
              </div>
              <div className="flex items-center gap-1">
                <Sun className="h-4 w-4 text-primary" />
                <span>{plant.sunlightNeeds}</span>
              </div>
              <div className="flex items-center gap-1">
                <Sprout className="h-4 w-4 text-primary" />
                <span>{plant.fertilizerFrequency}d</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </a>
    </Link>
  );
}