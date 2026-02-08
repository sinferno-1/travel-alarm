import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Audio } from "expo-av";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import {
  alarmEvents,
  clearTriggeredCheckpoint,
  getTriggeredCheckpoint,
  removeCheckpoint,
  snooze,
} from "@/services/background";

let alarmSound: Audio.Sound | null = null;

async function playSound() {
  try {
    if (alarmSound) return;
    alarmSound = new Audio.Sound();
    await alarmSound.loadAsync(require("../assets/alarm.mp3"));
    await alarmSound.setIsLoopingAsync(true);
    await alarmSound.playAsync();
  } catch (e) {
    console.warn("playSound error:", e);
  }
}

async function stopSound() {
  try {
    if (!alarmSound) return;
    await alarmSound.stopAsync();
    await alarmSound.unloadAsync();
    alarmSound = null;
  } catch (e) {
    console.warn("stopSound error:", e);
    alarmSound = null;
  }
}

export default function AlarmModal() {
  const [visible, setVisible] = useState(false);
  const [cpLabel, setCpLabel] = useState<string | null>(null);

  useEffect(() => {
    // Handler receives optional payload (background may emit cp), but we'll also read getTriggeredCheckpoint()
    const handler = (maybeCp?: any) => {
      // prefer payload label if provided
      const labelFromEvent = maybeCp?.label;
      if (labelFromEvent) {
        setCpLabel(labelFromEvent);
      } else {
        const cp = getTriggeredCheckpoint();
        setCpLabel(cp ? cp.label : null);
      }

      setVisible(true);
      // ensure sound starts when modal is visible (foreground)
      playSound();
    };

    alarmEvents.on("alarm", handler);
    // some background versions emit 'alarmTriggered' with cp; listen too just in case
    alarmEvents.on("alarmTriggered", handler);

    return () => {
      alarmEvents.off("alarm", handler);
      alarmEvents.off("alarmTriggered", handler);
    };
  }, []);

  // Stop: delete checkpoint only when user confirms stop
  const handleStop = async () => {
    // get current triggered checkpoint (may be null)
    const cp = getTriggeredCheckpoint();
    if (cp) {
      // Delete from background store
      removeCheckpoint(cp.id);
    }

    // stop everything and clear triggered state
    await stopSound();
    clearTriggeredCheckpoint(); // stops vibration and emits checkpointRemoved
    setVisible(false);
    setCpLabel(null);
  };

  // Snooze: stop current alarm, keep checkpoint, set snooze time
  const handleSnooze = async (minutes = 5) => {
    await stopSound();
    clearTriggeredCheckpoint(); // stops vibration but DOES NOT remove checkpoint
    snooze(minutes);
    setVisible(false);
    setCpLabel(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <ThemedView style={styles.card}>
          <ThemedText type="title">🚨 Alarm</ThemedText>
          <Text style={styles.labelText}>
            {cpLabel ? `Reached: ${cpLabel}` : "Checkpoint reached"}
          </Text>

          <View style={styles.row}>
            <Pressable style={styles.stopBtn} onPress={handleStop}>
              <ThemedText>Stop</ThemedText>
            </Pressable>

            <Pressable style={styles.snoozeBtn} onPress={() => handleSnooze(5)}>
              <ThemedText>Snooze 5 min</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "84%",
    padding: 22,
    borderRadius: 12,
    alignItems: "center",
  },
  labelText: {
    marginTop: 12,
    fontSize: 16,
    color: "#ddd",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    marginTop: 20,
    width: "100%",
  },
  stopBtn: {
    flex: 1,
    marginRight: 6,
    padding: 12,
    backgroundColor: "#e53935",
    borderRadius: 10,
    alignItems: "center",
  },
  snoozeBtn: {
    flex: 1,
    marginLeft: 6,
    padding: 12,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    alignItems: "center",
  },
});
