import { useState, useEffect } from "react";
import { Plant } from "@shared/schema";
import { Cloud, Droplets, Thermometer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchWeather, type WeatherData, getWateringRecommendation } from "@/lib/weather";
import { useToast } from "@/hooks/use-toast";

interface WeatherCareProps {
  plant: Plant;
}

export default function WeatherCare({ plant }: WeatherCareProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get user's location and fetch weather data
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const weatherData = await fetchWeather({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setWeather(weatherData);
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to fetch weather data",
              variant: "destructive",
            });
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          toast({
            title: "Location Access Required",
            description: "Please enable location access for weather-based care recommendations.",
            variant: "destructive",
          });
          setLoading(false);
        }
      );
    } else {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      setLoading(false);
    }
  }, [toast]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="mt-4 space-y-2">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) return null;

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Weather-Based Care</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Thermometer className="h-4 w-4" />
            <span>{Math.round(weather.temperature)}°C</span>
            <Droplets className="h-4 w-4 ml-2" />
            <span>{weather.humidity}%</span>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            {getWateringRecommendation(plant, weather)}
          </AlertDescription>
        </Alert>

        {weather.isRaining && (
          <div className="flex items-center gap-2 text-sm text-blue-500">
            <Cloud className="h-4 w-4" />
            <span>Currently raining in your area</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
