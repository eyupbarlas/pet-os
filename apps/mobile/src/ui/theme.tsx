import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { dark, light, type Theme } from '@petos/tokens';

const ThemeContext = createContext<Theme>(light);
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const scheme = useColorScheme();
  return <ThemeContext.Provider value={scheme === 'dark' ? dark : light}>{children}</ThemeContext.Provider>;
};
export const useTheme = () => useContext(ThemeContext);
