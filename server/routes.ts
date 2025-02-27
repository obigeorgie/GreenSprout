import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertPlantSchema, insertGrowthTimelineSchema, insertSwapListingSchema, insertChatMessageSchema, insertRescueMissionSchema, insertRescueResponseSchema } from "@shared/schema";
import { ZodError } from "zod";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { generatePlantCareResponse, handleAssistantAction } from "./chat";
import OpenAI from "openai";
import * as z from 'zod';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize CSRF protection
const csrfProtection = csrf({ cookie: true });

export async function registerRoutes(app: Express) {
  // Add cookie parser middleware
  app.use(cookieParser());

  // Add CSRF protection to all routes
  app.use(csrfProtection);

  // Provide CSRF token to the frontend
  app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });

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

  app.post("/api/plants", csrfProtection, async (req, res) => {
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

  app.patch("/api/plants/:id", csrfProtection, async (req, res) => {
    const id = Number(req.params.id);
    const plant = await storage.updatePlant(id, req.body);
    if (!plant) {
      return res.status(404).json({ message: "Plant not found" });
    }
    res.json(plant);
  });

  app.delete("/api/plants/:id", csrfProtection, async (req, res) => {
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

  app.post("/api/plants/:id/timeline", csrfProtection, async (req, res) => {
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
  app.post("/api/identify-plant", csrfProtection, async (req, res) => {
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

  // Growth prediction routes
  app.get("/api/plants/:id/growth-predictions", async (req, res) => {
    try {
      const predictions = await storage.getGrowthPredictions(Number(req.params.id));
      res.json(predictions);
    } catch (error) {
      console.error("Error fetching growth predictions:", error);
      res.status(500).json({ message: "Failed to fetch predictions" });
    }
  });

  app.post("/api/plants/:id/generate-prediction", csrfProtection, async (req, res) => {
    try {
      const plantId = Number(req.params.id);
      const plant = await storage.getPlant(plantId);

      if (!plant) {
        return res.status(404).json({ message: "Plant not found" });
      }

      // Get growth timeline entries for context
      const timeline = await storage.getGrowthTimeline(plantId);

      // Generate prediction using OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a plant growth prediction expert. Based on the plant data and growth history, generate realistic growth predictions for the next 3 months. Return an array of predictions in this format: [{ height: number, leafCount: number, date: string (ISO format), confidence: number (0-100), factors: object }]"
          },
          {
            role: "user",
            content: JSON.stringify({
              plant,
              timeline,
              predictionMonths: 3, // Generate 3 months of predictions
            })
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      const predictions = Array.isArray(result.predictions) ? result.predictions : [];

      // Store predictions
      const savedPredictions = await Promise.all(
        predictions.map((pred) =>
          storage.createGrowthPrediction({
            plantId,
            predictedHeight: pred.height,
            predictedLeafCount: pred.leafCount,
            predictedDate: new Date(pred.date),
            confidence: pred.confidence,
            factors: pred.factors || {},
          })
        )
      );

      res.json(savedPredictions);
    } catch (error) {
      console.error("Error generating growth prediction:", error);
      res.status(500).json({ message: "Failed to generate prediction" });
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

  // Plant swap marketplace routes
  app.get("/api/swap-listings", async (_req, res) => {
    const listings = await storage.getSwapListings();
    res.json(listings);
  });

  app.get("/api/swap-listings/:id", async (req, res) => {
    const listing = await storage.getSwapListing(Number(req.params.id));
    if (!listing) {
      return res.status(404).json({ message: "Swap listing not found" });
    }
    res.json(listing);
  });

  app.post("/api/swap-listings", csrfProtection, async (req, res) => {
    try {
      const listingData = insertSwapListingSchema.parse(req.body);
      const listing = await storage.createSwapListing(listingData);
      res.status(201).json(listing);
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch("/api/swap-listings/:id", csrfProtection, async (req, res) => {
    const listing = await storage.updateSwapListing(Number(req.params.id), req.body);
    if (!listing) {
      return res.status(404).json({ message: "Swap listing not found" });
    }
    res.json(listing);
  });

  app.delete("/api/swap-listings/:id", csrfProtection, async (req, res) => {
    const success = await storage.deleteSwapListing(Number(req.params.id));
    if (!success) {
      return res.status(404).json({ message: "Swap listing not found" });
    }
    res.status(204).end();
  });

  // Chat routes
  app.get("/api/chat-messages", async (_req, res) => {
    try {
      const messages = await storage.getChatMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat-messages", csrfProtection, async (req, res) => {
    try {
      // Validate and store user message
      const userMessage = insertChatMessageSchema.parse(req.body);
      const savedUserMessage = await storage.createChatMessage(userMessage);

      // Get conversation history for context
      const messages = await storage.getChatMessages();

      // Generate AI response
      const assistantResponse = await generatePlantCareResponse(messages);

      // Store AI response
      const savedAssistantMessage = await storage.createChatMessage({
        role: "assistant",
        content: assistantResponse.content,
        imageUrl: assistantResponse.imageUrl,
        actionType: assistantResponse.actionType,
        actionPayload: assistantResponse.actionPayload,
      });

      // If there's an action, process it
      let actionResult = null;
      if (assistantResponse.actionType) {
        actionResult = await handleAssistantAction(
          assistantResponse.actionType,
          assistantResponse.actionPayload || {}
        );
      }

      res.json({
        userMessage: savedUserMessage,
        assistantMessage: savedAssistantMessage,
        actionResult,
      });
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Error processing chat message:", err);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // Add plant health diagnosis route
  // Add input validation schema
  const plantDiagnosisSchema = z.object({
    image: z.string().min(1, "Image data is required"),
  });

  // Update the plant health diagnosis route with validation
  app.post("/api/diagnose-plant", csrfProtection, async (req, res) => {
    try {
      const { image } = plantDiagnosisSchema.parse(req.body);

      // Generate health analysis using OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a plant health expert. Analyze the plant image and identify any health issues, providing recommendations. Return your analysis in JSON format with the following structure: { issues: [{ issue: string, confidence: number, recommendations: string[] }] }"
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this plant's health condition and identify any issues:"
              },
              {
                type: "image_url",
                image_url: { url: image }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation Error",
          details: error.errors[0].message
        });
      }
      console.error("Plant diagnosis error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        code: "DIAGNOSIS_FAILED",
        message: "Failed to analyze plant health"
      });
    }
  });

  // Add rescue mission routes
  app.get("/api/rescue-missions", async (_req, res) => {
    try {
      const missions = await storage.getRescueMissions();
      res.json(missions);
    } catch (error) {
      console.error("Error fetching rescue missions:", error);
      res.status(500).json({ message: "Failed to fetch rescue missions" });
    }
  });

  app.get("/api/rescue-missions/:id", async (req, res) => {
    try {
      const mission = await storage.getRescueMission(Number(req.params.id));
      if (!mission) {
        return res.status(404).json({ message: "Rescue mission not found" });
      }
      res.json(mission);
    } catch (error) {
      console.error("Error fetching rescue mission:", error);
      res.status(500).json({ message: "Failed to fetch rescue mission" });
    }
  });

  app.post("/api/rescue-missions", csrfProtection, async (req, res) => {
    try {
      const missionData = insertRescueMissionSchema.parse(req.body);
      const mission = await storage.createRescueMission(missionData);
      res.status(201).json(mission);
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Error creating rescue mission:", err);
      res.status(500).json({ message: "Failed to create rescue mission" });
    }
  });

  app.patch("/api/rescue-missions/:id", csrfProtection, async (req, res) => {
    try {
      const mission = await storage.updateRescueMission(Number(req.params.id), req.body);
      if (!mission) {
        return res.status(404).json({ message: "Rescue mission not found" });
      }
      res.json(mission);
    } catch (error) {
      console.error("Error updating rescue mission:", error);
      res.status(500).json({ message: "Failed to update rescue mission" });
    }
  });

  app.get("/api/rescue-missions/:id/responses", async (req, res) => {
    try {
      const responses = await storage.getRescueResponses(Number(req.params.id));
      res.json(responses);
    } catch (error) {
      console.error("Error fetching rescue responses:", error);
      res.status(500).json({ message: "Failed to fetch rescue responses" });
    }
  });

  app.post("/api/rescue-missions/:id/responses", csrfProtection, async (req, res) => {
    try {
      const responseData = insertRescueResponseSchema.parse({
        ...req.body,
        missionId: Number(req.params.id),
      });
      const response = await storage.createRescueResponse(responseData);
      res.status(201).json(response);
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Error creating rescue response:", err);
      res.status(500).json({ message: "Failed to create rescue response" });
    }
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