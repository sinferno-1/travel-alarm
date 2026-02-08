import AlarmModal from "@/app/modal";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  addCheckpoint,
  alarmEvents,
  checkForegroundTrigger,
  Checkpoint,
  distance,
  removeCheckpoint,
  startTracking,
} from "@/services/background";
import { parseCoordinate } from "@/services/coordinateParser";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
} from "react-native";

type UICheckpoint = Checkpoint & { distanceKm?: number };

export default function HomeScreen() {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [label, setLabel] = useState("");
  const [radiusKm, setRadiusKm] = useState(0.5);
  const [checkpoints, setCheckpoints] = useState<UICheckpoint[]>([]);
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      setCurrentLocation(loc);

      timer = setInterval(async () => {
        const updated = await Location.getCurrentPositionAsync({});
        setCurrentLocation(updated);
      }, 60000);
    })();

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!currentLocation) return;

    const triggered = checkForegroundTrigger(
      currentLocation.coords.latitude,
      currentLocation.coords.longitude,
    );

    setCheckpoints((prev) =>
      prev.map((cp) => ({
        ...cp,
        distanceKm:
          distance(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude,
            cp.latitude,
            cp.longitude,
          ) / 1000,
      })),
    );
  }, [currentLocation]);

  useEffect(() => {
    const handler = (id: string) =>
      setCheckpoints((prev) => prev.filter((c) => c.id !== id));
    alarmEvents.on("checkpointRemoved", handler);
    return () => alarmEvents.off("checkpointRemoved", handler);
  }, []);

  async function onAddCheckpoint() {
    const latitude = parseCoordinate(lat);
    const longitude = parseCoordinate(lon);

    if (latitude === null || longitude === null)
      return Alert.alert("Invalid coordinates");
    if (!label.trim()) return Alert.alert("Label required");

    const cp: Checkpoint = {
      id: Date.now().toString(),
      latitude,
      longitude,
      radius: radiusKm * 1000,
      label,
    };
    addCheckpoint(cp);
    setCheckpoints((c) => [...c, cp]);
    await startTracking();

    setLat("");
    setLon("");
    setLabel("");
  }

  function deleteCheckpoint(id: string) {
    removeCheckpoint(id);
    setCheckpoints((c) => c.filter((x) => x.id !== id));
  }

  return (
    <ThemedView style={styles.container}>
      <AlarmModal />

      <ThemedText type="title" style={styles.title}>
        🚍 Travel Alarm
      </ThemedText>

      <ThemedText style={styles.label}>Label</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Home / Office"
        placeholderTextColor="#aaa"
        value={label}
        onChangeText={setLabel}
      />

      <ThemedText style={styles.label}>Latitude</ThemedText>
      <TextInput
        style={styles.input}
        placeholder='28° 36 50" N'
        placeholderTextColor="#aaa"
        value={lat}
        onChangeText={setLat}
      />

      <ThemedText style={styles.label}>Longitude</ThemedText>
      <TextInput
        style={styles.input}
        placeholder='77° 12 32" E'
        placeholderTextColor="#aaa"
        value={lon}
        onChangeText={setLon}
      />

      <ThemedText style={styles.label}>
        Alarm Radius: {radiusKm.toFixed(1)} km
      </ThemedText>

      <Slider
        minimumValue={0.1}
        maximumValue={10}
        step={0.1}
        value={radiusKm}
        onValueChange={setRadiusKm}
        minimumTrackTintColor="#2563eb"
        maximumTrackTintColor="#555"
        thumbTintColor="#2563eb"
      />

      <Pressable style={styles.button} onPress={onAddCheckpoint}>
        <ThemedText style={styles.buttonText}>Add Checkpoint</ThemedText>
      </Pressable>

      <FlatList
        data={checkpoints}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 25 }}
        renderItem={({ item }) => (
          <ThemedView style={styles.checkpointRow}>
            <ThemedText>
              📌 {item.label}
              {"\n"}
              🔔 Radius: {(item.radius / 1000).toFixed(1)} km{"\n"}
              {item.distanceKm !== undefined
                ? `📍 ${item.distanceKm.toFixed(2)} km left`
                : "Calculating..."}
            </ThemedText>
            <Pressable
              style={styles.deleteButton}
              onPress={() => deleteCheckpoint(item.id)}
            >
              <ThemedText>Delete</ThemedText>
            </Pressable>
          </ThemedView>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { textAlign: "center", marginBottom: 25 },
  label: { marginTop: 15 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    borderColor: "#666",
    color: "#fff",
  },
  button: {
    marginTop: 25,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
  },
  buttonText: { color: "#fff" },
  checkpointRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#333",
    marginBottom: 10,
    alignItems: "center",
  },
  deleteButton: { padding: 6, backgroundColor: "#dc2626", borderRadius: 8 },
});
