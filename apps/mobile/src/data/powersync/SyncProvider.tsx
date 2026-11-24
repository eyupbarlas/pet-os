import { useEffect, type ReactNode } from 'react';
import { PowerSyncContext } from '@powersync/react';
import { useAuth } from '../auth/AuthProvider';
import { connector, powerSync } from './system';

// Connects PowerSync while signed in. On sign-out the local copy is cleared (ADR 0017: no server
// data without an account) so the next person on the phone never sees it.
export function SyncProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const signedIn = Boolean(session);
  useEffect(() => {
    if (signedIn) {
      void powerSync.connect(connector);
    } else {
      void powerSync.disconnectAndClear();
    }
  }, [signedIn]);
  return <PowerSyncContext.Provider value={powerSync}>{children}</PowerSyncContext.Provider>;
}
