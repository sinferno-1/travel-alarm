import { Audio } from 'expo-av';

let alarmSound: Audio.Sound | null = null;

export async function startAlarm() {
  // Load sound
  alarmSound = new Audio.Sound();
  try {
    await alarmSound.loadAsync(require('../assets/alarm.mp3')); // put your alarm sound in assets
    await alarmSound.setIsLoopingAsync(true);
    await alarmSound.playAsync();
  } catch (e) {
    console.log('Error playing alarm:', e);
  }
}

export async function stopAlarm() {
  if (alarmSound) {
    await alarmSound.stopAsync();
    await alarmSound.unloadAsync();
    alarmSound = null;
  }
}

// snooze in minutes
export async function snoozeAlarm(minutes = 5) {
  await stopAlarm();
  setTimeout(() => {
    startAlarm();
  }, minutes * 60 * 1000);
}
