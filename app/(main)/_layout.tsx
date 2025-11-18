import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="journey-log" 
        options={{ 
          headerShown: false,
          title: 'Journey Log'
        }} 
      />
      <Stack.Screen 
        name="new-entry" 
        options={{ 
          headerShown: false,
          title: 'New Entry'
        }} 
      />
      <Stack.Screen 
        name="entry-detail" 
        options={{ 
          headerShown: false,
          title: 'Entry Details'
        }} 
      />
    </Stack>
  );
}
