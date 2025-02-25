import { type Plant, type InsertPlant } from "@shared/schema";

export interface IStorage {
  getPlants(): Promise<Plant[]>;
  getPlant(id: number): Promise<Plant | undefined>;
  createPlant(plant: InsertPlant): Promise<Plant>;
  updatePlant(id: number, plant: Partial<Plant>): Promise<Plant | undefined>;
  deletePlant(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private plants: Map<number, Plant>;
  private currentId: number;

  constructor() {
    this.plants = new Map();
    this.currentId = 1;
  }

  async getPlants(): Promise<Plant[]> {
    return Array.from(this.plants.values());
  }

  async getPlant(id: number): Promise<Plant | undefined> {
    return this.plants.get(id);
  }

  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    const id = this.currentId++;
    const plant: Plant = { ...insertPlant, id };
    this.plants.set(id, plant);
    return plant;
  }

  async updatePlant(id: number, update: Partial<Plant>): Promise<Plant | undefined> {
    const existing = this.plants.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...update };
    this.plants.set(id, updated);
    return updated;
  }

  async deletePlant(id: number): Promise<boolean> {
    return this.plants.delete(id);
  }
}

export const storage = new MemStorage();
