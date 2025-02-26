import { useQuery, useMutation } from "@tanstack/react-query";
import { type GrowthTimeline, type InsertGrowthTimeline } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { insertGrowthTimelineSchema } from "@shared/schema";
import ARCamera from "@/components/ar-camera";
import { Camera } from "lucide-react";
import ShareMilestone from "@/components/share-milestone";

interface GrowthTimelineProps {
  plantId: number;
  plantName: string; // Add this prop for sharing
}

const milestoneTypes = [
  { value: "new_leaf", label: "New Leaf", emoji: "🌱" },
  { value: "flowering", label: "Flowering", emoji: "🌺" },
  { value: "repotted", label: "Repotted", emoji: "🪴" },
  { value: "height_milestone", label: "Height Milestone", emoji: "📏" },
  { value: "other", label: "Other", emoji: "✨" },
];

export default function GrowthTimeline({ plantId, plantName }: GrowthTimelineProps) {
  const { toast } = useToast();
  const [showCamera, setShowCamera] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: timeline, isLoading } = useQuery<GrowthTimeline[]>({
    queryKey: [`/api/plants/${plantId}/timeline`],
  });

  const form = useForm<InsertGrowthTimeline>({
    resolver: zodResolver(insertGrowthTimelineSchema),
    defaultValues: {
      plantId,
      milestone: false,
    },
  });

  const addEntry = useMutation({
    mutationFn: async (data: InsertGrowthTimeline) => {
      await apiRequest("POST", `/api/plants/${plantId}/timeline`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/plants/${plantId}/timeline`] });
      form.reset();
      setSelectedImage(null);
      toast({
        title: "Success!",
        description: "Growth timeline entry added.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add timeline entry.",
        variant: "destructive",
      });
    },
  });

  const handleImageCapture = (imageData: string) => {
    setSelectedImage(imageData);
    setShowCamera(false);
    form.setValue("image", imageData);
  };

  const onSubmit = (data: InsertGrowthTimeline) => {
    if (data.milestone && !data.milestoneType) {
      toast({
        title: "Error",
        description: "Please select a milestone type.",
        variant: "destructive",
      });
      return;
    }

    addEntry.mutate({
      ...data,
      celebrationEmoji: data.milestone
        ? milestoneTypes.find((t) => t.value === data.milestoneType)?.emoji
        : undefined,
    });
  };

  if (isLoading) {
    return <div>Loading timeline...</div>;
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea {...form.register("description")} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Height (cm)</label>
            <Input
              type="number"
              {...form.register("height", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...form.register("milestone")}
                className="rounded border-gray-300"
              />
              <label className="text-sm font-medium">Mark as milestone</label>
            </div>

            {form.watch("milestone") && (
              <Select
                onValueChange={(value) =>
                  form.setValue("milestoneType", value as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select milestone type" />
                </SelectTrigger>
                <SelectContent>
                  {milestoneTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        {type.emoji} {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Photo</label>
            {selectedImage ? (
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Timeline entry"
                  className="w-full rounded-lg"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedImage(null);
                    form.setValue("image", undefined);
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowCamera(true)}
              >
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={addEntry.isPending}
          >
            Add Timeline Entry
          </Button>
        </form>
      </Form>

      {showCamera && (
        <ARCamera
          onCapture={handleImageCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div className="space-y-4">
        {timeline?.map((entry) => (
          <div
            key={entry.id}
            className={`p-4 border rounded-lg ${
              entry.milestone ? "bg-primary/5" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(entry.entryDate), "MMM d, yyyy")}
                  </span>
                  {entry.milestone && entry.celebrationEmoji && (
                    <span className="text-lg">{entry.celebrationEmoji}</span>
                  )}
                </div>
                <p className="mt-1">{entry.description}</p>
                {entry.height && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Height: {entry.height}cm
                  </p>
                )}
              </div>
              {entry.milestone && (
                <ShareMilestone milestone={entry} plantName={plantName} />
              )}
            </div>
            {entry.image && (
              <img
                src={entry.image}
                alt="Timeline entry"
                className="w-full mt-4 rounded-lg"
              />
            )}
          </div>
        ))}

        {timeline?.length === 0 && (
          <p className="text-center text-muted-foreground">
            No timeline entries yet. Add your first entry above!
          </p>
        )}
      </div>
    </div>
  );
}