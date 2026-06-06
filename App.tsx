import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import TripScreen from './src/screens/TripScreen';
import ResultScreen from './src/screens/ResultScreen';
import { colors } from './src/theme';

export type RootStackParamList = {
  Home: undefined;
  Trip: undefined;
  Result: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.accent,
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'TaxiGuard' }} />
        <Stack.Screen name="Trip" component={TripScreen} options={{ title: 'Trip', headerBackVisible: false }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Result', headerBackVisible: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
