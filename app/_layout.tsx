import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityProvider } from '../context/ActivityContext';

// This handles how notifications look when the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // This listener handles the CLICK on a notification
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { url?: string };
      
      console.log("Notification Clicked. Data:", data);

      // --- THE FIX FOR "UNMATCHED ROUTE" ---
      if (data?.url) {
        // If the notification tells us where to go, go there
        router.push(data.url as any);
      } else {
        // SAFETY NET: If the notification has NO URL, go to this default path 
        // instead of showing the black error screen.
        router.push('/parent/notifications' as any);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <ActivityProvider> 
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="role" />
        <Stack.Screen name="signup" />
        
        {/* These screens MUST exist in your app folder */}
        <Stack.Screen name="parent/notifications" />
        <Stack.Screen name="teacher/notifications" />
        
        <Stack.Screen name="parent/main" />
        <Stack.Screen name="teacher/main" />
        <Stack.Screen name="adminpanel" />
        <Stack.Screen name="forgetpassword" />
        <Stack.Screen name="parent/parentpanel" />
      </Stack>
    </ActivityProvider>
  );
}