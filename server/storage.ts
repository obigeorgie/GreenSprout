import { plants, type Plant, type InsertPlant } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getPlants(): Promise<Plant[]>;
  getPlant(id: number): Promise<Plant | undefined>;
  createPlant(plant: InsertPlant): Promise<Plant>;
  updatePlant(id: number, plant: Partial<Plant>): Promise<Plant | undefined>;
  deletePlant(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getPlants(): Promise<Plant[]> {
    return await db.select().from(plants);
  }

  async getPlant(id: number): Promise<Plant | undefined> {
    const [plant] = await db.select().from(plants).where(eq(plants.id, id));
    return plant;
  }

  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    const [plant] = await db
      .insert(plants)
      .values({
        ...insertPlant,
        lastWatered: null,
        lastFertilized: null,
        notes: insertPlant.notes || null,
      })
      .returning();
    return plant;
  }

  async updatePlant(id: number, update: Partial<Plant>): Promise<Plant | undefined> {
    const [updated] = await db
      .update(plants)
      .set(update)
      .where(eq(plants.id, id))
      .returning();
    return updated;
  }

  async deletePlant(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(plants)
      .where(eq(plants.id, id))
      .returning();
    return !!deleted;
  }
}

export const storage = new DatabaseStorage();