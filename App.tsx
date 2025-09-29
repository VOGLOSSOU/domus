import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/db/database';

export default function App() {
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDatabase();
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}
