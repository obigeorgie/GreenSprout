import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Plant species database table
export const plantSpecies = pgTable("plant_species", {
  id: serial("id").primaryKey(),
  commonName: text("common_name").notNull(),
  scientificName: text("scientific_name").notNull(),
  description: text("description").notNull(),
  careInstructions: text("care_instructions").notNull(),
  wateringInstructions: text("watering_instructions").notNull(),
  sunlightRequirements: text("sunlight_requirements").notNull(),
  soilRequirements: text("soil_requirements").notNull(),
  idealTemperature: text("ideal_temperature").notNull(),
  idealHumidity: text("ideal_humidity").notNull(),
  growthHabit: text("growth_habit").notNull(),
  toxicity: text("toxicity").notNull(),
  image: text("image").notNull(),
}, (table) => {
  return {
    scientificNameIdx: uniqueIndex("scientific_name_idx").on(table.scientificName),
  }
});

// Modify existing plants table to reference plant species
export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  speciesId: integer("species_id").references(() => plantSpecies.id),
  image: text("image").notNull(),
  wateringFrequency: integer("watering_frequency").notNull(),
  lastWatered: timestamp("last_watered"),
  sunlightNeeds: text("sunlight_needs").notNull(),
  fertilizerFrequency: integer("fertilizer_frequency").notNull(),
  lastFertilized: timestamp("last_fertilized"),
  notes: text("notes"),
  acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
});

// New growth timeline entries table
export const growthTimeline = pgTable("growth_timeline", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  entryDate: timestamp("entry_date").defaultNow().notNull(),
  description: text("description").notNull(),
  image: text("image"),
  height: integer("height"), // in centimeters
  milestone: boolean("milestone").default(false).notNull(),
  milestoneType: text("milestone_type"), // e.g., "new_leaf", "flowering", "repotted"
  celebrationEmoji: text("celebration_emoji"), // e.g., "🌱", "🌺", "🎉"
});

// Define relations
export const plantsRelations = relations(plants, ({ one, many }) => ({
  species: one(plantSpecies, {
    fields: [plants.speciesId],
    references: [plantSpecies.id],
  }),
  timeline: many(growthTimeline),
  recommendedProducts: many(ecoProducts), // Added relation for eco-products
}));

export const plantSpeciesRelations = relations(plantSpecies, ({ many }) => ({
  plants: many(plants),
}));

export const growthTimelineRelations = relations(growthTimeline, ({ one }) => ({
  plant: one(plants, {
    fields: [growthTimeline.plantId],
    references: [plants.id],
  }),
}));

// Add eco-friendly products table and types
export const ecoProducts = pgTable("eco_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // e.g., "fertilizer", "soil", "tools"
  sustainabilityFeatures: text("sustainability_features").notNull(),
  price: text("price").notNull(),
  imageUrl: text("image_url").notNull(),
  purchaseUrl: text("purchase_url").notNull(),
  carbonFootprint: text("carbon_footprint"), // Optional carbon footprint rating
});


// Schema for inserting growth timeline entries
export const insertGrowthTimelineSchema = createInsertSchema(growthTimeline)
  .omit({ id: true })
  .extend({
    description: z.string().min(1, "Description is required"),
    height: z.number().min(1).optional(),
    milestone: z.boolean().default(false),
    milestoneType: z.enum([
      "new_leaf",
      "flowering",
      "repotted",
      "height_milestone",
      "other"
    ]).optional(),
    celebrationEmoji: z.string().optional(),
  });

// Schema for inserting new plant species
export const insertPlantSpeciesSchema = createInsertSchema(plantSpecies)
  .omit({ id: true });

// Schema for inserting plants (updated)
export const insertPlantSchema = createInsertSchema(plants)
  .omit({ id: true, acquiredAt: true })
  .extend({
    name: z.string().min(1, "Plant name is required"),
    speciesId: z.number().optional(),
    wateringFrequency: z.number().min(1, "Watering frequency must be at least 1 day"),
    fertilizerFrequency: z.number().min(1, "Fertilizer frequency must be at least 1 day"),
    sunlightNeeds: z.enum(["low", "medium", "high"], {
      required_error: "Sunlight needs are required",
    }),
  });

// Schema for inserting eco-friendly products
export const insertEcoProductSchema = createInsertSchema(ecoProducts)
  .omit({ id: true });

// Types
export type PlantSpecies = typeof plantSpecies.$inferSelect;
export type InsertPlantSpecies = z.infer<typeof insertPlantSpeciesSchema>;
export type Plant = typeof plants.$inferSelect;
export type InsertPlant = z.infer<typeof insertPlantSchema>;
export type GrowthTimeline = typeof growthTimeline.$inferSelect;
export type InsertGrowthTimeline = z.infer<typeof insertGrowthTimelineSchema>;
export type EcoProduct = typeof ecoProducts.$inferSelect;
export type InsertEcoProduct = z.infer<typeof insertEcoProductSchema>;

// Care guide data structure (keep existing)
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