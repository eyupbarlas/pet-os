// Target of invite links: https://healthypaw.app/i/<token> (universal / app link) and
// healthypaw://i/<token> (from the web landing). Saves the token, then the gate sends the person
// to sign-in or straight to the join screen.
import { useEffect } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { isInviteToken } from '../../src/features/household/inviteLink';
import { usePendingInvite } from '../../src/features/household/pendingInvite';

export default function InviteLink() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const set = usePendingInvite((s) => s.set);
  const pending = usePendingInvite((s) => s.token);
  const valid = isInviteToken(token);
  useEffect(() => { if (valid) set(token); }, [valid, token, set]);
  if (valid && pending !== token) return null; // one frame, until the store has it
  return <Redirect href={valid ? '/join' : '/'} />;
}
