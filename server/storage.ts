import { plants, plantSpecies, growthTimeline, type Plant, type InsertPlant, type PlantSpecies, type GrowthTimeline, type InsertGrowthTimeline } from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, or, and, lt } from "drizzle-orm";
import { ecoProducts, type EcoProduct } from "@shared/schema";
import { swapListings, type SwapListing, type InsertSwapListing } from "@shared/schema";
import { chatMessages, type ChatMessage, type InsertChatMessage } from "@shared/schema";
import { growthPredictions, type GrowthPrediction, type InsertGrowthPrediction } from "@shared/schema"; // Import the new schema
import { rescueMissions, type RescueMission, type InsertRescueMission } from "@shared/schema";
import { rescueResponses, type RescueResponse, type InsertRescueResponse } from "@shared/schema";

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
  // Swap listing methods
  getSwapListings(): Promise<SwapListing[]>;
  getSwapListing(id: number): Promise<SwapListing | undefined>;
  createSwapListing(listing: InsertSwapListing): Promise<SwapListing>;
  updateSwapListing(id: number, listing: Partial<SwapListing>): Promise<SwapListing | undefined>;
  deleteSwapListing(id: number): Promise<boolean>;
  // Chat message methods
  getChatMessages(): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  // Growth prediction methods
  getGrowthPredictions(plantId: number): Promise<GrowthPrediction[]>;
  createGrowthPrediction(prediction: InsertGrowthPrediction): Promise<GrowthPrediction>;
  // Rescue mission methods
  getRescueMissions(): Promise<RescueMission[]>;
  getRescueMission(id: number): Promise<RescueMission | undefined>;
  createRescueMission(mission: InsertRescueMission): Promise<RescueMission>;
  updateRescueMission(id: number, update: Partial<RescueMission>): Promise<RescueMission | undefined>;
  getRescueResponses(missionId: number): Promise<RescueResponse[]>;
  createRescueResponse(response: InsertRescueResponse): Promise<RescueResponse>;
}

export class DatabaseStorage implements IStorage {
  async getPlants(): Promise<Plant[]> {
    try {
      console.log("Fetching all plants");
      const result = await db.select().from(plants);
      console.log("Fetched plants:", result);
      return result;
    } catch (error) {
      console.error("Error fetching plants:", error);
      throw new Error("Failed to fetch plants");
    }
  }

  async getPlant(id: number): Promise<Plant | undefined> {
    try {
      console.log(`Fetching plant with id: ${id}`);
      const [plant] = await db.select().from(plants).where(eq(plants.id, id));
      console.log("Fetched plant:", plant);
      return plant;
    } catch (error) {
      console.error(`Error fetching plant ${id}:`, error);
      throw new Error("Failed to fetch plant");
    }
  }

  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    try {
      console.log("Creating plant with data:", insertPlant);
      const [plant] = await db
        .insert(plants)
        .values({
          ...insertPlant,
          lastWatered: insertPlant.lastWatered || null,
          lastFertilized: insertPlant.lastFertilized || null,
          notes: insertPlant.notes || null,
          createdAt: new Date().toISOString(), // Ensure consistent date format
        })
        .returning();
      console.log("Created plant:", plant);
      return plant;
    } catch (error) {
      console.error("Error creating plant:", error);
      throw new Error("Failed to create plant");
    }
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
    try {
      console.log(`Deleting plant with id: ${id}`);
      // Start a transaction to handle related records
      const success = await db.transaction(async (tx) => {
        // Delete related timeline entries first
        await tx.delete(growthTimeline)
          .where(eq(growthTimeline.plantId, id));

        // Delete related predictions
        await tx.delete(growthPredictions)
          .where(eq(growthPredictions.plantId, id));

        // Finally delete the plant
        const [deleted] = await tx.delete(plants)
          .where(eq(plants.id, id))
          .returning();

        return !!deleted;
      });

      console.log("Delete success:", success);
      return success;
    } catch (error) {
      console.error(`Error deleting plant ${id}:`, error);
      throw new Error("Failed to delete plant");
    }
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
    try {
      console.log("Adding growth timeline entry:", entry);
      // Ensure the plant exists before adding timeline entry
      const plant = await this.getPlant(entry.plantId);
      if (!plant) {
        throw new Error(`Plant ${entry.plantId} not found`);
      }

      const [timelineEntry] = await db
        .insert(growthTimeline)
        .values({
          ...entry,
          entryDate: new Date(entry.entryDate).toISOString(), // Normalize date format
          createdAt: new Date().toISOString(),
        })
        .returning();

      console.log("Added timeline entry:", timelineEntry);
      return timelineEntry;
    } catch (error) {
      console.error("Error adding timeline entry:", error);
      throw new Error("Failed to add timeline entry");
    }
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

  async getSwapListings(): Promise<SwapListing[]> {
    console.log("Fetching all swap listings");
    const listings = await db
      .select()
      .from(swapListings)
      .orderBy(desc(swapListings.createdAt));
    console.log("Fetched swap listings:", listings);
    return listings;
  }

  async getSwapListing(id: number): Promise<SwapListing | undefined> {
    console.log(`Fetching swap listing with id: ${id}`);
    const [listing] = await db
      .select()
      .from(swapListings)
      .where(eq(swapListings.id, id));
    console.log("Fetched swap listing:", listing);
    return listing;
  }

  async createSwapListing(listing: InsertSwapListing): Promise<SwapListing> {
    console.log("Creating swap listing:", listing);
    const [newListing] = await db
      .insert(swapListings)
      .values({
        ...listing,
        status: "available",
      })
      .returning();
    console.log("Created swap listing:", newListing);
    return newListing;
  }

  async updateSwapListing(
    id: number,
    update: Partial<SwapListing>
  ): Promise<SwapListing | undefined> {
    console.log(`Updating swap listing ${id} with:`, update);
    const [updated] = await db
      .update(swapListings)
      .set({
        ...update,
        updatedAt: new Date(),
      })
      .where(eq(swapListings.id, id))
      .returning();
    console.log("Updated swap listing:", updated);
    return updated;
  }

  async deleteSwapListing(id: number): Promise<boolean> {
    console.log(`Deleting swap listing with id: ${id}`);
    const [deleted] = await db
      .delete(swapListings)
      .where(eq(swapListings.id, id))
      .returning();
    const success = !!deleted;
    console.log("Delete success:", success);
    return success;
  }

  async getChatMessages(): Promise<ChatMessage[]> {
    console.log("Fetching chat messages");
    const messages = await db
      .select()
      .from(chatMessages)
      .orderBy(desc(chatMessages.timestamp));
    console.log("Fetched chat messages:", messages);
    return messages;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    console.log("Creating chat message:", message);
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    console.log("Created chat message:", newMessage);
    return newMessage;
  }

  async getGrowthPredictions(plantId: number): Promise<GrowthPrediction[]> {
    console.log(`Fetching growth predictions for plant ${plantId}`);
    const predictions = await db
      .select()
      .from(growthPredictions)
      .where(eq(growthPredictions.plantId, plantId))
      .orderBy(growthPredictions.predictedDate);
    console.log("Fetched predictions:", predictions);
    return predictions;
  }

  async createGrowthPrediction(prediction: InsertGrowthPrediction): Promise<GrowthPrediction> {
    console.log("Creating growth prediction:", prediction);
    const [newPrediction] = await db
      .insert(growthPredictions)
      .values(prediction)
      .returning();
    console.log("Created prediction:", newPrediction);
    return newPrediction;
  }

  async getRescueMissions(): Promise<RescueMission[]> {
    console.log("Fetching all rescue missions");
    const missions = await db
      .select()
      .from(rescueMissions)
      .orderBy(desc(rescueMissions.createdAt));
    console.log("Fetched rescue missions:", missions);
    return missions;
  }

  async getRescueMission(id: number): Promise<RescueMission | undefined> {
    console.log(`Fetching rescue mission with id: ${id}`);
    const [mission] = await db
      .select()
      .from(rescueMissions)
      .where(eq(rescueMissions.id, id));
    console.log("Fetched rescue mission:", mission);
    return mission;
  }

  async createRescueMission(mission: InsertRescueMission): Promise<RescueMission> {
    console.log("Creating rescue mission:", mission);
    const [newMission] = await db
      .insert(rescueMissions)
      .values(mission)
      .returning();
    console.log("Created rescue mission:", newMission);
    return newMission;
  }

  async updateRescueMission(
    id: number,
    update: Partial<RescueMission>
  ): Promise<RescueMission | undefined> {
    console.log(`Updating rescue mission ${id} with:`, update);
    const [updated] = await db
      .update(rescueMissions)
      .set({
        ...update,
        updatedAt: new Date(),
      })
      .where(eq(rescueMissions.id, id))
      .returning();
    console.log("Updated rescue mission:", updated);
    return updated;
  }

  async getRescueResponses(missionId: number): Promise<RescueResponse[]> {
    console.log(`Fetching responses for rescue mission ${missionId}`);
    const responses = await db
      .select()
      .from(rescueResponses)
      .where(eq(rescueResponses.missionId, missionId))
      .orderBy(desc(rescueResponses.createdAt));
    console.log("Fetched rescue responses:", responses);
    return responses;
  }

  async createRescueResponse(response: InsertRescueResponse): Promise<RescueResponse> {
    console.log("Creating rescue response:", response);
    const [newResponse] = await db
      .insert(rescueResponses)
      .values(response)
      .returning();
    console.log("Created rescue response:", newResponse);
    return newResponse;
  }
}

export const storage = new DatabaseStorage();