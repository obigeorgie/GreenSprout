import OpenAI from "openai";
import { type ChatMessage } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export async function generatePlantCareResponse(messages: ChatMessage[]): Promise<string> {
  try {
    const formattedMessages = messages.map(msg => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content
    }));

    // Add system message to guide responses
    formattedMessages.unshift({
      role: "system",
      content: `You are a knowledgeable plant care assistant. Help users with:
- Plant care advice and troubleshooting
- Watering and fertilizing schedules
- Light and temperature requirements
- Common plant diseases and pests
- Plant propagation methods
Be concise but informative, and always prioritize plant health and sustainable practices.`
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try asking in a different way.";
  } catch (error) {
    console.error("Error generating plant care response:", error);
    throw new Error("Failed to generate response");
  }
}