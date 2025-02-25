import { plants, plantSpecies, type Plant, type InsertPlant, type PlantSpecies } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  getPlants(): Promise<Plant[]>;
  getPlant(id: number): Promise<Plant | undefined>;
  createPlant(plant: InsertPlant): Promise<Plant>;
  updatePlant(id: number, plant: Partial<Plant>): Promise<Plant | undefined>;
  deletePlant(id: number): Promise<boolean>;
  getPlantSpecies(): Promise<PlantSpecies[]>;
  getPlantSpecies(id: number): Promise<PlantSpecies | undefined>;
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
}

export const storage = new DatabaseStorage();