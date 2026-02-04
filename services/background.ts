import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { onAlarmTrigger } from '@/app/modal'; // modal exposes trigger callback

const TASK_NAME = 'TRACK_DEST';

let trip: { latitude: number; longitude: number; radius: number } | null = null;

export function setTrip(data: { latitude: number; longitude: number; radius: number }) {
  trip = data;
}

export async function startTracking() {
  await Location.startLocationUpdatesAsync(TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: 100,
    foregroundService: {
      notificationTitle: 'Travel Alarm',
      notificationBody: 'Tracking your location',
    },
  });
}

export async function stopTracking() {
  const started = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  if (started) {
    await Location.stopLocationUpdatesAsync(TASK_NAME);
  }
}

// Background task
TaskManager.defineTask(TASK_NAME, async ({ data, error }): Promise<void> => {
  if (error || !trip || !data) return;

  const location = (data as any).locations[0];
  if (!location) return;

  const { latitude, longitude } = location.coords;

  const dist = distance(latitude, longitude, trip.latitude, trip.longitude);

  if (dist <= trip.radius) {
    onAlarmTrigger(); // play alarm + show modal
    await stopTracking();
  }
});

// Haversine distance (meters)
function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
