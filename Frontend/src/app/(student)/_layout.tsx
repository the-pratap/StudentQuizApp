import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../theme/colors';

export default function StudentLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="exam/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="exam/quiz" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="exam/submitted" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="exam/result" options={{ headerShown: false }} />
    </Stack>
  );
}
