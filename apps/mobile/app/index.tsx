import { Redirect } from 'expo-router';
import { useAuth } from '../src/data/auth/AuthProvider';
import { usePendingInvite } from '../src/features/join/pendingInvite';

// Entry: send the person where they belong. The (app) layout handles households and invites.
export default function Index() {
  const { session, loading } = useAuth();
  const { token, loaded } = usePendingInvite();
  if (loading || !loaded) return null;
  if (!session) return <Redirect href={token ? '/join-account' : '/welcome'} />;
  return <Redirect href={token ? '/confirm' : '/today'} />;
}
