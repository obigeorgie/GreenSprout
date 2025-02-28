import { useState, useEffect, useRef } from "react";
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
  const componentMounted = useRef(true);

  useEffect(() => {
    console.log('CareSchedule mounted:', {
      plantId: plant.id,
      notificationsEnabled: notificationsEnabled,
      timestamp: new Date().toISOString()
    });

    // Initial check for notification support and permission
    const checkNotificationStatus = () => {
      if ("Notification" in window) {
        setNotificationsEnabled(Notification.permission === "granted");
      }
    };

    checkNotificationStatus();

    // Only set up notifications if they're supported and enabled
    if ("Notification" in window && Notification.permission === "granted") {
      console.log('Setting up notifications for plant:', plant.id);

      // Initial check for any pending notifications
      const notifications = checkPlantCareNotifications(plant);
      notifications.forEach(notification => {
        if (componentMounted.current) {
          console.log('Showing notification:', {
            title: notification.title,
            timestamp: new Date().toISOString()
          });
          showNotification(notification.title, {
            body: notification.body,
            icon: notification.icon,
          });
        }
      });

      // Set up periodic checks
      const checkInterval = setInterval(() => {
        if (!componentMounted.current) {
          console.log('Skipping notification check - component unmounted');
          return;
        }

        const notifications = checkPlantCareNotifications(plant);
        notifications.forEach(notification => {
          console.log('Periodic notification check:', {
            title: notification.title,
            timestamp: new Date().toISOString()
          });
          showNotification(notification.title, {
            body: notification.body,
            icon: notification.icon,
          });
        });
      }, 60 * 60 * 1000); // Check every hour

      return () => {
        console.log('CareSchedule cleanup:', {
          plantId: plant.id,
          timestamp: new Date().toISOString()
        });
        componentMounted.current = false;
        clearInterval(checkInterval);
      };
    }
  }, [plant]);

  const handleWater = async () => {
    try {
      console.log('Handling water action:', {
        plantId: plant.id,
        timestamp: new Date().toISOString()
      });

      setUpdating(true);
      await apiRequest("PATCH", `/api/plants/${plant.id}`, {
        lastWatered: new Date(),
      });

      if (componentMounted.current) {
        onUpdate();
        toast({
          title: "Plant watered!",
          description: "Watering schedule has been updated.",
        });
      } else {
        console.log('Skipping state update - component unmounted');
      }
    } catch (error) {
      console.error('Water action error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        plantId: plant.id,
        timestamp: new Date().toISOString()
      });

      if (componentMounted.current) {
        toast({
          title: "Error",
          description: "Failed to update watering schedule.",
          variant: "destructive",
        });
      }
    } finally {
      if (componentMounted.current) {
        setUpdating(false);
      }
    }
  };

  const handleFertilize = async () => {
    try {
      console.log('Handling fertilize action:', {
        plantId: plant.id,
        timestamp: new Date().toISOString()
      });

      setUpdating(true);
      await apiRequest("PATCH", `/api/plants/${plant.id}`, {
        lastFertilized: new Date(),
      });

      if (componentMounted.current) {
        onUpdate();
        toast({
          title: "Plant fertilized!",
          description: "Fertilizer schedule has been updated.",
        });
      } else {
        console.log('Skipping state update - component unmounted');
      }
    } catch (error) {
      console.error('Fertilize action error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        plantId: plant.id,
        timestamp: new Date().toISOString()
      });

      if (componentMounted.current) {
        toast({
          title: "Error",
          description: "Failed to update fertilizer schedule.",
          variant: "destructive",
        });
      }
    } finally {
      if (componentMounted.current) {
        setUpdating(false);
      }
    }
  };

  const toggleNotifications = async () => {
    try {
      if (!("Notification" in window)) {
        toast({
          title: "Notifications not supported",
          description: "Your browser doesn't support notifications. Try using a modern browser like Chrome or Firefox.",
          variant: "destructive",
        });
        return;
      }

      if (notificationsEnabled) {
        setNotificationsEnabled(false);
        toast({
          title: "Notifications disabled",
          description: "You won't receive plant care reminders.",
        });
      } else {
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