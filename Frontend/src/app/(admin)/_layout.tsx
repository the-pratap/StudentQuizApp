import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../theme/colors';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="create-exam" options={{ headerShown: false }} />
      <Stack.Screen name="edit-exam/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="manage-questions/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="manage-otp/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="exam-attempts/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
