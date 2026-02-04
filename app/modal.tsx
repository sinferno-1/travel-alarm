import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Audio } from 'expo-av';
import { useState } from 'react';

// --- Alarm sound reference ---
let alarmSound: Audio.Sound | null = null;

// --- Reference to control modal visibility from background ---
let setVisibleCallback: ((visible: boolean) => void) | null = null;

// --- Called from background.ts when GPS reaches destination ---
export function onAlarmTrigger() {
  playAlarm();
  setVisibleCallback && setVisibleCallback(true);
}

// --- Play alarm in loop ---
async function playAlarm() {
  alarmSound = new Audio.Sound();
  try {
    await alarmSound.loadAsync(require('../assets/alarm.mp3')); // your alarm file in assets/
    await alarmSound.setIsLoopingAsync(true);
    await alarmSound.playAsync();
  } catch (e) {
    console.log('Error playing alarm:', e);
  }
}

// --- Stop alarm sound ---
export async function stopAlarm() {
  if (alarmSound) {
    await alarmSound.stopAsync();
    await alarmSound.unloadAsync();
    alarmSound = null;
  }
}

// --- Snooze alarm in minutes ---
export async function snoozeAlarm(minutes = 5) {
  await stopAlarm();
  setTimeout(() => {
    onAlarmTrigger();
  }, minutes * 60 * 1000);
}

// --- Alarm modal component ---
export default function AlarmModal() {
  const [visible, setVisible] = useState(false);

  // expose setter to background trigger
  setVisibleCallback = setVisible;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalBackground}>
        <ThemedView style={styles.modalContainer}>
          <ThemedText type="title">🚨 Alarm Ringing!</ThemedText>
          <View style={styles.buttonRow}>
            <Pressable
              style={styles.modalButton}
              onPress={async () => {
                await stopAlarm();
                setVisible(false);
              }}
            >
              <ThemedText>Stop</ThemedText>
            </Pressable>
            <Pressable
              style={styles.modalButton}
              onPress={async () => {
                await snoozeAlarm(5);
                setVisible(false);
              }}
            >
              <ThemedText>Snooze 5 min</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#222',
    padding: 25,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  buttonRow: {
    flexDirection: 'row' as const,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    margin: 5,
    padding: 12,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    alignItems: 'center' as const,
  },
});
