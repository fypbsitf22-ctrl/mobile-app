import { Stack } from 'expo-router';
// 1. Add this import (Make sure the path matches your folder)
import { ActivityProvider } from '../context/ActivityContext';

export default function RootLayout() {
  return (
    // 2. Wrap everything in the ActivityProvider
    <ActivityProvider> 
      <Stack screenOptions={{ headerShown: false }}>
        {/* Your existing screens stay here */}
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="role" />
        <Stack.Screen name="signup" />

        {/* Nested folders */}
        <Stack.Screen name="parent/main" />
        <Stack.Screen name="teacher/main" />

        {/* Other pages */}
        <Stack.Screen name="adminpanel" />
        <Stack.Screen name="forgetpassword" />
        <Stack.Screen name="parent/parentpanel" options={{ headerShown: false }} />
      </Stack>
    </ActivityProvider>
  );
}