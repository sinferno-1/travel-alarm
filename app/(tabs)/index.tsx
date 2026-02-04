import { useState, useEffect } from 'react';
import { TextInput, StyleSheet, Pressable, Alert, FlatList } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';

import { parseCoordinate } from '@/services/coordinateParser';
import { addCheckpoint, removeCheckpoint, startTracking } from '@/services/background';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import AlarmModal from '@/app/modal';

type Checkpoint = {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
};

export default function HomeScreen() {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [radiusKm, setRadiusKm] = useState(0.5); // km
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);

  // Add a new checkpoint
  async function onAddCheckpoint() {
    const latitude = parseCoordinate(lat);
    const longitude = parseCoordinate(lon);

    if (latitude === null || longitude === null) {
      Alert.alert('Invalid coordinates', 'Use format: 28° 36\' 50" N');
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location required', 'Enable location services');
      return;
    }

    const newCheckpoint: Checkpoint = {
      id: Date.now().toString(),
      latitude,
      longitude,
      radius: radiusKm * 1000,
    };

    addCheckpoint(newCheckpoint); // add to background tracker
    setCheckpoints([...checkpoints, newCheckpoint]);
    await startTracking();
    Alert.alert('Checkpoint added', `Alarm set for this location within ${radiusKm} km`);
  }

  function deleteCheckpoint(id: string) {
    removeCheckpoint(id); // remove from background tracker
    setCheckpoints(checkpoints.filter((c) => c.id !== id));
  }

  return (
    <ThemedView style={styles.container}>
      <AlarmModal />

      <ThemedText type="title" style={styles.title}>
        🚍 Travel Alarm
      </ThemedText>

      <ThemedText style={styles.label}>Latitude</ThemedText>
      <TextInput
        style={styles.input}
        placeholder='28° 36 50" N'
        placeholderTextColor="#888"
        value={lat}
        onChangeText={setLat}
      />

      <ThemedText style={styles.label}>Longitude</ThemedText>
      <TextInput
        style={styles.input}
        placeholder='77° 12 32" E'
        placeholderTextColor="#888"
        value={lon}
        onChangeText={setLon}
      />

      <ThemedText style={styles.label}>Radius: {radiusKm.toFixed(1)} km</ThemedText>
      <Slider
        style={{ width: '100%', height: 40 }}
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
        <ThemedText type="defaultSemiBold" style={styles.buttonText}>
          Add Checkpoint
        </ThemedText>
      </Pressable>

      <FlatList
        data={checkpoints}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 30 }}
        renderItem={({ item }) => (
          <ThemedView style={styles.checkpointRow}>
            <ThemedText>
              Lat: {item.latitude.toFixed(5)}, Lon: {item.longitude.toFixed(5)}, Radius: {(item.radius/1000).toFixed(1)} km
            </ThemedText>
            <Pressable style={styles.deleteButton} onPress={() => deleteCheckpoint(item.id)}>
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
  title: { textAlign: 'center', marginBottom: 25 },
  label: { marginTop: 15 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    borderColor: '#555',
    color: '#fff',
  },
  button: {
    marginTop: 25,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  buttonText: { color: '#fff' },
  checkpointRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#333',
    marginBottom: 10,
    alignItems: 'center' as const,
  },
  deleteButton: {
    padding: 6,
    backgroundColor: '#dc2626',
    borderRadius: 8,
  },
});
