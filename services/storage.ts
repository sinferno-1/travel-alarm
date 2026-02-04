import AsyncStorage from '@react-native-async-storage/async-storage';

export async function saveTrip(data: any) {
  await AsyncStorage.setItem('TRIP', JSON.stringify(data));
}

export async function loadTrip() {
  const v = await AsyncStorage.getItem('TRIP');
  return v ? JSON.parse(v) : null;
}
