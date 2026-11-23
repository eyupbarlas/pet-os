// Sign-in methods (ADR 0011): Apple and Google ID tokens, and an email code. All three are
// week-one checks on a real device (docs/week-one-checks.md); nothing here runs in CI.
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { config } from '../../config';
import { supabase } from './supabase';

export async function signInWithApple() {
  const rawNonce = Crypto.randomUUID();
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  const cred = await AppleAuthentication.signInAsync({
    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
    nonce: hashed,
  });
  if (!cred.identityToken) throw new Error('apple_no_identity_token');
  return supabase.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken, nonce: rawNonce });
}

export async function signInWithGoogle() {
  GoogleSignin.configure({ webClientId: config.googleWebClientId });
  await GoogleSignin.hasPlayServices();
  const res = await GoogleSignin.signIn();
  const idToken = res.data?.idToken;
  if (!idToken) throw new Error('google_no_id_token');
  return supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
}

export const requestEmailCode = (email: string) => supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
export const verifyEmailCode = (email: string, token: string) => supabase.auth.verifyOtp({ email, token, type: 'email' });
export const signOut = () => supabase.auth.signOut();
