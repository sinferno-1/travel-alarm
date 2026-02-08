import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

const TASK_NAME = "TRACK_DEST";

/* ---------------- SIMPLE EVENT EMITTER ---------------- */
type Listener = (...args: any[]) => void;
class SimpleEmitter {
  private events: Record<string, Listener[]> = {};
  on(event: string, fn: Listener) {
    this.events[event] = this.events[event] || [];
    this.events[event].push(fn);
  }
  off(event: string, fn: Listener) {
    this.events[event] = this.events[event]?.filter((l) => l !== fn) || [];
  }
  emit(event: string, ...args: any[]) {
    this.events[event]?.forEach((fn) => fn(...args));
  }
}
export const alarmEvents = new SimpleEmitter();

/* ---------------- TYPES ---------------- */
export type Checkpoint = {
  id: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
  label: string;
};

/* ---------------- STATE ---------------- */
let checkpoints: Checkpoint[] = [];
let triggeredCheckpoint: Checkpoint | null = null;
let vibrating = false;
let alarmSound: Audio.Sound | null = null;
let snoozeUntil: number | null = null;

/* ---------------- PUBLIC API ---------------- */
export function addCheckpoint(cp: Checkpoint) {
  checkpoints.push(cp);
}

export function removeCheckpoint(id: string) {
  checkpoints = checkpoints.filter((c) => c.id !== id);
}

export function getTriggeredCheckpoint() {
  return triggeredCheckpoint;
}

export function clearTriggeredCheckpoint() {
  stopVibration();
  stopAlarmSound();

  if (triggeredCheckpoint) {
    alarmEvents.emit("checkpointRemoved", triggeredCheckpoint.id);
  }
  triggeredCheckpoint = null;
}

export function snooze(minutes: number) {
  snoozeUntil = Date.now() + minutes * 60 * 1000;
}

export function clearSnooze() {
  snoozeUntil = null;
}

export async function startTracking() {
  const started = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  if (started) return;

  await Location.startLocationUpdatesAsync(TASK_NAME, {
    accuracy: Location.Accuracy.High,
    distanceInterval: 100,
    foregroundService: {
      notificationTitle: "Travel Alarm",
      notificationBody: "Tracking your trip",
    },
  });
}

export async function stopTracking() {
  const running = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  if (running) {
    await Location.stopLocationUpdatesAsync(TASK_NAME);
  }
}

/* ---------------- FOREGROUND TRIGGER ---------------- */
export function checkForegroundTrigger(lat: number, lon: number) {
  if (snoozeUntil && Date.now() < snoozeUntil) return null;

  for (const cp of checkpoints) {
    const dist = distance(lat, lon, cp.latitude, cp.longitude);
    if (dist <= cp.radius) {
      triggeredCheckpoint = cp;
      startVibration();
      startAlarmSound();
      alarmEvents.emit("alarm"); // Show modal
      // ✅ DO NOT remove checkpoint here
      return cp;
    }
  }
  return null;
}

/* ---------------- ALARM SOUND ---------------- */
async function startAlarmSound() {
  if (alarmSound) return;
  alarmSound = new Audio.Sound();
  try {
    await alarmSound.loadAsync(require("../assets/alarm.mp3"));
    await alarmSound.setIsLoopingAsync(true);
    await alarmSound.playAsync();
  } catch (e) {
    console.log("Alarm sound error", e);
  }
}

async function stopAlarmSound() {
  if (alarmSound) {
    await alarmSound.stopAsync();
    await alarmSound.unloadAsync();
    alarmSound = null;
  }
}

/* ---------------- VIBRATION CONTROL ---------------- */
async function startVibration() {
  if (vibrating) return;
  vibrating = true;
  while (vibrating) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(1000);
  }
}

function stopVibration() {
  vibrating = false;
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/* ---------------- DISTANCE UTILS ---------------- */
export function distance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ---------------- BACKGROUND TASK ---------------- */
TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
  if (error || !data || checkpoints.length === 0) return;

  if (snoozeUntil && Date.now() < snoozeUntil) return;

  const location = (data as any).locations?.[0];
  if (!location) return;

  const { latitude, longitude } = location.coords;

  for (const cp of checkpoints) {
    const dist = distance(latitude, longitude, cp.latitude, cp.longitude);
    if (dist <= cp.radius) {
      triggeredCheckpoint = cp;
      startVibration();
      startAlarmSound();
      alarmEvents.emit("alarm");
      break;
    }
  }
});
