import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nProvider } from '../src/i18n';
import { ThemeProvider } from '../src/ui/theme';

// Provider order follows mobile.md 2.3. Auth, PowerSync and CurrentPet providers are added with
// the first real feature (sign-in then Today); the data layer is in src/data.
export default function RootLayout() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </I18nProvider>
  );
}
