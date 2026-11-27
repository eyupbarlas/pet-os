import { useAuth } from '../../src/data/auth/AuthProvider';
import { useMembership } from '../../src/data/queries';
import { TodayScreen } from '../../src/features/today/TodayScreen';

export default function TodayTab() {
  const { session } = useAuth();
  const { membership } = useMembership(session?.user.id);
  // The tabs layout only renders tabs once a membership exists.
  return membership ? <TodayScreen membership={membership} /> : null;
}
