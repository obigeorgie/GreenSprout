import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type RescueMission } from "@shared/schema";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RescueMissions() {
  const [, navigate] = useLocation();
  
  const { data: missions = [], isLoading } = useQuery<RescueMission[]>({
    queryKey: ["/api/rescue-missions"],
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      default:
        return "text-green-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/4 mb-4" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Plant Rescue Missions</h1>
          <p className="text-muted-foreground mt-2">
            Help save plants in need and make a difference in your community
          </p>
        </div>
        <Button onClick={() => navigate("/rescue-missions/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Post Mission
        </Button>
      </div>

      <div className="space-y-4">
        {missions.map((mission) => (
          <Card
            key={mission.id}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate(`/rescue-missions/${mission.id}`)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(mission.status)}
                    <h2 className="text-xl font-semibold">{mission.title}</h2>
                  </div>
                  <p className="text-muted-foreground mb-4">{mission.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span>{mission.location}</span>
                    <span>Plant: {mission.plantType}</span>
                    <span>Volunteers: {mission.volunteerCount}</span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={getUrgencyColor(mission.urgency)}
                >
                  {mission.urgency} urgency
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}

        {missions.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>No rescue missions posted yet.</p>
              <p className="text-sm">Be the first to post a mission!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
