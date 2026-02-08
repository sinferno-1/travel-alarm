import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  clearSnooze,
  clearTriggeredCheckpoint,
  snooze,
} from "@/services/background";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

// ---------- SOUND ----------
let alarmSound: Audio.Sound | null = null;

// ---------- MODAL VISIBILITY CONTROL ----------
let setVisibleExternal: ((v: boolean) => void) | null = null;

export function onAlarmTrigger() {
  playAlarm();
  startVibration();
  setVisibleExternal?.(true);
}

// ---------- SOUND ----------
async function playAlarm() {
  try {
    alarmSound = new Audio.Sound();
    await alarmSound.loadAsync(require("../assets/alarm.mp3"));
    await alarmSound.setIsLoopingAsync(true);
    await alarmSound.playAsync();
  } catch (e) {
    console.log("Alarm sound error:", e);
  }
}

async function stopSound() {
  if (alarmSound) {
    await alarmSound.stopAsync();
    await alarmSound.unloadAsync();
    alarmSound = null;
  }
}

// ---------- VIBRATION ----------
let vibrationActive = false;

function startVibration() {
  vibrationActive = true;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

function stopVibration() {
  vibrationActive = false;
}

// ---------- PUBLIC ----------
export async function stopAlarmCompletely() {
  await stopSound();
  stopVibration();
  clearTriggeredCheckpoint();
  clearSnooze();
}

export async function snoozeAlarm(minutes = 5) {
  await stopSound();
  stopVibration();
  snooze(minutes);
}

// ---------- MODAL ----------
export default function AlarmModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisibleExternal = setVisible;
    return () => {
      setVisibleExternal = null;
    };
  }, []);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <ThemedView style={styles.box}>
          <ThemedText type="title">🚨 Alarm!</ThemedText>

          <View style={styles.row}>
            <Pressable
              style={styles.stop}
              onPress={async () => {
                await stopAlarmCompletely();
                setVisible(false);
              }}
            >
              <ThemedText>Stop</ThemedText>
            </Pressable>

            <Pressable
              style={styles.snooze}
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

// ---------- STYLES ----------
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: "85%",
    padding: 25,
    borderRadius: 14,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    marginTop: 25,
  },
  stop: {
    flex: 1,
    marginRight: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#dc2626",
    alignItems: "center",
  },
  snooze: {
    flex: 1,
    marginLeft: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    alignItems: "center",
  },
});
