import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens (we'll create them next)
import DashboardScreen from '../screens/DashboardScreen';
import HousesScreen from '../screens/HousesScreen';
import TenantsScreen from '../screens/TenantsScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
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
          headerStyle: {
            backgroundColor: '#2563eb',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
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
    </NavigationContainer>
  );
}