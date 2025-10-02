import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { initDatabase } from './src/db/database';
import { AppProvider } from './src/context/AppContext';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import HousesScreen from './src/screens/HousesScreen';
import TenantsScreen from './src/screens/TenantsScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Houses') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'Tenants') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Payments') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen
        name="Houses"
        component={HousesScreen}
        options={{ title: 'Maisons' }}
      />
      <Tab.Screen
        name="Tenants"
        component={TenantsScreen}
        options={{ title: 'Locataires' }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{ title: 'Paiements' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Paramètres' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  React.useEffect(() => {
    // Initialize database on app start
    initDatabase().catch(console.error);
  }, []);

  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
