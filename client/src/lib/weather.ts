import { z } from "zod";

// Weather data schema
export const weatherSchema = z.object({
  temperature: z.number(),
  humidity: z.number(),
  precipitation: z.number(),
  isRaining: z.boolean(),
});

export type WeatherData = z.infer<typeof weatherSchema>;

interface WeatherParams {
  latitude: number;
  longitude: number;
}

export async function fetchWeather({ latitude, longitude }: WeatherParams): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relativehumidity_2m,precipitation&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }

  const data = await response.json();

  // Get current hour's data
  const currentHour = new Date().getHours();

  return {
    temperature: data.hourly.temperature_2m[currentHour],
    humidity: data.hourly.relativehumidity_2m[currentHour],
    precipitation: data.hourly.precipitation[currentHour],
    isRaining: data.hourly.precipitation[currentHour] > 0,
  };
}

export function getWateringRecommendation(plant: {
  wateringFrequency: number;
  lastWatered: Date | null;
}, weather: WeatherData): string {
  const daysToNextWatering = plant.lastWatered
    ? Math.ceil((plant.lastWatered.getTime() + (plant.wateringFrequency * 24 * 60 * 60 * 1000) - Date.now()) / (24 * 60 * 60 * 1000))
    : 0;

  if (weather.isRaining) {
    return "It's currently raining! You might want to delay watering if your plant is outdoors.";
  }

  if (weather.temperature > 30) {
    return `Due to high temperatures (${Math.round(weather.temperature)}°C), consider watering more frequently than usual.`;
  }

  if (weather.humidity < 40) {
    return "Due to low humidity, consider misting your plant or using a humidity tray.";
  }

  if (daysToNextWatering <= 0) {
    return "Time to water your plant! Check the soil moisture first.";
  }

  return `Next watering in ${daysToNextWatering} days. Adjust based on soil moisture.`;
}