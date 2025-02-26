import OpenAI from "openai";
import { type ChatMessage, AssistantActionType } from "@shared/schema";
import type { Plant, SwapListing } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export async function generatePlantCareResponse(messages: ChatMessage[]): Promise<{
  content: string;
  actionType?: string;
  actionPayload?: Record<string, unknown>;
  imageUrl?: string;
}> {
  try {
    const formattedMessages = messages.map(msg => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
      // Include image if present
      ...(msg.imageUrl && {
        content: [
          { type: "text", text: msg.content },
          { type: "image_url", image_url: { url: msg.imageUrl } }
        ]
      })
    }));

    // Add comprehensive system message to guide responses
    formattedMessages.unshift({
      role: "system",
      content: `You are PlantBuddy, an advanced AI assistant for plant care management with access to all app features:

Key Features:
- Plant Identification & Health Scanning
  * Analyze plant photos for species identification
  * Diagnose plant health issues with AR scanning
  * Provide care recommendations based on visual analysis

- Growth Tracking & Care Management
  * Monitor plant growth milestones
  * Track watering and fertilizing schedules
  * Record plant measurements and progress
  * Generate personalized care schedules

- Social & Community
  * Share plant milestones on social media
  * Participate in plant rescue missions
  * Browse and create plant swap listings
  * Join community discussions

- Smart Features
  * Real-time weather-based care adjustments
  * AR-powered plant health diagnosis
  * Growth predictions using AI
  * Interactive tutorial system

Available Actions:
${Object.entries(AssistantActionType).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

When appropriate, include specific actions in your response using the valid action types above.
For plant identification or health scans, analyze visual characteristics and provide detailed insights.
For care questions, give actionable advice based on plant species and conditions.
For community features, guide users to relevant social interactions and sharing options.

Always maintain a helpful, knowledgeable tone focused on plant care and sustainable practices.
If a user shares an image, prioritize visual analysis in your response.`
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const parsedResponse = JSON.parse(response.choices[0].message.content || "{}");

    // If user shared an image for identification, analyze it specifically
    if (messages[messages.length - 1].imageUrl) {
      const imageAnalysisResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Identify this plant and provide care instructions:" },
              { 
                type: "image_url",
                image_url: { url: messages[messages.length - 1].imageUrl! }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
      });

      const imageAnalysis = JSON.parse(imageAnalysisResponse.choices[0].message.content || "{}");
      parsedResponse.content += `\n\nPlant Analysis:\n${imageAnalysis.content || ""}`;
    }

    return {
      content: parsedResponse.content || "I apologize, but I couldn't generate a response. Please try asking in a different way.",
      actionType: parsedResponse.actionType,
      actionPayload: parsedResponse.actionPayload,
      imageUrl: parsedResponse.imageUrl
    };
  } catch (error) {
    console.error("Error generating plant care response:", error);
    throw new Error("Failed to generate response");
  }
}

export async function handleAssistantAction(
  actionType: string,
  actionPayload: Record<string, unknown>
): Promise<any> {
  switch (actionType) {
    case AssistantActionType.VIEW_PLANT:
      return { redirect: `/plant/${actionPayload.plantId}` };

    case AssistantActionType.ADD_PLANT:
      return { redirect: "/add" };

    case AssistantActionType.IDENTIFY_PLANT:
      return { redirect: "/identify" };

    case AssistantActionType.VIEW_MARKETPLACE:
      return { redirect: "/marketplace" };

    case AssistantActionType.CREATE_SWAP:
      return { redirect: "/marketplace/create" };

    case AssistantActionType.SHOW_RECOMMENDATIONS:
      return { redirect: `/plant/${actionPayload.plantId}/recommendations` };

    case AssistantActionType.DIAGNOSE_HEALTH:
      return { redirect: "/health-scan" };

    case AssistantActionType.START_TUTORIAL:
      return { redirect: "/tutorial" };

    case AssistantActionType.VIEW_TIMELINE:
      return { redirect: `/plant/${actionPayload.plantId}#timeline` };

    case AssistantActionType.VIEW_RESCUE_MISSIONS:
      return { redirect: "/rescue-missions" };

    case AssistantActionType.CHAT_WITH_PLANT:
      return { redirect: `/chat?plantId=${actionPayload.plantId}` };

    default:
      return null;
  }
}