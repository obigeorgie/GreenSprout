import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertPlantSchema, insertGrowthTimelineSchema } from "@shared/schema";
import { ZodError } from "zod";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

let gradioProcess: any = null;

function startGradioServer() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const scriptPath = path.join(__dirname, "plant_classifier.py");
  gradioProcess = spawn("python", [scriptPath]);

  gradioProcess.stdout.on('data', (data: Buffer) => {
    console.log('Gradio output:', data.toString());
  });

  gradioProcess.stderr.on('data', (data: Buffer) => {
    console.error('Gradio error:', data.toString());
  });
}

export async function registerRoutes(app: Express) {
  // Start Gradio server
  startGradioServer();

  // Existing plant routes
  app.get("/api/plants", async (_req, res) => {
    const plants = await storage.getPlants();
    res.json(plants);
  });

  app.get("/api/plants/:id", async (req, res) => {
    const plant = await storage.getPlant(Number(req.params.id));
    if (!plant) {
      return res.status(404).json({ message: "Plant not found" });
    }
    res.json(plant);
  });

  app.post("/api/plants", async (req, res) => {
    try {
      const plantData = insertPlantSchema.parse(req.body);
      const plant = await storage.createPlant(plantData);
      res.status(201).json(plant);
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch("/api/plants/:id", async (req, res) => {
    const id = Number(req.params.id);
    const plant = await storage.updatePlant(id, req.body);
    if (!plant) {
      return res.status(404).json({ message: "Plant not found" });
    }
    res.json(plant);
  });

  app.delete("/api/plants/:id", async (req, res) => {
    const success = await storage.deletePlant(Number(req.params.id));
    if (!success) {
      return res.status(404).json({ message: "Plant not found" });
    }
    res.status(204).end();
  });

  // Plant species routes
  app.get("/api/plant-species", async (_req, res) => {
    const species = await storage.getPlantSpecies();
    res.json(species);
  });

  app.get("/api/plant-species/:id", async (req, res) => {
    const species = await storage.getPlantSpecies(Number(req.params.id));
    if (!species) {
      return res.status(404).json({ message: "Plant species not found" });
    }
    res.json(species);
  });

  // Growth timeline routes
  app.get("/api/plants/:id/timeline", async (req, res) => {
    const plantId = Number(req.params.id);
    const timeline = await storage.getGrowthTimeline(plantId);
    res.json(timeline);
  });

  app.post("/api/plants/:id/timeline", async (req, res) => {
    try {
      const plantId = Number(req.params.id);
      const entryData = insertGrowthTimelineSchema.parse({
        ...req.body,
        plantId,
      });
      const entry = await storage.addGrowthTimelineEntry(entryData);
      res.status(201).json(entry);
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Plant identification route
  app.post("/api/identify-plant", async (req, res) => {
    try {
      const { image } = req.body;

      // Forward the request to Gradio server
      const gradioResponse = await fetch("http://localhost:7860/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [image] }),
      });

      const result = await gradioResponse.json();
      res.json(result);
    } catch (error) {
      console.error("Plant identification error:", error);
      res.status(500).json({ message: "Failed to identify plant" });
    }
  });

  // Eco-friendly product routes
  app.get("/api/eco-products", async (_req, res) => {
    const products = await storage.getEcoProducts();
    res.json(products);
  });

  app.get("/api/eco-products/category/:category", async (req, res) => {
    const products = await storage.getEcoProductsByCategory(req.params.category);
    res.json(products);
  });

  app.get("/api/plants/:id/recommendations", async (req, res) => {
    const plant = await storage.getPlant(Number(req.params.id));
    if (!plant) {
      return res.status(404).json({ message: "Plant not found" });
    }
    const recommendations = await storage.getRecommendedProducts(plant);
    res.json(recommendations);
  });

  const server = createServer(app);

  // Cleanup Gradio process on server shutdown
  process.on('SIGTERM', () => {
    if (gradioProcess) {
      gradioProcess.kill();
    }
  });

  return server;
}