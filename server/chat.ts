import OpenAI from "openai";
import { type ChatMessage, AssistantActionType } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generatePlantCareResponse(messages: ChatMessage[]): Promise<{
  content: string;
  actionType?: string;
  actionPayload?: Record<string, unknown>;
}> {
  try {
    console.log('Generating plant care response for messages:', 
      messages.length, 
      'Last message:', messages[messages.length - 1]?.content
    );

    const formattedMessages = messages.map(msg => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content
    }));

    formattedMessages.unshift({
      role: "system",
      content: `You are PlantBuddy, a helpful AI assistant for plant care. Focus on:
- Plant care advice and recommendations
- Growth tracking and maintenance schedules
- Plant health diagnostics
- Community features like plant swaps and rescue missions

Available Actions:
${Object.entries(AssistantActionType).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Keep responses friendly, practical, and focused on plant care.`
    });

    console.log('Making OpenAI API request with formatted messages');

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    console.log('Received OpenAI API response');

    const parsedResponse = JSON.parse(response.choices[0].message.content || "{}");

    return {
      content: parsedResponse.content || "I apologize, but I couldn't generate a response. Please try asking in a different way.",
      actionType: parsedResponse.actionType,
      actionPayload: parsedResponse.actionPayload
    };
  } catch (error: any) {
    console.error("Error generating plant care response:", {
      error: error.message,
      status: error.status,
      type: error.type,
      code: error.code,
      timestamp: new Date().toISOString()
    });

    // Handle rate limiting explicitly
    if (error.status === 429) {
      throw new Error("I'm receiving too many requests right now. Please try again in a moment.");
    }

    // Handle other API errors
    if (error.status >= 400 && error.status < 500) {
      throw new Error("There was an issue processing your request. Please try again.");
    }

    throw new Error("Failed to generate response. Please try again later.");
  }
}

export async function handleAssistantAction(
  actionType: string,
  actionPayload: Record<string, unknown>
): Promise<{ redirect: string } | null> {
  try {
    console.log('Handling assistant action:', { actionType, actionPayload });

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
        console.log('Unknown action type:', actionType);
        return null;
    }
  } catch (error) {
    console.error('Error handling assistant action:', error);
    return null;
  }
}