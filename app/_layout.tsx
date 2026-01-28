import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* The first screen to show is index (Splash) */}
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
    </Stack>
  );
}