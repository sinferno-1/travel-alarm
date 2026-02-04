import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { onAlarmTrigger } from '@/app/modal';

const TASK_NAME = 'TRACK_DEST';

// List of checkpoints
type Checkpoint = {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
};

let checkpoints: Checkpoint[] = [];

// Add a new checkpoint
export function addCheckpoint(data: Checkpoint) {
  checkpoints.push(data);
}

// Remove checkpoint by ID
export function removeCheckpoint(id: string) {
  checkpoints = checkpoints.filter((c) => c.id !== id);
}

// Start GPS tracking
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

// Stop GPS tracking
export async function stopTracking() {
  const started = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  if (started) {
    await Location.stopLocationUpdatesAsync(TASK_NAME);
  }
}

// --- Background task ---
TaskManager.defineTask(TASK_NAME, async ({ data, error }): Promise<void> => {
  if (error || !data || checkpoints.length === 0) return;

  const location = (data as any).locations[0];
  if (!location) return;

  const { latitude, longitude } = location.coords;

  const triggeredCheckpoints: string[] = [];

  for (const cp of checkpoints) {
    const dist = distance(latitude, longitude, cp.latitude, cp.longitude);
    if (dist <= cp.radius) {
      // Trigger alarm for this checkpoint
      onAlarmTrigger();
      triggeredCheckpoints.push(cp.id);
    }
  }

  // Remove triggered checkpoints
  checkpoints = checkpoints.filter((cp) => !triggeredCheckpoints.includes(cp.id));

  // Stop tracking if no more checkpoints left
  if (checkpoints.length === 0) {
    await stopTracking();
  }
});

// --- Haversine distance ---
function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // meters
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
