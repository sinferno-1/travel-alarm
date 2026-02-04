import * as Notifications from 'expo-notifications';

export async function setupAlarmActions() {
  await Notifications.setNotificationCategoryAsync('ALARM', [
    {
      identifier: 'STOP',
      buttonTitle: 'Stop',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'SNOOZE',
      buttonTitle: 'Snooze 5 min',
      options: { opensAppToForeground: false },
    },
  ]);
}

export async function showAlarmNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚍 You’ve arrived!',
      body: 'You are near your destination',
      sound: 'default',
      categoryIdentifier: 'ALARM',
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: null,
  });
}
