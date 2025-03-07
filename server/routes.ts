import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertPlantSchema, insertGrowthTimelineSchema, insertSwapListingSchema, insertChatMessageSchema, insertRescueMissionSchema, insertRescueResponseSchema } from "@shared/schema";
import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { generatePlantCareResponse, handleAssistantAction } from "./chat";
import OpenAI from "openai";
import * as z from 'zod';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import paymentRoutes from './paymentRoutes';

declare module 'express' {
  interface Request {
    csrfToken(): string;
  }
}

interface ValidationError extends Error {
  status: number;
  code: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize CSRF protection with secure defaults
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Validate request with schema and handle errors consistently
const validateRequest = async <T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> => {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = new Error(error.errors[0].message) as ValidationError;
      validationError.status = 400;
      validationError.code = 'VALIDATION_ERROR';
      throw validationError;
    }
    throw error;
  }
};

export async function registerRoutes(app: Express) {
  // Add cookie parser middleware
  app.use(cookieParser());

  // Set up authentication first
  setupAuth(app);

  // Add safe debug logging for cookie and CSRF setup
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      console.log('Route Security:', {
        path: req.path,
        hasCookie: !!req.headers.cookie,
        hasCSRF: !!req.headers['csrf-token'] || !!req.headers['x-csrf-token'],
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }
    next();
  });

  // Add payment routes BEFORE CSRF protection
  app.use('/api/payments', paymentRoutes);

  // Add CSRF protection to all routes EXCEPT /api/payments
  app.use(csrfProtection);

  // Provide CSRF token to the frontend
  app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });

  // Existing plant routes with enhanced validation
  app.get("/api/plants", async (_req, res) => {
    const plants = await storage.getPlants();
    res.json(plants);
  });

  app.get("/api/plants/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        error: "Invalid ID format",
        code: "INVALID_ID"
      });
    }

    const plant = await storage.getPlant(id);
    if (!plant) {
      return res.status(404).json({
        error: "Plant not found",
        code: "NOT_FOUND"
      });
    }
    res.json(plant);
  });

  app.post("/api/plants", csrfProtection, async (req, res) => {
    try {
      const plantData = await validateRequest(insertPlantSchema, req.body);
      const plant = await storage.createPlant(plantData);
      res.status(201).json(plant);
    } catch (error) {
      if ((error as ValidationError).status) {
        const validationError = error as ValidationError;
        return res.status(validationError.status).json({
          error: validationError.message,
          code: validationError.code
        });
      }
      throw error;
    }
  });

  app.patch("/api/plants/:id", csrfProtection, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          error: "Invalid ID format",
          code: "INVALID_ID"
        });
      }

      // Convert date strings to Date objects for timestamps
      const updateData = { ...req.body };
      if (updateData.lastWatered) {
        updateData.lastWatered = new Date(updateData.lastWatered);
      }
      if (updateData.lastFertilized) {
        updateData.lastFertilized = new Date(updateData.lastFertilized);
      }

      console.log('Updating plant', id, 'with data:', updateData);

      const plant = await storage.updatePlant(id, updateData);
      if (!plant) {
        return res.status(404).json({
          error: "Plant not found",
          code: "NOT_FOUND"
        });
      }
      res.json(plant);
    } catch (error) {
      console.error("Plant update error:", error);
      res.status(500).json({
        error: "Failed to update plant",
        code: "UPDATE_FAILED"
      });
    }
  });

  app.delete("/api/plants/:id", csrfProtection, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        error: "Invalid ID format",
        code: "INVALID_ID"
      });
    }
    const success = await storage.deletePlant(id);
    if (!success) {
      return res.status(404).json({
        error: "Plant not found",
        code: "NOT_FOUND"
      });
    }
    res.status(204).end();
  });

  // Plant species routes
  app.get("/api/plant-species", async (_req, res) => {
    const species = await storage.getPlantSpecies();
    res.json(species);
  });

  app.get("/api/plant-species/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        error: "Invalid ID format",
        code: "INVALID_ID"
      });
    }
    const species = await storage.getPlantSpecies(id);
    if (!species) {
      return res.status(404).json({
        error: "Plant species not found",
        code: "NOT_FOUND"
      });
    }
    res.json(species);
  });

  // Growth timeline routes
  app.get("/api/plants/:id/timeline", async (req, res) => {
    const plantId = Number(req.params.id);
    if (isNaN(plantId)) {
      return res.status(400).json({
        error: "Invalid plant ID",
        code: "INVALID_ID"
      });
    }
    const timeline = await storage.getGrowthTimeline(plantId);
    res.json(timeline);
  });

  app.post("/api/plants/:id/timeline", csrfProtection, async (req, res) => {
    try {
      const plantId = Number(req.params.id);
      if (isNaN(plantId)) {
        return res.status(400).json({
          error: "Invalid plant ID",
          code: "INVALID_ID"
        });
      }

      const entryData = await validateRequest(
        insertGrowthTimelineSchema,
        {
          ...req.body,
          plantId,
          milestone: req.body.milestone ?? false
        }
      );

      const entry = await storage.addGrowthTimelineEntry(entryData);
      res.status(201).json(entry);
    } catch (error) {
      if ((error as ValidationError).status) {
        const validationError = error as ValidationError;
        return res.status(validationError.status).json({
          error: validationError.message,
          code: validationError.code
        });
      }
      throw error;
    }
  });

  // Plant identification route
  app.post("/api/identify-plant", csrfProtection, async (req, res) => {
    try {
      console.log('Plant identification request:', {
        hasImage: !!req.body.data,
        contentType: req.headers['content-type'],
        dataLength: req.body.data?.length,
        timestamp: new Date().toISOString()
      });

      const { data: image } = await validateRequest(imageSchema, req.body);

      // Forward the request to Gradio server
      const gradioResponse = await fetch("http://localhost:7860/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [image] }),
      });

      const result = await gradioResponse.json();
      res.json(result);
    } catch (error) {
      console.error('Plant identification error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString()
      });

      if ((error as ValidationError).status === 400) {
        return res.status(400).json({
          error: (error as Error).message,
          code: "VALIDATION_ERROR"
        });
      }
      res.status(500).json({
        error: "Failed to identify plant",
        code: "IDENTIFICATION_FAILED"
      });
    }
  });

  // Growth prediction routes
  app.get("/api/plants/:id/growth-predictions", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          error: "Invalid ID format",
          code: "INVALID_ID"
        });
      }
      const predictions = await storage.getGrowthPredictions(id);
      res.json(predictions);
    } catch (error) {
      console.error("Error fetching growth predictions:", error);
      res.status(500).json({ message: "Failed to fetch predictions" });
    }
  });

  app.post("/api/plants/:id/generate-prediction", csrfProtection, async (req, res) => {
    try {
      const plantId = Number(req.params.id);
      if (isNaN(plantId)) {
        return res.status(400).json({
          error: "Invalid plant ID",
          code: "INVALID_ID"
        });
      }
      const plant = await storage.getPlant(plantId);

      if (!plant) {
        return res.status(404).json({
          error: "Plant not found",
          code: "NOT_FOUND"
        });
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
    const plantId = Number(req.params.id);
    if (isNaN(plantId)) {
      return res.status(400).json({
        error: "Invalid plant ID",
        code: "INVALID_ID"
      });
    }
    const plant = await storage.getPlant(plantId);
    if (!plant) {
      return res.status(404).json({
        error: "Plant not found",
        code: "NOT_FOUND"
      });
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
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        error: "Invalid ID format",
        code: "INVALID_ID"
      });
    }
    const listing = await storage.getSwapListing(id);
    if (!listing) {
      return res.status(404).json({
        error: "Swap listing not found",
        code: "NOT_FOUND"
      });
    }
    res.json(listing);
  });

  app.post("/api/swap-listings", csrfProtection, async (req, res) => {
    try {
      const listingData = await validateRequest(insertSwapListingSchema, req.body);
      const listing = await storage.createSwapListing(listingData);
      res.status(201).json(listing);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({
          error: err.message,
          code: err.code
        });
      }
      throw err;
    }
  });

  app.patch("/api/swap-listings/:id", csrfProtection, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        error: "Invalid ID format",
        code: "INVALID_ID"
      });
    }
    const listing = await storage.updateSwapListing(id, req.body);
    if (!listing) {
      return res.status(404).json({
        error: "Swap listing not found",
        code: "NOT_FOUND"
      });
    }
    res.json(listing);
  });

  app.delete("/api/swap-listings/:id", csrfProtection, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        error: "Invalid ID format",
        code: "INVALID_ID"
      });
    }
    const success = await storage.deleteSwapListing(id);
    if (!success) {
      return res.status(404).json({
        error: "Swap listing not found",
        code: "NOT_FOUND"
      });
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

  // Add logging for chat message validation
  app.post("/api/chat-messages", csrfProtection, async (req, res) => {
    try {
      console.log('Chat message request:', {
        hasContent: !!req.body.content,
        contentLength: req.body.content?.length,
        role: req.body.role,
        timestamp: new Date().toISOString()
      });

      // Validate and store user message
      const userMessage = await validateRequest(insertChatMessageSchema, req.body);
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
      console.error('Chat message error:', {
        error: err instanceof Error ? err.message : 'Unknown error',
        type: err instanceof Error ? err.constructor.name : typeof err,
        validationFailed: (err as ValidationError)?.status === 400,
        timestamp: new Date().toISOString()
      });

      if ((err as ValidationError).status) {
        return res.status((err as ValidationError).status).json({
          error: (err as Error).message,
          code: (err as ValidationError).code
        });
      }
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // Plant health diagnosis route with enhanced validation
  app.post("/api/diagnose-plant", csrfProtection, async (req, res) => {
    try {
      const { data: imageData } = await validateRequest(imageSchema, req.body);

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
                image_url: { url: imageData }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      res.json(result);
    } catch (error) {
      if (error.status === 400) {
        return res.status(400).json({
          error: error.message,
          code: "VALIDATION_ERROR"
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
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          error: "Invalid ID format",
          code: "INVALID_ID"
        });
      }
      const mission = await storage.getRescueMission(id);
      if (!mission) {
        return res.status(404).json({
          error: "Rescue mission not found",
          code: "NOT_FOUND"
        });
      }
      res.json(mission);
    } catch (error) {
      console.error("Error fetching rescue mission:", error);
      res.status(500).json({ message: "Failed to fetch rescue mission" });
    }
  });

  app.post("/api/rescue-missions", csrfProtection, async (req, res) => {
    try {
      const missionData = await validateRequest(insertRescueMissionSchema, req.body);
      const mission = await storage.createRescueMission(missionData);
      res.status(201).json(mission);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({
          error: err.message,
          code: err.code
        });
      }
      console.error("Error creating rescue mission:", err);
      res.status(500).json({ message: "Failed to create rescue mission" });
    }
  });

  app.patch("/api/rescue-missions/:id", csrfProtection, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          error: "Invalid ID format",
          code: "INVALID_ID"
        });
      }
      const mission = await storage.updateRescueMission(id, req.body);
      if (!mission) {
        return res.status(404).json({
          error: "Rescue mission not found",
          code: "NOT_FOUND"
        });
      }
      res.json(mission);
    } catch (error) {
      console.error("Error updating rescue mission:", error);
      res.status(500).json({ message: "Failed to update rescue mission" });
    }
  });

  app.get("/api/rescue-missions/:id/responses", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          error: "Invalid ID format",
          code: "INVALID_ID"
        });
      }
      const responses = await storage.getRescueResponses(id);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching rescue responses:", error);
      res.status(500).json({ message: "Failed to fetch rescue responses" });
    }
  });

  app.post("/api/rescue-missions/:id/responses", csrfProtection, async (req, res) => {
    try {
      const missionId = Number(req.params.id);
      if (isNaN(missionId)) {
        return res.status(400).json({
          error: "Invalid mission ID",
          code: "INVALID_ID"
        });
      }
      const responseData = await validateRequest(
        insertRescueResponseSchema,
        { ...req.body, missionId }
      );
      const response = await storage.createRescueResponse(responseData);
      res.status(201).json(response);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({
          error: err.message,
          code: err.code
        });
      }
      console.error("Error creating rescue response:", err);
      res.status(500).json({ message: "Failed to create rescue response" });
    }
  });

  // Enhanced error handling middleware
  app.use((err: Error | ValidationError, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    const status = 'status' in err ? err.status : 500;
    const code = 'code' in err ? err.code : 'INTERNAL_ERROR';
    const message = err.message || "Internal Server Error";

    res.status(status).json({
      error: message,
      code,
      ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    });
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

const dateSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  "Invalid date format"
);

const imageSchema = z.object({
  data: z.string()
    .min(1, "Image data is required")
    .refine(
      (val) => val.startsWith('data:image/'),
      "Invalid image format. Must be a valid base64 image."
    ),
  type: z.enum(["image/jpeg", "image/png", "image/webp"], {
    errorMap: () => ({ message: "Unsupported image type. Use JPEG, PNG, or WebP." })
  })
});