import { Stack } from 'expo-router';

// Invited partner path: sign in, then the join confirmation. No pet creation (spec 001, PO M-3).
export default function JoinLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
