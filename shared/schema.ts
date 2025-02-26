import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
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
  recommendedProducts: many(ecoProducts),
  swapListings: many(swapListings),
  soundtracks: many(plantSoundtracks),
  predictions: many(growthPredictions),
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


// Plant swap marketplace tables
export const swapListings = pgTable("swap_listings", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  contactPreference: text("contact_preference").notNull(), // "email" or "in_app"
  swapPreferences: text("swap_preferences").notNull(),
  status: text("status").default("available").notNull(), // "available", "pending", "completed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add new relations
export const swapListingsRelations = relations(swapListings, ({ one }) => ({
  plant: one(plants, {
    fields: [swapListings.plantId],
    references: [plants.id],
  }),
}));

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

// Add schema for creating swap listings
export const insertSwapListingSchema = createInsertSchema(swapListings)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    location: z.string().min(1, "Location is required"),
    contactPreference: z.enum(["email", "in_app"]),
    swapPreferences: z.string().min(1, "Swap preferences are required"),
  });

// Types
export type PlantSpecies = typeof plantSpecies.$inferSelect;
export type InsertPlantSpecies = z.infer<typeof insertPlantSpeciesSchema>;
export type Plant = typeof plants.$inferSelect;
export type InsertPlant = z.infer<typeof insertPlantSchema>;
export type GrowthTimeline = typeof growthTimeline.$inferSelect;
export type InsertGrowthTimeline = z.infer<typeof insertGrowthTimelineSchema>;
export type EcoProduct = typeof ecoProducts.$inferSelect;
export type InsertEcoProduct = z.infer<typeof insertEcoProductSchema>;
export type SwapListing = typeof swapListings.$inferSelect;
export type InsertSwapListing = z.infer<typeof insertSwapListingSchema>;

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

// Add chat message types to existing schema.ts

// Define valid assistant action types
export const AssistantActionType = {
  VIEW_PLANT: "view_plant",
  ADD_PLANT: "add_plant",
  UPDATE_CARE: "update_care",
  IDENTIFY_PLANT: "identify_plant",
  VIEW_MARKETPLACE: "view_marketplace",
  CREATE_SWAP: "create_swap",
  SHOW_RECOMMENDATIONS: "show_recommendations",
} as const;

// Add to the existing chatMessages table definition
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(), // "user" or "assistant"
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata"), // For storing additional message context
  // Add new fields for multimodal support
  imageUrl: text("image_url"),
  actionType: text("action_type"), // One of AssistantActionType
  actionPayload: jsonb("action_payload"), // Data needed for the action
});

// Update the insert schema
export const insertChatMessageSchema = createInsertSchema(chatMessages)
  .omit({ id: true, timestamp: true })
  .extend({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1, "Message cannot be empty"),
    metadata: z.record(z.unknown()).optional(),
    imageUrl: z.string().optional(),
    actionType: z.enum(Object.values(AssistantActionType) as [string, ...string[]]).optional(),
    actionPayload: z.record(z.unknown()).optional(),
  });

// Add types
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type AssistantAction = typeof AssistantActionType[keyof typeof AssistantActionType];

// Plant soundtrack preferences and history
export const plantSoundtracks = pgTable("plant_soundtracks", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  bpm: integer("bpm").notNull(), // Tempo based on watering frequency
  key: text("key").notNull(), // Musical key
  mood: text("mood").notNull(), // Based on plant characteristics
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  duration: integer("duration").notNull(), // Length in seconds
});

// Add types
export type PlantSoundtrack = typeof plantSoundtracks.$inferSelect;
export type InsertPlantSoundtrack = typeof plantSoundtracks.$inferInsert;

// Growth prediction types and schemas
export const growthPredictions = pgTable("growth_predictions", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  predictedHeight: integer("predicted_height").notNull(), // in centimeters
  predictedLeafCount: integer("predicted_leaf_count").notNull(),
  predictedDate: timestamp("predicted_date").notNull(),
  confidence: integer("confidence").notNull(), // 0-100
  factors: jsonb("factors").notNull(), // Environmental factors considered
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export const insertGrowthPredictionSchema = createInsertSchema(growthPredictions)
  .omit({ id: true, generatedAt: true });

export type GrowthPrediction = typeof growthPredictions.$inferSelect;
export type InsertGrowthPrediction = z.infer<typeof insertGrowthPredictionSchema>;

// Add rescue mission types and schemas
export const rescueMissions = pgTable("rescue_missions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  urgency: text("urgency").notNull(), // "low", "medium", "high"
  plantType: text("plant_type").notNull(),
  image: text("image"),
  status: text("status").default("active").notNull(), // "active", "in_progress", "completed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  volunteerCount: integer("volunteer_count").default(0).notNull(),
});

// Add rescue response tracking
export const rescueResponses = pgTable("rescue_responses", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id").references(() => rescueMissions.id).notNull(),
  comment: text("comment").notNull(),
  status: text("status").notNull(), // "volunteered", "completed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Add schema validation
export const insertRescueMissionSchema = createInsertSchema(rescueMissions)
  .omit({ id: true, createdAt: true, updatedAt: true, volunteerCount: true })
  .extend({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    location: z.string().min(1, "Location is required"),
    urgency: z.enum(["low", "medium", "high"]),
    plantType: z.string().min(1, "Plant type is required"),
    image: z.string().optional(),
  });

export const insertRescueResponseSchema = createInsertSchema(rescueResponses)
  .omit({ id: true, createdAt: true })
  .extend({
    comment: z.string().min(1, "Comment is required"),
    status: z.enum(["volunteered", "completed"]),
  });

// Add types
export type RescueMission = typeof rescueMissions.$inferSelect;
export type InsertRescueMission = z.infer<typeof insertRescueMissionSchema>;
export type RescueResponse = typeof rescueResponses.$inferSelect;
export type InsertRescueResponse = z.infer<typeof insertRescueResponseSchema>;