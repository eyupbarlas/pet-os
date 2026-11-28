// The invite token from a tapped link, kept until the person has signed in and decided
// (mobile.md 4.2: it must survive the sign-in app switch and a restart).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { isInviteToken } from '../../services/links/invite';

const KEY = 'pendingInviteToken';

interface PendingInvite {
  token: string | null;
  loaded: boolean;
  set: (token: string) => void;
  clear: () => void;
}

export const usePendingInvite = create<PendingInvite>((set) => ({
  token: null,
  loaded: false,
  set: (token) => {
    if (!isInviteToken(token)) return;
    set({ token, loaded: true });
    void AsyncStorage.setItem(KEY, token).catch(() => {});
  },
  clear: () => {
    set({ token: null, loaded: true });
    void AsyncStorage.removeItem(KEY).catch(() => {});
  },
}));

AsyncStorage.getItem(KEY)
  .then((v) => usePendingInvite.setState((s) => ({ token: s.token ?? (isInviteToken(v) ? v : null), loaded: true })))
  .catch(() => usePendingInvite.setState({ loaded: true }));
