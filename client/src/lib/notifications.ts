export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

export function showNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === "granted") {
    return new Notification(title, options);
  }
}

export function checkPlantCareNotifications(plant: {
  name: string;
  wateringFrequency: number;
  lastWatered: Date | null;
  fertilizerFrequency: number;
  lastFertilized: Date | null;
}) {
  const now = new Date();
  const notifications = [];

  if (plant.lastWatered) {
    const nextWatering = new Date(plant.lastWatered);
    nextWatering.setDate(nextWatering.getDate() + plant.wateringFrequency);

    if (nextWatering <= now) {
      notifications.push({
        title: `Time to water ${plant.name}!`,
        body: "Your plant needs watering today.",
        icon: "🌿",
      });
    } else if (
      nextWatering.getTime() - now.getTime() <=
      24 * 60 * 60 * 1000
    ) {
      notifications.push({
        title: `Water ${plant.name} tomorrow`,
        body: "Your plant will need watering tomorrow.",
        icon: "💧",
      });
    }
  }

  if (plant.lastFertilized) {
    const nextFertilizing = new Date(plant.lastFertilized);
    nextFertilizing.setDate(
      nextFertilizing.getDate() + plant.fertilizerFrequency
    );

    if (nextFertilizing <= now) {
      notifications.push({
        title: `Time to fertilize ${plant.name}!`,
        body: "Your plant needs fertilizer today.",
        icon: "🌱",
      });
    } else if (
      nextFertilizing.getTime() - now.getTime() <=
      24 * 60 * 60 * 1000
    ) {
      notifications.push({
        title: `Fertilize ${plant.name} tomorrow`,
        body: "Your plant will need fertilizer tomorrow.",
        icon: "🪴",
      });
    }
  }

  return notifications;
}
