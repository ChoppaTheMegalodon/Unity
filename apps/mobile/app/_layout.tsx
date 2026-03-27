import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: '#0F0F0F' },
          headerTintColor: '#FFFFFF',
          tabBarStyle: { backgroundColor: '#0F0F0F', borderTopColor: '#1F1F1F' },
          tabBarActiveTintColor: '#8B5CF6',
          tabBarInactiveTintColor: '#666',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Portfolio', tabBarLabel: 'Portfolio' }}
        />
        <Tabs.Screen
          name="browse"
          options={{ title: 'Browse', tabBarLabel: 'Browse' }}
        />
        <Tabs.Screen
          name="settings"
          options={{ title: 'Settings', tabBarLabel: 'Settings' }}
        />
      </Tabs>
    </>
  );
}
