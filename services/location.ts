import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

export async function requestLocationOrFail() {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Location Required',
      'Please enable location to use Travel Alarm',
      [
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
    throw new Error('Location permission denied');
  }

  const enabled = await Location.hasServicesEnabledAsync();
  if (!enabled) {
    Alert.alert(
      'Turn on Location',
      'Please turn on GPS to continue',
      [
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
    throw new Error('Location services disabled');
  }
}
