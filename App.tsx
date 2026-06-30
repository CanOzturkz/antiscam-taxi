import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import TripScreen from './src/screens/TripScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { colors, type } from './src/theme';
import { loadCachedConfig, refreshRemoteConfig } from './src/config/tariffConfig';

export type RootStackParamList = {
  Home: undefined;
  Trip: undefined;
  Result: undefined;
  History: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  // Açılışta: önce önbellekteki (daha önce indirilmiş) tarifeyi yükle,
  // sonra uzaktan güncel tarifeyi çek (varsa). Mağaza güncellemesi gerekmez.
  const [, setConfigTick] = useState(0);
  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadCachedConfig();
      if (mounted) setConfigTick((n) => n + 1);
      const updated = await refreshRemoteConfig();
      if (mounted && updated) setConfigTick((n) => n + 1);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.accent,
            headerTitleStyle: { ...type.bodyStrong, fontWeight: '800', color: colors.text },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'TaxiGuard' }} />
          <Stack.Screen name="Trip" component={TripScreen} options={{ title: 'Trip', headerBackVisible: false }} />
          <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Result', headerBackVisible: false }} />
          <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Trip History' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
