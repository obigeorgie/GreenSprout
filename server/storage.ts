import { plants, plantSpecies, growthTimeline, type Plant, type InsertPlant, type PlantSpecies, type GrowthTimeline, type InsertGrowthTimeline } from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, or, and, lt } from "drizzle-orm";
import { ecoProducts, type EcoProduct } from "@shared/schema"; // Import ecoProducts


export interface IStorage {
  getPlants(): Promise<Plant[]>;
  getPlant(id: number): Promise<Plant | undefined>;
  createPlant(plant: InsertPlant): Promise<Plant>;
  updatePlant(id: number, plant: Partial<Plant>): Promise<Plant | undefined>;
  deletePlant(id: number): Promise<boolean>;
  getPlantSpecies(): Promise<PlantSpecies[]>;
  getPlantSpecies(id: number): Promise<PlantSpecies | undefined>;
  // New timeline methods
  getGrowthTimeline(plantId: number): Promise<GrowthTimeline[]>;
  addGrowthTimelineEntry(entry: InsertGrowthTimeline): Promise<GrowthTimeline>;
  // Eco-friendly product methods
  getEcoProducts(): Promise<EcoProduct[]>;
  getEcoProductsByCategory(category: string): Promise<EcoProduct[]>;
  getRecommendedProducts(plant: Plant): Promise<EcoProduct[]>;
}

export class DatabaseStorage implements IStorage {
  async getPlants(): Promise<Plant[]> {
    console.log("Fetching all plants");
    const result = await db.select().from(plants);
    console.log("Fetched plants:", result);
    return result;
  }

  async getPlant(id: number): Promise<Plant | undefined> {
    console.log(`Fetching plant with id: ${id}`);
    const [plant] = await db.select().from(plants).where(eq(plants.id, id));
    console.log("Fetched plant:", plant);
    return plant;
  }

  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    console.log("Creating plant with data:", insertPlant);
    const [plant] = await db
      .insert(plants)
      .values({
        ...insertPlant,
        lastWatered: null,
        lastFertilized: null,
        notes: insertPlant.notes || null,
      })
      .returning();
    console.log("Created plant:", plant);
    return plant;
  }

  async updatePlant(id: number, update: Partial<Plant>): Promise<Plant | undefined> {
    console.log(`Updating plant ${id} with data:`, update);
    const [updated] = await db
      .update(plants)
      .set(update)
      .where(eq(plants.id, id))
      .returning();
    console.log("Updated plant:", updated);
    return updated;
  }

  async deletePlant(id: number): Promise<boolean> {
    console.log(`Deleting plant with id: ${id}`);
    const [deleted] = await db
      .delete(plants)
      .where(eq(plants.id, id))
      .returning();
    console.log("Delete result:", !!deleted);
    return !!deleted;
  }

  async getPlantSpecies(): Promise<PlantSpecies[]> {
    console.log("Fetching all plant species");
    const result = await db.select().from(plantSpecies);
    console.log("Fetched plant species:", result);
    return result;
  }

  async getPlantSpecies(id: number): Promise<PlantSpecies | undefined> {
    console.log(`Fetching plant species with id: ${id}`);
    const [species] = await db.select().from(plantSpecies).where(eq(plantSpecies.id, id));
    console.log("Fetched plant species:", species);
    return species;
  }

  async getGrowthTimeline(plantId: number): Promise<GrowthTimeline[]> {
    console.log(`Fetching growth timeline for plant ${plantId}`);
    const entries = await db
      .select()
      .from(growthTimeline)
      .where(eq(growthTimeline.plantId, plantId))
      .orderBy(desc(growthTimeline.entryDate));
    console.log("Fetched timeline entries:", entries);
    return entries;
  }

  async addGrowthTimelineEntry(entry: InsertGrowthTimeline): Promise<GrowthTimeline> {
    console.log("Adding growth timeline entry:", entry);
    const [timelineEntry] = await db
      .insert(growthTimeline)
      .values(entry)
      .returning();
    console.log("Added timeline entry:", timelineEntry);
    return timelineEntry;
  }

  async getEcoProducts(): Promise<EcoProduct[]> {
    console.log("Fetching all eco-friendly products");
    const products = await db.select().from(ecoProducts);
    console.log("Fetched eco-friendly products:", products);
    return products;
  }

  async getEcoProductsByCategory(category: string): Promise<EcoProduct[]> {
    console.log(`Fetching eco-friendly products for category: ${category}`);
    const products = await db
      .select()
      .from(ecoProducts)
      .where(eq(ecoProducts.category, category));
    console.log("Fetched category products:", products);
    return products;
  }

  async getRecommendedProducts(plant: Plant): Promise<EcoProduct[]> {
    console.log(`Getting product recommendations for plant: ${plant.name}`);

    // Get products based on plant needs
    const recommendations = await db
      .select()
      .from(ecoProducts)
      .where(
        or(
          // If plant needs frequent watering, recommend water-saving products
          and(
            eq(ecoProducts.category, "watering"),
            lt(plant.wateringFrequency, 7)
          ),
          // If plant needs lots of fertilizer, recommend organic options
          and(
            eq(ecoProducts.category, "fertilizer"),
            lt(plant.fertilizerFrequency, 30)
          ),
          // Always include eco-friendly soil options
          eq(ecoProducts.category, "soil")
        )
      );

    console.log("Found recommendations:", recommendations);
    return recommendations;
  }
}

export const storage = new DatabaseStorage();