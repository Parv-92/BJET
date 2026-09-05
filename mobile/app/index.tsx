/**
 * Bjet Mobile - Entry Index
 * Delegated to root RouteGuard which redirects to (tabs) or (auth)/login.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { LoadingSpinner } from '../src/components/ui/LoadingSpinner';
import { colors } from '../src/theme/colors';

export default function EntryIndex() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LoadingSpinner size="large" label="Loading Bjet..." />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
