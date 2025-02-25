import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlantSchema, type InsertPlant } from "@shared/schema";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { PLANT_IMAGES } from "@/lib/plant-care-guides";

export default function AddPlant() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const form = useForm<InsertPlant>({
    resolver: zodResolver(insertPlantSchema),
    defaultValues: {
      wateringFrequency: 7,
      fertilizerFrequency: 30,
      sunlightNeeds: "medium",
      image: PLANT_IMAGES[Math.floor(Math.random() * PLANT_IMAGES.length)],
    },
  });

  const onSubmit = async (data: InsertPlant) => {
    try {
      await apiRequest("POST", "/api/plants", data);
      toast({
        title: "Success!",
        description: "Plant has been added to your collection.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add plant.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">Add New Plant</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Plant Name</label>
              <Input {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Species</label>
              <Input {...form.register("species")} />
              {form.formState.errors.species && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.species.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Watering Frequency (days)</label>
              <Input
                type="number"
                {...form.register("wateringFrequency", { valueAsNumber: true })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Fertilizer Frequency (days)</label>
              <Input
                type="number"
                {...form.register("fertilizerFrequency", { valueAsNumber: true })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Sunlight Needs</label>
              <Select
                onValueChange={(value) =>
                  form.setValue("sunlightNeeds", value as "low" | "medium" | "high")
                }
                defaultValue={form.getValues("sunlightNeeds")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sunlight needs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea {...form.register("notes")} />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            Add Plant
          </Button>
        </form>
      </Form>
    </div>
  );
}
