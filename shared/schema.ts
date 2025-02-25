import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  species: text("species").notNull(),
  image: text("image").notNull(),
  wateringFrequency: integer("watering_frequency").notNull(), // Days between watering
  lastWatered: timestamp("last_watered"),
  sunlightNeeds: text("sunlight_needs").notNull(),
  fertilizerFrequency: integer("fertilizer_frequency").notNull(), // Days between fertilizing
  lastFertilized: timestamp("last_fertilized"),
  notes: text("notes"),
});

export const insertPlantSchema = createInsertSchema(plants)
  .omit({ id: true })
  .extend({
    name: z.string().min(1, "Plant name is required"),
    species: z.string().min(1, "Species is required"),
    wateringFrequency: z.number().min(1, "Watering frequency must be at least 1 day"),
    fertilizerFrequency: z.number().min(1, "Fertilizer frequency must be at least 1 day"),
    sunlightNeeds: z.enum(["low", "medium", "high"], {
      required_error: "Sunlight needs are required",
    }),
  });

export type Plant = typeof plants.$inferSelect;
export type InsertPlant = z.infer<typeof insertPlantSchema>;

// Care guide data structure
export const careGuides = {
  low: {
    sunlight: "Place in low-light areas, avoid direct sun",
    water: "Water when top inch of soil is dry",
    fertilizer: "Feed with balanced fertilizer every 2-3 months",
  },
  medium: {
    sunlight: "Indirect sunlight or partial shade",
    water: "Water when top 1-2 inches of soil are dry",
    fertilizer: "Feed with balanced fertilizer every 6-8 weeks",
  },
  high: {
    sunlight: "Direct sunlight for at least 6 hours daily",
    water: "Water thoroughly when soil feels dry",
    fertilizer: "Feed with balanced fertilizer every 4-6 weeks",
  },
} as const;
