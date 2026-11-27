import '../src/polyfills';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/data/auth/AuthProvider';
import { SyncProvider } from '../src/data/powersync/SyncProvider';
import { I18nProvider } from '../src/i18n';
import { ThemeProvider } from '../src/ui/theme';

// Provider order follows mobile.md 2.3: I18n, Theme, Auth, PowerSync. CurrentPet comes with the
// first pet feature.
export default function RootLayout() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <SyncProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }} />
          </SyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
