import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { stopAlarm } from '../services/alarm';
import { startTracking, stopTracking } from '../services/background';
import { Slot } from 'expo-router';

export default function RootLayout() {

  useEffect(() => {
    const sub =
      Notifications.addNotificationResponseReceivedListener(
        async (response) => {
          const action = response.actionIdentifier;

          if (action === 'STOP') {
            await stopAlarm();
            await stopTracking();
          }

          if (action === 'SNOOZE') {
            await stopAlarm();
            await stopTracking();

            setTimeout(() => {
              startTracking();
            }, 5 * 60 * 1000);
          }
        }
      );

    return () => sub.remove();
  }, []);

  return <Slot />;
}
