import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </I18nextProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
