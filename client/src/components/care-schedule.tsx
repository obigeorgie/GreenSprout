import { useState, useEffect } from "react";
import { type Plant } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Droplets, Sun, Sprout, Bell, BellOff } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { requestNotificationPermission, showNotification, checkPlantCareNotifications } from "@/lib/notifications";

interface CareScheduleProps {
  plant: Plant;
  onUpdate: () => void;
}

export default function CareSchedule({ plant, onUpdate }: CareScheduleProps) {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    // Check if notifications are already enabled
    setNotificationsEnabled(Notification.permission === "granted");

    // Only set up notifications if they're enabled
    if (Notification.permission === "granted") {
      // Initial check for any pending notifications
      const notifications = checkPlantCareNotifications(plant);
      notifications.forEach(notification => {
        showNotification(notification.title, {
          body: notification.body,
          icon: notification.icon,
        });
      });

      // Set up periodic checks
      const checkInterval = setInterval(() => {
        const notifications = checkPlantCareNotifications(plant);
        notifications.forEach(notification => {
          showNotification(notification.title, {
            body: notification.body,
            icon: notification.icon,
          });
        });
      }, 60 * 60 * 1000); // Check every hour

      return () => clearInterval(checkInterval);
    }
  }, [plant]);

  const handleWater = async () => {
    try {
      setUpdating(true);
      await apiRequest("PATCH", `/api/plants/${plant.id}`, {
        lastWatered: new Date(),
      });
      onUpdate();
      toast({
        title: "Plant watered!",
        description: "Watering schedule has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update watering schedule.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleFertilize = async () => {
    try {
      setUpdating(true);
      await apiRequest("PATCH", `/api/plants/${plant.id}`, {
        lastFertilized: new Date(),
      });
      onUpdate();
      toast({
        title: "Plant fertilized!",
        description: "Fertilizer schedule has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update fertilizer schedule.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const toggleNotifications = async () => {
    try {
      if (notificationsEnabled) {
        setNotificationsEnabled(false);
        toast({
          title: "Notifications disabled",
          description: "You won't receive plant care reminders.",
        });
      } else {
        if (!("Notification" in window)) {
          toast({
            title: "Notifications not supported",
            description: "Your browser doesn't support notifications. Try using a modern browser like Chrome or Firefox.",
            variant: "destructive",
          });
          return;
        }

        if (!window.isSecureContext) {
          toast({
            title: "Secure context required",
            description: "Notifications require a secure (HTTPS) connection.",
            variant: "destructive",
          });
          return;
        }

        const granted = await requestNotificationPermission();
        setNotificationsEnabled(granted);

        if (granted) {
          toast({
            title: "Notifications enabled",
            description: "You'll receive reminders for plant care tasks.",
          });
        } else {
          toast({
            title: "Notifications blocked",
            description: "Please enable notifications in your browser settings to receive reminders.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
      toast({
        title: "Error",
        description: "Failed to toggle notifications. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Care Schedule</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleNotifications}
          className="gap-2"
        >
          {notificationsEnabled ? (
            <>
              <Bell className="h-4 w-4" />
              Notifications On
            </>
          ) : (
            <>
              <BellOff className="h-4 w-4" />
              Notifications Off
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Water</p>
            <p className="text-sm text-muted-foreground">
              {plant.lastWatered
                ? `Last watered: ${format(new Date(plant.lastWatered), "MMM d")}`
                : "Not watered yet"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleWater}
          disabled={updating}
        >
          Water Now
        </Button>
      </div>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Sprout className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Fertilize</p>
            <p className="text-sm text-muted-foreground">
              {plant.lastFertilized
                ? `Last fertilized: ${format(
                    new Date(plant.lastFertilized),
                    "MMM d",
                  )}`
                : "Not fertilized yet"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFertilize}
          disabled={updating}
        >
          Fertilize Now
        </Button>
      </div>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Sunlight</p>
            <p className="text-sm text-muted-foreground">
              {plant.sunlightNeeds} light needed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}