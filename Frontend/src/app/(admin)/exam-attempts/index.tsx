import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../../theme/colors';

export default function ExamAttemptsIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(admin)/(tabs)/results' as any);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
