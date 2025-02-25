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

    // Add system message to guide responses
    formattedMessages.unshift({
      role: "system",
      content: `You are an intelligent plant care assistant with access to various features:
- Plant identification (when users share images)
- Plant care recommendations and schedules
- Marketplace for plant swaps
- Growth tracking and milestones
- Eco-friendly product recommendations

You can perform actions like:
- Viewing plant details
- Adding new plants
- Updating care schedules
- Identifying plants from images
- Browsing the marketplace
- Creating swap listings
- Showing product recommendations

When appropriate, include specific actions in your response using valid action types:
${Object.values(AssistantActionType).join(", ")}

For plant identification images, analyze the visual characteristics and suggest possible species.
For care questions, provide detailed, actionable advice based on the specific plant type.
For marketplace interactions, guide users to relevant swap listings or eco-products.

Respond in a helpful, knowledgeable manner focusing on plant care and sustainable practices.`
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

    default:
      return null;
  }
}