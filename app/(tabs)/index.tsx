import { useState } from 'react';
import { TextInput, StyleSheet, Pressable, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';

import { parseCoordinate } from '@/services/coordinateParser';
import { setTrip, startTracking } from '@/services/background';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import AlarmModal from '@/app/modal';

export default function HomeScreen() {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [radiusKm, setRadiusKm] = useState(0.5); // km

  async function onStart() {
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

    setTrip({
      latitude,
      longitude,
      radius: radiusKm * 1000,
    });

    await startTracking();
    Alert.alert('Tracking started', `Alarm will ring within ${radiusKm} km`);
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

      <Pressable style={styles.button} onPress={onStart}>
        <ThemedText type="defaultSemiBold" style={styles.buttonText}>
          Start Alarm
        </ThemedText>
      </Pressable>
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
    marginTop: 35,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  buttonText: { color: '#fff' },
});
