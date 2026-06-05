import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import TripScreen from './src/screens/TripScreen';
import ResultScreen from './src/screens/ResultScreen';

export type RootStackParamList = {
  Home: undefined;
  Trip: { startLat: number; startLon: number; destination: string };
  Result: { distanceKm: number; durationMin: number; estimatedFare: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#16213e' },
          headerTintColor: '#F5A623',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'TaksiGüvenli' }} />
        <Stack.Screen name="Trip" component={TripScreen} options={{ title: 'Yolculuk', headerBackVisible: false }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Sonuç', headerBackVisible: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
